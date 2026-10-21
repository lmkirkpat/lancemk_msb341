// Fixture twins (research R9, contracts/skill-module.md › 5): fixture mode loads a skill's
// mentor/fixture/<snippet>.mjs, records its edits with the snippet's name, and replays each edit
// with its own twin on later snapshots. Run in-process, with the twin folder pointed at a temp copy.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const twins = fs.mkdtempSync(path.join(os.tmpdir(), "ae-mentor-twins-"));
fs.copyFileSync(path.join(FIXTURES, "sample-skill", "fixture", "sample-snippet.mjs"), path.join(twins, "sample-snippet.mjs"));
const stateFile = path.join(home, "fixture-state.json");
fs.writeFileSync(stateFile, JSON.stringify({ project: path.join(FIXTURES, "synthetic", "attempt-before.json") }));
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;
process.env.AE_MENTOR_FIXTURE_TWINS = twins;

const { runSnippet } = await import("../bridge-client.mjs");
const EDITS = path.join(home, "fixture-edits.json");
const edits = () => JSON.parse(fs.readFileSync(EDITS, "utf8"));
const POS = "ADBE Transform Group/ADBE Position";

beforeEach(() => fs.rmSync(EDITS, { force: true }));

test("a twin is found by snippet name, and its run gets the current snapshot and saveEdit", async () => {
  const r = await runSnippet("sample-snippet", { note: "one" }, { undo: true });
  assert.deepEqual(r, { comp: "Lower Third", layers: 2, notes_before: [] });
});

test("saved edits carry the snippet's name and the comp", async () => {
  await runSnippet("sample-snippet", { note: "one" });
  assert.deepEqual(edits(), [{ snippet: "sample-snippet", comp_id: 200, note: "one" }]);
  await runSnippet("set-ease", { comp_id: 200, layer_index: 1, property_path: POS, key_index: 1 });
  assert.equal(edits()[1].snippet, "set-ease", "the built-in ease edit carries its name too");
});

test("on the next snapshot, each edit is replayed by its own twin", async () => {
  await runSnippet("sample-snippet", { note: "one" });
  await runSnippet("set-ease", { comp_id: 200, layer_index: 1, property_path: POS, key_index: 1 });
  await runSnippet("sample-snippet", { note: "two" });
  const snap = await runSnippet("snapshot", {});
  assert.deepEqual(snap.sample_notes, ["one", "two"]);
  assert.equal(snap.layers[0].properties[0].keys[0].out_type, "bezier", "the ease edit replays as before");
  const again = await runSnippet("sample-snippet", { note: "three" });
  assert.deepEqual(again.notes_before, ["one", "two"], "a twin's run sees earlier edits applied");
});

test("an old edit with no snippet replays as an ease (existing eval fixtures keep working)", async () => {
  fs.writeFileSync(EDITS, JSON.stringify([{ comp_id: 200, layer_index: 1, property_path: POS, key_index: 1 }]));
  const snap = await runSnippet("snapshot", {});
  const keys = snap.layers[0].properties[0].keys;
  assert.equal(keys[0].out_type, "bezier");
  assert.equal(keys[1].in_type, "bezier");
  assert.deepEqual(keys[0].out_ease, [{ speed: 0, influence: 33.33 }]);
});

test("edits for another comp aren't replayed", async () => {
  fs.writeFileSync(EDITS, JSON.stringify([{ snippet: "sample-snippet", comp_id: 999, note: "elsewhere" }]));
  const snap = await runSnippet("snapshot", {});
  assert.equal(snap.sample_notes, undefined);
});

test("an unknown snippet still throws", async () => {
  await assert.rejects(runSnippet("no-such-snippet", {}), /no snippet named no-such-snippet/);
  await assert.rejects(runSnippet("../escape", {}), /no snippet named/);
});

test("the fixture file itself is never written", async () => {
  const file = path.join(FIXTURES, "synthetic", "attempt-before.json");
  const original = fs.readFileSync(file, "utf8");
  await runSnippet("sample-snippet", { note: "one" });
  await runSnippet("snapshot", {});
  assert.equal(fs.readFileSync(file, "utf8"), original);
});
