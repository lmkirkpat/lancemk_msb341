// Spec 015 T014 (research R13): takeSnapshot() passes measure_layers to the snippet, and fixture
// mode returns a capture's saved sweeps, listing any layer the caller asks a fine sweep for that the
// capture wasn't measured with as not read ("fixture"). The capture here is the real snapshot.jsx
// run on the mock AE, written to a temp file the way capture.mjs writes one.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { tempHome } from "./helpers.mjs";

// Fixture mode is read when bridge-client.mjs first loads, so the state file is set before anything
// imports it (the mock AE does): this test must never reach After Effects.
const home = tempHome();
const file = path.join(home, "mock-capture.json");
const stateFile = path.join(home, "fixture-state.json");
fs.writeFileSync(stateFile, JSON.stringify({ project: "mock-capture.json" }));
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;
const { comp, run } = await import("./fixtures/expressions/mock-ae.mjs");
const capture = { taken_at: "2026-11-14T00:00:00.000Z", ...run(comp(), { measure_layers: [1] }) };
fs.writeFileSync(file, JSON.stringify(capture));

const { takeSnapshot } = await import("../lib/snapshot.mjs");
const { assemble } = await import("../bridge-client.mjs");
const { expressionReads } = await import("../lib/expressions.mjs");
const strip = ({ taken_at, ...rest }) => rest;

test("fixture mode returns the saved expressions and sweeps as captured", async () => {
  const snap = await takeSnapshot();
  assert.deepEqual(strip(snap), strip(capture));
  assert.ok(snap.expression_sweeps.some((w) => w.kind === "fine" && w.layer === 1));
  assert.equal(snap.fine_not_read, undefined);
});

test("a fine sweep asked for a layer the capture wasn't measured with is not read: fixture", async () => {
  const snap = await takeSnapshot({ measure_layers: [1, 7] });
  assert.deepEqual(snap.fine_not_read, [{ layer: 7, reason: "fixture" }]);
  const still = expressionReads(snap).list.find((x) => x.layer === "Still");
  assert.deepEqual(still.moves.fine, { status: "not_read", reason: "fixture" });
  const shaker = expressionReads(snap).list.find((x) => x.layer === "Shaker" && x.property === "Position");
  assert.equal(shaker.moves.sweep, "fine");
});

test("an older capture (no sweeps) is returned unmarked: its readers say older_snapshot", async () => {
  const old = { ...capture };
  for (const k of ["expressions", "expressions_read", "expression_sweeps", "measured_layers"]) delete old[k];
  fs.writeFileSync(file, JSON.stringify(old));
  try {
    const snap = await takeSnapshot({ measure_layers: [1] });
    assert.equal(snap.fine_not_read, undefined);
    assert.equal(expressionReads(snap).read.reason, "older_snapshot");
  } finally {
    fs.writeFileSync(file, JSON.stringify(capture));
  }
});

test("the snippet gets measure_layers only when asked; with nothing asked it still gets {}", () => {
  const args = (code) => code.match(/var ARGS = (.*);/)[1];
  assert.equal(args(assemble("snapshot", {}).code), "{}");
  assert.equal(args(assemble("snapshot", { measure_layers: [25, 26] }).code), '{"measure_layers":[25,26]}');
});
