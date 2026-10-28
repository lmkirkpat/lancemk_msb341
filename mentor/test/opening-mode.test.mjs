// Spec 004 Phase 10, T401 (FR-048, FR-049, FR-051; contracts/skill-module.md § 4): the opening
// function picks lesson or review for a snapshot tool called without `mode`, and gives the tool this
// skill's slice of the learner record. Every row of FR-051's table that isn't about a reply's other
// fields, for each of the five skills with a review, with that skill's own finder on one live capture
// (Mentor Practice 2, where every one of them has a target). The time is injected; nothing here
// touches After Effects.

process.env.TZ = "America/Denver";

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const LEARNER = path.join(home, "learner.json");
const SESSION = path.join(home, "session.json");

const { opening } = await import("../lib/opening.mjs");
const session = await import("../lib/session.mjs");
const { recommend } = await import("../lib/recommend.mjs");
const { readPath, skillName } = await import("../lib/path.mjs");
const { SKILLS, FINDERS, TOOLS } = await import("../tools/index.mjs");

const readJsonFile = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const SNAP = readJsonFile(path.join(FIXTURES, "layer-info", "practice2b.json"));
const SNAP_MP = readJsonFile(path.join(FIXTURES, "layer-info", "practice-r1.json"));
const PROJECT = SNAP.project;
const COMP = SNAP.comp.name;
const PATH = readPath();

// The five snapshot tools of skills with a review (spec › The opening read › Applies to).
const FIVE = ["keyframes.types", "easing.speed_graph", "timing.offset", "transform.anchor", "parenting.null"].filter((id) => FINDERS[id]);
const NOW = new Date("2026-10-25T18:00:00.000Z"); // noon on 25 October, local
const ago = (h) => new Date(NOW.getTime() - h * 3600 * 1000).toISOString();

// Every layer of the capture with every property name a finder could match: as a record's past
// targets on this comp, it leaves no new target for any of the five.
function everything(snapshot) {
  const names = new Set([...snapshot.layers.map((l) => l.name), ...(snapshot.layer_info || []).map((l) => l.name)]);
  const out = [];
  for (const n of names) {
    const props = new Set(["Anchor Point", "Parent", "Position", "Scale", "Rotation", "Opacity"]);
    for (const l of snapshot.layers.filter((x) => x.name === n)) for (const p of l.properties) { props.add(p.display_name); if (p.display_path) props.add(p.display_path); }
    for (const p of props) out.push({ layer: n, property: p });
  }
  return out;
}
const ALL_OUT = everything(SNAP);

const lessonEntry = (skill, over = {}) => ({
  date: "2026-10-19T16:00:00.000Z", skill, project: PROJECT, comp: "Mentor Practice", attempted: "First go on this skill",
  result: "passed", demo_used: false, summary: "What the check showed.", next: "Try another layer.", kind: "first",
  targets: [{ layer: "Title", property: "Position" }], ...over,
});
const LEARNED_PREREQS = {
  "easing.basic": { status: "learned", last_practiced: "2026-10-12T18:00:00.000Z", times_passed: 1, next: "x", review_due: "2026-11-30", reviews_passed_in_row: 1 },
  "transform.anchor": { status: "learned", last_practiced: "2026-10-12T18:00:00.000Z", times_passed: 1, next: "x", review_due: "2026-11-30", reviews_passed_in_row: 1 },
};
function learned(skill, { due = true, lessons = [] } = {}) {
  return {
    version: 1,
    skills: {
      ...structuredClone(LEARNED_PREREQS),
      [skill]: { status: "learned", last_practiced: "2026-10-19T16:00:00.000Z", times_passed: 1, next: "Try another layer.", review_due: due ? "2026-10-20" : "2026-11-30", reviews_passed_in_row: 0 },
    },
    lessons: [lessonEntry(skill), ...lessons],
  };
}
const noNewTarget = (skill) => learned(skill, { lessons: [lessonEntry(skill, { comp: COMP, date: "2026-10-19T17:00:00.000Z", targets: ALL_OUT })] });
function practicing(skill) {
  return {
    version: 1,
    skills: { ...structuredClone(LEARNED_PREREQS), [skill]: { status: "practicing", last_practiced: "2026-10-24T18:00:00.000Z", times_passed: 0, next: "The last move still arrives moving." } },
    // The newest entry is first in the list on purpose: last_attempted goes by date.
    lessons: [
      lessonEntry(skill, { date: "2026-10-24T18:00:00.000Z", attempted: "Worked on Card", result: "partial", kind: "practice" }),
      lessonEntry(skill, { date: "2026-10-20T18:00:00.000Z", attempted: "Worked on Title", result: "partial" }),
    ],
  };
}

const writeRecord = (r) => fs.writeFileSync(LEARNER, JSON.stringify(r, null, 2));
const stub = () => ({ focus: [], targets: [], target_refs: [], demo_target: null });
const openLesson = (skill, mode = "lesson", snapshot = SNAP) => session.start(snapshot, { skill, analyze: stub, mode });
const pick = (skill, over = {}) => opening({ skill, snapshot: SNAP, finder: FINDERS[skill], now: NOW, ...over });
const other = (skill) => FIVE.find((s) => s !== skill);
const offersFor = (skill) => session.reviewOffers().filter((o) => o.skill === skill).length;

beforeEach(() => {
  for (const f of fs.readdirSync(home)) fs.rmSync(path.join(home, f), { force: true, recursive: true });
});

test("the capture: each of the five finders has a target, and the past-target list leaves none", () => {
  assert.equal(FIVE.length, 5);
  for (const skill of FIVE) {
    assert.ok(FINDERS[skill].focus(SNAP, {}).count > 0, `${skill} has a target on ${COMP}`);
    assert.equal(FINDERS[skill].focus(SNAP, { exclude: ALL_OUT }).count, 0, `${skill}: nothing new once every layer is a past target`);
  }
});

for (const skill of FIVE) {
  test(`${skill}: no record, or this skill not started → lesson, default`, () => {
    let o = pick(skill);
    assert.equal(o.mode, "lesson");
    assert.equal(o.mode_source, "default");
    assert.equal(o.learner.readable, true);
    assert.equal(o.learner.status, "not_started");
    assert.equal(o.learner.times_passed, 0);
    assert.equal(o.learner.next, null);
    assert.equal(o.learner.last_attempted, null);
    assert.equal(o.learner.days_since_practiced, null);
    assert.equal(o.learner.review_due, false);
    assert.equal("error" in o.learner, false);
    const others = structuredClone(LEARNED_PREREQS);
    delete others[skill];
    writeRecord({ version: 1, skills: others, lessons: [] });
    o = pick(skill);
    assert.equal(o.mode, "lesson");
    assert.equal(o.mode_source, "default");
    assert.equal(o.learner.status, "not_started");
    assert.equal(offersFor(skill), 0);
  });

  test(`${skill}: practicing → lesson, default, with next, last_attempted and days since`, () => {
    writeRecord(practicing(skill));
    const o = pick(skill);
    assert.equal(o.mode, "lesson");
    assert.equal(o.mode_source, "default");
    assert.equal(o.learner.status, "practicing");
    assert.equal(o.learner.next, "The last move still arrives moving.");
    assert.equal(o.learner.last_attempted, "Worked on Card", "the newest entry by date, not by place in the list");
    assert.equal(o.learner.days_since_practiced, 1);
    assert.equal(o.learner.review_due, false);
  });

  test(`${skill}: learned, not due → lesson, default, review_due false`, () => {
    writeRecord(learned(skill, { due: false }));
    const o = pick(skill);
    assert.deepEqual([o.mode, o.mode_source], ["lesson", "default"]);
    assert.equal(o.learner.status, "learned");
    assert.equal(o.learner.times_passed, 1);
    assert.equal(o.learner.review_due, false);
    assert.equal(offersFor(skill), 0);
  });

  test(`${skill}: learned, due, a new target → review, review_due; the offer remembered once`, () => {
    writeRecord(learned(skill));
    const o = pick(skill);
    assert.deepEqual([o.mode, o.mode_source], ["review", "review_due"]);
    assert.equal(o.learner.review_due, true);
    assert.equal(offersFor(skill), 1);
    const again = pick(skill);
    assert.deepEqual([again.mode, again.mode_source], ["review", "review_due"], "the review offered in this window comes back");
    assert.equal(offersFor(skill), 1, "offering it again doesn't add another");
  });

  test(`${skill}: learned, due, no new target in this comp → lesson, default (OR-1), review still due`, () => {
    writeRecord(noNewTarget(skill));
    const o = pick(skill);
    assert.deepEqual([o.mode, o.mode_source], ["lesson", "default"]);
    assert.equal(o.learner.review_due, true);
    assert.equal(offersFor(skill), 0);
  });

  test(`${skill}: learned, due, a practice lesson on it in the session window → lesson, default`, () => {
    writeRecord(learned(skill, { lessons: [lessonEntry(skill, { date: ago(1), kind: "practice", comp: "Elsewhere" })] }));
    const o = pick(skill);
    assert.deepEqual([o.mode, o.mode_source], ["lesson", "default"]);
    assert.equal(o.learner.review_due, true);
    // A review on it in the window doesn't block it (FR-020 counts practice only).
    writeRecord(learned(skill, { lessons: [lessonEntry(skill, { date: ago(1), kind: "review", comp: "Elsewhere" })] }));
    assert.equal(pick(skill).mode, "review");
  });

  test(`${skill}: learned, due, another skill's review offered in the window → lesson, default`, () => {
    writeRecord(learned(skill));
    session.recordReviewOffer(other(skill));
    const o = pick(skill);
    assert.deepEqual([o.mode, o.mode_source], ["lesson", "default"]);
    assert.equal(o.learner.review_due, true);
    assert.equal(offersFor(skill), 0);
  });

  test(`${skill}: an unreadable record → lesson, default; set aside intact, same error as read_learner_record, never throws`, async () => {
    const src = path.join(FIXTURES, "records", "unreadable.json");
    const bytes = fs.readFileSync(src);
    // What read_learner_record gives on a copy of the same file.
    fs.copyFileSync(src, LEARNER);
    let expected = null;
    await assert.rejects(TOOLS.find((t) => t.name === "read_learner_record").handler({}), (e) => {
      expected = { code: e.code, message: e.message };
      return true;
    });
    for (const f of fs.readdirSync(home)) fs.rmSync(path.join(home, f), { force: true });

    fs.copyFileSync(src, LEARNER);
    let o;
    assert.doesNotThrow(() => { o = pick(skill); });
    assert.deepEqual([o.mode, o.mode_source], ["lesson", "default"]);
    assert.equal(o.learner.readable, false);
    assert.deepEqual(o.learner.error, expected);
    assert.equal(o.learner.error.code, "RECORD_UNREADABLE");
    assert.equal(o.learner.status, "not_started");
    assert.equal(o.learner.review_due, false);
    assert.ok(o.learner.other_skills.every((s) => s.learned === false));
    assert.equal(o.record, null);
    assert.equal(fs.existsSync(LEARNER), false, "set aside, never written over");
    const aside = fs.readdirSync(home).filter((f) => f.startsWith("learner.json.unreadable-"));
    assert.equal(aside.length, 1);
    assert.deepEqual(fs.readFileSync(path.join(home, aside[0])), bytes, "the original bytes, intact");
    // The next call finds no file and reads as empty, so it's said once.
    const next = pick(skill);
    assert.equal(next.learner.readable, true);
    assert.equal("error" in next.learner, false);
  });

  test(`${skill}: an unreadable record that was due never picks a review`, () => {
    fs.writeFileSync(LEARNER, JSON.stringify(learned(skill)).slice(0, -5));
    const o = pick(skill);
    assert.deepEqual([o.mode, o.mode_source], ["lesson", "default"]);
    assert.equal(offersFor(skill), 0);
  });

  test(`${skill}: asks for a review, none due → review, asked`, () => {
    writeRecord(learned(skill, { due: false }));
    const o = pick(skill, { mode: "review" });
    assert.deepEqual([o.mode, o.mode_source], ["review", "asked"]);
    assert.equal(o.learner.review_due, false);
    assert.equal(offersFor(skill), 0, "an asked-for review isn't an offer");
  });

  test(`${skill}: asks for a review, not learned ("already knew it") → review, asked`, () => {
    let o = pick(skill, { mode: "review" });
    assert.deepEqual([o.mode, o.mode_source, o.learner.status], ["review", "asked", "not_started"]);
    writeRecord(practicing(skill));
    o = pick(skill, { mode: "review" });
    assert.deepEqual([o.mode, o.mode_source, o.learner.status], ["review", "asked", "practicing"]);
  });

  test(`${skill}: turns a due review down (mode lesson) → lesson, asked, review still due`, () => {
    writeRecord(learned(skill));
    const o = pick(skill, { mode: "lesson" });
    assert.deepEqual([o.mode, o.mode_source], ["lesson", "asked"]);
    assert.equal(o.learner.review_due, true);
    assert.equal(offersFor(skill), 0);
  });

  test(`${skill}: a review in progress, a later call without mode → review, in_progress (continued)`, () => {
    writeRecord(learned(skill));
    const first = pick(skill);
    assert.equal(first.mode, "review");
    openLesson(skill, first.mode);
    writeRecord(learned(skill, { due: false })); // whatever the record says now
    const o = pick(skill);
    assert.deepEqual([o.mode, o.mode_source], ["review", "in_progress"]);
    assert.equal(openLesson(skill, o.mode).lesson, "continued");
  });

  test(`${skill}: a lesson in progress on a learned skill whose review is due → lesson, in_progress (continued)`, () => {
    writeRecord(learned(skill));
    openLesson(skill, "lesson"); // the learner turned the review down
    const o = pick(skill);
    assert.deepEqual([o.mode, o.mode_source], ["lesson", "in_progress"]);
    assert.equal(o.learner.review_due, true);
    assert.equal(offersFor(skill), 0);
    assert.equal(openLesson(skill, o.mode).lesson, "continued");
  });

  test(`${skill}: resumed after another skill's lesson, its mode matching the record's choice → resumed`, () => {
    writeRecord(learned(skill, { due: false }));
    openLesson(skill, "lesson");
    openLesson(other(skill), "lesson");
    const o = pick(skill);
    assert.deepEqual([o.mode, o.mode_source], ["lesson", "default"]);
    assert.equal(openLesson(skill, o.mode).lesson, "resumed");
  });

  test(`${skill}: an open practice lesson, resumed, on a skill now due with a new target → review, review_due, a new lesson`, () => {
    writeRecord(learned(skill));
    openLesson(skill, "lesson");
    openLesson(other(skill), "lesson");
    const o = pick(skill);
    assert.deepEqual([o.mode, o.mode_source], ["review", "review_due"]);
    assert.equal(openLesson(skill, o.mode).lesson, "new");
  });

  test(`${skill}: a continued lesson from an earlier day (stale) → by steps 3 and 4, not its old mode`, () => {
    writeRecord(learned(skill, { due: false }));
    openLesson(skill, "review");
    const state = readJsonFile(SESSION);
    const key = String(state.current);
    state.lessons[key].lesson_id = "2026-01-02T18:00:00.000Z";
    fs.writeFileSync(SESSION, JSON.stringify(state));
    const o = pick(skill);
    assert.deepEqual([o.mode, o.mode_source], ["lesson", "default"]);
    writeRecord(learned(skill));
    assert.deepEqual([pick(skill).mode, pick(skill).mode_source], ["review", "review_due"]);
  });

  test(`${skill}: an unreadable session file → SESSION_UNREADABLE, as today`, () => {
    fs.writeFileSync(SESSION, "{ not json");
    assert.throws(() => pick(skill), { code: "SESSION_UNREADABLE" });
  });

  test(`${skill}: other_skills names the hard prerequisites (no on-ramp) and the finder's mentions, by name`, () => {
    const s = PATH.skills.find((x) => x.id === skill);
    const mentions = FINDERS[skill].mentions || [];
    const expect = (learnedIds) => [
      ...s.hard.filter((id) => id !== PATH.on_ramp.id).map((id) => ({ skill_name: skillName(id), learned: learnedIds.includes(id), hard: true })),
      ...mentions.filter((id) => !s.hard.includes(id)).map((id) => ({ skill_name: skillName(id), learned: learnedIds.includes(id), hard: false })),
    ];
    assert.deepEqual(pick(skill).learner.other_skills, expect([]));
    writeRecord(learned(skill));
    assert.deepEqual(pick(skill).learner.other_skills, expect(["easing.basic", "transform.anchor"]));
  });

  test(`${skill}: learner holds no skill ID, no record file name and no path`, () => {
    const ids = [PATH.on_ramp.id, ...PATH.skills.map((x) => x.id)];
    for (const r of [null, practicing(skill), learned(skill), learned(skill, { due: false })]) {
      for (const f of fs.readdirSync(home)) fs.rmSync(path.join(home, f), { force: true });
      if (r) writeRecord(r);
      const text = JSON.stringify(pick(skill).learner);
      for (const id of ids) assert.ok(!text.includes(`"${id}"`) && !(id.includes(".") && text.includes(id)), `${skill}: no ${id}`);
      assert.ok(!text.includes("learner.json"));
      assert.ok(!text.includes(home));
      assert.ok(!/"(skills|lessons|path)"/.test(text), "no lesson list or record keys");
    }
  });

  test(`${skill}: reading the record never writes it`, () => {
    writeRecord(learned(skill));
    const before = fs.readFileSync(LEARNER, "utf8");
    const mtime = fs.statSync(LEARNER).mtimeMs;
    pick(skill);
    assert.equal(fs.readFileSync(LEARNER, "utf8"), before);
    assert.equal(fs.statSync(LEARNER).mtimeMs, mtime);
  });
}

for (const skill of ["keyframes.types", "transform.anchor"].filter((s) => FINDERS[s])) {
  test(`${skill}: fresh: true → the open lesson's mode, in_progress`, () => {
    writeRecord(learned(skill));
    openLesson(skill, "lesson");
    let o = pick(skill, { fresh: true });
    assert.deepEqual([o.mode, o.mode_source], ["lesson", "in_progress"]);
    for (const f of fs.readdirSync(home)) fs.rmSync(path.join(home, f), { force: true });
    writeRecord(learned(skill, { due: false }));
    openLesson(skill, "review");
    o = pick(skill, { fresh: true });
    assert.deepEqual([o.mode, o.mode_source], ["review", "in_progress"]);
  });
}

test("days since practiced counts local calendar days, not 24-hour spans", () => {
  const skill = FIVE[0];
  const r = practicing(skill);
  r.skills[skill].last_practiced = "2026-10-25T03:00:00.000Z"; // 9 pm on the 24th, local: 15 hours ago
  writeRecord(r);
  assert.equal(pick(skill).learner.days_since_practiced, 1);
  r.skills[skill].last_practiced = "2026-10-25T15:00:00.000Z"; // this morning
  writeRecord(r);
  assert.equal(pick(skill).learner.days_since_practiced, 0);
  r.skills[skill].last_practiced = "2026-10-18T19:00:00.000Z"; // a week ago
  writeRecord(r);
  assert.equal(pick(skill).learner.days_since_practiced, 7);
});

// FR-051's last line: the snapshot tool picks a review exactly when recommend_next offers this
// skill's review on the same comp and time. recommend_next offers one review at most, and once it
// has, that's the window's only review, so the check runs on the session recommend_next leaves
// behind. Where recommend_next offers none (nothing due, or a skill in progress ranks first), the
// same one-skill test decides: recommend() with only this skill built offers its review exactly when
// the opening picks it.
const RECORD_DIRS = [
  path.join(FIXTURES, "records"),
  ...["anchor", "key-types", "null-parenting", "offset"].map((d) => path.join(FIXTURES, d, "records")),
];
const savedRecords = () => RECORD_DIRS.flatMap((d) => fs.readdirSync(d).filter((f) => f.endsWith(".json")).map((f) => path.join(d, f)))
  .concat(path.join(FIXTURES, "speed-graph", "record-learned-title.json"));
const AT = new Date("2026-10-21T21:00:00.000Z");

test("each saved record: the opening picks a review exactly when recommend_next offers that skill's review", () => {
  let compared = 0;
  let reviews = 0;
  for (const file of savedRecords()) {
    const text = fs.readFileSync(file, "utf8");
    let record;
    try { record = JSON.parse(text); } catch { continue; } // unreadable.json: its own row above
    for (const snapshot of [SNAP, SNAP_MP]) {
      const full = recommend({ path: PATH, record, built: SKILLS, finders: FINDERS, snapshot, now: AT, offers: [] });
      const offered = full.recommendation && full.recommendation.kind === "review" ? full.recommendation.skill : null;
      for (const skill of FIVE) {
        for (const f of fs.readdirSync(home)) fs.rmSync(path.join(home, f), { force: true });
        fs.writeFileSync(LEARNER, text);
        if (offered) session.recordReviewOffer(offered);
        const o = opening({ skill, snapshot, finder: FINDERS[skill], now: AT });
        let want;
        if (offered) want = skill === offered;
        else {
          const one = recommend({ path: PATH, record, built: [skill], finders: { [skill]: FINDERS[skill] }, snapshot, now: AT, offers: [] });
          want = !!(one.recommendation && one.recommendation.kind === "review");
        }
        assert.equal(o.mode === "review", want, `${path.basename(file)} on ${snapshot.comp.name}, ${skill}`);
        if (want) assert.equal(o.mode_source, "review_due");
        if (o.mode === "review") reviews++;
        compared++;
      }
    }
  }
  assert.ok(compared > 100);
  assert.ok(reviews > 0, "some saved record picks a review");
});

test("the review test is the one recommend() uses: exported from recommend.mjs", async () => {
  const rec = await import("../lib/recommend.mjs");
  assert.equal(typeof rec.reviewFor, "function");
  const record = readJsonFile(path.join(FIXTURES, "records", "first-three-learned-review-due.json"));
  const r = rec.reviewFor({ skill: "keyframes.types", record, finders: FINDERS, snapshot: SNAP_MP, now: AT, offers: [] });
  const full = recommend({ path: PATH, record, built: SKILLS, finders: FINDERS, snapshot: SNAP_MP, now: AT, offers: [] });
  assert.equal(full.recommendation.kind, "review");
  assert.equal(full.recommendation.skill, "keyframes.types");
  assert.deepEqual(r.layers, full.recommendation.focus_layers);
});
