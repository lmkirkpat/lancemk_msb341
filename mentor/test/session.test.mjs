// FR-006/FR-007: the lesson state machine in session.json (data-model.md › Session).

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fixture, tempHome } from "./helpers.mjs";

const home = tempHome();
const session = await import("../lib/session.mjs");

const A = fixture("attempt-before");                 // comp 200
const A_DONE = fixture("attempt-complete");          // comp 200, every Title pair eased
const B = fixture("linear-basic");                   // comp 100
const POS1 = "1/ADBE Transform Group/ADBE Position/1";

beforeEach(() => fs.rmSync(path.join(home, "session.json"), { force: true }));

test("start → started, recordDemo → demo_done, and a second demo is refused", () => {
  const s = session.start(A);
  assert.equal(s.lesson, "new");
  assert.equal(s.session.status, "started");
  assert.equal(s.session.comp_id, 200);
  assert.equal(s.analysis.demo_target, POS1);
  assert.equal(session.recordDemo(POS1).status, "demo_done");
  assert.throws(() => session.recordDemo(POS1), { code: "DEMO_USED" });
});

test("a demo on anything but demo_target is refused, and nothing is recorded", () => {
  session.start(A);
  assert.throws(() => session.recordDemo("1/ADBE Transform Group/ADBE Position/2"), { code: "NOT_DEMO_TARGET" });
  assert.equal(session.currentLesson().demo, null);
});

test("markChecked → checked, and re-checking is allowed", () => {
  session.start(A);
  assert.equal(session.markChecked(false).status, "checked");
  const again = session.markChecked(false);
  assert.equal(again.status, "checked");
  assert.equal(again.passed, false);
});

test("with no session, every call throws NO_SESSION", () => {
  assert.throws(() => session.currentLesson(), { code: "NO_SESSION" });
  assert.throws(() => session.recordDemo(POS1), { code: "NO_SESSION" });
  assert.throws(() => session.markChecked(true), { code: "NO_SESSION" });
});

test("re-snapshotting an unfinished lesson continues it: baseline and demo are kept", () => {
  session.start(A);
  session.recordDemo(POS1);
  const s = session.start(fixture("attempt-eased-one"));
  assert.equal(s.lesson, "continued");
  assert.deepEqual(s.session.baseline, A, "the learner's edits don't become the new 'before'");
  assert.equal(s.session.demo.segment_id, POS1);
  assert.equal(s.analysis.demo_target, null, "after a demo, demo_target is always null (N6)");
  assert.throws(() => session.recordDemo(POS1), { code: "DEMO_USED" });
});

test("a new focus recomputes targets from the baseline, not the current state", () => {
  session.start(A);
  const s = session.start(A_DONE, { focus_layers: ["Title"] });
  assert.equal(s.lesson, "continued");
  assert.equal(s.session.targets.length, 4, "computed from the current comp it would be 0");
  assert.deepEqual(s.session.focus, ["Title"]);
  assert.equal(s.analysis.counts.linear, 1, "findings still describe the comp as it is now");
});

test("an unknown focus layer throws and leaves the session alone", () => {
  session.start(A);
  assert.throws(() => session.start(A, { focus_layers: ["Nope"] }), { code: "UNKNOWN_LAYER" });
  assert.equal(session.currentLesson().focus, null);
});

test("after a passed check, start() begins a new lesson with a new baseline and no demo", () => {
  session.start(A);
  session.recordDemo(POS1);
  session.markChecked(true);
  const s = session.start(A_DONE);
  assert.equal(s.lesson, "new");
  assert.deepEqual(s.session.baseline, A_DONE);
  assert.equal(s.session.demo, null);
  assert.equal(s.session.status, "started");
});

test("lessons are kept per comp: switching away and back resumes, with the demo intact (N3)", () => {
  session.start(A);
  session.recordDemo(POS1);
  const b = session.start(B);
  assert.equal(b.lesson, "new");
  assert.equal(b.session.comp_id, 100);
  session.markChecked(true); // passing on B...
  const a = session.start(A);
  assert.equal(a.lesson, "resumed"); // ...doesn't end A's lesson
  assert.deepEqual(a.session.baseline, A);
  assert.equal(a.session.demo.segment_id, POS1);
  assert.throws(() => session.recordDemo(POS1), { code: "DEMO_USED" });
});

test("state lives in session.json and survives re-importing the module (R4)", async () => {
  session.start(A);
  session.recordDemo(POS1);
  const file = JSON.parse(fs.readFileSync(path.join(home, "session.json"), "utf8"));
  assert.equal(file.version, 1);
  assert.equal(file.current, 200);
  assert.ok(file.lessons["200"]);
  const fresh = await import(`../lib/session.mjs?reimport=${Date.now()}`);
  assert.equal(fresh.currentLesson().status, "demo_done");
  assert.throws(() => fresh.recordDemo(POS1), { code: "DEMO_USED" });
});

test("a check that saw the demo undone is remembered, and stays remembered", () => {
  session.start(A, { focus_layers: ["Title"] });
  session.recordDemo(POS1);
  assert.equal(session.currentLesson().demo.undone, undefined);
  session.markChecked(false, { demoUndone: true });
  const first = session.currentLesson().demo.undone;
  assert.ok(first, "undone time recorded");
  session.markChecked(true, { demoUndone: false });
  assert.equal(session.currentLesson().demo.undone, first, "a later check doesn't clear it");
});
