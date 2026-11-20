// Skill 1's tools, key types (spec 009 contracts/tools.md, spec 004 contracts/skill-module.md › 3):
// read the comp and start or continue the lesson, demonstrate one hold, check the learner's attempt.
// The check is the only place a kept-linear mark can come from, and only after a linear verdict
// (FR-014); no input on any tool writes a mark directly.

import { runSnippet } from "../bridge-client.mjs";
import { parseSegmentId } from "../lib/analyze.mjs";
import { parseHost } from "../lib/host.mjs";
import { demoLayer } from "../lib/demo-layer.mjs";
import { analyze, check, describePairs, finder, grade } from "../lib/key-types.mjs";
import * as session from "../lib/session.mjs";
import { attributedFrom } from "../lib/attributed.mjs";
import { takeSnapshot } from "../lib/snapshot.mjs";
import { serverCurrent } from "../lib/server-current.mjs";
import { json } from "../lib/reply.mjs";
import { opening } from "../lib/opening.mjs";
import { handInSlice, keyedLayer, layerNames, lessonHandIn, motionFromFor, namesWhole, stepText } from "../lib/hand-in-lesson.mjs";

const SKILL = "keyframes.types";
export const SKILLS = [SKILL];

export const FINDERS = {
  [SKILL]: {
    // kept_linear: the marks that apply, when recommend_next passes them (spec 004, coming change).
    focus(snapshot, { exclude = [], kept_linear } = {}) {
      return finder(snapshot, { exclude, kept_linear });
    },
    review: true,
    // Spec 014 K6 (R13, phase 3): a lesson can open from an answer's hand-in.
    hand_in: true,
    skill_command: "key-types-mentor",
  },
};

// Spec 014 K6: the focus a hand-in gives, when the call names none: the layer's properties the
// answer's step names (Opacity, Position...), or the layer alone when it has one keyed property.
// Null when the step names none of several, so the lesson asks which should snap, on that layer only.
function handInFocus(snapshot, h) {
  const layers = (snapshot.layers || []).filter((l) => l.name === h.layer);
  if (!layers.length) return null;
  const props = [...new Set(layers.flatMap((l) => l.properties.filter((p) => p.keys.length >= 2).map((p) => p.display_name)))];
  const named = props.filter((p) => namesWhole(stepText(h), p));
  if (named.length) return named.map((property) => ({ layer: h.layer, property }));
  return props.length === 1 ? [{ layer: h.layer }] : null;
}

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

async function keyTypesSnapshot({ mode: asked, fresh = false, skill_options } = {}) {
  const snapshot = await takeSnapshot();
  // FR-048: without a mode, the tool picks lesson or review (spec 004 › The opening read).
  const open = opening({ skill: SKILL, mode: asked, snapshot, fresh, finder: FINDERS[SKILL] });
  const mode = open.mode;
  // K6: a hand-in opens a new lesson on its layer (contracts/hand-in.md › Per skill).
  const taken = open.mode_source === "hand_in" && open.hand_in && open.hand_in.layer ? open.hand_in : null;
  const keyed = taken ? keyedLayer(snapshot, taken.layer) : undefined;
  let options = skill_options;
  if (taken && keyed && options === undefined) {
    const f = handInFocus(snapshot, taken);
    if (f) options = { focus: f };
  }
  const focus = options && Array.isArray(options.focus) ? options.focus : [];
  const focus_layers = focus.length ? [...new Set(focus.map((r) => r.layer))] : undefined;
  const opts = { skill: SKILL, analyze, mode, fresh };
  if (focus_layers) opts.focus_layers = focus_layers;
  if (options !== undefined) opts.skill_options = options;
  if (taken) opts.hand_in = lessonHandIn(taken);
  const { lesson, session: les, analysis, stored_choices } = session.start(snapshot, opts); // LESSON_UNDERWAY passes through
  const handInFields = les.hand_in ? { hand_in: handInSlice(les.hand_in, open.learner, taken ? { keyed } : {}) }
    : open.hand_in ? { hand_in: handInSlice(open.hand_in, open.learner) } : {};
  const mf = motionFromFor(les.baseline, layerNames(les.focus, analysis.candidates));
  return json({
    host: parseHost(snapshot),
    lesson,
    mode: les.mode,
    mode_source: open.mode_source,
    learner: open.learner,
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
    server_current: await serverCurrent(), // FR-044
    stored_choices, // FR-043, FR-046
    ...(mf ? { motion_from: mf } : {}), // spec 015 FR-015, spec 014 FR-033: only on a read with R2
    ...handInFields,
  });
}

async function keyTypesDemo({ segment_id }) {
  const lesson = session.assertCanDemo(segment_id); // REVIEW_NO_DEMO / DEMO_USED / NOT_DEMO_TARGET / NO_SESSION, before AE
  // T467: the pair's layer where it is now (a null added above it renumbers it), with its name.
  const pair = parseSegmentId(segment_id);
  const layer = demoLayer(lesson, await takeSnapshot(), pair.layer_index);
  const r = await runSnippet("key-types-demo", { comp_id: lesson.comp_id, ...pair, ...layer }, { undo: true });
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

  session.markChecked(result.passed, { demoUndone: result.demo_undone, attributed: attributedFrom(result) }); // K5
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
      session.markChecked(result.passed, { demoUndone: result.demo_undone, attributed: attributedFrom(result) }); // K5
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
      "any demonstration or check. Also returns mode (lesson or review), why, and what the learner record says about this " +
      "skill (learner). Leave mode out unless the learner asked for a review or a lesson: the tool chooses.",
    inputSchema: {
      type: "object",
      properties: {
        mode: { type: "string", enum: ["lesson", "review"], description: "Leave it out to let the tool choose (a review when one is due)." },
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
      "not_held, wrong_side, removed_or_changed, expression or unmatched (two layers share its name); pairs the learner said should move that are now held; holds " +
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
