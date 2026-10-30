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
import { mapTurn, takeEvalKey, helperEnv, createCaseMentor, helperHashFiles, KEY_VAR, startHelper } from "../runtime-a.mjs";
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
  assert.deepEqual(await m.turn("hi"), { events: [], ok: false, error: "start_failed" });
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
