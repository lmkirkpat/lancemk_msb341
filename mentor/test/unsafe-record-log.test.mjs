// A record_lesson refused with UNSAFE_RECORD (an email or phone number) is logged in calls.jsonl
// without the unsafe fields' values, by name only in `omitted_fields`, the same way OQ-9 logs a
// refused expression copy. The learner's reply is unchanged.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
fs.writeFileSync(stateFile, JSON.stringify({ project: path.join(FIXTURES, "expressions", "rig.json") }));

const { MESSAGES } = await import("../errors.mjs");

const CALLS = path.join(home, "calls.jsonl");
const SERVER = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "server.mjs");
const EMAIL = "someone@example.edu";
const PHONE = "801-555-0123";

beforeEach(() => {
  for (const f of [path.join(home, "session.json"), CALLS, path.join(home, "learner.json")]) fs.rmSync(f, { force: true });
});

async function recordOnFreshServer(args) {
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
  const request = (method, params) => new Promise((resolve) => {
    const id = nextId++;
    waiting.set(id, resolve);
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
  });
  try {
    await request("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test" } });
    return (await request("tools/call", { name: "record_lesson", arguments: args })).result;
  } finally {
    await new Promise((r) => { child.on("exit", r); child.kill(); });
  }
}

const entry = (over = {}) => ({
  skill: "easing.basic", project: "Practice.aep", comp: "Mentor Practice", result: "not_checked", demo_used: false,
  attempted: "Eased the title's Position", summary: "Eased the pairs with Easy Ease.", next: "Shape an ease in the speed graph.",
  ...over,
});

const recordLine = () => fs.readFileSync(CALLS, "utf8").trim().split("\n").map(JSON.parse).filter((c) => c.tool === "record_lesson").pop();

test("UNSAFE_RECORD: the reply is unchanged, nothing is saved, and the log line holds no email or phone number", async () => {
  const reply = await recordOnFreshServer(entry({ summary: `Write to ${EMAIL} about it.`, next: `Call ${PHONE} next time.` }));
  assert.equal(reply.isError, true);
  assert.deepEqual(reply.content, [{ type: "text", text: `UNSAFE_RECORD: ${MESSAGES.UNSAFE_RECORD}` }], "the learner's reply as before");
  assert.equal(fs.existsSync(path.join(home, "learner.json")), false, "nothing saved");

  const raw = fs.readFileSync(CALLS, "utf8");
  assert.ok(!raw.includes(EMAIL), "no email in calls.jsonl");
  assert.ok(!raw.includes(PHONE), "no phone number in calls.jsonl");
  const line = recordLine();
  assert.equal(line.ok, false);
  assert.equal(line.error_code, "UNSAFE_RECORD");
  assert.deepEqual(line.omitted_fields, ["summary", "next"], "both unsafe fields, the refused one and the later one");
  assert.deepEqual(Object.keys(line.args).sort(), ["attempted", "comp", "demo_used", "project", "result", "skill"]);
  assert.equal(line.args.attempted, "Eased the title's Position", "a safe field is kept");
});

test("UNSAFE_RECORD on the comp name alone omits only that field", async () => {
  const reply = await recordOnFreshServer(entry({ comp: `Comp for ${EMAIL}` }));
  assert.equal(reply.isError, true);
  const line = recordLine();
  assert.equal(line.error_code, "UNSAFE_RECORD");
  assert.deepEqual(line.omitted_fields, ["comp"]);
  assert.ok(!fs.readFileSync(CALLS, "utf8").includes(EMAIL));
  assert.equal(line.args.summary, "Eased the pairs with Easy Ease.");
});

test("a safe record is logged with every argument, as before", async () => {
  const args = entry();
  const reply = await recordOnFreshServer(args);
  assert.equal(reply.isError, undefined);
  const line = recordLine();
  assert.equal(line.ok, true);
  assert.deepEqual(line.args, args);
  assert.equal("omitted_fields" in line, false);
});
