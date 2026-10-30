#!/usr/bin/env node
// Knack's option A helper (spec 013, decisions/010): one process per lesson. It reads JSON-line
// commands on stdin (start, send, stop, key_check) and writes the adapter's events on stdout
// (contracts/helper-protocol.md). It runs the agent loop on the Claude API and starts ae-mentor
// itself; the panel, the eval runners and dev/chat.mjs all speak this same protocol. It holds no
// teaching logic, never reads or writes the AE project, session.json or learner.json (only
// ae-mentor does), and never puts the key in an event, a log line or a child's environment.
// Log lines go to stderr, scrubbed.

import readline from "node:readline";
import { scrubEnv, resolveKey } from "./lib/key.mjs";
import { loadSettings, HELPER_DIR } from "./lib/settings.mjs";
import { createMcpClient } from "./lib/mcp-client.mjs";
import { createLesson, createClient } from "./lib/loop.mjs";
import { loadPreamble, loadSkillTool } from "./lib/prompt.mjs";
import { createRequestLog } from "./lib/request-log.mjs";
import { errorEvent, logLine } from "./lib/errors.mjs";
import { ZERO_TOKENS } from "./lib/cost.mjs";

// Before anything can build a client: no key, token, profile or host from the environment.
const removedEnv = scrubEnv(process.env);

// A start command's base_url is for tests and dev/drive.js's faults only (T005's fake service):
// it may only point at this Mac, so the key can't be sent anywhere else by mistake.
const LOCAL_URL = /^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d{1,5})?\/?$/;

let key = null; // in memory only
let startKey = null; // the start command's key (evals), if any
let started = false;
let stopping = false;
let turnInFlight = false;
let ctx = null; // { sessionId, loaded, mcp, lesson, client, baseURL }

function out(type, payload) {
  if (stopping) return;
  process.stdout.write(JSON.stringify({ type, ...payload }) + "\n");
}

function log(entry) {
  process.stderr.write(logLine(entry, key || startKey) + "\n");
}

if (removedEnv.length) log({ event: "env_removed", names: removedEnv });

async function getClient() {
  if (!key) key = await resolveKey(startKey);
  if (!key) return null;
  if (!ctx.client) ctx.client = createClient({ apiKey: key, baseURL: ctx.baseURL, timeoutMs: ctx.loaded.settings.turn_timeout_ms });
  return ctx.client;
}

async function start(cmd) {
  if (started) {
    log({ event: "bad_command", reason: "already started" });
    return out("error", { kind: "bad_command", message: "" });
  }
  startKey = typeof cmd.key === "string" && cmd.key ? cmd.key : null;
  delete cmd.key;
  const fail = (reason) => {
    log({ event: "start_failed", reason });
    out("error", errorEvent("start_failed"));
  };
  for (const f of ["session_id", "mcp_config", "skills_dir"]) {
    if (typeof cmd[f] !== "string" || !cmd[f]) return fail(`missing ${f}`);
  }
  if (cmd.base_url !== undefined && (typeof cmd.base_url !== "string" || !LOCAL_URL.test(cmd.base_url))) return fail("base_url must be on this Mac");

  let loaded;
  try {
    loaded = loadSettings(cmd.settings_file || undefined);
  } catch (e) {
    return fail(e.message);
  }
  let preamble;
  let skillTool;
  try {
    preamble = loadPreamble(HELPER_DIR);
    skillTool = loadSkillTool(HELPER_DIR);
  } catch {
    return fail("preamble or hand-over tool unreadable");
  }

  const mcp = createMcpClient({
    mcpConfig: cmd.mcp_config,
    home: typeof cmd.home === "string" && cmd.home ? cmd.home : undefined,
    fixtureEnv: cmd.fixture_env && typeof cmd.fixture_env === "object" ? cmd.fixture_env : {},
    onExit: ({ code, signal }) => {
      if (!stopping) log({ event: "server_exited", code: code ?? null, signal: signal ?? null });
    },
  });
  ctx = { sessionId: cmd.session_id, loaded, mcp, client: null, baseURL: cmd.base_url || undefined };
  ctx.lesson = createLesson({
    getClient,
    mcp,
    settings: loaded.settings,
    prices: loaded.prices,
    preamble,
    skillTool,
    skillsDir: cmd.skills_dir,
    requestLog: createRequestLog(typeof cmd.request_log === "string" ? cmd.request_log : null, startKey),
    log,
  });
  started = true;
  // `resume` is accepted; continuing a saved conversation comes with T043/T044. Until then a
  // resumed lesson starts fresh, which spec 003's rule allows (say nothing alarming).
  if (cmd.resume) log({ event: "resume_not_available" });

  key = await resolveKey(startKey);
  try {
    await mcp.start();
  } catch (e) {
    log({ event: "server_failed", code: e.code || "error" });
    out("error", errorEvent("start_failed")); // the next send tries again
    return;
  }
  out("ready", {
    session_id: ctx.sessionId,
    runtime: "a",
    model: loaded.settings.model,
    effort: loaded.settings.effort,
    settings_hash: loaded.hash,
    skill: null,
    ...(loaded.isDefault ? {} : { settings_file: loaded.file }),
  });
}

function turnEnd(fields) {
  const s = ctx ? ctx.loaded : null;
  out("turn_end", {
    runtime: "a",
    model: s ? s.settings.model : null,
    effort: s ? s.settings.effort : null,
    settings_hash: s ? s.hash : null,
    tokens: { ...ZERO_TOKENS },
    other_model: false,
    cost_usd: 0,
    ...fields,
  });
}

async function send(cmd) {
  const kind = typeof cmd.kind === "string" ? cmd.kind : "typed";
  if (turnInFlight) return out("error", errorEvent("busy"));
  const sentAt = Date.now();
  if (!started) {
    out("error", errorEvent("start_failed"));
    return turnEnd({ ok: false, wait_ms: null, first_event_ms: null, total_ms: 0, kind });
  }
  turnInFlight = true;
  let firstDelta = null;
  let firstEvent = null;
  out("turn_start", { kind, at: new Date(sentAt).toISOString() });
  const emit = (type, payload) => {
    if (type === "text_delta" || type === "tool_call") {
      const t = Date.now();
      if (firstEvent === null) firstEvent = t;
      if (type === "text_delta" && firstDelta === null) firstDelta = t;
    }
    out(type, payload);
  };
  let r;
  try {
    r = await ctx.lesson.runTurn(typeof cmd.text === "string" ? cmd.text : String(cmd.text ?? ""), emit);
  } catch (e) {
    log({ event: "turn_crashed", detail: String((e && e.message) || e).slice(0, 200) });
    r = { ok: false, error_kind: "start_failed", cost_usd: null, tokens: { ...ZERO_TOKENS }, model: ctx.loaded.settings.model, other_model: false };
  }
  turnInFlight = false;
  if (r.error_kind) out("error", errorEvent(r.error_kind));
  turnEnd({
    ok: r.ok,
    cost_usd: r.cost_usd,
    wait_ms: firstDelta === null ? null : firstDelta - sentAt,
    first_event_ms: firstEvent === null ? null : firstEvent - sentAt,
    total_ms: Date.now() - sentAt,
    kind,
    model: r.model,
    tokens: r.tokens,
    other_model: r.other_model,
    steps: r.steps,
    skill: r.skill,
    prompt_hash: r.prompt_hash,
  });
}

async function keyCheck(cmd) {
  // T037 builds the real check (one free models.retrieve). Until then: whether a key is there.
  const k = await resolveKey(typeof cmd.key === "string" ? cmd.key : startKey);
  delete cmd.key;
  if (!k) return out("key_status", { status: "no_key" });
  out("error", { kind: "not_implemented", message: "" });
}

async function stop() {
  if (stopping) return;
  stopping = true;
  try {
    if (ctx) await ctx.mcp.stop();
  } catch {}
  process.exit(0);
}

const handlers = { start, send, stop, key_check: keyCheck };

readline.createInterface({ input: process.stdin }).on("line", (line) => {
  if (!line.trim()) return;
  let cmd;
  try {
    cmd = JSON.parse(line);
  } catch {
    return log({ event: "bad_line" }); // never echoed: it could hold a key
  }
  const h = cmd && typeof cmd === "object" ? handlers[cmd.type] : null;
  if (!h) {
    log({ event: "bad_command", type: cmd && typeof cmd.type === "string" ? cmd.type.slice(0, 40) : null });
    return out("error", { kind: "bad_command", message: "" });
  }
  Promise.resolve(h(cmd)).catch((e) => log({ event: "command_failed", type: cmd.type, detail: String((e && e.message) || e).slice(0, 200) }));
}).on("close", stop);

process.on("SIGTERM", stop);
process.on("SIGINT", stop);
