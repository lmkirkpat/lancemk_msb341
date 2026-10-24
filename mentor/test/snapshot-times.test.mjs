// Spec 004 wave B, tasks-wave-b T152: takeSnapshot({ sample_times }). In fixture mode a saved capture
// can't be sampled again, so sample_times is ignored and a time it lacks is comp-space's not_sampled.
// (What the snippet does with sample_times in AE is snapshot-layer-info.test.mjs's mock.)

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
const chainFile = path.join(FIXTURES, "layer-info", "synthetic", "chain.json");
fs.writeFileSync(stateFile, JSON.stringify({ project: path.relative(home, chainFile) }));
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;

const { takeSnapshot } = await import("../lib/snapshot.mjs");
const { compPosition } = await import("../lib/comp-space.mjs");
const saved = JSON.parse(fs.readFileSync(chainFile, "utf8"));
const strip = ({ taken_at, ...rest }) => rest;

test("takeSnapshot() with no argument reads the comp as before", async () => {
  const snap = await takeSnapshot();
  assert.ok(snap.taken_at);
  assert.deepEqual(strip(snap), strip(saved));
});

test("in fixture mode sample_times is ignored", async () => {
  const plain = await takeSnapshot();
  const asked = await takeSnapshot({ sample_times: [0.5, 2.5] });
  assert.deepEqual(strip(asked), strip(plain));
});

test("in fixture mode a time the capture lacks gives not_sampled", async () => {
  const snap = await takeSnapshot({ sample_times: [0.5] });
  assert.deepEqual(compPosition(snap, 2, 0.5), { position: null, reason: "not_sampled" });
  assert.deepEqual(compPosition(snap, 2, 1), { position: [960, 740] });
});
