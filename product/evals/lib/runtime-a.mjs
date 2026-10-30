// The eval runners' mentor on option A (spec 013 T022, contracts/eval-runtime.md › Mentor turns on
// A): one helper process per case, speaking the helper protocol (contracts/helper-protocol.md) the
// panel's adapter speaks, so a case runs on the same module the panel uses. Turns come back as the
// transcript events the runners already check and judge:
//   { kind: "say", text }  and  { kind: "tool", name, input, ok, result }.
// The API key is read from KNACK_EVAL_API_KEY once, sent only in the `start` command, and removed
// from this process's environment so no child (the helper, `claude` for the judge) inherits it.
// Node built-ins only.

import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

export const KEY_VAR = "KNACK_EVAL_API_KEY";
const TURN_WAIT_MS = 6 * 60 * 1000; // the helper's own turn limit is 5 minutes
const START_WAIT_MS = 30 * 1000;

export const helperDirOf = (repo) => path.join(repo, "panel", "helper");

// Reads the key and removes it from the environment (FR-032: the judge runs exactly as today).
export function takeEvalKey(env = process.env) {
  const key = typeof env[KEY_VAR] === "string" && env[KEY_VAR] ? env[KEY_VAR] : null;
  delete env[KEY_VAR];
  return key;
}

// The helper's environment, as the adapter gives it: PATH, HOME and TZ only (helper-protocol).
export function helperEnv(base = process.env) {
  const env = { PATH: "/usr/bin:/bin:/usr/sbin:/sbin" };
  if (base.HOME) env.HOME = base.HOME;
  if (base.TZ) env.TZ = base.TZ;
  return env;
}

// ---------- the event mapping ----------

// One turn's helper events → { events, ok, error, cost_usd, end }.
// `text` → say; `tool_call` + its `tool_result` → one tool event, in the order of the calls. A
// result with no call before it (the helper sends none for a call it won't run, but still answers)
// becomes a tool event of its own. The hand-over tool has neither (R9).
export function mapTurn(helperEvents) {
  const events = [];
  const byId = new Map();
  let error = null;
  let end = null;
  for (const e of helperEvents) {
    if (e.type === "text") {
      if (typeof e.text === "string" && e.text.trim()) events.push({ kind: "say", text: e.text });
    } else if (e.type === "tool_call") {
      const ev = { kind: "tool", name: e.name, input: e.input, ok: null, result: null };
      byId.set(e.id, ev);
      events.push(ev);
    } else if (e.type === "tool_result") {
      let ev = byId.get(e.id);
      if (!ev) {
        ev = { kind: "tool", name: e.name, input: {}, ok: null, result: null };
        byId.set(e.id, ev);
        events.push(ev);
      }
      ev.ok = !!e.ok;
      ev.result = typeof e.text === "string" ? e.text : "";
    } else if (e.type === "error") {
      if (!error) error = e.kind || "error";
    } else if (e.type === "turn_end") {
      end = e;
    }
  }
  const ok = !!end && end.ok === true && !error;
  const cost = end ? end.cost_usd : null;
  return {
    events,
    ok,
    error: ok ? null : error || (end ? "stopped" : "no_turn_end"),
    cost_usd: typeof cost === "number" ? cost : null,
    end,
  };
}

// ---------- one helper process ----------

// → { ready, send(text, kind), stop(), stderr() }. Rejects with an Error whose `kind` is the
// helper's error kind when it answers `start` with an error instead of `ready`.
export async function startHelper({ repo, home, fixtureEnv, requestLog, key, settingsFile, baseUrl, sessionId, mcpConfig, skillsDir, helperDir }) {
  const dir = helperDir || helperDirOf(repo);
  const proc = spawn(process.execPath, [path.join(dir, "main.mjs")], { cwd: dir, env: helperEnv(), stdio: ["pipe", "pipe", "pipe"] });
  const events = [];
  const waiters = [];
  let stderr = "";
  let exited = false;
  proc.stderr.on("data", (d) => (stderr = (stderr + d).slice(-4000)));
  readline.createInterface({ input: proc.stdout }).on("line", (line) => {
    let ev;
    try {
      ev = JSON.parse(line);
    } catch {
      return;
    }
    events.push(ev);
    for (const w of waiters.slice()) w.check();
  });
  proc.on("close", () => {
    exited = true;
    for (const w of waiters.slice()) w.check();
  });
  proc.on("error", () => {
    exited = true;
    for (const w of waiters.slice()) w.check();
  });

  // Resolves with the events from `from` up to and including the first that matches.
  const until = (pred, from, ms) =>
    new Promise((resolve, reject) => {
      const w = {
        check() {
          const i = events.slice(from).findIndex(pred);
          if (i >= 0) return done(() => resolve(events.slice(from, from + i + 1)));
          if (exited) return done(() => reject(Object.assign(new Error("the helper exited"), { kind: "process_exited", partial: events.slice(from) })));
        },
      };
      const timer = setTimeout(() => done(() => reject(Object.assign(new Error("the helper didn't answer in time"), { kind: "timeout", partial: events.slice(from) }))), ms);
      const done = (fn) => {
        clearTimeout(timer);
        const j = waiters.indexOf(w);
        if (j >= 0) waiters.splice(j, 1);
        fn();
      };
      waiters.push(w);
      w.check();
    });

  const cmd = (obj) => {
    try {
      proc.stdin.write(JSON.stringify(obj) + "\n");
    } catch {}
  };
  const stop = async () => {
    if (exited) return;
    cmd({ type: "stop" });
    await new Promise((resolve) => {
      const t = setTimeout(() => {
        try {
          proc.kill("SIGKILL");
        } catch {}
      }, 5000);
      proc.once("close", () => (clearTimeout(t), resolve()));
      if (exited) resolve();
    });
  };

  const start = {
    type: "start",
    session_id: sessionId || crypto.randomUUID(),
    resume: false,
    home,
    mcp_config: mcpConfig || path.join(repo, ".mcp.json"),
    skills_dir: skillsDir || path.join(repo, ".claude", "skills"),
    fixture_env: fixtureEnv || {},
    ...(key ? { key } : {}),
    ...(requestLog ? { request_log: requestLog } : {}),
    ...(settingsFile ? { settings_file: path.resolve(settingsFile) } : {}),
    // Tests only (a local stand-in for the service). The runners never pass it.
    ...(baseUrl ? { base_url: baseUrl } : {}),
  };
  cmd(start);
  let got;
  try {
    got = await until((e) => e.type === "ready" || e.type === "error", 0, START_WAIT_MS);
  } catch (e) {
    await stop();
    throw Object.assign(new Error(`the helper didn't start: ${e.message}. ${stderr.slice(-300)}`), { kind: e.kind || "start_failed" });
  }
  const last = got.at(-1);
  if (last.type === "error") {
    await stop();
    throw Object.assign(new Error(`the helper's start failed (${last.kind}). ${stderr.slice(-300)}`), { kind: last.kind });
  }

  return {
    ready: last,
    stderr: () => stderr,
    // → mapTurn()'s result. A helper that dies or hangs mid-turn gives ok false with that kind.
    async send(text, kind = "typed") {
      const from = events.length;
      cmd({ type: "send", text, kind });
      try {
        const got = await until((e) => e.type === "turn_end", from, TURN_WAIT_MS);
        return { ...mapTurn(got), raw: got };
      } catch (e) {
        const r = mapTurn(e.partial || []);
        return { ...r, ok: false, error: e.kind || "process_exited" };
      }
    },
    stop,
  };
}

// ---------- one case ----------

// Mentor turns for one case. Each `new_session` turn starts a fresh helper (a new conversation) on
// the same home, as B1 starts a fresh Claude session; all of a case's requests go to one log file.
// opts: { repo, home, fixtureEnv, key, settingsFile, baseUrl, startHelper (tests) }
export function createCaseMentor(opts) {
  const requestLog = path.join(opts.home, "request-log.jsonl");
  const begin = opts.startHelper || startHelper;
  let helper = null;
  let cost = 0;
  let costUnknown = 0;
  let otherModelTurns = 0;
  const promptHashes = {};
  let info = null;

  return {
    requestLog,
    get cost() {
      return cost;
    },
    get costUnknownTurns() {
      return costUnknown;
    },
    get otherModelTurns() {
      return otherModelTurns;
    },
    get promptHashes() {
      return { ...promptHashes };
    },
    get info() {
      return info;
    },
    // → { events, ok, error }
    async turn(say, newSession = false) {
      if (newSession && helper) {
        await helper.stop();
        helper = null;
      }
      if (!helper) {
        try {
          helper = await begin({ repo: opts.repo, home: opts.home, fixtureEnv: opts.fixtureEnv, requestLog, key: opts.key, settingsFile: opts.settingsFile, baseUrl: opts.baseUrl });
        } catch (e) {
          return { events: [], ok: false, error: e.kind || "start_failed" };
        }
        const r = helper.ready;
        info = { model: r.model, effort: r.effort, settings_hash: r.settings_hash, ...(r.settings_file ? { settings_file: r.settings_file } : {}) };
      }
      const r = await helper.send(say);
      if (r.cost_usd === null) costUnknown++;
      else cost += r.cost_usd;
      if (r.end) {
        if (r.end.other_model) otherModelTurns++;
        if (r.end.skill && r.end.prompt_hash) promptHashes[r.end.skill] = r.end.prompt_hash;
      }
      return { events: r.events, ok: r.ok, error: r.error };
    },
    // Stops the helper (and with it ae-mentor). Always call, also after a failed case.
    async stop() {
      if (helper) await helper.stop();
      helper = null;
    },
  };
}

// The files whose bytes a --changed hash covers on A runs only (contracts/eval-runtime.md ›
// Results file): the helper's code and texts, the settings file in use and the price table.
export function helperHashFiles(repo, settingsFile) {
  const dir = helperDirOf(repo);
  const lib = fs
    .readdirSync(path.join(dir, "lib"))
    .filter((n) => n.endsWith(".mjs"))
    .sort()
    .map((n) => path.join(dir, "lib", n));
  return [path.join(dir, "main.mjs"), ...lib, settingsFile ? path.resolve(settingsFile) : path.join(dir, "settings.json"), path.join(dir, "preamble.md"), path.join(dir, "skill-tool.json"), path.join(dir, "prices.json")];
}
