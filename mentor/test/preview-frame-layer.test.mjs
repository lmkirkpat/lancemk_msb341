// Spec 004 FR-045, research R24 (tasks-wave-b T178): preview_frame's optional `layer` returns where
// that layer is in the frame, in comp pixels, from read R3 at the frame's time, plus the comp's and
// the image's sizes. Fixture mode, on the live captures with layer_info; the cases the captures
// don't hold (a duplicated name, an adjustment layer, a layer wholly off the comp) are temp copies
// of them with one field changed.

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

const LI = path.join(FIXTURES, "layer-info");
const PRACTICE = path.join(LI, "practice2b.json");
const OVERLAPS = path.join(LI, "overlaps.json");
const SOLO = path.join(LI, "overlaps-solo.json");
const load = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const setProject = (file) => fs.writeFileSync(stateFile, JSON.stringify({ project: file }));

// A copy of a capture in its own temp folder, changed by `edit`, optionally with a frame.png.
function variant(file, edit, png) {
  const dir = fs.mkdtempSync(path.join(home, "variant-"));
  const snap = load(file);
  edit(snap);
  const out = path.join(dir, path.basename(file));
  fs.writeFileSync(out, JSON.stringify(snap));
  if (png) fs.writeFileSync(path.join(dir, "frame.png"), png);
  return out;
}

// Just enough of a PNG for its header: signature, then IHDR with width and height.
function pngHeader(width, height) {
  const b = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b, 0);
  b.writeUInt32BE(13, 8);
  b.write("IHDR", 12, "ascii");
  b.writeUInt32BE(width, 16);
  b.writeUInt32BE(height, 20);
  return b;
}

async function preview(args) {
  const r = await TOOLS.find((t) => t.name === "preview_frame").handler(args);
  const text = r.content.find((c) => c.type === "text").text;
  return { reply: JSON.parse(text), text, content: r.content };
}

// What footprint() gives for a layer by name: rect_extents on a shape or text layer, else rect.
function expectedBounds(file, name, time) {
  const snap = load(file);
  const entry = snap.layer_info.find((l) => l.name === name);
  const extents = entry.kind === "shape" || entry.kind === "text";
  return footprint(snap, entry.index, time, { extents }).bounds;
}

beforeEach(() => {
  for (const f of ["session.json", "fixture-edits.json", "learner.json"]) fs.rmSync(path.join(home, f), { force: true });
});

test("Blink on Mentor Practice 2, at the capture's own time: its bounds, the comp's size and the image's", async () => {
  setProject(PRACTICE);
  const snap = load(PRACTICE);
  const { reply } = await preview({ layer: "Blink" });
  const want = expectedBounds(PRACTICE, "Blink", snap.comp.time);
  assert.ok(want, "the capture gives Blink a footprint");
  assert.deepEqual(reply.layer_bounds, want);
  assert.ok(!("layer_bounds_reason" in reply));
  assert.deepEqual(reply.comp_size, { width: 1920, height: 1080 });
  assert.deepEqual(reply.image_size, { width: 1, height: 1 }, "the fixture's placeholder frame");
  assert.equal(reply.comp, "Mentor Practice 2");
});

test("visible layers of every kind give footprint()'s bounds: a shape, a text layer, a solid, a parented layer", async () => {
  setProject(PRACTICE);
  for (const name of ["Dot 1", "Caption", "Door", "Hatch"]) {
    const { reply } = await preview({ layer: name, time: 0 });
    assert.deepEqual(reply.layer_bounds, expectedBounds(PRACTICE, name, 0), name);
    for (const v of Object.values(reply.layer_bounds)) assert.equal(v, Math.round(v * 1000) / 1000, `${name}: rounded to 0.001`);
  }
});

test("a sampled time other than the capture's: Blink at 1.4 s", async () => {
  setProject(PRACTICE);
  const { reply } = await preview({ layer: "Blink", time: 1.4 });
  assert.deepEqual(reply.layer_bounds, expectedBounds(PRACTICE, "Blink", 1.4));
  assert.equal(reply.time, 1.4);
});

test("the image's size comes from the PNG's header", async () => {
  setProject(variant(PRACTICE, () => {}, pngHeader(960, 540)));
  const { reply } = await preview({ layer: "Blink" });
  assert.deepEqual(reply.image_size, { width: 960, height: 540 });
  assert.deepEqual(reply.comp_size, { width: 1920, height: 1080 });
});

test("Mentor Overlaps: a hidden layer, a null, a matte and a guide get no bounds, with their reasons", async () => {
  setProject(OVERLAPS);
  const cases = { Draft: "not_rendered", Rig: "null_layer", Pivot: "null_layer", Wipe: "not_rendered", "Guide Grid": "not_rendered", Depth: "three_d", Orbit: "auto_orient" };
  for (const [name, reason] of Object.entries(cases)) {
    const { reply } = await preview({ layer: name });
    assert.ok(!("layer_bounds" in reply), `${name} has no bounds`);
    assert.equal(reply.layer_bounds_reason, reason, name);
    assert.deepEqual(reply.comp_size, { width: 1920, height: 1080 }, `${name}: the sizes are still there`);
    assert.ok(reply.image_size, name);
  }
});

test("a shy layer still renders, so it has bounds", async () => {
  setProject(OVERLAPS);
  const { reply } = await preview({ layer: "Shy Parent" });
  assert.deepEqual(reply.layer_bounds, expectedBounds(OVERLAPS, "Shy Parent", 1));
});

test("another layer soloed: not_rendered; the soloed layer itself has bounds", async () => {
  setProject(SOLO);
  assert.equal((await preview({ layer: "Photo" })).reply.layer_bounds_reason, "not_rendered");
  assert.deepEqual((await preview({ layer: "Still" })).reply.layer_bounds, expectedBounds(SOLO, "Still", 1));
});

test("outside its in and out points: not_on_screen", async () => {
  setProject(OVERLAPS);
  const { reply } = await preview({ layer: "Icon Stretch", time: 5 });
  assert.equal(reply.layer_bounds_reason, "not_on_screen");
});

test("wholly outside the comp: not_on_screen", async () => {
  setProject(variant(OVERLAPS, (s) => {
    for (const smp of s.layer_info.find((l) => l.name === "Still").samples) smp.position = [-5000, -5000];
  }));
  assert.equal((await preview({ layer: "Still" })).reply.layer_bounds_reason, "not_on_screen");
});

test("an adjustment layer: adjustment", async () => {
  setProject(variant(OVERLAPS, (s) => { s.layer_info.find((l) => l.name === "Still").adjustment = true; }));
  assert.equal((await preview({ layer: "Still" })).reply.layer_bounds_reason, "adjustment");
});

test("a name not in the comp: not_found; a name two layers share: ambiguous", async () => {
  setProject(PRACTICE);
  assert.equal((await preview({ layer: "Nope" })).reply.layer_bounds_reason, "not_found");
  assert.equal((await preview({ layer: "blink" })).reply.layer_bounds_reason, "not_found", "exact names only");
  setProject(variant(PRACTICE, (s) => {
    s.layer_info.find((l) => l.name === "Spinner").name = "Blink";
    s.layers.filter((l) => l.name === "Spinner").forEach((l) => { l.name = "Blink"; });
  }));
  assert.equal((await preview({ layer: "Blink" })).reply.layer_bounds_reason, "ambiguous");
});

test("a time with no sample: not_sampled", async () => {
  setProject(PRACTICE);
  assert.equal((await preview({ layer: "Blink", time: 0.7 })).reply.layer_bounds_reason, "not_sampled");
});

test("a capture from before layer_info: no_layer_info", async () => {
  setProject(path.join(FIXTURES, "practice-before.json"));
  const { reply } = await preview({ layer: "Title" });
  assert.equal(reply.layer_bounds_reason, "no_layer_info");
  assert.ok(!("comp_size" in reply), "that capture has no comp size, so none is given");
  assert.ok(reply.image_size);
});

test("without layer: exactly today's { comp, time }, and no snapshot is taken", async () => {
  setProject(PRACTICE);
  const snap = load(PRACTICE);
  // A saved edit with no twin makes any snapshot of this comp throw, so a call that takes one fails.
  fs.writeFileSync(path.join(home, "fixture-edits.json"), JSON.stringify([{ snippet: "no-such-twin", comp_id: snap.comp.id }]));
  const { reply, content } = await preview({ time: 0.5 });
  assert.deepEqual(reply, { comp: "Mentor Practice 2", time: 0.5 });
  assert.equal(content[0].type, "image");
  const bare = await preview({});
  assert.deepEqual(bare.reply, { comp: "Mentor Practice 2", time: 0 });
  await assert.rejects(preview({ layer: "Blink" }), /no twin/, "with layer, the snapshot is taken (and here it fails)");
});

test("the schema: layer is an optional string, time stays as it was", () => {
  const schema = TOOLS.find((t) => t.name === "preview_frame").inputSchema;
  assert.equal(schema.properties.layer.type, "string");
  assert.equal(schema.properties.time.type, "number");
  assert.ok(!schema.required || !schema.required.includes("layer"));
  assert.equal(schema.additionalProperties, false);
});
