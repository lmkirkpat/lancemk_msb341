// Spec 007 T013 (FR-006, SC-003's list): model → the README's state id, with the id list checked
// against the README's "Every state" table.
"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { stateOf, STATE_IDS, ALIASES, INTERIM_IDS } = require("../lib/view-state.js");
const { initialLesson } = require("../lib/lesson.js");
const { treatError } = require("../lib/errors.js");

const CONNECTED = { state: "connected", started: null };
const home = (o) => Object.assign({ config_ok: true, tab: "home", step: 2, record: { status: "ok" }, has_history: true, connection: CONNECTED }, o);
const lessonTab = (lesson, o) => Object.assign({ config_ok: true, tab: "lesson", step: 2, record: { status: "ok" }, connection: CONNECTED, lesson_open: true, lesson: Object.assign(initialLesson(), lesson) }, o);
const skills = (o) => Object.assign({ config_ok: true, tab: "skills", step: 2 }, o);
const err = (kind, opts) => treatError(kind, Object.assign({ runtime: "a" }, opts));
const list = (o) => Object.assign({ source: "check", stale: null, stale_kind: null, sections: [], outside: [], proposed: false, updating: false, focus_stale: false }, o);
const easing = { skill: "easing.basic" };
const checked = (o) => Object.assign({ skill: "easing.basic", snapshots: 1, checks: 1, replied: true, check_list: list() }, o);
const row = (family) => ({ sections: [{ title: "", rows: [{ family }] }] });

const MODELS = {
  "err-mentor": home({ error: err("start_failed") }),
  "err-key": home({ error: err("not_signed_in") }),
  "err-credit": home({ error: err("out_of_credit") }),
  "home-loading": home({ record: { status: "loading" } }),
  "home-first": home({ has_history: false, record: { status: "missing" } }),
  "home-return": home(),
  "home-lessonopen": home({ lesson_open: true, lesson: initialLesson() }),
  "home-cutoff": home({ saved: "waiting" }),
  "home-aeclosed": home({ saved: "aeclosed" }),
  "home-unreachable": home({ connection: { state: "not_connected", started: null } }),
  "home-busy": home({ connection: { state: "busy", started: null } }),
  "home-unreadable": home({ has_history: false, record: { status: "unreadable" } }),
  "home-unreadable-why": home({ has_history: false, record: { status: "unreadable" }, unreadable_why: true }),
  "skills-empty": skills({ skills_state: "empty" }),
  "skills-few": skills({ skills_state: "few" }),
  "skills-many": skills({ skills_state: "many" }),
  "skills-after-review": skills({ skills_state: "after_review" }),
  "skill-detail": skills({ skill_detail: "review" }),
  "skill-detail-noreview": skills({ skill_detail: "noreview" }),
  "skill-detail-new": skills({ skill_detail: "new" }),
  "lesson-none": { config_ok: true, tab: "lesson", step: 2, connection: CONNECTED, lesson_open: false },
  "lesson-starting": lessonTab(easing, { turn: { busy: true } }),
  "lesson-picking": lessonTab({ skill: "next" }, { picking: "suggesting" }),
  "lesson-picking-starting": lessonTab({ skill: "timing.offset" }, { picking: "starting", turn: { busy: true } }),
  "lesson-picked": lessonTab({ skill: "timing.offset", snapshots: 1, check_list: list({ source: "opening", proposed: true }) }, { from_picking: true }),
  "lesson-open": lessonTab({ ...easing, snapshots: 1, check_list: list({ source: "opening", proposed: true }) }),
  "lesson-focus-replying": lessonTab({ ...easing, snapshots: 1, replied: true, check_list: list({ source: "opening", updating: true }) }),
  "lesson-focus-stale": lessonTab({ ...easing, snapshots: 1, replied: true, check_list: list({ source: "opening", focus_stale: true }) }),
  "lesson-focused": lessonTab({ ...easing, snapshots: 2, replied: true, check_list: list({ source: "focus" }) }),
  "lesson-demo": lessonTab({ ...easing, snapshots: 2, replied: true, demo_made: true, check_list: list({ source: "focus" }) }),
  "lesson-partial": lessonTab(checked()),
  "lesson-outside": lessonTab(checked({ check_list: list({ outside: ["A"] }) })),
  "lesson-stale": lessonTab(checked({ check_list: list({ stale: "n", stale_kind: "ae" }) })),
  "lesson-othercomp": lessonTab(checked({ check_list: list({ stale: "n", stale_kind: "other_comp" }) })),
  "lesson-continued": lessonTab(checked({ check_list: list({ stale: "n", stale_kind: "continued" }) })),
  "lesson-error": lessonTab(checked(), { error: err("timeout") }),
  "lesson-error-demo": lessonTab(checked({ demo_made: true }), { error: err("timeout"), turn: { kind: "show_me" } }),
  "lesson-error-demo-other": lessonTab(checked({ skill: "keyframes.types", demo_made: true }), { error: err("timeout"), turn: { kind: "show_me" } }),
  "lesson-error-demo-unknown": lessonTab(checked({ demo_unknown: true }), { error: err("timeout"), turn: { kind: "show_me" } }),
  "lesson-resumed": lessonTab({ ...easing, snapshots: 1, picked_up: true, check_list: list({ source: "focus" }) }),
  "lesson-resumed-check": lessonTab(checked({ picked_up: true })),
  "lesson-pass-rate": lessonTab(checked(), { error: err("rate_limited") }),
  "lesson-pass-busy": lessonTab(checked(), { error: err("service_busy") }),
  "lesson-pass-offline": lessonTab(checked(), { error: err("offline") }),
  "lesson-pass-refused": lessonTab(checked(), { error: err("refused") }),
  "lesson-start-failed": lessonTab(easing, { lesson_open: false, error: err("service_busy", { firstTurn: true }) }),
  "lesson-exited": lessonTab(checked(), { lesson_open: false, error: err("process_exited") }),
  "lesson-passed-asking": lessonTab(checked({ passed: true })),
  "lesson-passed": lessonTab(checked({ passed: true, saved: true })),
  "lesson-passed-pivot": lessonTab(checked({ skill: "transform.anchor", passed: true, saved: true }), { review_date: true }),
  "lesson-passed-unsaved": lessonTab(checked({ passed: true, saved: false })),
  "practice": lessonTab({ skill: "timing.offset", snapshots: 1, mode: "review", check_list: list({ source: "opening", proposed: true }) }),
  "practice-check": lessonTab(checked({ skill: "timing.offset", mode: "review" })),
  "practice-passed": lessonTab(checked({ skill: "timing.offset", mode: "review", passed: true, saved: true })),
  "practice-nothing-new": lessonTab({ skill: "timing.offset", snapshots: 1, mode: "review", no_new_target: true }),
  "skill-keytypes-open": lessonTab({ skill: "keyframes.types", snapshots: 1 }),
  "skill-keytypes-check": lessonTab(checked({ skill: "keyframes.types" })),
  "skill-speedgraph-open": lessonTab({ skill: "easing.speed_graph", snapshots: 1, check_list: list({ source: "opening", proposed: true }) }),
  "skill-speedgraph-check": lessonTab(checked({ skill: "easing.speed_graph" })),
  "skill-offset-layers-open": lessonTab({ skill: "timing.offset", snapshots: 1, check_list: list({ source: "opening", proposed: true }) }),
  "skill-offset-layers-check": lessonTab(checked({ skill: "timing.offset" })),
  "skill-offset-props-check": lessonTab(checked({ skill: "timing.offset", offset_kind: "properties" })),
  "skill-pivot-open": lessonTab({ skill: "transform.anchor", snapshots: 1 }),
  "skill-pivot-check": lessonTab(checked({ skill: "transform.anchor" })),
  "skill-pivot-keyed": lessonTab(checked({ skill: "transform.anchor", pivot_keyed: true })),
  "skill-null-open": lessonTab({ skill: "parenting.null", snapshots: 1 }),
  "skill-null-place": lessonTab(checked({ skill: "parenting.null", null_stage: "place" })),
  "skill-null-parent": lessonTab(checked({ skill: "parenting.null", null_stage: "parent" })),
  "skill-null-move": lessonTab(checked({ skill: "parenting.null", null_stage: "move" })),
  "skill-easing-who": lessonTab(checked({ check_list: list(row("ask")) })),
  "skill-speedgraph-who": lessonTab(checked({ skill: "easing.speed_graph", check_list: list(row("ask")) })),
};

test("every model drives its state id", () => {
  for (const [id, m] of Object.entries(MODELS)) assert.equal(stateOf(m), id, id);
});

// The README's table, expanded: `-x` replaces the last part of the id before it, except after
// `skill-detail`, whose variants add to it.
function readmeIds() {
  const text = fs.readFileSync(path.join(__dirname, "..", "..", "product", "mockups", "ui-overhaul", "README.md"), "utf8");
  const table = text.slice(text.indexOf("## Every state"), text.indexOf("## States still missing"));
  const ids = [];
  for (const line of table.split("\n").filter((l) => l.startsWith("| `"))) {
    const first = line.split("|")[1];
    let prev = "";
    for (const m of first.matchAll(/`([^`]+)`/g)) {
      const token = m[1];
      const id = token.startsWith("-") ? (prev === "skill-detail" ? prev + token : prev.replace(/-[^-]+$/, "") + token) : token;
      ids.push(id);
      if (!token.startsWith("-")) prev = id;
    }
  }
  return [...new Set(ids)];
}

const HELD = /^(setup-|err-notsetup$|homeB-|compare$|diag-|home-return-stored$|all-|compare-|home-held-slot$)/;

test("the id list is the README's table, minus what's held, plus the one named addition", () => {
  const readme = readmeIds();
  assert.ok(readme.includes("skill-detail-noreview") && readme.includes("lesson-pass-busy") && readme.includes("skill-null-move"), "the expansion works");
  const inScope = readme.filter((id) => !HELD.test(id) && !(id in ALIASES));
  assert.deepEqual([...STATE_IDS].filter((id) => !INTERIM_IDS.includes(id)).sort(), inScope.slice().sort());
  assert.deepEqual([...INTERIM_IDS], []);
});

test("every id has a model here (SC-003's list), and no alias is its own state", () => {
  assert.deepEqual(Object.keys(MODELS).sort(), [...STATE_IDS].sort());
  assert.equal(ALIASES["skill-easing-check"], "lesson-partial");
});

test("home-first is never shown for an unreadable record (FR-011)", () => {
  assert.notEqual(stateOf(home({ has_history: false, record: { status: "unreadable" } })), "home-first");
});

test("a record is home-return; with no record it's home-first", () => {
  assert.equal(stateOf(home({})), "home-return");
  assert.equal(stateOf(home({ has_history: false })), "home-first");
});

test("blocking errors win Home; a passing error leaves Home alone", () => {
  assert.equal(stateOf(home({ error: err("start_failed"), lesson_open: true })), "err-mentor");
  assert.equal(stateOf(home({ error: err("service_busy") })), "home-return");
});

test("busy or absent AE hides neither Home's lesson nor its record check (FR-028)", () => {
  assert.equal(stateOf(home({ lesson_open: true, connection: { state: "busy" } })), "home-lessonopen");
});

test("a save with no pass isn't a passed state (D6)", () => {
  assert.equal(stateOf(lessonTab(checked({ saved: true }))), "lesson-partial");
});

test("a review's pass waits on the save like a lesson's", () => {
  assert.equal(stateOf(lessonTab(checked({ mode: "review", passed: true }))), "lesson-passed-asking");
});

test("a config that isn't set up has no id (FR-055's message stays)", () => {
  assert.equal(stateOf({ config_ok: false }), null);
});

test("step 1's one-line Skills tab has no README id", () => {
  assert.equal(stateOf(skills({ step: 1 })), null);
});
