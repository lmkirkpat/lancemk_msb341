// Spec 004 tasks-wave-b T173 (second pass; FR-043, research R26, data-model › Loose-ends pass ›
// Session lesson): an open lesson that was never checked and has no demo starts new when it's
// resumed and its baseline no longer matches the comp on the layers its targets and focus name, or
// when it's continued from an earlier local day. Otherwise it keeps its baseline, skill_options and
// skill_data, and start() says whether choices came back (stored_choices).
//
// Saved snapshots with a stub analyzer whose target_refs name real layers of the capture, as
// session-skill-data.test.mjs does. Edited captures are copies made here; no fixture file changes.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const session = await import("../lib/session.mjs");

const SESSION = path.join(home, "session.json");
const SKILL = "timing.offset";
const load = (rel) => JSON.parse(fs.readFileSync(path.join(FIXTURES, rel), "utf8"));
const P2 = load("layer-info/practice2b.json"); // comp 179, with layer_info
const OTHER = load("practice-before.json"); // comp 97, before layer_info
const clone = (s) => structuredClone(s);

// The stub: targets and focus name Dot 1 and Dot 2, as offset's analyzer would for the Dots.
let REFS = [{ layer: "Dot 1", property: "Position" }, { layer: "Dot 2", property: "Position" }];
let FOCUS = ["Dot 1", "Dot 2"];
function stub(snapshot, opts = {}) {
  const targets = REFS.map((r, i) => `t${i + 1}`);
  return { targets, target_refs: REFS.map((r) => ({ ...r })), demo_target: targets[0] ?? null, no_demo_reason: null, focus: FOCUS ? [...FOCUS] : null, seen_options: opts.skill_options };
}
const startSkill = (snap, opts = {}) => session.start(snap, { skill: SKILL, analyze: stub, ...opts });
const OPTIONS = { order: ["Dot 3", "Dot 2", "Dot 1"], gap_frames: 6 };
const DATA = { measured: [6, 6] };

// Opens the lesson on Mentor Practice 2 with choices and skill_data, then makes another comp current.
function openThenLeave() {
  const first = startSkill(P2, { skill_options: OPTIONS });
  assert.equal(first.lesson, "new");
  session.setSkillData(SKILL, 179, DATA);
  startSkill(OTHER);
  return first.session;
}

const layerOf = (snap, name) => snap.layers.find((l) => l.name === name);
const infoOf = (snap, name) => snap.layer_info.find((l) => l.name === name);
const dotKeys = (snap) => layerOf(snap, "Dot 1").properties[0].keys;
function edited(change) {
  const s = clone(P2);
  change(s);
  return s;
}

beforeEach(() => {
  fs.rmSync(SESSION, { force: true });
  REFS = [{ layer: "Dot 1", property: "Position" }, { layer: "Dot 2", property: "Position" }];
  FOCUS = ["Dot 1", "Dot 2"];
});

// ---- (a) T037's case: resumed, the comp matching

test("(a) resumed on a matching comp: baseline, skill_options and skill_data kept, stored_choices true", () => {
  const opened = openThenLeave();
  const r = startSkill(clone(P2));
  assert.equal(r.lesson, "resumed");
  assert.equal(r.stored_choices, true);
  assert.equal(r.session.lesson_id, opened.lesson_id);
  assert.deepEqual(r.session.skill_options, OPTIONS);
  assert.deepEqual(r.session.skill_data, DATA);
  assert.deepEqual(r.analysis.seen_options, OPTIONS, "the analyzer gets the stored choices");
  assert.ok(!("stored_choices" in JSON.parse(fs.readFileSync(SESSION, "utf8")).lessons[`${SKILL}|179`]), "not written to session.json");
});

test("(a) resumed on a matching comp with this call sending skill_options: resumed, replaced, stored_choices false", () => {
  openThenLeave();
  const next = { order: ["Dot 1", "Dot 2", "Dot 3"], gap_frames: 4 };
  const r = startSkill(clone(P2), { skill_options: next });
  assert.equal(r.lesson, "resumed");
  assert.equal(r.stored_choices, false);
  assert.deepEqual(r.session.skill_options, next);
  assert.deepEqual(r.session.skill_data, DATA);
});

// ---- (b) resumed, a target layer changed

const CHANGES = {
  "a key moved": (s) => { dotKeys(s)[1].time += 0.1; },
  "a key's value changed": (s) => { const k = dotKeys(s)[0]; k.value = Array.isArray(k.value) ? k.value.map((v) => v + 10) : k.value + 10; },
  "a key added": (s) => { const keys = dotKeys(s); keys.push({ ...clone(keys[keys.length - 1]), index: keys.length + 1, time: keys[keys.length - 1].time + 0.5 }); },
  "a key removed": (s) => { dotKeys(s).pop(); },
  "its in point moved": (s) => { infoOf(s, "Dot 1").in_point += 0.2; },
  "its parent set": (s) => { infoOf(s, "Dot 1").parent = 27; },
  "its name now missing": (s) => { layerOf(s, "Dot 1").name = "Dot 1 copy"; infoOf(s, "Dot 1").name = "Dot 1 copy"; },
};

for (const [what, change] of Object.entries(CHANGES)) {
  test(`(b) resumed with ${what} on a target layer: a new lesson from this snapshot, no skill_data, no stored choices`, () => {
    const opened = openThenLeave();
    const now = edited(change);
    const r = startSkill(now);
    assert.equal(r.lesson, "new");
    assert.equal(r.stored_choices, false);
    assert.notEqual(r.session.lesson_id, opened.lesson_id);
    assert.deepEqual(r.session.baseline, now, "this snapshot is the baseline");
    assert.equal(r.session.skill_data, undefined);
    assert.equal(r.session.skill_options, undefined);
    assert.equal(r.analysis.seen_options, undefined, "the analyzer isn't given the old choices");
  });
}

test("(b) resumed with a target changed and this call sending skill_options: new, with only this call's options", () => {
  openThenLeave();
  const next = { order: ["Dot 2", "Dot 1"] };
  const r = startSkill(edited(CHANGES["a key moved"]), { skill_options: next });
  assert.equal(r.lesson, "new");
  assert.deepEqual(r.session.skill_options, next);
  assert.equal(r.stored_choices, false);
});

test("(b) a focus name alone is compared too", () => {
  REFS = [];
  FOCUS = ["Dot 1"];
  openThenLeave();
  assert.equal(startSkill(edited(CHANGES["a key moved"])).lesson, "new");
});

test("(b) an expression switched on a target property counts as a change", () => {
  openThenLeave();
  assert.equal(startSkill(edited((s) => { layerOf(s, "Dot 1").properties[0].expression_enabled = true; })).lesson, "new");
});

// ---- (c) a change elsewhere in the comp

test("(c) resumed with a change only on a layer nothing names: resumed, kept", () => {
  const opened = openThenLeave();
  const r = startSkill(edited((s) => {
    layerOf(s, "Blink").properties[0].keys[0].time += 0.1;
    infoOf(s, "Dot 3").in_point += 0.5;
    infoOf(s, "Background").parent = 27;
  }));
  assert.equal(r.lesson, "resumed");
  assert.equal(r.session.lesson_id, opened.lesson_id);
  assert.deepEqual(r.session.baseline, opened.baseline);
  assert.deepEqual(r.session.skill_options, OPTIONS);
  assert.deepEqual(r.session.skill_data, DATA);
  assert.equal(r.stored_choices, true);
});

test("(c) a layer added above the targets renumbers them but changes nothing named: resumed", () => {
  openThenLeave();
  const now = edited((s) => {
    for (const l of s.layers) l.index += 1;
    for (const l of s.layer_info) { l.index += 1; if (l.parent != null) l.parent += 1; }
    s.layer_info.unshift({ ...clone(infoOf(P2, "Hatch Rig")), index: 1, name: "Null 1", parent: null });
  });
  assert.equal(startSkill(now).lesson, "resumed");
});

// ---- (d), (e), (f) continued

test("(d) continued the same day with target keys that differ: continued, the old baseline and skill_options kept", () => {
  const opened = startSkill(P2, { skill_options: OPTIONS }).session;
  const r = startSkill(edited(CHANGES["a key moved"]));
  assert.equal(r.lesson, "continued");
  assert.equal(r.stored_choices, false);
  assert.deepEqual(r.session.baseline, opened.baseline);
  assert.deepEqual(r.session.skill_options, OPTIONS);
});

test("(e) continued the same day, nothing changed: continued, stored_choices false", () => {
  startSkill(P2, { skill_options: OPTIONS });
  const r = startSkill(clone(P2));
  assert.equal(r.lesson, "continued");
  assert.equal(r.stored_choices, false);
  assert.deepEqual(r.session.skill_options, OPTIONS);
});

test("(f) continued, started on an earlier local day: new (LE-4)", () => {
  startSkill(P2, { skill_options: OPTIONS });
  session.setSkillData(SKILL, 179, DATA);
  const state = JSON.parse(fs.readFileSync(SESSION, "utf8"));
  const earlier = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
  state.lessons[`${SKILL}|179`].lesson_id = earlier;
  fs.writeFileSync(SESSION, JSON.stringify(state));
  const r = startSkill(clone(P2));
  assert.equal(r.lesson, "new");
  assert.notEqual(r.session.lesson_id, earlier);
  assert.equal(r.session.skill_options, undefined);
  assert.equal(r.session.skill_data, undefined);
  assert.equal(r.stored_choices, false);
});

test("(f) an earlier-day lesson id with the collision suffix is read as that day too", () => {
  startSkill(P2);
  const state = JSON.parse(fs.readFileSync(SESSION, "utf8"));
  state.lessons[`${SKILL}|179`].lesson_id = `${new Date(Date.now() - 48 * 3600 * 1000).toISOString()}-a1b2c3`;
  fs.writeFileSync(SESSION, JSON.stringify(state));
  assert.equal(startSkill(clone(P2)).lesson, "new");
});

// ---- (g), (h)

test("(g) resumed with no targets and no focus yet: resumed, kept, whatever changed", () => {
  REFS = [];
  FOCUS = null;
  const opened = openThenLeave();
  const r = startSkill(edited(CHANGES["a key moved"]));
  assert.equal(r.lesson, "resumed");
  assert.equal(r.session.lesson_id, opened.lesson_id);
  assert.deepEqual(r.session.skill_data, DATA);
});

test("(h) a target name found in neither snapshot matches: resumed", () => {
  REFS = [{ layer: "x", property: "y" }];
  FOCUS = null;
  openThenLeave();
  const r = startSkill(edited(CHANGES["a key moved"]));
  assert.equal(r.lesson, "resumed");
  assert.equal(r.stored_choices, true);
});

// ---- checked or demoed lessons, and fresh

test("a lesson that was checked, resumed with changed keys: resumed, baseline kept", () => {
  const opened = startSkill(P2, { skill_options: OPTIONS }).session;
  session.markChecked(false);
  startSkill(OTHER);
  const r = startSkill(edited(CHANGES["a key moved"]));
  assert.equal(r.lesson, "resumed");
  assert.deepEqual(r.session.baseline, opened.baseline);
});

test("a lesson that had a demo, resumed with changed keys: resumed, baseline kept", () => {
  const opened = startSkill(P2, { skill_options: OPTIONS }).session;
  session.recordDemo(opened.demo_target);
  startSkill(OTHER);
  const r = startSkill(edited(CHANGES["a key moved"]));
  assert.equal(r.lesson, "resumed");
  assert.deepEqual(r.session.baseline, opened.baseline);
  assert.ok(r.session.demo);
});

test("a checked lesson, earlier day, continued: continued as today", () => {
  startSkill(P2);
  session.markChecked(false);
  const state = JSON.parse(fs.readFileSync(SESSION, "utf8"));
  state.lessons[`${SKILL}|179`].lesson_id = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
  fs.writeFileSync(SESSION, JSON.stringify(state));
  assert.equal(startSkill(clone(P2)).lesson, "continued");
});

test("fresh: true on a checked lesson still throws LESSON_UNDERWAY", () => {
  startSkill(P2);
  session.markChecked(false);
  const before = fs.readFileSync(SESSION, "utf8");
  assert.throws(() => startSkill(edited(CHANGES["a key moved"]), { fresh: true }), { code: "LESSON_UNDERWAY" });
  assert.equal(fs.readFileSync(SESSION, "utf8"), before);
});

// ---- Easing, with its own analyzer

const EASE = load("practice-before.json"); // Mentor Practice, comp 97
const titleKeys = (s) => s.layers.find((l) => l.name === "Title").properties[0].keys;

test("easing: resumed with changed keys on its focus layer starts new", () => {
  const first = session.start(EASE, { focus_layers: ["Title"] });
  assert.equal(first.lesson, "new");
  assert.ok(first.session.target_refs.some((r) => r.layer === "Title"));
  session.start(P2); // easing on another comp
  const now = clone(EASE);
  titleKeys(now)[1].time += 0.1;
  const r = session.start(now, { focus_layers: ["Title"] });
  assert.equal(r.lesson, "new");
  assert.deepEqual(r.session.baseline, now);
});

test("easing: resumed on a matching comp stays resumed", () => {
  const first = session.start(EASE, { focus_layers: ["Title"] });
  session.start(P2);
  const r = session.start(clone(EASE), { focus_layers: ["Title"] });
  assert.equal(r.lesson, "resumed");
  assert.equal(r.session.lesson_id, first.session.lesson_id);
  assert.equal(r.stored_choices, false, "easing stores no choices");
});
