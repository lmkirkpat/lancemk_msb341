// Spec 015 T062 (a): with read R2, a keyed expression follows the same "on and no error" rule as an
// unkeyed one (T001: AE plays the keys under an erroring expression). An erroring keyed expression
// no longer leaves its layer out of the pivot lesson, the pivot demo or the null demo, and doesn't
// set the null jump line's expression flag. Without R2 (a snapshot from before spec 015, or R2 not
// fully read), the keyed-only rule is unchanged: an expression switched on over keys counts.
// On the live captures: 015 Planted (Over Keys, keyed Position) and Mentor Overlaps (Gauge Dial,
// keyed Rotation).

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { candidates, demoRefusal } from "../lib/anchor.mjs";
import { demoTarget } from "../lib/null-parenting.mjs";
import { check as nullCheck } from "../lib/null-parenting-check.mjs";
import { expressionDrives } from "../lib/expressions.mjs";
import { FIXTURES } from "./helpers.mjs";

const load = (name) => JSON.parse(fs.readFileSync(path.join(FIXTURES, "expressions", `${name}.json`), "utf8"));
const PLANTED = load("planted");
const OVERLAPS = load("overlaps");

const older = (s) => { const o = structuredClone(s); delete o.expressions; delete o.expressions_read; return o; };
const partial = (s) => ({ ...structuredClone(s), expressions_read: { status: "not_read", reason: "partial" } });
const indexOf = (s, name) => s.layer_info.find((l) => l.name === name).index;
// The layer's expressions as R2 reads them when they error (the keyed read still says switched on,
// as AE 27.0 reports it: T001).
const erroring = (s, name) => {
  const o = structuredClone(s);
  for (const x of o.expressions) if (x.layer === indexOf(o, name)) x.error = "Error at line 1 in property of layer";
  return o;
};
const switchedOffInRead = (s, name) => {
  const o = structuredClone(s);
  for (const x of o.expressions) if (x.layer === indexOf(o, name)) x.enabled = false;
  return o;
};

const reason = (s, name) => candidates(s).find((c) => c.layer === name).reason;
const entry = (s, name) => s.layer_info.find((l) => l.name === name);

test("pivot: a keyed Position expression that errors no longer gives the expression reason", () => {
  assert.equal(reason(PLANTED, "Over Keys"), "expression_anchor_position", "on, no error: left out as before");
  const err = erroring(PLANTED, "Over Keys");
  assert.notEqual(reason(err, "Over Keys"), "expression_anchor_position");
  // Its Position keys still decide, as for any keyed layer without an expression.
  const noExpr = structuredClone(PLANTED);
  noExpr.expressions = noExpr.expressions.filter((x) => x.layer !== indexOf(noExpr, "Over Keys"));
  noExpr.layers.find((l) => l.index === indexOf(noExpr, "Over Keys")).properties.forEach((p) => { p.expression_enabled = false; });
  assert.equal(reason(err, "Over Keys"), reason(noExpr, "Over Keys"));
});

test("pivot: a keyed Rotation expression that errors is a candidate again, and the demo doesn't refuse it for the expression", () => {
  assert.equal(reason(OVERLAPS, "Gauge Dial"), "expression_rotation_scale");
  assert.equal(demoRefusal(OVERLAPS, entry(OVERLAPS, "Gauge Dial")), "expression_rotation_scale");
  const err = erroring(OVERLAPS, "Gauge Dial");
  assert.notEqual(reason(err, "Gauge Dial"), "expression_rotation_scale");
  assert.equal(demoRefusal(err, entry(err, "Gauge Dial")), null);
  const off = switchedOffInRead(OVERLAPS, "Gauge Dial");
  assert.notEqual(reason(off, "Gauge Dial"), "expression_rotation_scale", "switched off in the read: not a source either");
});

test("pivot demo: an erroring keyed Position expression is refused for its keys, not for the expression", () => {
  assert.equal(demoRefusal(PLANTED, entry(PLANTED, "Over Keys")), "expression");
  const err = erroring(PLANTED, "Over Keys");
  assert.equal(demoRefusal(err, entry(err, "Over Keys")), "anchor_or_position_keyed");
});

test("pivot: without R2 the keyed-only rule is unchanged, whatever the read would have said", () => {
  for (const s of [older(erroring(PLANTED, "Over Keys")), partial(erroring(PLANTED, "Over Keys"))]) {
    assert.equal(reason(s, "Over Keys"), "expression_anchor_position");
    assert.equal(demoRefusal(s, entry(s, "Over Keys")), "expression");
  }
  for (const s of [older(erroring(OVERLAPS, "Gauge Dial")), partial(erroring(OVERLAPS, "Gauge Dial"))]) {
    assert.equal(reason(s, "Gauge Dial"), "expression_rotation_scale");
    assert.equal(demoRefusal(s, entry(s, "Gauge Dial")), null, "before spec 015 the demo never refused keyed Rotation");
  }
});

test("null demo target: an erroring keyed Position expression doesn't rule the layer out", () => {
  assert.equal(demoTarget(PLANTED, ["Over Keys"]), null, "on, no error: ruled out as before");
  assert.equal(demoTarget(erroring(PLANTED, "Over Keys"), ["Over Keys"]), "parent/Over Keys");
  assert.equal(demoTarget(older(erroring(PLANTED, "Over Keys")), ["Over Keys"]), null, "without R2, as before");
  assert.equal(demoTarget(partial(erroring(PLANTED, "Over Keys")), ["Over Keys"]), null);
});

const nullLesson = (base, focus) => ({ comp_id: base.comp.id, skill: "parenting.null", mode: "lesson", baseline: base, focus, targets: focus.map((n) => `parent/${n}`), demo_target: null, demo: null, skill_data: {}, exclude: [] });
const flag = (s, focus, name) => nullCheck(s, s, nullLesson(s, focus), {}).result.layers.find((l) => l.layer === name).expression_on_move;

test("null check: expression_on_move is false for an erroring keyed expression, and as before without R2", () => {
  const focus = ["Over Keys", "Joined"];
  assert.equal(flag(PLANTED, focus, "Over Keys"), true);
  assert.equal(flag(erroring(PLANTED, "Over Keys"), focus, "Over Keys"), false);
  assert.equal(flag(older(erroring(PLANTED, "Over Keys")), focus, "Over Keys"), true, "without R2: keyed and switched on");
});

test("expressionDrives: the read decides with R2, the keyed properties without it", () => {
  const i = indexOf(PLANTED, "Over Keys");
  const POS = ["ADBE Transform Group/ADBE Position"];
  const kp = PLANTED.layers.find((l) => l.index === i).properties;
  assert.equal(expressionDrives(PLANTED, i, POS, kp), true);
  assert.equal(expressionDrives(erroring(PLANTED, "Over Keys"), i, POS, kp), false);
  assert.equal(expressionDrives(older(PLANTED), i, POS, kp), true);
  assert.equal(expressionDrives(older(PLANTED), i, POS, []), false);
  assert.equal(expressionDrives(older(PLANTED), i, POS), false);
});
