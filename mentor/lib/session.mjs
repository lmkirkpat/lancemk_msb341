// The lesson state machine (data-model.md › Session, spec 004 contracts/skill-module.md › 4), kept
// in session.json so a lesson survives restarts and each headless eval turn (research R4). One
// lesson per skill and comp; the file is read and written on every call, never cached in memory.
//
// Easing's lessons keep the key they always had (the comp id), so older session.json files and the
// easing tools read the same as before; every other skill's key is "<skill>|<comp id>".

import crypto from "node:crypto";
import fs from "node:fs";
import { SESSION_FILE } from "../paths.mjs";
import { MentorError, registerErrors } from "../errors.mjs";
import { analyze as easingAnalyze, segmentState } from "./analyze.mjs";
import { readJson } from "./json-file.mjs";
import { peekRecord, pastTargets } from "./learner-store.mjs";
import { applies, marksFor, markFrom } from "./marks.mjs";
import { SESSION_WINDOW_HOURS } from "./recommend.mjs";

registerErrors({
  NO_LESSON: "There's no lesson in progress on this comp yet. Take a snapshot of the comp first.",
});

const EASING = "easing.basic";
const MODES = ["lesson", "review"];

const keyFor = (skill, compId) => (skill === EASING ? String(compId) : `${skill}|${compId}`);
// What `current` holds: easing's comp id as a number, as before; other skills' keys as text.
const currentFor = (skill, compId) => (skill === EASING ? compId : `${skill}|${compId}`);

// SESSION_UNREADABLE if the file is there but broken: it's set aside, never written over.
function read() {
  const state = readJson(SESSION_FILE, {
    empty: () => ({ version: 1, current: null, lessons: {} }),
    valid: (s) => s && typeof s === "object" && s.lessons && typeof s.lessons === "object",
    code: "SESSION_UNREADABLE",
  });
  // Lessons from before spec 004 have no skill or mode: they're easing's.
  for (const lesson of Object.values(state.lessons)) {
    if (lesson && typeof lesson === "object") {
      if (!lesson.skill) lesson.skill = EASING;
      if (!lesson.mode) lesson.mode = "lesson";
    }
  }
  return state;
}

const windowStart = (now = Date.now()) => now - SESSION_WINDOW_HOURS * 3600 * 1000;
const recentOffers = (offers, now) => (Array.isArray(offers) ? offers.filter((o) => o && Date.parse(o.at) >= windowStart(now)) : []);

function write(state) {
  if (state.review_offers) state.review_offers = recentOffers(state.review_offers);
  const tmp = `${SESSION_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2) + "\n");
  fs.renameSync(tmp, SESSION_FILE);
}

const currentKey = (state) => (state.current == null ? null : String(state.current));

// Applies `change` to the current lesson and saves it. Throws NO_SESSION if there isn't one.
function updateCurrent(change) {
  const state = read();
  const key = currentKey(state);
  const lesson = key != null ? state.lessons[key] : null;
  if (!lesson) throw new MentorError("NO_SESSION");
  change(lesson);
  write(state);
  return lesson;
}

export function currentLesson() {
  const state = read();
  const key = currentKey(state);
  const lesson = key != null ? state.lessons[key] : null;
  if (!lesson) throw new MentorError("NO_SESSION");
  return lesson;
}

// skill_options are stored in session.json and handed back on a resumed lesson, so they must
// survive JSON as they are.
function isPlainData(v) {
  if (v === null || typeof v === "string" || typeof v === "boolean") return true;
  if (typeof v === "number") return Number.isFinite(v);
  if (Array.isArray(v)) return v.every(isPlainData);
  if (typeof v === "object") {
    const proto = Object.getPrototypeOf(v);
    return (proto === Object.prototype || proto === null) && Object.values(v).every((x) => x !== undefined && isPlainData(x));
  }
  return false;
}

// Easing's analyzer gives segment ids only; the record wants layer and property names.
function refsFromSegmentIds(snapshot, ids) {
  return ids.map((id) => {
    const first = id.indexOf("/");
    const last = id.lastIndexOf("/");
    const layer = snapshot.layers.find((l) => l.index === Number(id.slice(0, first)));
    const prop = layer && layer.properties.find((p) => p.path === id.slice(first + 1, last));
    return { layer: layer ? layer.name : null, property: prop ? prop.display_name : null };
  });
}

const kept = (marks, snapshot) => marks.filter((m) => applies(m, snapshot));

// FR-043, research R26: does the comp still match a lesson's baseline on the layers its targets and
// focus name? Per name, the layers with that name in index order must have the same keyed
// properties (path, expression on or off, keys as the snapshot reports them) and, when both
// snapshots have layer_info, the same in point, out point, start time and parent. The parent is
// compared by its name, not its index, because adding a layer renumbers everything below it.
function sameData(a, b) {
  if (a === b) return true;
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x, i) => sameData(x, b[i]));
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a).filter((k) => a[k] !== undefined);
    const kb = Object.keys(b).filter((k) => b[k] !== undefined);
    return ka.length === kb.length && ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && sameData(a[k], b[k]));
  }
  return false;
}

const byIndexOrder = (list) => [...list].sort((x, y) => x.index - y.index);
const keyedShape = (layer) => (layer.properties || []).map((p) => ({ path: p.path, expression_enabled: p.expression_enabled, keys: p.keys }));

function timingShape(info, all) {
  const parent = info.parent == null ? null : all.find((l) => l.index === info.parent);
  return { in_point: info.in_point, out_point: info.out_point, start_time: info.start_time, parent: info.parent == null ? null : parent ? parent.name : info.parent };
}

function baselineMatches(lesson, snapshot) {
  const names = new Set((Array.isArray(lesson.target_refs) ? lesson.target_refs : []).map((r) => r && r.layer).filter((n) => typeof n === "string"));
  if (Array.isArray(lesson.focus)) for (const n of lesson.focus) if (typeof n === "string") names.add(n);
  const base = lesson.baseline;
  if (!base || !Array.isArray(base.layers)) return true;
  const withInfo = Array.isArray(base.layer_info) && Array.isArray(snapshot.layer_info);
  for (const name of names) {
    const keyedA = byIndexOrder(base.layers.filter((l) => l.name === name));
    const keyedB = byIndexOrder((snapshot.layers || []).filter((l) => l.name === name));
    const infoA = withInfo ? byIndexOrder(base.layer_info.filter((l) => l.name === name)) : [];
    const infoB = withInfo ? byIndexOrder(snapshot.layer_info.filter((l) => l.name === name)) : [];
    const inA = keyedA.length + infoA.length > 0;
    const inB = keyedB.length + infoB.length > 0;
    if (!inA && !inB) continue; // nothing to compare
    if (inA !== inB) return false;
    if (!sameData(keyedA.map(keyedShape), keyedB.map(keyedShape))) return false;
    if (withInfo && !sameData(infoA.map((l) => timingShape(l, base.layer_info)), infoB.map((l) => timingShape(l, snapshot.layer_info)))) return false;
  }
  return true;
}

// FR-043 (LE-1, kept; LE-4): the machine's local day of a lesson id's time. The id is an ISO time,
// sometimes with a short suffix added on a collision. Unreadable gives null, which is never stale.
function localDayOf(lessonId) {
  const m = typeof lessonId === "string" ? lessonId.match(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z/) : null;
  const t = m ? Date.parse(m[0]) : NaN;
  return Number.isFinite(t) ? new Date(t).toDateString() : null;
}

// FR-043: an open lesson never checked and with no demo is stale when it would be resumed and the
// comp no longer matches its baseline, or continued and it started on an earlier local day.
function isStale(open, resuming, snapshot) {
  if (open.demo || open.checked || open.status === "checked") return false;
  if (resuming) return !baselineMatches(open, snapshot);
  const day = localDayOf(open.lesson_id);
  return day !== null && day !== new Date().toDateString();
}

// Called by each skill's snapshot tool. Continues (same skill and comp) or resumes (after working
// elsewhere) an unfinished lesson in the same mode, keeping its baseline and demo so re-snapshotting
// can't reset either. Otherwise starts a new lesson with this snapshot as the baseline. Findings
// describe the comp as it is now; targets always come from the baseline, so earlier edits keep
// their credit.
export function start(snapshot, opts = {}) {
  const { skill = EASING, analyze = easingAnalyze, focus_layers, mode = "lesson", skill_options, fresh = false } = opts;
  if (!MODES.includes(mode)) throw new Error(`mode must be one of: ${MODES.join(", ")}`);
  if (skill_options !== undefined && (skill_options === null || typeof skill_options !== "object" || Array.isArray(skill_options) || !isPlainData(skill_options))) {
    throw new Error("skill_options must be plain JSON data (an object of text, numbers, true/false, lists and objects).");
  }

  const state = read();
  const compId = snapshot.comp.id;
  const key = keyFor(skill, compId);
  const existing = state.lessons[key];
  const open = existing && !existing.passed && (existing.mode || "lesson") === mode ? existing : null;
  if (open && fresh && (open.demo || open.checked || open.status === "checked")) throw new MentorError("LESSON_UNDERWAY");
  const continuing = open && !fresh && !isStale(open, currentKey(state) !== key, snapshot) ? open : null;

  // What the learner record says, read without changing it: an unreadable record means no marks
  // and no past targets, never an error from here.
  const record = peekRecord();
  const marks = marksFor(record, snapshot.project, snapshot.comp.name);
  const exclude = mode !== "review" ? [] : continuing ? continuing.exclude || [] : pastTargets(skill, snapshot.project, snapshot.comp.name);
  const options = continuing ? (skill_options !== undefined ? skill_options : continuing.skill_options) : skill_options;
  const analyzerOpts = (snap) => {
    const o = { focus_layers, exclude, kept_linear: kept(marks, snap) };
    if (options !== undefined) o.skill_options = options;
    return o;
  };

  const now = analyze(snapshot, analyzerOpts(snapshot)); // UNKNOWN_LAYER throws here, before any write

  let kind;
  let lesson;
  if (continuing) {
    kind = currentKey(state) === key ? "continued" : "resumed";
    const fromBaseline = analyze(continuing.baseline, analyzerOpts(continuing.baseline));
    lesson = {
      ...continuing,
      focus: fromBaseline.focus,
      targets: fromBaseline.targets,
      target_refs: fromBaseline.target_refs || refsFromSegmentIds(continuing.baseline, fromBaseline.targets),
      demo_target: continuing.demo ? null : fromBaseline.demo_target, // after a demo, never another (N6)
      marks: kept(marks, continuing.baseline),
    };
    if (options !== undefined) lesson.skill_options = options;
  } else {
    kind = "new";
    let lessonId = new Date().toISOString();
    if (existing && existing.lesson_id === lessonId) lessonId += `-${crypto.randomBytes(3).toString("hex")}`;
    lesson = {
      lesson_id: lessonId,
      comp_id: compId,
      skill,
      mode,
      baseline: snapshot,
      focus: now.focus,
      targets: now.targets,
      target_refs: now.target_refs || refsFromSegmentIds(snapshot, now.targets),
      demo_target: now.demo_target,
      demo: null,
      status: "started",
      passed: false,
      marks: kept(marks, snapshot),
      kept_linear: [],
    };
    if (mode === "review") lesson.exclude = exclude;
    if (options !== undefined) lesson.skill_options = options;
  }

  // Rules the session enforces for every skill, whatever its analyzer proposed: no demo in a review
  // (FR-021), and none that would take the learner's only target.
  let noDemoReason = now.no_demo_reason;
  if (lesson.mode === "review") {
    lesson.demo_target = null;
    noDemoReason = lesson.targets.length === 0 ? "no_new_target" : "review";
  } else if (lesson.demo_target && lesson.targets.length < 2) {
    lesson.demo_target = null;
    noDemoReason = "single_target";
  }

  state.lessons[key] = lesson;
  state.current = currentFor(skill, compId);
  write(state);
  const analysis = { ...now, focus: lesson.focus, targets: lesson.targets, demo_target: lesson.demo_target };
  if (noDemoReason !== now.no_demo_reason) analysis.no_demo_reason = noDemoReason;
  // R26: the lesson came back holding the learner's earlier choices. Returned, never stored.
  const stored_choices = kind === "resumed" && continuing.skill_options !== undefined && skill_options === undefined;
  return { lesson: kind, session: lesson, analysis, stored_choices };
}

// FR-006 and FR-021, enforced in code (research R3). A skill's demo tool calls this before touching AE.
export function assertCanDemo(targetId) {
  const lesson = currentLesson();
  if (lesson.mode === "review") throw new MentorError("REVIEW_NO_DEMO");
  if (lesson.demo) throw new MentorError("DEMO_USED");
  if (!lesson.demo_target || targetId !== lesson.demo_target) throw new MentorError("NOT_DEMO_TARGET");
  return lesson;
}

export function recordDemo(targetId) {
  assertCanDemo(targetId);
  return updateCurrent((lesson) => {
    lesson.demo = { segment_id: targetId, at: new Date().toISOString() };
    lesson.demo_target = null;
    lesson.status = "demo_done";
  });
}

// demoUndone: the check saw the demo pair needing ease again. From then on it's the learner's pair.
export function markChecked(passed, { demoUndone = false } = {}) {
  return updateCurrent((lesson) => {
    lesson.status = "checked";
    lesson.checked = true; // stays true after a later demo, unlike status
    lesson.passed = passed;
    if (demoUndone && lesson.demo && !lesson.demo.undone) lesson.demo.undone = new Date().toISOString();
  });
}

// Skill 1's check (FR-038, contracts/skill-module.md › 6): note that each named property runs at
// constant speed, after confirming in `snapshot` that it's there, has no expression on, and every
// pair is linear at both ends. All or nothing: one that doesn't qualify stores none. record_lesson
// writes them to the record, and only when the lesson's result is a pass ("Only a passing check
// writes one"). Refused before that: KEEP_LINEAR_OTHER_COMP when `snapshot` isn't the lesson's
// project and comp, KEEP_LINEAR_NO_CHECK until a check has run on this lesson (call markChecked()
// first, in the same check).
export function keepLinear(snapshot, refs) {
  const lesson = currentLesson(); // NO_SESSION before anything else
  const baseProject = lesson.baseline ? lesson.baseline.project : undefined;
  if (!snapshot || !snapshot.comp || snapshot.comp.id !== lesson.comp_id || (baseProject !== undefined && snapshot.project !== baseProject)) {
    throw new MentorError("KEEP_LINEAR_OTHER_COMP");
  }
  if (!(lesson.checked || lesson.status === "checked")) throw new MentorError("KEEP_LINEAR_NO_CHECK");
  const found = (refs || []).map(({ layer: layerName, property }) => {
    for (const layer of snapshot.layers.filter((l) => l.name === layerName)) {
      const prop = layer.properties.find((p) => p.display_name === property || p.path === property || p.display_path === property);
      if (prop) return { layer, prop };
    }
    return null;
  });
  const ok = found.length > 0 && found.every((f) => f && !f.prop.expression_enabled && f.prop.keys.length >= 2 &&
    f.prop.keys.slice(1).every((k, i) => segmentState(f.prop.keys[i], k) === "linear"));
  if (!ok) throw new MentorError("NOT_KEPT_LINEAR");
  return updateCurrent((lesson) => {
    const list = Array.isArray(lesson.kept_linear) ? lesson.kept_linear : [];
    for (const { layer, prop } of found) {
      const m = markFrom(prop, layer);
      const i = list.findIndex((x) => x.layer === m.layer && x.path === m.path);
      if (i >= 0) list[i] = m;
      else list.push(m);
    }
    lesson.kept_linear = list;
  }).kept_linear;
}

// Spec 012 SR-1 (contracts/skill-module.md › 4, data-model › Session lesson): a skill's own tools
// store what they measured on the open (unpassed) lesson for that skill and comp, as `skill_data`,
// replaced whole by each call. Kept on a continued or resumed lesson; a new or fresh lesson starts
// with none. Separate from skill_options: the model never supplies it, the analyzer is never given
// it, and the session never reads inside it. Throws before any write: on data that isn't plain JSON,
// and NO_LESSON when that skill has no open lesson on that comp.
export function setSkillData(skill, compId, data) {
  if (data === undefined || !isPlainData(data)) {
    throw new Error("skill_data must be plain JSON data (text, numbers, true/false, null, lists and objects).");
  }
  const state = read();
  const lesson = state.lessons[keyFor(skill, compId)];
  if (!lesson || lesson.passed || lesson.skill !== skill || lesson.comp_id !== compId) throw new MentorError("NO_LESSON");
  lesson.skill_data = structuredClone(data);
  write(state);
  return structuredClone(lesson.skill_data);
}

// recommend_next remembers each review it offers unprompted, for FR-020's one per session (R8).
export function recordReviewOffer(skill) {
  const state = read();
  state.review_offers = [...recentOffers(state.review_offers), { skill, at: new Date().toISOString() }];
  write(state);
}

export function reviewOffers() {
  return recentOffers(read().review_offers);
}
