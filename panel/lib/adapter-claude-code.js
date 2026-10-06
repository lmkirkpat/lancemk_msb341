// The one seam between the panel and whatever runs the mentor (contracts/mentor-adapter.md,
// decisions/005 option B1). This adapter keeps one headless Claude Code process per lesson and
// talks stream-json over stdin/stdout (research R1, confirmed by the spike). It never reads or
// writes the AE project, session.json or learner.json, and gives the mentor no tools beyond the
// six ae-mentor tools plus ToolSearch (research R2).
"use strict";

const nodeCrypto = require("crypto");
const { createStreamParser } = require("./stream.js");
const { childPath } = require("./config.js");

const PREFIX = "mcp__ae-mentor__";
const MENTOR_TOOLS = ["read_learner_record", "snapshot_project", "preview_frame", "set_ease", "diff_since_last", "record_lesson"];
const TURN_TIMEOUT_MS = 5 * 60 * 1000;
const AUTH = /not (?:logged|signed) in|\/login|authenticat|api key/i;
// The repo's .claude/settings.local.json can set an output style for the builder (Explanatory adds
// "★ Insight" notes). CLI settings outrank local settings, so this keeps the mentor's voice the
// learner's (usage notes, panel session 1; verified with the init line's output_style).
const LEARNER_SETTINGS = JSON.stringify({ outputStyle: "default" });

function launchArgs(sessionFlag, sessionId) {
  return ["--print", "--input-format", "stream-json", "--output-format", "stream-json", "--verbose",
    "--include-partial-messages", sessionFlag, sessionId,
    "--mcp-config", ".mcp.json", "--strict-mcp-config", "--tools", "ToolSearch",
    "--allowedTools", ...MENTOR_TOOLS.map((t) => PREFIX + t), "--max-turns", "12",
    "--settings", LEARNER_SETTINGS];
}

// config: a loaded Panel config. deps: { spawn, now, setTimeout, clearTimeout, env, randomUUID,
// timeoutMs }, all injectable for tests.
function createAdapter(config, deps) {
  const d = deps || {};
  const spawn = d.spawn || require("child_process").spawn;
  const now = d.now || Date.now;
  const setT = d.setTimeout || setTimeout;
  const clearT = d.clearTimeout || clearTimeout;
  const randomUUID = d.randomUUID || (() => nodeCrypto.randomUUID());
  const timeoutMs = d.timeoutMs || TURN_TIMEOUT_MS;
  const baseEnv = d.env || process.env;

  const handlers = {};
  const emit = (type, payload) => (handlers[type] || []).forEach((h) => h(Object.assign({ type }, payload)));

  let child = null;
  let stopped = false;
  let turn = null; // { kind, sentAt, firstDelta, firstEvent, timer }
  let lastCostTotal = 0;
  let stderr = "";

  function endTurn(ok, costTotal) {
    if (!turn) return;
    const t = turn;
    turn = null;
    clearT(t.timer);
    let cost = null;
    if (typeof costTotal === "number") {
      cost = Math.max(0, costTotal - lastCostTotal);
      lastCostTotal = costTotal;
    }
    emit("turn_end", {
      ok,
      cost_usd: cost,
      wait_ms: t.firstDelta === null ? null : t.firstDelta - t.sentAt,
      first_event_ms: t.firstEvent === null ? null : t.firstEvent - t.sentAt,
      total_ms: now() - t.sentAt,
      kind: t.kind,
    });
  }

  const parser = createStreamParser((ev) => {
    if (turn && (ev.type === "text_delta" || ev.type === "tool_call")) {
      const at = now();
      if (turn.firstEvent === null) turn.firstEvent = at;
      if (ev.type === "text_delta" && turn.firstDelta === null) turn.firstDelta = at;
    }
    if (ev.type === "turn_end") return endTurn(ev.ok, ev.cost_total_usd);
    const payload = Object.assign({}, ev);
    delete payload.type;
    emit(ev.type, payload);
  });

  function start(opts) {
    if (child) throw Object.assign(new Error("already started"), { code: "STARTED" });
    const resumeSessionId = opts && opts.resumeSessionId;
    const sessionId = resumeSessionId || randomUUID();
    stopped = false;
    stderr = "";
    lastCostTotal = 0;
    const env = Object.assign({}, baseEnv, { PATH: childPath(config) });
    try {
      child = spawn(config.claude_path, launchArgs(resumeSessionId ? "--resume" : "--session-id", sessionId), {
        cwd: config.repo_path,
        env,
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (e) {
      child = null;
      emit("error", { kind: "start_failed", message: String(e && e.message || e) });
      return sessionId;
    }
    child.stdout.on("data", (chunk) => parser.push(String(chunk)));
    child.stderr.on("data", (chunk) => { stderr = (stderr + String(chunk)).slice(-4000); });
    child.on("error", (e) => {
      emit("error", { kind: "start_failed", message: String(e && e.message || e) });
      endTurn(false, null);
    });
    child.on("close", (code) => {
      parser.end();
      const wasStopped = stopped;
      child = null;
      if (turn) {
        if (!wasStopped) {
          const kind = AUTH.test(stderr) ? "not_signed_in" : "process_exited";
          emit("error", { kind, message: stderr.trim().split("\n").pop() || `Claude Code exited (${code}).` });
        }
        endTurn(false, null);
      }
      emit("exit", { code });
    });
    return sessionId;
  }

  function send(text, kind) {
    if (!child) throw Object.assign(new Error("not started"), { code: "NOT_STARTED" });
    if (turn) throw Object.assign(new Error("a turn is in flight"), { code: "BUSY" });
    const sentAt = now();
    turn = { kind, sentAt, firstDelta: null, firstEvent: null, timer: null };
    turn.timer = setT(() => {
      emit("error", { kind: "timeout", message: "The mentor took more than 5 minutes to answer." });
      endTurn(false, null);
    }, timeoutMs);
    child.stdin.write(JSON.stringify({ type: "user", message: { role: "user", content: String(text) } }) + "\n");
    emit("turn_start", { kind, at: new Date(sentAt).toISOString() });
  }

  function stop() {
    if (!child || stopped) return;
    stopped = true;
    try { child.stdin.end(); } catch (e) {}
    try { child.kill("SIGTERM"); } catch (e) {}
  }

  return {
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

module.exports = { createAdapter, launchArgs, MENTOR_TOOLS, PREFIX, LEARNER_SETTINGS };
