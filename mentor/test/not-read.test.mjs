// Spec 015 T028 (FR-018, SC-009): wherever a read didn't run (a snapshot from before spec 015, a
// reference that can't be resolved, another comp, a fine sweep a fixture wasn't captured with),
// every reply and map says not read or can't resolve, never none, an empty list or false.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
const use = (file) => fs.writeFileSync(stateFile, JSON.stringify({ project: file }));
const OLD = path.join(FIXTURES, "ask", "comp1-snapshot.json");
const PLANTED = path.join(FIXTURES, "expressions", "planted.json");
use(OLD);
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;

const { expressionReads, linksIn } = await import("../lib/expressions.mjs");
const { motionSources } = await import("../lib/motion-sources.mjs");
const { TOOLS } = await import("../tools/index.mjs");
const describe = async (args) => JSON.parse((await TOOLS.find((t) => t.name === "describe_layers").handler(args)).content[0].text);
const load = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const NOT_READ = { status: "not_read", reason: "older_snapshot" };

// No value anywhere is the word "none" (FR-018's "never none").
function noNone(value, at = "reply") {
  if (value === "none") assert.fail(`${at} says none`);
  if (Array.isArray(value)) value.forEach((v, i) => noNone(v, `${at}[${i}]`));
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) noNone(v, `${at}.${k}`);
}

test("the committed Comp 1 snapshot (before spec 015): expressions, links and sweeps all say not read", async () => {
  const snap = load(OLD);
  assert.deepEqual(expressionReads(snap), { read: NOT_READ, list: [] });
  for (const [, e] of linksIn(snap)) assert.deepEqual(e, NOT_READ);
  const map = motionSources(snap);
  assert.equal(map.read.expressions, "keyed_only");
  for (const l of map.layers) assert.equal(l.expressions.status, "not_read", l.layer);
  const r = await describe({});
  assert.deepEqual(r.read.expressions, NOT_READ);
  assert.deepEqual(r.read.links, NOT_READ);
  assert.deepEqual(r.read.sweeps, NOT_READ);
  assert.equal(r.read.precomps.status, "not_read");
  for (const l of r.layers) {
    for (const k of ["expressions", "links_in", "refs_out", "effects"]) assert.deepEqual(l[k], NOT_READ, `${l.layer}.${k}`);
    assert.notEqual(l.expressions.length, 0);
  }
  noNone(r);
});

test("an unresolved reference: the link it might make isn't claimed, and every layer says how many can't be resolved", async () => {
  const snap = load(PLANTED);
  const run = expressionReads(snap).list.find((x) => x.layer === "Runtime Name");
  assert.deepEqual(run.refs.map((r) => r.how), ["unresolved"]);
  for (const [, e] of linksIn(snap)) assert.equal(e.unresolved_in_comp, 2, "Runtime Name, and Comp Ref's comp() (review S7)");
  use(PLANTED);
  const r = await describe({ layers: ["Ctrl", "Words"] });
  for (const l of r.layers) assert.equal(l.links_in.unresolved_in_comp, 2, `${l.layer}: never a bare "no links"`);
  noNone(r);
});

test("another comp's reference is listed as not followed, never resolved by name", () => {
  const ref = expressionReads(load(PLANTED)).list.find((x) => x.layer === "Comp Ref").refs[0];
  assert.deepEqual([ref.how, ref.comp, ref.target_index], ["other_comp", "not_followed", null]);
});

test("a fine sweep the fixture wasn't captured with: not read (fixture), beside the coarse one, never 0", async () => {
  use(PLANTED); // measured with layer 18 (Wiggle) only
  const r = await describe({ layers: ["Runtime Name"] });
  assert.deepEqual(r.read.sweeps, { status: "not_read", reason: "fixture", coarse: "read" });
  const moves = r.layers[0].expressions[0].moves;
  assert.deepEqual(moves.fine, { status: "not_read", reason: "fixture" });
  assert.equal(moves.sweep, "coarse");
  noNone(r);
});

test("an expression that isn't running (off or erroring) moves: not read, never false or 0", () => {
  const list = expressionReads(load(PLANTED)).list;
  for (const name of ["Off Expr", "Err Transform"]) {
    assert.deepEqual(list.find((x) => x.layer === name).moves, { status: "not_read", reason: "not_running" }, name);
  }
});

test("review S7: comp(\"Comp 1\").layer(…) inside Comp 1 isn't followed, so no layer says it has no links", () => {
  const snap = load(path.join(FIXTURES, "expressions", "rig.json"));
  const black = snap.expressions.find((x) => x.group === "effect");
  black.text = 'comp("015 Rig").layer("Sweep Control").transform.position';
  for (const [, e] of linksIn(snap)) {
    assert.deepEqual([e.links.length, e.unresolved_in_comp], [0, 1]);
  }
});
