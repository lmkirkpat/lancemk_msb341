// A hand-in for a lesson set's case (spec 014 T058; contracts/hand-in.md, data-model § 2): the state
// go_deeper leaves in session.json when the learner said yes to going deeper from an answer. go_deeper
// itself refuses on B1 (NOT_ON_THIS_RUNTIME), so a B1 lesson-set case seeds the file the way the tool
// would, and the lesson's own snapshot tool takes it once. Node built-ins only.
//
// A case says:  "hand_in": { "skill": "transform.anchor", "layer": "Shake Control", "step_number": 3,
//                            "steps": [{ "text": "...", "skill": "transform.anchor", "layer": "Shake Control" }, ...],
//                            "goal": null, "place_named": false }
// `comp_id` is left null, which any comp takes (a how-to's hand-in), and `at` is the run's own clock, so the
// hand-in is inside the session window whenever the case runs.

import fs from "node:fs";
import path from "node:path";

export const HAND_IN_SKILLS = ["transform.anchor", "parenting.null", "easing.basic", "keyframes.types", "easing.speed_graph", "timing.offset"]; // the skills with `hand_in: true` (phase 2: pivot and null; phase 3: the other four)

export function handInProblems(h) {
  if (h === undefined) return [];
  const problems = [];
  if (!h || typeof h !== "object" || Array.isArray(h)) return ["hand_in must be an object"];
  if (!HAND_IN_SKILLS.includes(h.skill)) problems.push(`hand_in.skill must be one of ${HAND_IN_SKILLS.join(", ")}`);
  if (h.layer !== null && typeof h.layer !== "string") problems.push("hand_in.layer must be a layer name or null");
  if (!Number.isInteger(h.step_number) || h.step_number < 1) problems.push("hand_in.step_number must be a whole number from 1");
  if (!Array.isArray(h.steps) || !h.steps.length) problems.push("hand_in.steps needs the answer's steps");
  else if (Number.isInteger(h.step_number) && h.step_number > h.steps.length) problems.push("hand_in.step_number is past the last step");
  else for (const s of h.steps) if (!s || typeof s.text !== "string") problems.push("each hand_in step needs text");
  return problems;
}

// The session.json a run starts with. `now` is a Date.
export function handInSession(h, now = new Date()) {
  return {
    version: 1,
    current: null,
    lessons: {},
    hand_in: {
      skill: h.skill,
      comp_id: null,
      layer: h.layer ?? null,
      step_number: h.step_number,
      steps: h.steps.map((s) => ({ text: s.text, skill: s.skill ?? null, layer: s.layer ?? null })),
      goal: h.goal ?? null,
      place_named: h.place_named === true,
      at: now.toISOString(),
      used: false,
    },
  };
}

export function seedHandIn(home, h, now = new Date()) {
  fs.writeFileSync(path.join(home, "session.json"), JSON.stringify(handInSession(h, now)));
}
