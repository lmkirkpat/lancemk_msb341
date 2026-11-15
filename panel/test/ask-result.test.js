// Spec 014 T019 (FR-016, FR-017, FR-048, data-model § 7): a give_answer tool result → AskView, or
// null (fail closed). The fixture is teaching design § 16's Comp 1 answer, as the tool returns it.
"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { askView, ANSWER_TOOL } = require("../lib/ask-result.js");
const COMP1 = require("./fixtures/ask/comp1-answer.json");

const result = (json, o) => Object.assign({ type: "tool_result", name: ANSWER_TOOL, ok: true, text: json === undefined ? "" : JSON.stringify(json), json }, o);
const copy = () => JSON.parse(JSON.stringify(COMP1));
const A = { runtime: "a" };

test("TD § 16's answer: explanation, four numbered steps with their tags, the offer, the closing offer", () => {
  const v = askView(result(COMP1), A);
  assert.equal(v.kind, "answer");
  assert.equal(v.explanation, COMP1.explanation);
  assert.deepEqual(v.steps.map((s) => s.number), [1, 2, 3, 4]);
  assert.deepEqual(v.steps.map((s) => s.tag), [null, null, "Set the pivot", null]);
  assert.deepEqual(v.steps.map((s) => s.not_taught), [true, true, false, false]);
  assert.equal(v.steps[3].text, "Play it back and watch the turn.", "PQ-5: an untagged look step");
  assert.deepEqual(v.offers, [{ skill: "transform.anchor", tag: "Set the pivot" }]);
  assert.equal(v.closing_offer, COMP1.closing_offer);
  assert.equal("layer" in v.steps[0], false, "the panel draws no layer field");
});

test("FR-017: a b1 panel never gets offers, whatever the result says; nor does a b1 result", () => {
  assert.deepEqual(askView(result(COMP1), { runtime: "b1" }).offers, []);
  assert.deepEqual(askView(result(COMP1), {}).offers, [], "no runtime is B1");
  assert.deepEqual(askView(result(Object.assign(copy(), { runtime: "b1" })), A).offers, []);
  assert.equal(askView(result(COMP1), { runtime: "b1" }).steps.length, 4, "the steps still draw");
});

test("the kinds with no steps: describe, howto (PQ-4: one offer), clarify, outside, no_comp", () => {
  const describe = askView(result({ kind: "describe", comp: "Comp 1", explanation: "Sweep Control is a null with two Position keys.", steps: [], offered_skills: [], closing_offer: "Want to know more?", runtime: "a", tags: {} }), A);
  assert.equal(describe.kind, "describe");
  assert.deepEqual(describe.steps, []);
  const howto = askView(result({ kind: "howto", comp: null, explanation: "The speed graph shows how fast a value changes.", steps: [], offered_skills: ["easing.speed_graph"], closing_offer: "Want the lesson?", runtime: "a", tags: { "easing.speed_graph": "Speed graph" } }), A);
  assert.deepEqual(howto.offers, [{ skill: "easing.speed_graph", tag: "Speed graph" }]);
  for (const kind of ["clarify", "no_comp"]) {
    const v = askView(result({ kind, comp: null, explanation: "Do you mean the rock's shake, or the sweep?", steps: [], offered_skills: [], closing_offer: null, runtime: "a", tags: {} }), A);
    assert.equal(v.kind, kind);
    assert.equal(v.closing_offer, null);
  }
  assert.equal(askView(result({ kind: "outside", comp: null, explanation: "Exporting is outside what I cover.", steps: [], offered_skills: [], closing_offer: "Want to ask about the motion instead?", runtime: "a", tags: {} }), A).kind, "outside");
});

// contracts/panel-ask.md › Tests: every malformed shape draws nothing but the mentor's words.
const MALFORMED = {
  "missing": undefined,
  "a refusal": "refused",
  "not JSON": "text",
  "not an object": [1, 2],
  "unknown kind": (j) => { j.kind = "lecture"; },
  "five steps": (j) => { j.steps.push({ text: "One more.", skill: null, layer: null }); },
  "three offers": (j) => { j.steps[3].skill = "easing.basic"; j.steps[0].skill = "timing.offset"; j.tags = { "transform.anchor": "Set the pivot", "easing.basic": "Easing", "timing.offset": "Offset" }; j.offered_skills = ["transform.anchor", "easing.basic", "timing.offset"]; },
  "an offer no step uses": (j) => { j.offered_skills = ["parenting.null"]; j.tags["parenting.null"] = "Group with a null"; },
  "explanation not a string": (j) => { j.explanation = ["In Comp 1"]; },
  "steps not an array": (j) => { j.steps = "1. Open it"; },
  "a step with no text": (j) => { j.steps[0].text = ""; },
  "a step's skill a number": (j) => { j.steps[2].skill = 5; },
  "a step's layer a number": (j) => { j.steps[2].layer = 3; },
  "a step that isn't an object": (j) => { j.steps[1] = "Open it"; },
  "offers not an array": (j) => { j.offered_skills = "transform.anchor"; },
  "closing offer a number": (j) => { j.closing_offer = 7; },
  "a tag missing": (j) => { j.tags = {}; },
  "tags not an object": (j) => { j.tags = "Set the pivot"; },
  "a tag that isn't a string": (j) => { j.tags["transform.anchor"] = 1; },
  "an answer with no steps": (j) => { j.steps = []; j.offered_skills = []; },
  "a clarify with steps": (j) => { j.kind = "clarify"; j.offered_skills = []; },
  "a describe with steps": (j) => { j.kind = "describe"; j.offered_skills = []; },
  "an outside with an offer": (j) => { j.kind = "outside"; j.steps = []; },
  "a howto with two offers": (j) => { j.kind = "howto"; j.steps = []; j.offered_skills = ["transform.anchor", "parenting.null"]; j.tags["parenting.null"] = "Group with a null"; },
};

for (const [what, change] of Object.entries(MALFORMED)) {
  test(`fail closed: ${what} → null (FR-048)`, () => {
    let ev;
    if (change === undefined) ev = undefined;
    else if (change === "refused") ev = result(undefined, { ok: false, text: "TOO_MANY_STEPS: Give at most four steps." });
    else if (change === "text") ev = result(undefined, { text: "In Comp 1, rock.png rides on Shake Control." });
    else if (Array.isArray(change)) ev = result(change);
    else { const j = copy(); change(j); ev = result(j); }
    assert.equal(askView(ev, A), null);
  });
}

test("only give_answer's result counts; another tool's is never an answer", () => {
  assert.equal(askView(result(COMP1, { name: "describe_layers" }), A), null);
});

test("the view holds no field name, id or command a screen could show by accident", () => {
  const v = askView(result(COMP1), A);
  const shown = JSON.stringify([v.explanation, v.closing_offer, v.steps.map((s) => [s.text, s.tag]), v.offers.map((o) => o.tag)]);
  assert.doesNotMatch(shown, /transform\.anchor|not_taught|offered_skills|ask-mentor/);
});
