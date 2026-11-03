// A local stand-in for the Claude Messages API, for the helper's tests only (spec 013 T005). It
// speaks the streaming events from scripted responses and records every request, so tests can
// check what the helper sent without a key or a network. The SDK reaches it through `baseURL`.
//
//   const svc = await startFakeService();
//   svc.script(reply([thinking("…"), text("Hi."), toolUse("snapshot_project", {})], { stop_reason: "tool_use" }));
//   … svc.requests[0].body …
//   await svc.close();
//
// Scripted entries, consumed one per HTTP request (the SDK's own retries consume one each):
//   reply(content, opts)            a streamed message; opts: stop_reason, stop_details, model, usage,
//                                   input_transformations, delayMs (before headers), hang (never answer)
//   failure(status, type, message)  a JSON error with that status (401, 403, 429, 529, billing …)
//   drop(content, afterBlocks)      streams the first blocks, then cuts the connection
//   errorEvent(type, content)       streams the blocks, then an SSE `error` event
// An unscripted request gets a 500 the SDK won't retry, so a missing script fails loudly.

import http from "node:http";

let ids = 0;
const nextId = (prefix) => `${prefix}_fake_${++ids}`;

// ---------- content blocks ----------

export const text = (t) => ({ type: "text", text: t });
export const thinking = (t, signature) => ({ type: "thinking", thinking: t || "", signature: signature || `sig_${++ids}` });
export const toolUse = (name, input, id) => ({ type: "tool_use", id: id || nextId("toolu"), name, input: input || {} });
export const fallbackBlock = (from, to) => ({ type: "fallback", from: { model: from }, to: { model: to } });

// ---------- scripted entries ----------

const DEFAULT_USAGE = { input_tokens: 1000, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: 50 };

export function reply(content, opts = {}) {
  return { kind: "reply", content, ...opts };
}
export function failure(status, type, message, headers) {
  return { kind: "failure", status, type, message: message || type, headers: headers || {} };
}
export function drop(content, afterBlocks) {
  return { kind: "drop", content, afterBlocks: afterBlocks || 0 };
}
export function errorEvent(type, content) {
  return { kind: "error_event", type, content: content || [] };
}

// ---------- SSE ----------

function sse(event, data) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function chunks(s, size) {
  const out = [];
  for (let i = 0; i < s.length; i += size) out.push(s.slice(i, i + size));
  return out.length ? out : [""];
}

// → the SSE strings for one block at `index`.
function blockEvents(block, index) {
  const out = [];
  if (block.type === "text") {
    out.push(sse("content_block_start", { type: "content_block_start", index, content_block: { type: "text", text: "" } }));
    for (const c of chunks(block.text, 8)) out.push(sse("content_block_delta", { type: "content_block_delta", index, delta: { type: "text_delta", text: c } }));
  } else if (block.type === "thinking") {
    out.push(sse("content_block_start", { type: "content_block_start", index, content_block: { type: "thinking", thinking: "", signature: "" } }));
    if (block.thinking) out.push(sse("content_block_delta", { type: "content_block_delta", index, delta: { type: "thinking_delta", thinking: block.thinking } }));
    out.push(sse("content_block_delta", { type: "content_block_delta", index, delta: { type: "signature_delta", signature: block.signature } }));
  } else if (block.type === "tool_use") {
    out.push(sse("content_block_start", { type: "content_block_start", index, content_block: { type: "tool_use", id: block.id, name: block.name, input: {} } }));
    const json = JSON.stringify(block.input);
    const half = Math.ceil(json.length / 2);
    for (const part of [json.slice(0, half), json.slice(half)]) {
      if (part) out.push(sse("content_block_delta", { type: "content_block_delta", index, delta: { type: "input_json_delta", partial_json: part } }));
    }
  } else {
    out.push(sse("content_block_start", { type: "content_block_start", index, content_block: block }));
  }
  out.push(sse("content_block_stop", { type: "content_block_stop", index }));
  return out;
}

function messageStart(entry, model) {
  const usage = { ...DEFAULT_USAGE, ...(entry.usage || {}) };
  return sse("message_start", {
    type: "message_start",
    message: {
      id: nextId("msg"),
      type: "message",
      role: "assistant",
      model,
      content: [],
      stop_reason: null,
      stop_sequence: null,
      ...(entry.input_transformations ? { input_transformations: entry.input_transformations } : {}),
      usage: {
        input_tokens: usage.input_tokens,
        cache_creation_input_tokens: usage.cache_creation_input_tokens,
        cache_read_input_tokens: usage.cache_read_input_tokens,
        output_tokens: 1,
      },
    },
  });
}

function messageEnd(entry) {
  const usage = { ...DEFAULT_USAGE, ...(entry.usage || {}) };
  const deltaUsage = { output_tokens: usage.output_tokens };
  if (usage.iterations) deltaUsage.iterations = usage.iterations;
  return [
    sse("message_delta", {
      type: "message_delta",
      delta: { stop_reason: entry.stop_reason || "end_turn", stop_sequence: null, stop_details: entry.stop_details || null },
      usage: deltaUsage,
    }),
    sse("message_stop", { type: "message_stop" }),
  ];
}

// ---------- request checks ----------

export const BETA = Object.freeze({
  binding: "thinking-binding-controls-2026-08-01",
  fallback: "server-side-fallback-2026-07-01",
  updates: "thinking-display-updates-2026-08-18",
  toolChanges: "mid-conversation-tool-changes-2026-07-01",
});

// The models the reference lists for tool-change blocks, of those the helper can be set to.
const TOOL_CHANGE_MODELS = new Set(["claude-opus-5-5", "claude-sonnet-5-5"]);

// → a reason the real service refuses the request's tool list or tool-change blocks, or null.
// Live (T060, 2026-11-03): a list with every tool deferred is refused; a tool declared without
// defer_loading can come back once it's been removed. From the reference: the beta, the model
// list, and that an added tool must be declared and, otherwise, deferred.
function invalidToolChange(body, msgs, betas) {
  const tools = Array.isArray(body.tools) ? body.tools : [];
  if (tools.length && tools.every((t) => t.defer_loading)) return "tools: At least one tool must have defer_loading=false. All tools cannot be deferred.";
  const byName = new Map(tools.map((t) => [t.name, t]));
  const removed = new Set();
  for (let i = 0; i < msgs.length; i++) {
    if (msgs[i].role !== "system" || !Array.isArray(msgs[i].content)) continue;
    for (const b of msgs[i].content) {
      if (!b || (b.type !== "tool_addition" && b.type !== "tool_removal")) continue;
      if (!betas.has(BETA.toolChanges)) return `messages.${i}: ${b.type} needs the beta ${BETA.toolChanges}`;
      if (!TOOL_CHANGE_MODELS.has(body.model)) return `messages.${i}: ${b.type} isn't supported on this model`;
      const name = b.tool && b.tool.type === "tool_reference" ? b.tool.name : null;
      if (!byName.has(name)) return `messages.${i}: ${b.type} names a tool that isn't declared`;
      if (b.type === "tool_removal") removed.add(name);
      else if (!byName.get(name).defer_loading && !removed.has(name)) return `messages.${i}: an added tool must be declared with defer_loading`;
    }
  }
  return null;
}

// → a reason the real service would answer 400, or null. From the claude-api reference:
// a mid-conversation system message must follow a user message and be the last message or be
// followed by an assistant turn; user and assistant turns alternate (system messages aside: two
// user messages in a row are refused, shared/error-codes.md); every tool_use is answered by a
// tool_result in the next user message; block_binding needs its beta; fallbacks "default" needs
// server-side-fallback-2026-07-01; display "updates" needs its beta. System right after system is
// refused here though the live service took it (T060): the helper only ever sends one.
export function invalidRequest(body, betaHeader) {
  if (!body || typeof body !== "object") return null;
  const betas = new Set(String(betaHeader || "").split(",").map((b) => b.trim()).filter(Boolean));
  const msgs = Array.isArray(body.messages) ? body.messages : [];
  for (let i = 0; i < msgs.length; i++) {
    if (msgs[i].role !== "system") continue;
    if (i === 0) return `messages.${i}: a system message can't be first`;
    if (msgs[i - 1].role !== "user") return `messages.${i}: a system message must follow a user message`;
    if (i + 1 < msgs.length && msgs[i + 1].role !== "assistant") return `messages.${i + 1}: a system message must be last or followed by an assistant turn`;
  }
  // The conversation without its system messages: roles alternate, and each tool_use is answered.
  const turns = msgs.map((m, i) => ({ m, i })).filter(({ m }) => m.role !== "system");
  const blocks = (m) => (Array.isArray(m.content) ? m.content : []);
  for (let k = 0; k < turns.length; k++) {
    const { m, i } = turns[k];
    const next = turns[k + 1];
    if (next && next.m.role === m.role) return `messages.${next.i}: roles must alternate (two ${m.role} messages in a row)`;
    if (m.role !== "assistant") continue;
    const ids = blocks(m).filter((b) => b && b.type === "tool_use").map((b) => b.id);
    if (!ids.length) continue;
    const answered = new Set(next && next.m.role === "user" ? blocks(next.m).filter((b) => b && b.type === "tool_result").map((b) => b.tool_use_id) : []);
    for (const id of ids) if (!answered.has(id)) return `messages.${i}: tool_use ${id} has no tool_result in the next user message`;
  }
  const toolProblem = invalidToolChange(body, msgs, betas);
  if (toolProblem) return toolProblem;
  const t = body.thinking || {};
  if (t.block_binding && !betas.has(BETA.binding)) return "thinking.block_binding: Extra inputs are not permitted";
  if (t.block_binding && !["error", "drop_block"].includes(t.block_binding.prefix_mismatch_behavior)) return "thinking.block_binding.prefix_mismatch_behavior: bad value";
  if (t.display === "updates" && !betas.has(BETA.updates)) return "thinking.display: unknown value updates";
  if (body.fallbacks !== undefined && !betas.has(BETA.fallback)) return "fallbacks: Extra inputs are not permitted";
  return null;
}

// ---------- server ----------

// A key that looks real (a full-length sk-ant- key) is recorded redacted, never its value; the
// short stand-in keys tests use are kept so a test can check which key was sent.
const REAL_LOOKING_KEY = /sk-ant-[A-Za-z0-9_-]{40,}/g;
export const redactKey = (v) => (typeof v === "string" ? v.replace(REAL_LOOKING_KEY, "[redacted]") : v);

export async function startFakeService(opts = {}) {
  const defaultModel = opts.model || "claude-opus-5-5";
  const queue = [];
  const requests = [];
  const rejected = [];
  const open = new Set();
  const timers = new Set();

  const server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      let body = null;
      try {
        body = raw ? JSON.parse(raw) : null;
      } catch {
        body = raw;
      }
      const path = req.url.split("?")[0];
      requests.push({
        method: req.method,
        path,
        headers: {
          "anthropic-beta": req.headers["anthropic-beta"] || null,
          "anthropic-version": req.headers["anthropic-version"] || null,
          authorization: redactKey(req.headers.authorization || null),
          "x-api-key": redactKey(req.headers["x-api-key"] || null),
        },
        body,
        raw,
      });
      handle(req, res, path, body);
    });
  });

  function sendJsonError(res, status, type, message, headers) {
    res.writeHead(status, { "content-type": "application/json", "request-id": nextId("req"), ...headers });
    res.end(JSON.stringify({ type: "error", error: { type, message }, request_id: nextId("req") }));
  }

  function later(ms, fn) {
    const t = setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
  }

  function handle(req, res, path, body) {
    if (req.method === "GET" && path.startsWith("/v1/models/")) {
      const head = queue[0];
      if (head && head.forModels) {
        queue.shift();
        if (head.kind === "failure") return sendJsonError(res, head.status, head.type, head.message, head.headers);
      }
      const id = decodeURIComponent(path.slice("/v1/models/".length));
      res.writeHead(200, { "content-type": "application/json", "request-id": nextId("req") });
      return res.end(JSON.stringify({ type: "model", id, display_name: id, created_at: "2026-01-01T00:00:00Z" }));
    }
    if (req.method !== "POST" || !path.startsWith("/v1/messages")) {
      return sendJsonError(res, 404, "not_found_error", `fake service: no route ${req.method} ${path}`, { "x-should-retry": "false" });
    }
    // What the claude-api reference says the real service refuses with a 400, checked before any
    // scripted entry is used (the entry stays for the next request).
    const problem = invalidRequest(body, req.headers["anthropic-beta"]);
    if (problem) {
      rejected.push(problem);
      return sendJsonError(res, 400, "invalid_request_error", problem);
    }
    const entry = queue.shift();
    if (!entry) return sendJsonError(res, 500, "api_error", "fake service: no scripted response", { "x-should-retry": "false" });
    if (entry.kind === "failure") return sendJsonError(res, entry.status, entry.type, entry.message, entry.headers);
    if (entry.hang) return; // never answers; closed by close()

    const model = entry.model || (body && body.model) || defaultModel;
    const go = () => {
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", "request-id": nextId("req") });
      const parts = [messageStart(entry, model)];
      const content = entry.content || [];
      if (entry.kind === "drop") {
        content.slice(0, entry.afterBlocks).forEach((b, i) => parts.push(...blockEvents(b, i)));
        res.write(parts.join(""));
        // Let the client read what was sent, then cut the connection mid-answer.
        return later(20, () => res.socket && res.socket.destroy());
      }
      content.forEach((b, i) => parts.push(...blockEvents(b, i)));
      if (entry.kind === "error_event") {
        parts.push(sse("error", { type: "error", error: { type: entry.type, message: entry.type } }));
        res.write(parts.join(""));
        return res.end();
      }
      parts.push(...messageEnd(entry));
      res.write(parts.join(""));
      res.end();
    };
    if (entry.delayMs) later(entry.delayMs, go);
    else go();
  }

  server.on("connection", (s) => {
    open.add(s);
    s.on("close", () => open.delete(s));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();

  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    // The message requests only (not key checks), in order.
    get messageRequests() {
      return requests.filter((r) => r.method === "POST" && r.path.startsWith("/v1/messages"));
    },
    // The 400s the fake gave for invalid requests, in order (each one's reason).
    rejected,
    script(...entries) {
      queue.push(...entries);
      return this;
    },
    pending: () => queue.length,
    async close() {
      for (const t of timers) clearTimeout(t);
      for (const s of open) s.destroy();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}
