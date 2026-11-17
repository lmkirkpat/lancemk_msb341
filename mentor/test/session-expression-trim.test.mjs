// Spec 015 OQ-9 (option 4, approved 2026-11-16): session.json keeps the baseline's expression text
// and error while the lesson runs, and clears them once the lesson's record is saved or the lesson
// can't be continued. The checks' replies are byte-identical either way (FR-028), the record's guard
// still refuses a copy in a later turn on a fresh server (B1), and calls.jsonl never keeps a refused
// copy (FR-020).

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
fs.writeFileSync(stateFile, JSON.stringify({ project: path.join(FIXTURES, "expressions", "rig.json") }));
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;

const session = await import("../lib/session.mjs");
const { check: anchorCheck } = await import("../lib/anchor-check.mjs");
const { check: nullCheck } = await import("../lib/null-parenting-check.mjs");
const { clearExpressionText, expressionTextDiffers, textHash } = await import("../lib/expression-trim.mjs");
const { commonTools, COPY_RUN } = await import("../tools/common.mjs");
const { MESSAGES } = await import("../errors.mjs");

const SESSION = path.join(home, "session.json");
const CALLS = path.join(home, "calls.jsonl");
const SERVER = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "server.mjs");
const load = (name) => JSON.parse(fs.readFileSync(path.join(FIXTURES, "expressions", `${name}.json`), "utf8"));
const RIG = load("rig");
const PLANTED = load("planted");
const savedBaseline = () => {
  const s = JSON.parse(fs.readFileSync(SESSION, "utf8"));
  return s.lessons[String(s.current)].baseline;
};

beforeEach(() => {
  for (const f of [SESSION, CALLS, path.join(home, "learner.json")]) fs.rmSync(f, { force: true });
});

// The four FR-014 cases on one expression of `base`, as reads of the comp now.
function cases(base) {
  const pick = (snap) => snap.expressions.find((x) => x.path.endsWith("ADBE Rotate Z")) || snap.expressions.find((x) => !x.error);
  const edit = (f) => {
    const now = structuredClone(base);
    f(pick(now));
    return now;
  };
  return {
    unchanged: structuredClone(base),
    text: edit((x) => { x.text = `${x.text}\r// tweaked`; x.text_length = x.text.length; }),
    toggled: edit((x) => Object.assign(x, { enabled: false, active: false })),
    error: edit((x) => Object.assign(x, { error: "Error at line 1 in property of layer 4", active: false })),
  };
}

// Every reply field of both checks for one baseline against one read.
function replies(base, now) {
  const rock = base.layer_info.find((l) => l.name === "rock.png") || base.layer_info[0];
  const anchorLesson = { comp_id: base.comp.id, baseline: base, targets: [`anchor/${rock.index}`], skill_options: { focus: [{ layer: rock.name, place: "top-right" }] }, exclude: [] };
  const focus = [base.layer_info[0].name];
  const nullLesson = { comp_id: base.comp.id, skill: "parenting.null", mode: "lesson", baseline: base, focus, targets: [], demo_target: null, demo: null, skill_data: {}, exclude: [] };
  return JSON.stringify([anchorCheck(base, now, anchorLesson), nullCheck(base, now, nullLesson, {}).result]);
}

for (const [label, SNAP] of [["015 Rig", RIG], ["015 Planted (two erroring expressions)", PLANTED]]) {
  test(`${label}: while the lesson runs, the baseline read back from session.json gives the same check replies`, () => {
    session.start(structuredClone(SNAP));
    const fromFile = savedBaseline();
    assert.deepEqual(fromFile.expressions, SNAP.expressions, "text and error kept while the lesson runs");
    for (const [what, now] of Object.entries(cases(SNAP))) assert.equal(replies(fromFile, now), replies(SNAP, now), what);
  });

  test(`${label}: after the record is saved, session.json holds no expression text, and the checks reply byte for byte as before`, () => {
    session.start(structuredClone(SNAP));
    session.markChecked(true);
    session.markPassSaved();
    const text = fs.readFileSync(SESSION, "utf8");
    for (const x of SNAP.expressions) {
      for (const t of [x.text, x.error]) {
        if (typeof t !== "string" || t.length < COPY_RUN) continue; // shorter ones are words like "value"
        assert.ok(!text.includes(JSON.stringify(t).slice(1, 25)), `no copy of: ${t.slice(0, 30)}`);
        assert.ok(!text.includes(t.slice(0, 24)), `no raw copy of: ${t.slice(0, 30)}`);
      }
    }
    const cleared = savedBaseline();
    for (const [i, x] of cleared.expressions.entries()) {
      assert.equal(x.text, undefined);
      assert.equal(x.cleared, true);
      assert.equal(x.text_hash, textHash(SNAP.expressions[i].text));
      assert.equal(x.text_length, SNAP.expressions[i].text_length);
      assert.equal(x.error, SNAP.expressions[i].error ? true : null);
    }
    const c = cases(SNAP);
    for (const [what, now] of Object.entries(c)) assert.equal(replies(cleared, now), replies(SNAP, now), what);
  });
}

test("the four cases really differ: changed text is still reported as changed text from a cleared baseline", () => {
  const cleared = clearExpressionText(structuredClone(RIG));
  const c = cases(RIG);
  const whats = (now) => JSON.parse(replies(cleared, now))[0].other_changes.filter((o) => o.kind === "expression_changed").map((o) => o.what);
  assert.deepEqual(whats(c.unchanged), []);
  assert.deepEqual(whats(c.text), ["text"]);
  assert.deepEqual(whats(c.toggled), ["turned_off"]);
  assert.deepEqual(whats(c.error), ["error"]);
});

test("FR-018: a cleared side whose text can't be told is changed, never the same; uncleared entries compare as before", () => {
  assert.equal(expressionTextDiffers({ cleared: true }, { text: "wiggle(2, 30)" }), true);
  assert.equal(expressionTextDiffers({ cleared: true, text_hash: textHash("a") }, { cleared: true }), true);
  assert.equal(expressionTextDiffers({ cleared: true, text_hash: textHash("a\rb") }, { text: "a\rb" }), false, "line ends as read");
  assert.equal(expressionTextDiffers({ cleared: true, text_hash: textHash("a\rb") }, { text: "a\nb" }), true);
  assert.equal(expressionTextDiffers({}, {}), false, "two entries without text: as before spec 015 OQ-9");
  assert.equal(clearExpressionText({ comp: {} }).expressions, undefined, "a snapshot from before spec 015 is left as it is");
  const twice = clearExpressionText(clearExpressionText(structuredClone(RIG)));
  assert.deepEqual(twice, clearExpressionText(structuredClone(RIG)), "clearing again changes nothing");
});

test("a session.json saved before OQ-9 (text in a passed lesson) is cleared when another lesson starts; an open one keeps its text", () => {
  const other = structuredClone(PLANTED);
  other.comp = { ...other.comp, id: other.comp.id + 1000 };
  fs.writeFileSync(SESSION, JSON.stringify({
    version: 1, current: other.comp.id, lessons: {
      [String(other.comp.id)]: { lesson_id: "2026-11-10T10:00:00.000Z", comp_id: other.comp.id, skill: "easing.basic", mode: "lesson", baseline: other, focus: [], targets: [], passed: true, pass_saved: true, status: "checked" },
      "offset.basic|1": { lesson_id: "2026-11-10T10:00:00.000Z", comp_id: 1, skill: "offset.basic", mode: "lesson", baseline: structuredClone(PLANTED), focus: [], targets: [], passed: false, status: "started" },
    },
  }));
  session.start(structuredClone(RIG));
  const s = JSON.parse(fs.readFileSync(SESSION, "utf8"));
  assert.ok(s.lessons[String(other.comp.id)].baseline.expressions.every((x) => x.cleared && x.text === undefined));
  assert.deepEqual(s.lessons["offset.basic|1"].baseline.expressions, PLANTED.expressions, "can still be resumed and checked");
  assert.deepEqual(s.lessons[String(RIG.comp.id)].baseline.expressions, RIG.expressions, "the new lesson keeps its text");
});

test("a second record after the pass is saved is refused as already saved, before the guard", async () => {
  const TOOLS = commonTools({ skills: ["easing.basic"], finders: {} });
  const record = (over) => TOOLS.find((t) => t.name === "record_lesson").handler({
    skill: "easing.basic", project: RIG.project, comp: RIG.comp.name, attempted: "Eased the sweep", result: "passed", demo_used: false,
    summary: "Eased both keys of the sweep.", next: "Try a longer move.", ...over,
  });
  session.start(structuredClone(RIG));
  session.markChecked(true);
  assert.equal(JSON.parse((await record({})).content[0].text).saved, true);
  const shake = RIG.expressions.find((x) => x.path.endsWith("ADBE Position")).text;
  await assert.rejects(record({ summary: `See ${shake.slice(0, 40)}` }), (e) => e.code === "LESSON_ALREADY_SAVED");
});

// ---- B1: a fresh server each turn

function startServer() {
  const child = spawn(process.execPath, [SERVER], {
    env: { ...process.env, AE_MENTOR_HOME: home, AE_MENTOR_FIXTURE_STATE: stateFile },
    stdio: ["pipe", "pipe", "inherit"],
  });
  const waiting = new Map();
  let buf = "";
  let nextId = 1;
  child.stdout.on("data", (chunk) => {
    buf += chunk;
    let nl;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const msg = JSON.parse(buf.slice(0, nl));
      buf = buf.slice(nl + 1);
      waiting.get(msg.id)?.(msg);
      waiting.delete(msg.id);
    }
  });
  const request = (method, params) => new Promise((resolve) => {
    const id = nextId++;
    waiting.set(id, resolve);
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
  });
  const call = async (name, args = {}) => (await request("tools/call", { name, arguments: args })).result;
  const stop = () => new Promise((r) => { child.on("exit", r); child.kill(); });
  return { request, call, stop };
}

async function turn(f) {
  const server = startServer();
  await server.request("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test" } });
  try {
    return await f(server);
  } finally {
    await server.stop();
  }
}

test("B1: the guard refuses a copy in a later turn on a fresh server, with the same reply, and calls.jsonl keeps no copied text", async () => {
  const shake = RIG.expressions.find((x) => x.path.endsWith("ADBE Position")).text;
  const at = shake.indexOf("impacts =");
  const run = shake.slice(at, at + COPY_RUN + 6);
  await turn(async (s) => assert.equal((await s.call("snapshot_project")).isError, undefined));
  const args = {
    skill: "easing.basic", project: RIG.project, comp: RIG.comp.name, result: "not_checked", demo_used: false,
    attempted: "Looked at the sweep", summary: `The null runs ${run} on its Position.`, next: `Look at ${run}`,
  };
  const reply = await turn((s) => s.call("record_lesson", args));
  assert.equal(reply.isError, true);
  assert.deepEqual(reply.content, [{ type: "text", text: `RECORD_HAS_EXPRESSION: ${MESSAGES.RECORD_HAS_EXPRESSION}` }], "FR-028: the reply as before");
  assert.equal(fs.existsSync(path.join(home, "learner.json")), false, "nothing saved");

  const log = fs.readFileSync(CALLS, "utf8");
  assert.ok(!log.includes(run.slice(0, COPY_RUN)), "no copied text in calls.jsonl");
  const line = log.trim().split("\n").map(JSON.parse).filter((c) => c.tool === "record_lesson").pop();
  assert.equal(line.ok, false);
  assert.equal(line.error_code, "RECORD_HAS_EXPRESSION");
  assert.deepEqual(line.omitted_fields, ["summary", "next"]);
  assert.deepEqual(Object.keys(line.args).sort(), ["attempted", "comp", "demo_used", "project", "result", "skill"]);
  assert.equal(line.args.attempted, "Looked at the sweep", "the field without a copy is kept");
});

test("other refusals are logged with their arguments, as before", async () => {
  await turn(async (s) => {
    await s.call("snapshot_project");
    await s.call("set_ease", { segment_id: "not-the-target" });
  });
  const line = fs.readFileSync(CALLS, "utf8").trim().split("\n").map(JSON.parse).filter((c) => c.tool === "set_ease").pop();
  assert.equal(line.ok, false);
  assert.deepEqual(line.args, { segment_id: "not-the-target" });
  assert.equal("omitted_fields" in line, false);
});
