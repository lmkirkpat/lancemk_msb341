"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("events");
const { bridgeStarted } = require("../lib/bridge-status.js");

const CFG = JSON.stringify({ port: 49152, token: "t0k" });
const fakeFs = (text) => ({ readFileSync: () => { if (text === null) throw new Error("ENOENT"); return text; } });

// A fake http.get. reply: { body } | { error: true } | { timeout: true }. Records every call.
function fakeHttp(reply) {
  const calls = [];
  return {
    calls,
    get(opts, onRes) {
      calls.push(opts);
      const req = new EventEmitter();
      req.destroy = () => {};
      setImmediate(() => {
        if (reply.error) return req.emit("error", new Error("ECONNREFUSED"));
        if (reply.timeout) return req.emit("timeout");
        const res = new EventEmitter();
        onRes(res);
        res.emit("data", reply.body);
        res.emit("end");
      });
      return req;
    },
  };
}

test("returns started from /health, calling only /health with the token and a 2 s timeout", async () => {
  const http = fakeHttp({ body: JSON.stringify({ ok: true, bridge: "1.1.0", started: "2026-10-12T15:00:00.000Z", requests: 4 }) });
  assert.equal(await bridgeStarted({ fs: fakeFs(CFG), http }), "2026-10-12T15:00:00.000Z");
  assert.equal(http.calls.length, 1);
  assert.equal(http.calls[0].path, "/health");
  assert.equal(http.calls[0].host, "127.0.0.1");
  assert.equal(http.calls[0].port, 49152);
  assert.equal(http.calls[0].timeout, 2000);
  assert.equal(http.calls[0].headers.Authorization, "Bearer t0k");
});

test("null when bridge.json is missing, unreadable or incomplete (no call made)", async () => {
  for (const text of [null, "{ broken", JSON.stringify({ port: 1 })]) {
    const http = fakeHttp({ body: "{}" });
    assert.equal(await bridgeStarted({ fs: fakeFs(text), http }), null);
    assert.equal(http.calls.length, 0);
  }
});

test("null on connection error, timeout, a bad reply, or no started field", async () => {
  for (const reply of [{ error: true }, { timeout: true }, { body: "not json" }, { body: JSON.stringify({ ok: false, error: "bad token" }) }, { body: JSON.stringify({ ok: true }) }]) {
    assert.equal(await bridgeStarted({ fs: fakeFs(CFG), http: fakeHttp(reply) }), null);
  }
});
