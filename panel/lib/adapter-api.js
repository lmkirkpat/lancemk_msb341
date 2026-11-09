// The option A adapter (spec 013 FR-001 to FR-003, decisions/010): the same interface and events
// as adapter-claude-code.js (specs/003-mentor-panel/contracts/mentor-adapter.md), backed by one
// helper process per lesson (panel/helper/main.mjs) that calls the Claude API and starts
// ae-mentor itself. JSON lines both ways (specs/013-api-runtime/contracts/helper-protocol.md).
//
// The adapter never reads or writes the AE project, session.json or learner.json, never sees the
// access key (the helper reads it from the Keychain), and never sends the test-only base_url. The
// helper gets only PATH, HOME and TZ from the panel's environment. CommonJS, no dependencies, no
// CEP API, so a UXP panel can start the same helper.
"use strict";

const nodeCrypto = require("crypto");
const path = require("path");
const { defaultHome } = require("./config.js");

const HELPER_DIR = path.resolve(__dirname, "..", "helper");
const HELPER_PATH = path.join(HELPER_DIR, "main.mjs");
const HELPER_PATH_ENV = "/usr/bin:/bin:/usr/sbin:/sbin";
// The helper ends a turn itself after 5 minutes (settings turn_timeout_ms). This backstop is only
// for a helper that has stopped answering: it stops the helper and ends the turn as
// process_exited, whose message says to start the lesson again (the helper's exit closes the
// lesson, so the panel offers Start). Review S6: start-again wording, not a restart.
const BACKSTOP_MS = 5 * 60 * 1000 + 30 * 1000;
const KILL_AFTER_MS = 3000;
// Kinds the panel never shows (contracts/helper-protocol.md › Error kinds).
const NOT_SHOWN = new Set(["busy", "bad_command", "not_implemented"]);
// turn_end fields the helper adds (data-model › Turn log entry), passed on as they come.
const HELPER_FIELDS = ["cost_usd", "runtime", "model", "effort", "settings_hash", "tokens", "other_model", "steps", "skill", "prompt_hash"];

// Only PATH, HOME and TZ (the contract's "Starting the helper"): no key, no ANTHROPIC_*, no
// AE_MENTOR_* (the learner home goes in the start command instead).
function helperEnv(baseEnv) {
  const env = { PATH: HELPER_PATH_ENV, HOME: baseEnv.HOME || require("os").homedir() };
  if (baseEnv.TZ) env.TZ = baseEnv.TZ;
  return env;
}

// config: a loaded Panel config (runtime "a") plus an optional { home }. deps: { spawn, now,
// setTimeout, clearTimeout, env, randomUUID, log, helperPath }, all injectable for tests.
function createAdapter(config, deps) {
  const d = deps || {};
  const spawn = d.spawn || require("child_process").spawn;
  const now = d.now || Date.now;
  const setT = d.setTimeout || setTimeout;
  const clearT = d.clearTimeout || clearTimeout;
  const randomUUID = d.randomUUID || (() => nodeCrypto.randomUUID());
  const baseEnv = d.env || process.env;
  const log = d.log || ((entry) => console.warn("[Knack] helper", JSON.stringify(entry)));
  const helperPath = d.helperPath || HELPER_PATH;

  const handlers = {};
  const emit = (type, payload) => (handlers[type] || []).forEach((h) => h(Object.assign({ type }, payload)));

  let child = null;
  let stopped = false;
  let turn = null; // { kind, sentAt, firstDelta, firstEvent, timer, errorKind, startError }
  let spawnedAt = null;
  let starting = false; // from spawn until ready or the start's error
  let startMs = null; // spawn to ready, carried on the lesson's first turn_end
  let firstTurnDone = false;
  let buffer = "";

  function write(obj) {
    if (!child) return;
    try {
      child.stdin.write(JSON.stringify(obj) + "\n");
    } catch (e) {
      log({ event: "stdin_error", code: (e && e.code) || "error" });
    }
  }

  function endTurn(ok, fromHelper) {
    if (!turn) return;
    const t = turn;
    turn = null;
    clearT(t.timer);
    const payload = {};
    if (fromHelper) for (const f of HELPER_FIELDS) if (f in fromHelper) payload[f] = fromHelper[f];
    Object.assign(payload, {
      ok,
      cost_usd: fromHelper && "cost_usd" in fromHelper ? fromHelper.cost_usd : null,
      wait_ms: t.firstDelta === null ? null : t.firstDelta - t.sentAt,
      first_event_ms: t.firstEvent === null ? null : t.firstEvent - t.sentAt,
      total_ms: now() - t.sentAt,
      kind: t.kind,
      error_kind: t.errorKind,
    });
    if (!firstTurnDone) {
      firstTurnDone = true;
      if (startMs !== null) payload.start_ms = startMs;
    }
    emit("turn_end", payload);
  }

  function onError(ev) {
    const kind = typeof ev.kind === "string" ? ev.kind : "start_failed";
    if (NOT_SHOWN.has(kind)) return log({ event: "helper_error", kind });
    if (ev.during === "start") {
      // The start command's own error, in place of ready (ae-mentor couldn't start), told apart
      // from a turn's by its source (review S5). Starting is over; the next send tries again. A
      // turn already waiting reports its own error, so this one isn't shown as well.
      starting = false;
      if (turn) return log({ event: "start_failed_during_turn" });
    }
    if (turn) turn.errorKind = kind;
    emit("error", { kind, message: typeof ev.message === "string" ? ev.message : "" });
  }

  function onEvent(ev) {
    switch (ev.type) {
      case "ready":
        if (starting) {
          starting = false;
          startMs = now() - spawnedAt;
        }
        return; // helper only: not re-emitted
      case "turn_start":
        return; // the adapter sent its own when the send was accepted
      case "turn_end":
        return endTurn(ev.ok === true, ev);
      case "error":
        return onError(ev);
      case "text_delta":
      case "tool_call":
        if (turn) {
          const at = now();
          if (turn.firstEvent === null) turn.firstEvent = at;
          if (ev.type === "text_delta" && turn.firstDelta === null) turn.firstDelta = at;
        }
        break;
      case "text":
      case "tool_result":
      case "skill_loaded":
      case "key_status":
        break;
      default:
        return log({ event: "unknown_event", type: String(ev.type).slice(0, 40) });
    }
    const payload = Object.assign({}, ev);
    delete payload.type;
    emit(ev.type, payload);
  }

  function onData(chunk) {
    buffer += String(chunk);
    let i;
    while ((i = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, i).trim();
      buffer = buffer.slice(i + 1);
      if (!line) continue;
      let ev;
      try {
        ev = JSON.parse(line);
      } catch (e) {
        log({ event: "bad_line" }); // never echoed
        continue;
      }
      if (ev && typeof ev === "object" && typeof ev.type === "string") onEvent(ev);
      else log({ event: "bad_line" });
    }
  }

  function start(opts) {
    if (child) throw Object.assign(new Error("already started"), { code: "STARTED" });
    const resumeSessionId = opts && opts.resumeSessionId;
    const sessionId = resumeSessionId || randomUUID();
    stopped = false;
    buffer = "";
    startMs = null;
    firstTurnDone = false;
    spawnedAt = now();
    try {
      child = spawn(config.node_path, [helperPath], { cwd: path.dirname(helperPath), env: helperEnv(baseEnv), stdio: ["pipe", "pipe", "pipe"] });
    } catch (e) {
      child = null;
      log({ event: "spawn_failed", code: (e && e.code) || "error" });
      emit("error", { kind: "start_failed", message: "" });
      return sessionId;
    }
    starting = true;
    const c = child;
    if (c.stdin && typeof c.stdin.on === "function") c.stdin.on("error", (e) => log({ event: "stdin_error", code: (e && e.code) || "error" }));
    c.stdout.on("data", onData);
    // The helper's stderr is its own scrubbed log (contracts › Guarantees); kept out of the page.
    if (c.stderr) c.stderr.on("data", () => {});
    c.on("error", (e) => {
      log({ event: "spawn_failed", code: (e && e.code) || "error" });
      starting = false;
      if (turn) turn.errorKind = "start_failed";
      emit("error", { kind: "start_failed", message: "" });
      endTurn(false, null);
    });
    c.on("close", (code) => {
      if (child === c) child = null;
      starting = false;
      clearT(c.killTimer);
      if (turn) {
        if (!stopped) {
          turn.errorKind = "process_exited";
          emit("error", { kind: "process_exited", message: "" });
        }
        endTurn(false, null);
      }
      emit("exit", { code });
    });
    write({
      type: "start",
      session_id: sessionId,
      resume: !!resumeSessionId,
      home: config.home || defaultHome(baseEnv),
      mcp_config: path.join(config.repo_path, ".mcp.json"),
      skills_dir: path.join(config.repo_path, ".claude", "skills"),
    });
    return sessionId;
  }

  function send(text, kind) {
    if (!child) throw Object.assign(new Error("not started"), { code: "NOT_STARTED" });
    if (turn) throw Object.assign(new Error("a turn is in flight"), { code: "BUSY" });
    const sentAt = now();
    turn = { kind, sentAt, firstDelta: null, firstEvent: null, timer: null, errorKind: null };
    turn.timer = setT(() => {
      if (!turn) return;
      log({ event: "backstop_timeout" });
      turn.errorKind = "process_exited";
      emit("error", { kind: "process_exited", message: "" });
      endTurn(false, null);
      stop();
    }, BACKSTOP_MS);
    write({ type: "send", text: String(text), kind });
    emit("turn_start", { kind, at: new Date(sentAt).toISOString() });
  }

  function stop() {
    if (!child || stopped) return;
    stopped = true;
    const c = child;
    write({ type: "stop" });
    try { c.stdin.end(); } catch (e) {}
    try { c.kill("SIGTERM"); } catch (e) {}
    c.killTimer = setT(() => {
      try { c.kill("SIGKILL"); } catch (e) {}
    }, KILL_AFTER_MS);
  }

  return {
    announcesCalls: true, // FR-030: whether a tool_call seen proves the call will run (plan P7)
    handsOver: true, // the mentor's own Skill call hands over (plan P3)
    start,
    send,
    stop,
    busy: () => turn !== null,
    on(type, handler) {
      (handlers[type] = handlers[type] || []).push(handler);
      return this;
    },
  };
}

module.exports = { createAdapter, helperEnv, HELPER_DIR, HELPER_PATH, BACKSTOP_MS, KILL_AFTER_MS };
