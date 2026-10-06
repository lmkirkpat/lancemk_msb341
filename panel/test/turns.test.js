"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { appendTurn } = require("../lib/turns.js");

const read = (home) => fs.readFileSync(path.join(home, "panel-turns.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));

test("appends one line per turn with exactly the logged fields", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "panel-turns-"));
  appendTurn({ home }, { at: "2026-10-05T20:00:00.000Z", kind: "check", wait_ms: 9656, first_event_ms: 2229, total_ms: 9684, cost_usd: 0.03, ok: true, lesson_passed: false, text: "secret words" });
  appendTurn({ home }, { kind: "show_me", ok: false });
  const lines = read(home);
  assert.equal(lines.length, 2);
  assert.deepEqual(Object.keys(lines[0]).sort(), ["at", "cost_usd", "first_event_ms", "kind", "lesson_passed", "ok", "total_ms", "wait_ms"]);
  assert.equal(lines[0].wait_ms, 9656);
  assert.equal(lines[1].wait_ms, null);
  assert.equal(lines[1].ok, false);
  assert.doesNotMatch(fs.readFileSync(path.join(home, "panel-turns.jsonl"), "utf8"), /secret words/);
});

test("an unknown kind is logged as ask", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "panel-turns-"));
  appendTurn({ home }, { kind: "weird", ok: true });
  assert.equal(read(home)[0].kind, "ask");
});

test("never throws when the folder can't be written", () => {
  assert.equal(appendTurn({ home: "/dev/null/nope" }, { kind: "check", ok: true }), false);
});
