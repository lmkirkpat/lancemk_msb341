// T022: the eval runners' mentor on option A. The event mapping is tested on a recorded helper
// event stream (fixtures/helper-turns-easing.json, recorded from the real helper against the
// panel-builder's fake service); the process side runs the real helper against that fake service.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mapTurn, takeEvalKey, helperEnv, createCaseMentor, helperHashFiles, KEY_VAR, startHelper, scrubKey, RUNNER_TIMEOUT, STDERR_CAP, parseLogLine, requestSizes } from "../runtime-a.mjs";
import { summarize, format } from "../timing-report.mjs";
import { startFakeService, reply, text, thinking, toolUse } from "../../../../panel/helper/test/fake-service.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..", "..", "..");
const recorded = JSON.parse(fs.readFileSync(path.join(HERE, "fixtures", "helper-turns-easing.json"), "utf8"));

test("recorded stream: text and tool calls map to the transcript events B1 produces", () => {
  const r = mapTurn(recorded.turns[0].raw);
  assert.equal(r.ok, true);
  assert.equal(r.error, null);
  assert.deepEqual(r.events.map((e) => e.kind), ["say", "tool", "tool", "tool", "say"]);
  assert.deepEqual(r.events[0], { kind: "say", text: "Let me look." });
  const [rec, snap, hidden] = r.events.slice(1, 4);
  assert.deepEqual(Object.keys(rec).sort(), ["input", "kind", "name", "ok", "result"]);
  assert.equal(rec.name, "read_learner_record");
  assert.deepEqual(rec.input, {});
  assert.equal(rec.ok, true);
  assert.equal(typeof rec.result, "string");
  assert.equal(JSON.parse(snap.result).comp.name, "Mentor Practice");
  assert.equal(hidden.name, "not_a_tool");
  assert.equal(hidden.ok, false);
  assert.equal(hidden.result, "That tool isn't available in this lesson.");
  assert.match(r.events[4].text, /Which layer/);
  assert.equal(typeof r.cost_usd, "number");
});

test("recorded stream: the result is the tool result's text, joined as transcriptOf joins it", () => {
  const raw = [
    { type: "turn_start" },
    { type: "tool_call", id: "a", name: "snapshot_project", input: { x: 1 } },
    { type: "tool_result", id: "a", name: "snapshot_project", ok: true, text: "one\ntwo", images: [{ data: "AAAA", mimeType: "image/png" }] },
    { type: "turn_end", ok: true, cost_usd: 0.5 },
  ];
  const r = mapTurn(raw);
  assert.deepEqual(r.events, [{ kind: "tool", name: "snapshot_project", input: { x: 1 }, ok: true, result: "one\ntwo" }]);
});

test("a failed turn: turn_end ok false or an error ends the case, with the helper's kind", () => {
  const a = mapTurn([{ type: "turn_start" }, { type: "error", kind: "rate_limited", message: "x" }, { type: "turn_end", ok: false, cost_usd: 0 }]);
  assert.equal(a.ok, false);
  assert.equal(a.error, "rate_limited");
  const b = mapTurn([{ type: "turn_start" }, { type: "turn_end", ok: false, cost_usd: 0.1 }]);
  assert.equal(b.ok, false);
  assert.equal(b.error, "stopped");
  const c = mapTurn([{ type: "turn_start" }, { type: "text", text: "hi" }]);
  assert.equal(c.ok, false);
  assert.equal(c.error, "no_turn_end");
});

test("cost null stays null (unknown), never 0", () => {
  const r = mapTurn([{ type: "turn_end", ok: true, cost_usd: null }]);
  assert.equal(r.cost_usd, null);
  assert.equal(mapTurn([{ type: "turn_end", ok: true, cost_usd: 0 }]).cost_usd, 0);
});

test("the key is read once and removed from the environment, so the judge's claude -p never has it", () => {
  const env = { [KEY_VAR]: "sk-ant-api03-EVALKEY_abcdefghijklm", OTHER: "1" };
  assert.equal(takeEvalKey(env), "sk-ant-api03-EVALKEY_abcdefghijklm");
  assert.equal(KEY_VAR in env, false);
  assert.equal(takeEvalKey(env), null);
  process.env[KEY_VAR] = "sk-ant-api03-EVALKEY2_abcdefghijklm";
  takeEvalKey();
  const child = spawnSync(process.execPath, ["-e", `process.stdout.write(String(process.env.${KEY_VAR}))`], { env: { ...process.env }, encoding: "utf8" });
  assert.equal(child.stdout, "undefined");
});

test("the helper gets only PATH, HOME and TZ", () => {
  const env = helperEnv({ HOME: "/h", TZ: "UTC", PATH: "/x", ANTHROPIC_API_KEY: "k", [KEY_VAR]: "k", AE_MENTOR_HOME: "/m" });
  assert.deepEqual(env, { PATH: "/usr/bin:/bin:/usr/sbin:/sbin", HOME: "/h", TZ: "UTC" });
});

test("createCaseMentor: new_session starts a fresh helper; costs add up; a null cost is counted as unknown", async () => {
  const started = [];
  const stopped = [];
  const answers = [
    { events: [{ kind: "say", text: "a" }], ok: true, error: null, cost_usd: 0.25, end: { skill: "ease-mentor", prompt_hash: "h1", other_model: false } },
    { events: [], ok: true, error: null, cost_usd: null, end: { skill: "ease-mentor", prompt_hash: "h1", other_model: true } },
    { events: [], ok: true, error: null, cost_usd: 0.5, end: null },
  ];
  const fake = async (o) => {
    const n = started.push(o);
    return { ready: { model: "m", effort: "e", settings_hash: "s" }, send: async () => answers.shift(), stop: async () => stopped.push(n) };
  };
  const m = createCaseMentor({ repo: REPO, home: "/tmp/x", fixtureEnv: { A: "1" }, key: "k", startHelper: fake });
  await m.turn("one");
  await m.turn("two");
  assert.equal(started.length, 1);
  await m.turn("three", true);
  assert.equal(started.length, 2);
  assert.deepEqual(stopped, [1]);
  assert.equal(started[0].requestLog, started[1].requestLog);
  assert.equal(started[0].key, "k");
  assert.equal(m.cost, 0.75);
  assert.equal(m.costUnknownTurns, 1);
  assert.equal(m.otherModelTurns, 1);
  assert.deepEqual(m.promptHashes, { "ease-mentor": "h1" });
  await m.stop();
  assert.deepEqual(stopped, [1, 2]);
});

test("createCaseMentor: a helper that won't start ends the turn with its kind", async () => {
  const m = createCaseMentor({ repo: REPO, home: "/tmp/x", startHelper: async () => Promise.reject(Object.assign(new Error("no"), { kind: "start_failed" })) });
  const r = await m.turn("hi");
  assert.equal(r.ok, false);
  assert.equal(r.error, "start_failed");
  assert.deepEqual(r.events, []);
  assert.equal(r.stderr, "no");
});

test("the real helper on the fake service: two turns map to events and the cost is a number", async () => {
  const svc = await startFakeService();
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "AEMentor-t022-"));
  const state = path.join(home, "fixture-state.json");
  fs.writeFileSync(state, JSON.stringify({ project: path.join(REPO, "product", "evals", "easing", "fixtures", "before.json") }));
  try {
    svc.script(
      reply([thinking("", "s1"), text("Let me look."), toolUse("snapshot_project", {}, "tu1")], { stop_reason: "tool_use" }),
      reply([text("Your Title moves at one speed.")]),
      reply([text("Fine.")]),
    );
    const m = createCaseMentor({ repo: REPO, home, fixtureEnv: { AE_MENTOR_HOME: home, AE_MENTOR_FIXTURE_STATE: state }, key: "sk-ant-api03-T022KEY_abcdefghijklm", baseUrl: svc.url });
    const r1 = await m.turn("/ease-mentor");
    assert.equal(r1.ok, true, JSON.stringify(r1.error));
    assert.deepEqual(r1.events.map((e) => e.kind), ["say", "tool", "say"]);
    assert.equal(r1.events[1].name, "snapshot_project");
    assert.equal(r1.events[1].ok, true);
    const r2 = await m.turn("go on");
    assert.equal(r2.ok, true);
    assert.ok(m.cost > 0);
    assert.equal(m.costUnknownTurns, 0);
    assert.deepEqual(Object.keys(m.info).sort(), ["effort", "model", "settings_hash"]);
    assert.equal(m.info.model, "claude-opus-5-5");
    assert.ok(m.promptHashes["ease-mentor"]);
    assert.ok(fs.existsSync(m.requestLog));
    // The key is in no request line.
    assert.equal(fs.readFileSync(m.requestLog, "utf8").includes("T022KEY"), false);
    await m.stop();
  } finally {
    await svc.close();
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test("the real helper: a turn the service fails ends the case with an error kind, not a hang", async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "AEMentor-t022-"));
  const svc = await startFakeService();
  try {
    const m = createCaseMentor({ repo: REPO, home, fixtureEnv: { AE_MENTOR_HOME: home }, key: "sk-ant-api03-T022KEY_abcdefghijklm", baseUrl: svc.url });
    // Nothing scripted: the fake answers 500 and the helper ends the turn with an error.
    const r = await m.turn("/ease-mentor");
    assert.equal(r.ok, false);
    assert.ok(r.error);
    await m.stop();
  } finally {
    await svc.close();
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test("helperHashFiles: the helper's code, texts, the settings file in use and the price table", () => {
  const names = helperHashFiles(REPO).map((f) => path.relative(REPO, f));
  for (const n of ["panel/helper/main.mjs", "panel/helper/lib/loop.mjs", "panel/helper/settings.json", "panel/helper/preamble.md", "panel/helper/prices.json", "panel/helper/skill-tool.json"]) assert.ok(names.includes(n), n);
  const other = helperHashFiles(REPO, "/tmp/other-settings.json").map((f) => f);
  assert.ok(other.includes("/tmp/other-settings.json"));
  assert.ok(!other.some((f) => f.endsWith("panel/helper/settings.json")));
  for (const f of helperHashFiles(REPO)) assert.ok(fs.existsSync(f), f);
});

test("startHelper: a start the helper refuses rejects with its kind", async () => {
  await assert.rejects(startHelper({ repo: REPO, home: os.tmpdir(), fixtureEnv: {}, settingsFile: "/nonexistent/settings.json", key: "sk-ant-api03-x_abcdefghijklmnop" }), (e) => e.kind === "start_failed");
});

// ---------- T068 follow-ups: the runner's own limit, and the helper's log on a failed turn ----------

const FAKE_KEY = "sk-ant-api03-FAKEKEY_abcdefghij";

// A stand-in helper: ready on start; on `send`, "hang" never answers, "fail" ends the turn not ok.
// Its stderr carries log lines, a key-shaped string (as if an upstream message had leaked one) and
// 6000 characters of filler first, so the cap and the scrub both have work to do.
function fakeHelperDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fake-helper-"));
  fs.writeFileSync(
    path.join(dir, "main.mjs"),
    `import readline from "node:readline";
const out = (o) => process.stdout.write(JSON.stringify(o) + "\\n");
readline.createInterface({ input: process.stdin }).on("line", (l) => {
  const c = JSON.parse(l);
  if (c.type === "start") { out({ type: "ready", model: "m", effort: "e", settings_hash: "s" }); }
  else if (c.type === "send") {
    process.stderr.write("x".repeat(6000) + "\\n");
    process.stderr.write(JSON.stringify({ event: "response_timing", ms: 1234 }) + "\\n");
    process.stderr.write(JSON.stringify({ event: "stall", note: "${FAKE_KEY}" }) + "\\n");
    if (c.text === "timing") {
      process.stderr.write(JSON.stringify({ event: "request_no_headers", retry: 0, ms: 90, name: "TimeoutError", code: null, reached: false }) + "\\n");
      process.stderr.write(JSON.stringify({ event: "response_went_quiet", request_id: "req_a", silent_ms: 30000, ms: 31000 }) + "\\n");
      process.stderr.write(JSON.stringify({ event: "request_sent_again", turn: 1, attempt: 1, started: false }) + "\\n");
      process.stderr.write(JSON.stringify({ event: "response_timing", request_id: "req_b", status: 200, headers_ms: 400, max_gap_ms: 900, total_ms: 5000, end: "done", note: "${FAKE_KEY}" }) + "\\n");
      out({ type: "turn_end", ok: true, cost_usd: 0.01 });
    }
    if (c.text === "fail") { out({ type: "error", kind: "stall" }); out({ type: "turn_end", ok: false, cost_usd: 0.01 }); }
  } else if (c.type === "stop") process.exit(0);
});
`,
  );
  return dir;
}

test("scrubKey: the exact key and anything key-shaped are replaced", () => {
  assert.equal(scrubKey(`a ${FAKE_KEY} b sk-ant-other_ONE-12345 c`, FAKE_KEY), "a [key] b [key] c");
  assert.equal(scrubKey(undefined, FAKE_KEY), "");
});

test("startHelper: the runner's own wait gets the runner_timeout kind, not the helper's `timeout`", async () => {
  assert.equal(RUNNER_TIMEOUT, "runner_timeout");
  const dir = fakeHelperDir();
  try {
    const h = await startHelper({ repo: REPO, home: os.tmpdir(), key: FAKE_KEY, helperDir: dir, turnWaitMs: 400 });
    const r = await h.send("hang");
    assert.equal(r.ok, false);
    assert.equal(r.error, "runner_timeout");
    await h.stop();
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("a failed A turn keeps the helper's log in the results, scrubbed and capped; a good turn adds nothing", async () => {
  const dir = fakeHelperDir();
  try {
    const m = createCaseMentor({
      repo: REPO,
      home: os.tmpdir(),
      key: FAKE_KEY,
      startHelper: (o) => startHelper({ ...o, helperDir: dir, turnWaitMs: 400 }),
    });
    const bad = await m.turn("fail");
    assert.equal(bad.ok, false);
    assert.equal(bad.error, "stall");
    assert.ok(bad.stderr.length <= STDERR_CAP);
    const f = m.failedTurns;
    assert.equal(f.length, 1);
    assert.deepEqual(Object.keys(f[0]).sort(), ["error", "helper_stderr", "turn"]);
    assert.equal(f[0].turn, 1);
    assert.equal(f[0].error, "stall");
    // The helper's own log lines reach the results (the end of the log is kept).
    assert.match(f[0].helper_stderr, /response_timing/);
    assert.match(f[0].helper_stderr, /"event":"stall"/);
    assert.ok(f[0].helper_stderr.length <= STDERR_CAP);
    // The key never reaches the results, by the exact string or its shape.
    const all = JSON.stringify([bad, f]);
    assert.equal(all.includes("sk-ant-"), false);
    assert.equal(all.includes("FAKEKEY"), false);
    // A runner timeout is a failed turn with its own label.
    const hung = await m.turn("hang");
    assert.equal(hung.error, "runner_timeout");
    assert.equal(m.failedTurns.length, 2);
    assert.equal(m.failedTurns[1].turn, 2);
    await m.stop();
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("a case with no failed turn has no failed_turns", async () => {
  const fake = async () => ({ ready: { model: "m" }, send: async () => ({ events: [], ok: true, error: null, cost_usd: 0.1, end: null }), stop: async () => {} });
  const m = createCaseMentor({ repo: REPO, home: "/tmp/x", key: "k", startHelper: fake });
  await m.turn("hi");
  assert.deepEqual(m.failedTurns, []);
});

test("closeCase returns failed_turns only when a turn failed, and each runner writes them to its results", async () => {
  const ab = await import("../ab.mjs");
  const mk = (failedTurns) => ({ stop: async () => {}, info: null, requestLog: path.join(os.tmpdir(), "no-such-request-log.jsonl"), cost: 0, costUnknownTurns: 0, otherModelTurns: 0, promptHashes: {}, failedTurns });
  const none = await ab.closeCase({ repo: REPO, mentor: mk([]), learnerTexts: [] });
  assert.equal("failed_turns" in none, false);
  const one = await ab.closeCase({ repo: REPO, mentor: mk([{ turn: 2, error: "stall", helper_stderr: "x" }]), learnerTexts: [] });
  assert.deepEqual(one.failed_turns, [{ turn: 2, error: "stall", helper_stderr: "x" }]);
  for (const set of ["easing", "key-types", "speed-graph", "offset", "anchor", "null-parenting"]) {
    const src = fs.readFileSync(path.join(REPO, "product", "evals", set, "run.mjs"), "utf8");
    assert.match(src, /failed_turns: fin\.failed_turns/, set);
  }
});

test("parseLogLine keeps timing and stall events as numbers and short labels, drops the rest, scrubs", () => {
  const t = parseLogLine(JSON.stringify({ at: "x", event: "response_timing", request_id: "req_1", status: 200, headers_ms: 10, max_gap_ms: 20, total_ms: 30, end: "done", extra: "no" }), "k");
  assert.deepEqual(t, { kind: "timing", entry: { request_id: "req_1", status: 200, headers_ms: 10, max_gap_ms: 20, total_ms: 30, end: "done" } });
  const e = parseLogLine(JSON.stringify({ event: "request_sent_again", turn: 3, attempt: 1, started: true }), "k");
  assert.equal(e.kind, "event");
  assert.equal(e.entry.event, "request_sent_again");
  assert.equal(e.entry.attempt, 1);
  assert.equal(parseLogLine(JSON.stringify({ event: "input_transformations", entries: [] }), "k"), null);
  assert.equal(parseLogLine("not json", "k"), null);
  const leak = parseLogLine(JSON.stringify({ event: "service_error", detail: `bad ${FAKE_KEY} here` }), FAKE_KEY);
  assert.equal(JSON.stringify(leak).includes("FAKEKEY"), false);
});

test("a good turn's request timing and re-send events reach the case (T068), with body sizes only when the counts agree", async () => {
  const dir = fakeHelperDir();
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "timing-home-"));
  try {
    const m = createCaseMentor({ repo: REPO, home, key: FAKE_KEY, startHelper: (o) => startHelper({ ...o, helperDir: dir, turnWaitMs: 2000 }) });
    const r = await m.turn("timing");
    assert.equal(r.ok, true);
    await m.stop();
    assert.deepEqual(m.failedTurns, []);
    // Two attempts ended (no headers, then timing) but the request log is empty: no sizes.
    assert.deepEqual(m.requestTiming, [{ turn: 1, request_id: "req_b", status: 200, headers_ms: 400, max_gap_ms: 900, total_ms: 5000, end: "done" }]);
    assert.deepEqual(m.requestEvents.map((e) => e.event), ["request_no_headers", "response_went_quiet", "request_sent_again"]);
    assert.equal(JSON.stringify([m.requestTiming, m.requestEvents]).includes("FAKEKEY"), false);
    // Two logged requests of known size, in order: the sizes line up.
    fs.writeFileSync(m.requestLog, "a".repeat(99) + "\n" + "b".repeat(199) + "\n");
    assert.deepEqual(requestSizes(m.requestLog), [99, 199]);
    assert.equal(m.requestTiming[0].body_bytes, 199);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test("closeCase carries request_timing and request_events only when there are some, and every runner writes them", async () => {
  const ab = await import("../ab.mjs");
  const mk = (extra) => ({ stop: async () => {}, info: null, requestLog: path.join(os.tmpdir(), "no-such-request-log.jsonl"), cost: 0, costUnknownTurns: 0, otherModelTurns: 0, promptHashes: {}, failedTurns: [], ...extra });
  const none = await ab.closeCase({ repo: REPO, mentor: mk({ requestTiming: [], requestEvents: [] }), learnerTexts: [] });
  assert.equal("request_timing" in none, false);
  assert.equal("request_events" in none, false);
  const b1like = await ab.closeCase({ repo: REPO, mentor: mk({}), learnerTexts: [] });
  assert.equal("request_timing" in b1like, false);
  const one = await ab.closeCase({ repo: REPO, mentor: mk({ requestTiming: [{ turn: 1, total_ms: 5 }], requestEvents: [{ turn: 1, event: "request_sent_again" }] }), learnerTexts: [] });
  assert.deepEqual(one.request_timing, [{ turn: 1, total_ms: 5 }]);
  assert.deepEqual(one.request_events, [{ turn: 1, event: "request_sent_again" }]);
  for (const set of ["easing", "key-types", "speed-graph", "offset", "anchor", "null-parenting", "next-mentor"]) {
    const src = fs.readFileSync(path.join(REPO, "product", "evals", set, "run.mjs"), "utf8");
    assert.match(src, /request_timing: fin\.request_timing/, set);
    assert.match(src, /request_events: fin\.request_events/, set);
  }
});

test("timing-report: counts, re-sends, maxima and the slowest five", () => {
  const timing = (n, total, gap = 10) => ({ turn: n, request_id: "r" + n, status: 200, headers_ms: total / 10, max_gap_ms: gap, total_ms: total, end: "done" });
  const results = {
    cases: [
      { id: "01", runs: [{ request_timing: [timing(1, 1000), timing(2, 9000, 700), timing(3, 300)], request_events: [{ turn: 2, event: "request_sent_again" }, { turn: 2, event: "response_went_quiet" }] }] },
      { id: "02", runs: [{ request_timing: [timing(1, 2000), timing(2, 3000), timing(3, 4000), timing(4, 500)] }, { cost: 1 }] },
    ],
  };
  const s = summarize(results);
  assert.equal(s.requests, 7);
  assert.equal(s.resends, 1);
  assert.equal(s.quiet, 1);
  assert.equal(s.runs, 3);
  assert.equal(s.runs_with_timing, 2);
  assert.equal(s.max_headers_ms, 900);
  assert.equal(s.max_gap_ms, 700);
  assert.deepEqual(s.slowest.map((t) => `${t.case}/${t.turn}`), ["01/2", "02/3", "02/2", "02/1", "01/1"]);
  assert.match(format("f", s), /01\/run 1\/turn 2: 9000 ms/);
  assert.match(format("f", summarize({ cases: [] })), /no timing/);
});

test("a skill_loaded event maps to a Skill tool event at its place in the order (the hand-over, case ask 19)", () => {
  const r = mapTurn([
    { type: "turn_start" },
    { type: "tool_call", id: "a", name: "go_deeper", input: { skill: "anchor-mentor" } },
    { type: "tool_result", id: "a", name: "go_deeper", ok: true, text: "{}" },
    { type: "skill_loaded", skill: "anchor-mentor" },
    { type: "tool_call", id: "b", name: "anchor_snapshot", input: {} },
    { type: "tool_result", id: "b", name: "anchor_snapshot", ok: true, text: "{}" },
    { type: "turn_end", ok: true, cost_usd: 0.01 },
  ]);
  assert.deepEqual(r.events.map((e) => (e.kind === "tool" ? e.name : e.kind)), ["go_deeper", "Skill", "anchor_snapshot"]);
  assert.deepEqual(r.events[1], { kind: "tool", name: "Skill", input: { skill: "anchor-mentor" }, ok: true, result: "" });
  // A skill_loaded with no name adds nothing.
  assert.equal(mapTurn([{ type: "skill_loaded" }, { type: "turn_end", ok: true, cost_usd: 0 }]).events.length, 0);
});
