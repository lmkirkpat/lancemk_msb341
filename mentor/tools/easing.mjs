// The easing skill's tools (specs/002-easing-slice/contracts/mentor-tools.md): read the comp,
// demonstrate on one pair, check the learner's attempt.

import { runSnippet } from "../bridge-client.mjs";
import { needsEase, parseSegmentId, segments } from "../lib/analyze.mjs";
import { diff } from "../lib/diff.mjs";
import { demoLayer } from "../lib/demo-layer.mjs";
import { isKeptLinear } from "../lib/marks.mjs";
import * as session from "../lib/session.mjs";
import { attributedFrom } from "../lib/attributed.mjs";
import { takeSnapshot } from "../lib/snapshot.mjs";
import { json } from "../lib/reply.mjs";
import { peekRecord } from "../lib/learner-store.mjs";
import { handInSlice, keyedLayer, layerNames, lessonHandIn, motionFromFor } from "../lib/hand-in-lesson.mjs";
import { layerInfo } from "../lib/layer-info.mjs";

export const SKILLS = ["easing.basic"];

// Does this comp have pairs to ease? For recommend_next (contracts/skill-module.md › 2). Counts the
// same pairs analyze() targets, leaving out the {layer, property} pairs in `exclude` and the
// properties a kept-linear mark in `kept_linear` covers (as analyze() does). No review mode for
// easing this sprint (spec 004 plan P5), so `review: false`.
export const FINDERS = {
  "easing.basic": {
    focus(snapshot, { exclude = [], kept_linear = [] } = {}) {
      const excluded = (s) => exclude.some((e) => e.layer === s.layer.name && e.property === s.prop.display_name);
      const kept = (s) => kept_linear.length > 0 && isKeptLinear(kept_linear, s.layer.name, s.prop.path, snapshot);
      const pairs = segments(snapshot).segments.filter((s) => needsEase(s.state) && !excluded(s) && !kept(s));
      return { count: pairs.length, layers: [...new Set(pairs.map((s) => s.layer.name))] };
    },
    review: false,
    // Spec 014 K6 (R13, phase 3): a lesson can open from an answer's hand-in; skill_command is its
    // skill folder, for the ask's Skill call.
    hand_in: true,
    skill_command: "ease-mentor",
  },
};

const SKILL = "easing.basic";

// Spec 014 K6: easing has no opening read (no review), so its snapshot takes the hand-in itself, the
// same way opening() does for the others: once, for this comp, within the session window. A hand-in
// sets the focus to its layer when that layer has keys and the call names none.
function takeHandIn(snapshot) {
  const h = session.takeHandIn(SKILL, snapshot.comp.id);
  if (!h) return null;
  const info = layerInfo(snapshot);
  const list = info.known ? info.layers : snapshot.layers || [];
  const lost = h.layer !== null && h.layer !== undefined && !list.some((l) => l && l.name === h.layer);
  return { h, lost };
}

async function snapshotProject({ focus_layers } = {}) {
  const snapshot = await takeSnapshot();
  const taken = takeHandIn(snapshot);
  const opts = { focus_layers };
  let extra = {};
  if (taken) {
    const kept = lessonHandIn(taken.h);
    const keyed = !taken.lost && kept.layer ? keyedLayer(snapshot, kept.layer) : undefined;
    if (keyed && !(focus_layers && focus_layers.length)) opts.focus_layers = [kept.layer];
    opts.hand_in = kept;
    const record = peekRecord();
    const learner = { status: record && record.skills && record.skills[SKILL] ? record.skills[SKILL].status : "not_started" };
    extra = { mode_source: taken.lost ? "hand_in_lost" : "hand_in", hand_in: handInSlice(taken.h, learner, keyed === undefined ? {} : { keyed }) };
  }
  const { lesson, analysis, session: s } = session.start(snapshot, opts);
  // A continued lesson opened from a hand-in still carries its slice (for the hand-back line).
  if (!taken && s.hand_in) {
    const record = peekRecord();
    extra = { hand_in: handInSlice(s.hand_in, { status: record && record.skills && record.skills[SKILL] ? record.skills[SKILL].status : "not_started" }) };
  }
  // Spec 015 FR-015 (K3), spec 014 FR-033: where each focus and finding layer's motion comes from,
  // only on a read with R2.
  const mf = motionFromFor(s.baseline, layerNames(analysis.focus, analysis.findings));
  return json({
    lesson,
    project: snapshot.project,
    comp: { name: snapshot.comp.name, duration: snapshot.comp.duration },
    findings: analysis.findings,
    skipped: analysis.skipped.map(({ layer, property, reason }) => ({ layer, property, reason })),
    hidden_layers: analysis.hidden_layers,
    precomp_layers: analysis.precomp_layers,
    focus: analysis.focus,
    targets: analysis.targets,
    demo_target: analysis.demo_target,
    no_demo_reason: analysis.no_demo_reason,
    counts: analysis.counts,
    ...(mf ? { motion_from: mf } : {}),
    ...extra,
  });
}

async function setEase({ segment_id }) {
  const lesson = session.assertCanDemo(segment_id); // DEMO_USED / NOT_DEMO_TARGET / NO_SESSION, before AE
  // T467: the pair's layer where it is now (a null added above it renumbers it), with its name.
  const pair = parseSegmentId(segment_id);
  const layer = demoLayer(lesson, await takeSnapshot(), pair.layer_index);
  const r = await runSnippet("set-ease", { comp_id: lesson.comp_id, ...pair, ...layer }, { undo: true });
  session.recordDemo(segment_id);
  return json({
    eased: `${r.layer} › ${r.display_name}, ${r.from_time.toFixed(3)} s → ${r.to_time.toFixed(3)} s`,
    undo: "Edit > Undo",
  });
}

// Never changes the baseline, so the learner can fix things and check again.
async function diffSinceLast() {
  const lesson = session.currentLesson();
  const current = await takeSnapshot();
  const result = diff(lesson.baseline, current, lesson);
  if (result.comp_matches) session.markChecked(result.passed, { demoUndone: result.demo_undone, attributed: attributedFrom(result) }); // K5
  return json(result);
}

export const TOOLS = [
  {
    name: "snapshot_project",
    title: "Snapshot the active comp",
    description:
      "Read the active comp and start or continue the lesson for it. Returns findings (linear keyframe pairs by layer and " +
      "property), skipped properties, hidden and precomp layers, the lesson's targets and demo_target, and whether the " +
      "lesson is new, continued or resumed. Pass focus_layers to limit the lesson to a manageable chunk.",
    inputSchema: {
      type: "object",
      properties: {
        focus_layers: {
          type: "array",
          items: { type: "string" },
          description: "Layer names to focus the lesson on, exactly as they appear in the findings. Omit for all layers.",
        },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    handler: snapshotProject,
  },
  {
    name: "set_ease",
    title: "Demonstrate easing on one pair",
    description:
      "The lesson's one demonstration: apply Easy Ease to the demo_target keyframe pair, as one undo step. Works once per " +
      "lesson and only on demo_target; the learner eases the rest.",
    inputSchema: {
      type: "object",
      properties: { segment_id: { type: "string", description: "Must equal the lesson's demo_target." } },
      required: ["segment_id"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false },
    handler: setEase,
  },
  {
    name: "diff_since_last",
    title: "Check the learner's attempt",
    description:
      "Compare the comp now with the lesson's baseline. Reports each target as eased_by_learner, eased_by_demo, " +
      "still_linear, removed or unmatched (two layers share its name), plus other changes, and whether the lesson passed. Doesn't change the baseline.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    handler: diffSinceLast,
  },
];
