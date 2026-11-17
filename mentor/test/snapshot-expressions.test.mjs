// Spec 015 T010 to T013: the expressions pass, effects, samples[].base and the sweeps in
// mentor/jsx/snapshot.jsx, run in node:vm against a mock After Effects (the pattern of
// snapshot-layer-info.test.mjs). The mock pins the logic only; the live answer keys are T015's
// captures in fixtures/expressions/.

import { test } from "node:test";
import assert from "node:assert/strict";
import { comp, LONG, run } from "./fixtures/expressions/mock-ae.mjs";

test("T010: every expression, keyed or not, in any group; markers and the hidden dimension skipped", () => {
  const s = run(comp());
  assert.equal(s.expressions_read, "all");
  assert.deepEqual(s.expressions.map((x) => [x.layer, x.path, x.group]), [
    [1, "ADBE Transform Group/ADBE Position", "transform"],
    [1, "ADBE Transform Group/ADBE Rotate Z", "transform"],
    [3, "ADBE Effect Parade/CC Light Sweep#1/CC Light Sweep-0001", "effect"],
    [4, "ADBE Transform Group/ADBE Position", "transform"],
    [5, "ADBE Transform Group/ADBE Scale", "transform"],
    [6, "ADBE Transform Group/ADBE Position_0", "transform"],
    [7, "ADBE Transform Group/ADBE Position", "transform"],
    [8, "ADBE Transform Group/ADBE Opacity", "transform"],
    [9, "ADBE Text Properties/ADBE Text Document", "text"],
  ]);
  const sweep = s.expressions.find((x) => x.layer === 3);
  assert.equal(sweep.display_path, "Effects › CC Light Sweep › Center");
  assert.deepEqual([sweep.enabled, sweep.active, sweep.error, sweep.keys, sweep.text_cut], [true, true, null, 0, false]);
  assert.equal(sweep.text, 'thisComp.layer("Shaker").transform.position');
  assert.ok(!("_prop" in sweep), "no live handle leaves the snippet");
});

test("T010: an erroring expression is on with its error and not active (T001); an off one is off", () => {
  const s = run(comp());
  const broken = s.expressions.find((x) => x.layer === 4);
  assert.deepEqual([broken.enabled, broken.active, broken.error], [true, false, "Expression disabled. Error at line 1"]);
  const off = s.expressions.find((x) => x.layer === 5);
  assert.deepEqual([off.enabled, off.active, off.error], [false, false, null]);
});

test("T010: text over 20,000 characters is cut with its full length; an error is cut at 300", () => {
  const s = run(comp());
  const long = s.expressions.find((x) => x.layer === 8);
  assert.equal(long.text.length, 20000);
  assert.equal(long.text_length, LONG.length);
  assert.equal(long.text_cut, true);
  const layers = comp();
  layers[3].property("ADBE Transform Group").property("ADBE Position").expressionError = "e".repeat(400);
  assert.equal(run(layers).expressions.find((x) => x.layer === 4).error.length, 300);
});

test("T011: every effect is named, keyed or not", () => {
  const s = run(comp());
  assert.deepEqual(s.layer_info.find((l) => l.name === "Swept").effects, [
    { name: "CC Light Sweep", match_name: "CC Light Sweep" }, { name: "Blur", match_name: "ADBE Gaussian Blur 2" },
  ]);
  assert.deepEqual(s.layer_info.find((l) => l.name === "Child").effects, []);
});

test("T012: samples carry base only for active transform expressions, read before the expression", () => {
  const s = run(comp(), { sample_times: [1.3] });
  const shaker = s.layer_info.find((l) => l.name === "Shaker");
  const at = shaker.samples.find((x) => x.time === 1.3);
  assert.deepEqual(Object.keys(at.base).sort(), ["position", "rotation"]);
  assert.deepEqual(at.base.position, [960, 540, 0]);
  assert.equal(at.base.rotation, 0);
  assert.notDeepEqual(at.position, at.base.position, "the sample's own value is after the expression");
  // Separated: the base Position comes from X and Y before the expression.
  const sep = s.layer_info.find((l) => l.name === "Sep").samples.find((x) => x.time === 1.3);
  assert.deepEqual(sep.base, { position: [300, 200] });
  assert.deepEqual(sep.position, [313, 200]);
  // No base on an erroring, off, effect-only or expression-free layer.
  for (const n of ["Child", "Swept", "Broken", "Off", "Words"]) {
    assert.ok(s.layer_info.find((l) => l.name === n).samples.every((x) => !("base" in x)), n);
  }
});

test("T013: a coarse sweep for every active transform expression; a fine one only for measure_layers", () => {
  const coarse = run(comp());
  assert.deepEqual(coarse.expression_sweeps.map((w) => [w.layer, w.path.split("/")[1], w.kind]), [
    [1, "ADBE Position", "coarse"], [1, "ADBE Rotate Z", "coarse"], [6, "ADBE Position_0", "coarse"],
    [7, "ADBE Position", "coarse"], [8, "ADBE Opacity", "coarse"],
  ]);
  assert.deepEqual(coarse.measured_layers, []);
  const pos = coarse.expression_sweeps[0];
  assert.equal(pos.sampled_every, 0.167);
  assert.equal(pos.varies, true);
  assert.ok(pos.max_offset > 5 && pos.max_offset < 14, String(pos.max_offset));
  const still = coarse.expression_sweeps.find((w) => w.layer === 7);
  assert.deepEqual([still.varies, still.max_offset], [false, 0], "a constant expression doesn't vary (E19)");

  const fine = run(comp(), { measure_layers: [1] });
  assert.deepEqual(fine.measured_layers, [1]);
  const f = fine.expression_sweeps.filter((w) => w.kind === "fine");
  assert.deepEqual(f.map((w) => w.path.split("/")[1]), ["ADBE Position", "ADBE Rotate Z"]);
  assert.equal(f[0].sampled_every, Math.round((1 / 30) * 1000) / 1000, "one frame: 4 s / 240 is shorter");
  assert.ok(f[0].max_offset >= pos.max_offset, "the fine sweep finds at least the coarse peak");
  assert.ok(f[0].max_at >= 0.5 && f[0].max_at < 0.7, String(f[0].max_at));
});

test("without the new args the snippet still returns every older field as before", () => {
  const s = run(comp());
  for (const k of ["project", "comp", "precomp_layers", "layers", "layer_info", "host"]) assert.ok(k in s, k);
  assert.ok(s.layer_info.every((l) => typeof l.effect_count === "number"));
});

test("review S3 (FR-018): a property the walk can't read makes the read partial, with the count, never all", async () => {
  const layers = comp();
  const fx = layers[2].property("ADBE Effect Parade");
  const real = fx.property;
  fx.property = (n) => { if (n === 2) throw new Error("unreadable"); return real(n); };
  const s = run(layers);
  assert.deepEqual(s.expressions_read, { status: "not_read", reason: "partial", skipped: 1 });
  assert.ok(s.expressions.length > 0, "what was read is kept in the snapshot");
  const { expressionReads, linksIn } = await import("../lib/expressions.mjs");
  assert.deepEqual(expressionReads(s).read, { status: "not_read", reason: "partial", skipped: 1 });
  for (const [, e] of linksIn(s)) assert.equal(e.status, "not_read", "so 'no links' is never said");
  assert.equal(run(comp()).expressions_read, "all");
});

test("review S4: the sweeps stop at their budget; the rest say not read (budget), measured layers go first, and the snapshot stays whole", async () => {
  const { layer } = await import("./fixtures/expressions/mock-ae.mjs");
  const many = [];
  for (let i = 1; i <= 70; i++) {
    many.push(layer(i, `Drift ${i}`, { transform: { position: { value: [100, 100, 0], expr: { text: "value + [time * 10, 0]", fn: (t, v) => [v[0] + t * 10, v[1], v[2]] } } } }));
  }
  const s = run(many, { measure_layers: [70] });
  assert.equal(s.expressions_read, "all");
  assert.equal(s.expressions.length, 70);
  const done = s.expression_sweeps.filter((w) => w.status !== "not_read");
  const budget = s.expression_sweeps.filter((w) => w.status === "not_read");
  assert.equal(done.length, 60, "SWEEP_MAX_COUNT sweeps run");
  assert.ok(budget.length > 0 && budget.every((w) => w.reason === "budget"));
  assert.deepEqual(done.filter((w) => w.layer === 70).map((w) => w.kind), ["coarse", "fine"], "the measured layer's sweeps run first");
  assert.equal(s.layer_info.length, 70);
  const { expressionReads } = await import("../lib/expressions.mjs");
  const last = expressionReads(s).list.find((x) => x.layer === "Drift 69");
  assert.deepEqual(last.moves, { status: "not_read", reason: "budget" });
  const { analyze } = await import("../lib/analyze.mjs");
  assert.doesNotThrow(() => analyze(s), "an easing snapshot is still a valid snapshot");
});
