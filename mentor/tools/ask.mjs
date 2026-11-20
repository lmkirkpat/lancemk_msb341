// Spec 014's ask tools (contracts/ask-tools.md). Phase 1: give_answer; phase 2: go_deeper; phase 3:
// note_said and the asked entries. TOOLS only: no SKILLS and no FINDERS, which index.mjs allows (as
// spec 015's comp-reads.mjs does). Read-only for After Effects (FR-002): their one read is a snapshot,
// and they never run a snippet that changes the project, the selection, the playhead or the active
// comp. They write session.json's ask and hand_in blocks, and, from phase 3, the learner record's
// asked list only (lib/asked-record.mjs): never a skill's state or a lesson (FR-039).
//
// The comp an answer is about comes from give_answer's own read of the active comp, taken when the
// call is checked, never from the input. describe_layers (spec 015) keeps session.json untouched
// (its FR-019, FR-020), so there's no saved "last read" to take it from; reading again also catches
// a comp switched between the mentor's read and its answer (COMP_NOT_NAMED).

import { MentorError, registerErrors } from "../errors.mjs";
import { checkAnswer, hasCode, KINDS, NOT_TAUGHT, NULL_SKILL, nullWithChildren, READ_KINDS, skillIdOf } from "../lib/ask-answer.mjs";
import { layerInfo } from "../lib/layer-info.mjs";
import { checkGoalText, checkSaidText, markWentDeeper, recordAsked, setSaid } from "../lib/asked-record.mjs";
import { peekRecord } from "../lib/learner-store.mjs";
import { motionSources } from "../lib/motion-sources.mjs";
import { readPath, shortName, skillName } from "../lib/path.mjs";
import { runtime } from "../lib/runtime-flag.mjs";
import { latestAnswer, saveAnswer, saveHandIn } from "../lib/session.mjs";
import { takeSnapshot } from "../lib/snapshot.mjs";
import { copiesExpression } from "./common.mjs";

// Data-model § 8's messages for go_deeper, word for word, plus WRONG_STEP, which this build adds.
registerErrors({
  NOT_OFFERED: "Only a skill the last answer offered, or one its steps are tagged with, can start from it.",
  NOT_ON_THIS_RUNTIME: "The lesson can't start from here. Say so in one sentence and name where to start it.",
  NO_ANSWER: "There's no answer in this session yet.",
  WRONG_STEP: "Name the step that skill goes deeper on, by its number in the answer.",
});

// The read, through one object so tests can watch it and stand in for After Effects.
export const io = { takeSnapshot };

const SAVED_KINDS = new Set(["answer", "describe", "howto"]);
const textReply = (value) => ({ content: [{ type: "text", text: JSON.stringify(value) }] });

// R13: a lesson can be offered on A only when its finder says it can take a hand-in. index.mjs is
// imported when first needed, since it imports this file.
async function skillModules() {
  const { SKILLS, FINDERS } = await import("./index.mjs");
  return {
    skills: SKILLS,
    handInReady: (id) => !!(FINDERS[id] && FINDERS[id].hand_in === true),
    // The lesson's skill folder, *-mentor, for the Skill call (each tool file's FINDERS entry).
    commandOf: (id) => (FINDERS[id] && typeof FINDERS[id].skill_command === "string" ? FINDERS[id].skill_command : null),
  };
}

// Data-model § 2 and § 3: `goal` is general motion terms, checked like a record field (FR-040,
// FR-044). Phase 3: an answer with steps needs one, since its asked entry keeps it.
function checkGoal(goal, snapshot, kind) {
  if (goal !== undefined && goal !== null && typeof goal !== "string") throw new MentorError("ANSWER_SHAPE");
  const g = checkGoalText(goal, snapshot);
  if (!g) {
    if (kind === "answer") throw new MentorError("GOAL_NOT_GENERAL");
    return null;
  }
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
  const goal = checkGoal(input.goal, snapshot, reply.kind);
  // FR-038: one asked entry per answer with steps, linked from the session's ask (entry_date).
  const entry = reply.kind === "answer" ? recordAsked({
    project: snapshot ? snapshot.project ?? null : null,
    comp: reply.comp,
    layers: reply.steps.map((s) => s.layer),
    goal,
    skills: reply.steps.map((s) => s.skill).filter((id) => skills.includes(id)),
  }) : null;
  if (SAVED_KINDS.has(reply.kind)) {
    save({
      comp_id: snapshot && snapshot.comp ? snapshot.comp.id : null,
      project: snapshot ? snapshot.project ?? null : null,
      comp: reply.comp,
      kind: reply.kind,
      steps: reply.steps,
      offered_skills: offered,
      goal,
      entry_date: entry ? entry.date : null,
    });
  }
  return textReply({ ...reply, done: DONE });
}

// ---- go_deeper (phase 2; contracts/ask-tools.md, research R5): the learner said yes to an offer.

// Which step the lesson goes deeper on: the one asked for, which must use the skill, or the only step
// that does. Null for a how-to, which has no steps (PQ-4). WRONG_STEP otherwise.
function stepFor(ask, skill, step) {
  const steps = Array.isArray(ask.steps) ? ask.steps : [];
  const using = steps.map((s, i) => ({ s, n: i + 1 })).filter(({ s }) => s && s.skill === skill);
  if (step === undefined || step === null) {
    if (ask.kind === "howto" && !steps.length) return null;
    if (using.length === 1) return using[0];
    throw new MentorError("WRONG_STEP");
  }
  const hit = Number.isInteger(step) ? using.find((u) => u.n === step) : null;
  if (!hit) throw new MentorError("WRONG_STEP");
  return hit;
}

// FR-027: a null that already carries children is Set the pivot's, read again on the comp now. Only
// when the active comp is still the answer's; otherwise the lesson's own snapshot finds what's there.
async function routeToPivot(ask, layer) {
  const snapshot = await io.takeSnapshot();
  if (!snapshot || !snapshot.comp || snapshot.comp.id !== ask.comp_id || !layerInfo(snapshot).known) return;
  const map = motionSources(snapshot);
  const nulls = layerInfo(snapshot).layers.filter((l) => l.name === layer).some((l) => nullWithChildren(snapshot, map, l.index));
  if (nulls) throw new MentorError("ROUTE_TO_PIVOT");
}

// FR-023: the first hard prerequisite the record doesn't show learned (the on-ramp never counts), or
// null. An unreadable record names none.
function missingPrerequisite(skill, record) {
  const p = readPath();
  const own = p.skills.find((s) => s.id === skill);
  if (!own || !record) return null;
  const learned = (id) => !!(record.skills && record.skills[id] && record.skills[id].status === "learned");
  const missing = own.hard.find((id) => id !== p.on_ramp.id && !learned(id));
  return missing ? skillName(missing) : null;
}

export async function goDeeper(input = {}) {
  const args = input && typeof input === "object" ? input : {};
  if (runtime() !== "a") throw new MentorError("NOT_ON_THIS_RUNTIME");
  const ask = latestAnswer();
  if (!ask) throw new MentorError("NO_ANSWER");
  const { skills, handInReady, commandOf } = await skillModules();
  const skill = skillIdOf(args.skill, skills);
  // T081 review: turn 4 may offer to go deeper on the step that didn't land, which the answer may not
  // have offered, so any skill a step of the latest answer is tagged with counts too.
  const tagged = (Array.isArray(ask.steps) ? ask.steps : []).some((s) => s && s.skill === skill);
  if (!skill || skill === NOT_TAUGHT || !((ask.offered_skills || []).includes(skill) || tagged)) throw new MentorError("NOT_OFFERED");
  if (!handInReady(skill) || !commandOf(skill)) throw new MentorError("OFFER_NOT_READY");
  const hit = stepFor(ask, skill, args.step);
  const layer = hit && typeof hit.s.layer === "string" ? hit.s.layer : null;
  if (skill === NULL_SKILL && layer) await routeToPivot(ask, layer);

  saveHandIn({
    skill,
    comp_id: ask.comp_id ?? null,
    layer,
    step_number: hit ? hit.n : null,
    steps: Array.isArray(ask.steps) ? ask.steps : [],
    goal: ask.goal ?? null,
    place_named: args.place_named === true,
  });
  markWentDeeper(ask.entry_date, skill); // phase 3: on the answer's asked entry, when it has one
  const record = peekRecord();
  const learned = !!(record && record.skills && record.skills[skill] && record.skills[skill].status === "learned");
  return textReply({
    skill_name: skillName(skill),
    short_name: shortName(skill),
    command_skill: commandOf(skill),
    practice: learned,
    missing_prerequisite: missingPrerequisite(skill, record),
  });
}

// ---- note_said (phase 3; contracts/ask-tools.md): the learner said how the steps went. Kept on the
// latest answer's asked entry, as theirs, in general terms (FR-038). NO_ANSWER without an answer with
// steps in this session; `saved: false`, quietly, when the record couldn't take it (unreadable, or
// the entry isn't there any more), so the conversation carries on either way.
export async function noteSaid(input = {}) {
  const args = input && typeof input === "object" ? input : {};
  const ask = latestAnswer();
  if (!ask || ask.kind !== "answer") throw new MentorError("NO_ANSWER");
  const said = checkSaidText(args.said); // SAID_NOT_GENERAL, UNSAFE_RECORD: checked even with no entry to keep it on
  // FR-045: no expression or error text in the record (give_answer's plain-words test). note_said has
  // no read of its own, so the 24-character copy test isn't run; the code pattern catches the rest.
  const { skills } = await skillModules();
  if (hasCode(said, [...skills, NOT_TAUGHT])) throw new MentorError("NOT_PLAIN_WORDS");
  const entry = ask.entry_date ? setSaid(ask.entry_date, said) : null;
  return textReply({ saved: !!entry });
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
  {
    name: "go_deeper",
    title: "Go deeper",
    description:
      "The learner said yes to going deeper on a skill the last answer offered (typed, pressed, or \"show me\"). Hands the " +
      "lesson the answer's layer, step and goal, so it opens on their layer without asking again; then call Skill with " +
      "command_skill. Refuses a skill the answer didn't offer, or when the lesson can't start from here. Changes nothing in " +
      "After Effects.",
    inputSchema: {
      type: "object",
      properties: {
        skill: { type: "string", description: "The offered skill, by ID or short name." },
        step: { type: "integer", minimum: 1, description: "The number of the step it goes deeper on. Optional when one step has that skill." },
        place_named: { type: "boolean", description: "True when the learner named where it should turn from in their own words (a spot on the art), not one of the nine places." },
      },
      required: ["skill"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false },
    handler: goDeeper,
  },
  {
    name: "note_said",
    title: "Note what the learner said",
    description:
      "The learner said how the last answer's steps went (\"that worked\", \"the steps didn't help\"). Keeps it with that " +
      "answer, marked as theirs, in a few general words. Not for questions. Changes nothing in After Effects.",
    inputSchema: {
      type: "object",
      properties: {
        said: { type: "string", maxLength: 120, description: "What they said back, in a few general words (\"said the steps worked\"), never their sentence or a name." },
      },
      required: ["said"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false },
    handler: noteSaid,
  },
];
