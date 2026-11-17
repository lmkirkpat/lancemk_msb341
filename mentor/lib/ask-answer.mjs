// Spec 014 (research R3, data-model § 1, contracts/ask-tools.md): check and normalize the asked
// result give_answer is called with. Pure: the tool hands it the read and the runtime, and this
// either returns the accepted answer or throws the first rule it breaks, with a plain message the
// mentor can act on. Nothing is saved when it throws.
//
// The hard rules live here, not only in SKILL.md: at most four one-line steps, each tagged with a
// built skill, "not taught yet" or nothing; at most two offered skills, each one a step uses (a how-to
// may carry one with no steps); a closing question; the comp named first; no steps inside the
// explanation; no keyframe skill on keyless motion (K4, from spec 015's motion-sources map); a
// control null's pivot never routed to Group with a null; on A, only a lesson that can take a
// hand-in offered. On B1 the offer is checked the same way, then the reply carries none (FR-017).

import { MentorError, MESSAGES, registerErrors } from "../errors.mjs";
import { layerInfo } from "./layer-info.mjs";
import { motionSources } from "./motion-sources.mjs";
import { readPath, shortName } from "./path.mjs";

// Data-model § 8's messages, word for word, plus four this build adds (named in the hand-back):
// ANSWER_SHAPE, KIND_MISMATCH, STEP_NEEDS_LAYER and COMP_IS_OPEN.
registerErrors({
  TOO_MANY_STEPS: "Give at most four steps; give the first three and say there's more in the closing offer.",
  BAD_STEP_SKILL: "Each step's skill must be a skill, not taught, or none.",
  BAD_OFFER: "Offer at most two skills, each one a step uses.",
  BAD_CLOSING: "End on one question that hands the choice back.",
  COMP_NOT_NAMED: "Start with the comp you read: In [comp], …",
  STEPS_IN_EXPLANATION: "Leave the steps out of the explanation; they go only in the steps.",
  KEYFRAME_SKILL_ON_KEYLESS: "That layer's motion has no keys, so a keyframe skill can't help with it.",
  ROUTE_TO_PIVOT: "That null already carries children; moving where it turns is Set the pivot.",
  OFFER_NOT_READY: "That lesson can't start from an answer yet; keep the step and leave out the offer.",
  NOT_ACTIONABLE: "A question back, an outside line or no comp has no steps and no offer.",
  ANSWER_SHAPE: "Give the answer as the tool describes it: a kind, an explanation, the steps as a list, the offered skills as a list, and a closing offer.",
  KIND_MISMATCH: "An answer has one to four steps; a description or a how-to has none. Pick the kind that fits.",
  STEP_NEEDS_LAYER: "A step tagged with a skill names the layer it's on, exactly as it appears in the comp.",
  COMP_IS_OPEN: "A comp is open, so read it and answer about it.",
});

export const KINDS = ["answer", "describe", "howto", "clarify", "outside", "no_comp"];
// Kinds whose comp comes from a read; howto and outside have no comp target (data-model § 1).
export const READ_KINDS = new Set(["answer", "describe", "clarify", "no_comp"]);
const NOTHING_ACTIONABLE = new Set(["clarify", "outside", "no_comp"]);
const NO_CLOSING = new Set(["clarify", "no_comp"]);
export const NOT_TAUGHT = "not_taught";
export const NOT_TAUGHT_LINE = "Not something I teach yet.";
// FR-022 (K4): the skills whose check reads keys.
export const KEYFRAME_SKILLS = ["easing.basic", "keyframes.types", "easing.speed_graph", "timing.offset"];
export const NULL_SKILL = "parenting.null";
export const MAX_STEPS = 4;
export const MAX_OFFERS = 2;

// FR-005: a step starts with an action. Phase 1 only warns: the list is a guess (research R3).
const ACTIONS = [
  "open", "select", "play", "press", "drag", "move", "change", "set", "click", "double-click", "right-click",
  "alt-click", "option-click", "shift-click", "cmd-click", "command-click", "ctrl-click", "choose", "turn", "add",
  "pan", "parent", "hold", "type", "ease", "apply", "unlock", "lock", "twirl", "scrub", "go", "copy", "paste",
  "delete", "trim", "look", "watch", "use", "switch", "toggle", "expand", "pick", "put", "place", "slide", "shift",
  "nudge", "duplicate", "rename", "find", "check", "reset", "make", "keep", "create", "precompose", "enable",
  "disable", "solo", "hide", "show", "raise", "lower", "convert", "pull", "lengthen", "shorten", "stretch", "with",
  "in", "on", "from", "at", "inside", "back", "undo",
];

const isStr = (v) => typeof v === "string";
const isObj = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const fail = (code, detail) => { throw new MentorError(code, detail ? `${detail} ${MESSAGES[code]}` : undefined); };
const squash = (t) => String(t).replace(/\s+/g, " ").trim().toLowerCase();

// A step's or offer's skill as the path's ID: the ID itself, or a built skill's short or full name.
// "not taught yet" in any spelling is NOT_TAUGHT; nothing is null. undefined for anything else.
export function skillIdOf(value, skills) {
  if (value === null || value === undefined || value === "") return null;
  if (!isStr(value)) return undefined;
  const v = value.trim();
  if (skills.includes(v)) return v;
  const low = v.toLowerCase().replace(/[_\s]+/g, " ");
  if (low === "not taught" || low === "not taught yet") return NOT_TAUGHT;
  const hit = readPath().skills.find((s) => skills.includes(s.id) && [s.short_name, s.name].some((n) => isStr(n) && n.toLowerCase() === low));
  return hit ? hit.id : undefined;
}

// FR-006 (contracts/ask-tools.md step 3a): a not-taught step always ends with the one sentence that
// marks it, since the panel draws no tag for it.
export function withNotTaughtLine(text) {
  const t = text.trim();
  const m = /\s*not something i teach yet\.?$/i.exec(t);
  if (m) return `${t.slice(0, m.index).trimEnd()}${m.index > 0 ? " " : ""}${NOT_TAUGHT_LINE}`;
  return `${/[.!?]$/.test(t) ? t : `${t}.`} ${NOT_TAUGHT_LINE}`;
}

// One sentence, ending in a question mark (FR-008). A sentence break is an end mark followed by space.
const oneQuestion = (t) => t.endsWith("?") && !/[.!?]["'”’)\]*_]*\s+\S/.test(t.slice(0, -1)) && !t.includes("\n");

const startsWithAction = (text) => {
  const first = text.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z-]/g, "");
  return ACTIONS.includes(first);
};

// The layers with a name, from the read: layer_info when the snapshot has it, else the keyed layers.
function layersNamed(snapshot, name) {
  if (!snapshot) return [];
  const info = layerInfo(snapshot);
  const list = info.known ? info.layers : snapshot.layers || [];
  return list.filter((l) => l.name === name);
}

// K4: the layer's own keys make motion only with two or more keys on one property (a single key is
// "set, not animated", TD § 13).
function hasKeyedMotion(map, index) {
  const e = map.layers.find((l) => l.layer_index === index);
  return !!e && e.own_keys.some((k) => k.keys >= 2);
}

function nullWithChildren(snapshot, map, index) {
  const info = layerInfo(snapshot).layers.find((l) => l.index === index);
  const e = map.layers.find((l) => l.layer_index === index);
  return !!info && info.is_null === true && !!e && Array.isArray(e.children) && e.children.length > 0;
}

// input: give_answer's arguments. ctx: { runtime: "a" | "b1", skills: the built skill IDs,
// handInReady(id): can that lesson take a hand-in (R13), snapshot: the read (null with no read),
// noComp: the read found no active comp }.
// → { reply, offered (the checked offer, kept on B1 too), warnings }
export function checkAnswer(input, ctx) {
  const { runtime = "b1", skills = [], handInReady = () => false, snapshot = null, noComp = false } = ctx || {};
  if (!isObj(input)) fail("ANSWER_SHAPE");
  const { kind, explanation, closing_offer } = input;
  const rawSteps = input.steps === undefined || input.steps === null ? [] : input.steps;
  const rawOffers = input.offered_skills === undefined || input.offered_skills === null ? [] : input.offered_skills;
  if (!KINDS.includes(kind) || !isStr(explanation) || !explanation.trim() || !Array.isArray(rawSteps) || !Array.isArray(rawOffers) ||
    !(closing_offer === undefined || closing_offer === null || isStr(closing_offer))) fail("ANSWER_SHAPE");
  if (!rawSteps.every((s) => isObj(s) && isStr(s.text) && (s.layer === undefined || s.layer === null || isStr(s.layer)))) fail("ANSWER_SHAPE");
  if (!rawOffers.every(isStr)) fail("ANSWER_SHAPE");

  // Which comp: the read's, never the input's. no_comp is right only when the read found none.
  if (kind === "no_comp" && !noComp) fail("COMP_IS_OPEN");
  if (noComp && READ_KINDS.has(kind) && kind !== "no_comp") throw new MentorError("NO_ACTIVE_COMP");
  const compName = READ_KINDS.has(kind) && kind !== "no_comp" && snapshot && snapshot.comp ? snapshot.comp.name : null;

  const closing = isStr(closing_offer) && closing_offer.trim() ? closing_offer.trim() : null;
  if (NOTHING_ACTIONABLE.has(kind) && (rawSteps.length || rawOffers.length)) fail("NOT_ACTIONABLE");
  if (NO_CLOSING.has(kind) && closing) fail("NOT_ACTIONABLE");
  if (kind === "answer" && rawSteps.length === 0) fail("KIND_MISMATCH");
  if ((kind === "describe" || kind === "howto") && rawSteps.length > 0) fail("KIND_MISMATCH");

  if (rawSteps.length > MAX_STEPS) fail("TOO_MANY_STEPS");
  const steps = rawSteps.map((s, i) => {
    const text = s.text.trim();
    if (!text || /[\r\n]/.test(text)) fail("TOO_MANY_STEPS", `Step ${i + 1} is empty or runs over more than one line.`);
    const skill = skillIdOf(s.skill, skills);
    if (skill === undefined) fail("BAD_STEP_SKILL", `Step ${i + 1}'s skill isn't one of the six.`);
    const layer = isStr(s.layer) && s.layer.trim() ? s.layer.trim() : null;
    if (layer && !layersNamed(snapshot, layer).length) {
      throw new MentorError("UNKNOWN_LAYER", `Step ${i + 1}'s layer isn't in ${compName}. ${MESSAGES.UNKNOWN_LAYER}`);
    }
    if (skill && skill !== NOT_TAUGHT && !layer) fail("STEP_NEEDS_LAYER", `Step ${i + 1} has a skill and no layer.`);
    return { text: skill === NOT_TAUGHT ? withNotTaughtLine(text) : text, skill, layer };
  });

  const offered = [];
  for (const o of rawOffers) {
    const id = skillIdOf(o, skills);
    if (!id || id === NOT_TAUGHT) fail("BAD_OFFER");
    if (!offered.includes(id)) offered.push(id);
  }
  const stepSkills = steps.map((s) => s.skill).filter((k) => k && k !== NOT_TAUGHT);
  if (offered.length > (kind === "howto" ? 1 : MAX_OFFERS)) fail("BAD_OFFER");
  if (kind !== "howto" && !offered.every((o) => stepSkills.includes(o))) fail("BAD_OFFER");

  if (!NO_CLOSING.has(kind)) {
    if (!closing) fail("BAD_CLOSING");
    if ((steps.length || offered.length) && !oneQuestion(closing)) fail("BAD_CLOSING");
  }

  const expl = explanation.trim();
  if ((kind === "answer" || kind === "describe") && compName && !expl.split("\n")[0].toLowerCase().includes(compName.toLowerCase())) {
    fail("COMP_NOT_NAMED");
  }
  if (/^\s*\d+[.)]\s/m.test(expl) || /\bsteps?\s*:/i.test(expl)) fail("STEPS_IN_EXPLANATION");
  const flat = squash(expl);
  for (const s of steps) {
    const core = squash(s.text.replace(/\s*not something i teach yet\.?$/i, ""));
    if (core.length >= 20 && flat.includes(core)) fail("STEPS_IN_EXPLANATION");
  }

  // K4 and FR-027 read the motion-sources map of the same read.
  const map = snapshot && steps.length ? motionSources(snapshot) : null;
  steps.forEach((s, i) => {
    if (!map || !s.layer || !KEYFRAME_SKILLS.includes(s.skill)) return;
    const keyed = layersNamed(snapshot, s.layer).some((l) => hasKeyedMotion(map, l.index));
    if (!keyed) fail("KEYFRAME_SKILL_ON_KEYLESS", `Step ${i + 1} is on ${s.layer}.`);
  });
  if (map && offered.includes(NULL_SKILL)) {
    const onNull = steps.some((s) => s.skill === NULL_SKILL && s.layer && layersNamed(snapshot, s.layer).some((l) => nullWithChildren(snapshot, map, l.index)));
    if (onNull) fail("ROUTE_TO_PIVOT");
  }
  if (runtime === "a") for (const o of offered) if (!handInReady(o)) fail("OFFER_NOT_READY");

  const replyOffers = runtime === "a" ? offered : [];
  const tags = {};
  for (const id of [...stepSkills, ...replyOffers]) tags[id] = shortName(id);
  const warnings = steps
    .map((s, i) => (startsWithAction(s.text) ? null : `Step ${i + 1} may not start with something to do in After Effects; a step starts with the action, like Select, Open or Play.`))
    .filter(Boolean);

  const reply = {
    kind,
    comp: compName,
    explanation: expl,
    steps,
    offered_skills: replyOffers,
    closing_offer: NO_CLOSING.has(kind) ? null : closing,
    runtime: runtime === "a" ? "a" : "b1",
    tags,
  };
  if (warnings.length) reply.warnings = warnings;
  return { reply, offered, warnings };
}
