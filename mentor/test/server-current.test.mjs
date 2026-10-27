// Spec 004 FR-044, research R25 (tasks-wave-b T175): the server records the mentor/ tree hash at
// start, and read_learner_record and the three lesson snapshot tools say whether it's still the one
// on disk. The hash read is injected: no real git here.

import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;

const current = await import("../lib/server-current.mjs");
const { TOOLS } = await import("../tools/index.mjs");

const HASH_A = "a".repeat(40);
const HASH_B = "b".repeat(40);
// What the injected read does: give a hash, throw, reject, or never answer.
let onDisk = HASH_A;
let behave = () => onDisk;
const reader = () => behave();
const throws = () => { throw new Error("not a repository"); };
const rejects = () => Promise.reject(new Error("git missing"));
const hangs = () => new Promise(() => {});

const callText = async (name, args = {}) => (await TOOLS.find((t) => t.name === name).handler(args)).content[0].text;
const call = async (name, args = {}) => JSON.parse(await callText(name, args));

beforeEach(async () => {
  for (const f of ["session.json", "fixture-edits.json", "learner.json"]) fs.rmSync(path.join(home, f), { force: true });
  fs.writeFileSync(stateFile, JSON.stringify({ project: path.join(FIXTURES, "practice2-before.json") }));
  onDisk = HASH_A;
  behave = () => onDisk;
  current.setHashReader(reader, { timeoutMs: 50 });
  await current.recordStart();
});
after(() => current.setHashReader(null));

test("the same hash at start and now: true", async () => {
  assert.equal(await current.serverCurrent(), true);
});

test("a different hash now: false", async () => {
  onDisk = HASH_B;
  assert.equal(await current.serverCurrent(), false);
});

for (const [what, fail] of [["throws", throws], ["rejects", rejects], ["never answers (a time-out)", hangs]]) {
  test(`a read that ${what}: null, whether now or at start`, async () => {
    behave = fail;
    assert.equal(await current.serverCurrent(), null, "the read now fails");
    await current.recordStart();
    behave = () => onDisk;
    assert.equal(await current.serverCurrent(), null, "the read at start failed");
    await current.recordStart();
    assert.equal(await current.serverCurrent(), true, "a good start read recovers");
  });
}

test("no start recorded: null", async () => {
  current.setHashReader(reader, { timeoutMs: 50 }); // a new reader forgets the start hash
  assert.equal(await current.serverCurrent(), null);
});

test("a reply that isn't a hash counts as a failed read", async () => {
  onDisk = "fatal: not a repository";
  await current.recordStart();
  assert.equal(await current.serverCurrent(), null);
});

const TOOLS_WITH_FIELD = ["read_learner_record", "speed_graph_snapshot", "key_types_snapshot", "offset_snapshot"];

for (const name of TOOLS_WITH_FIELD) {
  test(`${name} carries server_current: true, then false after the hash changes`, async () => {
    assert.equal((await call(name)).server_current, true);
    fs.rmSync(path.join(home, "session.json"), { force: true });
    onDisk = HASH_B;
    assert.equal((await call(name)).server_current, false);
  });

  test(`${name}: null when the read fails, and no reply carries the hash or a path`, async () => {
    behave = throws;
    const text = await callText(name);
    assert.equal(JSON.parse(text).server_current, null);
    behave = () => onDisk;
    fs.rmSync(path.join(home, "session.json"), { force: true });
    const ok = await callText(name);
    assert.equal(JSON.parse(ok).server_current, true);
    for (const t of [text, ok]) {
      assert.ok(!t.includes(HASH_A) && !t.includes(HASH_B), "never the hash");
      assert.ok(!t.includes(current.MENTOR_DIR), "never the server's folder");
    }
  });
}

test("snapshot_project (easing) doesn't have it", async () => {
  const r = await call("snapshot_project");
  assert.ok(!("server_current" in r));
  onDisk = HASH_B;
  assert.ok(!("server_current" in (await call("snapshot_project"))));
});
