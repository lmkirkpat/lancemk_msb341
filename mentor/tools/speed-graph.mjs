// Skill 2's tools (spec 008 contracts/tools.md; spec 004 contracts/skill-module.md › 3): read the
// comp and start or continue the lesson, demonstrate on one pair, check the learner's shapes.
// The analysis and check are pure, in mentor/lib/speed-graph.mjs.

import { runSnippet } from "../bridge-client.mjs";
import { MentorError } from "../errors.mjs";
import { parseSegmentId } from "../lib/analyze.mjs";
import { parseHost } from "../lib/host.mjs";
import { json } from "../lib/reply.mjs";
import * as session from "../lib/session.mjs";
import { takeSnapshot } from "../lib/snapshot.mjs";
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

async function speedGraphSnapshot({ focus_layers, mode = "lesson", skill_options } = {}) {
  const snapshot = await takeSnapshot();
  const opts = {
    skill: SKILL,
    // The session doesn't pass the mode to the analyzer; a review picks one or two pairs (FR-021).
    analyze: (snap, o) => analyze(snap, { ...o, mode }),
    focus_layers,
    mode,
  };
  if (skill_options !== undefined) opts.skill_options = cleanOptions(skill_options);
  const { lesson, session: l, analysis } = session.start(snapshot, opts);
  const noDemoReason = analysis.demo_target ? null : l.demo ? "demo_used" : analysis.no_demo_reason;
  return json({
    host: parseHost(snapshot),
    lesson,
    mode: l.mode,
    project: snapshot.project,
    comp: { name: snapshot.comp.name, duration: snapshot.comp.duration },
    focus: analysis.focus,
    targets: analysis.targets,
    demo_target: analysis.demo_target,
    no_demo_reason: noDemoReason,
    pairs: pairsFor(snapshot, l.targets, l.baseline),
    landing_hard: cleanOptions(l.skill_options).land_hard,
    left_out: analysis.left_out,
    ease_first_count: analysis.ease_first_count,
    candidates_count: analysis.candidates_count,
    other_candidates: analysis.other_candidates,
  });
}

async function speedGraphDemo({ segment_id }) {
  ownLesson();
  const lesson = session.assertCanDemo(segment_id); // REVIEW_NO_DEMO / DEMO_USED / NOT_DEMO_TARGET, before AE
  const r = await runSnippet("speed-graph-demo", {
    comp_id: lesson.comp_id, ...parseSegmentId(segment_id), out_influence: DEMO_OUT, in_influence: DEMO_IN,
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
      "lesson is new, continued or resumed. Pass focus_layers when the learner picks layers, mode \"review\" for a review, " +
      "and skill_options with both lists every time you send it.",
    inputSchema: {
      type: "object",
      properties: {
        focus_layers: { ...strings, description: "Layer names exactly as they appear in the comp. Omit for the default focus." },
        mode: { type: "string", enum: ["lesson", "review"], description: "\"review\": a new target, no demonstration." },
        skill_options: {
          type: "object",
          properties: {
            eased_layers: { ...strings, description: "Layers the learner's easing lessons targeted, from the learner record." },
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
