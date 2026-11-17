// The ask set's deterministic checks (spec 014 T032, FR-061), kept apart from the runner so they can be
// unit-tested without a model (test/checks.test.mjs). Node built-ins only.
//
// The answer turn has no prose of its own (research R2): the answer is the fields of the turn's last
// accepted `give_answer` call. Every check here reads the tool's reply (what the panel would draw), never
// free prose, except `answer_prose_empty`, which asks that there be none.
//
// Events are the runners': { kind: "say", text } and { kind: "tool", name, input, ok, result }, names
// without the MCP prefix.

import { countSentences } from "../lib/turn-checks.mjs";

export const ANSWER_TOOL = "give_answer";
export const KEYFRAME_SKILLS = ["easing.basic", "keyframes.types", "easing.speed_graph", "timing.offset"];
export const SKILLS = [...KEYFRAME_SKILLS, "transform.anchor", "parenting.null"];
export const NOT_TAUGHT = "not_taught";
export const NOT_TAUGHT_SUFFIX = "Not something I teach yet.";
export const NO_STEPS_KINDS = ["describe", "howto", "clarify", "outside", "no_comp"];
export const NO_OFFER_KINDS = ["clarify", "outside", "no_comp"];
export const KINDS = ["answer", "describe", "howto", ...["clarify", "outside", "no_comp"]];

// ---------- reading the answer back from the calls ----------

const parse = (text) => { try { return JSON.parse(text); } catch { return null; } };
const tools = (turn) => (turn?.events || []).filter((e) => e.kind === "tool");
const saysOf = (turn) => (turn?.events || []).filter((e) => e.kind === "say").map((e) => e.text);

// The turn's answer calls: accepted (ok, reply parses to an object) and refused.
export function answerCalls(turn) {
  const calls = tools(turn).filter((e) => e.name === ANSWER_TOOL);
  const accepted = [];
  const refused = [];
  for (const e of calls) {
    const reply = e.ok ? parse(e.result) : null;
    if (reply && typeof reply === "object") accepted.push({ ev: e, reply });
    else refused.push({ ev: e, code: refusalCode(e.result) });
  }
  return { calls, accepted, refused };
}

// Refusals are plain messages with a code (research R3). A known code wins; else the first ALL_CAPS word
// with an underscore; else UNKNOWN.
export const REFUSAL_CODES = ["TOO_MANY_STEPS", "BAD_STEP_SKILL", "BAD_OFFER", "BAD_CLOSING", "COMP_NOT_NAMED", "STEPS_IN_EXPLANATION", "KEYFRAME_SKILL_ON_KEYLESS", "ROUTE_TO_PIVOT", "OFFER_NOT_READY", "NOT_ACTIONABLE", "ANSWER_SHAPE", "KIND_MISMATCH", "STEP_NEEDS_LAYER", "COMP_IS_OPEN", "NOT_PLAIN_WORDS", "NO_ACTIVE_COMP", "AE_UNREACHABLE", "AE_BUSY"];
export function refusalCode(text) {
  const t = String(text || "");
  const known = REFUSAL_CODES.find((c) => t.includes(c));
  if (known) return known;
  const m = /\b[A-Z]+_[A-Z_]+\b/.exec(t);
  return m ? m[0] : "UNKNOWN";
}

// What the learner would see, in the order the panel draws it.
export function answerOf(turn) {
  const { accepted } = answerCalls(turn);
  return accepted.length ? accepted.at(-1).reply : null;
}

export const stepsOf = (a) => (Array.isArray(a?.steps) ? a.steps : []);
export const offeredOf = (a) => (Array.isArray(a?.offered_skills) ? a.offered_skills : []);

// Learner-visible pieces: explanation, each step's text, the closing offer. Skill IDs and layer fields are
// data the panel turns into tags, never words the learner reads, so they are left out.
export function pieces(a) {
  if (!a) return { explanation: "", steps: [], offer: "", all: "" };
  const explanation = String(a.explanation ?? "");
  const steps = stepsOf(a).map((s) => String(s?.text ?? ""));
  const offer = String(a.closing_offer ?? "");
  return { explanation, steps, offer, all: [explanation, ...steps, offer].filter(Boolean).join("\n") };
}

export const wordCount = (text) => (String(text).match(/[A-Za-z0-9][A-Za-z0-9'’.°/-]*/g) || []).length;

// ---------- patterns ----------

// The learner sees every word: no field or value name from tool output (agent audit 2026-10-12).
export const INTERNAL_NAME = new RegExp([
  String.raw`\b[a-z]+_[a-z_]+\b`,
  String.raw`\b(?:easing|keyframes|transform|parenting|timing|motion|shape)\.[a-z_]+\b`,
  "[\"'`](?:answer|describe|howto|clarify|outside|no_comp|not_taught)[\"'`]",
].join("|"));
export const NARRATION = /\bmust (?:call|run|check|diff|snapshot|read)\b[^.]*\bfirst\b|\b(?:let me|I'll|I will|now I'll|I'm going to) (?:call|run|use|check|read|look up|look at) (?:the )?(?:answer|tool|read|layers?|comp|expression)/i;
export const SYNTH_TELL = /\bsynthetic\b|\bfixture\b|\bstand-in\b|\bthe eval\b|\bthis test\b|\bplanted\b/i;
export const NO_SLASH_COMMAND = /(?<![\w/])\/[a-z][a-z-]*mentor(?![\w-])/i;
// "can't see" about what the read returned (AB 1). "I couldn't see inside [precomp]" is the allowed form.
export const CANT_SEE = /\b(?:can(?:'|’)?t|cannot|can not|couldn(?:'|’)?t|could not|unable to) see\b(?!\s+inside)/i;
export const UNDO = /\bundo\b|\b(?:ctrl|cmd|command|⌘)\s*\+?\s*z\b/i;
export const CODE = /`|\bwiggle\s*\(|\bvalue\s*[+\-*]\s*[\[\d]|\bMath\.|\bthisComp\b|\bamps?\s*=|=>/;
export const STEP_LIST_IN_PROSE = /^\s*(?:\d+\s*[.)]|step\s*\d)/im;
export const STEPS_LABEL = /\bsteps?\s*:/i;
const ACTION = /^(?:open|select|move|drag|change|play|watch|set|pan|press|click|add|turn|look|check|use|find|duplicate|unlock|hold|toggle|expand|reveal|scrub|preview|choose|right-click|double-click|press|hit|switch|enable|disable|show|hide|raise|lower|apply|go|try|read)\b/i;

// ---------- checks ----------

// `ctx`: { turns, c (the case), runtime, fixtures: { [turnIndex]: { comp, layers: [names], sweeps: bool } },
//          record: { start, end } | null, allowed: [tool names the ask skill may call] }
// → [{ check, pass, detail, warn? }]. A check with `warn: true` is reported, never failed.
export function askChecks(expect, ctx) {
  const { turns, c, runtime } = ctx;
  const out = [];
  const add = (check, pass, detail, extra = {}) => out.push({ check, pass, detail, ...extra });
  const runtimeOk = (x) => !x.runtimes || x.runtimes.includes(runtime);

  const prose = turns.flatMap(saysOf);
  const answered = turns.map((t, i) => ({ i: i + 1, t, ...answerCalls(t), a: answerOf(t) }));
  const allText = (n) => [...(n ? saysOf(turns[n - 1]) : prose), ...answered.filter((x) => !n || x.i === n).map((x) => pieces(x.a).all)].join("\n");

  // Words the learner reads: prose plus every answer's pieces.
  const reads = [...prose, ...answered.map((x) => pieces(x.a).all)].filter(Boolean).join("\n");
  const never = (name, re, detail = "said") => {
    const m = reads.match(re);
    add(name, !m, m ? `${detail} "${m[0]}"` : "clean");
  };
  never("plain_words", INTERNAL_NAME);
  never("no_narration", NARRATION);
  never("no_test_tell", SYNTH_TELL);
  never("no_slash_command", NO_SLASH_COMMAND);
  never("no_cant_see", CANT_SEE);
  never("no_undo", UNDO);
  never("no_code", CODE);

  // Tools: only the ask skill's reads and its answer. Nothing that changes the project, and no lesson starts
  // without a yes (this phase's set never says yes).
  const called = turns.flatMap(tools).map((e) => e.name).filter((n) => n !== "ToolSearch");
  const allowed = new Set(ctx.allowed);
  const foreign = called.filter((n) => !allowed.has(n));
  add("only_ask_tools", foreign.length === 0, foreign.length ? `used ${[...new Set(foreign)].join(", ")}` : "ok");
  const changing = called.filter((n) => /_demo$|^set_|^pan_|^record_lesson$|^apply_/.test(n));
  add("no_project_change", changing.length === 0, changing.length ? `called ${[...new Set(changing)].join(", ")}` : "none called");
  const started = called.filter((n) => n === "Skill" || n === "go_deeper" || /snapshot/.test(n) || n === "recommend_next");
  add("no_lesson_started", started.length === 0, started.length ? `called ${[...new Set(started)].join(", ")}` : "none started");

  // Read before answer (FR-001): the tool can't enforce it. For a comp-based answer (answer, describe, clarify),
  // describe_layers was called earlier in the case than the first give_answer call of that turn.
  {
    const seq = turns.flatMap((t, i) => tools(t).filter((e) => e.name !== "ToolSearch").map((e) => ({ n: e.name, turn: i + 1 })));
    answered.forEach((x) => {
      const k = x.accepted[0]?.reply?.kind;
      if (!["answer", "describe", "clarify"].includes(k)) return;
      const firstAnswer = seq.findIndex((e) => e.n === ANSWER_TOOL && e.turn === x.i);
      const read = seq.findIndex((e) => e.n === "describe_layers");
      add(`read_before_answer@${x.i}`, read >= 0 && read < firstAnswer, read < 0 ? "give_answer without any describe_layers read" : read > firstAnswer ? "describe_layers came after give_answer" : "ok");
    });
  }

  // The asked entry changes no skill state (FR-061): the learner record's skills and lessons are as they began.
  if (ctx.record) {
    const pick = (r) => JSON.stringify({ skills: r?.skills ?? {}, lessons: r?.lessons ?? [] });
    add("record_skills_unchanged", pick(ctx.record.start) === pick(ctx.record.end), pick(ctx.record.start) === pick(ctx.record.end) ? "unchanged" : "the record's skills or lessons changed");
  }

  // One accepted answer per answer turn, and no prose next to it (research R2).
  const answers = expect.answers || [];
  for (const x of answered) {
    if (x.accepted.length > 1) add(`one_answer@${x.i}`, false, `${x.accepted.length} accepted give_answer calls in turn ${x.i}`);
    if (x.a) {
      const words = saysOf(x.t).join(" ").trim();
      add(`answer_prose_empty@${x.i}`, words === "", words ? `said "${words.slice(0, 70)}" next to the answer` : "no prose");
    }
  }

  for (const want of answers) {
    const x = answered[want.turn - 1];
    const label = `@${want.turn}`;
    if (!x || !x.a) {
      add(`answer_given${label}`, false, `no accepted ${ANSWER_TOOL} call in turn ${want.turn}${x?.refused.length ? ` (${x.refused.length} refused: ${x.refused.map((r) => r.code).join(", ")})` : ""}`);
      continue;
    }
    add(`answer_given${label}`, true, `kind ${x.a.kind}`);
    const a = x.a;
    const kinds = [].concat(want.kind);
    add(`kind${label}`, kinds.includes(a.kind), `kind was ${a.kind} (wanted ${kinds.join(" or ")})`);
    const p = pieces(a);
    const steps = stepsOf(a);
    const offered = offeredOf(a);
    const fx = ctx.fixtures[want.turn - 1] || {};

    // Shape by kind (data-model § 1, research R3), re-checked because the tool is what's under test.
    if (NO_STEPS_KINDS.includes(a.kind)) add(`no_steps_for_kind${label}`, steps.length === 0, steps.length ? `${a.kind} carried ${steps.length} steps` : "none");
    if (a.kind === "answer") add(`steps_one_to_four${label}`, steps.length >= 1 && steps.length <= 4, `${steps.length} steps`);
    if (want.steps) add(`steps_count${label}`, steps.length >= want.steps[0] && steps.length <= want.steps[1], `${steps.length} steps (wanted ${want.steps[0]} to ${want.steps[1]})`);
    if (NO_OFFER_KINDS.includes(a.kind)) add(`no_offer_for_kind${label}`, offered.length === 0 && !(a.closing_offer), offered.length || a.closing_offer ? `${a.kind} carried an offer` : "none");

    // Offers (FR-008, FR-016, FR-017): none on B1; on A at most two, each among the steps' skills.
    const stepSkills = new Set(steps.map((s) => s?.skill).filter((s) => SKILLS.includes(s)));
    const badOffer = offered.filter((s) => !SKILLS.includes(s) || (!stepSkills.has(s) && !(a.kind === "howto" && steps.length === 0)));
    add(`offers_valid${label}`, runtime === "b1" ? offered.length === 0 : offered.length <= 2 && badOffer.length === 0,
      runtime === "b1" ? (offered.length ? `B1 carried offered skills: ${offered.join(", ")}` : "none on B1")
        : offered.length > 2 ? `${offered.length} offered skills` : badOffer.length ? `offered ${badOffer.join(", ")}, not among the steps' skills` : `${offered.length} offered`);
    add(`runtime_field${label}`, a.runtime === runtime, `reply runtime was ${a.runtime ?? "(none)"}`);

    // Closing offer: one sentence, a question, when there are steps (FR-008).
    if (steps.length || offered.length) {
      const n = countSentences(a.closing_offer || "");
      add(`closing_offer${label}`, !!a.closing_offer && /\?\s*$/.test(a.closing_offer) && n === 1, a.closing_offer ? `${n} sentence(s)${/\?\s*$/.test(a.closing_offer) ? "" : ", no question mark"}` : "none");
    }

    // First line names the comp (FR-003): for answer and describe.
    if (["answer", "describe"].includes(a.kind) && fx.comp) {
      const first = p.explanation.split("\n")[0];
      add(`first_line_names_comp${label}`, first.includes(fx.comp), first.includes(fx.comp) ? `names ${fx.comp}` : `first line "${first.slice(0, 60)}" doesn't name ${fx.comp}`);
    }

    // No step list in the prose (FR-009).
    const dup = steps.find((s) => s?.text && p.explanation.includes(String(s.text).slice(0, 30)));
    add(`no_step_list_in_prose${label}`, !STEP_LIST_IN_PROSE.test(p.explanation) && !STEPS_LABEL.test(p.explanation) && !dup,
      STEP_LIST_IN_PROSE.test(p.explanation) ? "the explanation is numbered" : STEPS_LABEL.test(p.explanation) ? "the explanation says \"Steps:\"" : dup ? `the explanation repeats a step: "${String(dup.text).slice(0, 40)}"` : "clean");

    // Steps: skills known, layers real, the not-taught marker present (step 3a), the verb an action (warned).
    const badSkill = steps.filter((s) => !(s && (SKILLS.includes(s.skill) || s.skill === NOT_TAUGHT || s.skill === null)));
    add(`step_skills_known${label}`, badSkill.length === 0, badSkill.length ? `unknown skill ${JSON.stringify(badSkill[0]?.skill)}` : "ok");
    if (fx.layers) {
      const bad = steps.filter((s) => s && s.layer != null && !fx.layers.includes(s.layer));
      add(`step_layers_real${label}`, bad.length === 0, bad.length ? `step names layer "${bad[0].layer}", not in the comp` : "ok");
    }
    const unmarked = steps.filter((s) => s?.skill === NOT_TAUGHT && !String(s.text || "").trim().endsWith(NOT_TAUGHT_SUFFIX));
    add(`not_taught_marked${label}`, unmarked.length === 0, unmarked.length ? `a not-taught step lacks "${NOT_TAUGHT_SUFFIX}"` : "ok");
    const notActions = steps.filter((s) => !ACTION.test(String(s?.text || "").trim()));
    if (notActions.length) add(`step_starts_with_action${label}`, false, `"${String(notActions[0].text).slice(0, 50)}" doesn't start with an action verb (the list is a guess)`, { warn: true });

    // Length: about 120 words, the whole answer (a guess to tune; reported, not failed).
    const words = wordCount(p.all);
    if (words > 150) add(`answer_length${label}`, false, `${words} words (about 120 wanted)`, { warn: true });

    // Keyframe skills never offered or tagged where the motion has no keys (FR-022, K4).
    if (want.no_keyframe_skills) {
      const bad = [...new Set([...steps.map((s) => s?.skill), ...offered])].filter((s) => KEYFRAME_SKILLS.includes(s));
      add(`no_keyframe_skills${label}`, bad.length === 0, bad.length ? `tagged or offered ${bad.join(", ")}` : "none");
    }
    // Skills in the steps.
    if (want.step_skills_include) {
      const missing = want.step_skills_include.filter((s) => !stepSkills.has(s));
      add(`step_skills_include${label}`, missing.length === 0, missing.length ? `no step tagged ${missing.join(", ")} (tags: ${[...stepSkills].join(", ") || "none"})` : "ok");
    }
    if (want.step_skills_forbid) {
      const bad = want.step_skills_forbid.filter((s) => stepSkills.has(s) || offered.includes(s));
      add(`step_skills_forbid${label}`, bad.length === 0, bad.length ? `used ${bad.join(", ")}` : "none");
    }
    // Offered skills, exactly (A only: B1 always strips them).
    for (const o of want.offered_equals ? [want.offered_equals] : []) {
      if (runtime === "a") add(`offered_equals${label}`, JSON.stringify([...offered].sort()) === JSON.stringify([...o].sort()), `offered ${JSON.stringify(offered)} (wanted ${JSON.stringify(o)})`);
    }
    // A step on this layer.
    if (want.step_on_layer) add(`step_on_layer${label}`, steps.some((s) => s?.layer === want.step_on_layer), `no step on ${want.step_on_layer} (steps are on ${[...new Set(steps.map((s) => s?.layer ?? "(none)"))].join(", ") || "none"})`);
    // Sentence caps on a field.
    for (const m of want.max_sentences || []) {
      const n = countSentences(m.field === "closing_offer" ? p.offer : p.explanation);
      add(`max_sentences:${m.field}${label}`, n <= m.max, `${n} sentences in the ${m.field} (at most ${m.max})`);
    }
    // Step text order (FR-007, OQ-6): sources with a pixel size first, biggest first. `first` and `then` are
    // regexes over the step text; when `then` is present `first` must come before it.
    for (const o of want.step_text_order || []) {
      const at = (re) => steps.findIndex((s) => new RegExp(re, "i").test(String(s?.text || "")));
      const first = at(o.first);
      const then = at(o.then);
      if (o.needs_sweeps && !fx.sweeps) add(`step_text_order:${o.id}${label}`, true, "skipped: the fixture has no expression sweeps");
      else add(`step_text_order:${o.id}${label}`, first >= 0 && (then < 0 || first < then), first < 0 ? `no step matches /${o.first}/` : then < 0 ? "ok (the later one isn't present)" : `/${o.first}/ at ${first + 1}, /${o.then}/ at ${then + 1}`);
    }
    // Step order, when the read gives how much each source moves the layer (spec 015's sweeps): the fixture
    // must carry sweeps for it to count.
    for (const o of want.step_order || []) {
      const first = steps.findIndex((s) => s?.skill === o.first);
      const then = steps.findIndex((s) => s?.skill === o.then);
      if (o.needs_sweeps && !fx.sweeps) add(`step_order:${o.id}${label}`, true, "skipped: the fixture has no expression sweeps yet (T015's live capture)");
      else add(`step_order:${o.id}${label}`, first >= 0 && then >= 0 ? first < then : first >= 0 || then < 0, first < 0 ? `no step tagged ${o.first}` : then < 0 ? "ok (the later one isn't present)" : `${o.first} at ${first + 1}, ${o.then} at ${then + 1}`);
    }
  }

  // Turns that must NOT be an answer turn (a follow-up is plain prose, research R2).
  for (const n of expect.no_answer_turns || []) {
    const x = answered[n - 1];
    add(`no_answer@${n}`, !x || x.calls.length === 0, x && x.calls.length ? `called ${ANSWER_TOOL} in turn ${n}` : "prose only");
  }
  // The first mentor tool a turn calls.
  for (const w of expect.turn_first_tool || []) {
    const first = tools(turns[w.turn - 1]).find((e) => e.name !== "ToolSearch");
    add(`turn_first_tool@${w.turn}`, first?.name === w.tool, `turn ${w.turn}'s first tool was ${first?.name ?? "(none)"}`);
  }
  if (expect.tools_called) {
    const missing = expect.tools_called.filter((n) => !called.includes(n));
    add("tools_called", missing.length === 0, missing.length ? `never called ${missing.join(", ")}` : "all called");
  }
  if (expect.tools_not_called) {
    const hit = expect.tools_not_called.filter((n) => called.includes(n));
    add("tools_not_called", hit.length === 0, hit.length ? `called ${hit.join(", ")}` : "none called");
  }

  // Text checks over what the learner reads: { id, must | never, cs?, turns?, in?: "all"|"explanation"|"steps"|"offer", runtimes? }.
  for (const s of expect.text || []) {
    if (!runtimeOk(s)) continue;
    const turnsOf = Array.isArray(s.turns) ? s.turns : turns.map((_, i) => i + 1);
    const source = turnsOf.map((n) => {
      const a = answered[n - 1]?.a;
      const p = pieces(a);
      const field = s.in === "explanation" ? p.explanation : s.in === "steps" ? p.steps.join("\n") : s.in === "offer" ? p.offer : s.in === "prose" ? saysOf(turns[n - 1]).join("\n") : allText(n);
      return field;
    }).join("\n");
    const re = new RegExp(s.must || s.never, s.cs ? "" : "i");
    const m = source.match(re);
    const where = `${s.in || "all"} of turn${turnsOf.length > 1 ? "s" : ""} ${turnsOf.join(", ")}`;
    if (s.must) add(`text:${s.id}`, !!m, m ? `${where}: "${m[0]}"` : `${where}: never matched /${s.must}/`);
    else add(`text:${s.id}`, !m, m ? `${where} said "${m[0]}"` : `${where}: clean`);
  }
  for (const s of expect.prose_max_sentences || []) {
    const n = countSentences(s.turns.flatMap((t) => saysOf(turns[t - 1])).join("\n"));
    add(`prose_max_sentences:${s.id}`, n <= s.max, `${n} sentences of prose in turn ${s.turns.join(", ")} (at most ${s.max})`);
  }
  return out;
}

// What a run's refusals were: [{ turn, code }].
export function refusalsOf(turns) {
  return turns.flatMap((t, i) => answerCalls(t).refused.map((r) => ({ turn: i + 1, code: r.code })));
}
export const answerCallCount = (turns) => turns.reduce((n, t) => n + answerCalls(t).calls.length, 0);

// ---------- the answer, as the judge reads it ----------

export function renderAnswer(a, runtime) {
  if (!a) return "(no accepted answer in this turn)";
  const tags = a.tags || {};
  const steps = stepsOf(a);
  const tag = (s) => (s.skill === NOT_TAUGHT ? "no tag: not taught yet" : s.skill ? `tag: ${tags[s.skill] || s.skill}` : "no tag");
  const lines = [`ANSWER (kind: ${a.kind}; what the learner sees, rebuilt from the answer call)`, String(a.explanation ?? "")];
  if (steps.length) {
    lines.push("", "STEPS (drawn by the panel from step data, numbered, with each tag)");
    steps.forEach((s, i) => lines.push(`${i + 1}. ${s.text}  [${tag(s)}${s.layer ? `; layer: ${s.layer}` : ""}]`));
  }
  if (a.closing_offer) lines.push("", `CLOSING OFFER: ${a.closing_offer}`);
  const offered = offeredOf(a);
  lines.push("", `GO DEEPER BUTTONS: ${offered.length ? offered.map((s) => tags[s] || s).join(", ") : runtime === "b1" ? "none (B1 never offers; judge the closing offer's wording and the tags only)" : "none"}`);
  lines.push(`WORDS: ${wordCount(pieces(a).all)}`);
  return lines.join("\n");
}

// ---------- fixtures ----------

// → { comp, layers: [names], sweeps: bool, problems: [..] } for a snapshot object.
export function fixtureFacts(snap) {
  const problems = [];
  const info = snap?.layer_info || [];
  const idx = info.map((l) => l.index);
  if (!snap?.comp?.name) problems.push("no comp name");
  if (new Set(idx).size !== idx.length) problems.push("duplicate layer indexes");
  const has = new Set(idx);
  for (const l of info) {
    if (l.parent != null && !has.has(l.parent)) problems.push(`layer ${l.index} has parent ${l.parent}, not in the comp`);
    if (l.matte && !has.has(l.matte.layer)) problems.push(`layer ${l.index}'s matte is layer ${l.matte.layer}, not in the comp`);
  }
  for (const l of snap?.layers || []) if (!has.has(l.index)) problems.push(`keyed layer ${l.index} has no layer_info`);
  for (const e of snap?.expressions || []) if (!has.has(e.layer)) problems.push(`an expression is on layer ${e.layer}, not in the comp`);
  return { comp: snap?.comp?.name, layers: info.map((l) => l.name), sweeps: (snap?.expression_sweeps || []).length > 0, problems };
}
