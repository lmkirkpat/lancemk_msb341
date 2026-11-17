// A give_answer tool result → the AskView the thread draws (spec 014 FR-016, FR-017, FR-048,
// data-model § 7, contracts/panel-ask.md). Pure. The panel never reads the mentor's prose (PQ-1):
// the explanation, the steps, the offers and the closing offer all come from this one result.
// Anything missing, malformed or out of shape returns null, and the thread falls back to the
// mentor's words as they came, with no Steps, no dock and no Go deeper (fail closed).
"use strict";

const ANSWER_TOOL = "give_answer";
const KINDS = ["answer", "describe", "howto", "clarify", "outside", "no_comp"];
const NOT_TAUGHT = "not_taught";
const MAX_STEPS = 4;
const MAX_OFFERS = 2;

const isObj = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const isStr = (v) => typeof v === "string";
const strOrNull = (v) => v === null || isStr(v);
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

function validStep(s) {
  return isObj(s) && isStr(s.text) && s.text.trim() !== "" && strOrNull(s.skill) && (s.skill === null || s.skill !== "") && (s.layer === undefined || strOrNull(s.layer));
}

// The tool's reply (data-model § 1) → { ok: true } or a reason, for tests and the log only.
function check(j) {
  if (!isObj(j)) return "not an object";
  if (!KINDS.includes(j.kind)) return "kind";
  if (!isStr(j.explanation)) return "explanation";
  if (!Array.isArray(j.steps) || j.steps.length > MAX_STEPS || !j.steps.every(validStep)) return "steps";
  if (!Array.isArray(j.offered_skills) || j.offered_skills.length > MAX_OFFERS || !j.offered_skills.every((o) => isStr(o) && o !== "" && o !== NOT_TAUGHT)) return "offers";
  if (!strOrNull(j.closing_offer)) return "closing offer";
  if (!isObj(j.tags) || !Object.values(j.tags).every(isStr)) return "tags";
  const stepSkills = j.steps.map((s) => s.skill).filter((k) => k && k !== NOT_TAUGHT);
  if (![...stepSkills, ...j.offered_skills].every((k) => own(j.tags, k) && j.tags[k].trim() !== "")) return "tags";
  const steps = j.steps.length;
  const offers = j.offered_skills.length;
  if (j.kind === "answer" && steps === 0) return "an answer with no steps";
  if ((j.kind === "describe" || j.kind === "howto") && steps > 0) return "steps on a kind with none";
  if (["clarify", "outside", "no_comp"].includes(j.kind) && (steps > 0 || offers > 0)) return "nothing actionable";
  // PQ-4: a how-to with no comp target may offer its one lesson; every other offer is a step's skill.
  if (j.kind === "howto") { if (offers > 1) return "offers"; } else if (!j.offered_skills.every((o) => stepSkills.includes(o))) return "offers";
  return null;
}

// ev: the tool_result event ({ name, ok, json }). opts: { runtime: "a" | "b1" }, the panel's own.
function askView(ev, opts) {
  if (!ev || ev.name !== ANSWER_TOOL || !ev.ok) return null;
  const j = ev.json;
  if (check(j) !== null) return null;
  // FR-017: on B1 nothing can hand over, so no Go deeper is ever drawn (a display guard; the server
  // already returns no offers there, research R4).
  const onA = !!opts && opts.runtime === "a" && j.runtime !== "b1";
  return {
    kind: j.kind,
    explanation: j.explanation,
    steps: j.steps.map((s, i) => ({
      number: i + 1,
      text: s.text,
      tag: s.skill && s.skill !== NOT_TAUGHT ? j.tags[s.skill] : null,
      not_taught: s.skill === NOT_TAUGHT,
    })),
    offers: onA ? j.offered_skills.map((skill) => ({ skill, tag: j.tags[skill] })) : [],
    closing_offer: j.closing_offer,
  };
}

// FR-048 with no prose: the mentor writes nothing outside give_answer on an answer turn (PQ-1), so a
// result the panel can't draw falls back to its own words as they came: the explanation, each usable
// step's text as a plain line (no Steps heading, no numbers, no tags), then the closing offer (T035
// design review item 5). → that text, or null when none of it is usable.
function fallbackText(ev) {
  if (!ev || ev.name !== ANSWER_TOOL || !ev.ok || !isObj(ev.json)) return null;
  const j = ev.json;
  const usable = (x) => isStr(x) && x.trim() !== "";
  const steps = Array.isArray(j.steps) ? j.steps.map((s) => (isObj(s) ? s.text : s)).filter(usable).map((x) => x.trim()) : [];
  const parts = [j.explanation, steps.join("\n"), j.closing_offer].filter(usable);
  return parts.length ? parts.join("\n\n") : null;
}

module.exports = { askView, fallbackText, check, ANSWER_TOOL, KINDS };
