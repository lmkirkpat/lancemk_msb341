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
