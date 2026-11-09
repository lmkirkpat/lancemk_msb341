"use strict";
// Spec 007 step 3 (T063 to T067): Practice due, Warm up, the tagged review and its endings.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { ready, plain, SIX_PATH, SKILLS_BUILT } = require("./app-harness.js");
const { renderApp } = require("../lib/screens.js");
const { homeView } = require("../lib/home.js");
const { practiceDue } = require("../lib/skills-view.js");
const { builtSkills } = require("../lib/skills.js");
const { COPY } = require("../lib/copy.js");

const NOW = new Date("2026-11-09T12:00:00.000Z");
const built = builtSkills(SIX_PATH, SKILLS_BUILT);
const ok = (record) => ({ status: "ok", record });
const LAST = "2026-10-26T12:00:00.000Z";
const lessons = [{ skill: "timing.offset", date: LAST, result: "passed" }];
const learned = (review_due, extra) => Object.assign({ status: "learned", last_practiced: LAST, review_due }, extra);
const TWO_DUE = { skills: { "easing.basic": learned("2026-10-13"), "timing.offset": learned("2026-11-09"), "transform.anchor": learned("2026-11-01") }, lessons };
const homeText = (h) => plain(renderApp(h.app.model()).view);
const onHome = (record, opts) => ready(Object.assign({ memory: ok(record), pathData: SIX_PATH }, opts));

// ---------- T063: Practice due on Home ----------

test("Practice due names the first due skill in path order and counts the rest (FR-051)", () => {
  const p = practiceDue({ memory: ok(TWO_DUE), built, now: NOW });
  assert.equal(p.skill, "timing.offset");
  assert.equal(p.rest, 1);
});

test("Practice due is never easing, whatever its date says (FR-051)", () => {
  const record = { skills: { "easing.basic": learned("2026-10-13") }, lessons };
  assert.equal(practiceDue({ memory: ok(record), built, now: NOW }), null);
});

test("Practice due compares the stored date with today and nothing more (PN-11)", () => {
  const at = (d) => practiceDue({ memory: ok({ skills: { "timing.offset": learned(d) }, lessons }), built, now: NOW });
  assert.ok(at("2026-11-09"), "today is due");
  assert.ok(at("2026-11-08"), "earlier is due");
  assert.equal(at("2026-11-10"), null, "tomorrow isn't");
  assert.equal(practiceDue({ memory: ok({ skills: { "timing.offset": { status: "learned", last_practiced: LAST } }, lessons }), built, now: NOW }), null, "no date, nothing due");
});

test("Practice due needs a learned skill (FR-051)", () => {
  const record = { skills: { "timing.offset": learned("2026-11-01", { status: "practicing" }) }, lessons };
  assert.equal(practiceDue({ memory: ok(record), built, now: NOW }), null);
});

test("an unreadable or missing record has nothing due", () => {
  assert.equal(practiceDue({ memory: { status: "unreadable", record: null }, built, now: NOW }), null);
  assert.equal(practiceDue({ memory: { status: "missing", record: null }, built, now: NOW }), null);
});

test("homeView without skills data still draws, with no card (older callers)", () => {
  assert.equal(homeView({ memory: ok(TWO_DUE), pathData: SIX_PATH }).practice, null);
});

test("Home's card: the skill, last practiced and the count, between Up next and memory", async () => {
  const h = await onHome(TWO_DUE);
  const text = homeText(h);
  assert.ok(text.includes(COPY.home.practice_due));
  assert.ok(text.includes("Break the lockstep with offset"));
  assert.ok(text.includes(`${COPY.home.last_practiced} Oct 26.`));
  assert.ok(text.includes(COPY.home.more_due(1)));
  assert.ok(text.indexOf(COPY.home.up_next) < text.indexOf(COPY.home.practice_due));
  assert.ok(text.indexOf(COPY.home.practice_due) < text.indexOf(COPY.home.memory_title));
  assert.doesNotMatch(text, /about \d+ min/, "no expected length");
});

test("Home's card with one due has no count line, and a record without last_practiced leaves that out", async () => {
  const h = await onHome({ skills: { "timing.offset": { status: "learned", review_due: "2026-11-01" } }, lessons });
  const text = homeText(h);
  assert.ok(text.includes(COPY.home.practice_due));
  assert.ok(!text.includes("is due in Skills"));
  assert.ok(!text.includes(COPY.home.last_practiced));
});

test("no card when nothing is due", async () => {
  const h = await onHome({ skills: { "timing.offset": learned("2026-12-01") }, lessons });
  assert.ok(!homeText(h).includes(COPY.home.practice_due));
});

// ---------- T064: Warm up on Home and skill-detail, ↻ on Skills ----------

const hasWarmUp = (html) => /data-action="warm_up"/.test(html);
const view = (h) => renderApp(h.app.model()).view;

test("Home's Warm up sends the first due skill's review, and shows the warm-up status (RQ-11)", async () => {
  const h = await onHome(TWO_DUE);
  assert.ok(hasWarmUp(view(h)));
  assert.match(view(h), /data-action="warm_up"[^>]*data-skill="timing\.offset"/);
  h.app.act("warm_up", { skill: "timing.offset" });
  assert.deepEqual(h.adapter().started[0], { skill: "offset-mentor" });
  assert.deepEqual(h.adapter().sent, [{ text: "/offset-mentor review", kind: "warm_up" }]);
  const m = h.app.model();
  assert.equal(m.state, "lesson-starting");
  assert.equal(m.turn.status, COPY.status.warm_up_ready);
});

test("Warm up can't be pressed twice", async () => {
  const h = await onHome(TWO_DUE);
  h.app.act("warm_up", { skill: "timing.offset" });
  h.app.act("warm_up", { skill: "timing.offset" });
  assert.equal(h.adapters.length, 1);
  assert.equal(h.adapter().sent.length, 1);
});

test("Warm up never starts easing, or a skill with no review", async () => {
  const h = await onHome(TWO_DUE);
  h.app.act("warm_up", { skill: "easing.basic" });
  assert.equal(h.adapters.length, 0);
  assert.equal(h.app.model().tab, "home");
});

test("with a lesson open, Home's Warm up reads Available after your lesson (FR-024)", async () => {
  const h = await onHome(TWO_DUE);
  h.app.act("find_next");
  h.app.act("go_home");
  const html = view(h);
  assert.equal(h.app.model().state, "home-lessonopen");
  assert.ok(!hasWarmUp(html));
  assert.ok(plain(html).includes(COPY.paused.after_lesson));
});

test("with After Effects out of reach, Home's Warm up is replaced by the reason", async () => {
  const h = await onHome(TWO_DUE, { connection: { state: "not_connected", started: null } });
  const html = view(h);
  assert.ok(plain(html).includes(COPY.home.practice_due));
  assert.ok(!hasWarmUp(html));
  assert.ok(plain(html).includes(COPY.paused.needs_ae));
});

const detail = async (record, skill) => { const h = await onHome(record); h.app.act("tab", { tab: "skills" }); h.app.act("open_skill", { skill }); return h; };

test("skill-detail has Warm up on a learned skill with a review, even when it isn't due (FR-049)", async () => {
  const due = await detail(TWO_DUE, "timing.offset");
  assert.equal(due.app.model().state, "skill-detail");
  assert.match(view(due), /class="primary" data-action="warm_up" data-skill="timing\.offset"/);
  assert.ok(plain(view(due)).includes(COPY.buttons.new_lesson));
  const notDue = await detail({ skills: { "timing.offset": learned("2026-12-01") }, lessons }, "timing.offset");
  assert.ok(hasWarmUp(view(notDue)));
});

test("skill-detail's Warm up sends that skill's review", async () => {
  const h = await detail(TWO_DUE, "transform.anchor");
  h.app.act("warm_up", { skill: "transform.anchor" });
  assert.deepEqual(h.adapter().sent, [{ text: "/anchor-mentor review", kind: "warm_up" }]);
});

test("easing's detail and a skill not yet learned have no Warm up (FR-049)", async () => {
  assert.ok(!hasWarmUp(view(await detail(TWO_DUE, "easing.basic"))));
  assert.ok(!hasWarmUp(view(await detail(TWO_DUE, "parenting.null"))));
});

test("with a lesson open, skill-detail's buttons read Available after your lesson", async () => {
  const h = await detail(TWO_DUE, "timing.offset");
  h.app.act("find_next");
  h.app.act("tab", { tab: "skills" });
  h.app.act("open_skill", { skill: "timing.offset" });
  assert.ok(!hasWarmUp(view(h)));
  assert.ok(plain(view(h)).includes(COPY.paused.after_lesson));
});

test("Skills shows ↻ Practice due on a due skill, never on easing (FR-048)", async () => {
  const h = await onHome(TWO_DUE);
  const rows = h.app.model().skills_view.rows;
  const row = (id) => rows.find((r) => r.id === id);
  assert.deepEqual([row("timing.offset").glyph, row("timing.offset").word], ["↻", COPY.skills.words.due]);
  assert.deepEqual([row("transform.anchor").glyph, row("transform.anchor").word], ["↻", COPY.skills.words.due]);
  assert.deepEqual([row("easing.basic").glyph, row("easing.basic").word], ["✓", COPY.skills.words.learned]);
});

test("a failed warm-up start retries with the warm-up's request and status", async () => {
  const h = await onHome(TWO_DUE);
  h.app.act("warm_up", { skill: "timing.offset" });
  h.adapter().emit("error", { kind: "service_busy" });
  assert.equal(h.app.model().state, "lesson-start-failed");
  h.app.act("try_again");
  assert.deepEqual(h.adapter().sent, [{ text: "/offset-mentor review", kind: "warm_up" }]);
  assert.equal(h.app.model().turn.status, COPY.status.warm_up_ready);
});

// ---------- T065: practice and practice-check ----------

const { tick } = require("./app-harness.js");
const T = (name, json) => ({ name, json, ok: true, text: "", images: [] });
const OF_SNAP = (o) => T("offset_snapshot", Object.assign({ lesson: "new", mode: "review", comp: { duration: 8 }, group: { kind: "layers", members: [{ target: "x", label: "Chip A", start: 2 }, { target: "y", label: "Chip B", start: 2 }] }, targets: ["x", "y"], focus: ["Chip A", "Chip B"], demo_target: null, no_demo_reason: "review" }, o));
const OF_CHECK = (passed) => T("offset_check", { comp_matches: true, passed, kind: "layers", members: [["Chip A", 2], ["Chip B", 2.2]].map(([label, start_now]) => ({ target: `t/${label}`, label, layer: label, start_before: 2, start_now, end_now: start_now + 1, moved_by: {}, split: null, credit: null, status: "graded" })), still_same: [], order_differs: false, out_of_comp: [], other_changes: [], gaps_frames: [] });
const SAVED = T("record_lesson", { saved: true });
const lessonParts = (h) => { const l = renderApp(h.app.model()).lesson; return { head: plain(l.head), banner: plain(l.banner), chat: plain([l.chat.earlier || "", ...l.chat.items].join("\n")), list: plain(l.list), actions: plain(l.actions), ask: l.ask }; };
const warmUpOn = async (record, ...events) => {
  const h = await onHome(record);
  h.app.act("warm_up", { skill: "timing.offset" });
  for (const e of events) h.adapter().emit("tool_result", e);
  h.adapter().emit("turn_end", { ok: true, kind: "warm_up" });
  return h;
};

test("no tag until the tool says it's a review (FR-014: never guessed)", async () => {
  const h = await onHome(TWO_DUE);
  h.app.act("warm_up", { skill: "timing.offset" });
  assert.ok(!lessonParts(h).head.includes(COPY.lesson.review_tag));
});

test("practice: tagged from mode, same rows as a lesson marked Proposed, no Show me (FR-052)", async () => {
  const h = await warmUpOn(TWO_DUE, OF_SNAP());
  assert.equal(h.app.model().state, "practice");
  const p = lessonParts(h);
  assert.ok(p.head.includes(COPY.lesson.review_tag));
  assert.ok(renderApp(h.app.model()).lesson.head.includes('class="tag practice"'));
  assert.ok(p.list.includes(COPY.check.proposed));
  assert.ok(p.actions.includes(COPY.buttons.check));
  assert.ok(!p.actions.includes(COPY.buttons.hint), "Hint waits for the first check");
  assert.ok(!p.actions.includes(COPY.buttons.show_me));
});

test("Warm up that the tool opens as a lesson isn't tagged: the header follows mode", async () => {
  const h = await warmUpOn(TWO_DUE, OF_SNAP({ mode: "lesson", no_demo_reason: null }));
  assert.equal(h.app.model().state, "skill-offset-layers-open");
  assert.ok(!lessonParts(h).head.includes(COPY.lesson.review_tag));
});

test("practice-check: the tag stays, Hint appears, Show me never does", async () => {
  const h = await warmUpOn(TWO_DUE, OF_SNAP());
  h.app.act("check");
  h.adapter().emit("tool_result", OF_CHECK(false));
  h.adapter().emit("turn_end", { ok: true, kind: "check" });
  assert.equal(h.app.model().state, "practice-check");
  const p = lessonParts(h);
  assert.ok(p.head.includes(COPY.lesson.review_tag));
  assert.ok(!p.head.includes(COPY.lesson.check_tag(1)), "the review tag takes the check count's place");
  assert.ok(p.actions.includes(COPY.buttons.hint));
  assert.ok(!p.actions.includes(COPY.buttons.show_me));
  assert.ok(!p.list.includes(COPY.check.proposed));
});

test("no Show me or Show me again in a review, whatever the tool says about a demo (FR-052)", async () => {
  const h = await warmUpOn(TWO_DUE, OF_SNAP({ demo_target: "x", demo_used: true }));
  assert.ok(!lessonParts(h).actions.includes("Show me"));
});

test("a review reached through Yes on B1 is tagged too", async () => {
  const h = await onHome(TWO_DUE);
  h.app.act("find_next");
  h.adapter().emit("tool_result", T("recommend_next", { recommendation: { skill: "timing.offset", kind: "review", focus_layers: [] } }));
  h.adapter().emit("turn_end", { ok: true, kind: "find_next" });
  h.app.act("yes");
  assert.equal(h.adapter().sent[0].text, "/offset-mentor review");
  h.adapter().emit("tool_result", OF_SNAP());
  h.adapter().emit("turn_end", { ok: true, kind: "yes" });
  assert.ok(lessonParts(h).head.includes(COPY.lesson.review_tag));
  assert.ok(!lessonParts(h).actions.includes(COPY.buttons.show_me));
});

// ---------- T066: the passes and the due lines ----------

const { daysUntilReview } = require("../lib/skills-view.js");
const offsetRow = built.find((s) => s.id === "timing.offset");
const easingRow = built.find((s) => s.id === "easing.basic");

test("daysUntilReview: from the stored date, only ahead of today, only with a review", () => {
  assert.equal(daysUntilReview({ review_due: "2026-11-10" }, offsetRow, NOW), 1);
  assert.equal(daysUntilReview({ review_due: "2026-11-12" }, offsetRow, NOW), 3);
  assert.equal(daysUntilReview({ review_due: "2026-11-09" }, offsetRow, NOW), null, "today isn't ahead");
  assert.equal(daysUntilReview({ review_due: "2026-11-01" }, offsetRow, NOW), null);
  assert.equal(daysUntilReview({ review_due: "2026-11-12" }, easingRow, NOW), null, "easing has no review");
  assert.equal(daysUntilReview({ review_due: "soon" }, offsetRow, NOW), null);
  assert.equal(daysUntilReview({}, offsetRow, NOW), null);
  assert.equal(daysUntilReview(undefined, offsetRow, NOW), null);
});

// A record that changes when the mentor saves, so the line reads what the save wrote.
function passThrough(mode, skill, after) {
  return async () => {
    let record = { skills: { [skill]: { status: mode === "review" ? "learned" : "practicing", last_practiced: LAST, review_due: "2026-11-01" }, "transform.anchor": learned("2026-11-01") }, lessons };
    const h = await ready({ pathData: SIX_PATH, readRecord: () => Promise.resolve({ status: "ok", record }) });
    h.app.act("start", { skill });
    return { h, save: async () => { record = after(record); h.adapter().emit("tool_result", SAVED); await tick(); h.adapter().emit("turn_end", { ok: true, kind: "check" }); await tick(); } };
  };
}
const withDue = (skill, due) => (r) => ({ skills: Object.assign({}, r.skills, { [skill]: learned(due) }), lessons: r.lessons.concat([{ skill, date: LAST, result: "passed" }]) });

async function passedLesson(skill, snap, check, due) {
  const { h, save } = await passThrough("lesson", skill, withDue(skill, due))();
  h.adapter().emit("tool_result", snap);
  h.adapter().emit("tool_result", check);
  await save();
  return h;
}

test("lesson-passed-pivot: a pass on a skill with a review says when it's due, after the save (FR-021)", async () => {
  const h = await passedLesson("timing.offset", OF_SNAP({ mode: "lesson", no_demo_reason: null }), OF_CHECK(true), "2026-11-10");
  assert.equal(h.app.model().state, "lesson-passed-pivot");
  const p = lessonParts(h);
  assert.ok(p.banner.includes(COPY.lesson.passed));
  assert.ok(p.banner.includes(COPY.lesson.saved));
  assert.ok(p.banner.includes("Warm-up due tomorrow."));
  assert.ok(p.head.includes(COPY.lesson.passed_tag));
  assert.ok(p.actions.includes(COPY.buttons.whats_next));
  assert.ok(p.actions.includes(COPY.buttons.see_skills));
  assert.ok(renderApp(h.app.model()).lesson.list.includes('aria-expanded="false"'), "the list folds, as at lesson-passed");
});

test("easing's pass has no due line, whatever its record says (FR-021)", async () => {
  const snap = T("snapshot_project", { lesson: "new", targets: [], focus: ["Title"], demo_target: null });
  const check = T("diff_since_last", { comp_matches: true, passed: true, targets: [], unexpected_changes: [], summary: {} });
  const h = await passedLesson("easing.basic", snap, check, "2026-11-10");
  assert.equal(h.app.model().state, "lesson-passed");
  assert.ok(!lessonParts(h).banner.includes("Warm-up"));
});

test("practice-passed: Review passed, saved, and the next warm-up from the record (FR-021)", async () => {
  const { h, save } = await passThrough("review", "timing.offset", withDue("timing.offset", "2026-11-12"))();
  h.adapter().emit("tool_result", OF_SNAP());
  h.adapter().emit("tool_result", OF_CHECK(true));
  await save();
  assert.equal(h.app.model().state, "practice-passed");
  const p = lessonParts(h);
  assert.ok(p.banner.includes(COPY.lesson.review_passed));
  assert.ok(!p.banner.includes(COPY.lesson.passed));
  assert.ok(p.banner.includes(COPY.lesson.saved));
  assert.ok(p.banner.includes("Next warm-up in 3 days."));
  assert.ok(p.head.includes(COPY.lesson.passed_tag));
  assert.ok(p.actions.includes(COPY.buttons.whats_next));
});

test("a stale due date is never shown as the next one: no line until the record has a future date", async () => {
  const { h, save } = await passThrough("review", "timing.offset", (r) => r)();
  h.adapter().emit("tool_result", OF_SNAP());
  h.adapter().emit("tool_result", OF_CHECK(true));
  await save();
  const p = lessonParts(h);
  assert.equal(h.app.model().state, "practice-passed");
  assert.ok(!p.banner.includes("warm-up"));
});

test("Ask stays after a saved review while the mentor's session lives (FR-046)", async () => {
  const { h, save } = await passThrough("review", "timing.offset", withDue("timing.offset", "2026-11-12"))();
  h.adapter().emit("tool_result", OF_SNAP());
  h.adapter().emit("tool_result", OF_CHECK(true));
  await save();
  assert.ok(lessonParts(h).ask.includes("<form"));
});

test("skills-after-review: after a saved pass with another still due; Home's card moves on (D14)", async () => {
  const { h, save } = await passThrough("review", "timing.offset", withDue("timing.offset", "2026-11-12"))();
  h.adapter().emit("tool_result", OF_SNAP());
  h.adapter().emit("tool_result", OF_CHECK(true));
  await save();
  h.app.act("see_skills");
  assert.equal(h.app.model().state, "skills-after-review");
  assert.ok(plain(view(h)).includes("1 due for practice"));
  h.app.act("tab", { tab: "home" });
  const text = homeText(h);
  assert.ok(text.includes("Set the pivot (anchor point)"), "the next due skill");
  assert.ok(!text.includes("is due in Skills"), "no count line");
});

test("a saved review with nothing else due is the plain Skills list", async () => {
  let record = { skills: { "timing.offset": learned("2026-11-01") }, lessons };
  const h = await ready({ pathData: SIX_PATH, readRecord: () => Promise.resolve({ status: "ok", record }) });
  h.app.act("warm_up", { skill: "timing.offset" });
  h.adapter().emit("tool_result", OF_SNAP());
  h.adapter().emit("tool_result", OF_CHECK(true));
  record = withDue("timing.offset", "2026-11-12")(record);
  h.adapter().emit("tool_result", SAVED);
  await tick();
  h.adapter().emit("turn_end", { ok: true, kind: "check" });
  h.app.act("see_skills");
  assert.equal(h.app.model().state, "skills-few");
});

// ---------- T067: practice-nothing-new ----------

const NOTHING = () => OF_SNAP({ targets: [], focus: null, group: null, no_demo_reason: "no_new_target" });
const nothingNew = async () => {
  const h = await onHome(TWO_DUE);
  h.app.act("warm_up", { skill: "timing.offset" });
  h.adapter().emit("tool_result", NOTHING());
  h.adapter().emit("text", { text: "There's nothing new to review on this comp." });
  h.adapter().emit("turn_end", { ok: true, kind: "warm_up" });
  return h;
};

test("no_new_target shows practice-nothing-new: tagged, the mentor's words, the still-due line, two ways out, no Ask (FR-052)", async () => {
  const h = await nothingNew();
  assert.equal(h.app.model().state, "practice-nothing-new");
  const p = lessonParts(h);
  assert.ok(p.head.includes(COPY.lesson.review_tag));
  assert.ok(p.head.includes(COPY.lesson.this_comp));
  assert.ok(p.chat.includes("nothing new to review"));
  assert.ok(p.chat.includes(COPY.lesson.nothing_new));
  assert.equal(p.list, "", "no checklist, not even the empty slot");
  assert.ok(p.actions.includes(COPY.buttons.back_home));
  assert.ok(p.actions.includes(COPY.buttons.pick_skill));
  assert.ok(!p.actions.includes(COPY.buttons.check));
  assert.equal(p.ask, "");
});

test("the same reason on other tools' words: only mode review plus the tool's code counts", async () => {
  const h = await onHome(TWO_DUE);
  h.app.act("warm_up", { skill: "timing.offset" });
  h.adapter().emit("tool_result", OF_SNAP({ mode: "lesson", no_demo_reason: "no_new_target" }));
  h.adapter().emit("turn_end", { ok: true, kind: "warm_up" });
  assert.notEqual(h.app.model().state, "practice-nothing-new");
  const r = await onHome(TWO_DUE);
  r.app.act("warm_up", { skill: "timing.offset" });
  r.adapter().emit("tool_result", OF_SNAP({ no_demo_reason: "awaiting_focus", targets: [] }));
  r.adapter().emit("turn_end", { ok: true, kind: "warm_up" });
  assert.notEqual(r.app.model().state, "practice-nothing-new", "a review still waiting on a focus isn't nothing new");
});

test("while the mentor is still saying so, the buttons wait", async () => {
  const h = await onHome(TWO_DUE);
  h.app.act("warm_up", { skill: "timing.offset" });
  h.adapter().emit("tool_result", NOTHING());
  assert.equal(h.app.model().state, "practice-nothing-new");
  assert.ok(lessonParts(h).actions.includes(COPY.paused.after_answer));
});

test("nothing is recorded, nothing can be continued, and it stays due (FR-052)", async () => {
  const h = await nothingNew();
  assert.equal(h.saved.current.ended, true, "the display log can't come back as a waiting lesson");
  assert.equal(h.app.model().lesson_open, false);
  h.app.act("back_home");
  assert.equal(h.app.model().state, "home-return");
  assert.equal(h.adapters[0].stopped, 1, "the mentor's process ends with it");
  const text = homeText(h);
  assert.ok(text.includes(COPY.home.practice_due));
  assert.ok(text.includes("Break the lockstep with offset"));
  assert.ok(hasWarmUp(view(h)), "another try is open");
});

test("Pick a skill leaves for Skills, with the due skill still ↻", async () => {
  const h = await nothingNew();
  h.app.act("see_skills");
  assert.equal(h.app.model().tab, "skills");
  assert.equal(h.app.model().skills_view.rows.find((r) => r.id === "timing.offset").glyph, "↻");
  assert.equal(h.app.model().lesson, null);
});

test("nothing-new ends the session for a new start: Warm up works again straight from Home", async () => {
  const h = await nothingNew();
  h.app.act("tab", { tab: "home" });
  h.app.act("warm_up", { skill: "timing.offset" });
  assert.equal(h.adapters.length, 2);
  assert.deepEqual(h.adapter().sent, [{ text: "/offset-mentor review", kind: "warm_up" }]);
});

test("a turn cut off after no_new_target keeps the screen and adds no lesson-result notice", async () => {
  const h = await onHome(TWO_DUE);
  h.app.act("warm_up", { skill: "timing.offset" });
  h.adapter().emit("tool_result", NOTHING());
  h.adapter().emit("turn_end", { ok: false, kind: "warm_up" });
  assert.equal(h.app.model().state, "practice-nothing-new");
  assert.ok(!h.app.model().messages.some((x) => x.role === "notice"));
  assert.ok(lessonParts(h).actions.includes(COPY.buttons.back_home));
});

test("no_new_target on every skill's snapshot field name opens the same state", async () => {
  const cases = [["keyframes.types", "key_types_snapshot"], ["easing.speed_graph", "speed_graph_snapshot"], ["transform.anchor", "anchor_snapshot"], ["parenting.null", "null_parent_snapshot"]];
  for (const [skill, tool] of cases) {
    const record = { skills: { [skill]: learned("2026-11-01") }, lessons };
    const h = await onHome(record);
    h.app.act("warm_up", { skill });
    h.adapter().emit("tool_result", T(tool, { lesson: "new", mode: "review", targets: [], focus: null, demo_target: null, no_demo_reason: "no_new_target" }));
    h.adapter().emit("turn_end", { ok: true, kind: "warm_up" });
    assert.equal(h.app.model().state, "practice-nothing-new", skill);
    assert.equal(lessonParts(h).list, "", skill);
  }
});
