// Spec 007 T020 to T023: demo, pass, a lesson in progress, errors on screen (FR-018, FR-019, FR-021,
// FR-023 to FR-030, FR-056, FR-073, SC-007).
"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { ready, tick, plain, CONNECTED } = require("./app-harness.js");
const { renderApp } = require("../lib/screens.js");
const { COPY } = require("../lib/copy.js");
const ps = require("../lib/panel-session.js");
const { createAdapter: b1Adapter } = require("../lib/adapter-claude-code.js");
const { createAdapter: apiAdapter } = require("../lib/adapter-api.js");

const r = (h) => renderApp(h.app.model()).lesson;
const list = (h) => plain(r(h).list);
const actions = (h) => plain(r(h).actions);
const chat = (h) => { const c = r(h).chat; return plain((c.earlier || "") + c.items.join("")); };
const banner = (h) => plain(r(h).banner);
const homeHtml = (h) => plain(renderApp(h.app.model()).view);
const st = (h) => h.app.model().state;

const SNAP = { name: "snapshot_project", ok: true, text: "", images: [] };
const seg = (id, f, t) => ({ id, from_time: f, to_time: t, state: "linear" });
const FOCUSED = { lesson: "new", focus: ["Title"], demo_target: "a", targets: ["a", "b", "c"], findings: [{ layer: "Title", property: "Position", segments: [seg("a", 0.5, 1.5), seg("b", 1.5, 3)] }, { layer: "Title", property: "Scale", segments: [seg("c", 0.5, 1.5)] }] };
const CHECK = (over) => ({ name: "diff_since_last", ok: true, text: "", images: [], json: Object.assign({ comp_matches: true, passed: false, summary: { learner_eased: 0, total_for_learner: 2, still_linear: 2 }, targets: [{ segment_id: "a", label: "Title › Position 0.5–1.5 s", result: "still_linear" }, { segment_id: "b", label: "Title › Position 1.5–3 s", result: "still_linear" }] }, over) });
const SET_EASE = { name: "set_ease", ok: true, text: "", images: [], json: { eased: "Title › Position, 0.500 s → 1.500 s", undo: "Edit > Undo" } };
const SAVED = { name: "record_lesson", ok: true, text: "", images: [], json: { saved: true } };

async function open(opts) {
  const h = await ready(opts);
  h.app.act("start");
  const a = h.adapter();
  a.emit("tool_result", Object.assign({ json: FOCUSED }, SNAP));
  a.emit("text", { text: "Let's start with Title." });
  a.emit("turn_end", { ok: true, cost_usd: 0, kind: "start" });
  return h;
}
const end = (h, kind) => h.adapter().emit("turn_end", { ok: true, kind: kind || "ask" });

// ---------- T020: the demo ----------

test("lesson-demo: Changed in your comp, the Demo row before any check, Show me becomes Show me again (FR-018, FR-019)", async () => {
  const h = await open();
  h.app.ask("Title's good");
  h.adapter().emit("tool_result", Object.assign({ json: Object.assign({}, FOCUSED, { lesson: "continued" }) }, SNAP));
  end(h, "ask");
  assert.ok(actions(h).includes(">Show me<"));
  h.app.act("show_me");
  assert.equal(h.adapter().sent[2].text, "Show me how first.");
  const a = h.adapter();
  a.emit("tool_result", SET_EASE);
  a.emit("text", { text: "I eased it." });
  end(h, "show_me");
  assert.equal(st(h), "lesson-demo");
  const c = chat(h);
  assert.ok(c.includes(COPY.lesson.changed_in_comp));
  assert.ok(c.includes("Title › Position, 0.5–1.5 s"));
  assert.ok(c.includes(COPY.lesson.undo));
  const l = list(h);
  assert.match(l, /Position 0\.5–1\.5 s[^]*Demo/);
  assert.ok(l.includes("2 pairs are yours · not checked yet"));
  assert.ok(l.includes("Next: Position 1.5–3 s"));
  assert.ok(actions(h).includes("Show me again"));
  assert.equal(actions(h).includes(">Show me<"), false);
  h.app.act("show_me_again");
  assert.equal(h.adapter().sent[3].text, "Show me again: explain the pair you already eased, with a frame. Don't change anything.");
});

test("no Show me with no demo target, and Show me hides on a review (FR-019)", async () => {
  const h = await ready();
  h.app.act("start");
  h.adapter().emit("tool_result", Object.assign({ json: Object.assign({}, FOCUSED, { demo_target: null }) }, SNAP));
  end(h, "start");
  assert.equal(actions(h).includes("Show me"), false);
  const k = await ready();
  k.app.act("start");
  k.adapter().emit("tool_result", Object.assign({ json: Object.assign({}, FOCUSED, { mode: "review" }) }, SNAP));
  end(k, "start");
  assert.equal(actions(k).includes("Show me"), false);
});

// ---------- T021: passing ----------

test("lesson-passed-asking: a pass with no save yet keeps Ask and waits for the save", async () => {
  const h = await open();
  h.app.act("check");
  h.adapter().emit("tool_result", CHECK({ passed: true, summary: { learner_eased: 2, total_for_learner: 2, still_linear: 0 }, targets: [{ segment_id: "a", label: "Title › Position 0.5–1.5 s", result: "eased_by_learner" }] }));
  end(h, "check");
  assert.equal(st(h), "lesson-passed-asking");
  assert.ok(banner(h).includes(COPY.lesson.check_passed));
  assert.ok(banner(h).includes(COPY.lesson.one_more_question));
  assert.ok(plain(r(h).head).includes(COPY.lesson.check_passed_tag));
  assert.equal(/<input[^>]*disabled/.test(r(h).ask), false);
});

test("lesson-passed: the plain pass line, Saved only on saved:true, Plus the demo pair, two ways out", async () => {
  const h = await open();
  h.app.act("check");
  h.adapter().emit("tool_result", CHECK({ passed: true, summary: { learner_eased: 2, total_for_learner: 2, still_linear: 0 }, targets: [{ segment_id: "a", label: "Title › Position 0.5–1.5 s", result: "eased_by_demo" }, { segment_id: "b", label: "Title › Position 1.5–3 s", result: "eased_by_learner" }] }));
  h.adapter().emit("tool_result", SAVED);
  end(h, "check");
  assert.equal(st(h), "lesson-passed");
  assert.ok(banner(h).includes(COPY.lesson.passed));
  assert.ok(banner(h).includes(COPY.lesson.saved));
  assert.ok(list(h).includes(COPY.check.plus_demo));
  assert.ok(actions(h).includes(COPY.buttons.whats_next));
  assert.ok(actions(h).includes(COPY.buttons.see_skills));
  h.app.act("whats_next");
  assert.equal(h.app.model().tab, "home");
  assert.equal(h.app.model().lesson_open, false);
  assert.equal(h.adapter().stopped, 1);
});

test("After a saved pass, Home's card is not Lesson in progress (the lesson is over)", async () => {
  const h = await open();
  h.adapter().emit("tool_result", CHECK({ passed: true }));
  h.adapter().emit("tool_result", SAVED);
  end(h);
  h.app.act("tab", { tab: "home" });
  assert.notEqual(st(h), "home-lessonopen");
});

test("lesson-passed-unsaved: the pass stands and Saved never shows (FR-021)", async () => {
  const h = await open();
  h.adapter().emit("tool_result", CHECK({ passed: true }));
  h.adapter().emit("tool_result", { name: "record_lesson", ok: false, text: "error", images: [] });
  end(h);
  assert.equal(st(h), "lesson-passed-unsaved");
  assert.ok(banner(h).includes(COPY.lesson.unsaved.title));
  assert.equal(banner(h).includes(COPY.lesson.saved), false);
});

test("D6: saved with no pass shows Saved and the ways out, with no pass line", async () => {
  const h = await open();
  h.adapter().emit("tool_result", SAVED);
  end(h);
  assert.ok(banner(h).includes(COPY.lesson.saved));
  assert.equal(banner(h).includes(COPY.lesson.passed), false);
  assert.ok(actions(h).includes(COPY.buttons.whats_next));
});

// ---------- FR-046 (2026-11-09): Ask stays after a pass ----------

const askEnabled = (h) => r(h).ask.includes("<input") && !/<input[^>]*disabled/.test(r(h).ask);
const FAILING = CHECK({ passed: false });

async function passedLesson(opts, record) {
  const h = await open(opts);
  h.adapter().emit("tool_result", CHECK({ passed: true }));
  h.adapter().emit("tool_result", record || SAVED);
  end(h);
  return h;
}
const UNSAVED = { name: "record_lesson", ok: false, text: "error", images: [] };

test("FR-046: Ask is open on lesson-passed and lesson-passed-unsaved, in the same session", async () => {
  for (const [record, state] of [[SAVED, "lesson-passed"], [UNSAVED, "lesson-passed-unsaved"]]) {
    const h = await passedLesson({}, record);
    assert.equal(st(h), state);
    assert.ok(askEnabled(h), state);
    const before = h.adapters.length;
    assert.equal(h.app.ask("Why does that work?"), true);
    assert.equal(h.adapters.length, before, "no new process");
    assert.deepEqual(h.adapter().sent.at(-1), { text: "Why does that work?", kind: "ask" });
  }
});

test("FR-046: Ask stays hidden with no session (exited, start failed), and on a save with no pass (D6)", async () => {
  const x = await open();
  x.adapter().emit("error", { kind: "process_exited", message: "x" });
  assert.equal(st(x), "lesson-exited");
  assert.equal(r(x).ask, "");
  const n = await open();
  n.adapter().emit("tool_result", SAVED);
  end(n);
  assert.equal(r(n).ask, "");
});

test("asking from a passed lesson: the passed screen stays, its ways out wait for the answer, then return", async () => {
  const h = await passedLesson();
  h.app.ask("Why?");
  assert.equal(st(h), "lesson-passed");
  assert.equal(actions(h).includes(COPY.buttons.whats_next), false, "can't leave mid-answer");
  assert.ok(actions(h).includes(COPY.paused.after_answer));
  assert.ok(/<input[^>]*disabled/.test(r(h).ask));
  assert.equal(h.app.ask("Again?"), false, "can't send twice");
  h.adapter().emit("text", { text: "Because." });
  end(h);
  assert.equal(st(h), "lesson-passed");
  assert.ok(actions(h).includes(COPY.buttons.whats_next));
  assert.ok(askEnabled(h));
  assert.ok(banner(h).includes(COPY.lesson.saved));
  assert.ok(chat(h).includes("Because."));
  assert.equal(h.app.model().lesson_open, false, "still over, so Home isn't Lesson in progress");
  assert.equal(h.turns.filter((t) => t.lesson_passed).length, 1, "the pass is logged once");
});

test("Home's start waits, and says why, while a question after a pass is being answered (FR-060, FR-061)", async () => {
  const h = await passedLesson();
  h.app.ask("Why?");
  h.app.act("tab", { tab: "home" });
  assert.ok(homeHtml(h).includes(COPY.paused.after_answer));
  assert.equal(homeHtml(h).includes('data-action="start"'), false);
  end(h);
  assert.ok(homeHtml(h).includes('data-action="start"'));
});

test("a second record refused after a pass can't unsay Saved; a later failing check can't unsay the pass", async () => {
  const h = await passedLesson();
  h.app.ask("Check it again?");
  h.adapter().emit("tool_result", UNSAVED);
  h.adapter().emit("tool_result", FAILING);
  end(h);
  assert.equal(st(h), "lesson-passed");
  assert.ok(banner(h).includes(COPY.lesson.saved));
  assert.equal(h.app.model().lesson.passed, true);
  assert.ok(list(h).includes("still to ease"), "the list still tells the truth about the comp");
  const u = await passedLesson({}, UNSAVED);
  u.app.ask("Again?");
  u.adapter().emit("tool_result", FAILING);
  end(u);
  assert.equal(st(u), "lesson-passed-unsaved");
});

test("a question that fails after a pass leaves the pass on screen; Ask works again, resuming first after a B1 timeout", async () => {
  const h = await passedLesson();
  const first = h.adapter();
  h.app.ask("Why?");
  first.emit("error", { kind: "timeout", message: "x" });
  first.emit("turn_end", { ok: false, kind: "ask" });
  assert.equal(st(h), "lesson-passed");
  assert.ok(chat(h).includes(COPY.errors.after_pass_failed.title));
  assert.ok(askEnabled(h));
  assert.equal(h.app.ask("Still there?"), true);
  assert.equal(first.stopped, 1, "the hung process is stopped");
  assert.notEqual(h.adapter(), first);
  assert.equal(h.adapter().started[0].resumeSessionId, "session-1");
  assert.equal(h.adapter().sent.at(-1).text, "Still there?");
});

test("the mentor's process dying on a question after a pass: the pass stands, nothing says it wasn't saved, Ask goes", async () => {
  const h = await passedLesson();
  h.app.ask("Why?");
  h.adapter().emit("error", { kind: "process_exited", message: "x" });
  h.adapter().emit("turn_end", { ok: false, kind: "ask" });
  h.adapter().emit("exit", { code: 1 });
  assert.equal(st(h), "lesson-passed");
  assert.ok(banner(h).includes(COPY.lesson.saved));
  assert.ok(chat(h).includes(COPY.errors.after_pass_stopped.title));
  assert.equal(chat(h).includes(COPY.errors.process_exited.title), false);
  assert.equal(r(h).ask, "", "no session to ask");
  assert.ok(actions(h).includes(COPY.buttons.whats_next));
});

test("FR-053: a saved lesson refreshes Home's memory card", async () => {
  let read = 0;
  const h = await ready({ readRecord: () => { read++; return Promise.resolve({ status: "missing", record: null }); } });
  h.app.act("start");
  h.adapter().emit("tool_result", SAVED);
  await tick();
  assert.equal(read, 2);
});

// ---------- T022: a lesson in progress ----------

test("home-lessonopen: Back to lesson and End lesson; Start replaced by why (FR-024); End records nothing (FR-025, FR-073)", async () => {
  const h = await open();
  h.app.act("go_home");
  assert.equal(st(h), "home-lessonopen");
  const v = homeHtml(h);
  assert.ok(v.includes(COPY.home.lesson_open.kicker));
  assert.ok(v.includes(COPY.buttons.back_lesson));
  assert.ok(v.includes(COPY.home.lesson_open.note));
  assert.ok(v.includes(COPY.paused.after_lesson));
  assert.equal(v.includes(COPY.buttons.start), false);
  const sent = h.adapter().sent.length;
  h.app.act("end_lesson");
  assert.equal(h.adapter().stopped, 1);
  assert.equal(h.adapter().sent.length, sent, "End lesson sends nothing");
  assert.equal(h.app.model().lesson_open, false);
  assert.equal(h.saved.current, null, "nothing to continue");
  h.app.act("end_lesson");
  assert.equal(h.adapter().stopped, 1);
});

test("FR-060, FR-061: End lesson is off during a turn and says why; back on when the turn ends", async () => {
  const h = await open();
  h.app.act("hint");
  h.app.act("go_home");
  assert.equal(st(h), "home-lessonopen");
  assert.match(renderApp(h.app.model()).view, /data-action="end_lesson" disabled/);
  assert.ok(homeHtml(h).includes(COPY.paused.end_after_answer));
  h.app.act("end_lesson");
  assert.equal(h.app.model().lesson_open, true);
  assert.equal(h.adapter().stopped, 0);
  end(h, "hint");
  assert.doesNotMatch(renderApp(h.app.model()).view, /data-action="end_lesson" disabled/);
  assert.equal(homeHtml(h).includes(COPY.paused.end_after_answer), false);
});

test("FR-023: only one lesson at a time; Start while one is open does nothing", async () => {
  const h = await open();
  h.app.act("start");
  assert.equal(h.adapters.length, 1);
});

const saved = (over) => Object.assign({ version: 2, claude_session_id: "s1", bridge_started: CONNECTED.started, ended: false, started_at: "2026-11-09T10:00:00.000Z", updated_at: "2026-11-09T10:05:00.000Z", skill: "ease-mentor", lesson: { skill: "easing.basic", focus: ["Title"], snapshots: 1, checks: 1, replied: true, passed: false, labels: {}, check_list: { source: "check", summary: "1 of 3 yours eased · 2 still to ease", sections: [], outside: [], worth_a_look: [], footer: [], stale: null, stale_kind: null, checked_at: new Date(2026, 10, 8, 21, 12).toISOString() } }, messages: [{ role: "mentor", text: "Earlier.", frames: ["/gone.png"] }, { role: "learner", text: "Done, check it", frames: [] }] }, over);

test("FR-026: a saved lesson with the same start time shows home-cutoff; Up next pushed back", async () => {
  const h = await ready({ saved: saved() });
  assert.equal(st(h), "home-cutoff");
  const v = homeHtml(h);
  assert.ok(v.includes(COPY.home.cutoff.kicker));
  assert.ok(v.includes("Easing on Title"));
  assert.ok(v.includes("1 of 3 yours eased"));
  assert.match(v, /card lead dim/);
  assert.ok(v.includes(COPY.buttons.continue));
  assert.ok(v.includes(COPY.home.cutoff.set_aside));
  assert.match(v, /data-action="start"/, "Start stays, not primary");
});

test("FR-028: only a differing start time ends a saved lesson; busy or absent keeps it and re-checks on poll", async () => {
  const h = await ready({ saved: saved(), connection: { state: "busy", started: null } });
  assert.notEqual(st(h), "home-cutoff");
  assert.notEqual(st(h), "home-aeclosed");
  assert.ok(h.saved.current, "kept");
  h.app.setConnection(CONNECTED);
  assert.equal(st(h), "home-cutoff");

  const a = await ready({ saved: saved(), connection: { state: "connected", started: "2026-11-09T11:00:00.000Z" } });
  assert.equal(st(a), "home-aeclosed");
  assert.equal(a.saved.current, null, "gone, so it shows once");
  assert.ok(homeHtml(a).includes(COPY.home.aeclosed.title));
  a.app.act("got_it_aeclosed");
  assert.notEqual(st(a), "home-aeclosed");

  const n = await ready({ saved: saved({ bridge_started: null }) });
  assert.equal(st(n), "home-first", "a save with no start time shows neither");
});

test("Set it aside clears the saved lesson and sends nothing (FR-027, FR-073)", async () => {
  const h = await ready({ saved: saved() });
  h.app.act("set_aside");
  assert.equal(h.saved.current, null);
  assert.equal(h.adapters.length, 0);
  assert.notEqual(st(h), "home-cutoff");
});

test("lesson-continued: redrawn, the divider, the stale note, resumed with the saved skill (FR-027, plan P8)", async () => {
  const h = await ready({ saved: saved() });
  h.app.act("continue");
  assert.deepEqual(h.adapter().started[0], { resumeSessionId: "s1", skill: "ease-mentor" });
  assert.equal(h.adapter().sent[0].text, "I'm back. Pick up where we left off.");
  assert.equal(st(h), "lesson-continued");
  const c = chat(h);
  assert.ok(c.includes(COPY.lesson.resumed_divider));
  assert.ok(c.includes(COPY.lesson.frame_gone));
  assert.ok(c.includes(COPY.buttons.continue));
  assert.ok(list(h).includes("From your last check, Nov 8, 9:12 pm."));
  h.adapter().emit("tool_result", CHECK());
  end(h, "continue");
  assert.notEqual(st(h), "lesson-continued", "a new check replaces the old list");
});

test("Start lesson with a saved lesson waiting replaces it (FR-028)", async () => {
  const h = await ready({ saved: saved() });
  h.app.act("start");
  assert.equal(h.saved.current.version, 2);
  assert.equal(h.saved.current.claude_session_id, "session-1");
});

test("panel-session.json is version 2 and keeps the skill, picked_up and labels (plan P8)", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "panel-v2-"));
  const s = ps.newPanelSession({ claude_session_id: "x", bridge_started: "t", skill: "ease-mentor", lesson: { picked_up: true, labels: { a: "L" } } });
  assert.equal(s.version, 2);
  ps.writePanelSession({ home }, s);
  const back = ps.readPanelSession({ home });
  assert.equal(back.version, 2);
  assert.equal(back.skill, "ease-mentor");
  assert.equal(back.lesson.picked_up, true);
  assert.deepEqual(back.lesson.labels, { a: "L" });
  fs.writeFileSync(path.join(home, ps.FILE), JSON.stringify({ version: 1, claude_session_id: "old", ended: false, messages: [] }));
  assert.equal(ps.readPanelSession({ home }), null, "an older file is nothing to continue");
  assert.equal(ps.savedStatus({ bridge_started: "a", ended: false }, { state: "connected", started: "a" }), "waiting");
  assert.equal(ps.savedStatus({ bridge_started: "a", ended: false }, { state: "connected", started: "b" }), "aeclosed");
  assert.equal(ps.savedStatus({ bridge_started: "a", ended: false }, { state: "busy", started: null }), null);
  assert.equal(ps.savedStatus({ bridge_started: null, ended: false }, { state: "connected", started: "b" }), null);
  assert.equal(ps.savedStatus({ bridge_started: "a", ended: true }, { state: "connected", started: "a" }), null);
  const msgs = [{ role: "change", text: "x", frames: [], title: "" }, { role: "divider", text: "d", frames: [] }, { role: "resuming", text: "r", frames: [] }, { role: "notice", title: "T", text: "b", frames: [] }, { role: "mentor", text: "m", frames: [], cut_off: true }];
  ps.writePanelSession({ home }, Object.assign(s, { messages: msgs }));
  const m2 = ps.readPanelSession({ home }).messages;
  assert.deepEqual(m2.map((x) => x.role), ["change", "divider", "resuming", "notice", "mentor"]);
  assert.equal(m2[3].title, "T");
  assert.equal(m2[4].cut_off, true);
});

test("a resumed snapshot (not via Continue) shows the resuming line once, and never twice", async () => {
  const h = await ready();
  h.app.act("start");
  h.adapter().emit("tool_result", Object.assign({ json: Object.assign({}, FOCUSED, { lesson: "resumed" }) }, SNAP));
  h.adapter().emit("tool_result", Object.assign({ json: Object.assign({}, FOCUSED, { lesson: "continued" }) }, SNAP));
  end(h, "start");
  assert.equal(st(h), "lesson-resumed");
  assert.equal(chat(h).split(COPY.lesson.picking_up).length, 2, "one line");
});

const passedSaved = () => saved({ lesson: Object.assign({}, saved().lesson, { passed: true }) });

test("a pass reopened with Continue, then saved: the lesson closes on the passed screen with its ways out", async () => {
  const h = await ready({ saved: passedSaved() });
  h.app.act("continue");
  assert.equal(st(h), "lesson-continued", "not saved yet, so it's still the reopened lesson");
  h.adapter().emit("tool_result", SAVED);
  end(h, "continue");
  assert.equal(h.app.model().lesson_open, false);
  assert.equal(st(h), "lesson-passed");
  assert.ok(actions(h).includes(COPY.buttons.whats_next));
  assert.equal(actions(h).includes(COPY.buttons.check), false);
});

test("a pass whose list went stale because AE was unreachable, then saved or not: the passed screens win", async () => {
  for (const [record, state] of [[SAVED, "lesson-passed"], [{ name: "record_lesson", ok: false, text: "error", images: [] }, "lesson-passed-unsaved"]]) {
    const h = await open();
    h.app.act("check");
    h.adapter().emit("tool_result", CHECK({ passed: true }));
    h.adapter().emit("tool_result", { name: "snapshot_project", ok: false, text: "AE_UNREACHABLE: gone", images: [] });
    assert.equal(st(h), "lesson-stale", "not saved yet");
    h.adapter().emit("tool_result", record);
    end(h, "check");
    assert.equal(st(h), state);
    assert.ok(actions(h).includes(COPY.buttons.whats_next), state);
  }
});

test("D6 on a reopened lesson: saved with no pass keeps its screen and shows the ways out", async () => {
  const h = await ready({ saved: saved() });
  h.app.act("continue");
  h.adapter().emit("tool_result", SAVED);
  end(h, "continue");
  assert.equal(st(h), "lesson-continued");
  assert.ok(banner(h).includes(COPY.lesson.saved));
  assert.ok(actions(h).includes(COPY.buttons.whats_next));
});

// ---------- T023: errors on screen ----------

test("FR-056: blocking start_failed, first turn: Home with err-mentor and Needs the mentor, no raw message (T023)", async () => {
  const h = await ready({ onStart: (a) => a.emit("error", { kind: "start_failed", message: "ENOENT /Users/x" }) });
  h.app.act("start");
  assert.equal(h.app.model().tab, "home");
  assert.equal(st(h), "err-mentor");
  const v = homeHtml(h);
  assert.ok(v.includes(COPY.errors.start_failed.title));
  assert.ok(v.includes(COPY.paused.needs_mentor));
  assert.equal(v.includes("ENOENT"), false);
  assert.equal(h.app.model().lesson_open, false);
  h.app.act("try_again");
  assert.equal(h.adapters.length, 2, "Try again starts the lesson again");
  assert.equal(st(h), "err-mentor", "this mentor still can't start");
});

test("err-mentor: Try again really starts, and a start that works opens the lesson (T023)", async () => {
  let starts = 0;
  const h = await ready({ onStart: (a) => { if (starts++ === 0) a.emit("error", { kind: "start_failed", message: "" }); } });
  h.app.act("start");
  assert.equal(st(h), "err-mentor");
  h.app.act("try_again");
  assert.equal(h.adapters.length, 2);
  assert.equal(h.adapter().sent[0].kind, "start");
  assert.equal(h.app.model().lesson_open, true);
  assert.equal(h.app.model().tab, "lesson");
  assert.equal(h.app.model().error, null);
});

test("an error after the lesson was saved leaves the passed screen and starts nothing (FR-046)", async () => {
  const h = await open();
  h.adapter().emit("tool_result", CHECK({ passed: true }));
  h.adapter().emit("tool_result", SAVED);
  end(h);
  h.adapter().emit("error", { kind: "rate_limited", message: "" });
  assert.equal(st(h), "lesson-passed");
  assert.equal(h.adapters.length, 1);
});

test("a saved start time isn't overwritten by a bridge read that found nothing; a real one replaces it", async () => {
  const none = await ready({ bridgeStarted: () => Promise.resolve(null) });
  none.app.act("start");
  await tick();
  none.adapter().emit("turn_end", { ok: true, kind: "start" });
  assert.equal(none.saved.current.bridge_started, CONNECTED.started);
  const found = await ready({ bridgeStarted: () => Promise.resolve("2026-11-09T11:00:00.000Z") });
  found.app.act("start");
  await tick();
  assert.equal(found.saved.current.bridge_started, "2026-11-09T11:00:00.000Z");
});

test("B1 not_signed_in shows err-mentor, never err-key (FR-056); A shows err-key and out_of_credit err-credit", async () => {
  const b = await ready();
  b.app.act("start");
  b.adapter().emit("error", { kind: "not_signed_in", message: "401" });
  b.adapter().emit("turn_end", { ok: false, kind: "start" });
  assert.equal(st(b), "err-mentor");
  const a = await ready({ runtime: "a" });
  a.app.act("start");
  a.adapter().emit("error", { kind: "not_signed_in", message: "" });
  a.adapter().emit("turn_end", { ok: false, kind: "start" });
  assert.equal(st(a), "err-key");
  const c = await ready({ runtime: "a" });
  c.app.act("start");
  c.adapter().emit("error", { kind: "out_of_credit", message: "" });
  assert.equal(st(c), "err-credit");
});

test("logged-only kinds never show and don't touch the lesson (FR-056)", async () => {
  const h = await open();
  h.app.act("check");
  h.adapter().emit("error", { kind: "bad_stream", message: "", length: 5 });
  assert.equal(h.app.model().error, null);
  assert.equal(st(h), "lesson-focus-replying");
});

test("lesson-error: cut off, Try again resends the last request unchanged, Done, check it too (FR-029)", async () => {
  const h = await open();
  h.app.act("hint");
  h.adapter().emit("text", { text: "First part" });
  h.adapter().emit("error", { kind: "timeout", message: "" });
  h.adapter().emit("turn_end", { ok: false, kind: "hint" });
  assert.equal(st(h), "lesson-error");
  const c = chat(h);
  assert.ok(c.includes(COPY.lesson.cut_off));
  assert.ok(c.includes(COPY.errors.timeout.title));
  assert.ok(actions(h).includes(COPY.buttons.try_again));
  assert.ok(actions(h).includes(COPY.buttons.check));
});

test("a turn that ends not ok with no error is the same cut-off, with its own line (FR-029)", async () => {
  const h = await open();
  h.app.ask("why?");
  h.adapter().emit("turn_end", { ok: false, kind: "ask" });
  assert.equal(st(h), "lesson-error");
  assert.ok(chat(h).includes(COPY.errors.stopped.title));
  assert.ok(actions(h).includes(COPY.buttons.try_again));
  h.app.act("try_again");
  assert.equal(h.adapter().sent[h.adapter().sent.length - 1].text, "why?");
  assert.equal(h.adapters.length, 1, "no restart unless it was a timeout");
});

test("B1 Try again after a timeout stops the process and resumes with the saved skill, ignoring the old adapter (research R5)", async () => {
  const h = await open();
  h.app.act("hint");
  const old = h.adapter();
  old.emit("error", { kind: "timeout", message: "" });
  old.emit("turn_end", { ok: false, kind: "hint" });
  h.app.act("try_again");
  assert.equal(old.stopped, 1);
  const a = h.adapter();
  assert.notEqual(a, old);
  assert.deepEqual(a.started[0], { resumeSessionId: "session-1", skill: "ease-mentor" });
  assert.equal(a.sent[0].text, "Can I have a hint?");
  old.emit("exit", { code: 0 });
  old.emit("tool_result", CHECK());
  assert.equal(h.app.model().lesson_open, true, "a late exit can't close the new lesson");
  assert.equal(h.app.model().lesson.checks, 0, "a late event doesn't change the view");
});

test("A retries in place after a timeout: no restart", async () => {
  const h = await open({ runtime: "a" });
  h.app.act("hint");
  h.adapter().emit("error", { kind: "timeout", message: "" });
  h.adapter().emit("turn_end", { ok: false, kind: "hint" });
  h.app.act("try_again");
  assert.equal(h.adapters.length, 1);
});

// ---- every way of sending after a B1 timeout stops the old process and resumes (research R5) ----

const timeOut = (a, kind) => {
  a.emit("error", { kind: "timeout", message: "" });
  a.emit("turn_end", { ok: false, kind });
};

// old: the timed-out adapter. `text` and `kind` are what must reach the new process, once.
function assertResumedOnce(h, old, sentBefore, text, kind) {
  assert.equal(old.stopped, 1, "the old process is stopped once");
  assert.equal(old.sent.length, sentBefore, "nothing more is written to the old process");
  assert.equal(h.adapters.length, 2, "one new process");
  const a = h.adapter();
  assert.deepEqual(a.started, [{ resumeSessionId: "session-1", skill: "ease-mentor" }]);
  assert.deepEqual(a.sent, [{ text, kind }]);
  assert.equal(a.stopped, 0);
}

const AFTER_TIMEOUT = [
  ["Done, check it", (h) => h.app.act("check"), "I'm done. Check my work.", "check"],
  ["Ask", (h) => h.app.ask("why?"), "why?", "ask"],
  ["Hint", (h) => h.app.act("hint"), "Can I have a hint?", "hint"],
];
for (const [name, press, text, kind] of AFTER_TIMEOUT) {
  test(`B1: ${name} after a timeout stops the old process and resumes the session first (research R5)`, async () => {
    const h = await open();
    h.app.act("hint");
    const old = h.adapter();
    const sentBefore = old.sent.length;
    timeOut(old, "hint");
    let adaptersAtStop = null;
    const stop = old.stop;
    old.stop = () => { adaptersAtStop = h.adapters.length; stop(); };
    press(h);
    assert.equal(adaptersAtStop, 1, "stopped before the new process starts");
    assertResumedOnce(h, old, sentBefore, text, kind);
  });
}

test("B1: Show me again after a timeout stops the old process and resumes the session first (research R5)", async () => {
  const h = await open();
  h.app.act("show_me");
  const old = h.adapter();
  const sentBefore = old.sent.length;
  old.emit("tool_result", SET_EASE);
  timeOut(old, "show_me");
  h.app.act("show_me_again");
  assert.equal(old.stopped, 1);
  assert.equal(old.sent.length, sentBefore);
  assert.equal(h.adapters.length, 2);
  assert.match(h.adapter().sent[0].text, /^Show me again/);
  assert.equal(h.adapter().sent.length, 1);
});

test("B1: a cut-off Show me whose Try again becomes another button resumes once (FR-030, research R5)", async () => {
  for (const [madeDemo, sentKind] of [[true, "show_me_again"], [false, "check"]]) {
    const h = await open();
    h.app.act("show_me");
    const old = h.adapter();
    const sentBefore = old.sent.length;
    if (madeDemo) old.emit("tool_result", SET_EASE);
    timeOut(old, "show_me");
    h.app.act("try_again");
    assert.equal(old.stopped, 1, sentKind);
    assert.equal(old.sent.length, sentBefore, sentKind);
    assert.equal(h.adapters.length, 2, sentKind);
    assert.equal(h.adapter().started.length, 1, sentKind);
    assert.equal(h.adapter().sent.length, 1, sentKind);
    assert.equal(h.adapter().sent[0].kind, sentKind);
  }
});

test("B1: Try again after a timeout resumes exactly once, and sends once", async () => {
  const h = await open();
  h.app.act("hint");
  const old = h.adapter();
  const sentBefore = old.sent.length;
  timeOut(old, "hint");
  h.app.act("try_again");
  assertResumedOnce(h, old, sentBefore, "Can I have a hint?", "hint");
});

test("B1: pressing twice after a timeout resumes once and sends once", async () => {
  const h = await open();
  h.app.act("hint");
  const old = h.adapter();
  const sentBefore = old.sent.length;
  timeOut(old, "hint");
  h.app.act("check");
  h.app.act("check");
  assertResumedOnce(h, old, sentBefore, "I'm done. Check my work.", "check");
});

test("B1: a send after the timeout has been recovered from stops nothing", async () => {
  const h = await open();
  h.app.act("hint");
  timeOut(h.adapter(), "hint");
  h.app.act("check");
  const a = h.adapter();
  a.emit("turn_end", { ok: true, kind: "check" });
  h.app.ask("why?");
  assert.equal(h.adapters.length, 2);
  assert.equal(a.stopped, 0);
  assert.equal(a.started.length, 1);
  assert.deepEqual(a.sent.map((s) => s.kind), ["check", "ask"]);
});

test("B1: a send with no timeout stops nothing, nor after another kind of cut-off", async () => {
  const quiet = await open();
  quiet.app.act("check");
  assert.equal(quiet.adapters.length, 1);
  assert.equal(quiet.adapter().stopped, 0);

  const stopped = await open();
  stopped.app.act("hint");
  stopped.adapter().emit("turn_end", { ok: false, kind: "hint" });
  stopped.app.act("check");
  assert.equal(stopped.adapters.length, 1);
  assert.equal(stopped.adapter().stopped, 0);

  const busy = await open();
  busy.app.act("hint");
  busy.adapter().emit("error", { kind: "service_busy", message: "" });
  busy.adapter().emit("turn_end", { ok: false, kind: "hint" });
  busy.app.ask("why?");
  assert.equal(busy.adapters.length, 1);
  assert.equal(busy.adapter().stopped, 0);
});

test("B1: if the resume can't start on the very first turn, nothing is sent", async () => {
  let starts = 0;
  const h = await ready({ onStart: (a) => { starts++; if (starts === 2) a.emit("error", { kind: "start_failed", message: "" }); } });
  h.app.act("start");
  const old = h.adapter();
  timeOut(old, "start");
  h.app.act("try_again");
  assert.equal(old.stopped, 1);
  assert.equal(h.adapter().sent.length, 0);
  assert.equal(h.app.model().tab, "home");
});

test("A: every send after a timeout stays on the same process", async () => {
  for (const [name, press, text, kind] of AFTER_TIMEOUT) {
    const h = await open({ runtime: "a" });
    h.app.act("hint");
    const a = h.adapter();
    timeOut(a, "hint");
    press(h);
    assert.equal(h.adapters.length, 1, name);
    assert.equal(a.stopped, 0, name);
    assert.deepEqual(a.sent[a.sent.length - 1], { text, kind }, name);
  }
});

test("FR-030: Show me cut off after the change came back: lesson-error-demo, Show me again and the check", async () => {
  const h = await open();
  h.app.act("show_me");
  h.adapter().emit("tool_result", SET_EASE);
  h.adapter().emit("error", { kind: "timeout", message: "" });
  h.adapter().emit("turn_end", { ok: false, kind: "show_me" });
  assert.equal(st(h), "lesson-error-demo");
  assert.ok(chat(h).includes(COPY.errors.demo_easing.title));
  assert.ok(actions(h).includes("Show me again"));
  assert.equal(actions(h).includes(COPY.buttons.try_again), false);
  h.app.act("show_me_again");
  assert.match(h.adapter().sent[h.adapter().sent.length - 1].text, /^Show me again/);
});

test("FR-030: Show me cut off with no result on B1: demo_unknown, no Show me, only the check (D12)", async () => {
  const h = await open();
  h.app.act("show_me");
  h.adapter().emit("text", { text: "Starting" });
  h.adapter().emit("error", { kind: "timeout", message: "" });
  h.adapter().emit("turn_end", { ok: false, kind: "show_me" });
  assert.equal(st(h), "lesson-error-demo-unknown");
  assert.equal(h.app.model().lesson.demo_unknown, true);
  assert.ok(chat(h).includes(COPY.errors.demo_unknown.title));
  const a = actions(h);
  assert.ok(a.includes(COPY.buttons.check));
  assert.equal(a.includes("Show me"), false);
  assert.equal(a.includes(COPY.buttons.try_again), false);
  h.app.act("check");
  h.adapter().emit("tool_result", CHECK());
  end(h, "check");
  assert.equal(h.app.model().lesson.demo_unknown, false);
  assert.equal(h.app.model().lesson.checks, 1);
});

test("FR-030 third case, A only: no demo call started, so Show me may be resent", async () => {
  const h = await open({ runtime: "a" });
  h.app.act("show_me");
  h.adapter().emit("error", { kind: "service_busy", message: "" });
  h.adapter().emit("turn_end", { ok: false, kind: "show_me" });
  assert.equal(h.app.model().lesson.demo_unknown, false);
  h.app.act("try_again");
  assert.equal(h.adapter().sent[h.adapter().sent.length - 1].text, "Show me how first.");
});

test("A: a demo tool_call with no result is demo_unknown, whatever the turn", async () => {
  const h = await open({ runtime: "a" });
  h.app.ask("just do it");
  h.adapter().emit("tool_call", { name: "set_ease" });
  h.adapter().emit("error", { kind: "service_busy", message: "" });
  h.adapter().emit("turn_end", { ok: false, kind: "ask" });
  assert.equal(h.app.model().lesson.demo_unknown, true);
  assert.equal(actions(h).includes("Show me"), false);
});

test("passing kinds on A: a notice, the list undimmed, Home untouched; refused has no Try again (FR-056)", async () => {
  for (const [kind, state] of [["rate_limited", "lesson-pass-rate"], ["service_busy", "lesson-pass-busy"], ["offline", "lesson-pass-offline"]]) {
    const h = await open({ runtime: "a" });
    h.app.act("check");
    h.adapter().emit("error", { kind, message: "" });
    h.adapter().emit("turn_end", { ok: false, kind: "check" });
    assert.equal(st(h), state, kind);
    assert.ok(actions(h).includes(COPY.buttons.try_again));
    h.app.act("tab", { tab: "home" });
    assert.equal(st(h), "home-lessonopen", "Home's actions are left alone");
  }
  const h = await open({ runtime: "a" });
  h.app.act("check");
  h.adapter().emit("error", { kind: "refused", message: "" });
  h.adapter().emit("turn_end", { ok: false, kind: "check" });
  assert.equal(st(h), "lesson-pass-refused");
  assert.equal(actions(h).includes(COPY.buttons.try_again), false);
  assert.ok(actions(h).includes(COPY.buttons.check));
});

test("a passing kind on the first turn: lesson-start-failed, no lesson opened; Try again starts again", async () => {
  const h = await ready({ runtime: "a" });
  h.app.act("start");
  const first = h.adapter();
  first.emit("error", { kind: "service_busy", message: "" });
  first.emit("turn_end", { ok: false, kind: "start" });
  assert.equal(st(h), "lesson-start-failed");
  assert.equal(h.app.model().lesson_open, false);
  assert.ok(plain(r(h).head).includes(COPY.lesson.didnt_start));
  assert.ok(chat(h).includes(COPY.errors.not_started));
  assert.equal(r(h).ask, "");
  h.app.act("try_again");
  assert.equal(h.adapters.length, 2);
  assert.equal(h.adapter().sent[0].text, "/ease-mentor");
});

test("lesson-exited: the lesson is over and the list is stale; Start lesson and Back to Home (FR-056)", async () => {
  const h = await open();
  h.adapter().emit("tool_result", CHECK());
  end(h, "check");
  h.app.act("hint");
  h.adapter().emit("error", { kind: "process_exited", message: "" });
  h.adapter().emit("exit", { code: 1 });
  assert.equal(st(h), "lesson-exited");
  assert.equal(h.app.model().lesson_open, false);
  assert.ok(list(h).includes(COPY.check.before_stopped));
  assert.ok(chat(h).includes(COPY.errors.process_exited.title));
  assert.ok(actions(h).includes(COPY.buttons.start));
  assert.ok(actions(h).includes(COPY.buttons.back_home));
  assert.equal(r(h).ask, "");
  assert.equal(h.saved.current.ended, true, "nothing left to continue");
});

test("a mentor process that exits between turns is lesson-exited too", async () => {
  const h = await open();
  h.adapter().emit("exit", { code: 0 });
  assert.equal(st(h), "lesson-exited");
});

test("announcesCalls: A true, B1 false, on the real adapters (plan P7)", () => {
  assert.equal(b1Adapter({ claude_path: "x", runtime_path: "/tmp" }).announcesCalls, false);
  assert.equal(apiAdapter({ runtime: "a" }).announcesCalls, true);
});

// ---------- T041: a lesson starts from any skill's request ----------

test("T041: Start lesson with a skill sends that skill's command and launches with its tool list", async () => {
  const h = await ready();
  h.app.act("start", { skill: "keyframes.types" });
  assert.deepEqual(h.adapter().started[0], { skill: "key-types-mentor" });
  assert.deepEqual(h.adapter().sent[0], { text: "/key-types-mentor", kind: "start" });
  assert.equal(h.app.model().lesson.skill, "keyframes.types");
  assert.equal(h.saved.current.skill, "key-types-mentor");
});

test("T041: no skill named means the path's first; Try again after a failed start restarts the same skill", async () => {
  const h = await ready();
  h.app.act("start");
  assert.equal(h.adapter().sent[0].text, "/ease-mentor");
  const k = await ready();
  k.app.act("start", { skill: "timing.offset" });
  k.adapter().emit("error", { kind: "rate_limited", message: "" });
  assert.equal(st(k), "lesson-start-failed");
  k.app.act("try_again");
  assert.deepEqual(k.adapter().started[0], { skill: "offset-mentor" });
  assert.equal(k.adapter().sent[0].text, "/offset-mentor");
});

test("T041: Show me again sends the other five's text; the tool that ran sets the skill", async () => {
  const h = await ready();
  h.app.act("start", { skill: "timing.offset" });
  h.adapter().emit("tool_result", { name: "offset_demo", ok: true, text: "", images: [], json: { layer: "Dot 2", properties: ["Position"], shift_frames: 4, undo: "Edit > Undo" } });
  end(h, "start");
  h.app.act("show_me_again");
  assert.equal(h.adapter().sent.at(-1).text, "Show me again: explain the change you already made, with a frame. Don't change anything.");
  const a = await ready();
  a.app.act("start");
  a.adapter().emit("tool_result", { name: "key_types_snapshot", ok: true, text: "", images: [], json: { targets: [] } });
  assert.equal(a.app.model().lesson.skill, "keyframes.types");
});

// ---------- review fixes: a failed turn with no error event, and the process when it's dropped ----------

test("a failed turn after a pass with no error event keeps the process: Ask still works in the same session", async () => {
  const h = await passedLesson();
  const a = h.adapter();
  h.app.ask("Why?");
  a.emit("turn_end", { ok: false, kind: "ask" });
  assert.equal(st(h), "lesson-passed");
  assert.ok(chat(h).includes(COPY.errors.after_pass_failed.title));
  assert.equal(chat(h).includes(COPY.errors.after_pass_stopped.title), false);
  assert.equal(a.stopped, 0, "the process isn't dropped");
  assert.ok(askEnabled(h));
  assert.equal(h.app.ask("Again?"), true);
  assert.equal(h.adapter(), a, "the same process answers");
  assert.equal(a.sent.at(-1).text, "Again?");
});

test("a process the panel drops is stopped, not orphaned: after a pass, and mid-lesson", async () => {
  const h = await passedLesson();
  const a = h.adapter();
  h.app.ask("Why?");
  a.emit("error", { kind: "process_exited", message: "x" });
  a.emit("turn_end", { ok: false, kind: "ask" });
  assert.equal(a.stopped, 1, "after a pass");
  const m = await open();
  const b = m.adapter();
  b.emit("error", { kind: "process_exited", message: "x" });
  assert.equal(st(m), "lesson-exited");
  assert.equal(b.stopped, 1, "mid-lesson");
});
