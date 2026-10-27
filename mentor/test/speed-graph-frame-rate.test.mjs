// Spec 004 FR-039 (tasks-wave-b T168): speed_graph_snapshot returns the comp's frame rate, so a
// reading answer given as a frame can be placed in the pair. Fixture mode, on live captures.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;

const { TOOLS } = await import("../tools/index.mjs");
const call = async (name, args = {}) => JSON.parse((await TOOLS.find((t) => t.name === name).handler(args)).content[0].text);
const load = (name) => JSON.parse(fs.readFileSync(path.join(FIXTURES, name), "utf8"));

beforeEach(() => {
  for (const f of ["session.json", "fixture-edits.json", "learner.json"]) fs.rmSync(path.join(home, f), { force: true });
});

for (const name of ["practice-before.json", "practice2-60fps.json"]) {
  test(`${name}: the reply's comp carries the snapshot's frame rate, and its name and duration as before`, async () => {
    fs.writeFileSync(stateFile, JSON.stringify({ project: path.join(FIXTURES, name) }));
    const snap = load(name);
    const r = await call("speed_graph_snapshot");
    assert.equal(typeof snap.comp.frame_rate, "number");
    assert.equal(r.comp.frame_rate, snap.comp.frame_rate);
    assert.equal(r.comp.name, snap.comp.name);
    assert.equal(r.comp.duration, snap.comp.duration);
  });
}
