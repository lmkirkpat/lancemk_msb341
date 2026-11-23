// Spec 014 T022 (data-model § 7, MU › Asking): the thread model. Pure, so every rule about what the
// thread holds is tested here without a mentor.
"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const t = require("../lib/ask-thread.js");

const STEPS = [{ number: 1, text: "Select Shake Control and Pan Behind its pivot.", tag: "Set the pivot", not_taught: false, layer: "Shake Control" }, { number: 2, text: "Play it back.", tag: null, not_taught: false, layer: null }];
const view = (o) => Object.assign({ kind: "answer", explanation: "In Comp 1, rock.png rides on Shake Control.", steps: STEPS, offers: [], closing_offer: "Try them?" }, o);
const AT = "2026-11-14T12:00:00.000Z";

test("a new thread is empty, with no steps to dock", () => {
  const th = t.newThread({ id: "th-1", claude_session_id: "s-1", at: AT });
  assert.deepEqual(th, { version: 1, id: "th-1", claude_session_id: "s-1", started_at: AT, questions: [], latest_steps: null, deeper: null, steps_open_once: false, after_lesson: false, after_deeper: false });
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

// ---------- spec 014 T053: Go deeper in the thread (FR-050, data-model § 7) ----------

const COPY_ASK = require("../lib/copy.js").COPY.ask;
const OFFER = { skill: "transform.anchor", tag: "Set the pivot" };
function offered() {
  let th = t.newThread({ id: "x", claude_session_id: "s", at: AT });
  th = t.answer(t.addQuestion(th, { text: "How do I shake from the hit?", kind: "question", at: AT }), { view: view({ offers: [OFFER] }), prose: null, had_result: true });
  return th;
}
const pressed = (th) => t.pressDeeper(t.addQuestion(th, { text: "Yes, go deeper on Set the pivot.", kind: "go_deeper", at: AT }), OFFER);

test("T053: Go deeper lives inside its answer only: an offer per skill on that answer, none on a follow-up or the press", () => {
  const th = pressed(offered());
  assert.deepEqual(t.offersOf(th, th.questions[0]), [OFFER]);
  assert.deepEqual(t.offersOf(th, th.questions[1]), [], "the press has no view, so no offers");
  const f = t.answer(t.addQuestion(offered(), { text: "Why?", kind: "followup" }), { view: null, prose: "Because.", had_result: false });
  assert.deepEqual(t.offersOf(f, f.questions[1]), [], "a later turn never offers again");
});

test("T053: pressed is starting; the mentor's go_deeper opens it and answers the press; a refusal drops it", () => {
  let th = pressed(offered());
  assert.equal(th.deeper.state, "starting");
  assert.equal(t.deeperOpen(th), true, "the answer can't be pressed twice while starting");
  assert.equal(t.dropDeeper(th).deeper, null);
  th = t.openDeeper(th, { skill: "transform.anchor", tag: "Set the pivot", practice: true });
  assert.deepEqual(th.deeper, { skill: "transform.anchor", tag: "Set the pivot", step_number: null, state: "open", layer: null, practice: true, passed: false, saved: false, hand_back: null });
  assert.equal(t.latest(th).answered, true, "the press isn't left with nothing under it");
  assert.equal(t.dropDeeper(th), th, "an open lesson isn't dropped");
  th = t.deeperHandIn(th, { layer: "Shake Control", step_number: 3 });
  assert.equal(th.deeper.layer, "Shake Control");
  assert.equal(th.deeper.step_number, 3);
  assert.equal(t.deeperHandIn(th, { layer: "", step_number: "3" }).deeper.layer, "Shake Control", "bad data changes nothing");
});

test("T053: while the lesson is open the answer keeps its offer (drawn as Back to your lesson); after, it's folded away and gone", () => {
  let th = t.openDeeper(pressed(offered()), { skill: "transform.anchor", tag: "Set the pivot" });
  assert.equal(t.deeperOpen(th), true);
  assert.deepEqual(t.offersOf(th, th.questions[0]), [OFFER], "still there, for screens to turn into Back to your lesson");
  th = t.backFromDeeper(th, { divider: "Set the pivot · practiced on Shake Control", hand_back: "That was step 3; next is step 4: play it back.", saved: true, at: AT });
  assert.equal(t.deeperOpen(th), false);
  assert.equal(th.deeper.state, "passed");
  assert.deepEqual(t.offersOf(th, th.questions[0]), [], "FR-050: gone after the lesson");
  assert.deepEqual(th.questions.map((q) => [q.kind, q.folded]), [["question", true], ["go_deeper", true], ["lesson_back", false]]);
  const back = t.latest(th);
  assert.equal(back.text, "Set the pivot · practiced on Shake Control");
  assert.equal(back.hand_back, "That was step 3; next is step 4: play it back.");
  assert.equal(back.answered, true);
  assert.equal(th.after_deeper, true, "the next follow-up goes back to the ask skill");
  assert.equal(th.steps_open_once, true, "Your steps opens itself, once");
  assert.equal(t.split(th).earlier_count, 1);
});

test("T053: ended early, the return waits for the mentor's reply; Try again keeps it a return", () => {
  let th = t.openDeeper(pressed(offered()), OFFER);
  th = t.backFromDeeper(th, { divider: "Set the pivot · ended, not saved", hand_back: null, saved: false, answered: false });
  assert.equal(th.deeper.state, "ended");
  assert.equal(t.latest(th).answered, false);
  th = t.answer(th, { view: null, prose: "Step 3 is still there; next is step 4.", had_result: false });
  assert.deepEqual(th.latest_steps, STEPS, "a return isn't a new question: the dock stays");
  assert.equal(t.latest(th).prose, "Step 3 is still there; next is step 4.");
  assert.equal(t.retry(th).questions.at(-1).kind, "lesson_back");
});

test("T053: the hand-back line, from record_lesson's or end_lesson's data", () => {
  assert.equal(t.handBackLine({ step_number: 3, next_step: "Play it back and watch the turn." }, COPY_ASK), "That was step 3. Next is step 4: Play it back and watch the turn.");
  assert.equal(t.handBackLine({ step_number: 4, next_step: null }, COPY_ASK), "That was the last step.");
  assert.equal(t.handBackLine(null, COPY_ASK), null);
  assert.equal(t.handBackLine({ step_number: "3", next_step: "x" }, COPY_ASK), null);
});

test("T053: the context after another lesson skips a return and uses the last question asked", () => {
  let th = t.backFromDeeper(t.openDeeper(pressed(offered()), OFFER), { divider: "d", saved: false, answered: false });
  th = t.answer(th, { view: null, prose: "Next is step 4.", had_result: false });
  assert.equal(t.contextEntry(th).text, "How do I shake from the hit?");
});

test("T053: read back, a return keeps its divider and line; a lesson still open on close sets the prefix", () => {
  const th = t.backFromDeeper(t.openDeeper(pressed(offered()), OFFER), { divider: "d", hand_back: "That was the last step.", saved: true });
  const back = t.fromSaved(JSON.parse(JSON.stringify(th)));
  assert.equal(back.questions.at(-1).kind, "lesson_back");
  assert.equal(back.questions.at(-1).hand_back, "That was the last step.");
  assert.equal(back.after_deeper, true);
  assert.equal(back.deeper.state, "passed", "a settled lesson reads back settled");
  assert.equal(t.deeperOpen(back), false);
  const open = t.fromSaved(JSON.parse(JSON.stringify(t.openDeeper(pressed(offered()), OFFER))));
  assert.equal(open.after_deeper, true, "its conversation is still on the lesson's skill");
  assert.equal(t.fromSaved(JSON.parse(JSON.stringify(offered()))).after_deeper, false);
});

// ---------- spec 014 T070 (FR-043, TD § 6 turn 4 and § 7.4): turn 4 is a read, not a check ----------
// After the learner says how a try went ("it didn't work", "done"), the mentor reads the same layers
// again (describe_layers), may note what they said (note_said) and answers in prose: turn 4 is a
// follow-up, never a give_answer (contracts/panel-ask.md › Context after a lesson, clarified (f);
// ask-mentor SKILL.md; the mentor refuses a repeated answer card with FOLLOW_UP_NOT_ANSWER). Ask mode
// has no check: none of it ticks or crosses anything anywhere in the panel, reloads the record or
// changes a lesson's result. Results shaped by contracts/ask-tools.md (the mentor half is built on
// another branch, so these are fixtures).
const { ready: readyApp, plain: plainText, SIX_PATH, SKILLS_BUILT, LESSON } = require("./app-harness.js");
const { renderApp } = require("../lib/screens.js");
const { reduceLesson, initialLesson } = require("../lib/lesson.js");
const checklist = require("../lib/checklist/index.js");
const COMP1 = require("./fixtures/ask/comp1-answer.json");

const TICKS = /[✓✗◐⊘]/; // the checklist's pass, off, partly and can't-check glyphs
const ASKED_WORDS = /asked again|asked about|after learning|you already learned|remember when|as we covered/i;
const RES = (name, json) => ({ name, ok: true, text: JSON.stringify(json), images: [], json });
const READ = RES("describe_layers", { comp: { name: "Comp 1" }, layers: [{ name: "Shake Control" }, { name: "rock.png" }] });
const SAID = RES("note_said", { saved: true });
// Not turn 4's shape: a give_answer in the follow-up bar is a send the mentor took as a new question
// (amendment (d)), so the panel folds the earlier answer and treats this one as new. The tests below
// pin that, so a give_answer here is never read as "folds nothing". The last two fields are ones a
// phase 3 reply might carry (the asked entry it linked); the panel must draw neither.
const TURN4 = (kind) => RES("give_answer", Object.assign(
  kind === "describe"
    ? { kind: "describe", explanation: "Shake Control's pivot is still in its middle. The change landed on rock.png, which rides on it.", steps: [], offered_skills: [], closing_offer: "Want the steps again for Shake Control?" }
    : { kind: "answer", explanation: "Shake Control's pivot is still in its middle. The change landed on rock.png, which rides on it.", steps: [{ text: "Select Shake Control and Pan Behind its pivot to where the hammer hits.", skill: "transform.anchor", layer: "Shake Control" }], offered_skills: ["transform.anchor"], closing_offer: "Try it there, or want to go deeper on Set the pivot?" },
  { runtime: "a", tags: { "transform.anchor": "Set the pivot" }, after_learning: ["transform.anchor"], asked: { linked: true, went_deeper: null } },
));

async function asked(runtime) {
  let reads = 0;
  const h = await readyApp({ runtime, memory: { status: "ok", record: LESSON }, pathData: SIX_PATH, skillsBuilt: SKILLS_BUILT, setTimeout: () => 0, readRecord: () => { reads++; return Promise.resolve({ status: "ok", record: LESSON }); } });
  h.reads = () => reads;
  h.app.setDraft("How can I make the rock shake from the hammer hit?");
  h.app.act("ask_home");
  const a = h.adapter();
  a.emit("tool_result", READ);
  a.emit("tool_result", RES("give_answer", Object.assign({}, COMP1, { runtime })));
  a.emit("turn_end", { ok: true, kind: "question" });
  return h;
}
// The whole screen: the thread draws in the chat layout (r.lesson), other screens in r.view.
function draw(h) {
  const r = renderApp(h.app.model());
  if (!r.lesson) return r.nav + r.view;
  const c = r.lesson.chat;
  return [r.nav, r.lesson.head, r.lesson.banner, c.earlier || "", ...c.items, r.lesson.list, r.lesson.status, r.lesson.actions, r.lesson.ask, r.view || ""].join("\n");
}
// Skills and each skill's detail, drawn from wherever the panel is, then put back.
function skillsScreens(h) {
  const m = h.app.model();
  const back = { tab: m.tab };
  h.app.act("tab", { tab: "skills" });
  const out = [draw(h)];
  for (const id of Object.keys(SKILLS_BUILT.skills)) { h.app.act("open_skill", { skill: id }); out.push(draw(h)); h.app.act("back_skills"); }
  h.app.act("tab", back);
  return out;
}

for (const runtime of ["a", "b1"]) {
  for (const shape of ["answer", "describe", "prose"]) {
    test(`T070 (${runtime}, ${shape}): turn 4 ticks and crosses nothing, reloads no record, and leaves Skills as it was`, async () => {
      const h = await asked(runtime);
      const skillsBefore = skillsScreens(h);
      const reads = h.reads();
      assert.equal(h.app.followUp("I tried it and it didn't work."), true);
      const a = h.adapter();
      a.emit("tool_result", READ);
      a.emit("tool_result", SAID);
      if (shape === "prose") a.emit("text", { text: "Shake Control's pivot is still in its middle; the change landed on rock.png." });
      else a.emit("tool_result", TURN4(shape));
      a.emit("turn_end", { ok: true, kind: "followup" });
      const m = h.app.model();
      assert.equal(m.lesson, null, "no lesson opened or changed");
      const html = draw(h);
      assert.ok(plainText(html).includes("The change landed on rock.png") || plainText(html).includes("the change landed on rock.png"), "the turn's answer is on screen");
      assert.doesNotMatch(html, TICKS, "no ✓ or ✗ in the thread");
      assert.doesNotMatch(plainText(html), ASKED_WORDS);
      assert.doesNotMatch(plainText(html), /\bpass(ed)?\b|\bfail(ed)?\b/i, "no pass or fail words from the panel");
      assert.equal(h.reads(), reads, "the record isn't read again: nothing in it changed for the panel");
      assert.deepEqual(skillsScreens(h), skillsBefore, "Skills and every skill's detail, unchanged");
      const line = h.turns[h.turns.length - 1];
      assert.equal(line.thread, "ask");
      assert.equal(line.lesson_passed, false);
      const th = m.thread;
      const s = t.split(th);
      if (shape === "prose") return; // turn 4 as the contract has it: a follow-up under the same answer
      // A give_answer here is a new question (amendment (d)): the original answer folds into Earlier
      // questions (1), and Your steps holds the new step, or goes away for a describe.
      assert.equal(t.latest(th).kind, "question", "the send became a question");
      assert.equal(s.earlier_count, 1);
      assert.deepEqual(s.earlier.map((q) => q.text), ["How can I make the rock shake from the hammer hit?"]);
      assert.ok(plainText(html).includes(COPY_ASK.earlier(1)), "Earlier questions (1) on screen");
      if (shape === "answer") {
        assert.deepEqual(th.latest_steps.map((x) => x.text), ["Select Shake Control and Pan Behind its pivot to where the hammer hits."]);
        assert.ok(plainText(html).includes(COPY_ASK.your_steps(1)), "Your steps holds the new step");
        assert.equal(plainText(html).includes(COPY_ASK.your_steps(4)), false, "not the first answer's four");
      } else {
        assert.equal(th.latest_steps, null, "a describe has no steps: Your steps goes away");
        assert.doesNotMatch(plainText(html), /Your steps/);
      }
    });
  }
}

test("T070: the ask tools are never checks, snapshots or demos, and a lesson's view ignores them", () => {
  for (const tool of ["describe_layers", "give_answer", "note_said", "go_deeper"]) {
    assert.equal(checklist.isCheck(tool), false, tool);
    assert.equal(checklist.isSnapshot(tool), false, tool);
    assert.equal(checklist.changeLine(tool, {}), null, tool);
  }
  const v = Object.assign(initialLesson({ skill: "transform.anchor" }), { passed: false, checks: 1 });
  for (const ev of [READ, SAID, TURN4("answer"), TURN4("describe")]) {
    assert.equal(reduceLesson(v, Object.assign({ type: "tool_result" }, ev)), v, ev.name);
  }
});

// A go-deeper lesson with its check list on screen, then the learner says how it went inside the
// lesson (FR-046's ask box) and ask tool results arrive in that turn (a stray give_answer included,
// which the contract never sends there): the list, the stage and the result stay as the check left
// them.
const PASSED_CHECK = RES("anchor_check", { comp_matches: true, passed: true, layers: [{ layer: "Shake Control", item1: { passed: true, wanted: "your_call", place_now: "middle-left" }, item2: { passed: true }, item3: { set_away_from_rest: false }, item4: null, item5: { passed: true, moved_layers: [] }, cant_check: [], credit: "learner" }], other_changes: [] });
const OFF_CHECK = RES("anchor_check", { comp_matches: true, passed: false, layers: [{ layer: "Shake Control", item1: { passed: true, wanted: "your_call", place_now: "middle-left" }, item2: { passed: true }, item3: { set_away_from_rest: false }, item4: null, item5: { passed: false, moved_layers: ["rock.png"] }, cant_check: [], credit: "learner" }], other_changes: [] });

async function inDeeperLesson(check) {
  const h = await asked("a");
  h.app.act("go_deeper", { skill: "transform.anchor" });
  const a = h.adapter();
  a.emit("tool_call", { name: "go_deeper" });
  a.emit("tool_result", RES("go_deeper", { skill_name: "Set the pivot (anchor point)", short_name: "Set the pivot", command_skill: "anchor-mentor", practice: false, missing_prerequisite: null }));
  a.emit("tool_result", RES("anchor_snapshot", { lesson: "new", mode: "lesson", mode_source: "hand_in", focus: ["Shake Control"], comp: { name: "Comp 1" }, targets: [], hand_in: { layer: "Shake Control", step_number: 3, steps_after: ["Play it back and watch the turn."], place_named: true, practice: false } }));
  a.emit("text", { text: "We're on Shake Control. Select it and press A, then Shift+P." });
  a.emit("turn_end", { ok: true, kind: "go_deeper", total_ms: 4000 });
  h.app.act("check");
  a.emit("tool_result", check);
  if (check.json.passed) a.emit("tool_result", RES("record_lesson", { saved: true, skill: { status: "learned", next: null }, hand_back: { step_number: 3, next_step: "Play it back and watch the turn." } }));
  a.emit("text", { text: check.json.passed ? "Shake Control's pivot is where you said." : "The pivot moved, but so did rock.png." });
  a.emit("turn_end", { ok: true, kind: "check" });
  return h;
}

for (const [label, check, glyph] of [["passed", PASSED_CHECK, "✓"], ["not yet", OFF_CHECK, "✗"]]) {
  test(`T070 (${label}): ask tools in a lesson's turn change nothing to its ${glyph} rows, stage or result`, async () => {
    const h = await inDeeperLesson(check);
    const r0 = renderApp(h.app.model()).lesson;
    assert.ok(r0.list.includes(glyph), `the check drew a ${glyph}`);
    const before = { list: r0.list, head: r0.head, passed: h.app.model().lesson.passed };
    h.app.ask("I tried it and it didn't work.");
    const a = h.adapter();
    a.emit("tool_result", READ);
    a.emit("tool_result", SAID);
    a.emit("tool_result", TURN4("answer"));
    a.emit("text", { text: "Shake Control's pivot is still in its middle." });
    a.emit("turn_end", { ok: true, kind: "ask" });
    const r1 = renderApp(h.app.model()).lesson;
    assert.equal(r1.list, before.list, "the check list, row for row");
    assert.equal(r1.head, before.head, "the stage ticks");
    assert.equal(h.app.model().lesson.passed, before.passed);
  });
}
