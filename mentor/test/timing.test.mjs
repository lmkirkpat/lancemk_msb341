// FR-016, FR-017, SC-006 (wave A's part): the cross-layer timing measures match the hand-written
// answer key on Mentor Practice and the synthetic cases, and give measures, never verdicts.
// Mentor Practice 2's checks (30 and 60 fps) run on its live captures against the build script's
// answer key, practice2-expected.json (tasks T039, T043, T065).

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

// ---- Mentor Practice 2 (live captures, 2026-10-26) against practice2-expected.json's timing section.
// The answer key lists units in the order the build script wrote them; the read lists them in AE's
// order (Dot 2's Blurriness first), so units are compared by name, not position.

const mp2 = { 30: load("practice2-before.json"), 60: load("practice2-60fps.json") };
const key2 = load("practice2-expected.json").timing;
const byUnit = (units) => Object.fromEntries(units.map((u) => [u.unit, u.moves]));
const layersAt = (g) => [...new Set(g.at.map((a) => a.layer))].sort();

for (const fps of [30, 60]) {
  test(`Mentor Practice 2 at ${fps} fps: every layer's moves, first start and last landing match the answer key`, () => {
    const t = timing(mp2[fps]);
    assert.equal(t.frame_rate, fps);
    assert.deepEqual(t.layers.map((l) => l.layer).sort(), key2.layers.map((l) => l.layer).sort());
    for (const want of key2.layers) {
      const got = t.layers.find((l) => l.layer === want.layer);
      assert.equal(got.layer_index, want.layer_index, want.layer);
      assert.deepEqual(byUnit(got.units), byUnit(want.units), want.layer);
      assert.equal(got.first_start, want.first_start, want.layer);
      assert.equal(got.last_landing, want.last_landing, want.layer);
    }
    assert.equal(t.last_motion_end, key2.last_motion_end);
  });

  test(`Mentor Practice 2 at ${fps} fps: the Dots and the Chips each share a start frame, and no other layer starts on it (T065)`, () => {
    const t = timing(mp2[fps]);
    for (const g of key2.groups) {
      const frame = g[`frame_${fps}`];
      const at = t.starts_by_frame.find((x) => x.frame === frame);
      assert.ok(at, `a start frame at ${frame}`);
      assert.equal(at.time, g.time);
      assert.deepEqual(layersAt(at), [...g.layers].sort(), "only the group's layers start on its frame");
      for (const other of t.starts_by_frame.filter((x) => x !== at)) {
        assert.deepEqual(layersAt(other).filter((n) => g.layers.includes(n)), [], `no ${g.layers.join(", ")} start at frame ${other.frame}`);
      }
    }
  });

  test(`Mentor Practice 2 at ${fps} fps: Badge's units start and land on the same frames (same_frames)`, () => {
    const t = timing(mp2[fps]);
    for (const sf of key2.same_frames) {
      const startF = Math.round(sf.start * fps);
      const landF = Math.round(sf.landing * fps);
      const units = (list, frame) => list.find((x) => x.frame === frame).at.filter((a) => a.layer === sf.layer).map((a) => a.unit).sort();
      assert.deepEqual(units(t.starts_by_frame, startF), [...sf.units].sort());
      assert.deepEqual(units(t.landings_by_frame, landF), [...sf.units].sort());
    }
  });
}

test("Mentor Practice 2 (T064's layers): Dot 1 starts at its 0.5 s hold jump, Dot 2's effect key counts, Dot 3's X and Y are one Position unit", () => {
  const t = timing(mp2[30]);
  const dot1 = unit(t, "Dot 1", "Transform › Position");
  assert.equal(dot1.first_key, 0, "the hold key at 0 s is read");
  assert.equal(dot1.starts[0], 0.5, "but the start is the jump");
  assert.equal(t.layers.find((l) => l.layer === "Dot 1").first_start, 0.5);
  const blur = unit(t, "Dot 2", "Effects › Gaussian Blur › Blurriness");
  assert.deepEqual(blur.starts, [0.5]);
  assert.ok(t.starts_by_frame.find((x) => x.frame === 15).at.some((a) => a.layer === "Dot 2" && a.unit === blur.unit), "the effect key is in the shared start");
  const pos3 = unit(t, "Dot 3", "Position");
  assert.deepEqual(pos3.paths, ["ADBE Transform Group/ADBE Position_0", "ADBE Transform Group/ADBE Position_1"]);
  assert.equal(t.layers.find((l) => l.layer === "Dot 3").units.length, 2, "Position and Opacity, not X, Y and Opacity");
});

test("Mentor Practice 2: timing() is deterministic and gives no verdict field", () => {
  for (const fps of [30, 60]) assert.deepEqual(timing(mp2[fps]), timing(mp2[fps]));
  const keys = [];
  const walk = (v) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) { keys.push(k); walk(x); }
  };
  walk(timing(mp2[30]));
  walk(timing(mp2[60]));
  assert.deepEqual(keys.filter((k) => /lockstep|same|too|bad|good|ok/i.test(k)), []);
});
