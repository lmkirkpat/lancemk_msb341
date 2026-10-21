// Spec 004's session contract (contracts/skill-module.md › 4, data-model › Session lesson): lessons
// per skill and comp, an analyzer passed in, review mode, review offers, a skill's own analyzer
// options kept across a resumed lesson (T060), and a fresh restart before any demo or check (T062).

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fixture, tempHome } from "./helpers.mjs";

const home = tempHome();
const session = await import("../lib/session.mjs");
const { analyze } = await import("../lib/analyze.mjs");

const SESSION = path.join(home, "session.json");
const LEARNER = path.join(home, "learner.json");
const A = fixture("attempt-before");          // comp 200 "Lower Third", project Synthetic.aep
const A_DONE = fixture("attempt-complete");   // comp 200, Title eased
const B = fixture("linear-basic");            // comp 100
const POS1 = "1/ADBE Transform Group/ADBE Position/1";

// A small analyzer: one target per keyed property, not in `exclude`, on the focus layers. It always
// proposes the first target as the demo, so the session's own rules (review, one target) show.
const calls = [];
function stub(snapshot, opts = {}) {
  calls.push(structuredClone(opts));
  const exclude = opts.exclude || [];
  const focus = opts.focus_layers && opts.focus_layers.length ? opts.focus_layers : null;
  const targets = [];
  const target_refs = [];
  for (const layer of snapshot.layers) {
    if (focus && !focus.includes(layer.name)) continue;
    for (const prop of layer.properties) {
      if (exclude.some((e) => e.layer === layer.name && e.property === prop.display_name)) continue;
      targets.push(`${layer.index}:${prop.path}`);
      target_refs.push({ layer: layer.name, property: prop.display_name });
    }
  }
  return { targets, target_refs, demo_target: targets[0] ?? null, no_demo_reason: targets.length ? null : "nothing_to_teach", focus };
}
const none = () => ({ targets: [], target_refs: [], demo_target: null, no_demo_reason: "nothing_to_teach", focus: null });

const S = { skill: "sample.one", analyze: stub };
const fileText = () => (fs.existsSync(SESSION) ? fs.readFileSync(SESSION, "utf8") : null);
const file = () => JSON.parse(fs.readFileSync(SESSION, "utf8"));

beforeEach(() => {
  fs.rmSync(SESSION, { force: true });
  fs.rmSync(LEARNER, { force: true });
  calls.length = 0;
});

// ---- Easing, as today

test("start(snapshot) with no options is easing's lesson, keyed by comp id as today", () => {
  const s = session.start(A);
  assert.equal(s.lesson, "new");
  assert.equal(s.session.skill, "easing.basic");
  assert.equal(s.session.mode, "lesson");
  assert.deepEqual(s.analysis.targets, analyze(A).targets);
  assert.equal(s.analysis.demo_target, POS1);
  const f = file();
  assert.equal(f.current, 200);
  assert.ok(f.lessons["200"], "easing's key has no skill prefix, so older files and newer agree");
});

test("an old session.json with a comp-id key is continued as easing's lesson", () => {
  const old = {
    version: 1, current: 200,
    lessons: {
      200: {
        lesson_id: "2026-10-10T10:00:00.000Z", comp_id: 200, baseline: A, focus: null, targets: analyze(A).targets,
        demo_target: null, demo: { segment_id: POS1, at: "2026-10-10T10:01:00.000Z" }, status: "demo_done", passed: false,
      },
    },
  };
  fs.writeFileSync(SESSION, JSON.stringify(old));
  const s = session.start(A);
  assert.equal(s.lesson, "continued");
  assert.equal(s.session.lesson_id, "2026-10-10T10:00:00.000Z");
  assert.equal(s.session.skill, "easing.basic");
  assert.equal(session.currentLesson().demo.segment_id, POS1);
  assert.throws(() => session.recordDemo(POS1), { code: "DEMO_USED" });
});

test("easing's target_refs come from its targets' layer and property names", () => {
  const s = session.start(A);
  assert.deepEqual(s.session.target_refs, [
    { layer: "Title", property: "Position" }, { layer: "Title", property: "Position" },
    { layer: "Title", property: "Scale" }, { layer: "Title", property: "Opacity" },
    { layer: "Subtitle", property: "Opacity" },
  ]);
  assert.equal("skill_options" in s.session, false, "easing with no skill_options stores none");
});

// ---- Several skills

test("two skills on one comp keep separate lessons; the current one is the last started", () => {
  session.start(A);
  session.recordDemo(POS1);
  const other = session.start(A, S);
  assert.equal(other.lesson, "new");
  assert.equal(session.currentLesson().skill, "sample.one");
  assert.equal(session.currentLesson().demo, null);
  const back = session.start(A);
  assert.equal(back.lesson, "resumed");
  assert.equal(session.currentLesson().skill, "easing.basic");
  assert.equal(session.currentLesson().demo.segment_id, POS1, "the other skill didn't overwrite easing's lesson");
  assert.equal(Object.keys(file().lessons).length, 2);
});

test("target_refs are stored as the analyzer gives them", () => {
  const s = session.start(A, S);
  assert.deepEqual(s.session.target_refs, stub(A).target_refs);
  assert.deepEqual(s.session.targets, stub(A).targets);
});

test("one target: the session forces no demo (single_target), whatever the analyzer proposed", () => {
  const s = session.start(A, { ...S, focus_layers: ["Subtitle"] });
  assert.equal(s.session.targets.length, 1);
  assert.equal(s.analysis.demo_target, null);
  assert.equal(s.session.demo_target, null);
  assert.equal(s.analysis.no_demo_reason, "single_target");
  assert.throws(() => session.assertCanDemo(s.session.targets[0]), { code: "NOT_DEMO_TARGET" });
});

// ---- Review mode

function writeRecord() {
  const entry = (skill, project, comp, targets) => ({
    date: "2026-10-15T10:00:00.000Z", skill, project, comp, attempted: "x", result: "passed", demo_used: false,
    summary: "x", next: "x", kind: "first", targets,
  });
  fs.writeFileSync(LEARNER, JSON.stringify({
    version: 1,
    skills: { "sample.review": { status: "learned", last_practiced: "2026-10-15T10:00:00.000Z", times_passed: 1, next: "x" } },
    lessons: [
      entry("sample.review", "Synthetic.aep", "Lower Third", [{ layer: "Title", property: "Position" }]),
      entry("sample.review", "Synthetic.aep", "Other Comp", [{ layer: "Title", property: "Scale" }]),
      entry("sample.review", "Other.aep", "Lower Third", [{ layer: "Title", property: "Opacity" }]),
      entry("other.skill", "Synthetic.aep", "Lower Third", [{ layer: "Subtitle", property: "Opacity" }]),
      { ...entry("sample.review", "Synthetic.aep", "Lower Third", []), targets: undefined }, // an old entry with none
    ],
  }));
}

test("review mode: past targets for this skill, comp and project are passed as exclude; no demo", () => {
  writeRecord();
  const s = session.start(A, { skill: "sample.review", analyze: stub, mode: "review" });
  const want = [{ layer: "Title", property: "Position" }];
  assert.deepEqual(calls[0].exclude, want, "none from other comps, projects or skills");
  assert.equal(s.session.mode, "review");
  assert.deepEqual(s.session.exclude, want);
  assert.ok(s.session.targets.length >= 2);
  assert.equal(s.session.demo_target, null);
  assert.equal(s.analysis.demo_target, null);
  assert.throws(() => session.assertCanDemo(s.session.targets[0]), { code: "REVIEW_NO_DEMO" });
  assert.throws(() => session.recordDemo(s.session.targets[0]), { code: "REVIEW_NO_DEMO" });
  assert.equal(session.currentLesson().demo, null);
});

test("lesson mode passes an empty exclude", () => {
  writeRecord();
  session.start(A, { skill: "sample.review", analyze: stub });
  assert.deepEqual(calls[0].exclude, []);
});

test("an unreadable learner record gives a review no past targets, and is left where it is", () => {
  fs.writeFileSync(LEARNER, "{ not json");
  const s = session.start(A, { skill: "sample.review", analyze: stub, mode: "review" });
  assert.deepEqual(s.session.exclude, []);
  assert.equal(fs.readFileSync(LEARNER, "utf8"), "{ not json");
});

test("a review with no targets says no_new_target", () => {
  const s = session.start(A, { skill: "sample.review", analyze: none, mode: "review" });
  assert.deepEqual(s.session.targets, []);
  assert.equal(s.analysis.demo_target, null);
  assert.equal(s.analysis.no_demo_reason, "no_new_target");
});

test("changing mode for the same skill and comp starts a new lesson", () => {
  const first = session.start(A, S);
  session.markChecked(false);
  const review = session.start(A, { ...S, mode: "review" });
  assert.equal(review.lesson, "new");
  assert.notEqual(review.session.lesson_id, first.session.lesson_id);
  assert.equal(review.session.mode, "review");
  const back = session.start(A, S);
  assert.equal(back.lesson, "new", "and back again");
  assert.equal(back.session.mode, "lesson");
});

// ---- Review offers (research R8)

test("review_offers older than 3 hours are pruned on write", () => {
  const hours = (h) => new Date(Date.now() - h * 3600 * 1000).toISOString();
  fs.writeFileSync(SESSION, JSON.stringify({
    version: 1, current: null, lessons: {},
    review_offers: [{ skill: "sample.old", at: hours(4) }, { skill: "sample.recent", at: hours(1) }],
  }));
  session.recordReviewOffer("sample.new");
  const offers = file().review_offers;
  assert.deepEqual(offers.map((o) => o.skill), ["sample.recent", "sample.new"]);
  assert.deepEqual(session.reviewOffers().map((o) => o.skill), ["sample.recent", "sample.new"]);
  session.start(A);
  assert.deepEqual(file().review_offers.map((o) => o.skill), ["sample.recent", "sample.new"], "kept by other writes");
});

test("reviewOffers() is empty with no session file", () => {
  assert.deepEqual(session.reviewOffers(), []);
});

// ---- A skill's own analyzer options (T060, spec 008 SR-1)

test("skill_options are passed to the analyzer and stored on the lesson", () => {
  const opts = { land_hard: ["1:ADBE Transform Group/ADBE Position"] };
  const s = session.start(A, { ...S, skill_options: opts });
  assert.deepEqual(calls[0].skill_options, opts);
  assert.ok("focus_layers" in calls[0] && "exclude" in calls[0] && "kept_linear" in calls[0]);
  assert.deepEqual(s.session.skill_options, opts);
});

test("a continued or resumed start without skill_options reuses the stored value, for now and the baseline", () => {
  const opts = { land_hard: ["1:ADBE Transform Group/ADBE Position"] };
  session.start(A, { ...S, skill_options: opts });
  calls.length = 0;
  const cont = session.start(A_DONE, S);
  assert.equal(cont.lesson, "continued");
  assert.equal(calls.length, 2, "the current read and the baseline");
  for (const c of calls) assert.deepEqual(c.skill_options, opts);
  assert.deepEqual(cont.session.skill_options, opts);

  session.start(B, S); // another comp
  calls.length = 0;
  const resumed = session.start(A, S);
  assert.equal(resumed.lesson, "resumed");
  for (const c of calls) assert.deepEqual(c.skill_options, opts);
  assert.deepEqual(resumed.session.skill_options, opts);
});

test("a start with skill_options replaces the stored value", () => {
  session.start(A, { ...S, skill_options: { land_hard: ["a"] } });
  calls.length = 0;
  const s = session.start(A, { ...S, skill_options: { land_hard: ["b"] } });
  assert.equal(s.lesson, "continued");
  for (const c of calls) assert.deepEqual(c.skill_options, { land_hard: ["b"] });
  assert.deepEqual(session.currentLesson().skill_options, { land_hard: ["b"] });
});

test("a new lesson (after a pass, or a change of mode) starts with no skill_options", () => {
  session.start(A, { ...S, skill_options: { land_hard: ["a"] } });
  session.markChecked(true);
  calls.length = 0;
  const after = session.start(A, S);
  assert.equal(after.lesson, "new");
  assert.equal(calls[0].skill_options, undefined);
  assert.equal(after.session.skill_options, undefined);

  session.start(A, { ...S, skill_options: { land_hard: ["a"] } });
  calls.length = 0;
  const review = session.start(A, { ...S, mode: "review" });
  assert.equal(review.lesson, "new");
  assert.equal(calls[0].skill_options, undefined);
  assert.equal(review.session.skill_options, undefined);
});

test("skill_options that aren't plain JSON data throw before any write", () => {
  session.start(A, S);
  const before = fileText();
  for (const bad of [{ f: () => 1 }, { d: new Date() }, { n: NaN }, { u: undefined }, { m: new Map() }, "text", 3]) {
    assert.throws(() => session.start(A, { ...S, skill_options: bad }), /skill_options/);
    assert.equal(fileText(), before);
  }
  fs.rmSync(SESSION);
  assert.throws(() => session.start(A, { ...S, skill_options: { f: () => 1 } }), /skill_options/);
  assert.equal(fileText(), null);
});

// ---- A fresh restart (T062, spec 009 SR-1)

// A copy of A with a practice blink added after the first look.
const withBlink = () => {
  const s = structuredClone(A);
  s.layers.push({
    index: 3, name: "Blink", kind: "shape", enabled: true, is_null: false,
    properties: [{ ...structuredClone(A.layers[0].properties[2]) }],
  });
  return s;
};

test("fresh: true before any demo or check starts a new lesson from this snapshot", () => {
  const first = session.start(A, S);
  const A2 = withBlink();
  const s = session.start(A2, { ...S, fresh: true });
  assert.equal(s.lesson, "new");
  assert.notEqual(s.session.lesson_id, first.session.lesson_id);
  assert.deepEqual(s.session.baseline, A2);
  assert.ok(s.session.targets.includes("3:ADBE Transform Group/ADBE Opacity"), "the blink made after the first look is a target");
});

test("fresh: true after a demo or a check throws LESSON_UNDERWAY and changes nothing", () => {
  const s = session.start(A, S);
  session.recordDemo(s.session.demo_target);
  let before = fileText();
  assert.throws(() => session.start(withBlink(), { ...S, fresh: true }), { code: "LESSON_UNDERWAY" });
  assert.equal(fileText(), before);

  fs.rmSync(SESSION);
  session.start(A, S);
  session.markChecked(false);
  before = fileText();
  assert.throws(() => session.start(withBlink(), { ...S, fresh: true }), { code: "LESSON_UNDERWAY" });
  assert.equal(fileText(), before);
});

test("fresh: true with no lesson to replace is an ordinary start", () => {
  const s = session.start(A, { ...S, fresh: true });
  assert.equal(s.lesson, "new");
  session.markChecked(true);
  assert.equal(session.start(A, { ...S, fresh: true }).lesson, "new", "a passed lesson isn't replaced, just followed");
});

test("fresh: true works the same in review mode", () => {
  const first = session.start(A, { ...S, mode: "review" });
  const s = session.start(withBlink(), { ...S, mode: "review", fresh: true });
  assert.equal(s.lesson, "new");
  assert.notEqual(s.session.lesson_id, first.session.lesson_id);
  assert.equal(s.session.mode, "review");
  session.markChecked(false);
  assert.throws(() => session.start(A, { ...S, mode: "review", fresh: true }), { code: "LESSON_UNDERWAY" });
});

test("fresh: true leaves other skills' lessons on the comp and this skill's other comps alone", () => {
  session.start(A);
  session.recordDemo(POS1);
  session.start(B, S);
  session.start(A, S);
  const before = file().lessons;
  session.start(withBlink(), { ...S, fresh: true });
  const after = file().lessons;
  assert.deepEqual(after["200"], before["200"], "easing's lesson on the comp");
  assert.deepEqual(after["sample.one|100"], before["sample.one|100"], "the same skill on another comp");
  assert.notDeepEqual(after["sample.one|200"], before["sample.one|200"]);
});

test("a fresh lesson carries nothing from the one it replaces", () => {
  session.start(A, { ...S, skill_options: { land_hard: ["a"] } });
  session.markChecked(true);
  session.keepLinear(A, [{ layer: "Title", property: "Position" }]);
  assert.equal(session.currentLesson().kept_linear.length, 1);
  calls.length = 0;
  const s = session.start(A, { ...S, fresh: true });
  assert.equal(s.session.skill_options, undefined);
  assert.equal(calls[0].skill_options, undefined);
  assert.deepEqual(s.session.kept_linear, []);
  assert.equal(s.session.demo, null);
  assert.equal(s.session.checked, undefined);
});

// ---- One target with several refs (spec 010's layer-level targets)

const layerLevel = (snapshot, opts = {}) => {
  calls.push(structuredClone(opts));
  const exclude = opts.exclude || [];
  const skip = (layer, prop) => exclude.some((e) => e.layer === layer.name && e.property === prop.display_name);
  const layers = snapshot.layers.filter((l) => l.properties.some((p) => !skip(l, p)));
  return {
    targets: layers.map((l) => `layer:${l.index}`),
    target_refs: layers.flatMap((l) => l.properties.map((p) => ({ layer: l.name, property: p.display_name }))),
    demo_target: null, no_demo_reason: "skill_own", focus: null,
  };
};

test("a target can carry several refs: stored as given, and a review gets all of them back as exclude", () => {
  const s = session.start(A, { skill: "sample.layers", analyze: layerLevel });
  assert.deepEqual(s.session.targets, ["layer:1", "layer:2"]);
  assert.equal(s.session.target_refs.length, 4, "Title's three properties and Subtitle's one");
  fs.writeFileSync(LEARNER, JSON.stringify({
    version: 1, skills: {},
    lessons: [{ date: "2026-10-15T10:00:00.000Z", skill: "sample.layers", project: "Synthetic.aep", comp: "Lower Third",
      attempted: "x", result: "passed", demo_used: false, summary: "x", next: "x", kind: "first",
      targets: [{ layer: "Title", property: "Position" }, { layer: "Title", property: "Scale" }, { layer: "Title", property: "Opacity" }] }],
  }));
  calls.length = 0;
  const r = session.start(A, { skill: "sample.layers", analyze: layerLevel, mode: "review" });
  assert.equal(calls[0].exclude.length, 3);
  assert.deepEqual(r.session.targets, ["layer:2"], "every ref of Title's target is skipped");
});

test("without fresh, an unpassed lesson is still continued, keeping its baseline", () => {
  session.start(A, S);
  const s = session.start(withBlink(), S);
  assert.equal(s.lesson, "continued");
  assert.deepEqual(s.session.baseline, A);
  assert.equal(s.session.targets.includes("3:ADBE Transform Group/ADBE Opacity"), false);
});
