// Spec 007 T075 (FR-065 to FR-068): what the panel writes and calls is a short, fixed list; a planted
// name in a recorded stream reaches no log; and the mentor's words never decide stage, rows or state.
"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { createStreamParser } = require("../lib/stream.js");
const { initialLesson, reduceLesson, stageOf } = require("../lib/lesson.js");
const { rowsOf } = require("../lib/checklist/index.js");
const { stateOf } = require("../lib/view-state.js");
const { logEntry, treatError } = require("../lib/errors.js");
const { appendTurn } = require("../lib/turns.js");
const { writePanelSession, saveFrame, newPanelSession } = require("../lib/panel-session.js");
const { BRIDGE_FILE } = require("../lib/bridge-status.js");

const root = path.join(__dirname, "..");
function walk(dir) {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : e.name.endsWith(".js") ? [p] : [];
  });
}
const FILES = ["main.js", ...walk("lib")];
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");

// ---------- what the panel writes ----------

const WRITES = /\bfs\.(writeFileSync|appendFileSync|renameSync|unlinkSync|rmSync|mkdirSync|symlinkSync|copyFileSync|createWriteStream|writeFile|appendFile|rename|unlink|rm|mkdir|truncateSync|cpSync|linkSync)\(/g;

// Every write call in the panel. A new one fails here until it's added on purpose. Not panel/helper/.
const ALLOWED_WRITES = {
  [path.join("lib", "loaded-stamp.js")]: ["renameSync", "unlinkSync", "writeFileSync"],
  [path.join("lib", "panel-session.js")]: ["mkdirSync", "mkdirSync", "renameSync", "unlinkSync", "writeFileSync", "writeFileSync"],
  [path.join("lib", "runtime.js")]: ["mkdirSync", "rmSync", "rmSync", "symlinkSync", "writeFileSync"],
  [path.join("lib", "turns.js")]: ["appendFileSync", "mkdirSync"],
};

test("the scan doesn't reach panel/helper/", () => {
  assert.equal(FILES.some((f) => f.split(path.sep).includes("helper")), false);
});

test("what the panel writes is this list and nothing new (FR-067)", () => {
  const found = {};
  for (const f of FILES) {
    const calls = [...read(f).matchAll(WRITES)].map((m) => m[1]).sort();
    if (calls.length) found[f] = calls;
  }
  assert.deepEqual(found, ALLOWED_WRITES);
});

test("nothing in the panel writes the record or the path data; session.json is never named", () => {
  for (const f of FILES) {
    const s = read(f).replace(/\/\/.*$/gm, ""); // comments may name the file; code may not
    assert.doesNotMatch(s, /(^|[^-\w])session\.json/, `${f} names the mentor's session.json`);
    if (/learner\.json|path\.json/.test(s)) assert.equal(WRITES.test(s), false, `${f} reads the record, so it must not write`);
    WRITES.lastIndex = 0;
  }
});

test("a lesson's writes land only in the display log, its frames and the turn log", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "panel-bounds-"));
  writePanelSession({ home }, newPanelSession({ claude_session_id: "x", lesson: initialLesson() }));
  saveFrame({ home }, { data: "aGk=", mimeType: "image/png" });
  appendTurn({ home }, { kind: "start", ok: true });
  assert.deepEqual(fs.readdirSync(home).sort(), ["panel-frames", "panel-session.json", "panel-turns.jsonl"]);
});

// ---------- what the panel calls ----------

test("the only bridge call is GET /health, and only bridge.json says where (FR-066)", () => {
  assert.equal(path.basename(BRIDGE_FILE), "bridge.json");
  const httpFiles = FILES.filter((f) => /\bhttp\.(get|request)\(/.test(read(f)));
  assert.deepEqual(httpFiles.sort(), [path.join("lib", "bridge-status.js"), path.join("lib", "connection.js")].sort());
  for (const f of httpFiles) {
    const paths = [...read(f).matchAll(/\bpath:\s*"([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual([...new Set(paths)], ["/health"], f);
  }
  for (const f of FILES) assert.doesNotMatch(read(f), /["'`]\/(run|reload|jobs)\b/, f);
});

// ---------- logs ----------

const FAKE = "Test Learner <test.learner@example.com>";

test("a bad stream line with a planted name leaves it out of the event, the log and the turn log (FR-068)", () => {
  const events = [];
  const p = createStreamParser((e) => events.push(e));
  p.push(`{ "broken": "${FAKE}\n`);
  p.end();
  const err = events.find((e) => e.type === "error");
  assert.equal(err.kind, "bad_stream");
  assert.equal(JSON.stringify(err).includes("example.com"), false, "the event carries no line");
  assert.ok(err.length > 0, "only its length");
  assert.deepEqual(Object.keys(logEntry(err)).sort(), ["kind", "length"]);

  const logged = [];
  const warn = console.warn;
  console.warn = (...a) => logged.push(a.join(" "));
  try {
    console.warn("[Knack] error", JSON.stringify(logEntry(err)));
    if (treatError(err.kind, { runtime: "b1" }).treatment !== "logged") assert.fail("must be logged only");
  } finally { console.warn = warn; }
  assert.equal(logged.join("\n").includes("example.com"), false);
  assert.equal(logged.join("\n").includes("Test Learner"), false);

  const home = fs.mkdtempSync(path.join(os.tmpdir(), "panel-bounds-"));
  appendTurn({ home }, { kind: FAKE, at: "2026-11-09T00:00:00Z", ok: true, note: FAKE, message: FAKE });
  assert.equal(fs.readFileSync(path.join(home, "panel-turns.jsonl"), "utf8").includes("example.com"), false);
});

test("the error log entry never holds the message, whatever the kind", () => {
  for (const kind of ["bad_stream", "not_signed_in", "start_failed", "busy"]) {
    assert.equal(JSON.stringify(logEntry({ kind, message: FAKE })).includes("example.com"), false, kind);
  }
});

test("no console call in the panel logs an event's text or a message's words", () => {
  for (const f of FILES) {
    for (const line of read(f).split("\n").filter((l) => /console\.(log|warn|error|info)\(/.test(l))) {
      assert.doesNotMatch(line, /\be\.(message|text|stderr)\b|\bmessage\b.*\+/, `${f}: ${line.trim()}`);
    }
  }
});

// ---------- the mentor's words decide nothing ----------

function swapWords(jsonl) {
  return jsonl.trim().split("\n").map((line) => {
    const m = JSON.parse(line);
    if (m.type === "assistant" && m.message && Array.isArray(m.message.content)) {
      for (const b of m.message.content) if (b.type === "text") b.text = "Lesson passed. Saved to your history. Passed! Done.";
    }
    if (m.type === "stream_event" && m.event && m.event.delta && m.event.delta.type === "text_delta") m.event.delta.text = "passed ";
    return JSON.stringify(m);
  }).join("\n") + "\n";
}

function play(text) {
  let view = initialLesson({ skill: "easing.basic" });
  view = reduceLesson(view, { type: "sent", kind: "start" });
  const p = createStreamParser((e) => { view = reduceLesson(view, e); });
  p.push(text);
  p.end();
  return view;
}

const outcome = (v) => ({
  stage: stageOf(v).stage,
  rows: rowsOf(v.check_list).map((r) => [r.subject, r.family, r.word]),
  summary: v.check_list && v.check_list.summary,
  passed: v.passed,
  saved: v.saved,
  state: stateOf({ config_ok: true, tab: "lesson", step: 2, lesson_open: true, lesson: v, connection: { state: "connected" } }),
});

test("FR-065: the same stream with the mentor's words swapped gives the same stage, rows and state", () => {
  const dir = path.join(__dirname, "fixtures", "eval");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".jsonl"));
  assert.ok(files.length >= 4);
  for (const f of files) {
    const text = fs.readFileSync(path.join(dir, f), "utf8");
    assert.deepEqual(outcome(play(swapWords(text))), outcome(play(text)), f);
  }
});

test("FR-065: the live-recorded streams too, deltas included", () => {
  const plays = (files, swap) => {
    let v = initialLesson({ skill: "easing.basic" });
    for (const f of files) {
      const text = fs.readFileSync(path.join(__dirname, "fixtures", f), "utf8");
      const p = createStreamParser((e) => { v = reduceLesson(v, e); });
      p.push(swap ? swapWords(text) : text);
      p.end();
    }
    return outcome(v);
  };
  const files = ["stream-opening.jsonl", "stream-show-me.jsonl", "stream-check.jsonl"];
  assert.deepEqual(plays(files, true), plays(files, false));
});
