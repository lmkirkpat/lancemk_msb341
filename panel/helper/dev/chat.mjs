#!/usr/bin/env node
// A terminal chat over the option A helper, for the builder only (spec 013 FR-039; not installed
// for learners). It starts panel/helper/main.mjs exactly as the panel will, opens the lesson with
// `/<skill> [args]`, then sends each line you type. The mentor's words print as they stream, with
// one line per tool call. The key comes from the Keychain item (service Knack, account
// anthropic-api-key); the helper reads it itself.
//
//   node panel/helper/dev/chat.mjs --skill ease-mentor
//   node panel/helper/dev/chat.mjs --skill offset-mentor review --home /tmp/knack-home
//   node panel/helper/dev/chat.mjs --skill ease-mentor --fixture product/evals/easing/fixtures/before.json
//   node panel/helper/dev/chat.mjs --key-check
//
// Options:
//   --skill <name>-mentor [args…]  the skill to open with, and its arguments (everything up to the
//                                  next --option)
//   --home <dir>                   the learner home ae-mentor uses (default: a new empty folder, so
//                                  your real learner record isn't touched; printed at start)
//   --fixture <file>               run ae-mentor in fixture mode on that saved snapshot instead of
//                                  the live comp (no After Effects needed)
//   --settings <file>              another settings file (experiments only)
//   --key-check                    ask the helper whether the Keychain key works, then exit
//   --fake-service <url>           dev only: a local fake service (test/fake-service.mjs) with a
//                                  placeholder key; the Keychain is never read
// Type /quit (or press Ctrl-D) to end; the helper and ae-mentor stop with it.

import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const HELPER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = path.resolve(HELPER, "../..");
const FAKE_KEY = "fake-dev-key-not-a-real-key";

function parseArgs(argv) {
  const o = { skillArgs: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = () => {
      if (i + 1 >= argv.length) usage(`${a} needs a value`);
      return argv[++i];
    };
    if (a === "--skill") {
      o.skill = val();
      while (i + 1 < argv.length && !argv[i + 1].startsWith("--")) o.skillArgs.push(argv[++i]);
    } else if (a === "--home") o.home = path.resolve(val());
    else if (a === "--fixture") o.fixture = path.resolve(val());
    else if (a === "--settings") o.settings = path.resolve(val());
    else if (a === "--fake-service") o.fakeService = val();
    else if (a === "--key-check") o.keyCheck = true;
    else if (a === "--help" || a === "-h") usage();
    else usage(`unknown option ${a}`);
  }
  if (!o.keyCheck && !o.skill) usage("--skill is required");
  if (o.skill && !/^[a-z0-9][a-z0-9-]*-mentor$/.test(o.skill)) usage("--skill must be a *-mentor skill, such as ease-mentor");
  if (o.fixture && !fs.existsSync(o.fixture)) usage(`no fixture at ${o.fixture}`);
  return o;
}

function usage(problem) {
  const head = fs.readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 26).map((l) => l.replace(/^\/\/ ?/, "")).join("\n");
  if (problem) console.error(`chat.mjs: ${problem}\n`);
  console.error(head);
  process.exit(problem ? 2 : 0);
}

const o = parseArgs(process.argv.slice(2));
const dim = (s) => (process.stdout.isTTY ? `\x1b[2m${s}\x1b[0m` : s);

const home = o.home || fs.mkdtempSync(path.join(os.tmpdir(), "AEMentor-chat-"));
fs.mkdirSync(home, { recursive: true });
const fixtureEnv = {};
if (o.fixture) {
  const state = path.join(home, "fixture-state.json");
  fs.writeFileSync(state, JSON.stringify({ project: o.fixture }));
  fixtureEnv.AE_MENTOR_FIXTURE_STATE = state;
}

// As the panel's adapter will start it: the helper's own Node, PATH, HOME and TZ only.
const env = { PATH: "/usr/bin:/bin:/usr/sbin:/sbin", HOME: os.homedir(), ...(process.env.TZ ? { TZ: process.env.TZ } : {}) };
const helper = spawn(process.execPath, [path.join(HELPER, "main.mjs")], { cwd: HELPER, env, stdio: ["pipe", "pipe", "pipe"] });
let helperLog = "";
helper.stderr.on("data", (d) => {
  helperLog = (helperLog + d).slice(-4000);
});
const send = (cmd) => helper.stdin.write(JSON.stringify(cmd) + "\n");

let onEvent = () => {};
readline.createInterface({ input: helper.stdout }).on("line", (line) => {
  let ev;
  try {
    ev = JSON.parse(line);
  } catch {
    return;
  }
  onEvent(ev);
});
helper.on("exit", (code) => {
  if (!quitting) {
    console.error(`\n! The helper stopped (exit ${code}).${helperLog ? `\n${dim(helperLog.trim().split("\n").slice(-5).join("\n"))}` : ""}`);
    process.exit(1);
  }
  process.exit(0);
});

let quitting = false;
function quit() {
  if (quitting) return;
  quitting = true;
  send({ type: "stop" });
  setTimeout(() => helper.kill("SIGKILL"), 4000).unref();
}

const nextEvent = (type) =>
  new Promise((resolve) => {
    const prev = onEvent;
    onEvent = (ev) => {
      prev(ev);
      if (ev.type === type || (type === "ready" && ev.type === "error")) {
        onEvent = prev;
        resolve(ev);
      }
    };
  });

// One turn: stream the words, one line per tool call, then a dim summary line.
function turn(textToSend, kind) {
  return new Promise((resolve) => {
    let midLine = false;
    let shown = "";
    let hadError = false;
    onEvent = (ev) => {
      if (ev.type === "text_delta") {
        process.stdout.write(ev.text);
        shown += ev.text;
        midLine = !ev.text.endsWith("\n");
      } else if (ev.type === "text") {
        // The words were already streamed; a complete block only ends the line.
        if (!shown.endsWith(ev.text)) process.stdout.write(ev.text);
        process.stdout.write("\n");
        shown = "";
        midLine = false;
      } else if (ev.type === "tool_call") {
        if (midLine) process.stdout.write("\n");
        midLine = false;
        process.stdout.write(dim(`  · ${ev.name}${ev.input && Object.keys(ev.input).length ? " " + JSON.stringify(ev.input) : ""}`));
      } else if (ev.type === "tool_result") {
        process.stdout.write(dim(` → ${ev.ok ? "ok" : "error"}${ev.images && ev.images.length ? ", a frame" : ""}\n`));
      } else if (ev.type === "skill_loaded") {
        process.stdout.write(dim(`  · handed over to ${ev.skill}\n`));
      } else if (ev.type === "error") {
        if (ev.kind === "busy") return;
        if (midLine) process.stdout.write("\n");
        process.stdout.write(`! ${ev.message || ev.kind}\n`);
        hadError = true;
      } else if (ev.type === "turn_end") {
        // For the builder: after an error, the helper's last log line says what the service
        // answered (its stderr can arrive a moment after the event).
        if (hadError) {
          hadError = false;
          return setTimeout(() => {
            const last = helperLog.trim().split("\n").filter((l) => /service_error|server_failed|start_failed|refused|step_limit/.test(l)).pop();
            if (last) process.stdout.write(dim(`  helper log: ${last}\n`));
            onEvent(ev);
          }, 150);
        }
        if (midLine) process.stdout.write("\n");
        const secs = ev.total_ms != null ? `${(ev.total_ms / 1000).toFixed(1)} s` : "?";
        const first = ev.first_event_ms != null ? `first sign ${(ev.first_event_ms / 1000).toFixed(1)} s` : "no reply";
        const cost = ev.cost_usd === null ? "cost unknown" : `$${ev.cost_usd.toFixed(4)}`;
        const t = ev.tokens || {};
        const notes = [ev.ok ? null : "turn didn't finish", ev.other_model ? `answered by ${ev.model}` : null].filter(Boolean);
        process.stdout.write(dim(`  (${secs}, ${first}, ${cost}, ${ev.steps ?? "?"} steps, cache read ${t.cache_read ?? 0} / write ${t.cache_write ?? 0}${notes.length ? ", " + notes.join(", ") : ""})\n`));
        resolve(ev);
      }
    };
    send({ type: "send", text: textToSend, kind });
  });
}

async function main() {
  if (o.keyCheck) {
    send({ type: "key_check", ...(o.fakeService ? { key: FAKE_KEY } : {}) });
    const ev = await Promise.race([nextEvent("key_status"), nextEvent("error")]);
    console.log(ev.type === "key_status" ? `key: ${ev.status}` : "key check: not built yet (T037); a key is stored.");
    return quit();
  }

  const sessionId = crypto.randomUUID();
  const ready = nextEvent("ready");
  send({
    type: "start",
    session_id: sessionId,
    resume: false,
    home,
    mcp_config: path.join(REPO, ".mcp.json"),
    skills_dir: path.join(REPO, ".claude", "skills"),
    fixture_env: fixtureEnv,
    ...(o.settings ? { settings_file: o.settings } : {}),
    ...(o.fakeService ? { base_url: o.fakeService, key: FAKE_KEY } : {}),
  });
  const r = await ready;
  if (r.type === "error") {
    console.error(`! ${r.message}`);
    if (helperLog) console.error(dim(helperLog.trim().split("\n").slice(-3).join("\n")));
    return quit();
  }
  console.log(dim(`Knack helper ready: ${r.model}, effort ${r.effort}, settings ${r.settings_hash.slice(0, 12)}${r.settings_file ? ` (${r.settings_file})` : ""}`));
  console.log(dim(`Learner home: ${home}${o.fixture ? `  ·  fixture: ${path.relative(REPO, o.fixture)}` : "  ·  live comp"}`));
  console.log(dim("Type /quit or press Ctrl-D to end.\n"));

  const opening = [`/${o.skill}`, ...o.skillArgs].join(" ");
  console.log(`you> ${opening}`);
  await turn(opening, "start");

  const tty = !!process.stdin.isTTY;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: tty });
  let closed = false;
  const prompt = () => {
    if (tty && !closed) rl.prompt();
  };
  rl.setPrompt("you> ");
  prompt();
  let busy = false;
  rl.on("line", async (line) => {
    const t = line.trim();
    if (t === "/quit") return rl.close();
    if (!t || busy) return prompt();
    busy = true;
    if (!tty) console.log(`you> ${t}`);
    await turn(t, "typed");
    busy = false;
    prompt();
  });
  rl.on("close", async () => {
    closed = true;
    while (busy) await new Promise((res) => setTimeout(res, 100));
    quit();
  });
}

main();
