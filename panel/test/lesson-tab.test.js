// Spec 007 T017, T018, T019: the Lesson tab from recorded streams (FR-014 to FR-017, FR-022, FR-046,
// FR-060, FR-061, FR-085, SC-016).
"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { ready, tick, play, plain } = require("./app-harness.js");
const { renderApp } = require("../lib/screens.js");
const { COPY } = require("../lib/copy.js");

const r = (h) => renderApp(h.app.model()).lesson;
const list = (h) => plain(r(h).list);
const actions = (h) => plain(r(h).actions);
const chat = (h) => { const c = r(h).chat; return plain((c.earlier || "") + c.items.join("")); };
const head = (h) => plain(r(h).head);

async function started(opts) {
  const h = await ready(opts);
  h.app.act("start");
  return h;
}

// A snapshot and a closing message, as the mentor's opening turn.
const SNAP = { type: "tool_result", name: "snapshot_project", ok: true, text: "", images: [] };
function openLesson(h, json) {
  const a = h.adapter();
  a.emit("tool_result", Object.assign({}, SNAP, { json }));
  a.emit("text", { text: "Let's start with Title." });
  a.emit("turn_end", { ok: true, cost_usd: 0, kind: "start" });
}
const finding = (layer, property, segs) => ({ layer, property, segments: segs.map(([id, from_time, to_time]) => ({ id, from_time, to_time, state: "linear" })) });
const TITLE = { lesson: "new", focus: null, demo_target: "a", targets: ["a", "b"], findings: [finding("Title", "Position", [["a", 0.5, 1.5], ["b", 1.5, 3]])] };

test("Start lesson opens the Lesson tab at lesson-starting: the slot, the status, buttons paused with why", async () => {
  const h = await started();
  assert.equal(h.app.model().tab, "lesson");
  assert.equal(h.app.model().state, "lesson-starting");
  assert.ok(list(h).includes(COPY.check.slot_starting));
  assert.ok(plain(r(h).status).includes(COPY.status.lesson_ready));
  assert.ok(actions(h).includes(COPY.paused.after_look));
  assert.match(r(h).ask, /disabled/);
  assert.equal(h.adapter().sent[0].text, "/ease-mentor");
  assert.equal(h.adapter().sent[0].kind, "start");
  assert.ok(head(h).includes("Easing"));
  assert.ok(head(h).includes(COPY.lesson.looking));
});

test("FR-014: the opening stays on Pick; targets alone don't start Try", async () => {
  const h = await started();
  openLesson(h, TITLE);
  assert.equal(h.app.model().state, "lesson-open");
  assert.match(r(h).head, /class="current"[^]*Pick/);
});

test("lesson-open: rows Proposed with the source line, and a +N more line for the rest", async () => {
  const h = await started();
  const a = h.adapter();
  a.emit("tool_result", Object.assign({}, SNAP, { json: { lesson: "new", focus: null, demo_target: "a", targets: ["a", "b", "c"],
    findings: [finding("Title", "Position", [["a", 0.5, 1.5], ["b", 1.5, 3]]), finding("Bar", "Scale", [["c", 0, 1]])] } }));
  a.emit("turn_end", { ok: true, kind: "start" });
  assert.equal(h.app.model().state, "lesson-open");
  const l = list(h);
  assert.ok(l.includes("3 linear pairs found · Proposed"));
  assert.ok(l.includes(COPY.check.source_full));
  assert.ok(l.includes("Position 0.5–1.5 s"));
  assert.equal(l.includes("Scale 0–1 s"), false, "only the first section shows at the opening");
  assert.ok(l.includes("+1 more on Bar"));
  assert.ok(actions(h).includes("Show me"), "the snapshot names a demo target");
});

test("the first reply drops Proposed (lesson-focus-replying); no re-read leaves lesson-focus-stale", async () => {
  const h = await started();
  openLesson(h, TITLE);
  h.app.ask("Title's good");
  assert.equal(h.app.model().state, "lesson-focus-replying");
  assert.ok(list(h).includes(COPY.check.not_checked));
  assert.equal(list(h).includes(COPY.check.proposed), false);
  assert.ok(list(h).includes(COPY.check.source_updating));
  assert.ok(actions(h).includes(COPY.paused.after_answer));
  h.adapter().emit("text", { text: "Sure." });
  h.adapter().emit("turn_end", { ok: true, kind: "ask" });
  assert.equal(h.app.model().state, "lesson-focus-stale");
  assert.ok(list(h).includes(COPY.check.source_stale));
  assert.ok(list(h).includes(COPY.check.source_stale_sub));
});

test("a re-read with a focus: lesson-focused, rows narrow, the header names the layer", async () => {
  const h = await started();
  openLesson(h, TITLE);
  h.app.ask("Title's good");
  h.adapter().emit("tool_result", Object.assign({}, SNAP, { json: Object.assign({}, TITLE, { focus: ["Title"], lesson: "continued" }) }));
  h.adapter().emit("turn_end", { ok: true, kind: "ask" });
  assert.equal(h.app.model().state, "lesson-focused");
  assert.ok(head(h).includes("Title"));
  assert.ok(list(h).includes("2 pairs on Title · not checked yet"));
});

test("FR-060: a pressed button shows a verb, every other action pauses, and it can't be sent twice", async () => {
  const h = await started();
  openLesson(h, TITLE);
  h.app.act("check");
  assert.equal(h.adapter().sent.length, 2);
  assert.equal(h.adapter().sent[1].text, "I'm done. Check my work.");
  const a = actions(h);
  assert.match(a, /pressed[^]*Checking…/);
  assert.match(r(h).ask, /disabled/);
  assert.ok(plain(r(h).status).includes("Checking your keyframes…"));
  h.app.act("check");
  h.app.ask("again");
  assert.equal(h.adapter().sent.length, 2, "paused while a turn runs");
});

test("the status line follows the tool that's running (FR-062)", async () => {
  const h = await started();
  h.adapter().emit("tool_call", { name: "snapshot_project" });
  assert.ok(plain(r(h).status).includes("Looking at your comp…"));
});

test("the chat renders the mentor's words safely, with a learner bubble for each press", async () => {
  const h = await started();
  openLesson(h, TITLE);
  h.adapter().emit("text", { text: "<script>x</script>" });
  assert.equal(r(h).chat.items.join("").includes("<script>"), false);
  assert.ok(chat(h).includes("<script>"), "escaped, then readable as words");
  h.adapter().emit("turn_end", { ok: true, kind: "start" });
  h.app.act("check");
  assert.ok(chat(h).includes("Done, check it"));
});

test("recorded opening, show-me and check: rows match the check's result (FR-016)", async () => {
  const h = await started();
  play(h, "stream-opening.jsonl");
  h.adapter().sent.length = 0;
  h.app.ask("Title's good");
  play(h, "eval/easing-07-partial-attempt.jsonl");
  const m = h.app.model();
  assert.ok(["lesson-partial", "lesson-outside"].includes(m.state), m.state);
  assert.ok(m.lesson.checks > 0);
  assert.ok(list(h).includes(m.lesson.check_list.summary));
});

test("Hint appears only after the first check (FR-020); Ask is on through the lesson (FR-046)", async () => {
  const h = await started();
  openLesson(h, TITLE);
  assert.equal(actions(h).includes(">Hint<"), false);
  h.adapter().emit("tool_result", { name: "diff_since_last", ok: true, text: "", images: [], json: { comp_matches: true, passed: false, summary: { learner_eased: 0, total_for_learner: 2, still_linear: 2 }, targets: [{ segment_id: "a", label: "Title › Position 0.5–1.5 s", result: "still_linear" }, { segment_id: "b", label: "Title › Position 1.5–3 s", result: "eased_by_learner" }] } });
  h.adapter().emit("text", { text: "Still one to go." });
  h.adapter().emit("turn_end", { ok: true, kind: "ask" });
  assert.ok(actions(h).includes(">Hint<"));
  assert.ok(r(h).ask.includes("<input"));
  assert.equal(/<input[^>]*disabled/.test(r(h).ask), false);
});

test("lesson-stale and lesson-othercomp: note at full contrast, Hint pauses with why, Check again re-checks", async () => {
  const h = await started();
  openLesson(h, TITLE);
  h.adapter().emit("tool_result", { name: "diff_since_last", ok: true, text: "", images: [], json: { comp_matches: true, passed: false, summary: { learner_eased: 0, total_for_learner: 1, still_linear: 1 }, targets: [{ segment_id: "a", label: "Title › Position 0.5–1.5 s", result: "still_linear" }] } });
  h.adapter().emit("turn_end", { ok: true, kind: "check" });
  h.app.act("check");
  h.adapter().emit("tool_result", { name: "diff_since_last", ok: false, text: "AE_BUSY", images: [] });
  h.adapter().emit("turn_end", { ok: true, kind: "check" });
  assert.equal(h.app.model().state, "lesson-stale");
  assert.match(list(h), /stale-note/);
  assert.match(actions(h), /Check again/);
  assert.ok(actions(h).includes(COPY.paused.hint_needs_ae));
  assert.ok(chat(h).includes(COPY.lesson.ae_lost.title));
  assert.equal(h.app.model().connection.state, "busy");
  h.app.act("check_again");
  assert.equal(h.adapter().sent[h.adapter().sent.length - 1].text, "I'm done. Check my work.");
  h.adapter().emit("tool_result", { name: "diff_since_last", ok: true, text: "", images: [], json: { comp_matches: false, lesson_comp: "Mentor Practice" } });
  h.adapter().emit("turn_end", { ok: true, kind: "check" });
  assert.equal(h.app.model().state, "lesson-othercomp");
  assert.ok(list(h).includes("From your last check, on Mentor Practice."));
});

// ---------- FR-085 and short docks ----------

test("older turns fold; the newest turn stays in view, and a pending reply keeps the previous one visible", async () => {
  const h = await started();
  openLesson(h, TITLE);
  assert.equal(r(h).chat.earlier, undefined);
  h.app.ask("Title's good");
  assert.equal(r(h).chat.earlier, undefined, "the reply is pending");
  h.adapter().emit("text", { text: "Ok." });
  h.adapter().emit("turn_end", { ok: true, kind: "ask" });
  assert.match(r(h).chat.earlier, /Earlier in this lesson \(1\)/);
});

test("rows: Next line, changed bar, done fold at short docks", async () => {
  const h = await started();
  openLesson(h, TITLE);
  const before = { name: "diff_since_last", ok: true, text: "", images: [], json: { comp_matches: true, passed: false, summary: { learner_eased: 0, total_for_learner: 2, still_linear: 2 }, targets: [{ segment_id: "a", label: "Title › Position 0.5–1.5 s", result: "still_linear" }, { segment_id: "b", label: "Title › Position 1.5–3 s", result: "still_linear" }] } };
  h.adapter().emit("tool_result", before);
  h.adapter().emit("turn_end", { ok: true, kind: "check" });
  const after = JSON.parse(JSON.stringify(before));
  after.json.targets[0].result = "eased_by_learner";
  after.json.summary = { learner_eased: 1, total_for_learner: 2, still_linear: 1 };
  h.adapter().emit("tool_result", after);
  h.adapter().emit("turn_end", { ok: true, kind: "check" });
  const l = list(h);
  assert.ok(l.includes("Next: Position 1.5–3 s"));
  assert.ok(l.includes("1 more since your last check"));
  assert.match(r(h).list, /class="done fresh/);
  h.adapter().emit("tool_result", (() => { const x = JSON.parse(JSON.stringify(after)); x.json.targets[1].result = "eased_by_learner"; x.json.summary = { learner_eased: 2, total_for_learner: 2, still_linear: 0 }; return x; })());
  h.adapter().emit("turn_end", { ok: true, kind: "check" });
  assert.ok(list(h).includes("2 done · show"));
  h.app.act("fold_done");
  assert.ok(list(h).includes("2 done · hide"));
  assert.match(r(h).list, /class="check unfold/);
});

test("SC-016: the arrow toggles one area at short docks, a check leaves the chat showing; tall docks fold the list", async () => {
  const h = await started();
  openLesson(h, TITLE);
  h.app.act("toggle_list", { short: true });
  assert.equal(r(h).list_open, true);
  h.app.act("check");
  assert.equal(r(h).list_open, false, "a check leaves the chat showing");
  h.adapter().emit("turn_end", { ok: true, kind: "check" });
  h.app.act("toggle_list", { short: false });
  assert.match(r(h).list, /aria-expanded="false"/);
  assert.match(r(h).list, /check-body" hidden/);
  assert.match(r(h).list, /ch-tall/);
  assert.match(r(h).list, /ch-short-open/);
});

// ---------- the learner's fold holds (live finding, T028) ----------

const isFolded = (h) => /aria-expanded="false"/.test(r(h).list);
const STALE_CHECK = { name: "diff_since_last", ok: false, text: "AE_BUSY", images: [] };
const CHECKED = { name: "diff_since_last", ok: true, text: "", images: [], json: { comp_matches: true, passed: false, summary: { learner_eased: 0, total_for_learner: 1, still_linear: 1 }, targets: [{ segment_id: "a", label: "Title › Position 0.5–1.5 s", result: "still_linear" }] } };

function cutOff(h) {
  h.app.ask("and now?");
  h.adapter().emit("turn_end", { ok: false, kind: "ask" });
  assert.equal(h.app.model().state, "lesson-error");
}

test("a checklist the learner folded stays folded across asks, turn ends and checks", async () => {
  const h = await started();
  openLesson(h, TITLE);
  h.app.act("toggle_list", { short: false });
  assert.equal(isFolded(h), true);
  h.app.ask("Title's good");
  assert.equal(isFolded(h), true, "while the turn runs");
  h.adapter().emit("turn_end", { ok: true, kind: "ask" });
  assert.equal(isFolded(h), true, "after the turn");
  h.app.act("check");
  h.adapter().emit("tool_result", CHECKED);
  assert.equal(isFolded(h), true, "when the check's rows arrive");
  h.adapter().emit("turn_end", { ok: true, kind: "check" });
  assert.equal(isFolded(h), true, "after the check");
  h.app.act("toggle_list", { short: false });
  assert.equal(isFolded(h), false, "until they open it again");
  h.app.ask("ok");
  h.adapter().emit("turn_end", { ok: true, kind: "ask" });
  assert.equal(isFolded(h), false, "and open holds too");
});

test("untouched, the list keeps each state's default: open while working, folded at an error", async () => {
  const h = await started();
  openLesson(h, TITLE);
  assert.equal(isFolded(h), false);
  cutOff(h);
  assert.equal(isFolded(h), true);
});

test("the first press on a list folded by default opens it, and that choice holds", async () => {
  const h = await started();
  openLesson(h, TITLE);
  cutOff(h);
  h.app.act("toggle_list", { short: false });
  assert.equal(isFolded(h), false, "the press changes what's showing");
  h.app.act("try_again");
  h.adapter().emit("turn_end", { ok: false, kind: "ask" });
  assert.equal(h.app.model().state, "lesson-error");
  assert.equal(isFolded(h), false, "open holds into a state that folds by default");
});

test("a new lesson goes back to the defaults", async () => {
  const h = await started();
  openLesson(h, TITLE);
  h.app.act("toggle_list", { short: false });
  assert.equal(isFolded(h), true);
  h.app.act("end_lesson");
  h.app.act("start");
  openLesson(h, TITLE);
  assert.equal(isFolded(h), false);
});

test("FR-017: a list the learner folded still shows the stale note, and only the note", async () => {
  const h = await started();
  openLesson(h, TITLE);
  h.adapter().emit("tool_result", CHECKED);
  h.adapter().emit("turn_end", { ok: true, kind: "check" });
  h.app.act("toggle_list", { short: false });
  h.app.act("check");
  h.adapter().emit("tool_result", STALE_CHECK);
  h.adapter().emit("turn_end", { ok: true, kind: "check" });
  assert.equal(h.app.model().state, "lesson-stale");
  assert.equal(isFolded(h), true);
  assert.match(r(h).list, /stale-note/);
  assert.equal(/check-body" hidden/.test(r(h).list), false, "the note can be seen");
  assert.equal(r(h).list.includes("<ul>"), false, "the rows stay folded");
});

test("a press on a tall dock folds a list that was opened at a short dock", async () => {
  const h = await started();
  openLesson(h, TITLE);
  h.app.act("toggle_list", { short: true });
  assert.equal(isFolded(h), false);
  h.app.act("toggle_list", { short: false });
  assert.equal(isFolded(h), true);
});

test("frames: small at short docks and full on press are real buttons; two frames get Flip", async () => {
  const h = await started();
  openLesson(h, TITLE);
  const a = h.adapter();
  a.emit("tool_result", { name: "preview_frame", ok: true, text: "", images: [{ data: "AAAA", mimeType: "image/png" }], json: {} });
  a.emit("tool_result", { name: "preview_frame", ok: true, text: "", images: [{ data: "BBBB", mimeType: "image/png" }], json: {} });
  a.emit("text", { text: "See." });
  a.emit("turn_end", { ok: true, kind: "show_me" });
  const c = r(h).chat.items.join("");
  assert.match(c, /data-dom="frame"/);
  assert.match(c, /data-dom="flip"/);
  assert.match(c, /data-side/);
});

test("the back control says where it goes (FR-004) and the lesson stays open", async () => {
  const h = await started();
  openLesson(h, TITLE);
  assert.match(head(h), /aria-label="Back to Home. Your lesson stays open."/);
  h.app.act("go_home");
  assert.equal(h.app.model().tab, "home");
  assert.equal(h.app.model().lesson_open, true);
  assert.equal(h.adapter().stopped, 0);
  h.app.act("tab", { tab: "lesson" });
  assert.equal(h.app.model().state, "lesson-open");
  await tick();
});
