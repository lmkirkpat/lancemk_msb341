// Review S1: a lesson whose baseline was read before spec 015 merged (no `base`, no expressions) and
// whose check read comes after it. On an expression-driven layer, comparing base against a value
// after the expression would invent a change; values compare on base only when both reads have it.
// The baseline is T015's live 015 Rig with spec 015's fields taken out, as main's snippet reads it
// (T016 showed the two snippets read identically apart from those fields).

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { check as anchorCheck } from "../lib/anchor-check.mjs";
import { check as nullCheck, p2For } from "../lib/null-parenting-check.mjs";
import { check as offsetCheck } from "../lib/offset.mjs";
import { check as keyTypesCheck } from "../lib/key-types.mjs";
import { check as speedGraphCheck } from "../lib/speed-graph.mjs";
import { baseViews, pairValues } from "../lib/k2-changes.mjs";
import { FIXTURES } from "./helpers.mjs";

const load = (name) => JSON.parse(fs.readFileSync(path.join(FIXTURES, "expressions", `${name}.json`), "utf8"));
function beforeMerge(snap) {
  const s = structuredClone(snap);
  for (const k of ["expressions", "expressions_read", "expression_sweeps", "measured_layers"]) delete s[k];
  for (const l of s.layer_info) { delete l.effects; for (const x of l.samples) delete x.base; }
  return s;
}
const OLD = beforeMerge(load("rig"));
const NEW = load("rig"); // the same comp, read after the merge, same playhead
const LATER = load("rig-later"); // after the merge, playhead moved
const rock = OLD.layer_info.find((l) => l.name === "rock.png");
const pivotLesson = { comp_id: OLD.comp.id, baseline: OLD, targets: [`anchor/${rock.index}`], skill_options: { focus: [{ layer: "rock.png", place: "top-right" }] }, exclude: [] };
const nullLesson = { comp_id: OLD.comp.id, skill: "parenting.null", mode: "lesson", baseline: OLD, focus: ["White Solid 1"], targets: [], demo_target: null, demo: null, skill_data: {}, exclude: [] };
const keyed = { comp_id: OLD.comp.id, baseline: OLD, targets: [], mode: "lesson", skill_options: {}, exclude: [] };

for (const [label, now] of [["the same playhead", NEW], ["the playhead moved", LATER]]) {
  test(`old baseline, new check read (${label}): no check reports a change on Shake Control or rock.png`, () => {
    const p = anchorCheck(OLD, now, pivotLesson);
    assert.deepEqual(p.other_changes, []);
    assert.deepEqual(p.layers[0].item5.moved_layers, []);
    assert.equal(p.layers[0].item2.passed, true);
    assert.deepEqual(nullCheck(OLD, now, nullLesson, {}).result.other_changes, []);
    for (const run of [offsetCheck, keyTypesCheck, speedGraphCheck]) assert.deepEqual(run(OLD, now, keyed).other_changes, [], run.name);
    assert.equal(p2For(OLD, now, "rock.png", { times: [0.6, 2.636] }).passed, true, "the jump check too");
  });
}

test("pairValues and baseViews use base only where both sides have it", () => {
  const shake = (s) => s.layer_info.find((l) => l.name === "Shake Control").samples.find((x) => x.time === 0.6);
  assert.deepEqual(pairValues(shake(OLD), shake(NEW), "position"), [shake(OLD).position, shake(NEW).position]);
  assert.deepEqual(pairValues(shake(NEW), shake(NEW), "position"), [[960, 540, 0], [960, 540, 0]]);
  const [a, b] = baseViews(OLD, NEW);
  assert.equal(a, OLD);
  assert.equal(b, NEW, "one side without base: both as read");
  const [c] = baseViews(NEW, LATER);
  assert.deepEqual(shake(c).position, [960, 540, 0], "both with base: base");
});
