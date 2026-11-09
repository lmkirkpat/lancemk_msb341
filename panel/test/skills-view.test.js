"use strict";
// T050, T051: the Skills tab and skill detail (FR-048, FR-049).
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { skillsView, skillDetail } = require("../lib/skills-view.js");
const { builtSkills } = require("../lib/skills.js");

const PATH = { on_ramp: { id: "keyframes", name: "Setting keyframes" }, skills: [{ id: "easing.basic", name: "Easing", hard: ["keyframes"] }, { id: "timing.offset", name: "Offset", hard: ["easing.basic"] }, { id: "parenting.null", name: "Null", hard: ["transform.anchor"] }, { id: "transform.anchor", name: "Pivot", hard: ["keyframes"] }, { id: "shape.trim_paths", name: "Trim", hard: [] }] };
const DATA = { skills: { "easing.basic": { review: false }, "timing.offset": { review: true }, "parenting.null": { review: true }, "transform.anchor": { review: true } } };
const built = builtSkills(PATH, DATA);
const NOW = new Date(2026, 10, 9, 12);
const rec = (skills, lessons = []) => ({ status: "ok", record: { skills, lessons } });
const view = (memory) => skillsView({ memory, pathData: PATH, built, now: NOW });

test("skills-empty: path order, the on-ramp, coming later not pressable, counted over built skills", () => {
  const v = view({ status: "missing", record: null });
  assert.equal(v.state, "empty");
  assert.deepEqual(v.rows.map((r) => r.name), ["Setting keyframes", "Easing", "Offset", "Null", "Pivot", "Trim"]);
  assert.deepEqual(v.rows[0], { id: "keyframes", name: "Setting keyframes", cls: "learned", glyph: "✓", word: "We assume you know this", pressable: false });
  assert.deepEqual([v.rows[5].cls, v.rows[5].word, v.rows[5].pressable], ["soon", "Coming later", false]);
  assert.deepEqual([v.rows[1].cls, v.rows[1].word, v.rows[1].pressable], ["none", "Not started", true]);
  assert.equal(v.summary, "0 of 4 learned");
});

test("skills-few and in progress", () => {
  const v = view(rec({ "easing.basic": { status: "learned" }, "timing.offset": { status: "practicing" } }));
  assert.equal(v.state, "few");
  assert.equal(v.summary, "1 of 4 learned · 1 in progress");
  assert.equal(v.rows[2].word, "In progress");
});

test("skills-many; Practice due from review_due only, never easing, a plain date compare (FR-051)", () => {
  const skills = { "easing.basic": { status: "learned", review_due: "2020-01-01" }, "timing.offset": { status: "learned", review_due: "2026-11-09T01:00:00Z" }, "parenting.null": { status: "learned", review_due: "2026-11-10" }, "transform.anchor": { status: "learned" } };
  const v = view(rec(skills));
  assert.equal(v.state, "many");
  assert.equal(v.rows[1].cls, "learned", "easing has no review");
  assert.equal(v.rows[2].word, "Practice due");
  assert.equal(v.rows[3].cls, "learned", "not due until tomorrow");
  assert.equal(v.due_count, 1);
  assert.equal(v.summary, "4 of 4 learned · 1 due for practice");
});

test("an unreadable or missing record never throws and shows nothing learned", () => {
  assert.equal(view({ status: "unreadable", record: null }).state, "empty");
});

test("skill-detail: history newest first, read-only fields; missing fields stay out", () => {
  const memory = rec({ "timing.offset": { status: "learned", last_practiced: "2026-10-26T12:00:00Z", review_due: "2026-12-01" } }, [
    { skill: "timing.offset", date: "2026-10-20T12:00:00Z", comp: "Practice", result: "partial", summary: "First go." },
    { skill: "easing.basic", date: "2026-10-21T12:00:00Z", result: "passed" },
    { skill: "timing.offset", date: "2026-10-26T12:00:00Z", result: "passed", next: "Try properties." },
  ]);
  const d = skillDetail("timing.offset", { memory, pathData: PATH, built, now: NOW });
  assert.equal(d.state, "review");
  assert.equal(d.tag, "learned");
  assert.equal(d.status_line, "Learned Oct 26.");
  assert.deepEqual(d.history.map((h) => [h.date, h.comp, h.result, h.summary, h.next]), [["Oct 26", "", "passed", "", "Try properties."], ["Oct 20", "Practice", "not finished", "First go.", ""]]);
});

test("skill-detail-noreview for easing; skill-detail-new with Builds on, never blocking; unknown id is null", () => {
  const memory = rec({ "easing.basic": { status: "learned", last_practiced: "2026-10-07T12:00:00Z" } }, [{ skill: "easing.basic", date: "2026-10-07T12:00:00Z", result: "passed" }]);
  const easing = skillDetail("easing.basic", { memory, pathData: PATH, built, now: NOW });
  assert.equal(easing.state, "noreview");
  const nul = skillDetail("parenting.null", { memory, pathData: PATH, built, now: NOW });
  assert.equal(nul.state, "new");
  assert.deepEqual(nul.builds_on, ["Pivot"]);
  const anchor = skillDetail("transform.anchor", { memory, pathData: PATH, built, now: NOW });
  assert.deepEqual(anchor.builds_on, [], "the on-ramp isn't a lesson to suggest");
  assert.equal(skillDetail("shape.trim_paths", { memory, pathData: PATH, built, now: NOW }), null);
  const practicing = skillDetail("easing.basic", { memory: rec({ "easing.basic": { status: "practicing" } }, [{ skill: "easing.basic", result: "partial", date: "2026-10-07T12:00:00Z" }]), pathData: PATH, built, now: NOW });
  assert.equal(practicing.state, "noreview");
  assert.equal(practicing.status_line, "In progress.");
});
