// FR-014: fixture mode (contracts/mentor-tools.md › Fixture mode). Spawns the real server over
// stdio, the way headless Claude Code does in evals, with AE never contacted.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FIXTURES } from "./helpers.mjs";

const SERVER = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "server.mjs");
const DEMO = "1/ADBE Transform Group/ADBE Position/1";

const home = fs.mkdtempSync(path.join(os.tmpdir(), "ae-mentor-fixture-"));
const stateFile = path.join(home, "fixture-state.json");
const setProject = (project) => fs.writeFileSync(stateFile, JSON.stringify({ project }));
// Relative to the state file, the way the eval runner writes it.
const fixturePath = (name) => path.relative(home, path.join(FIXTURES, "synthetic", `${name}.json`));

// A minimal MCP client: one request at a time, replies matched by id.
function startServer() {
  const child = spawn(process.execPath, [SERVER], {
    env: { ...process.env, AE_MENTOR_HOME: home, AE_MENTOR_FIXTURE_STATE: stateFile },
    stdio: ["pipe", "pipe", "inherit"],
  });
  const waiting = new Map();
  let buf = "";
  let nextId = 1;
  child.stdout.on("data", (chunk) => {
    buf += chunk;
    let nl;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const msg = JSON.parse(buf.slice(0, nl));
      buf = buf.slice(nl + 1);
      waiting.get(msg.id)?.(msg);
      waiting.delete(msg.id);
    }
  });
  const request = (method, params) =>
    new Promise((resolve) => {
      const id = nextId++;
      waiting.set(id, resolve);
      child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    });
  const call = async (name, args = {}) => (await request("tools/call", { name, arguments: args })).result;
  const stop = () => new Promise((r) => { child.on("exit", r); child.kill(); });
  return { request, call, stop };
}

const text = (result) => result.content.find((c) => c.type === "text").text;
const data = (result) => JSON.parse(text(result));
const calls = () => fs.readFileSync(path.join(home, "calls.jsonl"), "utf8").trim().split("\n").map(JSON.parse);

let server;
before(async () => {
  setProject(fixturePath("attempt-before"));
  server = startServer();
  await server.request("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test" } });
});
after(() => server.stop());

test("snapshot_project reads the fixture named in the state file", async () => {
  // Title is the only layer attempt-complete eases, the same focus as diff.test.mjs.
  const r = data(await server.call("snapshot_project", { focus_layers: ["Title"] }));
  assert.equal(r.comp.name, "Lower Third");
  assert.equal(r.project, "Synthetic.aep");
  assert.equal(r.demo_target, DEMO);
});

test("set_ease changes a copy, so diff_since_last shows eased_by_demo, and the fixture file is untouched", async () => {
  const fixtureFile = path.join(FIXTURES, "synthetic", "attempt-before.json");
  const original = fs.readFileSync(fixtureFile, "utf8");
  const eased = await server.call("set_ease", { segment_id: DEMO });
  assert.ok(!eased.isError, text(eased));
  assert.match(data(eased).eased, /Title › Position, 0\.000 s → 1\.000 s/);

  const d = data(await server.call("diff_since_last"));
  assert.equal(d.targets.find((t) => t.segment_id === DEMO).result, "eased_by_demo");
  assert.equal(fs.readFileSync(fixtureFile, "utf8"), original);
});

test("the demo survives a server restart, as between headless eval turns", async () => {
  await server.stop();
  server = startServer();
  await server.request("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test" } });
  const d = data(await server.call("diff_since_last"));
  assert.equal(d.targets.find((t) => t.segment_id === DEMO).result, "eased_by_demo");
});

test("swapping the fixture between turns changes what the tools see", async () => {
  setProject(fixturePath("attempt-complete"));
  const d = data(await server.call("diff_since_last"));
  assert.equal(d.passed, true);
});

test('"undo_demo" leaves the demo out (Edit > Undo); easing it again then counts for the learner', async () => {
  fs.writeFileSync(stateFile, JSON.stringify({ project: fixturePath("attempt-before"), undo_demo: true }));
  const undone = data(await server.call("diff_since_last"));
  assert.equal(undone.targets.find((t) => t.segment_id === DEMO).result, "still_linear");
  assert.equal(undone.demo_undone, true);
  // The same pair eased again (here, by the edit that fixture mode re-applies) is the learner's now.
  setProject(fixturePath("attempt-before"));
  const redone = data(await server.call("diff_since_last"));
  assert.equal(redone.targets.find((t) => t.segment_id === DEMO).result, "eased_by_learner");
});

test("preview_frame returns a placeholder PNG", async () => {
  const r = await server.call("preview_frame", { time: 0.5 });
  const img = r.content.find((c) => c.type === "image");
  assert.equal(img.mimeType, "image/png");
  assert.equal(Buffer.from(img.data, "base64").subarray(1, 4).toString(), "PNG");
});

test('"unreachable" makes every AE tool fail with AE_UNREACHABLE; record tools still work', async () => {
  setProject("unreachable");
  for (const [name, args] of [["snapshot_project", {}], ["preview_frame", {}], ["diff_since_last", {}]]) {
    const r = await server.call(name, args);
    assert.equal(r.isError, true, name);
    assert.match(text(r), /^AE_UNREACHABLE/, name);
  }
  const rec = await server.call("read_learner_record");
  assert.ok(!rec.isError);
});

test("every call is appended to calls.jsonl with tool, args, ok, error_code and at", () => {
  const log = calls();
  assert.ok(log.length >= 9);
  for (const c of log) for (const k of ["tool", "args", "ok", "error_code", "at"]) assert.ok(k in c, k);
  assert.equal(log.filter((c) => c.tool === "set_ease").length, 1);
  assert.equal(log.filter((c) => c.error_code === "AE_UNREACHABLE").length, 3);
});
