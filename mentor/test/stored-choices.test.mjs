// Spec 004 tasks-wave-b T186 (second pass; FR-043, FR-046, research R26, data-model › Loose-ends
// pass › tool reply fields): speed_graph_snapshot, key_types_snapshot and offset_snapshot pass
// session.start()'s stored_choices into their replies. In fixture mode with a temp AE_MENTOR_HOME,
// each with that skill's own skill_options. snapshot_project (easing) doesn't get the key.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;
const setProject = (file) => fs.writeFileSync(stateFile, JSON.stringify({ project: path.join(FIXTURES, file) }));
setProject("layer-info/practice2b.json");

const { TOOLS } = await import("../tools/index.mjs");
const call = async (name, args = {}) => JSON.parse((await TOOLS.find((t) => t.name === name).handler(args)).content[0].text);

const SESSION = path.join(home, "session.json");
const LEARNER = path.join(home, "learner.json");
beforeEach(() => {
  for (const f of [SESSION, LEARNER, path.join(home, "fixture-edits.json")]) fs.rmSync(f, { force: true });
});

const SG_KEY = JSON.parse(fs.readFileSync(path.join(FIXTURES, "speed-graph", "answer-key.json"), "utf8"));
const sgId = (k) => SG_KEY.ids[k] || k;

// Per skill: the tool, the comp with its lesson, another comp, two sets of choices, and how the
// reply's existing fields show the first set.
const CASES = [
  {
    tool: "speed_graph_snapshot",
    home: "speed-graph/practice-now.json",
    other: "practice2-before.json",
    options: { eased_layers: ["Title"], land_hard: [sgId("P3")] },
    other_options: { eased_layers: ["Title"], land_hard: [] },
    shows: (r) => assert.deepEqual(r.landing_hard, [sgId("P3")]),
  },
  {
    tool: "key_types_snapshot",
    home: "layer-info/practice2b.json",
    other: "speed-graph/practice-now.json",
    options: { focus: [{ layer: "Blink", property: "Opacity" }], should_move: [{ layer: "Card", property: "Position" }] },
    other_options: { focus: [{ layer: "Blink", property: "Opacity" }] },
    shows: (r) => {
      assert.deepEqual(r.focus, ["Blink"]);
      assert.deepEqual(r.should_move, [{ layer: "Card", property: "Position" }]);
    },
  },
  {
    tool: "offset_snapshot",
    home: "layer-info/practice2b.json",
    other: "speed-graph/practice-now.json",
    options: { kind: "layers", order: ["Dot 3", "Dot 2", "Dot 1"], gap_frames: 6 },
    other_options: { kind: "layers", order: ["Dot 1", "Dot 2", "Dot 3"], gap_frames: 4 },
    shows: (r) => {
      assert.deepEqual(r.order, ["Dot 3", "Dot 2", "Dot 1"]);
      assert.equal(r.floor_check.gap_frames, 6);
    },
  },
];

for (const c of CASES) {
  test(`${c.tool}: false on a first call and a continued one, true on a resume without choices, false with them`, async () => {
    setProject(c.home);
    const first = await call(c.tool, { skill_options: c.options });
    assert.equal(first.lesson, "new");
    assert.equal(first.stored_choices, false);
    c.shows(first);

    const continued = await call(c.tool);
    assert.equal(continued.lesson, "continued");
    assert.equal(continued.stored_choices, false);

    setProject(c.other);
    await call(c.tool); // this skill's lesson on another comp
    setProject(c.home);
    const back = await call(c.tool);
    assert.equal(back.lesson, "resumed");
    assert.equal(back.stored_choices, true);
    c.shows(back);

    setProject(c.other);
    await call(c.tool);
    setProject(c.home);
    const sent = await call(c.tool, { skill_options: c.other_options });
    assert.equal(sent.lesson, "resumed");
    assert.equal(sent.stored_choices, false);
  });

  test(`${c.tool}: a resume after another skill's lesson is true too`, async () => {
    setProject(c.home);
    await call(c.tool, { skill_options: c.options });
    await call("snapshot_project"); // easing is current now
    const back = await call(c.tool);
    assert.equal(back.lesson, "resumed");
    assert.equal(back.stored_choices, true);
  });
}

test("snapshot_project's reply has no stored_choices key", async () => {
  setProject("practice-before.json");
  const first = await call("snapshot_project");
  assert.ok(!("stored_choices" in first));
  await call("offset_snapshot");
  setProject("practice-before.json");
  const back = await call("snapshot_project");
  assert.ok(!("stored_choices" in back));
});
