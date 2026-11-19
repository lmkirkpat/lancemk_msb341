// Spec 014 T107: the panel treats the mentor's end_lesson like End lesson, keeping the mentor's last
// reply on screen. T038's live repro (discovery/usage-notes/ask-build.md › T038, finding 1): "end
// lesson" typed right after a pivot opening ended the lesson in words, but panel-session.json stayed
// open, Home's Ask stayed paused and follow-ups went into the lesson with Done, check it showing.
"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { ready, plain, SIX_PATH, SKILLS_BUILT, LESSON } = require("./app-harness.js");
const { renderApp } = require("../lib/screens.js");
const { COPY } = require("../lib/copy.js");
const { REQUESTS, ASK_COMMAND } = require("../lib/requests.js");
const ps = require("../lib/panel-session.js");
const COMP1 = require("./fixtures/ask/comp1-answer.json");

const Q = "How can I make the rock shake from the hammer hit?";
const OPENING = "Which layer should turn from somewhere other than its middle, and where should it turn from?";
const STOP = "Okay, we'll stop here. Nothing was changed.";
const WRAP = `${ASK_COMMAND} ${REQUESTS.ask_context.request}`;

function html(h) {
  const r = renderApp(h.app.model());
  if (!r.lesson) return plain(r.nav + r.view);
  const c = r.lesson.chat;
  return plain([r.nav, r.lesson.head, r.lesson.banner, c.earlier || "", ...c.items, r.lesson.list, r.lesson.status, r.lesson.actions, r.lesson.ask].join("\n"));
}

async function panel(runtime) {
  return ready({ runtime, memory: { status: "ok", record: LESSON }, pathData: SIX_PATH, skillsBuilt: SKILLS_BUILT, setTimeout: () => 0 });
}

// A thread with one answer, then a pivot lesson from Skills: its opening, then "end lesson" typed in
// the lesson's Ask bar, and the mentor's end_lesson and its one-sentence reply.
function askThenLesson(h) {
  h.app.setDraft(Q);
  h.app.act("ask_home");
  const t = h.adapter();
  t.emit("tool_result", { name: "give_answer", ok: true, text: "", images: [], json: COMP1 });
  t.emit("turn_end", { ok: true, kind: "question" });
  h.app.act("thread_back");
  h.app.act("new_lesson", { skill: "transform.anchor" });
  const l = h.adapter();
  assert.notEqual(l, t, "the lesson has its own conversation");
  l.emit("tool_result", { name: "anchor_snapshot", ok: true, text: "", images: [], json: { mode: "lesson", focus: null, comp: { name: "Comp 1" } } });
  l.emit("text", { text: OPENING });
  l.emit("turn_end", { ok: true, kind: "new_lesson" });
  assert.equal(h.app.model().lesson_open, true);
  return { t, l };
}

function stopInWords(h, l, endResult) {
  assert.equal(h.app.ask("end lesson"), true);
  l.emit("tool_call", { name: "end_lesson" });
  l.emit("tool_result", Object.assign({ name: "end_lesson", images: [] }, endResult || { ok: true, text: "", json: { ended: true, skill_name: "Set the pivot (anchor point)" } }));
  l.emit("text", { text: STOP });
  l.emit("turn_end", { ok: true, kind: "ask" });
}

for (const runtime of ["b1", "a"]) {
  test(`T107 (${runtime}): end_lesson closes the lesson, keeps the mentor's reply, and ends panel-session.json`, async () => {
    const h = await panel(runtime);
    const { l } = askThenLesson(h);
    stopInWords(h, l);
    const m = h.app.model();
    assert.equal(m.lesson_open, false);
    assert.equal(m.tab, "lesson", "stays on the lesson, so the reply stays in view");
    const screen = html(h);
    assert.ok(screen.includes(STOP), "the mentor's last reply is visible");
    assert.ok(screen.includes(COPY.lesson.ended));
    assert.ok(!screen.includes(COPY.buttons.check), "no Done, check it");
    assert.ok(!screen.includes(COPY.ask_placeholder), "no lesson Ask bar: follow-ups can't go into the ended lesson");
    assert.ok(screen.includes(COPY.buttons.whats_next) && screen.includes(COPY.buttons.see_skills), "the ways out");
    assert.equal(h.saved.current.ended, true, "panel-session.json ends");
    assert.notEqual(ps.savedStatus(h.saved.current, { state: "connected", started: h.saved.current.bridge_started }), "waiting", "it can't come back as Pick up");
    assert.equal(h.app.ask("one more"), false, "the lesson's Ask is closed");
  });

  test(`T107 (${runtime}): T038's repro: after the stop in words, Home's Ask opens and a follow-up goes to the thread with the context`, async () => {
    const h = await panel(runtime);
    const { l } = askThenLesson(h);
    stopInWords(h, l);
    h.app.act("tab", { tab: "home" });
    const m = h.app.model();
    assert.equal(m.ask_off, null, "Home's Ask isn't paused");
    assert.equal(m.follow_off, null, "the thread's follow-up bar isn't paused");
    assert.equal(m.state, "home-thread");
    const home = renderApp(m).view;
    assert.ok(!/<textarea[^>]*disabled/.test(home), "the ask box isn't locked");
    assert.ok(!plain(home).includes(COPY.ask.lesson_open));
    assert.ok(plain(home).includes(COPY.buttons.find_next), "the quiet line is back to Find my next lesson");

    h.app.act("back_question");
    const before = h.adapters.length;
    assert.equal(h.app.followUp("What's next?"), true);
    const th = h.adapter();
    assert.equal(h.adapters.length, before + 1, "a fresh thread conversation, not the lesson's");
    assert.notEqual(th, l);
    assert.equal(l.sent.length, 2, "nothing more went into the lesson");
    const sent = th.sent[0];
    assert.ok(sent.text.startsWith(WRAP), "the after-lesson wrapper");
    assert.ok(sent.text.endsWith("Follow-up: What's next?"));
    th.emit("text", { text: "Step 1 is next." });
    th.emit("turn_end", { ok: true, kind: "followup" });
    const turn = h.turns[h.turns.length - 1];
    assert.equal(turn.thread, "ask");
    assert.equal(turn.kind, "followup");
    assert.ok(html(h).includes("Step 1 is next."));
  });

  test(`T107 (${runtime}): a question from Home's Ask after the stop logs as the thread's`, async () => {
    const h = await panel(runtime);
    const { l } = askThenLesson(h);
    stopInWords(h, l);
    h.app.act("tab", { tab: "home" });
    h.app.setDraft("Why does it swing?");
    h.app.act("ask_home");
    const th = h.adapter();
    assert.notEqual(th, l);
    assert.equal(th.sent[0].text, `${ASK_COMMAND} Why does it swing?`);
    th.emit("tool_result", { name: "give_answer", ok: true, text: "", images: [], json: COMP1 });
    th.emit("turn_end", { ok: true, kind: "question" });
    const turn = h.turns[h.turns.length - 1];
    assert.equal(turn.thread, "ask");
    assert.equal(turn.kind, "question");
  });
}

test("T107: a refusal because the lesson already ended closes it too; LESSON_NOT_OPEN and other refusals don't", async () => {
  const h = await panel("b1");
  const { l } = askThenLesson(h);
  stopInWords(h, l, { ok: false, text: "LESSON_ALREADY_ENDED: That lesson already ended.", json: null });
  assert.equal(h.app.model().lesson_open, false);

  const g = await panel("b1");
  const two = askThenLesson(g);
  stopInWords(g, two.l, { ok: false, text: "LESSON_NOT_OPEN: There's no lesson open.", json: null });
  assert.equal(g.app.model().lesson_open, true, "nothing says this lesson ended");
  assert.equal(g.saved.current.ended, false);
});

test("T107: while the stop's reply is still coming, the ways out wait for it", async () => {
  const h = await panel("b1");
  const { l } = askThenLesson(h);
  h.app.ask("end lesson");
  l.emit("tool_result", { name: "end_lesson", ok: true, text: "", images: [], json: { ended: true, skill_name: "Set the pivot (anchor point)" } });
  const screen = html(h);
  assert.ok(screen.includes(COPY.paused.after_answer));
  assert.ok(!screen.includes(COPY.buttons.whats_next));
  assert.equal(h.app.model().ask_off, COPY.paused.after_answer, "Home's Ask waits for the reply, then opens");
  l.emit("turn_end", { ok: true, kind: "ask" });
  assert.equal(h.app.model().ask_off, null);
});

test("T107: What's next › after the stop goes Home and leaves nothing open", async () => {
  const h = await panel("b1");
  const { l } = askThenLesson(h);
  stopInWords(h, l);
  h.app.act("whats_next");
  const m = h.app.model();
  assert.equal(m.tab, "home");
  assert.equal(m.lesson_open, false);
  assert.equal(l.stopped, 1);
});
