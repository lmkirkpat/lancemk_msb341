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
  assert.deepEqual(r.summary, { learner_eased: 1, still_linear: 2, partly_eased: 0, total_for_learner: 3 });
  assert.equal(r.passed, false);
});

test("without a demo, every eased target counts for the learner", () => {
  const r = diff(before, fixture("attempt-eased-one"), lesson(null));
  assert.equal(results(r)[POS1], "eased_by_learner");
  assert.deepEqual(r.summary, { learner_eased: 2, still_linear: 2, partly_eased: 0, total_for_learner: 4 });
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
  assert.deepEqual(r.summary, { learner_eased: 3, still_linear: 0, partly_eased: 0, total_for_learner: 3 });
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

// Key values (recorded since T039's snapshot change). Synthetic fixtures predate them, so these
// tests add values to copies.
const withValues = (snap) => {
  const s = structuredClone(snap);
  for (const l of s.layers) for (const p of l.properties) p.keys.forEach((k, i) => (k.value = [100 + i * 10, 100 + i * 10]));
  return s;
};
const scaleKeys = (s) => s.layers[0].properties.find((p) => p.match_name === "ADBE Scale").keys;

test("a changed value on a target property is noted, and the pair still counts as linear", () => {
  const was = withValues(before);
  const now = withValues(before);
  scaleKeys(now)[1].value = [125, 125];
  const r = diff(was, now, lesson());
  assert.equal(r.targets.find((t) => t.segment_id === SCALE).result, "still_linear");
  assert.deepEqual(r.unexpected_changes, [`Title › Scale value changed at ${scaleKeys(now)[1].time} s`]);
});

test("snapshots without values (older fixtures) never report a value change", () => {
  const now = withValues(before);
  scaleKeys(now)[1].value = [125, 125];
  assert.deepEqual(diff(before, now, lesson()).unexpected_changes, []);
  assert.deepEqual(diff(withValues(before), before, lesson()).unexpected_changes, []);
});

test("an eased target with unchanged values adds no note", () => {
  const r = diff(withValues(before), withValues(fixture("attempt-complete")), lesson());
  assert.deepEqual(r.unexpected_changes, []);
  assert.equal(r.passed, true);
});

// ---- Panel session 1 fixes (usage notes, spec 002 FR-006/FR-007 as amended 2026-10-06) ----

// A copy of `snap` with one pair's two facing sides set: "linear" or "bezier" (eased).
function withSides(snap, segId, startSide, endSide) {
  const s = structuredClone(snap);
  const at = segId.lastIndexOf("/");
  const [layerIndex, propPath, key] = [Number(segId.split("/")[0]), segId.slice(segId.indexOf("/") + 1, at), Number(segId.slice(at + 1))];
  const prop = s.layers.find((l) => l.index === layerIndex).properties.find((p) => p.path === propPath);
  prop.keys[key - 1].out_type = startSide;
  prop.keys[key].in_type = endSide;
  return s;
}

test("one key eased and the other still linear is partly_eased, names the linear end, and blocks a pass", () => {
  const complete = fixture("attempt-complete");
  const half = withSides(complete, POS2, "bezier", "linear");
  const r = diff(before, half, lesson());
  assert.equal(results(r)[POS2], "partly_eased");
  const t = r.targets.find((x) => x.segment_id === POS2);
  assert.equal(t.linear_end, "end");
  assert.equal(typeof t.linear_key_time, "number");
  assert.equal(r.summary.partly_eased, 1);
  assert.equal(r.passed, false);

  const startOnly = diff(before, withSides(complete, POS2, "linear", "bezier"), lesson());
  assert.equal(startOnly.targets.find((x) => x.segment_id === POS2).linear_end, "start");
});

test("an undone demo pair becomes the learner's: redoing it counts as eased_by_learner", () => {
  const complete = fixture("attempt-complete");
  // A check while the demo is undone flags it.
  const undone = diff(before, withSides(complete, POS1, "linear", "linear"), lesson());
  assert.equal(undone.demo_undone, true);
  assert.equal(undone.targets.find((t) => t.segment_id === POS1).demo_undone, true);
  // The next check, with the session remembering the undo, credits the learner.
  const redone = diff(before, complete, { ...lesson(), demo: { segment_id: POS1, at: "2026-10-01T12:01:00.000Z", undone: "2026-10-01T12:05:00.000Z" } });
  assert.equal(results(redone)[POS1], "eased_by_learner");
  assert.equal(redone.summary.total_for_learner, 4);
  assert.equal(redone.summary.learner_eased, 4);
  assert.equal(redone.passed, true);
  assert.equal(redone.demo_undone, true);
});

test("a demo left in place is still credited to the demo, and demo_undone is false", () => {
  const r = diff(before, fixture("attempt-complete"), lesson());
  assert.equal(results(r)[POS1], "eased_by_demo");
  assert.equal(r.demo_undone, false);
});

test("a partly eased demo pair counts as undone too", () => {
  const r = diff(before, withSides(fixture("attempt-complete"), POS1, "bezier", "linear"), lesson());
  assert.equal(results(r)[POS1], "partly_eased");
  assert.equal(r.demo_undone, true);
});

// ---- The demo's fingerprint: 33.33 (set-ease.jsx) vs F9's 33.333 (A + C, 2026-10-06) ----

function withInfluence(snap, segId, startInf, endInf) {
  const s = withSides(snap, segId, "bezier", "bezier");
  const at = segId.lastIndexOf("/");
  const prop = s.layers.find((l) => l.index === Number(segId.split("/")[0])).properties.find((p) => p.path === segId.slice(segId.indexOf("/") + 1, at));
  const k = Number(segId.slice(at + 1));
  const set = (list, inf) => (inf === null ? [] : (list.length ? list : [{}]).map(() => ({ speed: 0, influence: inf })));
  prop.keys[k - 1].out_ease = set(prop.keys[k - 1].out_ease, startInf);
  prop.keys[k].in_ease = set(prop.keys[k].in_ease, endInf);
  return s;
}

test("the demo in place (33.33 on both sides) is the demo's", () => {
  const r = diff(before, withInfluence(fixture("attempt-complete"), POS1, 33.33, 33.33), lesson());
  const t = r.targets.find((x) => x.segment_id === POS1);
  assert.equal(t.result, "eased_by_demo");
  assert.equal(t.demo_credit, "demo");
  assert.equal(r.demo_undone, false);
});

test("F9 on the shared key overwrites one side; the other still has the fingerprint, so it's still the demo", () => {
  const r = diff(before, withInfluence(fixture("attempt-complete"), POS1, 33.33, 33.333), lesson());
  assert.equal(results(r)[POS1], "eased_by_demo");
});

test("undone and redone with F9, with no check in between: no fingerprint left, so it's the learner's", () => {
  const r = diff(before, withInfluence(fixture("attempt-complete"), POS1, 33.333, 33.333), lesson());
  const t = r.targets.find((x) => x.segment_id === POS1);
  assert.equal(t.result, "eased_by_learner");
  assert.equal(t.demo_credit, "learner_redo");
  assert.equal(r.demo_undone, true);
  assert.equal(r.summary.total_for_learner, 4);
});

test("after a check saw it undone, the credit says so", () => {
  const r = diff(before, withInfluence(fixture("attempt-complete"), POS1, 33.333, 33.333),
    { ...lesson(), demo: { segment_id: POS1, at: "x", undone: "y" } });
  assert.equal(r.targets.find((x) => x.segment_id === POS1).demo_credit, "learner_after_undo");
});

test("no ease values to compare: credit is unknown, it stays with the demo, and the mentor asks (C)", () => {
  const r = diff(before, withInfluence(fixture("attempt-complete"), POS1, null, null), lesson());
  const t = r.targets.find((x) => x.segment_id === POS1);
  assert.equal(t.result, "eased_by_demo");
  assert.equal(t.demo_credit, "unknown");
  assert.equal(r.demo_undone, false);
});
