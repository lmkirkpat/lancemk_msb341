"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { pathView } = require("../lib/path.js");

const states = (p) => p.map((s) => `${s.name}:${s.state}`);

test("no record: Keyframes done, Easing current", () => {
  assert.deepEqual(states(pathView(null, null)), ["Keyframes:done", "Easing:current", "Graph Editor:upcoming", "Bounce:upcoming"]);
});

test("record says learned: Easing done and Graph Editor next, before any lesson (US2-4)", () => {
  const record = { version: 1, skills: { "easing.basic": { status: "learned" } }, lessons: [] };
  assert.deepEqual(states(pathView(record, null)), ["Keyframes:done", "Easing:done", "Graph Editor:next", "Bounce:upcoming"]);
});

test("practicing in the record, then this lesson passes", () => {
  const record = { version: 1, skills: { "easing.basic": { status: "practicing" } }, lessons: [] };
  assert.equal(pathView(record, { passed: false })[1].state, "current");
  assert.equal(pathView(record, { passed: true })[1].state, "done");
});
