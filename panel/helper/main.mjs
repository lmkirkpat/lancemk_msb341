#!/usr/bin/env node
// Knack's option A helper (spec 013, decisions/010): one process per lesson. It reads JSON-line
// commands on stdin (start, send, stop, key_check) and writes the adapter's events on stdout
// (contracts/helper-protocol.md). It runs the agent loop on the Claude API and starts ae-mentor
// itself; the panel, the eval runners and dev/chat.mjs all speak this same protocol. It holds no
// teaching logic, never reads or writes the AE project, session.json or learner.json (only
// ae-mentor does), and never puts the key in an event, a log line or a child's environment.
// Log lines go to stderr, scrubbed.

import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { scrubEnv, resolveKey, checkKey } from "./lib/key.mjs";
import { loadSettings, HELPER_DIR } from "./lib/settings.mjs";
import { createMcpClient } from "./lib/mcp-client.mjs";
import { createLesson, createClient, lastReach } from "./lib/loop.mjs";
import { loadPreamble, loadSkillTool } from "./lib/prompt.mjs";
import { createRequestLog } from "./lib/request-log.mjs";
import { errorEvent, logLine, scrub } from "./lib/errors.mjs";
import { ZERO_TOKENS } from "./lib/cost.mjs";
import { saveConversation, loadConversation, clearConversation } from "./lib/conversation.mjs";
import { SKILL_PATTERN } from "./lib/skills.mjs";

// Before anything can build a client: no key, token, profile or host from the environment.
const removedEnv = scrubEnv(process.env);

// A start command's base_url is for tests and dev/drive.js's faults only (T005's fake service):
// it may only point at this Mac, so the key can't be sent anywhere else by mistake.
const LOCAL_URL = /^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d{1,5})?\/?$/;

let key = null; // in memory only
let startKey = null; // the start command's key (evals), if any
const checkedKeys = []; // keys from key_check commands, scrubbed from every log line (T037)
// Tests and dev/drive.js --fault only: `keychain: false` in a start command that also has a local
// base_url means the Keychain is never read (no real key in a test, no access dialog).
let useKeychain = true;

const findKey = () => (useKeychain ? resolveKey(startKey) : Promise.resolve(startKey));
let started = false;
let stopping = false;
let turnInFlight = null; // the turn's runTurn promise while one runs
let ctx = null; // { sessionId, home, loaded, mcp, lesson, client, baseURL }
// How long a closing helper waits for the turn in flight to complete and save (stop, below). The
// adapter sends SIGKILL 3 s after SIGTERM, and stopping ae-mentor can take up to 2 s more.
const STOP_TURN_MS = 800;

// The learner home when the start command names none: the same default as the panel's
// (panel/lib/config.js) and ae-mentor's.
const defaultHome = () => path.join(os.homedir(), "Library", "Application Support", "AEMentor");

function out(type, payload) {
  if (stopping) return;
  process.stdout.write(JSON.stringify({ type, ...payload }) + "\n");
}

function log(entry) {
  let line = logLine(entry, key || startKey);
  for (const k of checkedKeys) line = scrub(line, k);
  process.stderr.write(line + "\n");
}

if (removedEnv.length) log({ event: "env_removed", names: removedEnv });

async function getClient() {
  if (!key) key = await findKey();
  if (!key) return null;
  if (!ctx.client) ctx.client = createClient({ apiKey: key, baseURL: ctx.baseURL, log });
  return ctx.client;
}

async function start(cmd) {
  if (started) {
    log({ event: "bad_command", reason: "already started" });
    return out("error", { kind: "bad_command", message: "" });
  }
  startKey = typeof cmd.key === "string" && cmd.key ? cmd.key : null;
  delete cmd.key;
  // The start command's own errors say so (during: "start"), so the adapter can tell them from a
  // turn's error by their source (review S5).
  const startError = () => out("error", { ...errorEvent("start_failed"), during: "start" });
  const fail = (reason) => {
    log({ event: "start_failed", reason });
    startError();
  };
  for (const f of ["session_id", "mcp_config", "skills_dir"]) {
    if (typeof cmd[f] !== "string" || !cmd[f]) return fail(`missing ${f}`);
  }
  if (cmd.base_url !== undefined && (typeof cmd.base_url !== "string" || !LOCAL_URL.test(cmd.base_url))) return fail("base_url must be on this Mac");
  if (cmd.keychain !== undefined && cmd.keychain !== false) return fail("keychain may only be false");
  if (cmd.keychain === false && cmd.base_url === undefined) return fail("keychain false needs a local base_url");

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
  const home = typeof cmd.home === "string" && cmd.home ? cmd.home : defaultHome();
  ctx = { sessionId: cmd.session_id, home, loaded, mcp, client: null, baseURL: cmd.base_url || undefined };

  // The saved conversation (data-model › Lesson conversation, Continuing). resume false or missing:
  // a new lesson, so any saved one goes before ready. resume true: loaded now, checked against
  // today's prompt once ae-mentor has started. Any refusal deletes it and the lesson starts fresh
  // on the opening skill (`skill`), with nothing said to the learner (spec 003's rule).
  let opening = null;
  if (cmd.skill !== undefined && cmd.skill !== null) {
    if (typeof cmd.skill === "string" && SKILL_PATTERN.test(cmd.skill)) opening = cmd.skill;
    else log({ event: "skill_ignored" });
  }
  const notContinued = (reason) => {
    log({ event: "conversation_not_continued", reason });
    if (!clearConversation(home)) log({ event: "conversation_clear_failed" });
  };
  let resume = null;
  if (cmd.resume === true) {
    const got = loadConversation({ home, sessionId: cmd.session_id, model: loaded.settings.model });
    if (got.ok) resume = got.conversation;
    else notContinued(got.reason);
  } else if (!clearConversation(home)) {
    log({ event: "conversation_clear_failed" });
  }
  const save = ({ messages, prompt }) => {
    const r = saveConversation({ home, sessionId: ctx.sessionId, settingsHash: loaded.hash, model: loaded.settings.model, prompt, messages });
    if (r.saved) return;
    log({ event: "conversation_not_saved", reason: r.reason });
    if (r.reason === "write_failed" && !r.cleared) log({ event: "conversation_clear_failed" });
  };

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
    onComplete: save,
    resume,
    // Only for a continue that's refused; a new lesson loads a skill only from a command, as before.
    freshSkill: cmd.resume === true ? opening : null,
    onResume: (r) => (r.resumed ? log({ event: "conversation_continued" }) : notContinued(r.reason)),
  });
  started = true;

  if (cmd.keychain === false) {
    useKeychain = false;
    log({ event: "keychain_off" });
  }
  key = await findKey();
  let resumed = false;
  try {
    await mcp.start();
    // The continue's check needs the server's tools and instructions. If the server can't start,
    // the check waits for the first send that starts it.
    const r = await ctx.lesson.settleResume();
    resumed = Boolean(r && r.resumed);
  } catch (e) {
    log({ event: "server_failed", code: e.code || "error" });
    startError(); // the next send tries again
    return;
  }
  if (stopping) return;
  out("ready", {
    session_id: ctx.sessionId,
    runtime: "a",
    model: loaded.settings.model,
    effort: loaded.settings.effort,
    settings_hash: loaded.hash,
    skill: ctx.lesson.skill,
    resumed,
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
  if (stopping) return;
  if (turnInFlight) return out("error", errorEvent("busy"));
  const sentAt = Date.now();
  if (!started) {
    out("error", errorEvent("start_failed"));
    return turnEnd({ ok: false, wait_ms: null, first_event_ms: null, total_ms: 0, kind });
  }
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
  turnInFlight = ctx.lesson.runTurn(typeof cmd.text === "string" ? cmd.text : String(cmd.text ?? ""), emit);
  try {
    r = await turnInFlight;
  } catch (e) {
    log({ event: "turn_crashed", detail: String((e && e.message) || e).slice(0, 200) });
    r = { ok: false, error_kind: "start_failed", cost_usd: null, tokens: { ...ZERO_TOKENS }, model: ctx.loaded.settings.model, other_model: false };
  }
  turnInFlight = null;
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

// key_check (spec 013 T037, FR-020; spec 006's installer and setup check): needs no start. The
// command's key (the installer checks one before storing it) wins; else the start's key or the
// Keychain. base_url and keychain: false are test-only, with the start command's rules.
async function keyCheck(cmd) {
  const given = typeof cmd.key === "string" && cmd.key.trim() ? cmd.key.trim() : null;
  if (typeof cmd.key === "string" && cmd.key) checkedKeys.push(cmd.key);
  if (given) checkedKeys.push(given); // before any log line this check writes
  delete cmd.key;
  const refuse = (reason) => {
    log({ event: "bad_command", type: "key_check", reason });
    out("error", { kind: "bad_command", message: "" });
  };
  if (cmd.base_url !== undefined && (typeof cmd.base_url !== "string" || !LOCAL_URL.test(cmd.base_url))) return refuse("base_url must be on this Mac");
  if (cmd.keychain !== undefined && cmd.keychain !== false) return refuse("keychain may only be false");
  if (cmd.keychain === false && cmd.base_url === undefined) return refuse("keychain false needs a local base_url");

  let k = given;
  if (!k && cmd.keychain !== false) k = started ? await findKey() : await resolveKey(null);
  if (!k) return out("key_status", { status: "no_key" });
  let model;
  try {
    model = started ? ctx.loaded.settings.model : loadSettings().settings.model;
  } catch (e) {
    log({ event: "key_check_failed", reason: "settings unreadable" });
    return out("error", errorEvent("start_failed"));
  }
  const baseURL = cmd.base_url || (ctx && ctx.baseURL) || undefined;
  const client = createClient({ apiKey: k, baseURL, log });
  const status = await checkKey({ key: k, model, client, reached: () => lastReach(client).reached, log });
  out("key_status", { status });
}

// stop, SIGTERM or stdin closing (the panel closes the helper with all three). A turn in flight
// ends as a failed turn (data-model › Saving and clearing, OQ-C3): an answer whose call ran or is
// running is completed and saved; anything else in flight isn't saved. Then ae-mentor stops and
// the helper exits. No event goes out once stopping.
async function stop() {
  if (stopping) return;
  stopping = true;
  if (ctx && turnInFlight) {
    ctx.lesson.stop();
    let timer;
    await Promise.race([turnInFlight.catch(() => {}), new Promise((resolve) => (timer = setTimeout(resolve, STOP_TURN_MS)))]);
    clearTimeout(timer);
  }
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
