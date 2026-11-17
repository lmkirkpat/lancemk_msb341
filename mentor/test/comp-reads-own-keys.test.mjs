// Spec 015 T065 (FR-004b, SC-003b, E32, OQ-12; data-model § 6): describe_layers' own keys and switches,
// on the live Comp 1 capture, the live Mentor Practice capture (separated X Position) and edited copies of
// Comp 1, one per rollup and switch case. Reply-only: the same snapshot, nothing new read.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
const use = (file) => fs.writeFileSync(stateFile, JSON.stringify({ project: file }));
const COMP1 = path.join(FIXTURES, "expressions", "comp1.json");
const PRACTICE = path.join(FIXTURES, "expressions", "practice.json");
use(COMP1);
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;

const { LIVE } = await import("./fixtures/expressions/comp1.mjs");
const { TOOLS } = await import("../tools/index.mjs");
const { snaps } = await import("../lib/key-types.mjs");
const reads = await import("../tools/comp-reads.mjs");

const raw = async (args = {}) => (await TOOLS.find((t) => t.name === "describe_layers").handler(args)).content[0].text;
const call = async (args) => JSON.parse(await raw(args));
const load = () => JSON.parse(fs.readFileSync(COMP1, "utf8"));
let n = 0;
const plant = (edit) => { const s = load(); edit(s); const f = path.join(home, `planted-${++n}.json`); fs.writeFileSync(f, JSON.stringify(s)); use(f); return s; };
const TITLE = "DISCOVER the past to INSPIRE the future";
const keyedProp = (s, index) => s.layers.find((l) => l.index === index).properties[0];
const one = async (name, args = {}) => (await call({ layers: [name], ...args })).layers[0];

test(`SC-003b (${LIVE ? "live" : "derived"} Comp 1): the 3 keyed properties, each none held, with their key counts`, async () => {
  use(COMP1);
  const r = await call({ layers: [TITLE, "Sweep Control", "General Logo Animation Graphics.png"] });
  assert.deepEqual(r.layers.map((l) => [l.layer, l.own_keys]), [
    [TITLE, [{ property: "Position", keys: 2, key_types: "none_held" }]],
    ["Sweep Control", [{ property: "Position", keys: 2, key_types: "none_held" }]],
    ["General Logo Animation Graphics.png", [{ property: "Rotation", keys: 6, key_types: "none_held" }]],
  ]);
  assert.equal(r.read.own_keys, "read");
  assert.equal(r.read.switches, "read");
});

test("SC-003b: rock.png has no own keys and Locked, 3D and Collapse off; the text layer (AE reads Collapse on) carries no collapse", async () => {
  use(COMP1);
  const rock = await one("rock.png");
  assert.deepEqual([rock.own_keys, rock.locked, rock.three_d, rock.collapse], [[], false, false, false]);
  const title = await one(TITLE);
  assert.equal("collapse" in title, false);
  assert.deepEqual([title.locked, title.three_d], [false, false]);
  const precomp = await one(8);
  assert.equal(precomp.kind, "precomp");
  assert.deepEqual([precomp.own_keys, precomp.collapse], [[], false], "a precomp's own keys only; Collapse applies");
  const shape = load().layer_info.find((l) => l.kind === "null");
  assert.equal("collapse" in (await one(shape.index)), false, "no Collapse on a null");
});

test("SC-007 with the new fields: rock.png ≤ 4 KB, the whole comp ≤ 12 KB, and the whole comp leaves out empties and switches that are off", async () => {
  use(COMP1);
  const whole = await raw({});
  const bytes = Buffer.byteLength(whole, "utf8");
  assert.ok(bytes <= 12288, `${bytes} bytes`);
  assert.ok(Buffer.byteLength(await raw({ layers: ["rock.png"] }), "utf8") <= 4096);
  const r = JSON.parse(whole);
  assert.equal(r.layers.length, 29, "nothing cut");
  assert.deepEqual(r.layers.filter((l) => "own_keys" in l).map((l) => l.layer), [TITLE, "Sweep Control", "General Logo Animation Graphics.png"]);
  assert.ok(r.layers.every((l) => !("locked" in l) && !("three_d" in l) && !("collapse" in l)), "all off on Comp 1");
  assert.deepEqual([r.read.own_keys, r.read.switches], ["read", "read"], "absence means none");
});

test("rollups: one key is single_key; a hold on the first key's out side is held; on only the second key's in side, held too", async () => {
  plant((s) => keyedProp(s, 1).keys.splice(1));
  assert.deepEqual((await one(TITLE)).own_keys, [{ property: "Position", keys: 1, key_types: "single_key" }]);
  plant((s) => { keyedProp(s, 1).keys[0].out_type = "hold"; });
  assert.equal((await one(TITLE)).own_keys[0].key_types, "all_held");
  plant((s) => { keyedProp(s, 1).keys[1].in_type = "hold"; });
  assert.equal((await one(TITLE)).own_keys[0].key_types, "all_held", "L-1: AE snaps a pair held on its second key's in side");
});

test("rollups: some pairs held is some_held; the rule is key types' own snaps", async () => {
  plant((s) => { keyedProp(s, 27).keys[2].out_type = "hold"; });
  assert.equal((await one("General Logo Animation Graphics.png")).own_keys[0].key_types, "some_held");
  assert.equal(snaps({ out_type: "bezier" }, { in_type: "hold" }), true);
  const src = fs.readFileSync(new URL("../tools/comp-reads.mjs", import.meta.url), "utf8");
  assert.match(src, /import \{ snaps \} from "\.\.\/lib\/key-types\.mjs"/);
  assert.doesNotMatch(src, /in_type === "hold"/, "reused, never copied");
});

test("a keyed property whose expression is on says so; one that's off says nothing", async () => {
  plant((s) => { keyedProp(s, 1).expression_enabled = true; });
  assert.deepEqual((await one(TITLE)).own_keys[0], { property: "Position", keys: 2, key_types: "none_held", expression_on: true });
  use(COMP1);
  assert.equal("expression_on" in (await one(TITLE)).own_keys[0], false);
});

test("separated dimensions (live Mentor Practice): Bar's X Position, never the hidden Position", async () => {
  use(PRACTICE);
  const bar = await one("Bar");
  assert.ok(bar.own_keys.some((k) => k.property === "X Position" && k.keys === 3));
  assert.ok(!bar.own_keys.some((k) => k.property === "Position"));
  use(COMP1);
});

test("a locked layer and a 3D layer, named and in the whole comp (a switch that's on is always said)", async () => {
  plant((s) => { const l = s.layer_info.find((x) => x.index === 28); l.locked = true; l.three_d = true; });
  const rock = await one("rock.png");
  assert.deepEqual([rock.locked, rock.three_d], [true, true]);
  const w = (await call({})).layers.find((l) => l.layer === "rock.png");
  assert.deepEqual([w.locked, w.three_d, "collapse" in w], [true, true, false]);
});

test("a switch read as null is not read, never false, named and in the whole comp", async () => {
  plant((s) => { s.layer_info.find((x) => x.index === 28).collapse = null; s.layer_info.find((x) => x.index === 28).locked = null; });
  const rock = await one("rock.png");
  assert.deepEqual(rock.locked, { status: "not_read", reason: "error" });
  assert.deepEqual(rock.collapse, { status: "not_read", reason: "error" });
  assert.equal(rock.three_d, false);
  const w = (await call({})).layers.find((l) => l.layer === "rock.png");
  assert.deepEqual([w.locked, w.collapse], [{ status: "not_read", reason: "error" }, { status: "not_read", reason: "error" }]);
});

test("a snapshot with no layer_info: switches aren't read (older_snapshot), own keys are", async () => {
  plant((s) => { delete s.layer_info; });
  const r = await call({});
  assert.deepEqual(r.read.switches, { status: "not_read", reason: "older_snapshot" });
  assert.equal(r.read.own_keys, "read");
  use(COMP1);
});

test("a summary lists at most 8 keyed properties, then counts the rest; detail lists them all with display paths", async () => {
  plant((s) => {
    const base = keyedProp(s, 1);
    s.layers.find((l) => l.index === 1).properties = Array.from({ length: 10 }, (_, i) => ({ ...structuredClone(base), path: `${base.path}_${i}`, display_name: `Prop ${i}`, display_path: `Transform › Prop ${i}` }));
  });
  const sum = await one(TITLE);
  assert.equal(sum.own_keys.length, reads.OWN_KEYS_SUMMARY);
  assert.equal(sum.own_keys_more, 2);
  const det = await one(TITLE, { detail: true });
  assert.equal(det.own_keys.length, 10);
  assert.equal(det.own_keys[9].display_path, "Transform › Prop 9");
  assert.equal("own_keys_more" in det, false);
  use(COMP1);
});

test("review N4: with no layer_info, each layer's switches say older_snapshot, as the read block does", () => {
  const entry = { index: 1, name: "Title", kind: "precomp" };
  assert.deepEqual(reads.switches(entry, false), {
    locked: { status: "not_read", reason: "older_snapshot" },
    three_d: { status: "not_read", reason: "older_snapshot" },
    collapse: { status: "not_read", reason: "older_snapshot" },
  });
  assert.deepEqual(reads.switches({ ...entry, locked: null, three_d: false, collapse: true }), { locked: { status: "not_read", reason: "error" }, three_d: false, collapse: true });
});
