// FR-016, FR-017, SC-006 (wave A's part): the cross-layer timing measures match the hand-written
// answer key on Mentor Practice and the synthetic cases, and give measures, never verdicts.
// Mentor Practice 2's checks (30 and 60 fps) are added after its live capture (tasks T043, T065).

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { timing, clusters } from "../lib/timing.mjs";
import { FIXTURES } from "./helpers.mjs";

const load = (rel) => JSON.parse(fs.readFileSync(path.join(FIXTURES, rel), "utf8"));
const practice = load("practice-before.json");
const key = load("practice-timing-expected.json");
const syn = (name) => load(path.join("timing", `${name}.json`));
const unit = (t, layer, name) => t.layers.find((l) => l.layer === layer).units.find((u) => u.unit === name);
const ramp = (start, end) => ({ start, end, duration: Math.round((end - start) * 1000) / 1000, kind: "ramp" });

test("Mentor Practice: timing() equals the hand-written answer key, layer by layer", () => {
  const t = timing(practice);
  assert.equal(t.layers.length, key.expected.layers.length);
  key.expected.layers.forEach((want, i) => assert.deepEqual(t.layers[i], want, want.layer));
  assert.deepEqual(t, key.expected);
});

test("back-to-back pairs are separate moves: Title's Position is two moves, Bar's X Position two (T058)", () => {
  const t = timing(practice);
  assert.deepEqual(unit(t, "Title", "Transform › Position").moves, [ramp(0.5, 1.5), ramp(1.5, 3)]);
  assert.deepEqual(unit(t, "Bar", "Position").moves, [ramp(0, 0.6), ramp(0.6, 1.2)]);
});

test("back-to-back.json: four keys, three moves; ramp-pause-ramp, two; overlapping dimensions merge; one dimension never does", () => {
  const t = timing(syn("back-to-back"));
  assert.deepEqual(unit(t, "Title", "Transform › Position").moves, [ramp(0.5, 1.5), ramp(1.5, 3), ramp(3, 4.37)]);
  assert.deepEqual(unit(t, "Pause", "Transform › Position").moves, [ramp(0, 1), ramp(2, 3)]);
  const sep = unit(t, "Sep", "Position");
  assert.deepEqual(sep.paths, ["ADBE Transform Group/ADBE Position_0", "ADBE Transform Group/ADBE Position_1"]);
  assert.deepEqual(sep.moves, [ramp(0.5, 1.5)], "each X move overlaps the Y move, so all three are one");
  assert.deepEqual(unit(t, "X Only", "Position").moves, [ramp(0.5, 1), ramp(1, 1.5)]);
  assert.equal(t.last_motion_end, 4.37);
});

test("equal-values.json: equal neighbours are a pause; a unit of pauses is no_change; unknown values count as change", () => {
  const t = timing(syn("equal-values"));
  assert.deepEqual(unit(t, "Title", "Transform › Position").moves, [ramp(0, 1), ramp(2, 3)]);
  const still = unit(t, "Still", "Transform › Opacity");
  assert.equal(still.excluded, "no_change");
  assert.deepEqual(still.moves, []);
  assert.equal(t.layers.find((l) => l.layer === "Still").first_start, null);
  assert.deepEqual(unit(t, "Unknown", "Transform › Opacity").moves, [ramp(0.5, 1.5)]);
});

test("separated-xyz-offset.json: X and Y overlapping read as one Position move; apart, as two", () => {
  const t = timing(syn("separated-xyz-offset"));
  assert.deepEqual(unit(t, "Bar", "Position").moves, [ramp(0, 1)]);
  assert.deepEqual(unit(t, "Bar", "Position").landings, [1], "one landing, not two landing together");
  assert.deepEqual(unit(t, "Apart", "Position").moves, [ramp(0, 0.5), ramp(1, 1.5)]);
});

test("sixty-fps.json: frames are round(time × 60)", () => {
  const t = timing(syn("sixty-fps"));
  assert.equal(t.frame_rate, 60);
  assert.deepEqual(t.starts_by_frame, [{ frame: 30, time: 0.5, at: [
    { layer_index: 1, layer: "A", unit: "Transform › Position" },
    { layer_index: 2, layer: "B", unit: "Transform › Opacity" },
  ] }], "0.508 s rounds to frame 30; C's 0.517 s is frame 31");
  assert.deepEqual(t.landings_by_frame.map((g) => g.frame), [60]);
});

test("hold pairs are instant moves at the second key's time, not moves with a duration", () => {
  const cursor = unit(timing(practice), "Cursor", "Transform › Opacity");
  assert.ok(cursor.moves.every((m) => m.kind === "instant" && m.duration === 0 && m.start === m.end));
  assert.deepEqual(cursor.starts, [0.5, 1, 1.5, 2, 2.5]);
});

test("clusters() groups by the caller's tolerance (FR-017: test inputs, not thresholds in the code)", () => {
  const at30 = [{ time: 1, id: "c" }, { time: 0.5, id: "a" }, { time: 0.5 + 1 / 30, id: "b" }];
  assert.deepEqual(clusters(at30, Math.max(2 / 30, 1 / 15)).map((g) => g.map((e) => e.id)), [["a", "b"], ["c"]]);
  const at60 = [{ time: 0.5, id: "a" }, { time: 0.5 + 3 / 60, id: "b" }];
  assert.deepEqual(clusters(at60, Math.max(2 / 60, 1 / 15)).map((g) => g.map((e) => e.id)), [["a", "b"]]);
  assert.deepEqual(clusters(at60, 0.01).map((g) => g.map((e) => e.id)), [["a"], ["b"]], "a tighter tolerance splits them");
  assert.deepEqual(clusters([], 0.1), []);
  assert.deepEqual(at30.map((e) => e.id), ["c", "a", "b"], "the input isn't reordered");
});

test("deterministic, and no field is a verdict", () => {
  assert.deepEqual(timing(practice), timing(practice));
  const keys = [];
  const walk = (v) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) { keys.push(k); walk(x); }
  };
  for (const s of [practice, syn("back-to-back"), syn("equal-values"), syn("separated-xyz-offset"), syn("sixty-fps")]) walk(timing(s));
  assert.deepEqual(keys.filter((k) => /lockstep|same|too|bad|good|ok/i.test(k)), []);
});

test("a snapshot with no layers gives empty measures", () => {
  assert.deepEqual(timing({ comp: { id: 1, name: "Empty", duration: 4, frame_rate: 30 }, layers: [], precomp_layers: [] }), {
    frame_rate: 30, comp_duration: 4, layers: [], starts_by_frame: [], landings_by_frame: [], last_motion_end: null,
  });
});
