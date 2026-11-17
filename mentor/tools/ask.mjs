// Spec 014's ask tools (contracts/ask-tools.md). Phase 1: give_answer. TOOLS only: no SKILLS and no
// FINDERS, which index.mjs allows (as spec 015's comp-reads.mjs does). Read-only for After Effects
// (FR-002): its one read is a snapshot, and it never runs a snippet that changes the project, the
// selection, the playhead or the active comp. It writes only session.json's ask block, and nothing to
// the learner record in this phase (T013).
//
// The comp an answer is about comes from give_answer's own read of the active comp, taken when the
// call is checked, never from the input. describe_layers (spec 015) keeps session.json untouched
// (its FR-019, FR-020), so there's no saved "last read" to take it from; reading again also catches
// a comp switched between the mentor's read and its answer (COMP_NOT_NAMED).

import { MentorError } from "../errors.mjs";
import { checkAnswer, KINDS, READ_KINDS } from "../lib/ask-answer.mjs";
import { unsafeFields } from "../lib/learner-store.mjs";
import { runtime } from "../lib/runtime-flag.mjs";
import { saveAnswer } from "../lib/session.mjs";
import { takeSnapshot } from "../lib/snapshot.mjs";
import { copiesExpression } from "./common.mjs";

// The read, through one object so tests can watch it and stand in for After Effects.
export const io = { takeSnapshot };

const SAVED_KINDS = new Set(["answer", "describe", "howto"]);
const textReply = (value) => ({ content: [{ type: "text", text: JSON.stringify(value) }] });

// R13: a lesson can be offered on A only when its finder says it can take a hand-in. index.mjs is
// imported when first needed, since it imports this file.
async function skillModules() {
  const { SKILLS, FINDERS } = await import("./index.mjs");
  return { skills: SKILLS, handInReady: (id) => !!(FINDERS[id] && FINDERS[id].hand_in === true) };
}

// Data-model § 2: `goal` is general motion terms, checked like a record field.
function checkGoal(goal, snapshot) {
  if (goal === undefined || goal === null) return null;
  if (typeof goal !== "string") throw new MentorError("ANSWER_SHAPE");
  const g = goal.trim();
  if (!g) return null;
  if (unsafeFields({ goal: g }).length) throw new MentorError("UNSAFE_RECORD");
  if (copiesExpression(g, snapshot)) throw new MentorError("RECORD_HAS_EXPRESSION");
  return g;
}

// An unreadable session.json is set aside by the first try (as for every reader), so the answer
// still lands on the second.
function save(entry) {
  try {
    return saveAnswer(entry);
  } catch (e) {
    if (!(e instanceof MentorError) || e.code !== "SESSION_UNREADABLE") throw e;
    return saveAnswer(entry);
  }
}

export async function giveAnswer(input = {}) {
  const kind = input && input.kind;
  let snapshot = null;
  let noComp = false;
  if (READ_KINDS.has(kind)) {
    try {
      snapshot = await io.takeSnapshot();
    } catch (e) {
      // No comp is an answer of its own (MU ask-nocomp); AE_UNREACHABLE and AE_BUSY stay errors.
      if (!(e instanceof MentorError) || e.code !== "NO_ACTIVE_COMP") throw e;
      noComp = true;
    }
  }
  const { skills, handInReady } = await skillModules();
  const { reply, offered } = checkAnswer(input, { runtime: runtime(), skills, handInReady, snapshot, noComp });
  const goal = checkGoal(input.goal, snapshot);
  if (SAVED_KINDS.has(reply.kind)) {
    save({
      comp_id: snapshot && snapshot.comp ? snapshot.comp.id : null,
      project: snapshot ? snapshot.project ?? null : null,
      comp: reply.comp,
      kind: reply.kind,
      steps: reply.steps,
      offered_skills: offered,
      goal,
    });
  }
  return textReply({ ...reply, done: DONE });
}

// Eval run 2026-11-16: every accepted answer was followed by prose (a copy, or "the answer is in the
// panel"). The reply says plainly that the turn is finished; it's safe for the learner to read.
export const DONE = "The learner can see this answer now. Your turn is finished: write nothing more.";

const STEP = {
  type: "object",
  properties: {
    text: { type: "string", description: "One line the learner does in After Effects, starting with the action, in AE's words." },
    skill: { type: ["string", "null"], description: "The skill that teaches it (its ID from the path), \"not_taught\" for a step outside the six, or null for a step that only plays back or looks." },
    layer: { type: ["string", "null"], description: "The layer the step is on, exactly as the read named it, or null." },
  },
  required: ["text", "skill", "layer"],
  additionalProperties: false,
};

export const TOOLS = [
  {
    name: "give_answer",
    title: "Give the answer",
    description:
      "The answer to the learner's question, as data: the panel draws it, so the answer turn has no other words. Call it " +
      "once, last, after reading the comp. Checks the answer's rules and refuses the first it breaks, with what to fix; " +
      "nothing is shown or saved until it's accepted. Reads the active comp itself to know which comp the answer is about. " +
      "Changes nothing in After Effects.",
    inputSchema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: KINDS, description: "answer (steps), describe (what's there, no steps), howto (no comp target), clarify (one question back), outside (outside what the mentor covers), no_comp." },
        explanation: { type: "string", description: "What's making it happen now. The first line names the comp. One or two sentences, or a lead line and up to four lines starting \"- \". Never numbered, never the steps." },
        steps: { type: "array", items: STEP, description: "Zero to four, in order of visible effect. Only for answer." },
        offered_skills: { type: "array", items: { type: "string" }, description: "Zero to two skill IDs to go deeper on, each one a step's skill (a howto may offer its one lesson)." },
        closing_offer: { type: ["string", "null"], description: "One sentence handing the choice back, a question when there are steps or an offer. Required for answer, describe, howto and outside; null only for clarify and no_comp." },
        goal: { type: "string", description: "Optional: what the learner wants, in general motion terms, never their words or names." },
      },
      required: ["kind", "explanation", "steps", "offered_skills", "closing_offer"],
      additionalProperties: false,
    },
    handler: giveAnswer,
  },
];
