"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { REQUESTS, visibleKinds, startRequest, newLessonRequest, warmUpRequest, showMeAgain, followOnRequest } = require("../lib/requests.js");

test("matches the contract's table", () => {
  assert.deepEqual(Object.keys(REQUESTS).sort(), ["check", "continue", "find_next", "hint", "show_me", "show_me_again", "show_me_again_other", "start", "yes"]);
  assert.equal(REQUESTS.start.request, "/ease-mentor");
  assert.equal(REQUESTS.show_me.request, "Show me how first.");
  assert.equal(REQUESTS.check.label, "Done, check it"); // RQ-14: the label moved, the request didn't
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

test("per-skill requests match the contract (T041, RQ-01, RQ-02, RQ-11, RQ-15, RQ-16)", () => {
  assert.equal(startRequest("/key-types-mentor").request, "/key-types-mentor");
  assert.equal(newLessonRequest("/key-types-mentor").request, "/key-types-mentor lesson");
  assert.equal(newLessonRequest("/ease-mentor").request, "/ease-mentor", "easing has no review to avoid");
  assert.equal(warmUpRequest("/offset-mentor").request, "/offset-mentor review");
  assert.equal(REQUESTS.find_next.request, "/next-mentor");
  assert.equal(REQUESTS.yes.request, "Yes, let's go.");
  assert.equal(showMeAgain("easing.basic").request, REQUESTS.show_me_again.request);
  assert.equal(showMeAgain("timing.offset").request, "Show me again: explain the change you already made, with a frame. Don't change anything.");
});

test("Yes's follow-on (FR-082): plain command or review, never the layers", () => {
  assert.equal(followOnRequest({ skill: "x", kind: "lesson", focus_layers: ["Door"] }, "/anchor-mentor").request, "/anchor-mentor");
  assert.equal(followOnRequest({ skill: "x", kind: "continue" }, "/anchor-mentor").request, "/anchor-mentor");
  assert.equal(followOnRequest({ skill: "x", kind: "review", focus_layers: [] }, "/offset-mentor").request, "/offset-mentor review");
  for (const focus_layers of [[], null, undefined, Array.from({ length: 200 }, (_, i) => `Layer ${i}`)]) {
    assert.equal(followOnRequest({ skill: "x", kind: "lesson", focus_layers }, "/null-parenting-mentor").request, "/null-parenting-mentor");
  }
});

test("before a lesson: Start, plus Continue when allowed", () => {
  assert.deepEqual(visibleKinds(null, {}), ["start"]);
  assert.deepEqual(visibleKinds(null, { canContinue: true }), ["continue", "start"]);
});

test("Show me before the demo, Show me again after it, never both", () => {
  assert.deepEqual(visibleKinds({ demo_made: false, demo_target: "a", checks: 0 }, { lessonOpen: true }), ["check", "show_me"]);
  assert.deepEqual(visibleKinds({ demo_made: true, checks: 0 }, { lessonOpen: true }), ["check", "show_me_again"]);
});

test("Hint only from the first check on", () => {
  assert.deepEqual(visibleKinds({ demo_made: true, checks: 1 }, { lessonOpen: true }), ["check", "hint", "show_me_again"]);
  assert.deepEqual(visibleKinds({ demo_made: false, demo_target: "a", checks: 2 }, { lessonOpen: true }), ["check", "hint", "show_me"]);
  assert.deepEqual(visibleKinds({ demo_made: false, demo_target: null, checks: 1 }, { lessonOpen: true }), ["check", "hint"], "no demo target, no Show me");
  assert.deepEqual(visibleKinds({ demo_made: false, demo_unknown: true, demo_target: "a", checks: 0 }, { lessonOpen: true }), ["check"], "demo_unknown hides both");
  assert.deepEqual(visibleKinds({ demo_made: false, demo_target: "a", mode: "review", checks: 0 }, { lessonOpen: true }), ["check"], "never in a review");
});
