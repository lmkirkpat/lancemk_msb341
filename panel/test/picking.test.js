"use strict";
// T050 to T052 on screen: Home's return card, Find my next lesson, Yes, and the Skills tab (FR-009, FR-013, FR-048, FR-049, FR-082, FR-094).
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { ready, tick, plain, CONNECTED, LESSON, SIX_PATH } = require("./app-harness.js");
const { renderApp } = require("../lib/screens.js");
const { COPY } = require("../lib/copy.js");

const r = (h) => renderApp(h.app.model());
const view = (h) => plain(r(h).view);
const ls = (h) => r(h).lesson;
const st = (h) => h.app.model().state;
const REC = (over) => ({ name: "recommend_next", ok: true, text: "", images: [], json: Object.assign({ looked_at_comp: true, recommendation: { skill: "transform.anchor", skill_name: "Set the pivot", kind: "lesson", reason: "next_in_path", focus_layers: ["Door"] } }, over) });
const MEMORY = { status: "ok", record: LESSON };

async function picking(opts) {
  const h = await ready(Object.assign({ memory: MEMORY, pathData: SIX_PATH }, opts));
  h.app.act("find_next");
  return h;
}
function suggest(h, rec) {
  h.adapter().emit("tool_result", rec || REC());
  h.adapter().emit("text", { text: "Set the pivot next. Want to?" });
  h.adapter().emit("turn_end", { ok: true, kind: "find_next" });
}

test("home-return: names no skill, Find my next lesson, no mentor turn; first run keeps Start lesson", async () => {
  const h = await ready({ memory: MEMORY, pathData: SIX_PATH });
  assert.equal(st(h), "home-return");
  assert.ok(view(h).includes(COPY.home.your_next));
  assert.ok(view(h).includes(COPY.buttons.find_next));
  assert.equal(h.adapters.length, 0);
  const first = await ready({ memory: { status: "missing", record: null }, pathData: SIX_PATH });
  assert.equal(st(first), "home-first");
  assert.ok(view(first).includes(COPY.buttons.start));
});

test("Find my next lesson: no strip or list, status while it looks, and it writes no display log", async () => {
  const h = await picking();
  assert.deepEqual(h.adapter().started[0], { skill: "next-mentor" });
  assert.deepEqual(h.adapter().sent[0], { text: "/next-mentor", kind: "find_next" });
  assert.equal(st(h), "lesson-picking");
  assert.equal(h.app.model().turn.status, COPY.status.looking_comp);
  assert.equal(ls(h).list, "");
  assert.equal(ls(h).head.includes("strip"), false);
  assert.ok(plain(ls(h).head).includes(COPY.lesson.picking_title));
  assert.ok(ls(h).actions.includes(COPY.paused.after_answer));
  suggest(h);
  assert.equal(h.saved.current, null, "picking isn't a lesson: it can't come back as home-cutoff");
});

test("Yes shows only with a recommendation, no requested, a skill in the table", async () => {
  const yes = (rec) => picking().then((h) => { suggest(h, rec); return plain(ls(h).actions).includes(COPY.buttons.yes); });
  assert.equal(await yes(REC()), true);
  assert.equal(await yes(REC({ recommendation: null, reason: "nothing_left" })), false);
  assert.equal(await yes(REC({ requested: { skill: "x", built: false } })), false);
  assert.equal(await yes(REC({ recommendation: { skill: "shape.trim_paths", kind: "lesson" } })), false);
});

test("Pick a skill ends the picking process; nothing recorded or saved", async () => {
  const h = await picking();
  suggest(h);
  const a = h.adapter();
  h.app.act("leave_picking");
  assert.equal(a.stopped, 1);
  assert.equal(h.app.model().tab, "skills");
  assert.equal(h.app.model().lesson_open, false);
  assert.equal(h.saved.current, null);
});

test("Ask during a suggestion; a later suggestion that names a request hides Yes", async () => {
  const h = await picking();
  suggest(h);
  assert.equal(/<input[^>]*disabled/.test(ls(h).ask), false);
  h.app.ask("Could I do speed graph instead?");
  assert.equal(h.adapter().sent.at(-1).kind, "ask");
  suggest(h, REC({ requested: { skill: "easing.speed_graph", built: true, learned: false } }));
  assert.equal(plain(ls(h).actions).includes(COPY.buttons.yes), false);
});

test("Yes on B1: stops next-mentor, starts the recommended lesson with its own tools, late events ignored", async () => {
  const h = await picking();
  suggest(h);
  const old = h.adapter();
  h.app.act("yes");
  assert.equal(old.stopped, 1);
  assert.notEqual(h.adapter(), old);
  assert.deepEqual(h.adapter().started[0], { skill: "anchor-mentor" });
  assert.deepEqual(h.adapter().sent[0], { text: "/anchor-mentor", kind: "yes" });
  const m = h.app.model();
  assert.equal(m.state, "lesson-picking-starting");
  assert.equal(m.lesson.skill, "transform.anchor");
  assert.ok(plain(ls(h).chat.items.join("")).includes(COPY.buttons.yes), "Yes in the chat");
  assert.ok(ls(h).actions.includes(COPY.buttons.pressed.start));
  assert.equal(ls(h).ask, "");
  assert.ok(ls(h).head.includes("strip"));
  assert.equal(h.saved.current.skill, "anchor-mentor");
  old.emit("exit", { code: 0 });
  old.emit("error", { kind: "process_exited", message: "x" });
  assert.equal(h.app.model().lesson_open, true);
  assert.equal(h.app.model().error, null);
});

test("Yes reaches lesson-picked with the strip on Pick and the suggestion still in the chat; a reply moves on", async () => {
  const h = await picking();
  suggest(h);
  h.app.act("yes");
  h.adapter().emit("tool_result", { name: "anchor_snapshot", ok: true, text: "", images: [], json: { lesson: "new", focus: null, targets: [], demo_target: null } });
  h.adapter().emit("text", { text: "Which layer?" });
  h.adapter().emit("turn_end", { ok: true, kind: "yes" });
  assert.equal(st(h), "lesson-picked");
  assert.ok(plain(ls(h).chat.items.join("")).includes("Set the pivot next"));
  assert.ok(plain(ls(h).head).includes("Pick"));
  h.app.ask("Door");
  assert.notEqual(st(h), "lesson-picked");
});

test("Yes: review on the follow-on; a failed start shows lesson-start-failed and Try again repeats it", async () => {
  const h = await picking();
  suggest(h, REC({ recommendation: { skill: "timing.offset", kind: "review", focus_layers: null } }));
  h.app.act("yes");
  assert.equal(h.adapter().sent[0].text, "/offset-mentor review");
  h.adapter().emit("error", { kind: "rate_limited", message: "" });
  assert.equal(st(h), "lesson-start-failed");
  h.app.act("try_again");
  assert.equal(h.adapter().sent[0].text, "/offset-mentor review");
});

test("Yes on A sends Yes, let's go. in the same conversation", async () => {
  const h = await picking({ runtime: "a" });
  suggest(h);
  const a = h.adapter();
  h.app.act("yes");
  assert.equal(h.adapter(), a);
  assert.deepEqual(a.sent.at(-1), { text: "Yes, let's go.", kind: "yes" });
  a.emit("tool_result", { name: "anchor_snapshot", ok: true, text: "", images: [], json: { targets: [], focus: null } });
  assert.equal(h.app.model().lesson.skill, "transform.anchor");
});

test("a timeout while picking on B1 stops the process and resumes it before Try again", async () => {
  const h = await picking();
  const first = h.adapter();
  first.emit("turn_end", { ok: true, kind: "find_next" });
  h.app.ask("Hello?");
  first.emit("error", { kind: "timeout", message: "x" });
  first.emit("turn_end", { ok: false, kind: "ask" });
  h.app.act("try_again");
  assert.equal(first.stopped, 1);
  assert.equal(h.adapter().started[0].skill, "next-mentor");
});

// ---------- the Skills tab ----------

test("skills-empty on screen: every path skill, pressable or Coming later, no interim line", async () => {
  const h = await ready({ pathData: SIX_PATH });
  h.app.act("tab", { tab: "skills" });
  assert.equal(st(h), "skills-empty");
  const html = r(h).view;
  assert.ok(html.includes("0 of 6 learned"));
  assert.equal(html.includes(COPY.skills.interim_line || "@@none"), false);
  assert.ok(plain(html).includes("Coming later"));
  assert.match(html, /data-action="open_skill" data-skill="keyframes\.types"/);
  assert.equal(/data-action="open_skill" data-skill="motion\.sources"/.test(html), false, "not built, not pressable");
});

test("skill-detail-new: Builds on, New lesson sends the lesson request; back returns", async () => {
  const h = await ready({ memory: MEMORY, pathData: SIX_PATH });
  h.app.act("tab", { tab: "skills" });
  h.app.act("open_skill", { skill: "parenting.null" });
  assert.equal(st(h), "skill-detail-new");
  assert.ok(view(h).includes("Set the pivot (anchor point)"));
  assert.ok(view(h).includes(COPY.buttons.new_lesson));
  h.app.act("back_skills");
  assert.equal(h.app.model().skill_detail, null);
  h.app.act("open_skill", { skill: "keyframes.types" });
  h.app.act("new_lesson", { skill: "keyframes.types" });
  assert.deepEqual(h.adapter().sent[0], { text: "/key-types-mentor lesson", kind: "new_lesson" });
  assert.equal(h.app.model().tab, "lesson");
});

test("New lesson says why it's off while a lesson runs, and Home's Start can't fire (FR-061)", async () => {
  const h = await ready({ memory: MEMORY, pathData: SIX_PATH });
  h.app.act("start", { skill: "easing.basic" });
  h.app.act("tab", { tab: "skills" });
  h.app.act("open_skill", { skill: "keyframes.types" });
  assert.ok(view(h).includes(COPY.paused.after_lesson));
  h.app.act("new_lesson", { skill: "keyframes.types" });
  assert.equal(h.adapters.length, 1, "no second process");
});

test("no data file: only the path's first skill is built, logged once (plan P2)", async () => {
  const logged = [];
  const h = await ready({ pathData: SIX_PATH, skillsBuilt: null, logSink: logged });
  h.app.act("tab", { tab: "skills" });
  assert.ok(view(h).includes("0 of 1 learned"));
  assert.equal(logged.filter((e) => e.kind === "skills_built_unreadable").length, 1);
});
