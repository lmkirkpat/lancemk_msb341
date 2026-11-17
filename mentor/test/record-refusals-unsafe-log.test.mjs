// Spec 015 T062 (b): every record_lesson refusal, not only UNSAFE_RECORD and RECORD_HAS_EXPRESSION,
// logs its calls.jsonl line without the fields holding an email or phone number (by name only, in
// `omitted_fields`). Covered here: RECORD_MISMATCH (with a lesson and without), LESSON_ALREADY_SAVED,
// and validation's plain errors that come before the email check (an unknown skill, a bad result, a
// missing text field). The learner's reply is the same as for the same call without the unsafe text.
// On the live 015 Rig capture, a fresh server per turn (B1).

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

const CALLS = path.join(home, "calls.jsonl");
const SESSION = path.join(home, "session.json");
const LEARNER = path.join(home, "learner.json");
const SERVER = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "server.mjs");
const RIG = JSON.parse(fs.readFileSync(path.join(FIXTURES, "expressions", "rig.json"), "utf8"));
const EMAIL = "someone@example.edu";
const PHONE = "801-555-0123";

beforeEach(() => {
  for (const f of [SESSION, CALLS, LEARNER]) fs.rmSync(f, { force: true });
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
const lines = () => fs.readFileSync(CALLS, "utf8").trim().split("\n").map(JSON.parse).filter((c) => c.tool === "record_lesson");

// The same refused call twice, once safe and once with unsafe text in `unsafe`: the replies are the
// same, the unsafe line omits exactly the unsafe fields, and the safe line omits nothing.
async function compare(base, unsafe, { lesson = true } = {}) {
  const run = async (over) => {
    for (const f of [SESSION, LEARNER]) fs.rmSync(f, { force: true });
    if (lesson) await turn(async (s) => assert.equal((await s.call("snapshot_project")).isError, undefined));
    return turn((s) => s.call("record_lesson", args({ ...base, ...over })));
  };
  const safe = await run({});
  const bad = await run(unsafe);
  assert.equal(bad.isError, true);
  assert.deepEqual(bad, safe, "the learner's reply is unchanged");
  assert.equal(fs.existsSync(LEARNER), false, "nothing saved");
  const raw = fs.readFileSync(CALLS, "utf8");
  assert.ok(!raw.includes(EMAIL) && !raw.includes(PHONE), "calls.jsonl keeps no email or phone number");
  const [safeLine, badLine] = lines().slice(-2);
  assert.equal("omitted_fields" in safeLine, false);
  assert.deepEqual(badLine.omitted_fields, Object.keys(args({ ...base, ...unsafe })).filter((k) => k in unsafe));
  assert.equal(badLine.error_code, safeLine.error_code);
  return badLine;
}

test("RECORD_MISMATCH in a lesson: an email in summary is left out of the log", async () => {
  const line = await compare({ result: "passed" }, { summary: `Write to ${EMAIL}.` });
  assert.equal(line.error_code, "RECORD_MISMATCH");
  assert.equal(line.args.next, "Ease the sweep.", "a safe field is kept");
});

test("RECORD_MISMATCH without a lesson: a phone number in next and an email in comp are both left out", async () => {
  const line = await compare({ result: "partial" }, { comp: `Rig for ${EMAIL}`, next: `Call ${PHONE}.` }, { lesson: false });
  assert.equal(line.error_code, "RECORD_MISMATCH");
});

test("LESSON_ALREADY_SAVED: an email is left out of the log", async () => {
  // A passed lesson saved once; the second save is refused.
  const session = await import("../lib/session.mjs");
  const saveTwice = async (over) => {
    for (const f of [SESSION, LEARNER]) fs.rmSync(f, { force: true });
    await turn(async (s) => assert.equal((await s.call("snapshot_project")).isError, undefined));
    session.markChecked(true);
    const first = await turn((s) => s.call("record_lesson", args({ result: "passed" })));
    assert.equal(first.isError, undefined, JSON.stringify(first));
    fs.rmSync(LEARNER, { force: true });
    return turn((s) => s.call("record_lesson", args({ result: "passed", ...over })));
  };
  const safe = await saveTwice({});
  const bad = await saveTwice({ attempted: `Eased it for ${EMAIL}` });
  assert.deepEqual(bad, safe);
  assert.match(bad.content[0].text, /^LESSON_ALREADY_SAVED/);
  assert.ok(!fs.readFileSync(CALLS, "utf8").includes(EMAIL));
  assert.deepEqual(lines().pop().omitted_fields, ["attempted"]);
});

test("validation's plain errors before the email check: unknown skill, bad result, missing text", async () => {
  for (const [base, unsafe] of [
    [{ skill: "no.such.skill" }, { summary: `Write to ${EMAIL}.` }],
    [{ result: "great" }, { next: `Call ${PHONE}.` }],
    [{ attempted: undefined }, { summary: `Write to ${EMAIL}.` }],
  ]) {
    const line = await compare(base, unsafe, { lesson: false });
    assert.equal(line.error_code, null, "a plain error, as before");
  }
});
