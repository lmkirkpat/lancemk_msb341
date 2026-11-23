// Spec 014 T073 (K3, FR-033; data-model § 5): the four keyframe skills' snapshots carry spec 015's
// `motion_from` for their focus and candidate layers, on a read with R2, and nothing on an older read,
// so replies on the eval sets' older captures stay as they were. Easing's findings are unchanged (the
// spec 015 analyze-unchanged tests, run in the same suite, cover the analyzers themselves).

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
const PRACTICE = path.join(FIXTURES, "expressions", "practice.json");
const PRACTICE2 = path.join(FIXTURES, "expressions", "practice2.json");
const use = (file) => fs.writeFileSync(stateFile, JSON.stringify({ project: file }));
use(PRACTICE);
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;

const { TOOLS } = await import("../tools/index.mjs");
const { motionFrom } = await import("../lib/motion-sources.mjs");
const { analyze } = await import("../lib/analyze.mjs");
const call = async (name, args = {}) => JSON.parse((await TOOLS.find((t) => t.name === name).handler(args)).content[0].text);
const load = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const indexOf = (snap, name) => snap.layer_info.find((l) => l.name === name).index;

// A copy of a capture without read R2, written next to it in the temp folder.
function withoutR2(file) {
  const s = load(file);
  for (const k of ["expressions", "expressions_read", "expression_sweeps", "measured_layers"]) delete s[k];
  const out = path.join(home, `noR2-${path.basename(file)}`);
  fs.writeFileSync(out, JSON.stringify(s));
  return out;
}

beforeEach(() => {
  for (const f of fs.readdirSync(home)) if (f.startsWith("session.json") || f.startsWith("learner.json")) fs.rmSync(path.join(home, f));
  use(PRACTICE);
});

test("easing: motion_from names Title's parent CTRL (by keys) and Logo's own Rotation expression, in spec 015's shape", async () => {
  const r = await call("snapshot_project");
  const snap = load(PRACTICE);
  assert.deepEqual(r.motion_from.Title, motionFrom(snap, indexOf(snap, "Title")));
  assert.deepEqual(r.motion_from.Title.parents, [{ layer: "CTRL", by: "keys" }]);
  assert.equal(r.motion_from.Title.own_keys, true);
  for (const f of r.findings) assert.ok(f.layer in r.motion_from, `${f.layer} has an entry`);
  if ("Logo" in r.motion_from) assert.deepEqual(r.motion_from.Logo.own_expressions, ["Rotation"]);
});

test("easing's findings are the same with and without the field (analyze is untouched)", async () => {
  const r = await call("snapshot_project");
  assert.deepEqual(r.findings, analyze(load(PRACTICE)).findings);
});

test("key types, speed graph and offset carry it for their focus and candidates", async () => {
  use(PRACTICE2);
  const kt = await call("key_types_snapshot");
  for (const c of kt.candidates) assert.ok(c.layer in kt.motion_from, `key types: ${c.layer}`);
  use(PRACTICE);
  const sg = await call("speed_graph_snapshot");
  for (const p of sg.pairs) assert.ok(p.layer in sg.motion_from, `speed graph: ${p.layer}`);
  use(PRACTICE2);
  const off = await call("offset_snapshot");
  assert.ok(off.group, "practice 2 has a group");
  for (const m of off.group.members) assert.ok(m.layer in off.motion_from, `offset: ${m.layer}`);
});

test("on a read without R2 there's no motion_from field at all (eval captures unchanged)", async () => {
  use(withoutR2(PRACTICE));
  assert.equal("motion_from" in (await call("snapshot_project")), false);
  assert.equal("motion_from" in (await call("speed_graph_snapshot")), false);
  use(withoutR2(PRACTICE2));
  assert.equal("motion_from" in (await call("key_types_snapshot")), false);
  assert.equal("motion_from" in (await call("offset_snapshot")), false);
});

test("no reply without a hand-in carries a hand-in field or a hand-in mode source", async () => {
  for (const [file, tool] of [[PRACTICE, "snapshot_project"], [PRACTICE2, "key_types_snapshot"], [PRACTICE, "speed_graph_snapshot"], [PRACTICE2, "offset_snapshot"]]) {
    use(file);
    const r = await call(tool);
    assert.equal("hand_in" in r, false, tool);
    assert.ok(!["hand_in", "hand_in_lost"].includes(r.mode_source), tool);
  }
});
