// Spec 015 T064 (FR-004a, SC-003a, E31; research R15; data-model § 1 `max_value`, § 6 `shifts`):
// footprint shifts in comp pixels, on the live Comp 1 capture and on edited copies of it, one per
// null reason; the fine sweep's `max_value` in snapshot.jsx (through the mock AE) and in fixture
// mode; describe_layers' `shifts` and `read.shifts`, and SC-007's caps with them in.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
const use = (file) => fs.writeFileSync(stateFile, JSON.stringify({ project: file }));
const COMP1 = path.join(FIXTURES, "expressions", "comp1.json");
use(COMP1);
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;

const { LIVE } = await import("./fixtures/expressions/comp1.mjs");
const { footprintShifts } = await import("../lib/footprint-shift.mjs");
const { footprint, sampleAt } = await import("../lib/comp-space.mjs");
const { byIndex } = await import("../lib/layer-info.mjs");
const { TOOLS } = await import("../tools/index.mjs");
const { takeSnapshot } = await import("../lib/snapshot.mjs");
const mock = await import("./fixtures/expressions/mock-ae.mjs");

const load = () => JSON.parse(fs.readFileSync(COMP1, "utf8"));
const SNAP = load();
const T = SNAP.comp.time;
const SHAKE = 25;
const ROCK = 28;
const TITLE = 1;
const ROT = "ADBE Transform Group/ADBE Rotate Z";
const POS = "ADBE Transform Group/ADBE Position";
const fineOf = (s, p) => s.expression_sweeps.find((w) => w.layer === SHAKE && w.path === p && w.kind === "fine");
const shiftsOf = (s, index, time = T) => footprintShifts(s, index, time);
const entry = (s, index, property, time) => shiftsOf(s, index, time).find((e) => e.property === property);
const describe = async (args) => JSON.parse((await TOOLS.find((t) => t.name === "describe_layers").handler(args)).content[0].text);
const writeTemp = (name, snap) => { const f = path.join(home, name); fs.writeFileSync(f, JSON.stringify(snap)); return f; };

// The 13 layers Shake Control moves: its children.
const CHILDREN = SNAP.layer_info.filter((l) => l.parent === SHAKE).map((l) => l.index);

test(`SC-003a (${LIVE ? "live" : "derived"} Comp 1): Shake Control's Rotation, 0.589° fine peak, in comp pixels on each of its 13 children`, () => {
  assert.equal(CHILDREN.length, 13);
  const theta = (fineOf(SNAP, ROT).max_offset * Math.PI) / 180;
  const pivot = sampleAt(byIndex(SNAP, SHAKE), T).position;
  const numbers = [];
  for (const index of CHILDREN) {
    const e = entry(SNAP, index, "Rotation");
    assert.ok(e, `layer ${index} has a Rotation entry`);
    if (index === TITLE) continue; // below: the title's own Position keys run through the peak
    const { corners } = footprint(SNAP, index, T);
    const r = Math.max(...corners.map(([x, y]) => Math.hypot(x - pivot[0], y - pivot[1])));
    const hand = 2 * r * Math.sin(theta / 2);
    assert.ok(Math.abs(e.shift_px - hand) <= 0.05, `layer ${index}: ${e.shift_px} vs ${hand.toFixed(3)}`);
    assert.ok(e.shift_px >= 1, `layer ${index} is at least 1 px`);
    assert.deepEqual([e.at, e.sampled_every, e.sampled, e.measured_on], [2.569, 0.033, true, "box"]);
    numbers.push(index);
  }
  assert.equal(numbers.length, 12);
  const rock = entry(SNAP, ROCK, "Rotation").shift_px;
  assert.ok(rock >= 8.6 && rock <= 9.4, `rock.png ${rock}`);
});

test("SC-003a: Shake Control's Position (12.147 px fine peak) is about 12.1 px on each child, no layer above it", () => {
  for (const index of CHILDREN.filter((i) => i !== TITLE)) {
    const e = entry(SNAP, index, "Position");
    assert.ok(Math.abs(e.shift_px - 12.147) <= 0.01, `layer ${index}: ${e.shift_px}`);
    assert.equal(e.at, 1.502);
  }
});

test("the title, whose own Position keys (2.503 s to 2.636 s) run through both peaks, is chain_moves, never the reading time's number", () => {
  // FR-004a: a value the shift depends on could differ between the reading time (3.403 s) and the
  // peak. SC-003a's "every one of the 13" counts it; FR-004a's never-a-guess rule wins (hand-back).
  for (const p of ["Position", "Rotation"]) assert.deepEqual(entry(SNAP, TITLE, p), { from_layer_index: SHAKE, from_layer: "Shake Control", property: p, shift_px: null, reason: "chain_moves" });
});

test("a layer with no parent expression has an empty list; Shake Control itself has none (its own expressions aren't parent-chain)", () => {
  assert.deepEqual(shiftsOf(SNAP, 27), []);
  assert.deepEqual(shiftsOf(SNAP, SHAKE), []);
});

// One test per null reason (FR-004a), each on an edited copy of the live capture. None gives a number.
const noNumber = (list) => {
  for (const e of list) {
    assert.equal(e.shift_px, null);
    for (const [k, v] of Object.entries(e)) if (k !== "from_layer_index") assert.notEqual(typeof v, "number", k);
  }
};
const reasonFor = (s, index = ROCK) => {
  const list = shiftsOf(s, index);
  assert.ok(list.length > 0);
  noNumber(list);
  return [...new Set(list.map((e) => e.reason))];
};

test("three_d: a 3D layer anywhere in the chain", () => {
  const s = load();
  byIndex(s, SHAKE).three_d = true;
  assert.deepEqual(reasonFor(s), ["three_d"]);
});

test("auto_orient: Auto-Orient on in the chain", () => {
  const s = load();
  byIndex(s, ROCK).auto_orient = true;
  assert.deepEqual(reasonFor(s), ["auto_orient"]);
});

test("no_rect: the named layer has no box (a null, or no rectangle read)", () => {
  const s = load();
  byIndex(s, ROCK).is_null = true;
  assert.deepEqual(reasonFor(s), ["no_rect"]);
  const t = load();
  sampleAt(byIndex(t, ROCK), T).rect = null;
  assert.deepEqual(reasonFor(t), ["no_rect"]);
});

test("not_sampled: a layer in the chain has no sample at the reading time", () => {
  const s = load();
  const shake = byIndex(s, SHAKE);
  shake.samples = shake.samples.filter((x) => Math.abs(x.time - T) > 0.001);
  assert.deepEqual(reasonFor(s), ["not_sampled"]);
  assert.deepEqual([...new Set(shiftsOf(SNAP, ROCK, 1.234).map((e) => e.reason))], ["not_sampled"], "a time nothing was sampled at");
});

test("no_fine_sweep: coarse-only (the coarse peak is never used), a budget cut, or an errored sweep", () => {
  const coarse = load();
  coarse.expression_sweeps = coarse.expression_sweeps.filter((w) => w.kind === "coarse");
  assert.deepEqual(reasonFor(coarse), ["no_fine_sweep"]);
  const budget = load();
  for (const w of budget.expression_sweeps) if (w.kind === "fine") { for (const k of ["varies", "max_offset", "max_at", "sampled_every"]) delete w[k]; w.status = "not_read"; w.reason = "budget"; }
  assert.deepEqual(reasonFor(budget), ["no_fine_sweep"]);
});

test("chain_moves: keys on a value the shift depends on (Shake Control's Scale), but not on its own Position", () => {
  const s = load();
  s.layers.push({ index: SHAKE, name: "Shake Control", properties: [{ path: "ADBE Transform Group/ADBE Scale", display_name: "Scale", display_path: "Transform › Scale", expression_enabled: false, keys: [{ time: 0, value: [100, 100, 100] }, { time: 4, value: [120, 120, 100] }] }] });
  assert.deepEqual(reasonFor(s), ["chain_moves"]);
  // Keys on Shake Control's own Position don't count: moving the pivot doesn't change a distance.
  const p = load();
  p.layers.push({ index: SHAKE, name: "Shake Control", properties: [{ path: POS, display_name: "Position", display_path: "Transform › Position", expression_enabled: true, keys: [{ time: 0, value: [960, 540, 0] }, { time: 4, value: [900, 540, 0] }] }] });
  assert.equal(entry(p, ROCK, "Rotation").shift_px, entry(SNAP, ROCK, "Rotation").shift_px);
});

// Shake Control's Rotation expression made a Scale one, as a planted source that always needs the peak's direction.
function asScale(s, maxValue) {
  const x = s.expressions.find((e) => e.layer === SHAKE && e.path === ROT);
  x.path = "ADBE Transform Group/ADBE Scale";
  x.display_path = "Transform › Scale";
  for (const w of s.expression_sweeps) if (w.layer === SHAKE && w.path === ROT) { w.path = x.path; w.max_offset = 7.071; if (w.kind === "fine" && maxValue) w.max_value = maxValue; }
  for (const smp of byIndex(s, SHAKE).samples) smp.base = { ...smp.base, scale: [100, 100, 100] };
  return s;
}

test("direction_unknown: a Scale source with no recorded peak value; with it, a number", () => {
  const s = asScale(load());
  assert.deepEqual(entry(s, ROCK, "Scale"), { from_layer_index: SHAKE, from_layer: "Shake Control", property: "Scale", shift_px: null, reason: "direction_unknown" });
  const t = asScale(load(), [105, 105, 100]);
  const e = entry(t, ROCK, "Scale");
  // A uniform 5% grow about the pivot moves the farthest corner 5% of its distance from the pivot.
  const pivot = sampleAt(byIndex(t, SHAKE), T).position;
  const r = Math.max(...footprint(t, ROCK, T).corners.map(([x, y]) => Math.hypot(x - pivot[0], y - pivot[1])));
  assert.ok(Math.abs(e.shift_px - 0.05 * r) <= 0.05, `${e.shift_px} vs ${(0.05 * r).toFixed(2)}`);
});

test("direction_unknown: Position through a non-uniform scale above it, with no peak value; with it, the exact length", () => {
  // rock.png parented to a planted chain: rock → Shake Control → a parent scaled 200% × 100%.
  const s = load();
  const top = { ...structuredClone(byIndex(s, 26)), index: 30, name: "Squash", parent: null, is_null: true };
  for (const smp of top.samples) Object.assign(smp, { anchor: [0, 0, 0], position: [0, 0, 0], scale: [200, 100, 100], rotation: 0 });
  if (!sampleAt(top, T)) top.samples.push({ ...top.samples[0], time: T });
  s.layer_info.push(top);
  byIndex(s, SHAKE).parent = 30;
  assert.equal(entry(s, ROCK, "Position").reason, "direction_unknown");
  const fine = s.expression_sweeps.find((w) => w.layer === SHAKE && w.path === POS && w.kind === "fine");
  const base = sampleAt(byIndex(s, SHAKE), T).base.position;
  fine.max_value = [base[0] + 3, base[1] + 4, 0]; // 5 px from base: (3, 4) becomes (6, 4) through 200% × 100%
  assert.equal(entry(s, ROCK, "Position").shift_px, Math.round(Math.hypot(6, 4) * 100) / 100);
});

test("singular: a scale of 0 in the chain", () => {
  const s = load();
  sampleAt(byIndex(s, ROCK), T).scale = [0, 108.668, 100];
  assert.deepEqual(reasonFor(s), ["singular"]);
});

test("not read: an older snapshot without read R2 says why, never an empty list", () => {
  const s = load();
  delete s.expressions;
  assert.deepEqual(shiftsOf(s, ROCK), { status: "not_read", reason: "older_snapshot" });
});

test("snapshot.jsx: a fine sweep records max_value, the after value at its peak; coarse sweeps don't", () => {
  const s = mock.run(mock.comp(), { measure_layers: [1] });
  const fine = s.expression_sweeps.filter((w) => w.kind === "fine");
  assert.ok(fine.length >= 2);
  for (const w of fine) {
    assert.ok("max_value" in w, w.path);
    if (w.path === POS) {
      assert.equal(w.max_value.length, 3);
      const off = Math.hypot(w.max_value[0] - 960, w.max_value[1] - 540);
      assert.ok(Math.abs(off - w.max_offset) <= 0.002, `${off} vs ${w.max_offset}`);
    } else {
      assert.equal(typeof w.max_value, "number");
      assert.ok(Math.abs(Math.abs(w.max_value) - w.max_offset) <= 0.002);
    }
  }
  for (const w of s.expression_sweeps.filter((x) => x.kind === "coarse")) assert.equal("max_value" in w, false);
  const plain = mock.run(mock.comp());
  assert.ok(plain.expression_sweeps.every((w) => !("max_value" in w)), "no measure_layers, so no skill's snapshot changes");
});

test("fixture mode passes max_value through when a capture has it", async () => {
  const s = load();
  fineOf(s, ROT).max_value = 0.589;
  use(writeTemp("comp1-maxvalue.json", s));
  const snap = await takeSnapshot({ measure_layers: [SHAKE] });
  assert.equal(fineOf(snap, ROT).max_value, 0.589);
  use(COMP1);
});

test("describe_layers: named layers carry shifts and read.shifts is read; a whole-comp summary has none (not_asked)", async () => {
  use(COMP1);
  const one = await describe({ layers: ["rock.png"] });
  assert.equal(one.read.shifts, "read");
  assert.deepEqual(one.layers[0].shifts.map((e) => [e.property, e.shift_px]), [["Position", 12.15], ["Rotation", entry(SNAP, ROCK, "Rotation").shift_px]]);
  const whole = await describe({});
  assert.deepEqual(whole.read.shifts, { status: "not_read", reason: "not_asked" });
  assert.ok(whole.layers.every((l) => !("shifts" in l)));
  const detail = await describe({ layers: ["rock.png"], detail: true });
  assert.equal(detail.layers[0].shifts.length, 2);
});

test("SC-007 with shifts in: rock.png's summary ≤ 4 KB, the whole comp ≤ 12 KB, the detail ≤ 16 KB", async () => {
  use(COMP1);
  const size = async (args) => Buffer.byteLength((await TOOLS.find((t) => t.name === "describe_layers").handler(args)).content[0].text, "utf8");
  assert.ok(await size({ layers: ["rock.png"] }) <= 4096);
  assert.ok(await size({}) <= 12288);
  assert.ok(await size({ layers: ["rock.png", "Shake Control"], detail: true }) <= 16384);
});

test("an older snapshot: named layers say shifts aren't read, with the read's reason", async () => {
  const s = load();
  delete s.expressions;
  delete s.expressions_read;
  use(writeTemp("comp1-older.json", s));
  const r = await describe({ layers: ["rock.png"] });
  assert.deepEqual(r.read.shifts, { status: "not_read", reason: "older_snapshot" });
  assert.deepEqual(r.layers[0].shifts, { status: "not_read", reason: "older_snapshot" });
  use(COMP1);
});
