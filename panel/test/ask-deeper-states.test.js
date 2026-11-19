// Spec 014 T054 and T057 (SC-011, FR-050 to FR-052, MU › Going deeper): every go-deeper state MU adds
// or changes, driven from fixture events through the real app and screens, with no mentor. The tool
// results are shaped by the mentor branch's go_deeper, snapshot hand-in, record_lesson and end_lesson
// replies (contracts/hand-in.md, data-model § 4).
"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { ready, plain, SIX_PATH, SKILLS_BUILT, LESSON, CONNECTED } = require("./app-harness.js");
const { renderApp } = require("../lib/screens.js");
const { STATE_IDS, DEEPER_IDS } = require("../lib/view-state.js");
const { COPY } = require("../lib/copy.js");
const { ASK_COMMAND } = require("../lib/requests.js");
const COMP1 = require("./fixtures/ask/comp1-answer.json");

const A = COPY.ask;
const Q = "How can I make the rock shake from the hammer hit?";
const PRESS = "Yes, go deeper on Set the pivot.";
const OPENING = "We're on Shake Control, turning the shake from where the hammer hits. Select Shake Control and press A, then Shift+P.";
const NEXT_STEP = "Play it back and watch the turn.";
const R = (name, json, ok) => ({ name, ok: ok !== false, text: ok === false ? json : JSON.stringify(json), images: [], json: ok === false ? null : json });
const GO = (practice) => R("go_deeper", { skill_name: "Set the pivot (anchor point)", short_name: "Set the pivot", command_skill: "anchor-mentor", practice: practice !== false, missing_prerequisite: null });
const HAND_IN = (practice) => R("anchor_snapshot", { lesson: "new", mode: "lesson", mode_source: "hand_in", focus: ["Shake Control"], comp: { name: "Comp 1" }, targets: [], hand_in: { layer: "Shake Control", step_number: 3, steps_after: [NEXT_STEP], place_named: true, practice: practice !== false } });
const CHECK = (passed) => R("anchor_check", { comp_matches: true, passed, layers: [{ layer: "Shake Control", item1: { passed: true, wanted: "your_call", place_now: "middle-left" }, item2: { passed: true }, item3: { set_away_from_rest: false }, item4: null, item5: passed ? { passed: true, moved_layers: [] } : { passed: false, moved_layers: ["rock.png"] }, cant_check: [], credit: "learner" }], other_changes: [] });
const RECORD = (hb) => R("record_lesson", Object.assign({ saved: true, skill: { status: "learned", next: null } }, hb === undefined ? { hand_back: { step_number: 3, next_step: NEXT_STEP } } : hb));

async function panel(opts) {
  return ready(Object.assign({ runtime: "a", memory: { status: "ok", record: LESSON }, pathData: SIX_PATH, skillsBuilt: SKILLS_BUILT, setTimeout: () => 0 }, opts));
}
const st = (h) => h.app.model().state;
function screen(h) {
  const r = renderApp(h.app.model());
  if (!r.lesson) return { html: r.nav + r.view, r };
  const c = r.lesson.chat;
  return { html: [r.nav, r.lesson.head, r.lesson.banner, c.earlier || "", ...c.items, r.lesson.list, r.lesson.status, r.lesson.actions, r.lesson.ask].join("\n"), r };
}
const text = (h) => plain(screen(h).html);

async function answered(opts) {
  const h = await panel(opts);
  h.app.setDraft(Q);
  h.app.act("ask_home");
  const t = h.adapter();
  t.emit("tool_result", R("describe_layers", {}));
  t.emit("tool_result", R("give_answer", COMP1));
  t.emit("turn_end", { ok: true, kind: "question" });
  return h;
}
async function pressed(opts) {
  const h = await answered(opts);
  h.app.act("go_deeper", { skill: "transform.anchor" });
  return h;
}
// The mentor takes the press: go_deeper, the lesson's hand-in snapshot, its opening.
async function inLesson(opts) {
  const h = await pressed(opts);
  const a = h.adapter();
  a.emit("tool_call", { name: "go_deeper" });
  a.emit("tool_result", GO(!(opts && opts.unlearned)));
  a.emit("tool_result", HAND_IN(!(opts && opts.unlearned)));
  a.emit("text", { text: OPENING });
  a.emit("turn_end", { ok: true, kind: "go_deeper", total_ms: 4000 });
  return h;
}
async function checked(passed, opts) {
  const h = await inLesson(opts);
  h.app.act("check");
  const a = h.adapter();
  a.emit("tool_result", CHECK(passed));
  if (passed) {
    a.emit("tool_result", RECORD());
    a.emit("text", { text: "Shake Control's pivot is where you said. That was step 3; next is step 4." });
  } else {
    a.emit("text", { text: "The pivot moved, but so did the null: rock.png sits about 40 px left." });
  }
  a.emit("turn_end", { ok: true, kind: "check" });
  return h;
}

// state id → [drive, markers the screen must show, markers it must not].
const CASES = {
  "ask-deeper-starting": [pressed, [PRESS, COPY.buttons.pressed.start, COPY.status.lesson_ready, Q], [A.go_deeper("Set the pivot"), "/ask-mentor"]],
  "ask-deeper-lesson": [inLesson, [OPENING, A.from_question, COPY.lesson.practice_tag, COPY.buttons.check, "Set the pivot (anchor point)", "Shake Control"], [COPY.lesson.review_tag, "review", PRESS]],
  "ask-deeper-notyet": [() => checked(false), ["about 40 px left", COPY.buttons.check, COPY.lesson.practice_tag, A.from_question], ["review", "fail", COPY.lesson.passed]],
  "ask-deeper-passed": [() => checked(true), [COPY.lesson.done_tag, "Pivot moved, nothing else did.", COPY.lesson.saved, A.back_to_steps, A.from_question], [COPY.buttons.whats_next, COPY.lesson.passed, COPY.lesson.review_passed, "review", COPY.ask_placeholder, COPY.lesson.passed_tag]],
  "ask-lessonopen": [async () => { const h = await inLesson(); h.app.act("back_question"); return h; }, [Q, PRESS, A.back_to_lesson, A.lesson_is_open("Set the pivot"), A.lesson_open, A.your_steps(4)], [A.go_deeper("Set the pivot")]],
  "home-lessonopen-deeper": [async () => { const h = await inLesson(); h.app.act("tab", { tab: "home" }); return h; }, [A.card_title, A.lesson_open, COPY.quiet.back_lesson, A.from_question_sub, COPY.buttons.end_lesson], [A.back_to_question]],
  "ask-back": [async () => { const h = await checked(true); h.app.act("back_steps"); return h; }, ["Set the pivot · practiced on Shake Control", `That was step 3; next is step 4: ${NEXT_STEP}`, A.question_and_answer, A.your_steps(4)], [A.go_deeper("Set the pivot"), A.back_to_lesson]],
  "ask-ended": [async () => {
    const h = await inLesson();
    h.app.act("tab", { tab: "home" });
    h.app.act("end_lesson");
    const a = h.adapter();
    a.emit("text", { text: "Step 3 is still there when you want it; next is step 4: play it back and watch the turn." });
    a.emit("turn_end", { ok: true, kind: "followup" });
    return h;
  }, ["Set the pivot · ended, not saved", "Step 3 is still there when you want it", A.your_steps(4)], [A.go_deeper("Set the pivot"), "I've ended that lesson", "/ask-mentor"]],
};

test("every MU go-deeper id is a state this panel knows, and each has a case here (SC-011: 100%)", () => {
  assert.equal(DEEPER_IDS.length, 8);
  for (const id of DEEPER_IDS) assert.ok(STATE_IDS.includes(id), id);
  assert.deepEqual(Object.keys(CASES).sort(), [...DEEPER_IDS].sort());
});

for (const [id, [drive, show, hide]] of Object.entries(CASES)) {
  test(`SC-011: ${id} is reachable from fixture events and shows what it should`, async () => {
    const h = await drive();
    assert.equal(st(h), id);
    const t = text(h);
    for (const m of show) assert.ok(t.includes(m), `${id} should show: ${m}`);
    for (const m of hide) assert.equal(t.includes(m), false, `${id} shouldn't show: ${m}`);
  });
}

// ---------- the press and the hand-over ----------

test("ask-deeper-starting: the press sends MU's sentence once, on the thread's conversation; a second press does nothing", async () => {
  const h = await pressed();
  const a = h.adapter();
  assert.deepEqual(a.sent.at(-1), { text: PRESS, kind: "go_deeper" });
  const { html } = screen(h);
  assert.match(html, /class="pressed" disabled aria-busy="true"/, "Starting…, and it can't be pressed");
  h.app.act("go_deeper", { skill: "transform.anchor" });
  assert.equal(a.sent.length, 2, "question and press only");
  assert.equal(h.app.followUp("hello"), false, "the bar waits too");
});

test("ask-deeper-lesson: the same conversation becomes the lesson's; Pick is ticked; the lesson's Back goes to the question", async () => {
  const h = await inLesson();
  const before = h.adapters.length;
  const m = h.app.model();
  assert.equal(h.adapters.length, before, "no new process");
  assert.equal(m.tab, "lesson");
  assert.equal(m.lesson_open, true);
  assert.equal(m.lesson.skill, "transform.anchor");
  const { html, r } = screen(h);
  assert.match(r.lesson.head, /class="done"><span class="mk" aria-hidden="true">✓<\/span>Pick/, "Pick is already done");
  assert.match(r.lesson.head, /data-action="back_question"/);
  assert.ok(plain(r.lesson.head).includes(COPY.back.question));
  assert.doesNotMatch(html, /data-action="go_home"/);
  assert.equal(h.saved.current.claude_session_id, h.saved.thread.claude_session_id, "Pick up would resume the same conversation");
  assert.equal(h.saved.current.skill, "anchor-mentor");
  const turn = h.turns.at(-1);
  assert.equal(turn.thread, "ask", "a go-deeper lesson's turns are the thread's (FR-058)");
  assert.equal(turn.kind, "go_deeper");
  // A lesson button goes to that same conversation.
  h.app.act("check");
  assert.deepEqual(h.adapter().sent.at(-1), { text: "I'm done. Check my work.", kind: "check" });
  h.adapter().emit("turn_end", { ok: true, kind: "check" });
  assert.equal(h.turns.at(-1).thread, "ask");
});

test("ask-deeper-lesson: an unlearned skill runs as a first lesson, with no Practice tag", async () => {
  const h = await inLesson({ unlearned: true });
  assert.equal(st(h), "ask-deeper-lesson");
  assert.equal(text(h).includes(COPY.lesson.practice_tag), false);
});

test("a typed yes the mentor takes hands over the same way, with the tag from go_deeper's reply", async () => {
  const h = await answered();
  assert.equal(h.app.followUp("yes, show me"), true);
  const a = h.adapter();
  a.emit("tool_result", GO(true));
  a.emit("tool_result", HAND_IN(true));
  a.emit("turn_end", { ok: true, kind: "followup" });
  assert.equal(st(h), "ask-deeper-lesson");
  assert.equal(h.app.model().deeper.tag, "Set the pivot");
  assert.equal(h.turns.at(-1).kind, "followup");
});

test("a refused go_deeper isn't a hand-over: the mentor's words stay in the thread, and Go deeper is back", async () => {
  const h = await pressed();
  const a = h.adapter();
  a.emit("tool_result", R("go_deeper", "OFFER_NOT_READY: That lesson can't start from an answer yet.", false));
  a.emit("text", { text: "That lesson can't start from here yet; the steps still work on their own." });
  a.emit("turn_end", { ok: true, kind: "go_deeper" });
  const m = h.app.model();
  assert.equal(m.lesson_open, false);
  assert.equal(m.deeper, null);
  assert.equal(st(h), "ask-answer");
  assert.ok(text(h).includes("can't start from here yet"));
  assert.match(screen(h).html, /data-action="go_deeper"/);
});

test("hand_in_lost: the lesson opens as from Skills (Pick not ticked), still from the question", async () => {
  const h = await pressed();
  const a = h.adapter();
  a.emit("tool_result", GO(true));
  a.emit("tool_result", R("anchor_snapshot", { lesson: "new", mode: "lesson", mode_source: "hand_in_lost", focus: null, targets: [] }));
  a.emit("turn_end", { ok: true, kind: "go_deeper" });
  assert.equal(st(h), "ask-deeper-lesson");
  const { r } = screen(h);
  assert.doesNotMatch(r.lesson.head, /class="done"><span class="mk" aria-hidden="true">✓<\/span>Pick/);
  assert.ok(plain(r.lesson.head).includes(A.from_question));
  assert.ok(plain(r.lesson.head).includes(COPY.lesson.practice_tag), "practice from go_deeper's own reply");
});

// ---------- while it's open (FR-050, FR-052) ----------

test("ask-lessonopen: Back to your lesson goes back to it; nothing in the thread can start a second", async () => {
  const h = await inLesson();
  h.app.act("back_question");
  const { html } = screen(h);
  assert.doesNotMatch(html, /data-action="go_deeper"/);
  assert.match(html, /data-action="back_lesson"/);
  assert.match(html, /aria-describedby="ask-in-why"/, "the follow-up bar is paused with its reason linked (FR-054)");
  h.app.act("go_deeper", { skill: "transform.anchor" });
  assert.equal(h.adapter().sent.length, 2);
  h.app.act("back_lesson");
  assert.equal(st(h), "ask-deeper-lesson");
});

test("home-lessonopen-deeper: Ask is paused with the reason; the quiet line goes back to the lesson", async () => {
  const h = await inLesson();
  h.app.act("tab", { tab: "home" });
  const m = h.app.model();
  assert.equal(m.ask_off, A.lesson_open);
  assert.equal(h.app.askQuestion("Another question"), false);
  const html = renderApp(m).view;
  assert.match(html, /data-action="back_lesson"/);
  assert.doesNotMatch(html, /data-action="back_question"/);
});

test("AE busy during a go-deeper lesson shows ask-busy in the thread (FR-052)", async () => {
  const h = await inLesson();
  h.app.act("back_question");
  h.app.setConnection({ state: "busy", started: CONNECTED.started });
  assert.equal(st(h), "ask-busy");
});

// ---------- the way back ----------

test("ask-deeper-passed: Back to your steps waits while the turn that saved it is still running", async () => {
  const h = await inLesson();
  h.app.act("check");
  const a = h.adapter();
  a.emit("tool_result", CHECK(true));
  a.emit("tool_result", RECORD());
  assert.equal(h.app.model().lesson_open, false);
  assert.ok(text(h).includes(COPY.paused.after_answer));
  assert.equal(text(h).includes(A.back_to_steps), false);
  h.app.act("back_steps");
  assert.equal(h.app.model().tab, "lesson", "a press while it's answering does nothing");
  a.emit("text", { text: "That was step 3; next is step 4." });
  a.emit("turn_end", { ok: true, kind: "check" });
  assert.ok(text(h).includes("That was step 3; next is step 4."), "its last words land in the lesson");
  assert.ok(text(h).includes(A.back_to_steps));
});

test("ask-back: Your steps opens itself once; the first follow-up goes to the same conversation with the ask command, then plain", async () => {
  const h = await checked(true);
  const a = h.adapter();
  h.app.act("back_steps");
  const m = h.app.model();
  assert.equal(m.tab, "home");
  assert.equal(m.lesson_open, false);
  assert.match(renderApp(m).lesson.list, /aria-expanded="true"/);
  assert.equal(m.thread.questions.at(-1).kind, "lesson_back");
  assert.equal(h.app.model().deeper.state, "passed");
  assert.equal(h.app.followUp("Done. What now?"), true);
  assert.equal(h.adapter(), a, "the same conversation, no new process");
  assert.deepEqual(a.sent.at(-1), { text: `${ASK_COMMAND} Done. What now?`, kind: "followup" });
  a.emit("text", { text: "Play it back." });
  a.emit("turn_end", { ok: true, kind: "followup" });
  assert.equal(h.turns.at(-1).thread, "ask");
  h.app.followUp("And then?");
  assert.deepEqual(a.sent.at(-1), { text: "And then?", kind: "followup" }, "only the first");
});

test("ask-back: the hand-back line after the last step", async () => {
  const h = await inLesson();
  h.app.act("check");
  const a = h.adapter();
  a.emit("tool_result", CHECK(true));
  a.emit("tool_result", RECORD({ hand_back: { step_number: 4, next_step: null } }));
  a.emit("turn_end", { ok: true, kind: "check" });
  h.app.act("back_steps");
  assert.ok(text(h).includes(A.last_step));
});

test("ask-ended: End lesson sends its request on the thread's conversation, shows no bubble, and logs as the thread's follow-up", async () => {
  const h = await inLesson();
  const a = h.adapter();
  h.app.act("tab", { tab: "home" });
  h.app.act("end_lesson");
  assert.equal(h.adapter(), a, "the conversation isn't stopped");
  assert.equal(a.stopped, 0);
  assert.deepEqual(a.sent.at(-1), { text: "/ask-mentor I've ended that lesson.", kind: "followup" });
  assert.equal(h.saved.current, null, "nothing to pick up");
  assert.equal(st(h), "ask-ended", "the divider shows while the reply comes");
  a.emit("text", { text: "Next is step 4." });
  a.emit("turn_end", { ok: true, kind: "followup" });
  assert.equal(h.turns.at(-1).kind, "followup");
  assert.equal(h.turns.at(-1).thread, "ask");
  assert.equal(h.app.model().lesson_open, false);
  h.app.followUp("ok");
  assert.deepEqual(a.sent.at(-1), { text: "ok", kind: "followup" }, "End lesson's own send already went back to the ask skill");
});

test("ask-ended: a failed End lesson turn retries End lesson's request, never the divider's words", async () => {
  const h = await inLesson();
  const a = h.adapter();
  h.app.act("tab", { tab: "home" });
  h.app.act("end_lesson");
  a.emit("turn_end", { ok: false, kind: "followup" });
  h.app.act("ask_try_again");
  assert.deepEqual(a.sent.at(-1), { text: "/ask-mentor I've ended that lesson.", kind: "followup" });
});

test("T107 in a go-deeper lesson: the mentor's end_lesson keeps its reply, then Back to your steps shows ended with its hand-back", async () => {
  const h = await inLesson();
  const a = h.adapter();
  assert.equal(h.app.ask("end lesson"), true);
  a.emit("tool_result", R("end_lesson", { ended: true, skill_name: "Set the pivot (anchor point)", hand_back: { step_number: 3, next_step: NEXT_STEP } }));
  a.emit("text", { text: "Okay, we'll stop here." });
  a.emit("turn_end", { ok: true, kind: "ask" });
  assert.equal(h.app.model().lesson_open, false);
  assert.equal(h.app.model().tab, "lesson");
  assert.ok(text(h).includes("Okay, we'll stop here."));
  assert.ok(text(h).includes(A.back_to_steps));
  assert.equal(h.saved.current.ended, true);
  h.app.act("back_steps");
  assert.equal(st(h), "ask-ended");
  assert.ok(text(h).includes("Set the pivot · ended, not saved"));
  assert.ok(text(h).includes(`That was step 3; next is step 4: ${NEXT_STEP}`));
  assert.equal(a.sent.length, 3, "question, press, \"end lesson\": no End lesson request, the mentor already ended it");
});

test("a go-deeper lesson whose mentor goes away returns the thread to ended, so Go deeper isn't stuck as Back to your lesson", async () => {
  const h = await inLesson();
  h.adapter().emit("exit", {});
  assert.equal(h.app.model().deeper.state, "ended");
  h.app.act("back_question");
  assert.doesNotMatch(screen(h).html, /data-action="back_lesson"/);
  assert.ok(text(h).includes("Set the pivot · ended, not saved"));
});

test("after a go-deeper lesson, a lesson from Skills ends the thread's conversation as any lesson does", async () => {
  const h = await checked(true);
  h.app.act("back_steps");
  const a = h.adapter();
  h.app.act("new_lesson", { skill: "parenting.null" });
  assert.equal(a.stopped, 1);
  assert.notEqual(h.adapter(), a);
  assert.equal(h.app.model().thread.after_lesson, true);
  assert.equal(h.app.model().deeper_lesson, false);
});

// ---------- SC-011: B1 shows no Go deeper ----------

test("SC-011: a b1 panel draws no Go deeper for any result, and nothing hands over", async () => {
  const h = await answered({ runtime: "b1" });
  assert.ok(COMP1.offered_skills.length > 0 && COMP1.runtime === "a", "even a result that says A and offers a skill");
  assert.doesNotMatch(screen(h).html, /deeper-btn|data-action="go_deeper"|Go deeper:/);
  h.app.act("go_deeper", { skill: "transform.anchor" });
  assert.equal(h.adapter().sent.length, 1, "a press does nothing");
  h.app.followUp("yes, go deeper");
  h.adapter().emit("tool_result", GO(true));
  h.adapter().emit("turn_end", { ok: true, kind: "followup" });
  assert.equal(h.app.model().lesson_open, false, "a go_deeper result on B1 opens nothing");
  assert.equal(h.app.model().tab, "home");
});

test("SC-011: a saved thread with offers, read back on a b1 panel, draws none", async () => {
  const a = await answered();
  const saved = JSON.parse(JSON.stringify(a.saved.thread));
  assert.ok(saved.questions[0].view.offers.length > 0);
  const h = await panel({ runtime: "b1", thread: saved });
  h.app.act("back_question");
  assert.doesNotMatch(screen(h).html, /deeper-btn|data-action="go_deeper"|Go deeper:/);
});

test("SC-011: with two offers, each gets its own Go deeper inside the answer; pressing one marks only it", async () => {
  const two = Object.assign({}, COMP1, {
    steps: COMP1.steps.slice(0, 3).concat([{ text: "Add a null and parent the letters to it.", skill: "parenting.null", layer: "Shake Control" }]),
    offered_skills: ["transform.anchor", "parenting.null"],
    tags: { "transform.anchor": "Set the pivot", "parenting.null": "Group with a null" },
  });
  const h = await panel();
  h.app.setDraft(Q);
  h.app.act("ask_home");
  h.adapter().emit("tool_result", R("give_answer", two));
  h.adapter().emit("turn_end", { ok: true, kind: "question" });
  let html = screen(h).html;
  assert.equal((html.match(/data-action="go_deeper"/g) || []).length, 2);
  assert.ok(plain(html).includes(A.go_deeper("Group with a null")));
  h.app.act("go_deeper", { skill: "parenting.null" });
  assert.equal(h.adapter().sent.at(-1).text, "Yes, go deeper on Group with a null.");
  html = screen(h).html;
  assert.equal((html.match(/Starting…/g) || []).length, 1);
  assert.match(html, /data-skill="transform.anchor" aria-disabled="true"/, "the other waits, still focusable");
});
