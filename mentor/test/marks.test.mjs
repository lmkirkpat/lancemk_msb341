// FR-038, data-model › Kept-linear mark: a mark applies only while its property has exactly the key
// times the check saw, no expression, and every pair linear; anything else lapses it.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { applies, marksFor, isKeptLinear, markFrom } from "../lib/marks.mjs";
import { FIXTURES, fixture } from "./helpers.mjs";

const practice = JSON.parse(fs.readFileSync(path.join(FIXTURES, "practice-before.json"), "utf8"));
const POS = "ADBE Transform Group/ADBE Position";
const ROT = "ADBE Transform Group/ADBE Rotate Z";

const mark = (over = {}) => ({
  kind: "kept_linear", project: "Claude AE Tutor Test.aep", comp: "Mentor Practice",
  layer: "CTRL", path: POS, property: "Position", key_times: [0, 1], skill: "keyframes.types", date: "2026-10-21",
  ...over,
});

// A copy of Mentor Practice with CTRL's Position changed by `change(prop, layer)`.
function ctrlChanged(change) {
  const s = structuredClone(practice);
  const layer = s.layers.find((l) => l.name === "CTRL");
  change(layer.properties.find((p) => p.path === POS), layer);
  return s;
}

test("a mark applies on the snapshot it was made from", () => {
  assert.equal(applies(mark(), practice), true);
});

test("the mark lapses when a pair is eased, a key is held, added or moved, the expression is on, or the layer renamed", () => {
  const lapsed = {
    eased: ctrlChanged((p) => { p.keys[0].out_type = "bezier"; p.keys[1].in_type = "bezier"; }),
    half_eased: ctrlChanged((p) => { p.keys[1].in_type = "bezier"; }),
    held: ctrlChanged((p) => { p.keys[0].out_type = "hold"; }),
    key_added: ctrlChanged((p) => { p.keys.push({ ...p.keys[1], index: 3, time: 2 }); }),
    key_moved: ctrlChanged((p) => { p.keys[1].time = 1.2; }),
    expression_on: ctrlChanged((p) => { p.expression_enabled = true; }),
    renamed: ctrlChanged((p, layer) => { layer.name = "Controller"; }),
    keys_removed: ctrlChanged((p, layer) => { layer.properties = layer.properties.filter((q) => q !== p); }),
  };
  for (const [why, snap] of Object.entries(lapsed)) assert.equal(applies(mark(), snap), false, why);
});

test("a mark for another comp or project doesn't apply here", () => {
  assert.equal(applies(mark({ comp: "Mentor Practice 2" }), practice), false);
  assert.equal(applies(mark({ project: "Other.aep" }), practice), false);
});

test("the in and out sides outside the pairs don't matter: only the pairs' own sides", () => {
  const s = ctrlChanged((p) => { p.keys[0].in_type = "bezier"; p.keys[1].out_type = "hold"; });
  assert.equal(applies(mark(), s), true, "key 1's in side and the last key's out side don't move anything");
});

test("synthetic snapshots: linear applies; eased and expression don't", () => {
  const lin = fixture("linear-basic");
  const base = { project: "Synthetic.aep", comp: "Synthetic" };
  assert.equal(applies(mark({ ...base, layer: "Title", key_times: [0, 1, 2] }), lin), true);
  assert.equal(applies(mark({ ...base, layer: "Title", key_times: [0, 1] }), lin), false, "the key times must match exactly");
  assert.equal(applies(mark({ ...base, layer: "Title", key_times: [0, 1] }), fixture("eased")), false);
  assert.equal(applies(mark({ ...base, layer: "Logo", path: ROT, property: "Rotation", key_times: [0, 2] }), fixture("expression")), false);
});

test("marksFor returns only that project and comp's kept-linear marks; no marks gives []", () => {
  const record = {
    version: 1, skills: {}, lessons: [],
    marks: [mark(), mark({ comp: "Mentor Practice 2", layer: "Spinner" }), mark({ project: "Other.aep" }), mark({ kind: "other" })],
  };
  assert.deepEqual(marksFor(record, "Claude AE Tutor Test.aep", "Mentor Practice"), [mark()]);
  assert.deepEqual(marksFor({ version: 1, skills: {}, lessons: [] }, "Claude AE Tutor Test.aep", "Mentor Practice"), []);
  assert.deepEqual(marksFor(null, "x", "y"), []);
});

test("isKeptLinear: true only for the marked layer and path while the mark applies", () => {
  const marks = [mark()];
  assert.equal(isKeptLinear(marks, "CTRL", POS, practice), true);
  assert.equal(isKeptLinear(marks, "Title", POS, practice), false);
  assert.equal(isKeptLinear(marks, "CTRL", "ADBE Transform Group/ADBE Scale", practice), false);
  assert.equal(isKeptLinear(marks, "CTRL", POS, ctrlChanged((p) => { p.keys[0].out_type = "bezier"; })), false);
  assert.equal(isKeptLinear([], "CTRL", POS, practice), false);
  assert.equal(isKeptLinear(undefined, "CTRL", POS, practice), false);
});

test("markFrom takes the layer, path, display name and key times from a snapshot property", () => {
  const layer = practice.layers.find((l) => l.name === "CTRL");
  const prop = layer.properties.find((p) => p.path === POS);
  assert.deepEqual(markFrom(prop, layer), { layer: "CTRL", path: POS, property: "Position", key_times: [0, 1] });
});
