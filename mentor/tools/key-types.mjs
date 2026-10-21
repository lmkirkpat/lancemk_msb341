// Skill 1's tools, key types (spec 009 contracts/tools.md, spec 004 contracts/skill-module.md › 3):
// read the comp and start or continue the lesson, demonstrate one hold, check the learner's attempt.
// The check is the only place a kept-linear mark can come from, and only after a linear verdict
// (FR-014); no input on any tool writes a mark directly.

import { runSnippet } from "../bridge-client.mjs";
import { parseSegmentId } from "../lib/analyze.mjs";
import { parseHost } from "../lib/host.mjs";
import { analyze, check, describePairs, finder, grade } from "../lib/key-types.mjs";
import * as session from "../lib/session.mjs";
import { takeSnapshot } from "../lib/snapshot.mjs";
import { json } from "../lib/reply.mjs";

const SKILL = "keyframes.types";
export const SKILLS = [SKILL];

export const FINDERS = {
  [SKILL]: {
    // kept_linear: the marks that apply, when recommend_next passes them (spec 004, coming change).
    focus(snapshot, { exclude = [], kept_linear } = {}) {
      return finder(snapshot, { exclude, kept_linear });
    },
    review: true,
  },
};

const REF = {
  type: "object",
  properties: {
    layer: { type: "string", description: "The layer's name, exactly as it appears in the comp." },
    property: { type: "string", description: "The property's name as the comp shows it, for example Opacity or Position." },
  },
  required: ["layer"],
  additionalProperties: false,
};
const REFS = { type: "array", items: REF };

const r3 = (t) => Math.round(t * 1000) / 1000;

// Research R1: before the learner names a focus, a review isn't "nothing to review" while there are
// candidates; and after the demo, say so rather than leave the reason blank.
function noDemoReason(lesson, analysis) {
  if (lesson.mode === "review" && lesson.targets.length === 0) return analysis.candidates.length ? "awaiting_focus" : "no_new_target";
  if (lesson.demo) return "demo_used";
  return analysis.no_demo_reason;
}

async function keyTypesSnapshot({ mode = "lesson", fresh = false, skill_options } = {}) {
  const snapshot = await takeSnapshot();
  const focus = skill_options && Array.isArray(skill_options.focus) ? skill_options.focus : [];
  const focus_layers = focus.length ? [...new Set(focus.map((r) => r.layer))] : undefined;
  const opts = { skill: SKILL, analyze, mode, fresh };
  if (focus_layers) opts.focus_layers = focus_layers;
  if (skill_options !== undefined) opts.skill_options = skill_options;
  const { lesson, session: les, analysis } = session.start(snapshot, opts); // LESSON_UNDERWAY passes through
  return json({
    host: parseHost(snapshot),
    lesson,
    mode: les.mode,
    project: snapshot.project,
    comp: { name: snapshot.comp.name, duration: snapshot.comp.duration, frame_rate: snapshot.comp.frame_rate },
    focus: les.focus,
    targets: les.targets,
    target_pairs: describePairs(les.baseline, les.targets),
    demo_target: les.demo_target,
    no_demo_reason: noDemoReason(les, analysis),
    candidates: analysis.candidates,
    more_candidates: analysis.more_candidates,
    refused: analysis.refused,
    held_examples: analysis.held_examples,
    left_out: analysis.left_out,
    should_move: (les.skill_options && les.skill_options.should_move) || [],
  });
}

async function keyTypesDemo({ segment_id }) {
  const lesson = session.assertCanDemo(segment_id); // REVIEW_NO_DEMO / DEMO_USED / NOT_DEMO_TARGET / NO_SESSION, before AE
  const r = await runSnippet("key-types-demo", { comp_id: lesson.comp_id, ...parseSegmentId(segment_id) }, { undo: true });
  session.recordDemo(segment_id);
  const fps = lesson.baseline.comp.frame_rate || 30;
  return json({
    layer: r.layer,
    property: r.property,
    from_time: r.from_time,
    to_time: r.to_time,
    in_type: r.in_type,
    out_type: r.out_type,
    // One frame either side of the jump, for preview_frame (FR-010).
    frames: { before: r3(Math.max(0, r.to_time - 1 / fps)), after: r3(r.to_time + 1 / fps) },
    undo: "Edit > Undo",
  });
}

// Never changes the baseline. The check is recorded before any kept-linear note, so the note always
// follows a check of the lesson's own comp.
async function keyTypesCheck({ should_move = [], constant_speed = null } = {}) {
  const lesson = session.currentLesson();
  const current = await takeSnapshot();
  const mode = lesson.mode || "lesson";
  let result = check(lesson.baseline, current, lesson, { should_move, constant_speed });
  if (!result.comp_matches) return json({ ...result, constant_speed: null });

  session.markChecked(result.passed, { demoUndone: result.demo_undone });
  const cs = result.constant_speed;
  if (cs) cs.marked = false;
  if (cs && cs.verdict === "linear") {
    try {
      session.keepLinear(current, cs.properties);
      cs.marked = true;
    } catch (e) {
      if (e.code !== "NOT_KEPT_LINEAR") throw e;
      // Research R6: reported as not linear, and nothing is stored.
      result = grade({ ...result, constant_speed: { ...cs, verdict: "not_linear", marked: false } }, { mode });
      session.markChecked(result.passed, { demoUndone: result.demo_undone });
    }
  }
  return json(result);
}

export const TOOLS = [
  {
    name: "key_types_snapshot",
    title: "Key types: read the comp",
    description:
      "Read the active comp and start or continue the key types lesson. Returns the candidates (on/off Opacity changes " +
      "that aren't held), what's left out and why, held pairs to show, and, once the learner has named a focus, its " +
      "targets and demo_target. Send skill_options whole whenever the learner names a focus or says something should " +
      "move. fresh: true restarts the lesson from this read (after the learner builds a practice blink), only before " +
      "any demonstration or check.",
    inputSchema: {
      type: "object",
      properties: {
        mode: { type: "string", enum: ["lesson", "review"] },
        fresh: { type: "boolean" },
        skill_options: {
          type: "object",
          properties: {
            focus: { ...REFS, description: "What the learner said should snap, by layer and property." },
            should_move: { ...REFS, description: "What the learner said is meant to fade or move." },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    handler: keyTypesSnapshot,
  },
  {
    name: "key_types_demo",
    title: "Key types: demonstrate one hold",
    description:
      "The lesson's one demonstration: hold the demo_target pair's first key, as one undo step. Works once per lesson, " +
      "only on demo_target, never in a review; the learner holds the rest.",
    inputSchema: {
      type: "object",
      properties: { segment_id: { type: "string", description: "Must equal the lesson's demo_target." } },
      required: ["segment_id"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false },
    handler: keyTypesDemo,
  },
  {
    name: "key_types_check",
    title: "Key types: check the attempt",
    description:
      "Compare the comp now with the lesson's start. Reports each focus pair as held_by_learner, held_by_demo, " +
      "not_held, wrong_side or removed_or_changed; pairs the learner said should move that are now held; holds " +
      "outside the focus; other changes; and whether the lesson passed. Pass constant_speed with the move the learner " +
      "says runs at constant speed to check it's linear. Doesn't change the starting point.",
    inputSchema: {
      type: "object",
      properties: {
        should_move: { ...REFS, description: "Anything else the learner said should move, for this check." },
        constant_speed: { ...REF, description: "The move the learner said should run at constant speed." },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    handler: keyTypesCheck,
  },
];
