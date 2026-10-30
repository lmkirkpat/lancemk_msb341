// One lesson's agent loop on the Claude API (spec 013 FR-005 to FR-008, FR-014, FR-015, FR-022,
// FR-025, FR-029; research R5 to R10). A turn is up to max_steps streamed requests; between them
// the helper runs the tools the active skill allows through ae-mentor and sends the results back
// whole. The history is append-only: every block the service returns (thinking included) goes
// back exactly as received. A failed turn is taken back off the end of the history, so a retry
// never sends half an answer; nothing earlier is ever changed. Holds no teaching logic.
//
// Events go out through emit(type, payload): text_delta, text, tool_call, tool_result,
// skill_loaded (contracts/helper-protocol.md). Thinking blocks produce none. Errors are returned
// as the turn's error kind; main.mjs sends the error and turn_end events.

import Anthropic from "@anthropic-ai/sdk";
import { classify, isNetworkError } from "./errors.mjs";
import { costOf, sumCosts, tokensOf, addTokens, ZERO_TOKENS } from "./cost.mjs";
import { buildLessonPrompt, buildTools, promptHash, userContent, skillSystemMessage, withBreakpoint, SKILL_TOOL } from "./prompt.mjs";
import { readSkill, commandOf } from "./skills.mjs";

export const BETAS = Object.freeze({
  updates: "thinking-display-updates-2026-08-18",
  fallback: "server-side-fallback-2026-07-01",
  binding: "thinking-binding-controls-2026-08-01",
});

// Fixed texts the model sees in tool results the runtime itself answers.
export const NOT_AVAILABLE = "That tool isn't available in this lesson.";
export const NO_SUCH_SKILL = "That skill isn't available.";
export const loadedText = (name, args) => (args ? `Loaded ${name}. Arguments: ${args}` : `Loaded ${name}.`);

// The SDK client: an explicit key (never the environment), 2 retries on 429, 5xx and connection
// errors (research R3), each request bounded by the turn timeout.
export function createClient({ apiKey, baseURL, timeoutMs }) {
  return new Anthropic({ apiKey, ...(baseURL ? { baseURL } : {}), maxRetries: 2, timeout: timeoutMs });
}

// After a mid-output server-side fallback, only the text before the last fallback marker goes back
// (the claude-api reference's echo rule): thinking and tool calls from the declined attempt don't.
export function echoContent(content) {
  let boundary = -1;
  content.forEach((b, i) => {
    if (b && b.type === "fallback") boundary = i;
  });
  if (boundary < 0) return content;
  return content.filter((b, i) => i >= boundary || b.type === "text" || b.type === "fallback");
}

// MCP content → the Messages API's tool result content, whole: text and images as returned.
export function toApiContent(mcpContent) {
  return mcpContent.map((c) => {
    if (c && c.type === "text") return { type: "text", text: String(c.text) };
    if (c && c.type === "image") return { type: "image", source: { type: "base64", media_type: c.mimeType || "image/png", data: c.data } };
    return { type: "text", text: JSON.stringify(c) };
  });
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

// The adapter's tool_result payload, built as panel/lib/stream.js builds it for B1.
export function toolResultEvent(id, name, mcpResult) {
  const parts = mcpResult.content.filter((c) => c && c.type === "text").map((c) => String(c.text));
  const text = parts.join("\n");
  const images = mcpResult.content.filter((c) => c && c.type === "image" && c.data).map((c) => ({ data: c.data, mimeType: c.mimeType || "image/png" }));
  const ev = { id, name, ok: !mcpResult.isError, text, images };
  for (const p of [text, ...parts]) {
    const j = parseJson(p);
    if (j !== undefined) {
      ev.json = j;
      break;
    }
  }
  return ev;
}

class TurnAbort extends Error {
  constructor(kind) {
    super(kind);
    this.kind = kind;
  }
}

// opts: { getClient: async () => client | null, mcp, settings, prices, preamble, skillTool,
//         skillsDir, requestLog, log, now }
export function createLesson(opts) {
  const { mcp, settings, prices, preamble, skillTool, skillsDir } = opts;
  const log = opts.log || (() => {});
  const requestLog = opts.requestLog || { append() {} };
  const now = opts.now || Date.now;

  const messages = [];
  let server = null; // the first { instructions, tools } this lesson saw; kept for the lesson
  let prompt = null; // { tools, allowed, system, skillName, prompt_hash }
  let handedOver = false; // the tool list changed after the first request
  // A handed-over skill's body waiting to go in as a mid-conversation system message. The service
  // takes one only right after a user message, as the last message or followed by an assistant
  // turn, so it goes in just before a request whose history ends with a user message, and stays
  // only once an assistant turn follows it.
  let pendingBody = null;
  let turnNo = 0;

  function tryReadSkill(name) {
    try {
      return readSkill(skillsDir, name);
    } catch (e) {
      log({ event: "skill_not_loaded", code: e.code || "error" });
      return null;
    }
  }

  // The hand-over (R5): the new skill's tools from now on; the top-level system prompt stays as it
  // was (the body arrives as a mid-conversation system message), so nothing earlier changes.
  function switchTo(skill) {
    const { tools, allowed } = buildTools(server.tools, skill.allowedTools, skillTool);
    const system = prompt.system;
    prompt = {
      tools,
      allowed,
      system,
      skillName: skill.name,
      prompt_hash: promptHash({ tools, system, placement: settings.skill_placement, skillName: skill.name, skillBody: skill.body }),
    };
    handedOver = true;
  }

  function requestParams() {
    // Every request opts into the history check (preserved thinking), so an edited history fails
    // here on any account, not only on accounts made after 2026-08-31 (every learner's): "error"
    // while the history must be intact, "drop_block" once a hand-over has changed the tool list,
    // which invalidates the thinking blocks from before it (the claude-api reference, Breaking
    // change 3). The beta also makes each response list what it dropped (input_transformations).
    const betas = [BETAS.binding];
    const thinking = {
      type: "adaptive",
      display: settings.thinking_display,
      block_binding: { prefix_mismatch_behavior: handedOver ? "drop_block" : "error" },
    };
    if (settings.thinking_display === "updates") betas.push(BETAS.updates);
    const params = {
      model: settings.model,
      max_tokens: settings.max_tokens,
      system: prompt.system,
      ...(prompt.tools.length ? { tools: prompt.tools } : {}),
      messages: withBreakpoint(messages, settings.cache_ttl),
      thinking,
      output_config: { effort: settings.effort },
    };
    if (settings.fallbacks) {
      params.fallbacks = settings.fallbacks;
      betas.push(BETAS.fallback);
    }
    return { params, betas };
  }

  // What the service changed in what it was sent (dropped thinking blocks), for the helper log:
  // type, reason and path only, never any text. An empty list isn't logged.
  function logTransformations(message, stepNo) {
    const list = message && Array.isArray(message.input_transformations) ? message.input_transformations : [];
    if (!list.length) return;
    const str = (v) => (typeof v === "string" ? v.slice(0, 80) : null);
    log({ event: "input_transformations", turn: turnNo, step: stepNo, entries: list.map((t) => ({ type: str(t && t.type), reason: str(t && t.reason), path: str(t && t.path) })) });
  }

  // Puts a waiting skill body in, if the history ends with a user message. → whether it did.
  function placePendingBody() {
    if (pendingBody === null || !messages.length || messages[messages.length - 1].role !== "user") return false;
    messages.push(skillSystemMessage(pendingBody));
    pendingBody = null;
    return true;
  }

  // One streamed request. Emits text_delta and text as blocks arrive. → { message } or
  // throws { err, started } (started: the service had begun answering, so the cost is unknown).
  async function step(client, signal, emit) {
    const { params, betas } = requestParams();
    requestLog.append(params, { turn: turnNo, betas });
    let started = false;
    const stream = client.beta.messages.stream({ ...params, betas }, { signal });
    stream.on("streamEvent", (ev, snapshot) => {
      if (ev.type === "message_start") started = true;
      else if (ev.type === "content_block_delta" && ev.delta && ev.delta.type === "text_delta" && ev.delta.text) {
        emit("text_delta", { text: ev.delta.text });
      } else if (ev.type === "content_block_stop") {
        const b = snapshot && snapshot.content[ev.index];
        if (!b) return;
        if (b.type === "text" && b.text) emit("text", { text: b.text });
        // tool_call waits for the whole answer (runTurn): a later fallback marker can show the
        // call came from a declined attempt that will never run.
      }
    });
    try {
      const message = await stream.finalMessage();
      return { message };
    } catch (err) {
      throw { err, started };
    }
  }

  // → { content (API tool result content), isError }
  async function runTool(use, race, emit, pendingHandOver) {
    if (use.name === SKILL_TOOL && prompt.allowed.has(SKILL_TOOL)) {
      const input = use.input || {};
      const name = String(input.skill || "").trim().replace(/^\//, "");
      const args = typeof input.args === "string" ? input.args.trim() : "";
      const skill = tryReadSkill(name);
      if (!skill) return { content: [{ type: "text", text: NO_SUCH_SKILL }], isError: true };
      pendingHandOver.skill = skill;
      return { content: [{ type: "text", text: loadedText(skill.name, args) }], isError: false };
    }
    if (!prompt.allowed.has(use.name)) {
      log({ event: "tool_not_allowed", name: String(use.name).slice(0, 80) });
      const r = { content: [{ type: "text", text: NOT_AVAILABLE }], isError: true };
      emit("tool_result", toolResultEvent(use.id, use.name, r));
      return { content: toApiContent(r.content), isError: true };
    }
    let r;
    try {
      r = await race(mcp.callTool(use.name, use.input || {}));
    } catch (e) {
      if (e instanceof TurnAbort) throw e;
      log({ event: "server_failed", code: e.code || "error" });
      throw new TurnAbort("start_failed");
    }
    emit("tool_result", toolResultEvent(use.id, use.name, r));
    return { content: toApiContent(r.content), isError: r.isError };
  }

  // One turn. → { ok, error_kind, cost_usd, tokens, model, other_model, steps, skill, prompt_hash }
  async function runTurn(text, emit) {
    turnNo++;
    const mark = { len: messages.length, prompt, handedOver, pendingBody };
    const ctl = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      ctl.abort();
    }, settings.turn_timeout_ms);
    // One shared "timed out" promise, already handled, so a timer that fires after a race has
    // settled never leaves an unhandled rejection behind.
    const timedOutP = new Promise((resolve) => ctl.signal.addEventListener("abort", resolve, { once: true })).then(() => {
      throw new TurnAbort("timeout");
    });
    timedOutP.catch(() => {});
    const race = (p) => Promise.race([p, timedOutP]);

    const costs = [];
    let tokens = { ...ZERO_TOKENS };
    let model = null;
    let otherModel = false;
    let steps = 0;

    const summary = (ok, errorKind) => ({
      ok,
      error_kind: errorKind || null,
      cost_usd: sumCosts(costs),
      tokens,
      model: model || settings.model,
      other_model: otherModel,
      steps,
      skill: prompt ? prompt.skillName : null,
      prompt_hash: prompt ? prompt.prompt_hash : null,
    });
    // A failed turn comes off the end of the history, and the lesson's prompt goes back to what it
    // was, so the next request continues from the last complete exchange.
    const fail = (kind, keepHistory) => {
      if (!keepHistory) {
        messages.length = mark.len;
        prompt = mark.prompt;
        handedOver = mark.handedOver;
        pendingBody = mark.pendingBody;
      }
      return summary(false, kind);
    };

    try {
      const client = await opts.getClient();
      if (!client) return fail("not_signed_in");

      let srv;
      try {
        srv = await race(mcp.start());
      } catch (e) {
        if (e instanceof TurnAbort) throw e;
        log({ event: "server_failed", code: e.code || "error" });
        return fail("start_failed");
      }
      if (!server) server = srv;

      // The skill: a message that starts with a mentor skill's command loads it (FR-002). The
      // text itself goes to the model unchanged.
      const cmd = commandOf(text);
      let bodyAhead = null;
      if (!prompt) {
        const skill = cmd ? tryReadSkill(cmd.name) : null;
        prompt = buildLessonPrompt({ preamble, instructions: server.instructions, serverTools: server.tools, skill, skillTool, settings });
        if (skill && settings.skill_placement === "message") bodyAhead = skill.body;
      } else if (cmd && cmd.name !== prompt.skillName) {
        const skill = tryReadSkill(cmd.name);
        if (skill) {
          switchTo(skill);
          pendingBody = skill.body;
          emit("skill_loaded", { skill: skill.name });
        }
      }
      messages.push({ role: "user", content: userContent(text, bodyAhead) });

      for (steps = 1; steps <= settings.max_steps; steps++) {
        const placed = placePendingBody();
        let message;
        try {
          ({ message } = await step(client, ctl.signal, emit));
        } catch (thrown) {
          if (timedOut) throw new TurnAbort("timeout");
          const err = thrown && thrown.err !== undefined ? thrown.err : thrown;
          if (thrown && thrown.started) costs.push(null); // billed, but the counts never came
          const kind = classify(err);
          // The service's own words help the builder find a rejected request; the log line is
          // scrubbed of the key (main.mjs), and nothing from it reaches the learner (FR-021, FR-027).
          const detail = err && err.error && err.error.error && typeof err.error.error.message === "string" ? err.error.error.message.slice(0, 300) : null;
          if (!(err instanceof Anthropic.APIError) && !isNetworkError(err)) {
            log({ event: "internal_error", name: (err && err.constructor && err.constructor.name) || typeof err, detail: String((err && err.message) || err).slice(0, 300) });
          } else {
            log({ event: "service_error", kind, status: (err && err.status) || null, type: (err && err.type) || null, detail });
          }
          return fail(kind);
        }
        if (timedOut) throw new TurnAbort("timeout");

        logTransformations(message, steps);
        model = message.model;
        if (message.model !== settings.model) otherModel = true;
        costs.push(costOf({ model: message.model, usage: message.usage }, prices, settings.cache_ttl));
        tokens = addTokens(tokens, tokensOf(message.usage));

        if (message.stop_reason === "refusal") {
          const d = message.stop_details;
          log({ event: "refused", category: (d && typeof d.category === "string" ? d.category : null) });
          return fail("refused");
        }

        const content = echoContent(JSON.parse(JSON.stringify(message.content || [])));
        if (content.length) messages.push({ role: "assistant", content });
        else if (placed) {
          // Nothing followed the body, so it can't stay last before the next user message: take it
          // back off the end (no thinking block was made after it) and let it wait again.
          pendingBody = messages.pop().content[0].text;
        }
        const uses = content.filter((b) => b.type === "tool_use");

        // The calls that will run, each with its input (as B1's adapter sends them). Calls from an
        // attempt declined before a fallback, a refusal or a cut-off answer are never shown.
        if (!(uses.length && message.stop_reason === "max_tokens")) {
          for (const u of uses) if (u.name !== SKILL_TOOL) emit("tool_call", { id: u.id, name: u.name, input: u.input });
        }
        if (uses.length && message.stop_reason === "max_tokens") {
          log({ event: "cut_off" }); // a call cut off mid-input is never run
          return fail(null);
        }
        if (message.stop_reason === "pause_turn") continue;
        if (!uses.length) {
          clearTimeout(timer);
          return summary(true, null);
        }

        const pendingHandOver = {};
        const results = [];
        for (const use of uses) {
          const r = await runTool(use, race, emit, pendingHandOver);
          results.push({ type: "tool_result", tool_use_id: use.id, content: r.content, ...(r.isError ? { is_error: true } : {}) });
        }
        messages.push({ role: "user", content: results });
        if (pendingHandOver.skill) {
          pendingBody = pendingHandOver.skill.body;
          switchTo(pendingHandOver.skill);
          emit("skill_loaded", { skill: pendingHandOver.skill.name });
        }
      }
      // The step limit: as B1's --max-turns, the turn ends without an answer and no error. Every
      // call made has its result in the history, so the lesson can go on from here.
      steps = settings.max_steps;
      log({ event: "step_limit", steps });
      clearTimeout(timer);
      return fail(null, true);
    } catch (e) {
      if (e instanceof TurnAbort) return fail(e.kind);
      log({ event: "turn_failed", detail: String((e && e.message) || e).slice(0, 200) });
      return fail(timedOut ? "timeout" : "start_failed");
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    runTurn,
    // For tests and the conversation file (T043): the history exactly as it will next be sent.
    get messages() {
      return messages;
    },
    get skill() {
      return prompt ? prompt.skillName : null;
    },
    get promptHash() {
      return prompt ? prompt.prompt_hash : null;
    },
  };
}
