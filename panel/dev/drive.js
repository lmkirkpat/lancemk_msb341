#!/usr/bin/env node
// Drive the panel's adapter from Terminal (quickstart §3): the same code the panel runs, printing
// each event on one line. The fastest way to debug the stream without AE.
//   node panel/dev/drive.js --fixture before     # fixture mode, temp AEMentor folder, no AE
//   node panel/dev/drive.js                      # live: the real AE project and learner record
//   node panel/dev/drive.js --runtime a [...]    # option A (spec 013): the helper and the Claude
//                                                # API with the Keychain key (real calls cost money)
//   node panel/dev/drive.js --fault <kind>       # option A against T005's local fake service with
//                                                # that fault scripted (no real API call; fixture
//                                                # mode on a temp folder). Kinds: see FAULTS below.
// Then type: check, hint, show_me, show_me_again, quit, or any question.
// Without --runtime, panel.json's runtime is used (missing = B1). On option A, errors print the
// exact message the panel shows.
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline");
const { pathToFileURL } = require("url");
const { loadConfig } = require("../lib/config.js");
const { createAdapter: createB1Adapter } = require("../lib/adapter-claude-code.js");
const { createAdapter: createApiAdapter, HELPER_DIR } = require("../lib/adapter-api.js");
const { messageForA } = require("../lib/errors-a.js");
const { REQUESTS } = require("../lib/requests.js");
const { skillOf } = require("../lib/skill-tools.js");
const { withStartFields } = require("./start-fields.js");

const REPO = path.resolve(__dirname, "..", "..");
const tilde = (s) => String(s).split(os.homedir()).join("~");
const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : null;
};

// --fault kinds: SC-006's seven, plus a refusal and a connection dropped mid-answer (shown as
// service_busy: the connection was made, so it isn't called offline; 2026-11-05). Each is
// scripted on the local fake service for every request, so every turn hits it.
const FAST = { "retry-after-ms": "1" };
const FAULTS = {
  no_key: null, // no key in the start command and the Keychain not read: no request is made
  rejected: (f) => f.failure(401, "authentication_error", "invalid x-api-key"),
  out_of_credit: (f) => f.failure(400, "billing_error", "Your credit balance is too low to access the Claude API."), // provisional until T038
  rate_limited: (f) => f.failure(429, "rate_limit_error", "Number of requests has exceeded your rate limit.", FAST),
  service_busy: (f) => f.failure(529, "overloaded_error", "Overloaded", FAST),
  offline: null, // a local port nothing listens on
  start_failed: null, // an ae-mentor that can't start
  refused: (f) => f.reply([], { stop_reason: "refusal", stop_details: { type: "refusal", category: "other" } }),
  dropped: (f) => f.drop([f.text("Let me look at your comp first."), f.text("never sent")], 1),
};
const STAND_IN_KEY = "drive-fault-stand-in"; // only ever sent to the local fake service

const fault = arg("--fault");
const runtimeArg = arg("--runtime");
if (fault !== null && !Object.prototype.hasOwnProperty.call(FAULTS, fault)) {
  console.error(`No fault "${fault}". One of: ${Object.keys(FAULTS).join(", ")}.`);
  process.exit(1);
}
if (runtimeArg !== null && runtimeArg !== "a" && runtimeArg !== "b1") {
  console.error(`No runtime "${runtimeArg}". Use --runtime a or --runtime b1.`);
  process.exit(1);
}
if (fault && runtimeArg === "b1") {
  console.error("--fault is for option A only (--runtime a).");
  process.exit(1);
}
const fixture = arg("--fixture") || (fault ? "before" : null);

const cfg = loadConfig(fault ? { runtime: "a" } : runtimeArg ? { runtime: runtimeArg } : undefined);
if (!cfg.ok) {
  console.error(cfg.fix);
  process.exit(1);
}
const isA = cfg.runtime === "a";

// Fault mode: the fake service, scripted, and the start command's extra fields. → { fields, note }
async function faultSetup(kind, tmp) {
  const f = await import(pathToFileURL(path.join(HELPER_DIR, "test", "fake-service.mjs")).href);
  const svc = await f.startFakeService();
  // keychain: false (honoured only with a local base_url): the helper never reads the Keychain,
  // so a fault run never touches a real key or raises an access dialog.
  const fields = { base_url: svc.url, key: STAND_IN_KEY, keychain: false };
  if (kind === "offline") await svc.close(); // the address stays, nothing answers
  else if (FAULTS[kind]) for (let i = 0; i < 60; i++) svc.script(FAULTS[kind](f));
  if (kind === "no_key") delete fields.key;
  if (kind === "start_failed") {
    const broken = path.join(tmp, ".mcp.json");
    fs.writeFileSync(broken, JSON.stringify({ mcpServers: { "ae-mentor": { type: "stdio", command: "node", args: ["no-such-server.mjs"] } } }));
    fields.mcp_config = broken;
  }
  return { fields };
}

async function main() {
  const env = Object.assign({}, process.env);
  let tmp = null;
  const startFields = {};
  if (fixture) {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ae-mentor-drive-"));
    const state = path.join(tmp, "fixture-state.json");
    const file = path.join(REPO, "product", "evals", "easing", "fixtures", `${fixture}.json`);
    if (!fs.existsSync(file)) {
      console.error(`No fixture "${fixture}" in product/evals/easing/fixtures/.`);
      process.exit(1);
    }
    fs.writeFileSync(state, JSON.stringify({ project: file }));
    Object.assign(env, { AE_MENTOR_HOME: tmp, AE_MENTOR_FIXTURE_STATE: state });
    if (isA) {
      cfg.home = tmp;
      startFields.fixture_env = { AE_MENTOR_FIXTURE_STATE: state };
    }
    console.log(`fixture mode: ${fixture} (switch with: fixture <name>)`);
  }
  if (isA) console.log(fault ? "runtime a" : "runtime a: the Claude API with the Keychain key (real calls)");
  if (fault) {
    const { fields } = await faultSetup(fault, tmp);
    Object.assign(startFields, fields);
    console.log(`fault: ${fault} (local fake service; Keychain not read; no real API call)`);
  }

  const a = isA
    ? createApiAdapter(cfg, Object.keys(startFields).length ? { spawn: withStartFields(require("child_process").spawn, startFields) } : {})
    : createB1Adapter(cfg, { env });
  const t0 = () => `${((Date.now() - started) / 1000).toFixed(1).padStart(5)} s`;
  let started = Date.now();
  let inText = false;
  const endText = () => { if (inText) { process.stdout.write("\n"); inText = false; } };

  a.on("turn_start", (e) => { started = Date.now(); console.log(`${t0()}  turn_start ${e.kind}`); });
  a.on("tool_call", (e) => { endText(); console.log(`${t0()}  tool_call ${e.name}`); });
  a.on("tool_result", (e) => {
    endText();
    const extra = e.images.length ? ` +${e.images.length} image` : e.json ? " json" : "";
    console.log(`${t0()}  tool_result ${e.name} ${e.ok ? "ok" : "ERROR " + tilde(e.text).slice(0, 120)}${extra}`);
  });
  a.on("text_delta", (e) => {
    if (!inText) { process.stdout.write(`${t0()}  text: `); inText = true; }
    process.stdout.write(e.text);
  });
  a.on("error", (e) => {
    endText();
    if (!isA) return console.log(`${t0()}  error ${e.kind}: ${tilde(e.message)}`);
    const shown = messageForA(e.kind); // exactly what the panel shows
    console.log(`${t0()}  error ${e.kind}: ${shown === null ? "(not shown)" : shown}`);
  });
  a.on("turn_end", (e) => {
    endText();
    const f = (ms) => (ms === null ? "–" : `${(ms / 1000).toFixed(1)} s`);
    const start = typeof e.start_ms === "number" ? ` helper_start=${f(e.start_ms)}` : "";
    // On A, a null cost means billed but unknown (spec 013 FR-026), never $0.
    const cost = isA && e.cost_usd === null ? "unknown" : `$${(e.cost_usd || 0).toFixed(3)}`;
    console.log(`${t0()}  turn_end ok=${e.ok} first_activity=${f(e.first_event_ms)} first_words=${f(e.wait_ms)} cost=${cost}${start}`);
    process.stdout.write("> ");
  });
  a.on("exit", (e) => {
    console.log(`exit ${e.code}`);
    if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
    process.exit(0);
  });

  a.start({ skill: skillOf(REQUESTS.start.request) });
  a.send(REQUESTS.start.request, "start");

  readline.createInterface({ input: process.stdin }).on("line", (line) => {
    const s = line.trim();
    if (!s) return;
    if (s === "quit") return a.stop();
    if (s.startsWith("fixture ") && fixture) {
      const name = s.slice(8).trim();
      fs.writeFileSync(env.AE_MENTOR_FIXTURE_STATE, JSON.stringify({ project: path.join(REPO, "product", "evals", "easing", "fixtures", `${name}.json`) }));
      return console.log(`project is now ${name}`);
    }
    const kind = REQUESTS[s] && s !== "start" ? s : "ask";
    try {
      a.send(kind === "ask" ? s : REQUESTS[kind].request, kind);
    } catch (e) {
      console.log(e.code === "BUSY" ? "(still answering, wait for turn_end)" : e.message);
    }
  });
}

main().catch((e) => {
  console.error(e && e.message ? e.message : e);
  process.exit(1);
});
