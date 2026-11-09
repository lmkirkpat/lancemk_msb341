// Spec 007 T005: the connection mark (FR-002, FR-057, FR-091), plus the start time FR-028 compares.
"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("events");
const { readConnection, connectionFromTool, createPoller, POLL_MS, CONNECTED, NOT_CONNECTED, BUSY } = require("../lib/connection.js");
const { bridgeStarted } = require("../lib/bridge-status.js");

const fsWith = (cfg) => ({ readFileSync: () => JSON.stringify(cfg) });
const OK = fsWith({ port: 47671, token: "t" });

// A stand-in for http.get. behave(req, callback) decides what the bridge does.
function fakeHttp(behave, seen) {
  return {
    get(options, cb) {
      if (seen) seen.push(options);
      const req = new EventEmitter();
      req.destroy = () => {};
      setImmediate(() => behave(req, cb));
      return req;
    },
  };
}

function answer(body) {
  return (req, cb) => {
    const res = new EventEmitter();
    cb(res);
    res.emit("data", typeof body === "string" ? body : JSON.stringify(body));
    res.emit("end");
  };
}

test("an answer is connected, with the bridge's start time", async () => {
  const seen = [];
  const r = await readConnection({ fs: OK, http: fakeHttp(answer({ ok: true, started: "2026-11-09T10:00:00Z" }), seen) });
  assert.deepEqual(r, { state: CONNECTED, started: "2026-11-09T10:00:00Z" });
  assert.equal(seen[0].path, "/health");
  assert.equal(seen[0].host, "127.0.0.1");
  assert.equal(seen[0].timeout, 2000);
});

test("nothing listening is not connected", async () => {
  const r = await readConnection({ fs: OK, http: fakeHttp((req) => req.emit("error", Object.assign(new Error("x"), { code: "ECONNREFUSED" }))) });
  assert.deepEqual(r, { state: NOT_CONNECTED, started: null });
});

test("no answer within 2 s is busy, and busy has no start time (FR-028 keeps the saved session)", async () => {
  const r = await readConnection({ fs: OK, http: fakeHttp((req) => req.emit("timeout")) });
  assert.deepEqual(r, { state: BUSY, started: null });
});

test("no bridge file, or one with no port or token, is not connected", async () => {
  const missing = { readFileSync() { throw new Error("ENOENT"); } };
  assert.equal((await readConnection({ fs: missing, http: fakeHttp(() => {}) })).state, NOT_CONNECTED);
  assert.equal((await readConnection({ fs: fsWith({ port: 1 }), http: fakeHttp(() => {}) })).state, NOT_CONNECTED);
});

test("an answer it can't use is not connected: a refused token, or nonsense", async () => {
  for (const body of ["not json", { ok: false, error: "bad token" }]) {
    assert.deepEqual(await readConnection({ fs: OK, http: fakeHttp(answer(body)) }), { state: NOT_CONNECTED, started: null });
  }
});

test("an answer with no start time is connected, with started null", async () => {
  assert.deepEqual(await readConnection({ fs: OK, http: fakeHttp(answer({ ok: true })) }), { state: CONNECTED, started: null });
});

test("bridgeStarted keeps its contract: the start time or null, busy included", async () => {
  assert.equal(await bridgeStarted({ fs: OK, http: fakeHttp(answer({ ok: true, started: "s" })) }), "s");
  assert.equal(await bridgeStarted({ fs: OK, http: fakeHttp((req) => req.emit("timeout")) }), null);
});

test("a tool's AE_BUSY or AE_UNREACHABLE also sets the mark; other results don't", () => {
  assert.equal(connectionFromTool({ type: "tool_result", ok: false, text: "AE_BUSY: rendering" }), BUSY);
  assert.equal(connectionFromTool({ type: "tool_result", ok: false, text: "AE_UNREACHABLE: gone" }), NOT_CONNECTED);
  assert.equal(connectionFromTool({ type: "tool_result", ok: false, text: "DEMO_USED" }), null);
  assert.equal(connectionFromTool({ type: "tool_result", ok: true, text: "AE_BUSY mentioned in passing" }), null);
});

// ---------- the poll ----------

function clock() {
  const c = { fn: null, ms: null, setInterval: (fn, ms) => { c.fn = fn; c.ms = ms; return 1; }, clearInterval: () => { c.fn = null; } };
  return c;
}
const tick = () => new Promise((r) => setImmediate(r));

test("polls every 5 s while visible, reports only changes, and stops when hidden", async () => {
  assert.equal(POLL_MS, 5000);
  const c = clock();
  const answers = [{ state: CONNECTED, started: "a" }, { state: CONNECTED, started: "a" }, { state: BUSY, started: null }];
  const changes = [];
  let reads = 0;
  const p = createPoller({ read: async () => answers[reads++], onChange: (v) => changes.push(v), timers: c });
  p.setVisible(true);
  assert.equal(c.ms, 5000);
  await tick(); // the first read happens at once
  c.fn();
  await tick();
  c.fn();
  await tick();
  assert.equal(reads, 3);
  assert.deepEqual(changes, [answers[0], answers[2]]);
  p.setVisible(false);
  assert.equal(c.fn, null);
});

test("Try again reads now, and a slow read isn't overlapped", async () => {
  const c = clock();
  let reads = 0;
  let release;
  const p = createPoller({ read: () => { reads++; return new Promise((r) => { release = r; }); }, onChange: () => {}, timers: c });
  const first = p.now();
  p.now();
  assert.equal(reads, 1);
  release({ state: CONNECTED, started: null });
  await first;
  assert.deepEqual(p.current(), { state: CONNECTED, started: null });
});
