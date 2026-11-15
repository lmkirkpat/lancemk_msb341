// Spec 015 T017 (US1; FR-001, FR-003, FR-004, FR-006, FR-006a): expression reads from a snapshot
// (mentor/lib/expressions.mjs). Comp 1 is T015's live capture when it's committed, else the shape
// derived from the two committed live reads (fixtures/expressions/comp1.mjs). The planted rows run
// through the real snapshot.jsx on the mock AE until T015's planted capture is committed.

import { test } from "node:test";
import assert from "node:assert/strict";
import { expressionReads, expressionsRead, isSource, movesOf, rawExpression, valuesAt } from "../lib/expressions.mjs";
import { comp1, groundTruth, LIVE } from "./fixtures/expressions/comp1.mjs";
import { comp as mockComp, run } from "./fixtures/expressions/mock-ae.mjs";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES } from "./helpers.mjs";

const practice = () => JSON.parse(fs.readFileSync(path.join(FIXTURES, "practice-before.json"), "utf8"));

const C1 = comp1();
const on = LIVE ? "live capture" : "derived from the live reads";

test(`SC-001: Comp 1 has exactly 3 expressions, text identical to the ground truth, on, no error, 0 keys (${on})`, () => {
  const { read, list } = expressionReads(C1);
  assert.equal(read, "all");
  assert.equal(list.length, 3);
  const truth = groundTruth().layers.flatMap((l) => l.animated.filter((a) => a.expression).map((a) => ({ layer: l.name, name: a.name, text: a.expression })));
  assert.deepEqual(list.map((x) => [x.layer, x.property]), truth.map((t) => [t.layer, t.name]));
  for (const x of list) {
    const t = truth.find((g) => g.layer === x.layer && g.name === x.property);
    assert.equal(rawExpression(C1, x.layer_index, x.path).text, t.text, `${x.layer} ${x.property}`);
    assert.deepEqual([x.on, x.active, x.error, x.keys], [true, true, null, 0], `${x.layer} ${x.property}`);
  }
  assert.deepEqual(list.map((x) => x.group), ["effect", "transform", "transform"]);
  assert.equal(list[0].display_path, "Effects › CC Light Sweep › Center");
});

test(`SC-003: Shake Control's Position at 0.6 s is (960, 540) before and about (952.4, 542.5) after (${on})`, () => {
  const pos = expressionReads(C1).list.find((x) => x.layer === "Shake Control" && x.property === "Position");
  const v = valuesAt(C1, rawExpression(C1, pos.layer_index, pos.path), 0.6);
  assert.deepEqual(v.base.slice(0, 2), [960, 540]);
  assert.ok(Math.abs(v.after[0] - 952.4) <= 0.1 && Math.abs(v.after[1] - 542.5) <= 0.1, JSON.stringify(v.after));
});

test("E2: an expression with no keys is a source of motion; an effect expression's value isn't sampled, and says so", () => {
  const [sweep, pos] = expressionReads(C1).list;
  assert.equal(pos.keys, 0);
  assert.equal(pos.active, true, "Shake Control's Position is a source with no keys");
  assert.deepEqual(valuesAt(C1, rawExpression(C1, sweep.layer_index, sweep.path), 0.6), { status: "not_read", reason: "not_a_sampled_property" });
  assert.deepEqual(valuesAt(C1, rawExpression(C1, pos.layer_index, pos.path), 4.9), { status: "not_read", reason: "not_sampled" });
});

test("FR-004: with no sweep read, how much it moves is not read, never 0 or false", () => {
  if (LIVE) return; // the live capture has sweeps; its numbers are pinned in comp-reads.test.mjs
  const pos = expressionReads(C1).list.find((x) => x.property === "Position");
  assert.deepEqual(pos.moves, { status: "not_read", reason: "not_swept" });
  const sweep = expressionReads(C1).list.find((x) => x.group === "effect");
  assert.deepEqual(sweep.moves, { status: "not_read", reason: "not_transform" });
});

test("E27: a snapshot from before spec 015 says not read, never none", () => {
  for (const snap of [practice(), JSON.parse(JSON.stringify(C1))]) {
    delete snap.expressions;
    assert.deepEqual(expressionsRead(snap), { status: "not_read", reason: "older_snapshot" });
    assert.deepEqual(expressionReads(snap), { read: { status: "not_read", reason: "older_snapshot" }, list: [] });
  }
  const broken = { ...C1, expressions_read: { status: "not_read", reason: "error" } };
  assert.deepEqual(expressionsRead(broken), { status: "not_read", reason: "error" });
});

// ---- Planted rows, through the real snapshot.jsx on the mock AE (T015's live capture to follow)

const M = run(mockComp(), { sample_times: [1.3], measure_layers: [1] });
const readOf = (layer, prop) => expressionReads(M).list.find((x) => x.layer === layer && x.property === prop);

test("E3: an expression that's off is listed as off and isn't a source", () => {
  const off = readOf("Off", "Scale");
  assert.deepEqual([off.on, off.active, off.error], [false, false, null]);
  assert.equal(isSource(rawExpression(M, off.layer_index, off.path)), false);
  assert.deepEqual(off.moves, { status: "not_read", reason: "not_running" });
});

test("E4: an erroring expression is on with its error, not a source, and its value is the base (T001)", () => {
  const broken = readOf("Broken", "Position");
  assert.deepEqual([broken.on, broken.active], [true, false]);
  assert.match(broken.error, /^Expression disabled/);
  const v = valuesAt(M, rawExpression(M, broken.layer_index, broken.path), 1.3);
  assert.deepEqual([v.base, v.after, v.note], [[100, 100, 0], [100, 100, 0], "not_running"]);
});

test("E7 and E29 (FR-006a): only the separated side is read; the hidden Position's stale expression never shows", () => {
  const sep = expressionReads(M).list.filter((x) => x.layer === "Sep");
  assert.deepEqual(sep.map((x) => x.property), ["X Position"]);
  const v = valuesAt(M, rawExpression(M, sep[0].layer_index, sep[0].path), 1.3);
  assert.deepEqual([v.base, v.after], [[300, 200], [313, 200]], "base and after from X and Y, not the hidden Position");
  assert.ok(!(M.expression_sweeps || []).some((w) => w.layer === sep[0].layer_index && w.path.endsWith("ADBE Position")));
});

test("E9: Source Text is listed with its group and isn't counted as motion", () => {
  const words = readOf("Words", "Source Text");
  assert.equal(words.group, "text");
  assert.deepEqual(words.moves, { status: "not_read", reason: "not_transform" });
});

test("FR-004: the fine sweep's size, peak and step, with units; coarse only for a layer not measured", () => {
  const pos = readOf("Shaker", "Position");
  assert.equal(pos.moves.sweep, "fine");
  assert.equal(pos.moves.units, "px");
  assert.equal(pos.moves.varies, true);
  assert.ok(pos.moves.max_offset > 5);
  assert.equal(readOf("Shaker", "Rotation").moves.units, "degrees");
  const still = readOf("Still", "Position");
  assert.deepEqual([still.moves.sweep, still.moves.varies], ["coarse", false]);
});

test("a fixture that wasn't captured with a layer's fine sweep says so beside the coarse one", () => {
  const snap = { ...M, fine_not_read: [{ layer: 7, reason: "fixture" }] };
  const still = expressionReads(snap).list.find((x) => x.layer === "Still");
  assert.deepEqual(still.moves.fine, { status: "not_read", reason: "fixture" });
  assert.equal(still.moves.sweep, "coarse");
});

// ---- The same rows on T015's live planted capture (015 Planted, AE 27.0)

const P = JSON.parse(fs.readFileSync(path.join(FIXTURES, "expressions", "planted.json"), "utf8"));
const liveOf = (layer) => expressionReads(P).list.filter((x) => x.layer === layer);

test("live E1: an expression over keys is listed with its keys and builds on them (Over Keys)", () => {
  const [x] = liveOf("Over Keys");
  assert.deepEqual([x.property, x.keys, x.active, x.builds_on], ["Position", 2, true, "builds_on"]);
});

test("live E3 and E4: off is off; an erroring transform and effect expression are on, with the error, and not sources", () => {
  const [off] = liveOf("Off Expr");
  assert.deepEqual([off.on, off.active, off.keys], [false, false, 2]);
  for (const name of ["Err Transform", "Err Effect"]) {
    const [x] = liveOf(name);
    assert.deepEqual([x.on, x.active], [true, false], name);
    assert.match(x.error, /^Expression disabled\. Error at line 1/, name);
  }
  const err = liveOf("Err Transform")[0];
  const v = valuesAt(P, rawExpression(P, err.layer_index, err.path), 0.6);
  assert.deepEqual([v.base, v.after, v.note], [[1500, 200, 0], [1500, 200, 0], "not_running"], "T001: the value is the base");
});

test("live E7 and E29: the joined and separated layers read only their side in use, never the stale hidden half", () => {
  assert.deepEqual(liveOf("Joined").map((x) => x.property), ["Position"]);
  assert.deepEqual(liveOf("Separated").map((x) => x.property), ["X Position"]);
  const at = (name) => P.layer_info.find((l) => l.name === name).samples.find((s) => s.time === 0.6);
  assert.deepEqual([at("Joined").base.position, at("Joined").position], [[520, 520, 0], [520, 526, 0]], "not X/Y's stale 700, 650");
  assert.deepEqual([at("Separated").base.position, at("Separated").position], [[800, 300, 0], [806, 300, 0]], "not Position's stale 500, 500");
});

test("live E9: Source Text is in the text group and isn't motion", () => {
  const [x] = liveOf("Words");
  assert.deepEqual([x.group, x.moves.reason], ["text", "not_transform"]);
});

test("live FR-004: the wiggle's fine sweep (measured) and the constant parent's coarse one", () => {
  const [w] = liveOf("Wiggle");
  assert.deepEqual([w.moves.sweep, w.moves.varies, w.moves.units, w.moves.sampled_every], ["fine", true, "px", 0.033]);
  assert.ok(w.moves.max_offset > 20 && w.moves.max_offset < 40, String(w.moves.max_offset));
  const [c] = liveOf("Const Parent");
  assert.deepEqual([c.moves.sweep, c.moves.varies, c.moves.max_offset], ["coarse", false, 0]);
});
