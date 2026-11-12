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
// The error kind when this runner's own wait ran out. The helper's own limits report `timeout` (and
// its stall kinds); a different label says which side gave up (T068).
export const RUNNER_TIMEOUT = "runner_timeout";
// The most helper log a failed turn puts in the results file.
export const STDERR_CAP = 4000;

// The helper's log events that say how a request went (T068): the per-request timing, and every sign
// of a stall or a re-send. Everything else in the log stays out of the results.
export const TIMING_EVENT = "response_timing";
export const REQUEST_EVENTS = new Set(["request_no_headers", "response_went_quiet", "request_sent_again", "turn_timeout", "service_error", "turn_failed"]);
const TIMING_KEEP = ["request_id", "status", "headers_ms", "max_gap_ms", "total_ms", "end"];
const EVENT_KEEP = ["request_id", "retry", "ms", "name", "code", "reached", "silent_ms", "attempt", "started", "step", "waiting_on", "shown", "kind", "status", "type"];

// One stderr line → { kind: "timing" | "event", entry } or null. Entries carry numbers and short
// labels only, never free text longer than a short detail, and are key-scrubbed.
export function parseLogLine(line, key) {
  let o;
  try {
    o = JSON.parse(line);
  } catch {
    return null;
  }
  if (!o || typeof o !== "object") return null;
  const pick = (keys) => Object.fromEntries(keys.filter((k) => o[k] !== undefined && o[k] !== null).map((k) => [k, typeof o[k] === "string" ? scrubKey(o[k], key).slice(0, 80) : o[k]]));
  if (o.event === TIMING_EVENT) return typeof o.total_ms !== "number" ? null : { kind: "timing", entry: pick(TIMING_KEEP) };
  if (REQUEST_EVENTS.has(o.event)) return { kind: "event", entry: { event: o.event, ...pick(EVENT_KEEP), ...(typeof o.detail === "string" ? { detail: scrubKey(o.detail, key).slice(0, 120) } : {}) } };
  return null;
}

// Body sizes (bytes of each logged request line) from a request log file, in the order sent; [] if
// the file can't be read. The helper's own log doesn't carry the size (a proposed one-line change).
export function requestSizes(file) {
  try {
    return fs
      .readFileSync(file, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((l) => Buffer.byteLength(l));
  } catch {
    return [];
  }
}

// Text safe to write to a results file: the key (exact, and anything key-shaped) is replaced. The
// helper's log is scrubbed already (panel/helper/lib/errors.mjs); this is the second guard.
export function scrubKey(text, key) {
  let t = String(text ?? "");
  if (key && key.length >= 8) t = t.split(key).join("[key]");
  return t.replace(/sk-ant-[A-Za-z0-9_-]+/g, "[key]");
}

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
export async function startHelper({ repo, home, fixtureEnv, requestLog, key, settingsFile, baseUrl, sessionId, mcpConfig, skillsDir, helperDir, turnWaitMs }) {
  const dir = helperDir || helperDirOf(repo);
  const proc = spawn(process.execPath, [path.join(dir, "main.mjs")], { cwd: dir, env: helperEnv(), stdio: ["pipe", "pipe", "pipe"] });
  const events = [];
  const waiters = [];
  let stderr = "";
  let exited = false;
  let partial = "";
  let label = null;
  const logged = []; // in the order logged: { kind, entry }
  proc.stderr.on("data", (d) => {
    stderr = (stderr + d).slice(-4000);
    // Whole lines only; the tail kept above is for a failed turn, this is for every turn.
    const lines = (partial + d).split("\n");
    partial = lines.pop().slice(-20000);
    for (const l of lines) {
      const p = parseLogLine(l, key);
      if (p) logged.push({ kind: p.kind, entry: { turn: label, ...p.entry } });
    }
  });
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
      const timer = setTimeout(() => done(() => reject(Object.assign(new Error("the helper didn't answer in time"), { kind: RUNNER_TIMEOUT, partial: events.slice(from) }))), ms);
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
    throw Object.assign(new Error(scrubKey(`the helper didn't start: ${e.message}. ${stderr.slice(-300)}`, key)), { kind: e.kind || "start_failed" });
  }
  const last = got.at(-1);
  if (last.type === "error") {
    await stop();
    throw Object.assign(new Error(scrubKey(`the helper's start failed (${last.kind}). ${stderr.slice(-300)}`, key)), { kind: last.kind });
  }

  return {
    ready: last,
    stderr: () => stderr,
    // Every request line logged so far, in order (kept after stop; call it after `stop`).
    logged: () => logged.slice(),
    // → mapTurn()'s result. A helper that dies or hangs mid-turn gives ok false with that kind.
    // A turn that fails also carries `stderr`: the end of the helper's log, key-scrubbed and capped.
    async send(text, kind = "typed", turnLabel = null) {
      label = turnLabel;
      const from = events.length;
      cmd({ type: "send", text, kind });
      const failed = (r) => ({ ...r, stderr: scrubKey(stderr, key).slice(-STDERR_CAP) });
      try {
        const got = await until((e) => e.type === "turn_end", from, turnWaitMs || TURN_WAIT_MS);
        const r = { ...mapTurn(got), raw: got };
        return r.ok ? r : failed(r);
      } catch (e) {
        const r = mapTurn(e.partial || []);
        return failed({ ...r, ok: false, error: e.kind || "process_exited" });
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
  let turnNo = 0;
  const failedTurns = [];
  const logged = []; // all helpers of the case, in order
  // Takes what a stopped helper logged about its requests.
  const collect = (h) => {
    if (h && typeof h.logged === "function") logged.push(...h.logged());
  };

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
    // [{ turn, error, helper_stderr }] for each turn that failed, for the results file.
    get failedTurns() {
      return failedTurns.map((f) => ({ ...f }));
    },
    // One entry per request the helper timed (every turn, good or failed): { turn, request_id, status,
    // headers_ms, max_gap_ms, total_ms, end, body_bytes? }. body_bytes comes from the request log, matched
    // by order, and only when the counts agree. Complete after stop().
    get requestTiming() {
      // The request log has one line per request the loop sent; each ends in a timing line or a
      // no-headers line. Same count, same order: the sizes line up. Otherwise no sizes.
      const sent = logged.filter((l) => l.kind === "timing" || l.entry.event === "request_no_headers");
      const sizes = requestSizes(requestLog);
      const aligned = sizes.length === sent.length;
      const out = [];
      sent.forEach((l, i) => {
        if (l.kind === "timing") out.push({ ...l.entry, ...(aligned ? { body_bytes: sizes[i] } : {}) });
      });
      return out;
    },
    // The stall and re-send events: { turn, event, ... }. Complete after stop().
    get requestEvents() {
      return logged.filter((l) => l.kind === "event").map((l) => ({ ...l.entry }));
    },
    // → { events, ok, error } and, on a failed turn, `stderr` (the helper's log, scrubbed, capped).
    async turn(say, newSession = false) {
      turnNo++;
      if (newSession && helper) {
        await helper.stop();
        collect(helper);
        helper = null;
      }
      if (!helper) {
        try {
          helper = await begin({ repo: opts.repo, home: opts.home, fixtureEnv: opts.fixtureEnv, requestLog, key: opts.key, settingsFile: opts.settingsFile, baseUrl: opts.baseUrl });
        } catch (e) {
          const error = e.kind || "start_failed";
          const stderr = scrubKey(e.message, opts.key).slice(-STDERR_CAP);
          failedTurns.push({ turn: turnNo, error, helper_stderr: stderr });
          return { events: [], ok: false, error, stderr };
        }
        const r = helper.ready;
        info = { model: r.model, effort: r.effort, settings_hash: r.settings_hash, ...(r.settings_file ? { settings_file: r.settings_file } : {}) };
      }
      const r = await helper.send(say, "typed", turnNo);
      if (r.cost_usd === null) costUnknown++;
      else cost += r.cost_usd;
      if (r.end) {
        if (r.end.other_model) otherModelTurns++;
        if (r.end.skill && r.end.prompt_hash) promptHashes[r.end.skill] = r.end.prompt_hash;
      }
      if (!r.ok) {
        const stderr = scrubKey(r.stderr, opts.key).slice(-STDERR_CAP);
        failedTurns.push({ turn: turnNo, error: r.error, helper_stderr: stderr });
        return { events: r.events, ok: false, error: r.error, stderr };
      }
      return { events: r.events, ok: r.ok, error: r.error };
    },
    // Stops the helper (and with it ae-mentor). Always call, also after a failed case.
    async stop() {
      if (helper) {
        await helper.stop();
        collect(helper);
      }
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
