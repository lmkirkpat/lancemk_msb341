"use strict";
// Eval cases must send the panel's exact requests, word for word (research R10, spec 003 FR-019,
// spec 007 FR-071). Each row below names a case and the 1-based turn that sends a button's request.
// The expected text always comes from the panel's own code, so changing a request without its case
// fails here. Case numbers and files are the eval engineer's; this file only names them.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { REQUESTS, startRequest, newLessonRequest, warmUpRequest, showMeAgain, followOnRequest } = require("../lib/requests.js");
const { skillById } = require("../lib/skills.js");

const EVALS = path.join(__dirname, "..", "..", "product", "evals");
const loadFrom = (set, id) => JSON.parse(fs.readFileSync(path.join(EVALS, set, "cases", `${id}.json`), "utf8"));
const load = (id) => loadFrom("easing", id);

function assertTurn(set, id, turn, expected) {
  const t = loadFrom(set, id).turns[turn - 1];
  assert.ok(t, `${set}/${id} has no turn ${turn}`);
  assert.equal(t.say, expected, `${set}/${id} turn ${turn}`);
}

const LAST = {
  "17-button-check-partial": "check",
  "18-button-hint": "hint",
  "19-button-show-me": "show_me",
  "20-button-show-me-again": "show_me_again",
};

test("each button case's last turn sends that button's request", () => {
  for (const [id, kind] of Object.entries(LAST)) {
    assert.equal(load(id).turns.at(-1).say, REQUESTS[kind].request, id);
  }
});

test("every turn in the button cases is a panel request", () => {
  const all = new Set(Object.values(REQUESTS).map((r) => r.request));
  for (const id of Object.keys(LAST)) {
    for (const t of load(id).turns) assert.ok(all.has(t.say), `${id}: "${t.say}" isn't a panel request`);
  }
});

// What each kind of button sends for a skill row from the panel's table.
const EXPECTED = {
  start: (s) => startRequest(s.command).request,
  new_lesson: (s) => newLessonRequest(s.command).request,
  warm_up: (s) => warmUpRequest(s.command).request,
  continue: () => REQUESTS.continue.request,
  check: () => REQUESTS.check.request,
  hint: () => REQUESTS.hint.request,
  show_me: () => REQUESTS.show_me.request,
  show_me_again: (s) => showMeAgain(s.id).request,
};

// set folder → the skill's id in the panel's table, and kind → [[case, turn], ...].
const PER_SKILL = {
  easing: {
    skill: "easing.basic",
    cases: {
      start: [["17-button-check-partial", 1]],
      new_lesson: [["17-button-check-partial", 1]],
      continue: [["29-button-continue", 3]],
      check: [["17-button-check-partial", 3], ["31-retry-check-no-result", 3]],
      hint: [["18-button-hint", 4]],
      show_me: [["19-button-show-me", 2]],
      show_me_again: [["20-button-show-me-again", 3], ["30-retry-show-me-again", 3]],
    },
  },
  "key-types": {
    skill: "keyframes.types",
    cases: {
      start: [["32-button-check-partial", 1]],
      new_lesson: [["36-button-new-lesson-due-record", 1]],
      warm_up: [["23-review-asked-none-due", 1]],
      continue: [["37-button-continue", 3]],
      check: [["32-button-check-partial", 3]],
      hint: [["33-button-hint", 4]],
      show_me: [["34-button-show-me", 3]],
      show_me_again: [["35-button-show-me-again", 4]],
    },
  },
  "speed-graph": {
    skill: "easing.speed_graph",
    cases: {
      start: [["30-button-check-partial", 1]],
      new_lesson: [["34-button-new-lesson-due-record", 1]],
      warm_up: [["23-review-asked-none-due", 1]],
      continue: [["35-button-continue", 3]],
      check: [["30-button-check-partial", 3]],
      hint: [["31-button-hint", 4]],
      show_me: [["32-button-show-me", 3]],
      show_me_again: [["33-button-show-me-again", 4]],
    },
  },
  offset: {
    skill: "timing.offset",
    cases: {
      start: [["38-button-check-partial", 1]],
      new_lesson: [["42-button-new-lesson-due-record", 1]],
      warm_up: [["31-review-asked-none-due", 1]],
      continue: [["43-button-continue", 3]],
      check: [["38-button-check-partial", 3]],
      hint: [["39-button-hint", 4]],
      show_me: [["40-button-show-me", 3]],
      show_me_again: [["41-button-show-me-again", 4]],
    },
  },
  anchor: {
    skill: "transform.anchor",
    cases: {
      start: [["47-button-check-dragged", 1]],
      new_lesson: [["51-button-new-lesson-due-record", 1]],
      warm_up: [["53-button-warm-up", 1]],
      continue: [["52-button-continue", 3]],
      check: [["47-button-check-dragged", 3]],
      hint: [["48-button-hint", 4]],
      show_me: [["49-button-show-me", 3]],
      show_me_again: [["50-button-show-me-again", 5]],
    },
  },
  "null-parenting": {
    skill: "parenting.null",
    cases: {
      start: [["45-button-check-partial", 1]],
      new_lesson: [["49-button-new-lesson-due-record", 1]],
      warm_up: [["51-button-warm-up", 1]],
      continue: [["50-button-continue", 3]],
      check: [["45-button-check-partial", 3]],
      hint: [["46-button-hint", 4]],
      show_me: [["47-button-show-me", 4]],
      show_me_again: [["48-button-show-me-again", 5]],
    },
  },
};

for (const [set, { skill: id, cases }] of Object.entries(PER_SKILL)) {
  test(`${set}: every button's named turn is the panel's exact request`, () => {
    const skill = skillById(id);
    assert.ok(skill, `${id} isn't in the panel's skill table`);
    for (const [kind, rows] of Object.entries(cases)) {
      for (const [caseId, turn] of rows) assertTurn(set, caseId, turn, EXPECTED[kind](skill));
    }
  });

  test(`${set}: names a case for every per-skill button`, () => {
    // Easing has no review, so no Warm up (RQ-11).
    const need = Object.keys(EXPECTED).filter((k) => !(set === "easing" && k === "warm_up"));
    assert.deepEqual(Object.keys(cases).sort(), need.sort());
  });
}

// T069, RQ-11: the button itself, not just the request table, sends what each skill's Warm up case says.
const { ready, SIX_PATH } = require("./app-harness.js");
const WARM_UP_SETS = Object.entries(PER_SKILL).filter(([, s]) => s.cases.warm_up);

test("Warm up is covered on exactly the five skills with a review", () => {
  assert.deepEqual(WARM_UP_SETS.map(([set]) => set).sort(), ["anchor", "key-types", "null-parenting", "offset", "speed-graph"]);
});

for (const [set, { skill: id, cases }] of WARM_UP_SETS) {
  test(`${set}: pressing Warm up sends the eval case's words`, async () => {
    const record = { skills: { [id]: { status: "learned", review_due: "2026-11-01" } }, lessons: [{ skill: id, date: "2026-10-26T12:00:00Z", result: "passed" }] };
    const h = await ready({ memory: { status: "ok", record }, pathData: SIX_PATH });
    h.app.act("warm_up", { skill: id });
    const [[caseId, turn]] = cases.warm_up;
    assertTurn(set, caseId, turn, h.adapter().sent[0].text);
    assert.equal(h.adapter().sent[0].kind, "warm_up");
  });
}

const NEXT = "next-mentor";
const FIND_NEXT = [
  "01-in-progress", "02-review-due", "03-next-in-path-with-focus", "04-nothing-left", "05-ae-unreachable",
  "06-yes-pivot-named-layers", "07-yes-null-named-layers", "08-yes-null-crowded-empty-list", "09-yes-due-review",
  "10-handover-pivot-named-layers", "11-handover-null-crowded", "12-handover-offset-due-review", "13-handover-already-know",
];
// Yes on B1 sends next-mentor nothing: the follow-on request starts the lesson fresh (FR-082).
const FOLLOW_ON = [
  ["06-yes-pivot-named-layers", "lesson", "transform.anchor"],
  ["07-yes-null-named-layers", "lesson", "parenting.null"],
  ["08-yes-null-crowded-empty-list", "lesson", "parenting.null"],
  ["09-yes-due-review", "review", "keyframes.types"],
];
// Yes on A goes to next-mentor itself, which hands over.
const YES_ON_A = [
  ["10-handover-pivot-named-layers", 2],
  ["11-handover-null-crowded", 2],
  ["12-handover-offset-due-review", 2],
  ["13-handover-already-know", 3],
];

test("next-mentor: Find my next lesson opens every case", () => {
  for (const id of FIND_NEXT) assertTurn(NEXT, id, 1, REQUESTS.find_next.request);
});

test("next-mentor: Yes on B1 is the follow-on request, run on B1 only", () => {
  for (const [id, kind, skillId] of FOLLOW_ON) {
    const recommendation = { skill: skillId, kind, focus_layers: null };
    assertTurn(NEXT, id, 2, followOnRequest(recommendation, skillById(skillId).command).request);
    assert.deepEqual(loadFrom(NEXT, id).runtimes, ["b1"], id);
  }
});

test("next-mentor: Yes on A is the panel's text, run on A only", () => {
  for (const [id, turn] of YES_ON_A) {
    assertTurn(NEXT, id, turn, REQUESTS.yes.request);
    assert.deepEqual(loadFrom(NEXT, id).runtimes, ["a"], id);
  }
});
