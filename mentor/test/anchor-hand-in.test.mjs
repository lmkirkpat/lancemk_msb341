// Spec 014 T045 (contracts/hand-in.md › Per skill and › Tests; research R7, K6, K7, rule 2): Set the
// pivot from a hand-in, on spec 015's live Comp 1 capture. Shake Control (a null moved by
// expressions, carrying rock.png and the letters) is the focus only with a hand-in; its check grades
// the children's footprints at the same frames on base values. A planted Pan Behind on it passes; a
// planted child move fails, naming the child; the learner's own spot is never graded (AB held 3's
// padded rock.png passes on "didn't move"). Then the tool, from give_answer to go_deeper to
// anchor_snapshot, in fixture mode. Nothing here touches After Effects.

import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { FIXTURES, tempHome } from "./helpers.mjs";

const home = tempHome();
const stateFile = path.join(home, "fixture-state.json");
const COMP1 = path.join(FIXTURES, "expressions", "comp1.json");
fs.writeFileSync(stateFile, JSON.stringify({ project: COMP1 }));
process.env.AE_MENTOR_FIXTURE_STATE = stateFile;

const { analyze, candidates, finder, handInFocus, YOUR_CALL } = await import("../lib/anchor.mjs");
const { check, checkSampleTimes } = await import("../lib/anchor-check.mjs");
const { layerMatrix } = await import("../lib/comp-space.mjs");
const { TOOLS } = await import("../tools/index.mjs");

const BASE = JSON.parse(fs.readFileSync(COMP1, "utf8"));
const clone = (x) => structuredClone(x);
const idx = (snap, name) => snap.layer_info.find((l) => l.name === name).index;
const SHAKE = idx(BASE, "Shake Control");
const ROCK = idx(BASE, "rock.png");
const NULL_IN = { layer: "Shake Control", step_number: 3, steps: ["a", "b", "c", "Play it back and watch the turn."], place_named: true };
const ROCK_IN = { layer: "rock.png", step_number: 1, steps: ["a"], place_named: true };

// Pan Behind on a layer, planted: Anchor Point by d in its own space, and Position (and its value
// before the expression, where read) by L·d, L the layer's own rotation and scale at that sample.
function panBehind(snap, index, d) {
  const out = clone(snap);
  const e = out.layer_info.find((l) => l.index === index);
  for (const smp of e.samples) {
    const move = (vals, pos) => {
      const [a, b, c, dd] = layerMatrix({ anchor: [0, 0], position: [0, 0], scale: vals.scale, rotation: vals.rotation });
      pos[0] += a * d[0] + c * d[1];
      pos[1] += b * d[0] + dd * d[1];
    };
    const base = smp.base ? { scale: smp.base.scale || smp.scale, rotation: smp.base.rotation ?? smp.rotation } : null;
    move(base || smp, smp.position);
    if (smp.base && smp.base.position) move(base, smp.base.position);
    smp.anchor[0] += d[0];
    smp.anchor[1] += d[1];
  }
  return out;
}
const moveLayer = (snap, index, dx) => {
  const out = clone(snap);
  for (const smp of out.layer_info.find((l) => l.index === index).samples) smp.position[0] += dx;
  return out;
};

const lessonOf = (handIn) => {
  const a = analyze(BASE, { skill_options: handInFocus(BASE, handIn), hand_in: handIn });
  return { comp_id: BASE.comp.id, baseline: BASE, targets: a.targets, skill_options: handInFocus(BASE, handIn), hand_in: handIn };
};

// ---- The focus

test("without a hand-in Shake Control is a null this lesson leaves out, and the finder is unchanged", () => {
  const c = candidates(BASE).find((x) => x.layer === "Shake Control");
  assert.deepEqual([c.bucket, c.reason], ["never", "null"]);
  assert.equal("children" in c, false);
  assert.ok(!finder(BASE).layers.includes("Shake Control"));
});

test("K7: with its hand-in, Shake Control can be the focus, at the learner's own place, with the layers it carries", () => {
  assert.deepEqual(handInFocus(BASE, { ...NULL_IN, place_named: false }), { focus: [{ layer: "Shake Control", place: YOUR_CALL }] }, "a null's place is always theirs");
  const a = analyze(BASE, { skill_options: handInFocus(BASE, NULL_IN), hand_in: NULL_IN });
  const c = a.candidates.find((x) => x.layer === "Shake Control");
  assert.deepEqual([c.bucket, c.reason], ["if_named", "hand_in_null"]);
  assert.ok(c.children.includes("rock.png") && c.children.length >= 3);
  assert.deepEqual(a.focus, ["Shake Control"]);
  assert.deepEqual(a.targets, [`anchor/${SHAKE}`]);
  assert.deepEqual(a.places["Shake Control"], { place: YOUR_CALL, point: null });
  assert.deepEqual(a.focus_problems, []);
  assert.equal(a.demo_target, null, "a null is never the demo");
  const note = a.notes.find((n) => n.note === "null_focus");
  assert.deepEqual(note.children, c.children);
});

test("a null the model gives a grid place still takes the learner's own place", () => {
  const a = analyze(BASE, { skill_options: { focus: [{ layer: "Shake Control", place: "center" }] }, hand_in: NULL_IN });
  assert.equal(a.places["Shake Control"].place, YOUR_CALL);
});

test("your_call is never accepted from the model on a layer that isn't the hand-in's", () => {
  const a = analyze(BASE, { skill_options: { focus: [{ layer: "outline.png", place: YOUR_CALL }] }, hand_in: NULL_IN });
  assert.deepEqual(a.focus_problems, [{ layer: "outline.png", problem: "no_place" }]);
  const b = analyze(BASE, { skill_options: { focus: [{ layer: "rock.png", place: YOUR_CALL }] } });
  assert.deepEqual(b.focus_problems, [{ layer: "rock.png", problem: "no_place" }]);
});

test("a null whose Position expression sets its own value can't be the focus (Pan Behind wouldn't hold its children)", () => {
  const snap = clone(BASE);
  const x = snap.expressions.find((e) => e.layer === SHAKE && e.path === "ADBE Transform Group/ADBE Position");
  x.text = "[960 + Math.sin(time * 8) * 6, 540]";
  const c = candidates(snap, { hand_in: NULL_IN }).find((l) => l.layer === "Shake Control");
  assert.deepEqual([c.bucket, c.reason], ["never", "expression_anchor_position"]);
});

test("check sample times: every frame the null's children were read at", () => {
  const times = checkSampleTimes(BASE, lessonOf(NULL_IN));
  for (const t of BASE.layer_info.find((l) => l.index === ROCK).samples.map((s) => s.time)) assert.ok(times.includes(t), t);
});

// ---- The check

test("a planted Pan Behind on Shake Control, children still: passes, on base values at the same frames", () => {
  const now = panBehind(BASE, SHAKE, [320, -40]);
  const r = check(BASE, now, lessonOf(NULL_IN));
  const row = r.layers[0];
  assert.equal(row.null_focus, true);
  assert.equal(row.item1.your_call, true);
  assert.equal(row.item1.passed, null, "the place is never graded");
  assert.equal(row.anchor_changed, true);
  assert.ok(row.item2.children >= 3);
  assert.deepEqual(row.item2.moved_children, []);
  assert.deepEqual(row.cant_check, []);
  assert.ok(!row.item5.moved_layers.some((m) => m.layer === "rock.png"), "the children are item 2's, not item 5's");
  assert.equal(r.passed, true);
  assert.deepEqual(row.hints, []);
});

test("a planted child move fails, naming the child", () => {
  const now = moveLayer(panBehind(BASE, SHAKE, [320, -40]), ROCK, 30);
  const r = check(BASE, now, lessonOf(NULL_IN));
  const row = r.layers[0];
  assert.equal(r.passed, false);
  assert.deepEqual(row.item2.moved_children.map((m) => m.layer), ["rock.png"]);
  assert.equal(row.item2.moved_children[0].direction, "right");
  assert.ok(row.hints.includes("children_moved"));
});

test("a child moved with the null's pivot as it was: carried_layer_moved, never children_moved", () => {
  const now = moveLayer(BASE, ROCK, 30);
  const row = check(BASE, now, lessonOf(NULL_IN)).layers[0];
  assert.equal(row.passed, false);
  assert.equal(row.anchor_changed, false);
  assert.deepEqual(row.item2.moved_children.map((m) => m.layer), ["rock.png"]);
  assert.deepEqual(row.hints, ["carried_layer_moved"]);
});

test("dragging the null (Position only) moves its children: fails, layer_dragged", () => {
  const now = clone(BASE);
  for (const smp of now.layer_info.find((l) => l.index === SHAKE).samples) { smp.position[0] += 50; smp.base.position[0] += 50; }
  const row = check(BASE, now, lessonOf(NULL_IN)).layers[0];
  assert.equal(row.passed, false);
  assert.ok(row.item2.moved_children.length >= 3);
  assert.deepEqual(row.hints, ["layer_dragged"]);
});

test("nothing changed: not a pass, and only pivot_unchanged, never a place hint", () => {
  const row = check(BASE, clone(BASE), lessonOf(NULL_IN)).layers[0];
  assert.equal(row.passed, false);
  assert.deepEqual(row.hints, ["pivot_unchanged"]);
});

test("AB held 3: the padded rock.png with the learner's own spot passes on 'didn't move', wherever the pivot went", () => {
  assert.deepEqual(handInFocus(BASE, ROCK_IN), { focus: [{ layer: "rock.png", place: YOUR_CALL }] });
  for (const d of [[-700, 200], [500, 250], [10, 10]]) {
    const r = check(BASE, panBehind(BASE, ROCK, d), lessonOf(ROCK_IN));
    const row = r.layers[0];
    assert.equal(row.item1.your_call, true);
    assert.equal(row.item2.passed, true, `didn't move for ${d}`);
    assert.equal(r.passed, true, `passes for ${d}`);
    assert.ok(!row.hints.some((h) => ["outside", "not_moved_enough", "neighbour_place"].includes(h)));
  }
});

test("without place_named, rock.png's hand-in sets no focus: the lesson asks for one of the nine", () => {
  assert.equal(handInFocus(BASE, { ...ROCK_IN, place_named: false }), undefined);
});

// ---- The tool, from the answer

const SESSION = path.join(home, "session.json");
const tool = (name) => TOOLS.find((t) => t.name === name).handler;
const call = async (name, args = {}) => JSON.parse((await tool(name)(args)).content[0].text);
const td16 = () => ({
  kind: "answer",
  explanation: "In Comp 1, rock.png rides on Shake Control, a null moved by expressions:\n- All three hits are the same size.\n- Rotation moves the rock about 9 px at most, near 2.6 s.",
  steps: [
    { text: "Open Shake Control's Position expression and look at how it sets each hit's size: it uses the first hit's size for all three. Not something I teach yet.", skill: "not_taught", layer: "Shake Control" },
    { text: "Open Shake Control's Rotation expression and look at its amounts: 0.75° at most. Not something I teach yet.", skill: "not_taught", layer: "Shake Control" },
    { text: "Select Shake Control (the null, not a letter) and Pan Behind its pivot to where the hammer hits.", skill: "transform.anchor", layer: "Shake Control" },
    { text: "Play it back and watch the turn.", skill: null, layer: null },
  ],
  offered_skills: ["transform.anchor"],
  closing_offer: "Try them, or want to go deeper on step 3 with *Set the pivot*?",
  goal: "a shake that turns from where it's hit",
});

beforeEach(() => {
  for (const f of fs.readdirSync(home)) if (f.startsWith("session.json") || f.startsWith("learner.json")) fs.rmSync(path.join(home, f));
  process.env.AE_MENTOR_RUNTIME = "a";
});
afterEach(() => { delete process.env.AE_MENTOR_RUNTIME; });

test("give_answer, go_deeper, then anchor_snapshot: opens on Shake Control, hand_in, with the hand-in slice", async () => {
  await call("give_answer", td16());
  await call("go_deeper", { skill: "transform.anchor", step: 3, place_named: true });
  const r = await call("anchor_snapshot");
  assert.equal(r.mode, "lesson");
  assert.equal(r.mode_source, "hand_in");
  assert.deepEqual(r.focus, ["Shake Control"]);
  assert.deepEqual(r.targets, [`anchor/${SHAKE}`]);
  assert.equal(r.places["Shake Control"], YOUR_CALL);
  assert.deepEqual(r.hand_in, { layer: "Shake Control", step_number: 3, steps_after: ["Play it back and watch the turn."], place_named: true, practice: false });
  assert.equal(r.proposal !== undefined, true);
  const lesson = JSON.parse(fs.readFileSync(SESSION, "utf8"));
  assert.equal(lesson.hand_in.used, true);
  const again = await call("anchor_snapshot");
  assert.equal(again.mode_source, "in_progress");
  assert.deepEqual(again.focus, ["Shake Control"]);
  assert.deepEqual(again.hand_in, r.hand_in, "the lesson keeps its hand-in");
  const checked = await call("anchor_check");
  assert.equal(checked.layers[0].null_focus, true);
  assert.deepEqual(checked.layers[0].hints, ["pivot_unchanged"]);
});

test("a learned pivot: the hand-in lesson is practice, and still a lesson", async () => {
  fs.writeFileSync(path.join(home, "learner.json"), JSON.stringify({ version: 1, lessons: [], skills: { "transform.anchor": { status: "learned", last_practiced: "2026-11-01T18:00:00.000Z", times_passed: 1, next: "x", review_due: "2026-11-10", reviews_passed_in_row: 1 } } }));
  await call("give_answer", td16());
  await call("go_deeper", { skill: "transform.anchor", step: 3 });
  const r = await call("anchor_snapshot");
  assert.equal(r.mode, "lesson");
  assert.equal(r.hand_in.practice, true);
});

test("the hand-in's layer gone: hand_in_lost, no focus, the lesson as from Skills", async () => {
  const { saveHandIn } = await import("../lib/session.mjs");
  saveHandIn({ skill: "transform.anchor", comp_id: BASE.comp.id, layer: "Old Rock", step_number: 1, steps: [], goal: null, place_named: false });
  const r = await call("anchor_snapshot");
  assert.equal(r.mode_source, "hand_in_lost");
  assert.equal(r.focus, null);
  assert.equal(r.hand_in.layer, "Old Rock");
  const lesson = Object.values(JSON.parse(fs.readFileSync(SESSION, "utf8")).lessons)[0];
  assert.equal("hand_in" in lesson, false, "nothing to hand back to");
});

test("no hand-in: the reply has no hand_in field", async () => {
  const r = await call("anchor_snapshot");
  assert.equal("hand_in" in r, false);
  assert.notEqual(r.mode_source, "hand_in");
});
