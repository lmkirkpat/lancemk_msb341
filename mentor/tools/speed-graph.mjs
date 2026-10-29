// Skill 2's tools (spec 008 contracts/tools.md; spec 004 contracts/skill-module.md › 3): read the
// comp and start or continue the lesson, demonstrate on one pair, check the learner's shapes.
// The analysis and check are pure, in mentor/lib/speed-graph.mjs.

import { runSnippet } from "../bridge-client.mjs";
import { demoLayer } from "../lib/demo-layer.mjs";
import { MentorError } from "../errors.mjs";
import { parseSegmentId } from "../lib/analyze.mjs";
import { parseHost } from "../lib/host.mjs";
import { json } from "../lib/reply.mjs";
import * as session from "../lib/session.mjs";
import { takeSnapshot } from "../lib/snapshot.mjs";
import { serverCurrent } from "../lib/server-current.mjs";
import { opening } from "../lib/opening.mjs";
import { DEMO_IN, DEMO_OUT, analyze, check, finder, pairsFor } from "../lib/speed-graph.mjs";

const SKILL = "easing.speed_graph";
export const SKILLS = [SKILL];

// recommend_next's question (contract › 2): a count above 0 exactly when the snapshot tool would find
// a target with the same exclude and kept-linear marks. Review mode is built and tested (FR-021).
export const FINDERS = {
  [SKILL]: {
    focus(snapshot, { exclude = [], kept_linear } = {}) {
      return finder(snapshot, { exclude, kept_linear });
    },
    review: true,
  },
};

const NOT_THIS_LESSON = "There's no speed graph lesson in progress. Take a snapshot of the comp first.";

// The current lesson, if it's this skill's. Another skill's lesson never gets this skill's demo or
// check.
function ownLesson() {
  const lesson = session.currentLesson(); // NO_SESSION
  if (lesson.skill !== SKILL) throw new MentorError("NO_SESSION", NOT_THIS_LESSON);
  return lesson;
}

// Only the two lists the analyzer reads, as plain data the session can store (data-model ›
// skill_options). A call that sends them replaces both.
function cleanOptions(o) {
  const strings = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : []);
  return { eased_layers: strings(o && o.eased_layers), land_hard: strings(o && o.land_hard) };
}

// FR-047: the land-hard pairs in plain words, in pairs[].label's form, from the lesson's baseline
// (they leave the targets, so pairs never names them). Same order as landing_hard; null for an id
// that names no pair there.
function landingHardLabels(lesson) {
  const ids = cleanOptions(lesson.skill_options).land_hard;
  if (!ids.length) return [];
  const byId = new Map(pairsFor(lesson.baseline, ids).map((p) => [p.id, p.label]));
  return ids.map((id) => byId.get(id) ?? null);
}

// Spec 004 FR-049: the layers easing lessons worked on, for the focus (skill_options.eased_layers):
// every easing lesson's targets, and for an older entry with no targets, each layer of this comp
// whose exact name appears in its text (not inside a longer word). From the record opening() read.
const isWordChar = (c) => c !== undefined && /[\p{L}\p{N}_]/u.test(c);
function namedIn(text, name) {
  for (let i = text.indexOf(name); i >= 0; i = text.indexOf(name, i + 1)) {
    if (!isWordChar(text[i - 1]) && !isWordChar(text[i + name.length])) return true;
  }
  return false;
}
function easedLayers(record, snapshot) {
  const out = [];
  const add = (n) => { if (typeof n === "string" && n && !out.includes(n)) out.push(n); };
  const here = [...new Set([...(snapshot.layers || []), ...(Array.isArray(snapshot.layer_info) ? snapshot.layer_info : [])].map((l) => l.name))];
  for (const l of record && Array.isArray(record.lessons) ? record.lessons : []) {
    if (!l || l.skill !== "easing.basic") continue;
    if (Array.isArray(l.targets)) {
      for (const t of l.targets) add(t && t.layer);
      continue;
    }
    const text = [l.attempted, l.summary, l.next].filter((x) => typeof x === "string").join("\n");
    for (const n of here) if (namedIn(text, n)) add(n);
  }
  return out;
}

async function speedGraphSnapshot({ focus_layers, mode: asked, skill_options } = {}) {
  const snapshot = await takeSnapshot();
  // FR-048: without a mode, the tool picks lesson or review (spec 004 › The opening read).
  const open = opening({ skill: SKILL, mode: asked, snapshot, finder: FINDERS[SKILL] });
  const mode = open.mode;
  const eased = easedLayers(open.record, snapshot);
  // The focus ranks layers from easing lessons first. A call (or a stored lesson) with no eased_layers
  // ranks by the record's, the list the reply gives as learner.eased_layers, so the opening call and a
  // later call that sends them pick the same target, even when the baseline is analyzed again
  // (spec 004 Phase 10 review). Only the analysis sees the default; the lesson's stored options don't.
  const withEased = (so) => {
    const o = so && typeof so === "object" ? so : {};
    return Array.isArray(o.eased_layers) && o.eased_layers.length ? o : { ...o, eased_layers: eased };
  };
  const opts = {
    skill: SKILL,
    // The session doesn't pass the mode to the analyzer; a review picks one or two pairs (FR-021).
    analyze: (snap, o) => analyze(snap, { ...o, skill_options: withEased(o.skill_options), mode }),
    focus_layers,
    mode,
  };
  if (skill_options !== undefined) opts.skill_options = cleanOptions(skill_options);
  const { lesson, session: l, analysis, stored_choices } = session.start(snapshot, opts);
  const noDemoReason = analysis.demo_target ? null : l.demo ? "demo_used" : analysis.no_demo_reason;
  return json({
    host: parseHost(snapshot),
    lesson,
    mode: l.mode,
    mode_source: open.mode_source,
    learner: { ...open.learner, eased_layers: eased },
    project: snapshot.project,
    comp: { name: snapshot.comp.name, duration: snapshot.comp.duration, frame_rate: snapshot.comp.frame_rate },
    focus: analysis.focus,
    targets: analysis.targets,
    demo_target: analysis.demo_target,
    no_demo_reason: noDemoReason,
    pairs: pairsFor(snapshot, l.targets, l.baseline),
    landing_hard: cleanOptions(l.skill_options).land_hard,
    landing_hard_labels: landingHardLabels(l), // FR-047
    left_out: analysis.left_out,
    ease_first_count: analysis.ease_first_count,
    candidates_count: analysis.candidates_count,
    other_candidates: analysis.other_candidates,
    server_current: await serverCurrent(), // FR-044
    stored_choices, // FR-043, FR-046
  });
}

async function speedGraphDemo({ segment_id }) {
  ownLesson();
  const lesson = session.assertCanDemo(segment_id); // REVIEW_NO_DEMO / DEMO_USED / NOT_DEMO_TARGET, before AE
  // T467: the pair's layer where it is now (a null added above it renumbers it), with its name.
  const pair = parseSegmentId(segment_id);
  const layer = demoLayer(lesson, await takeSnapshot(), pair.layer_index);
  const r = await runSnippet("speed-graph-demo", {
    comp_id: lesson.comp_id, ...pair, ...layer, out_influence: DEMO_OUT, in_influence: DEMO_IN,
  }, { undo: true });
  session.recordDemo(segment_id);
  return json({
    shaped: `${r.layer} › ${r.property}, ${Number(r.from_time).toFixed(3)} s → ${Number(r.to_time).toFixed(3)} s`,
    layer: r.layer,
    property: r.property,
    from_time: r.from_time,
    to_time: r.to_time,
    dimensions: r.dimensions,
    out_influence: r.out_influence,
    in_influence: r.in_influence,
    undo: "Edit > Undo",
  });
}

// A fresh read, graded against the lesson's baseline, which never changes.
async function speedGraphCheck({ seen_shaped = [] } = {}) {
  const lesson = ownLesson();
  const current = await takeSnapshot();
  const result = check(lesson.baseline, current, lesson, { seen_shaped });
  if (result.comp_matches) session.markChecked(result.passed, { demoUndone: result.demo_undone });
  return json(result);
}

const strings = { type: "array", items: { type: "string" } };

export const TOOLS = [
  {
    name: "speed_graph_snapshot",
    title: "Speed graph: read the comp",
    description:
      "Read the active comp and start or continue the speed graph lesson for it. Returns the focus (eased pairs to shape), " +
      "each pair's label and where its move is fastest now, the demo target, what was left out and why, and whether the " +
      "lesson is new, continued or resumed, plus mode (lesson or review), why, and what the learner record says about this " +
      "skill (learner). Pass focus_layers when the learner picks layers, and skill_options with both lists every time you " +
      "send it. Leave mode out unless the learner asked for a review or a lesson: the tool chooses.",
    inputSchema: {
      type: "object",
      properties: {
        focus_layers: { ...strings, description: "Layer names exactly as they appear in the comp. Omit for the default focus." },
        mode: {
          type: "string", enum: ["lesson", "review"],
          description: "\"review\": a new target, no demonstration. Leave it out to let the tool choose (a review when one is due).",
        },
        skill_options: {
          type: "object",
          properties: {
            eased_layers: { ...strings, description: "Layers the learner's easing lessons targeted: learner.eased_layers from the first reply." },
            land_hard: { ...strings, description: "Pair ids the learner said should land hard. They leave the focus." },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    handler: speedGraphSnapshot,
  },
  {
    name: "speed_graph_demo",
    title: "Speed graph: demonstrate on one pair",
    description:
      "The lesson's one demonstration: a short ease out of the start key and a long ease into the landing key on the " +
      "demo_target pair, as one undo step. Once per lesson, only on demo_target, never in a review.",
    inputSchema: {
      type: "object",
      properties: { segment_id: { type: "string", description: "Must equal the lesson's demo_target." } },
      required: ["segment_id"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false },
    handler: speedGraphDemo,
  },
  {
    name: "speed_graph_check",
    title: "Speed graph: check the learner's shapes",
    description:
      "Compare the comp now with the lesson's start. For each focus pair: passed or not, which part is off and the " +
      "matching mistake, where its move is fastest now, and who shaped the demo pair; plus other changes. Pass back " +
      "seen_shaped from the previous check. Doesn't change the lesson's start.",
    inputSchema: {
      type: "object",
      properties: { seen_shaped: { ...strings, description: "seen_shaped from this lesson's previous check, if any." } },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    handler: speedGraphCheck,
  },
];
