// Spec 014 T022 (data-model § 7, MU › Asking): the thread model. Pure, so every rule about what the
// thread holds is tested here without a mentor.
"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const t = require("../lib/ask-thread.js");

const STEPS = [{ number: 1, text: "Select Shake Control and Pan Behind its pivot.", tag: "Set the pivot", not_taught: false }, { number: 2, text: "Play it back.", tag: null, not_taught: false }];
const view = (o) => Object.assign({ kind: "answer", explanation: "In Comp 1, rock.png rides on Shake Control.", steps: STEPS, offers: [], closing_offer: "Try them?" }, o);
const AT = "2026-11-14T12:00:00.000Z";

test("a new thread is empty, with no steps to dock", () => {
  const th = t.newThread({ id: "th-1", claude_session_id: "s-1", at: AT });
  assert.deepEqual(th, { version: 1, id: "th-1", claude_session_id: "s-1", started_at: AT, questions: [], latest_steps: null, deeper: null, steps_open_once: false });
});

test("an answer with steps docks them; the entry keeps its view and no prose shows beside it", () => {
  let th = t.addQuestion(t.newThread({ id: "x" }), { text: "How do I shake from the hit?", kind: "question", at: AT });
  assert.equal(t.latest(th).answered, false);
  th = t.answer(th, { view: view(), prose: "Some words the mentor wrote too.", had_result: true });
  assert.deepEqual(th.latest_steps, STEPS);
  assert.equal(t.latest(th).answered, true);
  assert.equal(t.latest(th).prose, "Some words the mentor wrote too.", "kept, not drawn (research R2)");
});

test("FR-048: a malformed or missing result on an answer turn leaves no dock", () => {
  let th = t.answer(t.addQuestion(t.newThread({ id: "x" }), { text: "q", kind: "question" }), { view: view(), had_result: true });
  th = t.answer(t.addQuestion(th, { text: "q2", kind: "question" }), { view: null, prose: "In Comp 1…", had_result: true });
  assert.equal(th.latest_steps, null, "malformed");
  th = t.answer(t.addQuestion(t.answer(t.addQuestion(th, { text: "q3", kind: "question" }), { view: view(), had_result: true }), { text: "q4", kind: "question" }), { view: null, prose: "words", had_result: false });
  assert.equal(th.latest_steps, null, "missing");
});

test("a follow-up's prose answer keeps the dock; a new answer with no steps takes it away", () => {
  let th = t.answer(t.addQuestion(t.newThread({ id: "x" }), { text: "q", kind: "question" }), { view: view(), had_result: true });
  th = t.answer(t.addQuestion(th, { text: "Why the null?", kind: "followup" }), { view: null, prose: "Shake Control is the layer that moves.", had_result: false });
  assert.deepEqual(th.latest_steps, STEPS, "ask-followup keeps Your steps");
  th = t.answer(t.addQuestion(th, { text: "What does Sweep Control do?", kind: "question" }), { view: view({ kind: "describe", steps: [] }), had_result: true });
  assert.equal(th.latest_steps, null, "ask-new-question: the dock goes away");
});

test("a new question folds everything before it into Earlier questions (n); follow-ups don't fold", () => {
  let th = t.newThread({ id: "x" });
  th = t.answer(t.addQuestion(th, { text: "q1", kind: "question" }), { view: view(), had_result: true });
  th = t.answer(t.addQuestion(th, { text: "f1", kind: "followup" }), { prose: "a", had_result: false });
  assert.deepEqual(t.split(th).earlier, [], "a follow-up stays in view");
  th = t.addQuestion(th, { text: "q2", kind: "question" });
  const s = t.split(th);
  assert.equal(s.earlier_count, 1, "one earlier question, with its follow-up");
  assert.deepEqual(s.earlier.map((q) => q.text), ["q1", "f1"]);
  assert.deepEqual(s.current.map((q) => q.text), ["q2"]);
  th = t.addQuestion(t.answer(th, { prose: "x", had_result: false }), { text: "q3", kind: "question" });
  assert.equal(t.split(th).earlier_count, 2);
  assert.ok(th.questions.slice(0, -1).every((q) => q.folded));
});

test("a thread is immutable: each step returns a new one", () => {
  const a = t.newThread({ id: "x" });
  const b = t.addQuestion(a, { text: "q", kind: "question" });
  assert.equal(a.questions.length, 0);
  assert.equal(b.questions.length, 1);
});

test("the 6 s switch to Still reading (MU ask-reading-long)", () => {
  assert.equal(t.READING_LONG_MS, 6000);
  assert.equal(t.readingLong(1000, 6999), false);
  assert.equal(t.readingLong(1000, 7000), true);
  assert.equal(t.readingLong(null, 99999), false);
});

test("a notice sits on its entry; a retried question clears it", () => {
  let th = t.addQuestion(t.newThread({ id: "x" }), { text: "q", kind: "question" });
  th = t.notice(th, { title: "Can't reach the internet.", text: "Your question's still here." });
  assert.equal(t.latest(th).notice.title, "Can't reach the internet.");
  th = t.retry(th);
  assert.equal(t.latest(th).notice, null);
  assert.equal(t.latest(th).answered, false);
  assert.equal(th.questions.length, 1, "Try again doesn't add a bubble");
});

test("the latest offers live only on the latest answer, and folded answers draw none (FR-050)", () => {
  let th = t.answer(t.addQuestion(t.newThread({ id: "x" }), { text: "q", kind: "question" }), { view: view({ offers: [{ skill: "transform.anchor", tag: "Set the pivot" }] }), had_result: true });
  assert.equal(t.offersOf(th, th.questions[0]).length, 1);
  th = t.addQuestion(th, { text: "q2", kind: "question" });
  assert.deepEqual(t.offersOf(th, th.questions[0]), [], "folded");
});

test("read back from a file: a thread of the wrong shape is null; entries are cleaned", () => {
  assert.equal(t.fromSaved(null), null);
  assert.equal(t.fromSaved({ version: 1, id: 3 }), null);
  const th = t.fromSaved({ version: 1, id: "x", claude_session_id: "s", questions: [{ text: "q", kind: "question", view: view(), prose: null, folded: false, answered: true, extra: "drop me" }, { bad: true }], latest_steps: STEPS, deeper: null, steps_open_once: false });
  assert.equal(th.questions.length, 1);
  assert.equal("extra" in th.questions[0], false);
  assert.deepEqual(th.latest_steps, STEPS);
});

test("asNewQuestion: a follow-up becomes a question and folds the entries before it; nothing else changes", () => {
  let th = t.newThread({ id: "x", at: AT });
  th = t.answer(t.addQuestion(th, { text: "Why?", kind: "question", at: AT }), { view: view(), prose: null, had_result: true });
  th = t.addQuestion(th, { text: "And the letters?", kind: "followup", at: AT });
  const n = t.asNewQuestion(th);
  assert.deepEqual(n.questions.map((q) => [q.kind, q.folded]), [["question", true], ["question", false]]);
  assert.deepEqual(th.questions.map((q) => [q.kind, q.folded]), [["question", false], ["followup", false]], "immutable");
  assert.equal(t.split(n).earlier_count, 1);
  const q = t.addQuestion(th, { text: "Yes, go deeper on Set the pivot.", kind: "go_deeper", at: AT });
  assert.equal(t.asNewQuestion(q), q, "only a follow-up");
  assert.deepEqual(t.NEW_QUESTION_KINDS, ["answer", "describe", "howto"]);
});
