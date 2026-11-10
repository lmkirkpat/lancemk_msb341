// Spec 013 T045's live bug (2026-11-10): an offset lesson on A, Show me pressed, the panel closed
// while the demo ran, and on reopening there was no Continue lesson. Closing the panel (main.js's
// beforeunload → app.shutdown) stops the helper; the adapter then ends the turn it was waiting on
// and emits exit, and the app took that exit for the mentor going away (FR-056) and marked the
// saved lesson ended. Spec 013 US4 scenario 5 says a close during a demo still continues.
"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("events");
const { ready, tick, CONNECTED } = require("./app-harness.js");
const ps = require("../lib/panel-session.js");
const { createAdapter: apiAdapter } = require("../lib/adapter-api.js");

const st = (h) => h.app.model().state;

const OFFSET_SNAP = { name: "offset_snapshot", ok: true, text: "", images: [], json: { mode: "lesson", lesson: "new", group: { kind: "properties", members: [{ target: "6/a", label: "Position", start: 0.5, end: 1.5 }, { target: "6/b", label: "Opacity", start: 0.5, end: 1.5 }] }, targets: ["6/a", "6/b"], focus: ["Dot 2"], demo_target: "6/b" } };

// The live run up to the close: new lesson, the opening, a typed reply, then Show me in flight
// with the demo's call seen.
// emit(h, type, payload): how the mentor's events arrive (the fake adapter's emit by default).
async function offsetShowMeInFlight(opts, emitVia) {
  const h = await ready(Object.assign({ runtime: "a" }, opts));
  const emit = emitVia || ((type, payload) => h.adapter().emit(type, payload));
  h.app.act("new_lesson", { skill: "timing.offset" });
  emit("tool_call", { name: "offset_snapshot" });
  emit("tool_result", OFFSET_SNAP);
  emit("text", { text: "Which should go first?" });
  emit("turn_end", { ok: true, kind: "new_lesson" });
  assert.equal(h.app.ask("Position first, a second apart."), true);
  emit("text", { text: "Good." });
  emit("turn_end", { ok: true, kind: "ask" });
  h.app.act("show_me");
  emit("tool_call", { name: "offset_demo" });
  return h;
}

// What the A adapter does once stopped (adapter-api.js, close with stopped set): the turn in
// flight ends not ok with no error kind (the logged 05:12:29 show_me line), then exit.
function closeAsAdapterDoes(a) {
  a.emit("turn_end", { ok: false, kind: "show_me", cost_usd: null, error_kind: null });
  a.emit("exit", { code: 0 });
}

async function reopen(h) {
  return ready({ runtime: "a", saved: h.saved.current });
}

test("T045 bug: offset lesson, demo running, panel closed → Continue lesson offered on reopening", async () => {
  const h = await offsetShowMeInFlight();
  h.app.shutdown();
  closeAsAdapterDoes(h.adapter());
  await tick();
  assert.equal(h.saved.current.ended, false, "closing the panel isn't the lesson ending");
  assert.equal(ps.canContinue(h.saved.current, CONNECTED.started), true);
  const again = await reopen(h);
  assert.equal(st(again), "home-cutoff");
  again.app.act("continue");
  assert.deepEqual(again.adapter().started[0], { resumeSessionId: "session-1", skill: "offset-mentor" });
  assert.equal(again.adapter().sent[0].kind, "continue");
});

test("closing between turns keeps the lesson waiting too", async () => {
  const h = await offsetShowMeInFlight();
  h.adapter().emit("tool_result", { name: "offset_demo", ok: true, text: "", images: [], json: { layer: "Dot 2", shift_frames: 30 } });
  h.adapter().emit("turn_end", { ok: true, kind: "show_me" });
  h.app.shutdown();
  h.adapter().emit("exit", { code: 0 });
  await tick();
  assert.equal(h.saved.current.ended, false);
  assert.equal(st(await reopen(h)), "home-cutoff");
});

test("a close mid-demo saves where the demo stands: may have landed, so Show me isn't offered fresh (FR-030)", async () => {
  const h = await offsetShowMeInFlight();
  h.app.shutdown();
  closeAsAdapterDoes(h.adapter());
  assert.equal(h.saved.current.lesson.demo_unknown, true);
  assert.equal(h.turns.at(-1).kind, "show_me", "the cut-off turn is still logged");
});

test("the mentor's own exit, without a close, still ends the lesson (FR-056)", async () => {
  const h = await offsetShowMeInFlight();
  closeAsAdapterDoes(h.adapter());
  assert.equal(st(h), "lesson-exited");
  assert.equal(h.saved.current.ended, true);
});

// The same close through the real A adapter, with a fake helper process.
function fakeChild() {
  const c = new EventEmitter();
  c.stdout = new EventEmitter();
  c.stderr = new EventEmitter();
  c.stdin = new EventEmitter();
  c.stdin.write = () => {};
  c.stdin.end = () => {};
  c.kill = (sig) => { if (sig === "SIGTERM") setImmediate(() => c.emit("close", 0)); };
  c.say = (obj) => c.stdout.emit("data", JSON.stringify(obj) + "\n");
  return c;
}

test("through the real A adapter: Show me in flight, panel closed, helper exits → Continue offered", async () => {
  const kids = [];
  const make = () => apiAdapter({ runtime: "a", node_path: "/n", repo_path: "/repo", home: "/h" }, {
    spawn: () => { const c = fakeChild(); kids.push(c); return c; },
    randomUUID: () => "session-1",
    log: () => {},
  });
  const h = await offsetShowMeInFlight({ createAdapter: make }, (type, payload) => kids[kids.length - 1].say(Object.assign({ type }, payload)));
  h.app.shutdown();
  await tick();
  await tick();
  assert.equal(h.turns.at(-1).ok, false);
  assert.equal(h.turns.at(-1).error_kind, null, "the logged signature of the live bug");
  assert.equal(h.saved.current.ended, false);
  assert.equal(st(await reopen(h)), "home-cutoff");
});
