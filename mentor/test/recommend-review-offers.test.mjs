// Spec 004 review, round 5b: recommend() re-offers the review it already offered in this 3-hour
// window (still at most one per window), says whether a requested skill has a review mode, and
// hands each finder the kept-linear marks that apply, so easing's focus agrees with its analyzer
// (contracts/skill-module.md › 2).

process.env.TZ = "America/Denver";

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { recommend, SESSION_WINDOW_HOURS } from "../lib/recommend.mjs";
import { readPath } from "../lib/path.mjs";
import { FINDERS as EASING_FINDERS } from "../tools/easing.mjs";
import { FIXTURES } from "./helpers.mjs";

const NOW = new Date("2026-10-21T21:00:00.000Z");
const PATH = readPath();
const BUILT = ["easing.basic", "keyframes.types", "easing.speed_graph", "timing.offset"];
const SNAP = { project: "Claude AE Tutor Test.aep", comp: { id: 97, name: "Mentor Practice" }, layers: [], precomp_layers: [] };
const load = (name) => JSON.parse(fs.readFileSync(path.join(FIXTURES, "records", `${name}.json`), "utf8"));
const practice = JSON.parse(fs.readFileSync(path.join(FIXTURES, "practice-before.json"), "utf8"));
const POS = "ADBE Transform Group/ADBE Position";
const hoursAgo = (h) => new Date(NOW.getTime() - h * 3600 * 1000).toISOString();

const seen = [];
const finder = (cands, review) => ({
  focus(snapshot, opts = {}) {
    seen.push(opts);
    const exclude = opts.exclude || [];
    const left = cands.filter((c) => !exclude.some((e) => e.layer === c.layer && e.property === c.property));
    return { count: left.length, layers: [...new Set(left.map((c) => c.layer))] };
  },
  review,
});
const FINDERS = {
  "easing.basic": finder([{ layer: "Title", property: "Position" }], false),
  "keyframes.types": finder([{ layer: "Cursor", property: "Opacity" }, { layer: "Blink", property: "Opacity" }], true),
  "easing.speed_graph": finder([], true),
  "timing.offset": finder([{ layer: "Title", property: "Position" }], true),
};
const run = (record, over = {}) => recommend({ path: PATH, record, built: BUILT, finders: FINDERS, snapshot: SNAP, now: NOW, offers: [], ...over });

// ---- Re-offering within the window

test("a review offered in this window is offered again on a repeat call", () => {
  const due = load("first-three-learned-review-due");
  const first = run(due);
  assert.equal(first.recommendation.kind, "review");
  assert.equal(first.recommendation.skill, "keyframes.types");
  const again = run(due, { offers: [{ skill: "keyframes.types", at: hoursAgo(1) }] });
  assert.deepEqual(again.recommendation, first.recommendation);
});

test("still at most one review per window: another due skill isn't offered instead", () => {
  const due = load("first-three-learned-review-due");
  const r = run(due, { offers: [{ skill: "timing.offset", at: hoursAgo(1) }] });
  assert.equal(r.recommendation.skill, "timing.offset", "the one already offered, not key types first in the path");
  const twoOffers = run(due, { offers: [{ skill: "timing.offset", at: hoursAgo(2) }, { skill: "keyframes.types", at: hoursAgo(1) }] });
  assert.equal(twoOffers.recommendation.skill, "timing.offset", "the first offer in the window is the one");
});

test("the offered review drops out once it no longer qualifies, and no other review takes its place", () => {
  const due = load("first-three-learned-review-due");
  due.skills["keyframes.types"].review_due = "2026-10-30"; // reviewed since
  const r = run(due, { offers: [{ skill: "keyframes.types", at: hoursAgo(1) }] });
  assert.equal(r.recommendation, null, "offset is due too, but the window's one review was key types");
  assert.equal(r.reason, "nothing_left");
});

test("an offer from before the window doesn't count", () => {
  const due = load("first-three-learned-review-due");
  const r = run(due, { offers: [{ skill: "timing.offset", at: hoursAgo(SESSION_WINDOW_HOURS + 0.5) }] });
  assert.equal(r.recommendation.skill, "keyframes.types");
});

// ---- review_available

test("requested: review_available says whether the skill has a review mode", () => {
  const r = load("easing-learned");
  assert.equal(run(r, { requested_skill: "easing.basic" }).requested.review_available, false, "easing has none");
  assert.equal(run(r, { requested_skill: "keyframes.types" }).requested.review_available, true);
  assert.equal(run(r, { requested_skill: "parenting.null" }).requested.review_available, false, "no finder");
});

// ---- Finders get the kept-linear marks that apply

test("finders get the kept-linear marks that apply to this comp, and none that don't", () => {
  const rec = load("easing-learned-kept-linear");
  seen.length = 0;
  run(rec, { snapshot: practice });
  assert.ok(seen.length > 0);
  for (const opts of seen) assert.deepEqual(opts.kept_linear.map((m) => `${m.layer}/${m.path}`), [`CTRL/${POS}`]);
  const moved = structuredClone(practice);
  moved.layers.find((l) => l.name === "CTRL").properties[0].keys[1].time = 2; // the mark lapses
  seen.length = 0;
  run(rec, { snapshot: moved });
  for (const opts of seen) assert.deepEqual(opts.kept_linear, []);
});

test("easing's finder leaves kept-linear properties out", () => {
  const marks = load("easing-learned-kept-linear").marks;
  const all = EASING_FINDERS["easing.basic"].focus(practice, {});
  const kept = EASING_FINDERS["easing.basic"].focus(practice, { kept_linear: marks });
  assert.ok(all.layers.includes("CTRL"));
  assert.equal(kept.layers.includes("CTRL"), false);
  assert.equal(kept.count, all.count - 1, "CTRL Position has one pair");
});

test("only a kept-linear property left: no easing focus", () => {
  const onlyCtrl = { ...structuredClone(practice), layers: practice.layers.filter((l) => l.name === "CTRL") };
  const rec = { version: 1, skills: {}, lessons: [], marks: load("easing-learned-kept-linear").marks };
  const r = recommend({ path: PATH, record: rec, built: ["easing.basic"], finders: EASING_FINDERS, snapshot: onlyCtrl, now: NOW, offers: [] });
  assert.equal(r.recommendation.skill, "easing.basic");
  assert.equal(r.recommendation.reason, "next_in_path_no_focus");
  assert.equal(r.recommendation.focus_layers, null);
  const asked = recommend({ path: PATH, record: rec, built: ["easing.basic"], finders: EASING_FINDERS, snapshot: onlyCtrl, now: NOW, offers: [], requested_skill: "easing.basic" });
  assert.equal(asked.requested.has_focus, false);
  const noMarks = recommend({ path: PATH, record: { version: 1, skills: {}, lessons: [] }, built: ["easing.basic"], finders: EASING_FINDERS, snapshot: onlyCtrl, now: NOW, offers: [] });
  assert.equal(noMarks.recommendation.reason, "next_in_path", "without the mark, CTRL is something to ease");
});
