// Spec 014 T065 (US5, SC-008; data-model § 3, research R8): the learner record's asked list. An entry
// changes no skill's state, review date or reviews in a row; an old record without `asked` reads as
// empty; reviews, past targets, marks and the practice rule read the same with entries present; every
// text field gets the personal-detail check (FR-044); a malformed `asked` never makes the record
// unreadable (the panel ignores it, so the mentor must not set the record aside for it).

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { tempHome } from "./helpers.mjs";

const home = tempHome();
const LEARNER = path.join(home, "learner.json");
const asked = await import("../lib/asked-record.mjs");
const store = await import("../lib/learner-store.mjs");
const reviews = await import("../lib/reviews.mjs");
const { recommend, reviewFor } = await import("../lib/recommend.mjs");
const { readPath } = await import("../lib/path.mjs");
const { MentorError } = await import("../errors.mjs");

const NOW = Date.parse("2026-11-19T15:00:00Z");
const SKILLS = {
  "transform.anchor": { status: "learned", last_practiced: "2026-11-10T10:00:00.000Z", times_passed: 1, next: "x", review_due: "2026-11-17", reviews_passed_in_row: 0 },
  "easing.basic": { status: "practicing", last_practiced: "2026-11-12T10:00:00.000Z", times_passed: 0, next: "y" },
};
const LESSONS = [
  { date: "2026-11-10T10:00:00.000Z", skill: "transform.anchor", project: "P.aep", comp: "Door", attempted: "a", result: "passed", demo_used: false, summary: "s", next: "x", kind: "first", targets: [{ layer: "Door", property: "Anchor Point" }] },
];
const MARKS = [{ kind: "kept_linear", project: "P.aep", comp: "Door", layer: "Door", path: "ADBE Transform Group/ADBE Opacity", property: "Opacity", key_times: [0, 1], skill: "keyframes.types", date: "2026-11-10" }];
const base = () => ({ version: 1, skills: structuredClone(SKILLS), lessons: structuredClone(LESSONS), marks: structuredClone(MARKS) });
const write = (r) => fs.writeFileSync(LEARNER, typeof r === "string" ? r : JSON.stringify(r));
const read = () => JSON.parse(fs.readFileSync(LEARNER, "utf8"));
const entryArgs = (over = {}) => ({ project: "P.aep", comp: "Comp 1", layers: ["Shake Control", null, "Shake Control"], goal: "a shake that turns from where it's hit", skills: ["transform.anchor", "easing.basic"], now: NOW, ...over });

beforeEach(() => {
  for (const f of fs.readdirSync(home)) if (f.startsWith("learner.json")) fs.rmSync(path.join(home, f));
});

test("an entry has data-model § 3's fields, set by the tool: layers de-duplicated, after_learning from the record", () => {
  write(base());
  const e = asked.recordAsked(entryArgs());
  assert.deepEqual(Object.keys(e), ["kind", "date", "project", "comp", "layers", "goal", "skills", "after_learning", "went_deeper"]);
  assert.equal(e.kind, "asked");
  assert.equal(e.date, new Date(NOW).toISOString());
  assert.deepEqual(e.layers, ["Shake Control"]);
  assert.deepEqual(e.skills, ["transform.anchor", "easing.basic"]);
  assert.deepEqual(e.after_learning, ["transform.anchor"], "learned only; practicing isn't learned");
  assert.equal(e.went_deeper, null);
  assert.deepEqual(read().asked, [e]);
});

test("SC-008: an entry changes no skill's status, times passed, review date or reviews in a row, and no lesson or mark", () => {
  write(base());
  const before = base();
  asked.recordAsked(entryArgs());
  asked.markWentDeeper(new Date(NOW).toISOString(), "transform.anchor");
  asked.setSaid(new Date(NOW).toISOString(), "said the steps worked");
  asked.markRaised(new Date(NOW).toISOString(), NOW);
  const after = read();
  assert.deepEqual(after.skills, before.skills);
  assert.deepEqual(after.lessons, before.lessons);
  assert.deepEqual(after.marks, before.marks);
  assert.equal(after.version, 1);
});

test("SC-008: reviews, past targets, marks and the practice rule read the same with entries present", () => {
  const plain = base();
  const withAsked = { ...base(), asked: [{ kind: "asked", date: "2026-11-18T10:00:00.000Z", project: "P.aep", comp: "Door", layers: ["Door"], goal: "g", skills: ["transform.anchor"], after_learning: ["transform.anchor"], went_deeper: "transform.anchor" }] };
  const now = new Date(NOW);
  assert.deepEqual(reviews.pastTargetsIn(withAsked, "transform.anchor", "P.aep", "Door"), reviews.pastTargetsIn(plain, "transform.anchor", "P.aep", "Door"));
  assert.equal(reviews.isDue(withAsked.skills["transform.anchor"], now), reviews.isDue(plain.skills["transform.anchor"], now));
  const snap = { project: "P.aep", comp: { id: 1, name: "Door" }, layers: [] };
  const finders = { "transform.anchor": { review: true, focus: () => ({ count: 1, layers: ["Other"] }) } };
  assert.deepEqual(reviewFor({ skill: "transform.anchor", record: withAsked, finders, snapshot: snap, now }), reviewFor({ skill: "transform.anchor", record: plain, finders, snapshot: snap, now }));
  // The practice rule (research R18): a lesson on a learned skill is practice, with or without entries.
  write(withAsked);
  const { entry, skill } = store.recordLesson({ skill: "transform.anchor", project: "P.aep", comp: "Door", attempted: "a", result: "passed", demo_used: false, summary: "s", next: "n" }, ["transform.anchor"], { lesson: { mode: "lesson", target_refs: [] } });
  assert.equal(entry.kind, "practice");
  assert.equal(skill.review_due, "2026-11-17");
  assert.equal(read().asked.length, 1, "recording a lesson keeps the asked list");
});

test("an old record without asked reads as empty, and gains the key only with an entry", () => {
  write(base());
  assert.deepEqual(store.askedOf(store.peekRecord()), []);
  assert.equal("asked" in store.readRecord(), false);
  assert.equal(asked.markRaised("2026-01-01T00:00:00.000Z"), false, "nothing to mark");
  assert.equal("asked" in read(), false, "no write when nothing changed");
  asked.recordAsked(entryArgs());
  assert.equal(read().asked.length, 1);
});

test("no record yet: the entry starts one, with no skills or lessons", () => {
  const e = asked.recordAsked(entryArgs());
  assert.ok(e);
  const r = read();
  assert.deepEqual(r.skills, {});
  assert.deepEqual(r.lessons, []);
  assert.deepEqual(e.after_learning, []);
});

test("a malformed asked (not a list, or junk inside) reads as empty, never makes the record unreadable, and is never lost silently", () => {
  for (const bad of ["junk", 7, null, { a: 1 }, true]) {
    write({ ...base(), asked: bad });
    assert.ok(store.peekRecord(), `peek reads the record with asked ${JSON.stringify(bad)}`);
    assert.deepEqual(store.askedOf(store.peekRecord()), []);
    assert.ok(store.readRecord().skills, "readRecord doesn't set it aside");
    assert.ok(fs.readdirSync(home).every((f) => !f.includes("unreadable")), "nothing set aside");
    const e = asked.recordAsked(entryArgs());
    assert.ok(e, "an entry is still written");
    assert.deepEqual(read().asked, [e], "a value that isn't a list is replaced by the new list");
    assert.deepEqual(read().skills, SKILLS);
  }
  const junk = ["text", 3, null, [1], { kind: "lesson" }, { kind: "asked" }];
  write({ ...base(), asked: junk });
  assert.deepEqual(store.askedOf(store.peekRecord()), [], "junk entries are skipped by readers");
  const e = asked.recordAsked(entryArgs());
  assert.deepEqual(read().asked, [...junk, e], "junk kept in place, new entry added");
  assert.deepEqual(store.askedOf(read()), [e]);
  assert.ok(asked.setSaid(e.date, "said it worked"));
});

test("an unreadable record is left exactly as it is: no entry, nothing set aside", () => {
  write("{ broken");
  assert.equal(asked.recordAsked(entryArgs()), null);
  assert.equal(fs.readFileSync(LEARNER, "utf8"), "{ broken");
  assert.ok(fs.readdirSync(home).every((f) => !f.includes("unreadable")));
  assert.equal(asked.markWentDeeper("2026-11-19T15:00:00.000Z", "transform.anchor"), false);
});

test("FR-044: personal details never reach an entry", () => {
  write(base());
  assert.equal(asked.recordAsked(entryArgs({ project: "client a@b.co.aep" })), null, "an unsafe project writes nothing");
  assert.equal(asked.recordAsked(entryArgs({ comp: "Call 801-555-0123" })), null, "an unsafe comp writes nothing");
  const e = asked.recordAsked(entryArgs({ layers: ["Shake Control", "me@example.com"] }));
  assert.deepEqual(e.layers, ["Shake Control"], "an unsafe layer name is left out");
  assert.throws(() => asked.checkGoalText("shake for a@b.co"), (x) => x.code === "UNSAFE_RECORD");
  assert.throws(() => asked.checkSaidText("call me on +44 20 7946 0958"), (x) => x.code === "UNSAFE_RECORD");
  assert.throws(() => asked.setSaid(e.date, "worked, a@b.co"), (x) => x.code === "UNSAFE_RECORD");
  assert.equal(read().asked[0].said, undefined);
});

test("the goal check (FR-040): general terms, 120 characters at most, no effect name from the read", () => {
  const snap = { layer_info: [{ name: "Black Solid 1", effects: [{ name: "CC Light Sweep", match_name: "CC Light Sweep" }] }] };
  assert.equal(asked.checkGoalText("  a light  sweep that follows the logo ", snap), "a light sweep that follows the logo");
  assert.throws(() => asked.checkGoalText("make the CC Light Sweep follow", snap), (x) => x.code === "GOAL_NOT_GENERAL");
  assert.throws(() => asked.checkGoalText("make the cc light sweep follow", snap), (x) => x.code === "GOAL_NOT_GENERAL");
  assert.throws(() => asked.checkGoalText("x".repeat(121), snap), (x) => x.code === "GOAL_NOT_GENERAL");
  assert.equal(asked.checkGoalText("x".repeat(120), snap).length, 120);
  assert.equal(asked.checkGoalText(undefined, snap), null);
  assert.equal(asked.checkGoalText("   ", snap), null);
});

test("went_deeper, said and raised land on the entry with that date only", () => {
  write(base());
  const a = asked.recordAsked(entryArgs());
  const b = asked.recordAsked(entryArgs({ goal: "a softer landing" }));
  assert.notEqual(a.date, b.date, "same time, still a date of its own");
  assert.equal(asked.markWentDeeper(b.date, "easing.basic"), true);
  assert.ok(asked.setSaid(a.date, "said the steps worked"));
  assert.equal(asked.markRaised(a.date, NOW + 1000), true);
  assert.equal(asked.markRaised(a.date, NOW + 5000), true, "a second raise keeps the first time");
  const [ra, rb] = read().asked;
  assert.equal(ra.went_deeper, null);
  assert.equal(rb.went_deeper, "easing.basic");
  assert.equal(ra.said, "said the steps worked");
  assert.equal(rb.said, undefined);
  assert.equal(ra.raised, new Date(NOW + 1000).toISOString());
  assert.equal(asked.setSaid("2000-01-01T00:00:00.000Z", "x"), null, "no such entry");
  assert.throws(() => asked.setSaid(a.date, ""), (x) => x instanceof MentorError && x.code === "SAID_NOT_GENERAL");
  assert.throws(() => asked.setSaid(a.date, "y".repeat(121)), (x) => x.code === "SAID_NOT_GENERAL");
});

test("recommend() reads the same with asked entries present when none qualifies", () => {
  const now = new Date(NOW);
  const path = readPath();
  const plain = recommend({ path, record: base(), built: ["easing.basic", "transform.anchor"], now });
  const withAsked = recommend({ path, record: { ...base(), asked: [{ kind: "asked", date: "2026-11-18T10:00:00.000Z", skills: ["transform.anchor"], goal: "g" }] }, built: ["easing.basic", "transform.anchor"], now });
  assert.deepEqual(withAsked, plain);
});
