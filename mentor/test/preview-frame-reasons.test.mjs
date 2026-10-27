// Spec 004 tasks-wave-b T192 (second pass; FR-045, research R24 as amended, data-model › Loose-ends
// pass › layer_bounds_reason): preview_frame with `layer` gives no bounds for a precomp, a layer with
// effects, a layer with masks, or one whose rendered Opacity is under 1% at that time. An absent
// mask_count or sample opacity (a capture from before those reads) is no reason. Fixture mode, on
// temp copies of layer-info/practice2b.json that this test edits. preview-frame-layer.test.mjs
// (T178) stands unchanged.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;

const { TOOLS } = await import("../tools/index.mjs");
const { footprint } = await import("../lib/comp-space.mjs");

const PRACTICE = path.join(FIXTURES, "layer-info", "practice2b.json");
const load = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const setProject = (file) => fs.writeFileSync(stateFile, JSON.stringify({ project: file }));

// A copy of practice2b.json in its own temp folder, with Blink's entry changed by `edit`.
function blinkVariant(edit) {
  const dir = fs.mkdtempSync(path.join(home, "variant-"));
  const snap = load(PRACTICE);
  edit(snap.layer_info.find((l) => l.name === "Blink"), snap);
  const out = path.join(dir, "practice2b.json");
  fs.writeFileSync(out, JSON.stringify(snap));
  return out;
}

async function blink(file, time) {
  setProject(file);
  const r = await TOOLS.find((t) => t.name === "preview_frame").handler(time == null ? { layer: "Blink" } : { layer: "Blink", time });
  return JSON.parse(r.content.find((c) => c.type === "text").text);
}

const saved = load(PRACTICE);
const BLINK = saved.layer_info.find((l) => l.name === "Blink");
const boundsAt = (t) => footprint(saved, BLINK.index, t, { extents: true }).bounds;
const sampleAt = (entry, t) => entry.samples.find((s) => Math.abs(s.time - t) < 0.001);

function noBounds(reply, reason) {
  assert.ok(!("layer_bounds" in reply), `no bounds (${reason})`);
  assert.equal(reply.layer_bounds_reason, reason);
}
function hasBounds(reply, t) {
  assert.deepEqual(reply.layer_bounds, boundsAt(t));
  assert.ok(!("layer_bounds_reason" in reply));
}

beforeEach(() => {
  for (const f of ["session.json", "fixture-edits.json", "learner.json"]) fs.rmSync(path.join(home, f), { force: true });
});

test("the capture as saved (no mask_count, no sample opacity): the same bounds T178 gets", async () => {
  assert.ok(!("mask_count" in BLINK) && !("opacity" in BLINK.samples[0]), "the capture predates both reads");
  hasBounds(await blink(PRACTICE), saved.comp.time);
});

test("masks: 1 → masked, unreadable (null) → masked, 0 → bounds", async () => {
  noBounds(await blink(blinkVariant((b) => { b.mask_count = 1; })), "masked");
  noBounds(await blink(blinkVariant((b) => { b.mask_count = null; })), "masked");
  hasBounds(await blink(blinkVariant((b) => { b.mask_count = 0; })), saved.comp.time);
});

test("effects: 2 → effects, unreadable (null) → effects", async () => {
  noBounds(await blink(blinkVariant((b) => { b.effect_count = 2; })), "effects");
  noBounds(await blink(blinkVariant((b) => { b.effect_count = null; })), "effects");
});

test("a precomp layer → precomp", async () => {
  noBounds(await blink(blinkVariant((b) => { b.kind = "precomp"; })), "precomp");
});

test("the sample at the frame's time: opacity 0 → transparent, 0.5 → transparent, 1 → bounds", async () => {
  const at = (v) => blinkVariant((b) => { sampleAt(b, 1.4).opacity = v; });
  noBounds(await blink(at(0), 1.4), "transparent");
  noBounds(await blink(at(0.5), 1.4), "transparent");
  hasBounds(await blink(at(1), 1.4), 1.4);
});

test("only the sample at the frame's time counts: opacity 0 at 1.4 s leaves 1 s with bounds", async () => {
  hasBounds(await blink(blinkVariant((b) => { sampleAt(b, 1.4).opacity = 0; sampleAt(b, 1).opacity = 100; }), 1), 1);
});

test("order: a hidden layer with a mask → not_rendered", async () => {
  noBounds(await blink(blinkVariant((b, snap) => {
    b.enabled = false;
    b.mask_count = 1;
    snap.layers.find((l) => l.name === "Blink").enabled = false;
  })), "not_rendered");
});

test("order: a masked layer outside its in and out points → not_on_screen", async () => {
  noBounds(await blink(blinkVariant((b) => { b.mask_count = 1; b.in_point = 2; }), 0), "not_on_screen");
});

test("order: a precomp with effects → precomp; effects come before masks, masks before Opacity", async () => {
  noBounds(await blink(blinkVariant((b) => { b.kind = "precomp"; b.effect_count = 1; })), "precomp");
  noBounds(await blink(blinkVariant((b) => { b.effect_count = 1; b.mask_count = 1; })), "effects");
  noBounds(await blink(blinkVariant((b) => { b.mask_count = 1; sampleAt(b, 1.4).opacity = 0; }), 1.4), "masked");
});

// Reviewer finding 5: a camera, light or audio-only layer reads no masks or effects (null), and has
// no pixels, so it gets footprint()'s own reason, never effects, masked or transparent.
const noPixels = {
  camera: (b) => { b.kind = "camera"; },
  light: (b) => { b.kind = "light"; },
  "audio-only footage": (b) => { b.kind = "footage"; b.has_video = false; },
};
for (const [what, make] of Object.entries(noPixels)) {
  test(`a ${what} layer with unreadable masks and effects and Opacity 0: footprint()'s own reason`, async () => {
    const file = blinkVariant((b) => {
      make(b);
      b.effect_count = null;
      b.mask_count = null;
      for (const s of b.samples) { s.rect = null; s.rect_extents = null; s.opacity = 0; }
    });
    const snap = load(file);
    const entry = snap.layer_info.find((l) => l.name === "Blink");
    const want = footprint(snap, entry.index, saved.comp.time, { extents: false }).reason;
    const reply = await blink(file);
    assert.ok(!("layer_bounds" in reply));
    assert.ok(!["effects", "masked", "transparent"].includes(reply.layer_bounds_reason), reply.layer_bounds_reason);
    assert.equal(reply.layer_bounds_reason, want);
  });
}
