// Spec 015 T061: the code half of 011 TD § 21 and 012 TD § 17. With read R2 in the snapshot, an
// expression that drives an unkeyed property counts as a keyed one does: the pivot leaves the layer
// out (Anchor Point or Position, Rotation or Scale) and its demo refuses it; the null skill never
// makes it the demo target and flags it in the jump line (Position, Scale or Rotation). An erroring
// or switched-off expression doesn't drive anything (T001). A snapshot from before spec 015 (no
// `expressions`) or with R2 not fully read gets today's keyed-only replies (FR-018, FR-028).
// On the live captures: 015 Planted, 015 Rig, Comp 1 and Mentor Overlaps.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { analyze as anchorAnalyze, candidates, demoRefusal, refused } from "../lib/anchor.mjs";
import { demoTarget } from "../lib/null-parenting.mjs";
import { check as nullCheck } from "../lib/null-parenting-check.mjs";
import { sourceExpressionOn } from "../lib/expressions.mjs";
import { FIXTURES } from "./helpers.mjs";

const load = (name) => JSON.parse(fs.readFileSync(path.join(FIXTURES, "expressions", `${name}.json`), "utf8"));
const PLANTED = load("planted");
const RIG = load("rig");
const COMP1 = load("comp1");
const OVERLAPS = load("overlaps");

// The same read as a snapshot from before spec 015, and with R2 only partly read.
const older = (s) => { const o = structuredClone(s); delete o.expressions; delete o.expressions_read; return o; };
const partial = (s) => ({ ...structuredClone(s), expressions_read: { status: "not_read", reason: "partial" } });
// One expression changed in place.
const withExpr = (s, layer, f) => {
  const o = structuredClone(s);
  const idx = o.layer_info.find((l) => l.name === layer).index;
  for (const x of o.expressions) if (x.layer === idx) f(x);
  return o;
};

const cand = (s, name) => candidates(s).find((c) => c.layer === name);
const entry = (s, name) => s.layer_info.find((l) => l.name === name);
const bucket = (s, name) => { const c = cand(s, name); return [c.bucket, c.reason]; };

const UNKEYED_AP_POS = ["Joined", "Separated", "Index Link", "Runtime Name", "Wiggle"];
const UNKEYED_ROT = ["Matte Link", "Offset Link"];

// ---- Pivot: leave-out buckets

test("pivot: an unkeyed Position expression (joined or one separated half) is left out with the keyed row's reason", () => {
  for (const n of UNKEYED_AP_POS) assert.deepEqual(bucket(PLANTED, n), ["never", "expression_anchor_position"], n);
  assert.deepEqual(bucket(OVERLAPS, "Drift"), ["never", "expression_anchor_position"]);
});

test("pivot: an unkeyed Rotation expression is left out as a keyed one is, and outranks a matte's allowed-if-named", () => {
  for (const n of UNKEYED_ROT) assert.deepEqual(bucket(PLANTED, n), ["never", "expression_rotation_scale"], n);
});

test("pivot: an unkeyed Anchor Point or Scale expression is left out too (planted on Joined)", () => {
  const anchor = withExpr(PLANTED, "Joined", (x) => { x.path = "ADBE Transform Group/ADBE Anchor Point"; });
  assert.deepEqual(bucket(anchor, "Joined"), ["never", "expression_anchor_position"]);
  const scale = withExpr(PLANTED, "Joined", (x) => { x.path = "ADBE Transform Group/ADBE Scale"; });
  assert.deepEqual(bucket(scale, "Joined"), ["never", "expression_rotation_scale"]);
});

test("pivot: erroring, switched-off and non-transform expressions don't count; keyed ones stay as they were", () => {
  const old = older(PLANTED);
  for (const n of ["Err Transform", "Err Effect", "Off Expr", "Over Keys", "Guide Link", "Comp Ref", "Words"]) {
    assert.deepEqual(bucket(PLANTED, n), bucket(old, n), n);
  }
  assert.notEqual(cand(PLANTED, "Err Transform").reason, "expression_anchor_position", "an erroring expression gives its base value (T001)");
  const off = withExpr(PLANTED, "Joined", (x) => { x.enabled = false; });
  assert.deepEqual(bucket(off, "Joined"), bucket(old, "Joined"), "switched off");
  const err = withExpr(PLANTED, "Joined", (x) => { x.error = "Error at line 1"; });
  assert.deepEqual(bucket(err, "Joined"), bucket(old, "Joined"), "erroring");
});

test("pivot: a snapshot from before spec 015, or with R2 not fully read, keeps today's candidates exactly", () => {
  const keep = (c) => c.map(({ layer, bucket: b, reason }) => [layer, b, reason]);
  for (const s of [PLANTED, OVERLAPS, COMP1, RIG]) {
    const old = keep(candidates(older(s)));
    assert.deepEqual(keep(candidates(partial(s))), old);
    for (const [layer, , reason] of old) {
      if (reason && reason.startsWith("expression_")) assert.deepEqual(bucket(s, layer)[1], reason, `${layer}: a keyed expression keeps its reason`);
    }
  }
  assert.deepEqual(bucket(older(PLANTED), "Joined"), ["default", null], "an older snapshot can't see it, as before");
});

test("pivot: the proposal never names a layer an unkeyed expression drives", () => {
  const p = anchorAnalyze(PLANTED).proposal;
  assert.ok(!p || ![...UNKEYED_AP_POS, ...UNKEYED_ROT].includes(p.layer), JSON.stringify(p));
});

test("pivot: a layer riding on an expression-moved parent stays a candidate (rock.png on Shake Control)", () => {
  for (const s of [RIG, COMP1]) assert.deepEqual(bucket(s, "rock.png"), bucket(older(s), "rock.png"));
});

// ---- Pivot: the demo refusal

test("pivot demo: refuses an unkeyed Anchor Point or Position expression, and an unkeyed or keyed Rotation or Scale one", () => {
  for (const n of UNKEYED_AP_POS) assert.equal(demoRefusal(PLANTED, entry(PLANTED, n)), "expression", n);
  for (const n of UNKEYED_ROT) assert.equal(demoRefusal(PLANTED, entry(PLANTED, n)), "expression_rotation_scale", n);
  assert.equal(demoRefusal(OVERLAPS, entry(OVERLAPS, "Gauge Dial")), "expression_rotation_scale", "keyed Rotation, with R2");
});

test("pivot demo: before spec 015, or with an erroring or switched-off expression, the refusal is as before", () => {
  for (const n of [...UNKEYED_AP_POS, ...UNKEYED_ROT]) assert.equal(demoRefusal(older(PLANTED), entry(PLANTED, n)), null, n);
  assert.equal(demoRefusal(older(OVERLAPS), entry(OVERLAPS, "Gauge Dial")), null, "keyed Rotation without R2: not refused, as before");
  assert.equal(demoRefusal(partial(PLANTED), entry(PLANTED, "Joined")), null);
  assert.equal(demoRefusal(PLANTED, entry(PLANTED, "Err Transform")), demoRefusal(older(PLANTED), entry(PLANTED, "Err Transform")));
  const off = withExpr(PLANTED, "Joined", (x) => { x.enabled = false; });
  assert.equal(demoRefusal(off, entry(off, "Joined")), null);
});

test("pivot demo: the new refusal reads as plain words", () => {
  const e = refused("expression_rotation_scale");
  assert.equal(e.code, "ANCHOR_REFUSED");
  assert.match(e.message, /An expression drives its Rotation or Scale\.$/);
  assert.doesNotMatch(e.message, /_/);
});

// ---- Null: the demo target

test("null demo target: never a layer an unkeyed Position or Rotation expression drives", () => {
  assert.equal(demoTarget(PLANTED, ["Index Link", "Runtime Name"]), null);
  assert.equal(demoTarget(older(PLANTED), ["Index Link", "Runtime Name"]), "parent/Index Link", "before spec 015, as today");
  for (const n of [...UNKEYED_AP_POS, "Offset Link"]) assert.equal(demoTarget(PLANTED, [n]), null, n);
  assert.equal(demoTarget(OVERLAPS, ["Drift"]), null);
});

test("null demo target: erroring, switched-off, Opacity and text expressions don't rule a layer out", () => {
  const old = older(PLANTED);
  for (const n of ["Err Transform", "Off Expr", "Guide Link", "Comp Ref", "Words"]) assert.equal(demoTarget(PLANTED, [n]), demoTarget(old, [n]), n);
  const err = withExpr(PLANTED, "Index Link", (x) => { x.error = "Error at line 1"; });
  assert.equal(demoTarget(err, ["Index Link"]), "parent/Index Link");
  assert.equal(demoTarget(partial(PLANTED), ["Index Link"]), "parent/Index Link", "R2 not fully read: keyed only");
});

// ---- Null: the jump line's flag

const nullLesson = (base, focus) => ({ comp_id: base.comp.id, skill: "parenting.null", mode: "lesson", baseline: base, focus, targets: focus.map((n) => `parent/${n}`), demo_target: null, demo: null, skill_data: {}, exclude: [] });
const flagOf = (base, now, focus, name) => nullCheck(base, now, nullLesson(base, focus), {}).result.layers.find((l) => l.layer === name).expression_on_move;

test("null check: expression_on_move takes an unkeyed Position or Rotation expression from the read", () => {
  assert.equal(flagOf(PLANTED, PLANTED, ["Index Link", "Runtime Name"], "Index Link"), true);
  assert.equal(flagOf(PLANTED, PLANTED, ["Offset Link", "Joined"], "Offset Link"), true);
  const old = older(PLANTED);
  assert.equal(flagOf(old, old, ["Index Link", "Runtime Name"], "Index Link"), false, "before spec 015, as today");
});

test("null check: expression_on_move stays false for an erroring or switched-off expression", () => {
  const err = withExpr(PLANTED, "Index Link", (x) => { x.error = "Error at line 1"; });
  assert.equal(flagOf(err, err, ["Index Link", "Runtime Name"], "Index Link"), false);
  assert.equal(flagOf(PLANTED, PLANTED, ["Err Transform", "Joined"], "Err Transform"), false);
  const off = withExpr(PLANTED, "Index Link", (x) => { x.enabled = false; });
  assert.equal(flagOf(off, off, ["Index Link", "Runtime Name"], "Index Link"), false);
});

// ---- The shared read

test("sourceExpressionOn: only a fully read R2, only source expressions, only the paths asked", () => {
  const idx = entry(PLANTED, "Joined").index;
  const POS = ["ADBE Transform Group/ADBE Position"];
  assert.equal(sourceExpressionOn(PLANTED, idx, POS), true);
  assert.equal(sourceExpressionOn(PLANTED, idx, new Set(POS)), true);
  assert.equal(sourceExpressionOn(PLANTED, idx, ["ADBE Transform Group/ADBE Scale"]), false);
  assert.equal(sourceExpressionOn(older(PLANTED), idx, POS), false);
  assert.equal(sourceExpressionOn(partial(PLANTED), idx, POS), false);
  assert.equal(sourceExpressionOn(PLANTED, entry(PLANTED, "Err Transform").index, POS), false);
});
