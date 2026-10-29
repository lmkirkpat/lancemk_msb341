// The 2026-10-29 overlap audit's pivot rows (discovery/usage-notes/overlap-audit-2026-10-29.md):
// OA-6, OA-11, OA-12 and OA-13 (spec 011 tasks T459 to T462).

import { test } from "node:test";
import assert from "node:assert/strict";
import { analyze, candidates } from "../lib/anchor.mjs";
import { check, matchLayer, otherChanges } from "../lib/anchor-check.mjs";
import { clone, fixture, lessonFor } from "./fixtures/anchor/load.mjs";

const P2 = fixture("practice2b");
const cand = (snap, name) => candidates(snap).find((c) => c.layer === name);
const info = (snap, name) => snap.layer_info.find((l) => l.name === name);

// A layer added at the top: every index +1, as adding a null does.
function renumbered(snap) {
  const s = clone(snap);
  const up = (i) => (typeof i === "number" ? i + 1 : i);
  for (const l of s.layer_info) {
    l.index = up(l.index);
    l.parent = up(l.parent);
    if (l.matte && typeof l.matte.layer === "number") l.matte.layer = up(l.matte.layer);
  }
  for (const l of s.layers || []) l.index = up(l.index);
  for (const l of s.precomp_layers || []) l.index = up(l.index);
  const top = clone(info(s, "Background"));
  Object.assign(top, { index: 1, name: "Added", parent: null, matte: null, is_matte: false });
  s.layer_info.unshift(top);
  return s;
}

test("OA-6: two layers share a name and every index moves: each matches the same-numbered one of that name in stack order", () => {
  const base = clone(P2);
  info(base, "Dot 2").name = "Dot 1"; // Dot 1 at 6, "Dot 1" at 7
  const cur = renumbered(base);
  const [first, second] = base.layer_info.filter((l) => l.name === "Dot 1");
  assert.equal(matchLayer(base, cur, first).index, first.index + 1);
  assert.equal(matchLayer(base, cur, second).index, second.index + 1, "not the first Dot 1, which now has the second's old index");
  const others = otherChanges(base, cur, []);
  assert.deepEqual(others.filter((o) => o.layer === "Dot 1"), [], "neither reads as removed or changed");
  assert.deepEqual(others.filter((o) => o.kind === "layer_added").map((o) => o.layer), ["Added"]);
});

test("OA-11: Pan Behind between Gauge's Rotation keys (no first-read sample there) reads as set away from rest", () => {
  const focus = [{ layer: "Gauge", place: "bottom-middle" }];
  const read = clone(fixture("gauge-away"));
  read.comp.time = 3.6;
  const g = check(P2, read, lessonFor(P2, focus)).layers.find((l) => l.layer === "Gauge");
  assert.equal(g.item3.set_away_from_rest, true);
  assert.deepEqual(g.hints, ["away_from_rest"]);
});

test("OA-11: an unkeyed layer that moved with its pivot still reads moved_with_pivot (no inference without Rotation or Scale keys)", () => {
  const r = check(P2, fixture("door-dragged"), lessonFor(P2, [{ layer: "Door", place: "middle-left" }]));
  assert.ok(!r.layers[0].hints.includes("away_from_rest"));
});

test("OA-12: a masked layer is allowed only if named, with a note that its places come from the whole layer", () => {
  const s = clone(P2);
  info(s, "Door").mask_count = 1;
  assert.deepEqual([cand(s, "Door").bucket, cand(s, "Door").reason], ["if_named", "masked"]);
  const a = analyze(s, { skill_options: { focus: [{ layer: "Door", place: "middle-left" }] } });
  assert.ok(a.notes.some((n) => n.layer === "Door" && n.note === "masked"));
  info(s, "Door").mask_count = null;
  assert.equal(cand(s, "Door").reason, "masked", "an unreadable mask count counts");
  delete info(s, "Door").mask_count;
  assert.equal(cand(s, "Door").reason, null, "an older capture without it is as before");
  const bg = clone(P2);
  info(bg, "Background").mask_count = 1;
  assert.equal(cand(bg, "Background").reason, "masked", "a comp-size solid with a small mask isn't a full-frame layer");
});

test("OA-13: a focus layer not on screen at its check time gets a note", () => {
  const s = clone(P2);
  info(s, "Door").in_point = 2;
  const a = analyze(s, { skill_options: { focus: [{ layer: "Door", place: "middle-left" }] } });
  assert.ok(a.notes.some((n) => n.layer === "Door" && n.note === "not_on_screen"));
  const out = clone(P2);
  info(out, "Door").out_point = 0;
  assert.ok(analyze(out, { skill_options: { focus: [{ layer: "Door", place: "middle-left" }] } }).notes.some((n) => n.note === "not_on_screen"));
  assert.ok(!analyze(P2, { skill_options: { focus: [{ layer: "Door", place: "middle-left" }] } }).notes.some((n) => n.note === "not_on_screen"));
});
