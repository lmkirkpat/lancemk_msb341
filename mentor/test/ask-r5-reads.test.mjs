// Spec 014 T037 round 5: fix (o), when a parent expression's shift shows on a named layer's box
// (`over_1px`, from the fine sweep's per-sample `offsets`), and fix (p), a parent's children by name
// when there are few (`child_layers`). Fixture mode on the live Comp 1 and Mentor Practice captures.
//
// The live Comp 1 capture predates `offsets`, so the tests that need them add a series worked out
// from Comp 1's own expression formulas (the texts in the capture) at the sweep's sample times, and
// first check that series against the capture's live peak (max_offset and max_at), so the stand-in
// can't drift from what AE read.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
const use = (file) => fs.writeFileSync(stateFile, JSON.stringify({ project: file }));
const EX = (name) => path.join(FIXTURES, "expressions", `${name}.json`);
use(EX("comp1"));
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;

const { footprintShifts, overFloor, FLOOR_PX } = await import("../lib/footprint-shift.mjs");
const { TOOLS } = await import("../tools/index.mjs");
const { CHILD_NAMES } = await import("../tools/comp-reads.mjs");
const mock = await import("./fixtures/expressions/mock-ae.mjs");

const load = (name) => JSON.parse(fs.readFileSync(EX(name), "utf8"));
const describe = async (args) => JSON.parse((await TOOLS.find((t) => t.name === "describe_layers").handler(args)).content[0].text);
const writeTemp = (name, snap) => { const f = path.join(home, name); fs.writeFileSync(f, JSON.stringify(snap)); return f; };
const r3 = (v) => Math.round(v * 1000) / 1000;

const SHAKE = 25;
const ROCK = 28;
const POS = "ADBE Transform Group/ADBE Position";
const ROT = "ADBE Transform Group/ADBE Rotate Z";

// Comp 1's two Shake Control expressions as formulas (their texts are in the capture): the offset
// from base, as snapshot.jsx's sweep measures it (vector length for Position, |degrees| for Rotation).
const IMPACTS = [0.5, 1.5, 2.5];
const posOffset = (time) => {
  let x = 0;
  let y = 0;
  for (const at of IMPACTS) {
    const t = time - at;
    if (t >= 0) {
      x += (Math.sin(8 * t * 2 * Math.PI) / Math.exp(4 * t)) * 12;
      y += (Math.cos(8 * t * 2 * Math.PI) / Math.exp(4 * t)) * 12;
    }
  }
  return Math.hypot(x, y);
};
const rotOffset = (time) => {
  let r = 0;
  IMPACTS.forEach((at, i) => {
    const t = time - at;
    if (t >= 0) r += (Math.sin(10 * t * 2 * Math.PI) / Math.exp(3 * t)) * [0.25, 0.5, 0.75][i];
  });
  return Math.abs(r);
};

// The live capture plus each fine sweep's offsets, sampled as snapshot.jsx does (step max(1 frame,
// duration / 240), n = floor(duration / step) + 1).
function withOffsets() {
  const s = load("comp1");
  const step = Math.max(1 / s.comp.frame_rate, s.comp.duration / 240);
  const n = Math.max(1, Math.floor(s.comp.duration / step - 1e-9) + 1);
  for (const w of s.expression_sweeps) {
    if (w.layer !== SHAKE || w.kind !== "fine") continue;
    const f = w.path === POS ? posOffset : rotOffset;
    w.offsets = Array.from({ length: n }, (_, i) => r3(f(i * step)));
    w.offsets_every = Math.round(step * 1e6) / 1e6;
  }
  return s;
}
const fineOf = (s, p) => s.expression_sweeps.find((w) => w.layer === SHAKE && w.path === p && w.kind === "fine");
const entryOf = (s, prop) => footprintShifts(s, ROCK, s.comp.time).find((e) => e.property === prop);

test("the stand-in series matches the live capture's peaks (so the tests below run on Comp 1's own motion)", () => {
  const s = withOffsets();
  for (const p of [POS, ROT]) {
    const w = fineOf(s, p);
    const peak = Math.max(...w.offsets);
    const at = w.offsets.indexOf(peak) * w.offsets_every;
    assert.ok(Math.abs(peak - w.max_offset) <= 0.002, `${p}: ${peak} vs ${w.max_offset}`);
    assert.ok(Math.abs(at - w.max_at) <= 0.002, `${p}: at ${at} vs ${w.max_at}`);
  }
});

test("fix (o): rock.png's Position and Rotation shifts say when they show, sample by sample through the box conversion", () => {
  const s = withOffsets();
  for (const prop of ["Position", "Rotation"]) {
    const e = entryOf(s, prop);
    assert.ok(e.shift_px >= 1, `${prop} peak ${e.shift_px}`);
    const o = e.over_1px;
    assert.equal(typeof o.from, "number", JSON.stringify(o));
    assert.equal(typeof o.until, "number", JSON.stringify(o));
    assert.ok(o.from >= 0.5 && o.from < 0.6, `${prop} from ${o.from}`);
    assert.ok(o.until > 2.5 && o.until < s.comp.duration, `${prop} until ${o.until}`);
    assert.ok(o.from <= e.at && e.at < o.until);
  }
  // Position is a translation through uniform scales, so the shift is linear in the offset: an
  // independent check of `until` from the series alone.
  const w = fineOf(s, POS);
  const e = entryOf(s, "Position");
  const ratio = e.shift_px / w.max_offset;
  let last = -1;
  w.offsets.forEach((off, i) => { if (off * ratio >= FLOOR_PX - 1e-6) last = i; });
  assert.ok(Math.abs(e.over_1px.until - (last + 1) * w.offsets_every) <= 0.001 + w.offsets_every, `${e.over_1px.until} vs ${(last + 1) * w.offsets_every}`);
});

test("fix (o): an older capture with no offsets says the span wasn't read, never a guess", () => {
  const s = load("comp1");
  for (const prop of ["Position", "Rotation"]) {
    const e = entryOf(s, prop);
    assert.equal(typeof e.shift_px, "number");
    assert.deepEqual(e.over_1px, { status: "not_read", reason: "older_snapshot" });
  }
});

test("fix (o): still over 1 px at the comp's last sample is to_end; never over 1 px is never", () => {
  const s = withOffsets();
  const w = fineOf(s, POS);
  w.offsets = w.offsets.map(() => 5);
  w.offsets[0] = 0;
  assert.deepEqual(entryOf(s, "Position").over_1px, { from: r3(w.offsets_every), until: null, to_end: true });
  const t = withOffsets();
  const v = fineOf(t, ROT);
  v.offsets = v.offsets.map(() => 0.001);
  assert.equal(entryOf(t, "Rotation").over_1px, "never");
});

test("fix (o): a conversion that needs each sample's direction (Scale, or a non-uniform scale above) is direction_unknown for the span", () => {
  const fine = { offsets: [0, 5, 0], offsets_every: 1 };
  assert.deepEqual(overFloor(fine, true, () => 10), { status: "not_read", reason: "direction_unknown" });
  assert.deepEqual(overFloor(fine, false, (off) => off), { from: 1, until: 2 });
  assert.deepEqual(overFloor(fine, false, () => null), { status: "not_read", reason: "not_sampled" });
  assert.deepEqual(overFloor({ offsets: [0, 5] }, false, (off) => off), { status: "not_read", reason: "older_snapshot" });
});

test("fix (o): describe_layers carries over_1px on rock.png's shifts; rock.png's summary stays ≤ 4 KB", async () => {
  use(writeTemp("comp1-offsets.json", withOffsets()));
  const text = JSON.stringify(await describe({ layers: ["rock.png"] }));
  const r = JSON.parse(text);
  const shifts = r.layers[0].shifts;
  assert.ok(shifts.length >= 2);
  for (const e of shifts) if (typeof e.shift_px === "number" && e.shift_px >= 1) assert.equal(typeof e.over_1px.until, "number");
  assert.ok(Buffer.byteLength(text, "utf8") <= 4096, `${Buffer.byteLength(text, "utf8")} bytes`);
  use(EX("comp1"));
});

test("fix (o): snapshot.jsx keeps offsets and offsets_every on fine sweeps only, one per sample, peaking at max_offset", () => {
  const s = mock.run(mock.comp(), { measure_layers: [1] });
  const fine = s.expression_sweeps.filter((w) => w.kind === "fine");
  assert.ok(fine.length >= 2);
  for (const w of fine) {
    assert.ok(Array.isArray(w.offsets) && w.offsets.length > 100, w.path);
    assert.ok(Math.abs(Math.max(...w.offsets) - w.max_offset) <= 0.001);
    assert.ok(Math.abs(w.offsets.indexOf(Math.max(...w.offsets)) * w.offsets_every - w.max_at) <= 0.001);
    assert.ok(Math.abs(w.offsets_every - w.sampled_every) < 0.001);
  }
  for (const w of s.expression_sweeps.filter((x) => x.kind === "coarse")) assert.equal("offsets" in w, false);
  const plain = mock.run(mock.comp());
  assert.ok(plain.expression_sweeps.every((w) => !("offsets" in w)), "no measure_layers, so no skill's snapshot changes");
});

test("fix (p): CTRL's two children come back by name; Shake Control's 13 only as a count", async () => {
  use(EX("practice"));
  const p = await describe({ layers: ["CTRL", "Title"] });
  const ctrl = p.layers.find((l) => l.layer === "CTRL");
  assert.equal(ctrl.children, 2);
  assert.deepEqual(ctrl.child_layers.map((c) => c.layer), ["Title", "Subtitle"]);
  assert.ok(ctrl.child_layers.every((c) => typeof c.layer_index === "number"));
  const title = p.layers.find((l) => l.layer === "Title");
  assert.equal(title.children, 0);
  assert.equal("child_layers" in title, false);
  use(EX("comp1"));
  const c = await describe({ layers: ["Shake Control"] });
  assert.equal(c.layers[0].children, 13);
  assert.ok(13 > CHILD_NAMES);
  assert.equal("child_layers" in c.layers[0], false);
});

test("fix (p): the whole-comp summaries stay under the 12 KB cap with child names in, nothing cut", async () => {
  for (const name of ["comp1", "practice", "rig", "thirty"]) {
    use(EX(name));
    const text = JSON.stringify(await describe({}));
    const r = JSON.parse(text);
    assert.ok(Buffer.byteLength(text, "utf8") <= 12288, `${name}: ${Buffer.byteLength(text, "utf8")}`);
    assert.equal(r.size, undefined, `${name} had layers cut`);
    for (const l of r.layers) {
      if (l.child_layers) assert.ok(l.child_layers.length === l.children && l.children <= CHILD_NAMES);
      else assert.ok(!(typeof l.children === "number" && l.children > 0 && l.children <= CHILD_NAMES), `${name} ${l.layer}`);
    }
  }
  use(EX("comp1"));
});
