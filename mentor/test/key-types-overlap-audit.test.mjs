// Overlap audit 2026-10-29 (discovery/usage-notes/overlap-audit-2026-10-29.md), key types rows OA-7 to
// OA-10 (spec 009 tasks T442 to T445). Live captures from fixtures/key-types; OA-10 adds an expression
// to a copy of one.

import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze, check, OPACITY_PATH } from "../lib/key-types.mjs";
import { load } from "./fixtures/key-types/load.mjs";

const B = (i) => `1/${OPACITY_PATH}/${i}`;
const BLINK = [{ layer: "Blink", property: "Opacity" }];
const CUT = [{ layer: "Cut", property: "Opacity" }];

function grade(baseline, current, refs, { should_move } = {}) {
  const skill_options = { focus: refs, should_move: should_move || [] };
  const lesson = { comp_id: baseline.comp.id, baseline, targets: analyze(baseline, { skill_options }).targets, skill_options, demo: null };
  return check(baseline, current, lesson);
}

// mixed-pair.json: Blink's 1 s key linear out, its 1.4 s key hold in. After Effects snaps it at 1 s (L-1).
test("OA-7: a should-move pair held on its end key only is a should-move hold, and blocks the pass", () => {
  const r = grade(load("practice2b.json"), load("mixed-pair.json"), CUT, { should_move: BLINK });
  assert.equal(r.should_move_held.length, 1, JSON.stringify(r.should_move_held));
  assert.deepEqual(
    { layer: r.should_move_held[0].layer, from_time: r.should_move_held[0].from_time, waits_until: r.should_move_held[0].waits_until },
    { layer: "Blink", from_time: 1, waits_until: 1.4 },
  );
  assert.equal(r.should_move_held[0].hold_on_end, true, "the hold is on the key at the end of the pair");
  assert.equal(r.items.none_should_move_held, false);
  assert.equal(r.passed, false);
});

test("OA-7: a should-move pair held at its first key has no end-key flag", () => {
  const r = grade(load("practice2b.json"), load("blink-one-held.json"), CUT, { should_move: BLINK });
  assert.equal(r.should_move_held.length, 1);
  assert.equal(r.should_move_held[0].hold_on_end, undefined);
});

test("OA-8: a mixed pair outside the focus is an extra hold, not only a generic change", () => {
  const r = grade(load("practice2b.json"), load("mixed-pair.json"), CUT);
  assert.deepEqual(r.extra_holds, [{ layer: "Blink", property: "Opacity", time: 1 }]);
  assert.ok(!r.other_changes.some((n) => /^Blink › Opacity was changed/.test(n)), r.other_changes.join("; "));
});

test("OA-9: holding a pause pair inside the focus isn't reported as a change outside the lesson", () => {
  const r = grade(load("practice2b.json"), load("select-all-hold.json"), [{ layer: "Pause", property: "Position" }]);
  assert.deepEqual(r.pairs.map((p) => p.verdict), ["held_by_learner", "held_by_learner"]);
  assert.ok(!r.other_changes.some((n) => n.startsWith("Pause")), r.other_changes.join("; "));
});

test("OA-10: an expression turned on over a held focus isn't graded as held", () => {
  const now = structuredClone(load("blink-all-held.json"));
  now.layers.find((l) => l.name === "Blink").properties.find((p) => p.path === OPACITY_PATH).expression_enabled = true;
  const r = grade(load("practice2b.json"), now, BLINK);
  assert.deepEqual(r.pairs.map((p) => [p.id, p.verdict]), [[B(1), "expression"], [B(2), "expression"], [B(3), "expression"]]);
  assert.equal(r.items.held, false);
  assert.equal(r.passed, false);
});

test("OA-10: without the expression the same hold passes (control)", () => {
  const r = grade(load("practice2b.json"), load("blink-all-held.json"), BLINK);
  assert.ok(r.pairs.every((p) => p.verdict === "held_by_learner"));
  assert.equal(r.passed, true);
});
