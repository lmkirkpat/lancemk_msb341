// A test double for lib/app.js's dependencies. Not a test file (package.json runs *.test.js only).
"use strict";

const { createApp } = require("../lib/app.js");
const ps = require("../lib/panel-session.js");

const PATH_DATA = { skills: [{ id: "easing.basic", name: "Easing" }, { id: "keyframes.types", name: "Pick the key type on purpose" }] };
const SIX_PATH = { on_ramp: { id: "keyframes", name: "Setting keyframes" }, skills: [
  { id: "easing.basic", name: "Easing", hard: ["keyframes"] }, { id: "keyframes.types", name: "Pick the key type on purpose", hard: ["easing.basic"] }, { id: "easing.speed_graph", name: "Shape the ease in the speed graph", hard: ["easing.basic"] },
  { id: "timing.offset", name: "Break the lockstep with offset", hard: ["easing.basic"] }, { id: "motion.sources", name: "Find what's moving it", hard: ["keyframes"] }, { id: "transform.anchor", name: "Set the pivot (anchor point)", hard: ["keyframes"] },
  { id: "parenting.null", name: "Move a group with a null", hard: ["transform.anchor"] }, { id: "shape.trim_paths", name: "Draw it on with Trim Paths", hard: ["easing.basic"] },
] };
// The fixture for T029's skills-built.json until it's merged (data-model's shape).
const SKILLS_BUILT = { skills: { "easing.basic": { review: false }, "keyframes.types": { review: true }, "easing.speed_graph": { review: true }, "timing.offset": { review: true }, "transform.anchor": { review: true }, "parenting.null": { review: true } } };
const CONNECTED = { state: "connected", started: "2026-11-09T09:00:00.000Z" };

const LESSON = { skills: { "easing.basic": { status: "learned", next: "Glow next." } }, lessons: [{ skill: "easing.basic", date: "2026-10-26T12:00:00.000Z", result: "passed" }] };

function fakeAdapter(opts) {
  const handlers = {};
  const a = {
    announcesCalls: !!(opts && opts.announcesCalls),
    handsOver: !!(opts && opts.handsOver),
    started: [], sent: [], stopped: 0,
    start(o) { a.started.push(o || {}); if (opts && opts.onStart) opts.onStart(a); return (o && o.resumeSessionId) || "session-1"; },
    send(text, kind) { if (opts && opts.sendThrows) throw opts.sendThrows; a.sent.push({ text, kind }); },
    stop() { a.stopped++; },
    busy: () => false,
    on(type, h) { (handlers[type] = handlers[type] || []).push(h); return a; },
    emit(type, payload) { (handlers[type] || []).forEach((h) => h(Object.assign({ type }, payload))); },
  };
  return a;
}

// opts: { memory, pathData, runtime, saved, adapter, sendThrows, onStart }.
function makeApp(opts) {
  const o = opts || {};
  const adapters = [];
  const log = [];
  const saved = { current: o.saved === undefined ? null : o.saved };
  const session = {
    read: () => saved.current,
    write: (s) => { saved.current = JSON.parse(JSON.stringify(s)); },
    clear: () => { saved.current = null; },
    saveFrame: () => "/tmp/frame.png",
    readFrame: (f) => (f === "/gone.png" ? null : "AAAA"),
    newSession: ps.newPanelSession,
    savedStatus: ps.savedStatus,
  };
  let polled = 0;
  const app = createApp({
    cfg: { ok: true, runtime: o.runtime || "b1" },
    createAdapter: () => { const a = fakeAdapter({ announcesCalls: o.runtime === "a", handsOver: o.runtime === "a", sendThrows: o.sendThrows, onStart: o.onStart }); adapters.push(a); return a; },
    readRecord: o.readRecord || (() => Promise.resolve(o.memory || { status: "missing", record: null })),
    pathData: o.pathData === undefined ? PATH_DATA : o.pathData,
    skillsBuilt: o.skillsBuilt === undefined ? SKILLS_BUILT : o.skillsBuilt,
    session,
    appendTurn: (e) => log.push(e),
    bridgeStarted: o.bridgeStarted || (() => Promise.resolve(CONNECTED.started)),
    pollNow: () => { polled++; return Promise.resolve(CONNECTED); },
    forgetPoll: o.forgetPoll || (() => {}),
    log: (entry) => { if (o.logSink) o.logSink.push(entry); },
    onChange: () => {},
    setTimeout: o.setTimeout,
    now: () => new Date("2026-11-09T12:00:00.000Z"),
  });
  return { app, adapters, turns: log, session, saved, polled: () => polled, adapter: () => adapters[adapters.length - 1] };
}

// Plays a recorded stream line by line into the current adapter, as the real adapter would.
function play(h, file) {
  const { createStreamParser } = require("../lib/stream.js");
  const fs = require("fs");
  const path = require("path");
  const p = createStreamParser((e) => { const { type, ...rest } = e; h.adapter().emit(type, Object.assign(rest, { kind: h.adapter().sent.length ? h.adapter().sent[h.adapter().sent.length - 1].kind : "start" })); });
  p.push(fs.readFileSync(path.join(__dirname, "fixtures", file), "utf8"));
  p.end();
}

// HTML back to the words a person reads, so tests compare against the copy as written.
const plain = (s) => String(s).replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

const tick = () => new Promise((r) => setImmediate(r));

// A ready app on Home, connected.
async function ready(opts) {
  const h = makeApp(opts);
  h.app.init();
  await tick();
  h.app.setConnection(opts && opts.connection ? opts.connection : CONNECTED);
  await tick();
  return h;
}

module.exports = { makeApp, ready, tick, plain, play, fakeAdapter, PATH_DATA, SIX_PATH, SKILLS_BUILT, CONNECTED, LESSON };
