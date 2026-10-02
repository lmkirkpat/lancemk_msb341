// FR-007: checking the learner's attempt against the lesson baseline (data-model.md › Check result).

import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze } from "../lib/analyze.mjs";
import { diff } from "../lib/diff.mjs";
import { fixture } from "./helpers.mjs";

const POS1 = "1/ADBE Transform Group/ADBE Position/1";
const POS2 = "1/ADBE Transform Group/ADBE Position/2";
const SCALE = "1/ADBE Transform Group/ADBE Scale/1";
const OPACITY = "1/ADBE Transform Group/ADBE Opacity/1";

const before = fixture("attempt-before");
const lesson = (demo = POS1) => ({
  comp_id: before.comp.id,
  targets: analyze(before, { focus_layers: ["Title"] }).targets,
  demo: demo ? { segment_id: demo, at: "2026-10-01T12:01:00.000Z" } : null,
});
const results = (r) => Object.fromEntries(r.targets.map((t) => [t.segment_id, t.result]));

test("the demo pair is credited to the demo and left out of the learner's total", () => {
  const r = diff(before, fixture("attempt-eased-one"), lesson());
  assert.equal(r.comp_matches, true);
  assert.deepEqual(results(r), { [POS1]: "eased_by_demo", [POS2]: "eased_by_learner", [SCALE]: "still_linear", [OPACITY]: "still_linear" });
  assert.deepEqual(r.summary, { learner_eased: 1, still_linear: 2, total_for_learner: 3 });
  assert.equal(r.passed, false);
});

test("without a demo, every eased target counts for the learner", () => {
  const r = diff(before, fixture("attempt-eased-one"), lesson(null));
  assert.equal(results(r)[POS1], "eased_by_learner");
  assert.deepEqual(r.summary, { learner_eased: 2, still_linear: 2, total_for_learner: 4 });
});

test("labels name the layer, the property and the times", () => {
  const r = diff(before, fixture("attempt-eased-one"), lesson());
  assert.deepEqual(r.targets.map((t) => t.label), [
    "Title › Position 0–1 s",
    "Title › Position 1–2 s",
    "Title › Scale 0.5–1.5 s",
    "Title › Opacity 0–0.5 s",
  ]);
  assert.equal(r.lesson_comp, "Lower Third");
});

test("a complete attempt passes with no unexpected changes", () => {
  const r = diff(before, fixture("attempt-complete"), lesson());
  assert.equal(r.passed, true);
  assert.deepEqual(r.summary, { learner_eased: 3, still_linear: 0, total_for_learner: 3 });
  assert.deepEqual(r.unexpected_changes, []);
});

test("nothing eased: every learner target is still linear", () => {
  const r = diff(before, before, lesson(null));
  assert.deepEqual(new Set(Object.values(results(r))), new Set(["still_linear"]));
  assert.equal(r.passed, false);
});

test("if the learner undoes the demo, that pair is still linear and blocks a pass", () => {
  const r = diff(before, fixture("attempt-before"), lesson());
  assert.equal(results(r)[POS1], "still_linear");
  assert.equal(r.summary.still_linear, 4);
  assert.equal(r.passed, false);
});

test("a removed key reports the pair as removed and notes the key count", () => {
  const r = diff(before, fixture("attempt-removed-key"), lesson());
  assert.equal(results(r)[POS2], "removed");
  assert.ok(r.unexpected_changes.includes("Title › Position now has 2 keys (was 3)"), r.unexpected_changes.join("; "));
  assert.equal(r.passed, true, "a removed pair isn't linear, so it doesn't block the pass");
});

test("changes outside the lesson are listed in plain language, not graded", () => {
  const r = diff(before, fixture("attempt-untargeted"), lesson());
  assert.equal(r.passed, true);
  assert.deepEqual(r.unexpected_changes, ["Subtitle › Opacity was changed (not part of this lesson)"]);
});

test("a different comp isn't graded", () => {
  const r = diff(before, fixture("attempt-other-comp"), lesson());
  assert.equal(r.comp_matches, false);
  assert.deepEqual(r.targets, []);
  assert.equal(r.passed, false);
  assert.equal(r.lesson_comp, "Lower Third");
});

test("overdone ease (100% influence) counts as eased (E1)", () => {
  const r = diff(before, fixture("attempt-overdone"), lesson());
  assert.equal(results(r)[SCALE], "eased_by_learner");
  assert.equal(r.passed, true);
});

test("an undone attempt is still linear, even with leftover ease values (E1)", () => {
  const r = diff(before, fixture("attempt-undone"), lesson(null));
  assert.deepEqual(new Set(Object.values(results(r))), new Set(["still_linear"]));
  assert.equal(r.passed, false);
});

test("renamed or reordered layers are noted, since segment ids use layer indexes", () => {
  const moved = structuredClone(fixture("attempt-complete"));
  moved.layers[1].name = "Tagline";
  const r = diff(before, moved, lesson());
  assert.ok(r.unexpected_changes.includes("Layer 2 is now \"Tagline\" (was \"Subtitle\")"), r.unexpected_changes.join("; "));
});
