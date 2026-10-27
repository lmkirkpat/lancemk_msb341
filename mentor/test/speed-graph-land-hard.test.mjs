// Spec 004 tasks-wave-b T199b (FR-047; data-model › Loose-ends pass): speed_graph_snapshot names
// the land-hard pairs in plain words (`landing_hard_labels`, in pairs[].label's form, from the
// lesson's baseline), and step 1's two-call flow keeps a stored land-hard choice across a resume.
// Fixture mode with a temp AE_MENTOR_HOME. speed-graph-tools.test.mjs stands unchanged.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;
const setProject = (rel) => fs.writeFileSync(stateFile, JSON.stringify({ project: path.join(FIXTURES, rel) }));
setProject("speed-graph/practice-now.json");

const { TOOLS } = await import("../tools/index.mjs");
const session = await import("../lib/session.mjs");
const call = async (args = {}) => JSON.parse((await TOOLS.find((t) => t.name === "speed_graph_snapshot").handler(args)).content[0].text);

const KEY = JSON.parse(fs.readFileSync(path.join(FIXTURES, "speed-graph", "answer-key.json"), "utf8"));
const P3 = KEY.ids.P3;
const P3_LABEL = "Title › Position 3–4.367 s";

beforeEach(() => {
  for (const f of ["session.json", "learner.json", "fixture-edits.json"]) fs.rmSync(path.join(home, f), { force: true });
  setProject("speed-graph/practice-now.json");
});

test("(a) a land-hard pair is named in pairs[].label's form, next to landing_hard unchanged", async () => {
  const r = await call({ skill_options: { eased_layers: ["Title"], land_hard: [P3] } });
  assert.deepEqual(r.landing_hard, [P3]);
  assert.deepEqual(r.landing_hard_labels, [P3_LABEL]);
});

test("(a) the label has the same form pairs[].label gives the same pair when it's a target", async () => {
  const r = await call({ skill_options: { eased_layers: ["Title"], land_hard: [] } });
  const asTarget = r.pairs.find((p) => p.id === P3);
  assert.ok(asTarget, "P3 is a target when nothing lands hard");
  assert.equal(asTarget.label, P3_LABEL);
});

test("(b) no land-hard pairs: an empty list", async () => {
  const r = await call({ skill_options: { eased_layers: ["Title"], land_hard: [] } });
  assert.deepEqual(r.landing_hard_labels, []);
  const bare = await call();
  assert.deepEqual(bare.landing_hard_labels, []);
});

test("(c) an id that names no pair in the baseline: null in its place, order kept", async () => {
  const r = await call({ skill_options: { eased_layers: ["Title"], land_hard: ["99/ADBE Transform Group/ADBE Position/1", P3] } });
  assert.deepEqual(r.landing_hard_labels, [null, P3_LABEL]);
});

test("(d) the two-call flow: first without skill_options is new, then with eased_layers continues from the same baseline", async () => {
  const first = await call();
  assert.equal(first.lesson, "new");
  const baseline = session.currentLesson().baseline;
  const second = await call({ skill_options: { eased_layers: ["Title"], land_hard: [] } });
  assert.equal(second.lesson, "continued");
  assert.equal(second.stored_choices, false);
  assert.deepEqual(session.currentLesson().baseline, baseline);
});

test("(e) resumed after another comp's lesson, a call without skill_options keeps the land-hard choice and names it", async () => {
  await call();
  await call({ skill_options: { eased_layers: ["Title"], land_hard: [P3] } });
  setProject("practice2-before.json");
  await call();
  setProject("speed-graph/practice-now.json");
  const back = await call();
  assert.equal(back.lesson, "resumed");
  assert.equal(back.stored_choices, true);
  assert.deepEqual(back.landing_hard, [P3]);
  assert.deepEqual(back.landing_hard_labels, [P3_LABEL]);
});
