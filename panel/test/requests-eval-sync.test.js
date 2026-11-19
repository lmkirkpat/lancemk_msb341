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

// ---------- spec 014 T024: the ask set (contracts/panel-ask.md › Requests) ----------
// The ask set (product/evals/ask/, the eval engineer's T031) isn't built yet. Until it is, these
// pin the strings; once it exists, every ask case's turns must be the panel's requests word for word:
// a question is "/ask-mentor " plus the text, and a press of Go deeper is goDeeperRequest's sentence
// with one of MU's short names (FR-021).
const { askRequest, goDeeperRequest, endDeeperRequest, followUpRequest, ASK_COMMAND } = require("../lib/requests.js");
const ASK_SET = path.join(EVALS, "ask", "cases");
const SHORT_NAMES = ["Easing", "Key types", "Speed graph", "Offset", "Set the pivot", "Group with a null"];

test("ask: the request strings the eval set must use", () => {
  assert.equal(askRequest("Why does it swing?").request, "/ask-mentor Why does it swing?");
  assert.equal(goDeeperRequest("Set the pivot").request, "Yes, go deeper on Set the pivot.");
  // Spec 014 T055: End lesson on a go-deeper lesson, and the first follow-up after one.
  assert.equal(endDeeperRequest().request, "/ask-mentor I've ended that lesson.");
  assert.equal(followUpRequest("What's next?", { afterDeeper: true }).request, "/ask-mentor What's next?");
  assert.equal(followUpRequest("What's next?").request, "What's next?");
});

// T055: any case in a set a go-deeper lesson runs in (the ask set, the two hand-in skills, next-mentor)
// that presses Go deeper or End lesson sends the panel's sentence, word for word. T058's cases land
// in these sets; until then this checks the ask set's.
const DEEPER_SETS = ["ask", "anchor", "null-parenting", "next-mentor"];
test("ask: every Go deeper and End lesson turn in the go-deeper sets is the panel's (T055)", () => {
  const deeper = new Set(SHORT_NAMES.map((n) => goDeeperRequest(n).request));
  const end = endDeeperRequest().request;
  let seen = 0;
  for (const set of DEEPER_SETS) {
    const dir = path.join(EVALS, set, "cases");
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
      const c = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      for (const t of c.turns || []) {
        if (typeof t.say !== "string") continue;
        seen++;
        if (/go deeper on /i.test(t.say) && /^Yes,/i.test(t.say)) assert.ok(deeper.has(t.say), `${set}/${f}: "${t.say}" isn't the panel's Go deeper`);
        if (/ended that lesson/i.test(t.say)) assert.equal(t.say, end, `${set}/${f}: End lesson's request`);
      }
    }
  }
  assert.ok(seen > 0, "read some turns");
});

test("ask: every case opens with the panel's question request, and any Go deeper turn is the panel's", { skip: fs.existsSync(ASK_SET) ? false : "product/evals/ask/ isn't built yet (T031)" }, () => {
  const deeper = new Set(SHORT_NAMES.map((n) => goDeeperRequest(n).request));
  const files = fs.readdirSync(ASK_SET).filter((f) => f.endsWith(".json"));
  assert.ok(files.length > 0);
  for (const f of files) {
    const c = JSON.parse(fs.readFileSync(path.join(ASK_SET, f), "utf8"));
    const first = c.turns[0].say;
    assert.ok(first.startsWith(`${ASK_COMMAND} `), `${f}: turn 1 isn't a question request`);
    assert.equal(first, askRequest(first.slice(ASK_COMMAND.length + 1)).request, f);
    for (const t of c.turns) if (/^Yes, go deeper on /.test(t.say)) assert.ok(deeper.has(t.say), `${f}: "${t.say}" isn't the panel's Go deeper`);
  }
});

// ---------- spec 014 T102 and T104: the context sent after a lesson (amendment (e)) ----------
// Any ask case turn that carries the wrapper must be exactly what the panel builds from the parts it
// shows: its question, answer, steps (with layers) and closing offer, then the follow-up. Parsed
// back from the turn, rebuilt with the panel's contextRequest, compared byte for byte.
const { contextRequest } = require("../lib/requests.js");
const WRAP = `${ASK_COMMAND} ${REQUESTS.ask_context.request}`;

function rebuild(say) {
  const lines = say.split("\n").slice(1);
  const take = (prefix) => (lines.length && lines[0].startsWith(prefix) ? lines.shift().slice(prefix.length) : null);
  const question = take("Question: ");
  let answer = take("Answer: ");
  while (answer !== null && lines.length && !/^(Steps:|Closing: |Follow-up: )/.test(lines[0])) answer += `\n${lines.shift()}`;
  const steps = [];
  if (lines[0] === "Steps:") {
    lines.shift();
    while (lines.length && /^\d+\. /.test(lines[0])) {
      const m = /^\d+\. (.*?)(?: \(layer: (.*)\))?$/.exec(lines.shift());
      steps.push({ text: m[1], layer: m[2] === undefined ? null : m[2] });
    }
  }
  const closing = take("Closing: ");
  const follow = take("Follow-up: ");
  assert.equal(lines.length, 0, `nothing after Follow-up: ${lines.join(" | ")}`);
  assert.ok(follow !== null, "a Follow-up line");
  return contextRequest({ text: question, view: { explanation: answer, steps, closing_offer: closing } }, follow).request;
}

test("ask: a turn carrying the context after a lesson is the panel's wrapper, byte for byte (T104)", { skip: fs.existsSync(ASK_SET) ? false : "product/evals/ask/ isn't built yet" }, () => {
  const files = fs.readdirSync(ASK_SET).filter((f) => f.endsWith(".json"));
  for (const f of files) {
    const c = JSON.parse(fs.readFileSync(path.join(ASK_SET, f), "utf8"));
    for (const t of c.turns) if (typeof t.say === "string" && t.say.startsWith(WRAP)) assert.equal(t.say, rebuild(t.say), f);
  }
});

test("ask: the wrapper parses back to itself (the check above can catch a case that drifts)", () => {
  const say = contextRequest({ text: "Why?", view: { explanation: "In Comp 1, it turns.\n- From its middle.", steps: [{ text: "Pan Behind.", layer: "Door" }, { text: "Play it back.", layer: null }], closing_offer: "Try them?" } }, "Done.").request;
  assert.equal(rebuild(say), say);
  const drifted = say.replace("(layer: Door)", "(Door)").replace("Closing: ", "Closing offer: ");
  assert.throws(() => assert.equal(drifted, rebuild(drifted)), "a case worded its own way fails");
});
