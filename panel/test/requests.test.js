"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { REQUESTS, visibleKinds } = require("../lib/requests.js");

test("matches the contract's table", () => {
  assert.deepEqual(Object.keys(REQUESTS).sort(), ["check", "continue", "hint", "show_me", "show_me_again", "start"]);
  assert.equal(REQUESTS.start.request, "/ease-mentor");
  assert.equal(REQUESTS.show_me.request, "Show me how first.");
  assert.equal(REQUESTS.check.request, "I'm done. Check my work.");
  assert.equal(REQUESTS.hint.request, "Can I have a hint?");
  assert.equal(REQUESTS.continue.request, "I'm back. Pick up where we left off.");
  assert.match(REQUESTS.show_me_again.request, /Don't change anything\.$/);
});

test("no request asks the mentor to do the learner's work (FR-006)", () => {
  for (const { request } of Object.values(REQUESTS)) {
    assert.doesNotMatch(request, /\brest\b|all of it|for me/i, request);
  }
});

test("before a lesson: Start, plus Continue when allowed", () => {
  assert.deepEqual(visibleKinds(null, {}), ["start"]);
  assert.deepEqual(visibleKinds(null, { canContinue: true }), ["continue", "start"]);
});

test("Show me before the demo, Show me again after it, never both", () => {
  assert.deepEqual(visibleKinds({ demo_made: false, checks: 0 }, { lessonOpen: true }), ["show_me", "check"]);
  assert.deepEqual(visibleKinds({ demo_made: true, checks: 0 }, { lessonOpen: true }), ["show_me_again", "check"]);
});

test("Hint only from the first check on", () => {
  assert.deepEqual(visibleKinds({ demo_made: true, checks: 1 }, { lessonOpen: true }), ["show_me_again", "check", "hint"]);
  assert.deepEqual(visibleKinds({ demo_made: false, checks: 2 }, { lessonOpen: true }), ["show_me", "check", "hint"]);
});
