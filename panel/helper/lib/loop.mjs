// One lesson's agent loop on the Claude API (spec 013 FR-005 to FR-008, FR-014, FR-015, FR-022,
// FR-025, FR-029; research R5 to R10). A turn is up to max_steps streamed requests; between them
// the helper runs the tools the active skill allows through ae-mentor and sends the results back
// whole. The history is append-only: every block the service returns (thinking included) goes
// back exactly as received. A failed turn keeps every complete exchange it made and takes back only
// the incomplete tail after the last one (FR-015, D1), so a retry never sends half an answer and a
// demonstration that ran stays in the history; if nothing completed, the learner's message comes
// off too. Nothing earlier is ever changed. Holds no teaching logic.
//
// Events go out through emit(type, payload): text_delta, text, tool_call, tool_result,
// skill_loaded (contracts/helper-protocol.md). Thinking blocks produce none. Errors are returned
// as the turn's error kind; main.mjs sends the error and turn_end events.

import Anthropic from "@anthropic-ai/sdk";
import { classify, isNetworkError } from "./errors.mjs";
import { stallFetch, isStall } from "./stall.mjs";
import { costOf, sumCosts, tokensOf, addTokens, ZERO_TOKENS } from "./cost.mjs";
import { buildLessonPrompt, buildTools, promptHash, toolChangeBlocks, userContent, skillSystemMessage, withBreakpoint, SKILL_TOOL } from "./prompt.mjs";
import { readSkill, commandOf } from "./skills.mjs";

export const BETAS = Object.freeze({
  updates: "thinking-display-updates-2026-08-18",
  fallback: "server-side-fallback-2026-07-01",
  binding: "thinking-binding-controls-2026-08-01",
  toolChanges: "mid-conversation-tool-changes-2026-07-01",
});

// Fixed texts the model sees in tool results the runtime itself answers.
export const NOT_AVAILABLE = "That tool isn't available in this lesson.";
export const NO_SUCH_SKILL = "That skill isn't available.";
// A call that didn't run because the turn failed after an earlier call in the same answer ran
// (FR-012 item 6, FR-015, spec resolved question 7).
export const DIDNT_RUN = "That call didn't run.";
// A call that was still running when the turn failed: sent to ae-mentor, so AE may have changed
// (builder's decision on review S1, 2026-10-30; approved runtime text, FR-012).
export const NOT_FINISHED = "That call didn't finish, so it may or may not have changed the project.";
export const loadedText = (name, args) => (args ? `Loaded ${name}. Arguments: ${args}` : `Loaded ${name}.`);

// How long a request may go without headers, and an answer without a byte (T068). Neither limits
// how long an answer takes: only silence counts, and pings count as bytes. The longest seen in 258
// live requests (2026-11-04): 4.7 s to headers, 4.2 s between bytes. Too short costs a re-send.
// At worst a request that gets nothing back takes about 62 s to fail (3 tries, see createClient),
// or 60 s if it goes quiet twice; the turn limit still bounds everything.
export const HEADERS_MS = 20 * 1000;
export const QUIET_MS = 30 * 1000;
// A request that went quiet with nothing on screen is sent once more. Anything more would risk
// spending the learner's wait, and credit, on a service that isn't answering.
export const QUIET_RETRIES = 1;

// The SDK client: an explicit key (never the environment), 2 retries on 429, 5xx, connection errors
// and missing headers (research R3), and a body that fails if it goes quiet (lib/stall.mjs). The
// turn limit stays the loop's: it can't be the request's too, or the retries never get a chance.
export function createClient({ apiKey, baseURL, headersMs = HEADERS_MS, quietMs = QUIET_MS, log }) {
  return new Anthropic({ apiKey, ...(baseURL ? { baseURL } : {}), maxRetries: 2, timeout: headersMs, fetch: stallFetch({ stallMs: quietMs, log }) });
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
  let prompt = null; // { tools, allowed, toolChanges, system, skillName, prompt_hash }
  let handedOver = false; // the tool list changed after the first request (never with toolChanges)
  // What the history has told the model it can call, when prompt.toolChanges: the tools declared
  // without defer_loading, then each tool change placed. prompt.allowed moves at the hand-over;
  // this follows when the changes go in, so the blocks say only what the model hasn't been told.
  let offered = null;
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
  // was (the body arrives as a mid-conversation system message), so nothing earlier changes. With
  // tool changes the list stays too; on other models it's replaced (D2).
  function switchTo(skill) {
    const built = buildTools(server.tools, skill.allowedTools, skillTool);
    const { allowed } = built;
    const tools = prompt.toolChanges ? prompt.tools : built.tools;
    const system = prompt.system;
    prompt = {
      ...prompt,
      tools,
      allowed,
      system,
      skillName: skill.name,
      prompt_hash: promptHash({ tools, system, placement: settings.skill_placement, skillName: skill.name, skillBody: skill.body }),
    };
    if (!prompt.toolChanges) handedOver = true;
  }

  function requestParams() {
    // Every request opts into the history check (preserved thinking), so an edited history fails
    // here on any account, not only on accounts made after 2026-08-31 (every learner's): "error"
    // while the history must be intact, which with tool changes is the whole lesson. "drop_block"
    // only once a hand-over has replaced the tool list, which invalidates the thinking blocks from
    // before it (the claude-api reference, Breaking change 3; D2: Haiku 5.5 only). The beta also
    // makes each response list what it dropped (input_transformations).
    const betas = [BETAS.binding];
    if (prompt.toolChanges) betas.push(BETAS.toolChanges);
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

  // The learner's or panel's text. When the history already ends with a user message (a turn that
  // ended on its tool results: the step limit, a kept failure, an empty reply), the text goes in
  // that message as blocks after its tool_result blocks, the documented mid-turn user-input shape,
  // since the service refuses two user messages in a row. Otherwise it's a new user message.
  function addUserText(blocks) {
    const last = messages[messages.length - 1];
    if (last && last.role === "user") last.content = last.content.concat(blocks);
    else messages.push({ role: "user", content: blocks });
  }

  // Puts a waiting skill body and any tool changes the history doesn't have yet in one system
  // message, if the history ends with a user message. → how to take it back, or null if it didn't.
  function placeHandOver() {
    if (!messages.length || messages[messages.length - 1].role !== "user") return null;
    const changes = prompt.toolChanges ? toolChangeBlocks(prompt.tools, offered, prompt.allowed) : [];
    if (pendingBody === null && !changes.length) return null;
    const undo = { body: pendingBody, offered };
    messages.push(skillSystemMessage(pendingBody, changes));
    pendingBody = null;
    if (prompt.toolChanges) offered = prompt.allowed;
    return undo;
  }

  // One streamed request. Emits text_delta and text as blocks arrive. → { message } or throws
  // { err }. live.started: the service had begun answering, so the cost is unknown. live.shown:
  // the learner has seen words from this request.
  //
  // A request that goes quiet before any words are shown goes again, the same bytes (T068). No tool
  // has run for it (tools run only after a whole answer) and nothing is on screen, so the only cost
  // of going again is credit: a quiet attempt that had started may still be billed, and its cost
  // then shows as unknown. Once words are on screen a second answer would repeat them, so the turn
  // fails instead, as it does when a connection drops mid-answer.
  async function step(client, signal, emit, live, billedUnknown) {
    const { params, betas } = requestParams();
    for (let attempt = 0; ; attempt++) {
      requestLog.append(params, { turn: turnNo, betas });
      live.started = false;
      let over = false;
      const stream = client.beta.messages.stream({ ...params, betas }, { signal });
      stream.on("streamEvent", (ev, snapshot) => {
        if (over) return;
        if (ev.type === "message_start") live.started = true;
        else if (ev.type === "content_block_delta" && ev.delta && ev.delta.type === "text_delta" && ev.delta.text) {
          live.shown = true;
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
        over = true;
        if (!isStall(err) || signal.aborted || live.shown || attempt >= QUIET_RETRIES) throw { err };
        log({ event: "request_sent_again", turn: turnNo, attempt: attempt + 1, started: live.started });
        if (live.started) billedUnknown();
      }
    }
  }

  // → { content (API tool result content), isError, ran } (ran: the call did something: ae-mentor
  // answered it, or a skill was loaded; a call answered with a fixed refusal didn't run).
  // flight: set to { id } when a call was sent to ae-mentor and the turn failed before it answered.
  async function runTool(use, race, emit, pendingHandOver, flight) {
    if (use.name === SKILL_TOOL && prompt.allowed.has(SKILL_TOOL)) {
      const input = use.input || {};
      const name = String(input.skill || "").trim().replace(/^\//, "");
      const args = typeof input.args === "string" ? input.args.trim() : "";
      const skill = tryReadSkill(name);
      if (!skill) return { content: [{ type: "text", text: NO_SUCH_SKILL }], isError: true, ran: false };
      pendingHandOver.skill = skill;
      return { content: [{ type: "text", text: loadedText(skill.name, args) }], isError: false, ran: true };
    }
    if (!prompt.allowed.has(use.name)) {
      log({ event: "tool_not_allowed", name: String(use.name).slice(0, 80) });
      const r = { content: [{ type: "text", text: NOT_AVAILABLE }], isError: true };
      emit("tool_result", toolResultEvent(use.id, use.name, r));
      return { content: toApiContent(r.content), isError: true, ran: false };
    }
    let r;
    try {
      r = await race(mcp.callTool(use.name, use.input || {}));
    } catch (e) {
      // Sent unless the server wasn't running to take it (NOT_RUNNING): a timeout or the server
      // dying mid-call leaves it in flight, and AE may have changed.
      if (!(e && e.code === "NOT_RUNNING")) flight.id = use.id;
      if (e instanceof TurnAbort) throw e;
      log({ event: "server_failed", code: e.code || "error" });
      throw new TurnAbort("start_failed");
    }
    emit("tool_result", toolResultEvent(use.id, use.name, r));
    return { content: toApiContent(r.content), isError: r.isError, ran: true };
  }

  const resultBlock = (id, content, isError) => ({ type: "tool_result", tool_use_id: id, content, ...(isError ? { is_error: true } : {}) });

  // A completed hand-over: the new skill's tools from now on, its body waiting to go in.
  function applyHandOver(pendingHandOver, emit) {
    if (!pendingHandOver.skill) return;
    pendingBody = pendingHandOver.skill.body;
    switchTo(pendingHandOver.skill);
    emit("skill_loaded", { skill: pendingHandOver.skill.name });
  }

  // One turn. → { ok, error_kind, cost_usd, tokens, model, other_model, steps, skill, prompt_hash }
  async function runTurn(text, emit) {
    turnNo++;
    // Where a failed turn goes back to: the end of its last complete exchange (an answer with no
    // tool call, or an answer with a result for every call), else the turn's start, which takes
    // the learner's message back too (FR-015, D1; spec resolved question 6). The lesson's prompt
    // goes back with it, so a hand-over in a kept exchange stays in force and one in the tail
    // doesn't.
    // lastLen: how many blocks the last kept message had, so text added to it (addUserText) comes
    // off at block level.
    const mark = () => ({ len: messages.length, lastLen: messages.length ? messages[messages.length - 1].content.length : 0, prompt, handedOver, pendingBody, offered });
    let back = mark();
    let completed = false;
    const markComplete = () => {
      back = mark();
      completed = true;
    };
    const ctl = new AbortController();
    let timedOut = false;
    // What the turn is waiting on, so a timeout's log line says which kind of wait it was: a request
    // (and how far its answer got), or the server (an ae-mentor call or its start).
    let waitingOn = "start";
    const live = { started: false, shown: false };
    const timer = setTimeout(() => {
      timedOut = true;
      log({ event: "turn_timeout", turn: turnNo, step: steps, waiting_on: waitingOn, started: live.started, shown: live.shown });
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
    // A failed turn's incomplete tail comes off the end of the history, and the lesson's prompt
    // goes back with it, so the next request continues from the last complete exchange.
    const fail = (kind) => {
      messages.length = back.len;
      const last = messages[back.len - 1];
      if (last && last.content.length > back.lastLen) last.content = last.content.slice(0, back.lastLen);
      prompt = back.prompt;
      handedOver = back.handedOver;
      pendingBody = back.pendingBody;
      offered = back.offered;
      if (!completed) log({ event: "turn_taken_back" });
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
        offered = prompt.toolChanges ? new Set(prompt.tools.filter((t) => !t.defer_loading).map((t) => t.name)) : null;
      } else if (cmd && cmd.name !== prompt.skillName) {
        const skill = tryReadSkill(cmd.name);
        if (skill) {
          switchTo(skill);
          pendingBody = skill.body;
          emit("skill_loaded", { skill: skill.name });
        }
      }
      addUserText(userContent(text, bodyAhead));

      for (steps = 1; steps <= settings.max_steps; steps++) {
        const placed = placeHandOver();
        let message;
        waitingOn = "request";
        live.started = false;
        live.shown = false;
        try {
          // Raced, so the turn limit holds even if a request never settles after the abort.
          ({ message } = await race(step(client, ctl.signal, emit, live, () => costs.push(null))));
        } catch (thrown) {
          if (live.started) costs.push(null); // billed, but the counts never came
          if (timedOut) throw new TurnAbort("timeout");
          const err = thrown && thrown.err !== undefined ? thrown.err : thrown;
          const kind = classify(err);
          // The service's own words help the builder find a rejected request; the log line is
          // scrubbed of the key (main.mjs), and nothing from it reaches the learner (FR-021, FR-027).
          const detail = err && err.error && err.error.error && typeof err.error.error.message === "string" ? err.error.error.message.slice(0, 300) : null;
          if (!(err instanceof Anthropic.APIError) && !isNetworkError(err) && !isStall(err)) {
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
          // Nothing followed the message, so it can't stay last before the next user message: take
          // it back off the end (no thinking block was made after it) and let it wait again.
          messages.pop();
          pendingBody = placed.body;
          offered = placed.offered;
        }
        const uses = content.filter((b) => b.type === "tool_use");
        if (content.length && !uses.length) markComplete(); // an answer with no tool call

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

        waitingOn = "server";
        const pendingHandOver = {};
        const results = [];
        let ran = false;
        const flight = {};
        try {
          for (const use of uses) {
            const r = await runTool(use, race, emit, pendingHandOver, flight);
            results.push(resultBlock(use.id, r.content, r.isError));
            if (r.ran) ran = true;
          }
        } catch (e) {
          if (!ran && !flight.id) throw e;
          // Any error once a call has run (a fault in the helper too, S4), or while one was in
          // flight (S1), completes the answer, so whatever may have changed AE stays in the history:
          // the call in flight gets NOT_FINISHED, calls never started get DIDNT_RUN.
          const kind = e instanceof TurnAbort ? e.kind : timedOut ? "timeout" : "start_failed";
          if (!(e instanceof TurnAbort)) log({ event: "internal_error", name: (e && e.constructor && e.constructor.name) || typeof e, detail: String((e && e.message) || e).slice(0, 300) });
          // A call in this answer already ran (a demonstration, say), so the answer is completed
          // rather than taken back: each call that didn't run gets the fixed result (resolved
          // question 7), and whatever ran, a hand-over included, stays in force.
          const notRun = uses.slice(results.length);
          for (const use of notRun) results.push(resultBlock(use.id, [{ type: "text", text: use.id === flight.id ? NOT_FINISHED : DIDNT_RUN }], true));
          messages.push({ role: "user", content: results });
          applyHandOver(pendingHandOver, emit);
          markComplete();
          log({ event: "calls_not_run", count: notRun.length, in_flight: flight.id ? 1 : 0 });
          return fail(kind);
        }
        messages.push({ role: "user", content: results });
        applyHandOver(pendingHandOver, emit);
        markComplete();
      }
      // The step limit: as B1's --max-turns, the turn ends without an answer and no error. It ends
      // on a complete exchange (every call made has its result), so nothing is taken back and the
      // lesson can go on from here.
      steps = settings.max_steps;
      log({ event: "step_limit", steps });
      clearTimeout(timer);
      return fail(null);
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
