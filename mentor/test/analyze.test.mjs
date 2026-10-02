// FR-002: finding linear keyframe pairs (research R7, data-model.md › Segment).

import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze } from "../lib/analyze.mjs";
import { fixture } from "./helpers.mjs";

const ids = (a) => a.findings.flatMap((f) => f.segments.map((s) => s.id));

test("a pair is linear if either side is linear", () => {
  const a = analyze(fixture("linear-basic"));
  assert.deepEqual(ids(a), ["1/ADBE Transform Group/ADBE Position/1", "1/ADBE Transform Group/ADBE Position/2"]);
  assert.deepEqual(a.counts, { linear: 2, eased: 0, held: 0 });

  const half = analyze(fixture("half-eased"));
  assert.deepEqual(half.counts, { linear: 1, eased: 0, held: 0 }, "key 1 out Bezier, key 2 in linear is still linear");
});

test("a pair is eased when neither side is linear, and held when key i out is hold", () => {
  assert.deepEqual(analyze(fixture("eased")).counts, { linear: 0, eased: 1, held: 0 });
  assert.deepEqual(analyze(fixture("held")).counts, { linear: 0, eased: 0, held: 2 });
  // A hold out side means no motion at all, so the pair isn't flagged even if the next key's in side is linear.
  assert.deepEqual(analyze(fixture("hold-into-linear")).counts, { linear: 0, eased: 0, held: 1 });
});

test("expressions and single keys are skipped with a reason", () => {
  const expr = analyze(fixture("expression"));
  assert.deepEqual(expr.findings, []);
  assert.deepEqual(expr.skipped.map((s) => [s.layer, s.property, s.reason]), [["Logo", "Rotation", "expression"]]);
  const single = analyze(fixture("single-key"));
  assert.deepEqual(single.skipped.map((s) => [s.layer, s.property, s.reason]), [["Logo", "Scale", "single_key"]]);
  assert.equal(single.skipped[0].path, "ADBE Transform Group/ADBE Scale");
});

test("segment ids use the match-name path, and findings carry display_path and times", () => {
  const a = analyze(fixture("linear-basic"));
  assert.deepEqual(a.findings, [
    {
      layer: "Title",
      property: "Position",
      segments: [
        { id: "1/ADBE Transform Group/ADBE Position/1", display_path: "Transform › Position", from_time: 0, to_time: 1, state: "linear" },
        { id: "1/ADBE Transform Group/ADBE Position/2", display_path: "Transform › Position", from_time: 1, to_time: 2, state: "linear" },
      ],
    },
  ]);
  assert.deepEqual(ids(analyze(fixture("separated-xy"))), ["1/ADBE Transform Group/ADBE Position_0/1", "1/ADBE Transform Group/ADBE Position_0/2"]);
  assert.deepEqual(ids(analyze(fixture("nested-trim"))), [
    "1/ADBE Root Vectors Group/ADBE Vector Group#1/ADBE Vectors Group/ADBE Vector Filter - Trim#3/ADBE Vector Trim End/1",
  ]);
  const fx = analyze(fixture("effect"));
  assert.deepEqual(ids(fx), ["1/ADBE Effect Parade/ADBE Gaussian Blur 2#1/ADBE Gaussian Blur 2-0001/1"]);
  assert.equal(fx.findings[0].segments[0].display_path, "Effects › Gaussian Blur › Blurriness");
  assert.equal(fx.findings[0].property, "Blurriness");
});

test("multi-dimension properties (Scale on a 2D layer) are analyzed like any other", () => {
  assert.deepEqual(ids(analyze(fixture("scale-2d"))), ["1/ADBE Transform Group/ADBE Scale/1"]);
});

test("hidden and precomp layers are passed through by name", () => {
  const hidden = analyze(fixture("hidden-layer"));
  assert.deepEqual(hidden.hidden_layers, ["Old Take"]);
  assert.equal(hidden.counts.linear, 2, "pairs on a hidden layer are still reported");
  assert.deepEqual(analyze(fixture("precomp")).precomp_layers, ["Icon"]);
  assert.deepEqual(analyze(fixture("linear-basic")).precomp_layers, []);
});

test("demo_target is the first target on a visible, non-null layer", () => {
  assert.equal(analyze(fixture("linear-basic")).demo_target, "1/ADBE Transform Group/ADBE Position/1");
  assert.equal(analyze(fixture("null-first")).demo_target, "2/ADBE Transform Group/ADBE Opacity/1");
  assert.equal(analyze(fixture("hidden-layer")).demo_target, "2/ADBE Transform Group/ADBE Opacity/1");
  assert.equal(analyze(fixture("null-first"), { focus_layers: ["CTRL"] }).demo_target, null, "a focus with only a null has no demo");
  assert.equal(analyze(fixture("eased")).demo_target, null, "nothing to ease, nothing to demo");
});

test("focus_layers limits targets but not findings", () => {
  const all = analyze(fixture("attempt-before"));
  assert.equal(all.focus, null);
  assert.equal(all.targets.length, 5);
  const title = analyze(fixture("attempt-before"), { focus_layers: ["Title"] });
  assert.deepEqual(title.focus, ["Title"]);
  assert.deepEqual(title.targets, [
    "1/ADBE Transform Group/ADBE Position/1",
    "1/ADBE Transform Group/ADBE Position/2",
    "1/ADBE Transform Group/ADBE Scale/1",
    "1/ADBE Transform Group/ADBE Opacity/1",
  ]);
  assert.deepEqual(title.findings.map((f) => f.layer), ["Title", "Title", "Title", "Subtitle"]);
  assert.deepEqual(title.counts, { linear: 5, eased: 0, held: 0 });
});

test("an unknown focus name throws UNKNOWN_LAYER", () => {
  assert.throws(() => analyze(fixture("attempt-before"), { focus_layers: ["Titel"] }), { code: "UNKNOWN_LAYER" });
  // A precomp layer is a real layer, so focusing on it is allowed (it just has no targets).
  assert.deepEqual(analyze(fixture("precomp"), { focus_layers: ["Icon"] }).targets, []);
});
