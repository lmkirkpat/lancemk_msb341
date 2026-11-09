// Spec 007 T024, T025, T026: SC-003's list for step 1, driving the panel into each state id and
// checking what shows, plus the Skills interim, the manifest, reduced motion and a keyboard pass.
"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { ready, makeApp, plain, play, CONNECTED, LESSON } = require("./app-harness.js");
const { renderApp } = require("../lib/screens.js");
const { STATE_IDS } = require("../lib/view-state.js");
const { COPY } = require("../lib/copy.js");

const seg = (id, f, t) => ({ id, from_time: f, to_time: t, state: "linear" });
const SNAP = (over) => ({ name: "snapshot_project", ok: true, text: "", images: [], json: Object.assign({ lesson: "new", focus: ["Title"], demo_target: "a", targets: ["a", "b"], findings: [{ layer: "Title", property: "Position", segments: [seg("a", 0.5, 1.5), seg("b", 1.5, 3)] }] }, over) });
const CHECK = (over) => ({ name: "diff_since_last", ok: true, text: "", images: [], json: Object.assign({ comp_matches: true, passed: false, summary: { learner_eased: 1, total_for_learner: 2, still_linear: 1 }, targets: [{ segment_id: "a", label: "Title › Position 0.5–1.5 s", result: "eased_by_learner" }, { segment_id: "b", label: "Title › Position 1.5–3 s", result: "still_linear" }] }, over) });
const SAVED = { version: 2, claude_session_id: "s1", bridge_started: CONNECTED.started, ended: false, started_at: "x", updated_at: "x", skill: "ease-mentor", lesson: { skill: "easing.basic", focus: ["Title"], snapshots: 1, checks: 1, replied: true, passed: false, labels: {}, check_list: { source: "check", summary: "1 of 2 yours eased", sections: [], outside: [], stale: null, stale_kind: null, checked_at: null } }, messages: [] };

async function lesson(fn, opts) {
  const h = await ready(opts);
  h.app.act("start");
  h.adapter().emit("tool_result", SNAP());
  h.adapter().emit("text", { text: "Hello." });
  h.adapter().emit("turn_end", { ok: true, kind: "start" });
  if (fn) fn(h, h.adapter());
  return h;
}
const end = (a, kind, ok) => a.emit("turn_end", { ok: ok !== false, kind: kind || "ask" });
const reRead = (h, a) => { h.app.ask("Title's good"); a.emit("tool_result", SNAP({ lesson: "continued" })); end(a, "ask"); };
const check = (h, a, json) => { h.app.act("check"); a.emit("tool_result", json || CHECK()); end(a, "check"); };
const timeout = (a, kind) => { a.emit("error", { kind: "timeout", message: "" }); end(a, kind, false); };
const SET_EASE = { name: "set_ease", ok: true, text: "", images: [], json: { eased: "Title › Position, 0.500 s → 1.500 s", undo: "Edit > Undo" } };
const RECORD = (saved) => ({ name: "record_lesson", ok: !!saved, text: saved ? "" : "failed", images: [], json: saved ? { saved: true } : undefined });

const on = async (fn, opts) => { const h = await ready(opts); fn(h); return h; };

// state id → how to get there, and a marker the screen must show.
const CASES = {
  "home-first": [() => ready(), COPY.home.welcome_first],
  "home-return": [() => ready({ memory: { status: "ok", record: LESSON } }), COPY.buttons.find_next],
  "home-loading": [async () => { const timers = []; const h = makeApp({ readRecord: () => new Promise(() => {}), setTimeout: (f) => timers.push(f) }); h.app.init(); timers[0](); return h; }, "aria-busy"],
  "home-unreachable": [() => on((h) => h.app.setConnection({ state: "not_connected", started: null })), COPY.home.unreachable.title],
  "home-busy": [() => on((h) => h.app.setConnection({ state: "busy", started: null })), COPY.home.busy.title],
  "home-unreadable": [() => ready({ memory: { status: "unreadable", record: null } }), COPY.home.unreadable.title],
  "home-unreadable-why": [() => on((h) => h.app.act("what_happened"), { memory: { status: "unreadable", record: null } }), COPY.home.unreadable_why.title],
  "home-lessonopen": [() => lesson((h) => h.app.act("go_home")), COPY.home.lesson_open.kicker],
  "home-cutoff": [() => ready({ saved: SAVED }), COPY.home.cutoff.kicker],
  "home-aeclosed": [() => ready({ saved: Object.assign({}, SAVED, { bridge_started: "other" }) }), COPY.home.aeclosed.title],
  "err-mentor": [() => ready({ onStart: (a) => a.emit("error", { kind: "start_failed", message: "" }) }).then((h) => { h.app.act("start"); return h; }), COPY.errors.start_failed.title],
  "err-key": [() => ready({ runtime: "a" }).then((h) => { h.app.act("start"); h.adapter().emit("error", { kind: "not_signed_in", message: "" }); return h; }), COPY.errors.not_signed_in.title],
  "err-credit": [() => ready({ runtime: "a" }).then((h) => { h.app.act("start"); h.adapter().emit("error", { kind: "out_of_credit", message: "" }); return h; }), COPY.errors.out_of_credit.title],
  "lesson-none": [() => on((h) => h.app.act("tab", { tab: "lesson" })), COPY.lesson.none_title],
  "lesson-starting": [() => ready().then((h) => { h.app.act("start"); return h; }), COPY.check.slot_starting],
  "lesson-open": [() => lesson(), COPY.check.proposed],
  "lesson-focus-replying": [() => lesson((h) => h.app.ask("Title's good")), COPY.check.source_updating],
  "lesson-focus-stale": [() => lesson((h, a) => { h.app.ask("x"); end(a, "ask"); }), COPY.check.source_stale],
  "lesson-focused": [() => lesson(reRead), "2 pairs on Title"],
  "lesson-demo": [() => lesson((h, a) => { reRead(h, a); h.app.act("show_me"); a.emit("tool_result", SET_EASE); end(a, "show_me"); }), COPY.lesson.changed_in_comp],
  "lesson-partial": [() => lesson(check), "1 of 2 yours eased"],
  "skill-easing-check": [() => lesson(check), "1 of 2 yours eased"],
  "lesson-outside": [() => lesson((h, a) => check(h, a, CHECK({ unexpected_changes: ["Glow › Blurriness was changed"] }))), COPY.check.outside],
  "lesson-stale": [() => lesson((h, a) => { check(h, a); h.app.act("check"); a.emit("tool_result", { name: "diff_since_last", ok: false, text: "AE_UNREACHABLE", images: [] }); end(a, "check"); }), COPY.paused.hint_needs_ae],
  "lesson-othercomp": [() => lesson((h, a) => { check(h, a); h.app.act("check"); a.emit("tool_result", CHECK({ comp_matches: false, lesson_comp: "Mentor Practice" })); end(a, "check"); }), "on Mentor Practice"],
  "lesson-continued": [() => ready({ saved: SAVED }).then((h) => { h.app.act("continue"); return h; }), COPY.lesson.resumed_divider],
  "lesson-error": [() => lesson((h, a) => { h.app.act("hint"); timeout(a, "hint"); }), COPY.errors.timeout.title],
  "lesson-error-demo": [() => lesson((h, a) => { h.app.act("show_me"); a.emit("tool_result", SET_EASE); timeout(a, "show_me"); }), COPY.errors.demo_easing.title],
  "lesson-error-demo-unknown": [() => lesson((h, a) => { h.app.act("show_me"); timeout(a, "show_me"); }), COPY.errors.demo_unknown.title],
  "lesson-resumed": [() => ready().then((h) => { h.app.act("start"); h.adapter().emit("tool_result", SNAP({ lesson: "resumed" })); end(h.adapter(), "start"); return h; }), COPY.lesson.picking_up],
  "lesson-resumed-check": [() => ready().then((h) => { h.app.act("start"); const a = h.adapter(); a.emit("tool_result", SNAP({ lesson: "resumed" })); end(a, "start"); check(h, a); return h; }), "1 of 2 yours eased"],
  "skill-easing-who": [() => lesson((h, a) => check(h, a, CHECK({ targets: [{ segment_id: "a", label: "Title › Position 0.5–1.5 s", result: "eased_by_demo", demo_credit: "unknown" }] }))), COPY.check.who_eased],
  "lesson-pass-rate": [() => passing("rate_limited"), COPY.errors.rate_limited.title],
  "lesson-pass-busy": [() => passing("service_busy"), COPY.errors.service_busy.title],
  "lesson-pass-offline": [() => passing("offline"), COPY.errors.offline.title],
  "lesson-pass-refused": [() => passing("refused"), COPY.errors.refused.title],
  "lesson-start-failed": [() => ready({ runtime: "a" }).then((h) => { h.app.act("start"); h.adapter().emit("error", { kind: "service_busy", message: "" }); return h; }), COPY.errors.not_started],
  "lesson-exited": [() => lesson((h, a) => { a.emit("error", { kind: "process_exited", message: "" }); a.emit("exit", { code: 1 }); }), COPY.errors.process_exited.title],
  "lesson-passed-asking": [() => lesson((h, a) => check(h, a, CHECK({ passed: true }))), COPY.lesson.one_more_question],
  "lesson-passed": [() => lesson((h, a) => { h.app.act("check"); a.emit("tool_result", CHECK({ passed: true })); a.emit("tool_result", RECORD(true)); end(a, "check"); }), COPY.lesson.passed],
  "lesson-passed-unsaved": [() => lesson((h, a) => { h.app.act("check"); a.emit("tool_result", CHECK({ passed: true })); a.emit("tool_result", RECORD(false)); end(a, "check"); }), COPY.lesson.unsaved.title],
};

function passing(kind) {
  return lesson((h, a) => { h.app.act("check"); a.emit("error", { kind, message: "" }); end(a, "check", false); }, { runtime: "a" });
}

function screenText(h) {
  const r = renderApp(h.app.model());
  if (!r.lesson) return r.nav + r.view;
  const c = r.lesson.chat;
  return [r.nav, r.lesson.head, r.lesson.banner, c.earlier || "", ...c.items, r.lesson.list, r.lesson.status, r.lesson.actions, r.lesson.ask].join("\n");
}

test("the step 1 list names only ids the README has", () => {
  for (const id of Object.keys(CASES)) if (id !== "skill-easing-check") assert.ok(STATE_IDS.includes(id), id);
});

for (const [id, [drive, marker]] of Object.entries(CASES)) {
  test(`SC-003: ${id} is reachable and shows what it should`, async () => {
    const h = await drive();
    const state = h.app.model().state;
    const expected = id === "skill-easing-check" ? "lesson-partial" : id;
    assert.equal(state, expected);
    assert.ok(plain(screenText(h)).includes(marker), `${id} should show: ${marker}`);
  });
}

test("recorded easing stream: an opening and a check drive the panel to a real state", async () => {
  const h = await ready();
  h.app.act("start");
  play(h, "stream-opening.jsonl");
  h.app.ask("Title's good");
  play(h, "eval/easing-07-partial-attempt.jsonl");
  assert.ok(STATE_IDS.includes(h.app.model().state));
});

test("T050: opening Skills costs nothing; a detail's New lesson waits while a lesson is open", async () => {
  const h = await on((x) => x.app.act("pick_skill"));
  assert.equal(h.app.model().tab, "skills");
  assert.equal(h.adapters.length, 0, "opening Skills costs nothing");
  assert.ok(plain(renderApp(h.app.model()).view).includes(COPY.skills.title));
  h.app.act("start");
  h.app.act("pick_skill");
  h.app.act("open_skill", { skill: "keyframes.types" });
  const v = plain(renderApp(h.app.model()).view);
  assert.ok(v.includes(COPY.paused.after_lesson));
  assert.equal(v.includes(`data-action="new_lesson"`), false);
});

test("T025: the manifest's minimum height is 480 (Open question 9)", () => {
  const xml = fs.readFileSync(path.join(__dirname, "..", "CSXS", "manifest.xml"), "utf8");
  assert.match(xml, /<MinSize>\s*<Height>480<\/Height>/);
});

test("FR-080: with reduced motion the spinner slows and skeletons stop", () => {
  const css = fs.readFileSync(path.join(__dirname, "..", "panel.css"), "utf8");
  const m = /prefers-reduced-motion[^{]*\{([^}]*\}[^}]*)\}/.exec(css);
  assert.ok(m);
  assert.match(m[1], /\.spin\s*\{\s*animation-duration/);
  assert.match(m[1], /\.skel\s*\{\s*animation:\s*none/);
});

test("FR-079: a keyboard pass: every state's controls are buttons or the tablist, in tab order, with visible focus rules", async () => {
  const css = fs.readFileSync(path.join(__dirname, "..", "panel.css"), "utf8");
  assert.match(css, /:focus-visible\s*\{\s*outline:\s*2px/);
  for (const [id, [drive]] of Object.entries(CASES)) {
    const h = await drive();
    const html = screenText(h);
    assert.equal((html.match(/<button/g) || []).length, (html.match(/<\/button>/g) || []).length, id);
    assert.doesNotMatch(html, /tabindex="[1-9]/, `${id}: no positive tabindex`);
    assert.doesNotMatch(html, /onclick|<a\s/, `${id}: nothing but real buttons act`);
  }
});

test("details folds are real details, so Earlier is a native toggle (FR-085)", async () => {
  const h = await lesson(check);
  h.adapter().emit("text", { text: "Reply." });
  h.app.ask("ok");
  h.adapter().emit("text", { text: "More." });
  h.adapter().emit("turn_end", { ok: true, kind: "ask" });
  assert.match(renderApp(h.app.model()).lesson.chat.earlier, /<details class="earlier"><summary>/);
});
