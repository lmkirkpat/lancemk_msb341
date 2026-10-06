// The lesson state machine (data-model.md › Session), kept in session.json so a lesson survives
// restarts and each headless eval turn (research R4). One lesson per comp (N3); the file is read
// and written on every call, never cached in memory.

import fs from "node:fs";
import { SESSION_FILE } from "../paths.mjs";
import { MentorError } from "../errors.mjs";
import { analyze } from "./analyze.mjs";

function read() {
  try {
    return JSON.parse(fs.readFileSync(SESSION_FILE, "utf8"));
  } catch {
    return { version: 1, current: null, lessons: {} };
  }
}

function write(state) {
  const tmp = `${SESSION_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2) + "\n");
  fs.renameSync(tmp, SESSION_FILE);
}

// Applies `change` to the current lesson and saves it. Throws NO_SESSION if there isn't one.
function updateCurrent(change) {
  const state = read();
  const lesson = state.current != null ? state.lessons[state.current] : null;
  if (!lesson) throw new MentorError("NO_SESSION");
  change(lesson);
  write(state);
  return lesson;
}

export function currentLesson() {
  const state = read();
  const lesson = state.current != null ? state.lessons[state.current] : null;
  if (!lesson) throw new MentorError("NO_SESSION");
  return lesson;
}

// Called by snapshot_project. Continues (same comp) or resumes (after a switch) an unfinished
// lesson, keeping its baseline and demo so re-snapshotting can't reset either. Otherwise starts a
// new lesson with this snapshot as the baseline. Findings describe the comp as it is now; targets
// always come from the baseline, so earlier edits keep their credit.
export function start(snapshot, { focus_layers } = {}) {
  const now = analyze(snapshot, { focus_layers }); // UNKNOWN_LAYER throws here, before any write
  const state = read();
  const compId = snapshot.comp.id;
  const existing = state.lessons[compId];

  let kind;
  let lesson;
  if (existing && !existing.passed) {
    kind = state.current === compId ? "continued" : "resumed";
    const fromBaseline = analyze(existing.baseline, { focus_layers });
    lesson = {
      ...existing,
      focus: fromBaseline.focus,
      targets: fromBaseline.targets,
      demo_target: existing.demo ? null : fromBaseline.demo_target, // after a demo, never another (N6)
    };
  } else {
    kind = "new";
    lesson = {
      lesson_id: new Date().toISOString(),
      comp_id: compId,
      baseline: snapshot,
      focus: now.focus,
      targets: now.targets,
      demo_target: now.demo_target,
      demo: null,
      status: "started",
      passed: false,
    };
  }

  state.lessons[compId] = lesson;
  state.current = compId;
  write(state);
  return {
    lesson: kind,
    session: lesson,
    analysis: { ...now, focus: lesson.focus, targets: lesson.targets, demo_target: lesson.demo_target },
  };
}

// FR-006, enforced in code (research R3). set_ease calls this before touching AE.
export function assertCanDemo(segmentId) {
  const lesson = currentLesson();
  if (lesson.demo) throw new MentorError("DEMO_USED");
  if (!lesson.demo_target || segmentId !== lesson.demo_target) throw new MentorError("NOT_DEMO_TARGET");
  return lesson;
}

export function recordDemo(segmentId) {
  assertCanDemo(segmentId);
  return updateCurrent((lesson) => {
    lesson.demo = { segment_id: segmentId, at: new Date().toISOString() };
    lesson.demo_target = null;
    lesson.status = "demo_done";
  });
}

// demoUndone: the check saw the demo pair needing ease again. From then on it's the learner's pair.
export function markChecked(passed, { demoUndone = false } = {}) {
  return updateCurrent((lesson) => {
    lesson.status = "checked";
    lesson.passed = passed;
    if (demoUndone && lesson.demo && !lesson.demo.undone) lesson.demo.undone = new Date().toISOString();
  });
}
