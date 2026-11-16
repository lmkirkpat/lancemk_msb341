// Spec 015 T061: a record_lesson with one field copying an expression and another holding an email
// or phone number is refused for the copy (RECORD_HAS_EXPRESSION, checked first, the same reply as
// before), and its calls.jsonl line leaves out both: the copied field and every unsafe one, by name
// only in `omitted_fields`. On the live 015 Rig capture, on a fresh server per turn (B1).

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
const { COPY_RUN } = await import("../tools/common.mjs");

const CALLS = path.join(home, "calls.jsonl");
const SERVER = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "server.mjs");
const RIG = JSON.parse(fs.readFileSync(path.join(FIXTURES, "expressions", "rig.json"), "utf8"));
const SHAKE = RIG.expressions.find((x) => x.path.endsWith("ADBE Position")).text;
const RUN = SHAKE.slice(SHAKE.indexOf("impacts ="), SHAKE.indexOf("impacts =") + COPY_RUN + 6);
const EMAIL = "someone@example.edu";
const PHONE = "801-555-0123";

beforeEach(() => {
  for (const f of [path.join(home, "session.json"), CALLS, path.join(home, "learner.json")]) fs.rmSync(f, { force: true });
});

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
  const request = (method, params) => new Promise((resolve) => {
    const id = nextId++;
    waiting.set(id, resolve);
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
  });
  return {
    request,
    call: async (name, args = {}) => (await request("tools/call", { name, arguments: args })).result,
    stop: () => new Promise((r) => { child.on("exit", r); child.kill(); }),
  };
}

async function turn(f) {
  const s = startServer();
  await s.request("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test" } });
  try {
    return await f(s);
  } finally {
    await s.stop();
  }
}

const args = (over) => ({
  skill: "easing.basic", project: RIG.project, comp: RIG.comp.name, result: "not_checked", demo_used: false,
  attempted: "Looked at the sweep", summary: "Looked at the sweep's keys.", next: "Ease the sweep.", ...over,
});
const recordLine = () => fs.readFileSync(CALLS, "utf8").trim().split("\n").map(JSON.parse).filter((c) => c.tool === "record_lesson").pop();

async function refusedLine(over) {
  await turn(async (s) => assert.equal((await s.call("snapshot_project")).isError, undefined));
  const reply = await turn((s) => s.call("record_lesson", args(over)));
  assert.equal(reply.isError, true);
  assert.deepEqual(reply.content, [{ type: "text", text: `RECORD_HAS_EXPRESSION: ${MESSAGES.RECORD_HAS_EXPRESSION}` }], "the learner's reply as before");
  assert.equal(fs.existsSync(path.join(home, "learner.json")), false, "nothing saved");
  const raw = fs.readFileSync(CALLS, "utf8");
  for (const bad of [RUN.slice(0, COPY_RUN), EMAIL, PHONE]) assert.ok(!raw.includes(bad), `calls.jsonl keeps no ${bad}`);
  const line = recordLine();
  assert.equal(line.ok, false);
  assert.equal(line.error_code, "RECORD_HAS_EXPRESSION");
  return line;
}

test("a copy in summary and an email in next: both are left out of the log", async () => {
  const line = await refusedLine({ summary: `The null runs ${RUN} on its Position.`, next: `Write to ${EMAIL}.` });
  assert.deepEqual(line.omitted_fields, ["summary", "next"]);
  assert.deepEqual(Object.keys(line.args).sort(), ["attempted", "comp", "demo_used", "project", "result", "skill"]);
});

test("a copy in next and a phone number in the comp name: both left out, in the arguments' order", async () => {
  const line = await refusedLine({ comp: `Rig for ${PHONE}`, next: `Look at ${RUN}` });
  assert.deepEqual(line.omitted_fields, ["comp", "next"]);
  assert.equal(line.args.summary, "Looked at the sweep's keys.", "a safe field is kept");
});

test("a field holding both a copy and an email is named once", async () => {
  const line = await refusedLine({ attempted: `Eased ${RUN} for ${EMAIL}` });
  assert.deepEqual(line.omitted_fields, ["attempted"]);
});

test("a copy alone is logged as before: only the copied field left out", async () => {
  const line = await refusedLine({ summary: `The null runs ${RUN} on its Position.` });
  assert.deepEqual(line.omitted_fields, ["summary"]);
  assert.equal(line.args.next, "Ease the sweep.");
});
