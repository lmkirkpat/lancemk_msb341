// Spec 014 T012 (research R3, data-model § 1, contracts/ask-tools.md): checkAnswer on spec 015's live
// Comp 1 capture. TD § 16's answer is accepted (with PQ-5's untagged step 4), each R3 row refuses a
// minimal change to it, a describe with no steps is accepted, and B1 returns no offered skills.

import { test } from "node:test";
import assert from "node:assert/strict";
import { tempHome } from "./helpers.mjs";

tempHome();
const { comp1, LIVE } = await import("./fixtures/expressions/comp1.mjs");
const ask = await import("../lib/ask-answer.mjs");
const { CODES } = await import("../errors.mjs");
const { checkAnswer, NOT_TAUGHT_LINE } = ask;

const SIX = ["easing.basic", "keyframes.types", "easing.speed_graph", "timing.offset", "transform.anchor", "parenting.null"];
const SNAP = comp1();
const TITLE = "DISCOVER the past to INSPIRE the future"; // Comp 1's text layer: Position, 2 keys
const b1 = (over = {}) => ({ runtime: "b1", skills: SIX, handInReady: () => false, snapshot: SNAP, noComp: false, ...over });
const onA = (over = {}) => b1({ runtime: "a", handInReady: (id) => id === "transform.anchor", ...over });

// TD § 16, as data (lines copied whole).
const EXPLANATION = [
  "In Comp 1, rock.png rides on Shake Control, a null moved by expressions:",
  "- All three hits are the same size.",
  "- Rotation moves the rock about 9 px at most, gone in about 1/3 s.",
  "- The turn centers on the rock, where Shake Control sits.",
].join("\n");
const STEP = [
  "Open Shake Control's Position expression and look at how it sets each hit's size: it uses the first hit's size for all three. Not something I teach yet.",
  "Open Shake Control's Rotation expression and look at its amounts: 0.75° at most. Not something I teach yet.",
  "Select Shake Control (the null, not a letter) and Pan Behind its pivot to where the hammer hits.",
  "Play it back and watch the turn.",
];
const CLOSING = "Try them, or want to go deeper on step 3 with *Set the pivot*?";
const td16 = () => ({
  kind: "answer",
  explanation: EXPLANATION,
  steps: [
    { text: STEP[0], skill: "not_taught", layer: "Shake Control" },
    { text: STEP[1], skill: "not_taught", layer: "Shake Control" },
    { text: STEP[2], skill: "transform.anchor", layer: "Shake Control" },
    { text: STEP[3], skill: null, layer: null },
  ],
  offered_skills: ["transform.anchor"],
  closing_offer: CLOSING,
});
const refuses = (input, ctx, code) => assert.throws(() => checkAnswer(input, ctx), (e) => e.code === code, code);
const edit = (fn) => { const a = td16(); fn(a); return a; };

test(`TD § 16's answer on Comp 1 (${LIVE ? "live capture" : "derived"}) is accepted; on B1 the reply offers nothing`, () => {
  const { reply, offered, warnings } = checkAnswer(td16(), b1());
  assert.deepEqual(reply, {
    kind: "answer",
    comp: "Comp 1",
    explanation: EXPLANATION,
    steps: td16().steps,
    offered_skills: [],
    closing_offer: CLOSING,
    runtime: "b1",
    tags: { "transform.anchor": "Set the pivot" },
  });
  assert.deepEqual(offered, ["transform.anchor"], "the checked offer is kept for the session");
  assert.deepEqual(warnings, []);
});

test("on A, a lesson that can take a hand-in is offered, with its tag", () => {
  const { reply } = checkAnswer(td16(), onA());
  assert.deepEqual(reply.offered_skills, ["transform.anchor"]);
  assert.equal(reply.runtime, "a");
  assert.deepEqual(reply.tags, { "transform.anchor": "Set the pivot" });
});

test("the comp comes from the read, never from the input", () => {
  const { reply } = checkAnswer({ ...td16(), comp: "Some Other Comp" }, b1());
  assert.equal(reply.comp, "Comp 1");
});

test("step 3a: a not-taught step always ends with the one marking sentence", () => {
  const cases = [
    ["Open Shake Control's Position expression and look at how it sets each hit's size: it uses the first hit's size for all three.", STEP[0]],
    ["Open Shake Control's Rotation expression and look at its amounts: 0.75° at most", STEP[1]],
    ["Open Shake Control's Rotation expression and look at its amounts: 0.75° at most. not something I teach yet", STEP[1]],
    [STEP[0], STEP[0]],
  ];
  for (const [given, want] of cases) {
    const { reply } = checkAnswer(edit((a) => { a.steps[0].text = given; }), b1());
    assert.equal(reply.steps[0].text, want, given);
    assert.ok(reply.steps[0].text.endsWith(NOT_TAUGHT_LINE));
  }
});

test("skills may be given by short or full name; the reply carries the ID", () => {
  const { reply } = checkAnswer(edit((a) => { a.steps[2].skill = "Set the pivot"; a.steps[0].skill = "not taught yet"; a.offered_skills = ["Set the pivot (anchor point)"]; }), onA());
  assert.equal(reply.steps[2].skill, "transform.anchor");
  assert.equal(reply.steps[0].skill, "not_taught");
  assert.deepEqual(reply.offered_skills, ["transform.anchor"]);
});

test("describe with no steps is accepted (US1 scenario 2: what does Sweep Control do?)", () => {
  const input = {
    kind: "describe",
    explanation: "In Comp 1, Sweep Control is a null, and its Position drives the Center of the CC Light Sweep on Black Solid 1, which looks like the shine.\n- Black Solid 1 doesn't render: its eye is off, and it isn't a matte.",
    steps: [],
    offered_skills: [],
    closing_offer: "Want to know what moves Sweep Control?",
  };
  const { reply } = checkAnswer(input, b1());
  assert.equal(reply.kind, "describe");
  assert.equal(reply.comp, "Comp 1");
  assert.deepEqual(reply.steps, []);
  assert.deepEqual(reply.tags, {});
});

test("a keyframe skill on a keyed layer is accepted (Speed graph on the text layer's Position keys)", () => {
  const input = {
    kind: "answer",
    explanation: `In Comp 1, ${TITLE} moves on its own two Position keys.`,
    steps: [{ text: `Select ${TITLE}'s two Position keys and open the speed graph.`, skill: "easing.speed_graph", layer: TITLE }],
    offered_skills: ["easing.speed_graph"],
    closing_offer: "Try it, or want to go deeper with *Speed graph*?",
  };
  const { reply, offered } = checkAnswer(input, b1());
  assert.deepEqual(reply.tags, { "easing.speed_graph": "Speed graph" });
  assert.deepEqual(offered, ["easing.speed_graph"]);
});

test("howto: no comp, one offered skill and no steps; B1 offers none; A needs a hand-in", () => {
  const input = { kind: "howto", explanation: "The speed graph shows how fast a property changes between two keys.\nA soft landing is a curve that comes down to rest.", steps: [], offered_skills: ["easing.speed_graph"], closing_offer: "Want to learn it on one of your layers?" };
  const { reply, offered } = checkAnswer(input, b1({ snapshot: null }));
  assert.equal(reply.comp, null);
  assert.deepEqual(reply.offered_skills, []);
  assert.deepEqual(offered, ["easing.speed_graph"]);
  assert.deepEqual(checkAnswer(input, onA({ snapshot: null, handInReady: () => true })).reply.tags, { "easing.speed_graph": "Speed graph" });
  refuses(input, onA({ snapshot: null }), "OFFER_NOT_READY");
  refuses({ ...input, offered_skills: ["easing.speed_graph", "easing.basic"] }, b1({ snapshot: null }), "BAD_OFFER");
});

test("no_comp is valid only when the read found no comp; then comp and closing are null", () => {
  const input = { kind: "no_comp", explanation: "No comp is open. Open one, or click into its timeline, then ask again.", steps: [], offered_skills: [], closing_offer: null };
  const { reply } = checkAnswer(input, b1({ snapshot: null, noComp: true }));
  assert.equal(reply.comp, null);
  assert.equal(reply.closing_offer, null);
  refuses(input, b1(), "COMP_IS_OPEN");
  refuses(td16(), b1({ snapshot: null, noComp: true }), "NO_ACTIVE_COMP");
});

test("clarify and outside: accepted with no steps and no offer", () => {
  const clarify = { kind: "clarify", explanation: "Do you mean G Shakers on layer 7 or the one on layer 14?", steps: [], offered_skills: [], closing_offer: null };
  assert.equal(checkAnswer(clarify, b1()).reply.comp, "Comp 1");
  const outside = { kind: "outside", explanation: "Render settings are outside what I cover; I help with motion in your comp: easing, key types, the speed graph, offset, pivots and nulls.", steps: [], offered_skills: [], closing_offer: "Want to ask about how something in Comp 1 moves?" };
  assert.equal(checkAnswer(outside, b1({ snapshot: null })).reply.comp, null);
});

// One refusal per research R3 row, each from a minimal change to TD § 16's answer.
test("R3 FR-005: more than four steps, an empty step, or a step over two lines is TOO_MANY_STEPS", () => {
  refuses(edit((a) => a.steps.push({ text: "Play it back again.", skill: null, layer: null })), b1(), "TOO_MANY_STEPS");
  refuses(edit((a) => { a.steps[3].text = "  "; }), b1(), "TOO_MANY_STEPS");
  refuses(edit((a) => { a.steps[3].text = "Play it back.\nWatch the turn."; }), b1(), "TOO_MANY_STEPS");
});

test("R3 FR-006: a step's skill that isn't one of the six, not taught, or none is BAD_STEP_SKILL", () => {
  refuses(edit((a) => { a.steps[0].skill = "motion.sources"; }), b1(), "BAD_STEP_SKILL");
  refuses(edit((a) => { a.steps[0].skill = "Expressions"; }), b1(), "BAD_STEP_SKILL");
  refuses(edit((a) => { a.steps[0].skill = 3; }), b1(), "BAD_STEP_SKILL");
});

test("R3 FR-008, FR-016: an offer no step uses, more than two, or not taught is BAD_OFFER", () => {
  refuses(edit((a) => { a.offered_skills = ["easing.basic"]; }), b1(), "BAD_OFFER");
  refuses(edit((a) => { a.offered_skills = ["transform.anchor", "parenting.null", "easing.basic"]; }), b1(), "BAD_OFFER");
  refuses(edit((a) => { a.offered_skills = ["not_taught"]; }), b1(), "BAD_OFFER");
  refuses(edit((a) => { a.offered_skills = ["Expressions"]; }), b1(), "BAD_OFFER");
  assert.deepEqual(checkAnswer(edit((a) => { a.offered_skills = ["transform.anchor", "transform.anchor"]; }), onA()).reply.offered_skills, ["transform.anchor"], "a repeat counts once");
});

test("R3 FR-008: a closing that isn't one question is BAD_CLOSING", () => {
  refuses(edit((a) => { a.closing_offer = "Try them first."; }), b1(), "BAD_CLOSING");
  refuses(edit((a) => { a.closing_offer = "Try them. Want to go deeper on step 3 with *Set the pivot*?"; }), b1(), "BAD_CLOSING");
  refuses(edit((a) => { a.closing_offer = null; }), b1(), "BAD_CLOSING");
  refuses(edit((a) => { a.closing_offer = "  "; }), b1(), "BAD_CLOSING");
  assert.ok(checkAnswer(edit((a) => { a.closing_offer = "Try them, or want to go deeper on step 3 with *Set the pivot* (it takes about 3 min)?"; }), b1()));
});

test("R3 FR-003: an answer or describe whose first line doesn't name the read's comp is COMP_NOT_NAMED", () => {
  refuses(edit((a) => { a.explanation = a.explanation.replace("In Comp 1, rock.png", "rock.png"); }), b1(), "COMP_NOT_NAMED");
  refuses(edit((a) => { a.explanation = `rock.png rides on Shake Control.\nIn Comp 1, ${a.explanation}`; }), b1(), "COMP_NOT_NAMED");
  const other = structuredClone(SNAP);
  other.comp.name = "Comp 2";
  refuses(td16(), b1({ snapshot: other }), "COMP_NOT_NAMED");
});

test("R3 FR-009: a numbered list, a Steps label or a step's own text in the explanation is STEPS_IN_EXPLANATION", () => {
  refuses(edit((a) => { a.explanation += "\n1. Select Shake Control."; }), b1(), "STEPS_IN_EXPLANATION");
  refuses(edit((a) => { a.explanation += "\nSteps: open the expressions, then move the pivot."; }), b1(), "STEPS_IN_EXPLANATION");
  refuses(edit((a) => { a.explanation += `\n- ${STEP[2]}`; }), b1(), "STEPS_IN_EXPLANATION");
});

test("R3 FR-022 (K4): a keyframe skill on a layer whose motion has no keys is KEYFRAME_SKILL_ON_KEYLESS", () => {
  for (const skill of ["easing.basic", "keyframes.types", "easing.speed_graph", "timing.offset"]) {
    refuses(edit((a) => { a.steps[2].skill = skill; a.offered_skills = [skill]; }), b1(), "KEYFRAME_SKILL_ON_KEYLESS");
  }
  // rock.png moves, but only through its parent's expressions (AB 3).
  refuses(edit((a) => { a.steps[2] = { text: "Select rock.png's keys and press F9.", skill: "easing.basic", layer: "rock.png" }; a.offered_skills = []; }), b1(), "KEYFRAME_SKILL_ON_KEYLESS");
  // A single key is set, not animated (TD § 13): the text layer with one of its two keys taken out.
  const single = structuredClone(SNAP);
  single.layers.find((l) => l.name === TITLE).properties[0].keys.splice(1);
  const input = { kind: "answer", explanation: `In Comp 1, ${TITLE} has one Position key.`, steps: [{ text: `Select ${TITLE}'s Position key and press F9.`, skill: "easing.basic", layer: TITLE }], offered_skills: [], closing_offer: "Try it?" };
  assert.ok(checkAnswer(input, b1()), "two keys: accepted");
  refuses(input, b1({ snapshot: single }), "KEYFRAME_SKILL_ON_KEYLESS");
});

test("R3 FR-027: Group with a null offered for a step on a null that already has children is ROUTE_TO_PIVOT", () => {
  const onShake = edit((a) => { a.steps[2] = { text: "Parent logo.png to Shake Control.", skill: "parenting.null", layer: "Shake Control" }; a.offered_skills = ["parenting.null"]; });
  refuses(onShake, b1(), "ROUTE_TO_PIVOT");
  // Sweep Control is a null with no children: accepted.
  const onSweep = edit((a) => { a.steps[2] = { text: "Parent logo.png to Sweep Control.", skill: "parenting.null", layer: "Sweep Control" }; a.offered_skills = ["parenting.null"]; a.closing_offer = "Try them, or want to go deeper on step 3 with *Group with a null*?"; });
  assert.deepEqual(checkAnswer(onSweep, b1()).offered, ["parenting.null"]);
  // The tag alone, with no offer, is a step, not a route.
  assert.ok(checkAnswer({ ...onShake, offered_skills: [] }, b1()));
});

test("R3 R13: on A, an offered skill that can't take a hand-in is OFFER_NOT_READY; B1 checks it as data only", () => {
  refuses(td16(), onA({ handInReady: () => false }), "OFFER_NOT_READY");
  assert.deepEqual(checkAnswer(td16(), b1({ handInReady: () => false })).offered, ["transform.anchor"]);
});

test("R3 FR-014, FR-016: clarify, outside and no_comp with a step, an offer or a closing offer are NOT_ACTIONABLE", () => {
  const base = { explanation: "Do you mean G Shakers on layer 7 or the one on layer 14?", steps: [], offered_skills: [], closing_offer: null };
  refuses({ ...base, kind: "clarify", steps: [td16().steps[3]] }, b1(), "NOT_ACTIONABLE");
  refuses({ ...base, kind: "clarify", closing_offer: "Which one?" }, b1(), "NOT_ACTIONABLE");
  refuses({ ...base, kind: "outside", offered_skills: ["transform.anchor"], closing_offer: "Want that?" }, b1({ snapshot: null }), "NOT_ACTIONABLE");
  refuses({ ...base, kind: "no_comp", closing_offer: "Open one?" }, b1({ snapshot: null, noComp: true }), "NOT_ACTIONABLE");
});

test("added refusals: ANSWER_SHAPE, KIND_MISMATCH, UNKNOWN_LAYER and STEP_NEEDS_LAYER", () => {
  refuses({ ...td16(), kind: "lesson" }, b1(), "ANSWER_SHAPE");
  refuses({ ...td16(), explanation: "" }, b1(), "ANSWER_SHAPE");
  refuses({ ...td16(), steps: "1. Open" }, b1(), "ANSWER_SHAPE");
  refuses(null, b1(), "ANSWER_SHAPE");
  refuses({ ...td16(), steps: [] }, b1(), "KIND_MISMATCH");
  refuses({ ...td16(), kind: "describe" }, b1(), "KIND_MISMATCH");
  refuses(edit((a) => { a.steps[2].layer = "Shake Ctrl"; }), b1(), "UNKNOWN_LAYER");
  refuses(edit((a) => { a.steps[2].layer = null; }), b1(), "STEP_NEEDS_LAYER");
});

test("FR-005 is a warning in phase 1, never a refusal: a step that doesn't start with an action is accepted", () => {
  const { reply, warnings } = checkAnswer(edit((a) => { a.steps[3].text = "The turn should now start at the hit."; }), b1());
  assert.equal(warnings.length, 1);
  assert.deepEqual(reply.warnings, warnings);
  assert.doesNotMatch(warnings[0], /_|\btext\b|\bskill\b/, "no field names");
});

test("every refusal code is registered with a plain message, with no field names in it", async () => {
  const { MESSAGES } = await import("../errors.mjs");
  for (const code of ["TOO_MANY_STEPS", "BAD_STEP_SKILL", "BAD_OFFER", "BAD_CLOSING", "COMP_NOT_NAMED", "STEPS_IN_EXPLANATION",
    "KEYFRAME_SKILL_ON_KEYLESS", "ROUTE_TO_PIVOT", "OFFER_NOT_READY", "NOT_ACTIONABLE", "ANSWER_SHAPE", "KIND_MISMATCH",
    "STEP_NEEDS_LAYER", "COMP_IS_OPEN"]) {
    assert.ok(CODES.includes(code), code);
    assert.doesNotMatch(MESSAGES[code], /[a-z]_[a-z]/, code);
  }
});

test("audit: code, backticks, skill IDs and underscore names in what the learner reads are NOT_PLAIN_WORDS", () => {
  refuses(edit((a) => { a.explanation += "\n- It ends in `value + offset`."; }), b1(), "NOT_PLAIN_WORDS");
  refuses(edit((a) => { a.steps[1].text = "Open Shake Control's Rotation expression and look at its wiggle(10, 3). Not something I teach yet."; }), b1(), "NOT_PLAIN_WORDS");
  refuses(edit((a) => { a.closing_offer = "Try them, or want to go deeper with transform.anchor?"; }), b1(), "NOT_PLAIN_WORDS");
  refuses(edit((a) => { a.explanation += "\n- Its parent moves_children."; }), b1(), "NOT_PLAIN_WORDS");
  assert.ok(checkAnswer(edit((a) => { a.steps[3].text = "Play it back and watch the turn."; }), b1()), "TD § 16 itself passes");
});

test("audit: a layer whose own name has an underscore is fine to name", () => {
  const snap = structuredClone(SNAP);
  snap.layer_info.find((l) => l.name === "Shake Control").name = "shake_ctrl";
  const input = edit((a) => {
    a.explanation = a.explanation.replaceAll("Shake Control", "shake_ctrl");
    for (const st of a.steps) { st.text = st.text.replaceAll("Shake Control", "shake_ctrl"); if (st.layer) st.layer = "shake_ctrl"; }
  });
  assert.equal(checkAnswer(input, b1({ snapshot: snap })).reply.steps[2].layer, "shake_ctrl");
});
