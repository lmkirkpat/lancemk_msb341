// Spec 015 T025 (SC-005 (a) to (d), US3 scenario 4): the same K2 replays through the three checks
// that compare keys (offset, key types, speed graph), on T015's live captures (AE 27.0). They list
// other changes as sentences. (a) Pan Behind's values on Shake Control and (d) a base Position edit
// are unkeyed changes, so they're reported as that layer's property; (b) the playhead moving and
// (c) a renumber under a wiggle give nothing.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { check as offsetCheck } from "../lib/offset.mjs";
import { check as keyTypesCheck } from "../lib/key-types.mjs";
import { check as speedGraphCheck } from "../lib/speed-graph.mjs";
import { FIXTURES } from "./helpers.mjs";

const load = (name) => JSON.parse(fs.readFileSync(path.join(FIXTURES, "expressions", `${name}.json`), "utf8"));
// Other changes don't depend on the lesson's targets, so each lesson has none.
const lesson = (base) => ({ comp_id: base.comp.id, baseline: base, targets: [], mode: "lesson", skill_options: {}, exclude: [] });
const CHECKS = {
  offset: (b, c) => offsetCheck(b, c, lesson(b)).other_changes,
  key_types: (b, c) => keyTypesCheck(b, c, lesson(b)).other_changes,
  speed_graph: (b, c) => speedGraphCheck(b, c, lesson(b)).other_changes,
};
const RIG = load("rig");

for (const [name, run] of Object.entries(CHECKS)) {
  test(`${name}: SC-005 (a), Pan Behind's values on Shake Control are reported as its Anchor Point, and only that`, () => {
    assert.deepEqual(run(RIG, load("rig-panned")), ["Shake Control › Anchor Point was changed (not part of this lesson)"]);
  });
  test(`${name}: SC-005 (b), only the playhead moved: nothing`, () => {
    assert.deepEqual(run(RIG, load("rig-later")), []);
  });
  test(`${name}: SC-005 (c), a null renumbers a wiggle below it: nothing on that layer`, () => {
    const list = run(load("planted"), load("planted-renumbered"));
    assert.ok(!list.some((s) => /Wiggle|Index Link|Offset Link/.test(s)), JSON.stringify(list));
  });
  test(`${name}: SC-005 (d), a hand edit to Shake Control's base Position is reported as its Position`, () => {
    assert.deepEqual(run(RIG, load("rig-moved")), ["Shake Control › Position was changed (not part of this lesson)"]);
  });
}
