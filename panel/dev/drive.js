#!/usr/bin/env node
// Drive the panel's adapter from Terminal (quickstart §3): the same code the panel runs, printing
// each event on one line. The fastest way to debug the stream without AE.
//   node panel/dev/drive.js --fixture before     # fixture mode, temp AEMentor folder, no AE
//   node panel/dev/drive.js                      # live: the real AE project and learner record
// Then type: check, hint, show_me, show_me_again, quit, or any question.
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline");
const { loadConfig } = require("../lib/config.js");
const { createAdapter } = require("../lib/adapter-claude-code.js");
const { REQUESTS } = require("../lib/requests.js");

const REPO = path.resolve(__dirname, "..", "..");
const tilde = (s) => String(s).split(os.homedir()).join("~");
const fx = process.argv.indexOf("--fixture");
const fixture = fx > 0 ? process.argv[fx + 1] : null;

const cfg = loadConfig();
if (!cfg.ok) {
  console.error(cfg.fix);
  process.exit(1);
}

const env = Object.assign({}, process.env);
let tmp = null;
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
  console.log(`fixture mode: ${fixture} (switch with: fixture <name>)`);
}

const a = createAdapter(cfg, { env });
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
a.on("error", (e) => { endText(); console.log(`${t0()}  error ${e.kind}: ${tilde(e.message)}`); });
a.on("turn_end", (e) => {
  endText();
  const f = (ms) => (ms === null ? "–" : `${(ms / 1000).toFixed(1)} s`);
  console.log(`${t0()}  turn_end ok=${e.ok} first_activity=${f(e.first_event_ms)} first_words=${f(e.wait_ms)} cost=$${(e.cost_usd || 0).toFixed(3)}`);
  process.stdout.write("> ");
});
a.on("exit", (e) => {
  console.log(`exit ${e.code}`);
  if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
  process.exit(0);
});

a.start();
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
