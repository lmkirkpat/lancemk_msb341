// Spec 015 T027 (FR-016 to FR-019, SC-007; contracts/describe-layers.md): describe_layers in fixture
// mode, on Comp 1 (T015's live capture when committed, else the shape derived from the live reads,
// written to a temp file the way capture.mjs saves one), the live 015 Rig and 015 Thirty.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
const use = (file) => fs.writeFileSync(stateFile, JSON.stringify({ project: file }));
const EX = (name) => path.join(FIXTURES, "expressions", `${name}.json`);
use(EX("rig"));
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;

const { comp1, LIVE } = await import("./fixtures/expressions/comp1.mjs");
const COMP1 = path.join(home, "comp1.json");
fs.writeFileSync(COMP1, JSON.stringify(comp1()));
const { TOOLS, SKILLS } = await import("../tools/index.mjs");
const reads = await import("../tools/comp-reads.mjs");
const { CODES } = await import("../errors.mjs");

const asked = [];
const realTake = reads.io.takeSnapshot;
reads.io.takeSnapshot = async (opts) => { asked.push(opts || {}); return realTake(opts); };
const raw = async (args = {}) => (await TOOLS.find((t) => t.name === "describe_layers").handler(args)).content[0].text;
const call = async (args) => JSON.parse(await raw(args));
const size = (text) => Buffer.byteLength(text, "utf8");

test("describe_layers is registered, read-only, with no learner-record skill; DETAIL_NEEDS_LAYERS is a known code", () => {
  const t = TOOLS.find((x) => x.name === "describe_layers");
  assert.ok(t);
  assert.equal(t.annotations.readOnlyHint, true);
  assert.equal(reads.SKILLS, undefined);
  assert.ok(!SKILLS.some((s) => s.startsWith("comp")));
  assert.ok(CODES.includes("DETAIL_NEEDS_LAYERS"));
});

test(`SC-007 on Comp 1 (${LIVE ? "live" : "derived"}): one layer with its sources ≤ 4 KB, the whole comp ≤ 12 KB, no expression text in either`, async () => {
  use(COMP1);
  const texts = comp1().expressions.map((x) => x.text);
  const whole = await raw({});
  const one = await raw({ layers: ["rock.png"] });
  assert.ok(size(one) <= 4096, `one layer: ${size(one)} bytes`);
  assert.ok(size(whole) <= 12288, `whole comp: ${size(whole)} bytes`);
  assert.equal(JSON.parse(whole).layers.length, 29, "nothing cut");
  for (const text of [whole, one]) for (const t of texts) assert.ok(!text.includes(JSON.stringify(t).slice(1, 60)), "no expression text in a summary");
  const rock = JSON.parse(one).layers[0];
  assert.deepEqual(rock.parents.map((p) => [p.layer, p.moves_children, p.moves_by, p.expressions.map((x) => x.property)]), [["Shake Control", true, "expression", ["Position", "Rotation"]]]);
});

test("SC-002 in the summary: Sweep Control has 1 link in, from Black Solid 1's sweep, which doesn't render", async () => {
  use(COMP1);
  const { layers } = await call({ layers: ["Sweep Control"] });
  assert.deepEqual(layers[0].links_in, {
    count: 1, unresolved_in_comp: 0,
    first: [{ from_layer: "Black Solid 1", from_property: "Effects › CC Light Sweep › Center", property: "Position", inferred: true, target_renders: false }],
  });
  const black = (await call({ layers: ["Black Solid 1"] })).layers[0];
  assert.deepEqual(black.effects, ["CC Light Sweep"]);
});

test("SC-007 on the live 015 Thirty: 30 expressions, the whole comp ≤ 12 KB, no text", async () => {
  use(EX("thirty"));
  const whole = await raw({});
  const r = JSON.parse(whole);
  assert.equal(r.layers.reduce((n, l) => n + l.expressions.length, 0), 30);
  assert.ok(size(whole) <= 12288, `${size(whole)} bytes`);
  assert.doesNotMatch(whole, /linear\(time|Math\.sin|thisComp\.layer/);
  const one = await raw({ layers: ["Row 3"] });
  assert.ok(size(one) <= 4096, `${size(one)} bytes`);
});

test("detail: the text, cut at 1,500 characters with its full length; the reply ≤ 16 KB", async () => {
  const snap = JSON.parse(fs.readFileSync(EX("rig"), "utf8"));
  const long = path.join(home, "rig-long.json");
  const x = snap.expressions.find((e) => e.path.endsWith("ADBE Position"));
  x.text = `${x.text}\n// ${"padding ".repeat(400)}`;
  x.text_length = x.text.length;
  fs.writeFileSync(long, JSON.stringify(snap));
  use(long);
  const text = await raw({ layers: ["Shake Control"], detail: true });
  assert.ok(size(text) <= 16384, `${size(text)} bytes`);
  const pos = JSON.parse(text).layers[0].expressions.find((e) => e.property === "Position");
  assert.deepEqual([pos.text.length, pos.cut_short, pos.full_length], [1500, true, x.text_length]);
  use(EX("rig"));
  const plain = (await call({ layers: ["Shake Control"], detail: true, at_time: 0.6 })).layers[0].expressions.find((e) => e.property === "Position");
  assert.equal(plain.cut_short, false);
  assert.deepEqual(plain.values.base, [960, 540, 0]);
  assert.ok(Math.abs(plain.values.after[0] - 952.4) <= 0.1, "SC-003's after-value, live");
});

test("FR-017: a name two layers share returns the candidates; an unknown one says not found", async () => {
  use(EX("rig"));
  const { layers } = await call({ layers: ["G Shakers", "Nope", 6] });
  assert.deepEqual(layers[0], { asked: "G Shakers", error: "NAME_SHARED", candidates: [{ layer_index: 1, parent: null }, { layer_index: 2, parent: null }] });
  assert.deepEqual(layers[1], { asked: "Nope", error: "NOT_FOUND" });
  assert.equal(layers[2].layer, "rock.png");
});

test("detail with no layers is refused with a plain message", async () => {
  await assert.rejects(raw({ detail: true }), (e) => e.code === "DETAIL_NEEDS_LAYERS" && !/[_.]/.test(e.message.replace(/\.$/, "").replace(/\. /g, " ")));
});

test("the fine sweep is asked for the named layers' expression-driven parents only; phase 1 never reads precomps", async () => {
  use(EX("rig"));
  asked.length = 0;
  const r = await call({ layers: ["rock.png"] });
  assert.deepEqual(asked, [{}, { measure_layers: [4] }], "Shake Control (layer 4) only: rock.png itself has no expression");
  assert.equal(r.read.sweeps, "fine");
  assert.deepEqual(r.read.precomps, { status: "not_read", reason: "phase_2" });
  asked.length = 0;
  await call({});
  assert.deepEqual(asked, [{}], "the whole comp: one read, coarse sweeps only");
});

test("FR-019, FR-020: read-only, and the learner record and session are never written", async () => {
  use(EX("rig"));
  const before = fs.readdirSync(home).sort();
  await call({});
  await call({ layers: ["rock.png", "Shake Control"], detail: true });
  assert.deepEqual(fs.readdirSync(home).sort(), before, "no session.json, learner.json or fixture-edits.json appeared");
});

test("review: a child's parent entry lists an erroring parent expression, marked as erroring", async () => {
  const snap = JSON.parse(fs.readFileSync(EX("rig"), "utf8"));
  const rot = snap.expressions.find((x) => x.path.endsWith("ADBE Rotate Z"));
  Object.assign(rot, { active: false, error: "Expression disabled. Error at line 1" });
  snap.expression_sweeps = snap.expression_sweeps.filter((w) => !w.path.endsWith("ADBE Rotate Z"));
  const file = path.join(home, "rig-error.json");
  fs.writeFileSync(file, JSON.stringify(snap));
  use(file);
  const parent = (await call({ layers: ["rock.png"] })).layers[0].parents[0];
  assert.deepEqual(parent.expressions.map((x) => [x.property, x.error]), [["Position", false], ["Rotation", true]]);
  use(EX("rig"));
});
