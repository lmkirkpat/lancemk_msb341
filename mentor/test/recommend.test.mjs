// FR-004 to FR-007, FR-020's limits, SC-005: recommend() on saved learner records, with stub finders
// and a fixed `now`. Deterministic, so every expected result is written out in full.

process.env.TZ = "America/Denver";

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { recommend, SESSION_WINDOW_HOURS } from "../lib/recommend.mjs";
import { readPath } from "../lib/path.mjs";
import { FIXTURES } from "./helpers.mjs";

const NOW = new Date("2026-10-21T21:00:00.000Z"); // 15:00 in Denver
const PATH = readPath();
const BUILT = ["easing.basic", "keyframes.types", "easing.speed_graph", "timing.offset"];
const SNAP = { project: "Claude AE Tutor Test.aep", comp: { id: 97, name: "Mentor Practice" }, layers: [], precomp_layers: [] };
const DIR = path.join(FIXTURES, "records");
const RECORDS = fs.readdirSync(DIR).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
function load(name) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DIR, `${name}.json`), "utf8"));
  } catch {
    return null; // unreadable, as the tool passes it
  }
}

// Stub finders: each has fixed candidates, minus `exclude`.
const finder = (cands, review) => ({
  focus(snapshot, { exclude = [] } = {}) {
    const left = cands.filter((c) => !exclude.some((e) => e.layer === c.layer && e.property === c.property));
    return { count: left.length, layers: [...new Set(left.map((c) => c.layer))] };
  },
  review,
});
const FINDERS = {
  "easing.basic": finder([{ layer: "Title", property: "Position" }, { layer: "Title", property: "Scale" }], false),
  "keyframes.types": finder([{ layer: "Cursor", property: "Opacity" }, { layer: "Blink", property: "Opacity" }], true),
  "easing.speed_graph": finder([], true),
  "timing.offset": finder([{ layer: "Title", property: "Position" }], true),
};
const EMPTY = Object.fromEntries(Object.keys(FINDERS).map((id) => [id, finder([], FINDERS[id].review)]));

const run = (record, over = {}) => recommend({ path: PATH, record, built: BUILT, finders: FINDERS, snapshot: SNAP, now: NOW, offers: [], ...over });
const rec = (skill, kind, reason, focus_layers, offer_practice_comp = false) => ({
  skill, skill_name: PATH.skills.find((s) => s.id === skill).name, kind, reason, focus_layers, offer_practice_comp,
});
const looked = { looked_at_comp: true, comp: "Mentor Practice", record_readable: true };

const EXPECTED = {
  empty: { ...looked, recommendation: rec("easing.basic", "lesson", "next_in_path", ["Title"]) },
  "easing-practicing": { ...looked, recommendation: rec("easing.basic", "continue", "in_progress", ["Title"]) },
  "easing-learned": { ...looked, recommendation: rec("keyframes.types", "lesson", "next_in_path", ["Cursor", "Blink"]) },
  "easing-learned-old-v1": { ...looked, recommendation: rec("keyframes.types", "lesson", "next_in_path", ["Cursor", "Blink"]) },
  "easing-learned-kept-linear": { ...looked, recommendation: rec("keyframes.types", "lesson", "next_in_path", ["Cursor", "Blink"]) },
  "speed-graph-practicing": { ...looked, recommendation: rec("easing.speed_graph", "continue", "in_progress", []) },
  "speed-graph-and-key-types-practicing": { ...looked, recommendation: rec("keyframes.types", "continue", "in_progress", ["Cursor", "Blink"]) },
  // Key types is due (2026-10-20) and Cursor was its target here, so Blink is new.
  "first-three-learned-review-due": { ...looked, recommendation: rec("keyframes.types", "review", "review_due", ["Blink"]) },
  "first-three-learned-none-due": { ...looked, recommendation: null, reason: "nothing_left" },
  // Key types was practiced 1.5 hours ago, so the other due review (offset, due today) is offered.
  "review-due-practiced-today": { ...looked, recommendation: rec("timing.offset", "review", "review_due", ["Title"]) },
  "all-built-learned": { ...looked, recommendation: null, reason: "nothing_left" },
  // Speed graph is practicing, but easing (its hard prerequisite) isn't learned: easing comes first.
  "hard-prereq-missing": { ...looked, recommendation: rec("easing.basic", "lesson", "next_in_path", ["Title"]) },
  // Offset was learned as "already knew it" on Mentor Practice 2, so Title here is a new target.
  "already-knew": { ...looked, recommendation: rec("timing.offset", "review", "review_due", ["Title"]) },
  unreadable: { ...looked, record_readable: false, recommendation: rec("easing.basic", "lesson", "next_in_path", ["Title"]) },
};

test("every saved record has an expected result (at least 12, SC-005)", () => {
  assert.ok(RECORDS.length >= 12);
  assert.deepEqual([...RECORDS].sort(), Object.keys(EXPECTED).sort());
});

for (const name of Object.keys(EXPECTED)) {
  test(`record ${name}`, () => assert.deepEqual(run(load(name)), EXPECTED[name]));
}

test("step order: a skill in progress beats a due review (C2)", () => {
  const r = load("first-three-learned-review-due");
  r.skills["easing.speed_graph"] = { status: "practicing", last_practiced: "2026-10-01T10:00:00.000Z", times_passed: 0, next: "x" };
  assert.equal(run(r).recommendation.kind, "continue");
  assert.equal(run(r).recommendation.skill, "easing.speed_graph");
});

test("a due review needs review: true, a new target, no other review offered in the window, and no practice in it", () => {
  const due = load("first-three-learned-review-due");
  const noReview = { ...FINDERS, "keyframes.types": { ...FINDERS["keyframes.types"], review: false } };
  assert.equal(run(due, { finders: noReview }).recommendation.skill, "timing.offset", "key types can't review yet; offset is due too");
  const noTarget = { ...FINDERS, "keyframes.types": finder([{ layer: "Cursor", property: "Opacity" }], true) };
  assert.equal(run(due, { finders: noTarget }).recommendation.skill, "timing.offset", "Cursor was its target here already");

  const hoursAgo = (h) => new Date(NOW.getTime() - h * 3600 * 1000).toISOString();
  const recent = run(due, { offers: [{ skill: "timing.offset", at: hoursAgo(1) }] });
  assert.deepEqual(recent, { ...looked, recommendation: rec("timing.offset", "review", "review_due", ["Title"]) },
    "one unprompted review per session: the one already offered comes back, not key types");
  const old = run(due, { offers: [{ skill: "timing.offset", at: hoursAgo(SESSION_WINDOW_HOURS + 0.5) }] });
  assert.equal(old.recommendation.kind, "review", "an offer more than 3 hours ago doesn't count");
});

test("at most one review is returned", () => {
  const r = run(load("first-three-learned-review-due"));
  assert.equal(typeof r.recommendation, "object");
  assert.equal(Array.isArray(r.recommendation), false);
  assert.equal(r.recommendation.skill, "keyframes.types", "path order breaks the tie with offset");
});

test("step 3: soft prerequisites all learned come first, then path order", () => {
  const r = load("easing-learned");
  // Speed graph (position 2) has a soft prerequisite (key types) not learned; offset (3) has none.
  const finders = { ...FINDERS, "keyframes.types": finder([], true), "easing.speed_graph": finder([{ layer: "Title", property: "Position" }], true) };
  assert.deepEqual(run(r, { finders }).recommendation, rec("timing.offset", "lesson", "next_in_path", ["Title"]));
  const noOffset = { ...finders, "timing.offset": finder([], true) };
  assert.deepEqual(run(r, { finders: noOffset }).recommendation, rec("easing.speed_graph", "lesson", "next_in_path", ["Title"]), "soft never blocks");
});

test("step 4: nothing in the comp for any skill offers the practice comp", () => {
  assert.deepEqual(run(load("easing-learned"), { finders: EMPTY }).recommendation,
    rec("keyframes.types", "lesson", "next_in_path_no_focus", null, true));
});

test("AE unreachable: record only, no practice comp, no review", () => {
  const blind = { looked_at_comp: false, comp: null, record_readable: true };
  assert.deepEqual(run(load("easing-learned"), { snapshot: null }),
    { ...blind, recommendation: rec("keyframes.types", "lesson", "next_in_path_no_focus", null, false) });
  assert.deepEqual(run(load("first-three-learned-review-due"), { snapshot: null }), { ...blind, recommendation: null, reason: "nothing_left" });
  assert.deepEqual(run(load("easing-practicing"), { snapshot: null }),
    { ...blind, recommendation: rec("easing.basic", "continue", "in_progress", null) });
});

test("unbuilt skills and skills with an unlearned hard prerequisite never come back (SC-005)", () => {
  const builtSets = [["easing.basic"], BUILT, [...BUILT, "transform.anchor", "parenting.null", "motion.sources", "precomp.basic"]];
  let checked = 0;
  for (const name of RECORDS) {
    for (const built of builtSets) {
      for (const snapshot of [SNAP, null]) {
        for (const finders of [FINDERS, EMPTY]) {
          const record = load(name);
          const r = run(record, { built, snapshot, finders });
          checked++;
          if (!r.recommendation) continue;
          const s = PATH.skills.find((x) => x.id === r.recommendation.skill);
          assert.ok(built.includes(s.id), `${name}: ${s.id} isn't built`);
          const learned = (id) => id === "keyframes" || record?.skills?.[id]?.status === "learned";
          assert.ok(s.hard.every(learned), `${name}: ${s.id} has an unlearned hard prerequisite`);
          if (r.recommendation.kind === "review") assert.ok(learned(s.id), `${name}: review of an unlearned skill`);
        }
      }
    }
  }
  assert.ok(checked >= 12 * 12);
  assert.deepEqual(run(load("easing-learned"), { built: ["easing.basic"] }), { ...looked, recommendation: null, reason: "nothing_left" });
});

test("requested_skill: built, learned, hard prerequisites missing, focus", () => {
  const r = run(load("hard-prereq-missing"), { requested_skill: "easing.speed_graph" });
  assert.deepEqual(r.requested, {
    skill: "easing.speed_graph", skill_name: "Shape the ease in the speed graph", built: true, learned: false,
    missing_prerequisites: [{ skill: "easing.basic", skill_name: "Easing" }], has_focus: false, review_available: true,
  });
  const unbuilt = run(load("easing-learned"), { requested_skill: "parenting.null" }).requested;
  assert.deepEqual(unbuilt, {
    skill: "parenting.null", skill_name: "Move a group with a null", built: false, learned: false,
    missing_prerequisites: [{ skill: "transform.anchor", skill_name: "Set the pivot (anchor point)" }], has_focus: false,
    review_available: false,
  });
  assert.deepEqual(run(load("empty"), { requested_skill: "motion.sources" }).requested.missing_prerequisites, [], "skill 4: keyframes only (FR-007)");
  const byName = run(load("easing-learned"), { requested_skill: "pick the key type on purpose" }).requested;
  assert.equal(byName.skill, "keyframes.types", "found by name too");
  assert.equal(byName.has_focus, true);
  assert.deepEqual(run(load("empty"), { requested_skill: "juggling" }).requested,
    { skill: "juggling", skill_name: null, built: false, learned: false, missing_prerequisites: [], has_focus: false });
  assert.equal("requested" in run(load("empty")), false);
  assert.equal(run(load("easing-learned"), { requested_skill: "keyframes.types", snapshot: null }).requested.has_focus, false);
});

test("no review is ever recommended for a skill that isn't learned", () => {
  const r = load("easing-learned");
  r.skills["keyframes.types"] = { status: "practicing", last_practiced: "2026-10-01T10:00:00.000Z", times_passed: 0, next: "x", review_due: "2026-10-02" };
  assert.equal(run(r).recommendation.kind, "continue");
  delete r.skills["keyframes.types"];
  assert.notEqual(run(r).recommendation.kind, "review");
});

test("an unreadable record: every skill not started, record_readable false", () => {
  assert.deepEqual(run(null), EXPECTED.unreadable);
});

test("same input, same output", () => {
  for (const name of RECORDS) assert.deepEqual(run(load(name)), run(load(name)), name);
});
