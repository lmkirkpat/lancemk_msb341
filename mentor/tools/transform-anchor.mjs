// Skill 5's tools, set the pivot (spec 011 contracts/tools.md; spec 004 contracts/skill-module.md
// › 3): read the comp and set up the lesson, the one demonstration, and the check. The analysis
// and check are mentor/lib/anchor.mjs and anchor-check.mjs; this file only wires them to the
// session and After Effects.
//
// Named transform-anchor.mjs rather than anchor.mjs (spec 011's add-only table): index.mjs loads
// tool files in name order, and mentor/test/skill-module.test.mjs expects easing's skill ID first,
// which "anchor" would sort ahead of. A request to the shared-code owner covers renaming it.

import { runSnippet } from "../bridge-client.mjs";
import { MentorError, registerErrors } from "../errors.mjs";
import { sampleAt } from "../lib/comp-space.mjs";
import { parseHost } from "../lib/host.mjs";
import { byIndex, byName, layerInfo } from "../lib/layer-info.mjs";
import { json } from "../lib/reply.mjs";
import * as session from "../lib/session.mjs";
import { takeSnapshot } from "../lib/snapshot.mjs";
import {
  analyze, demoRefusal, demoValues, finder, missingTimes, neededTimes, PLACES, rectOf, refused,
  REFUSED_MESSAGE, reviewProposal, SKILL,
} from "../lib/anchor.mjs";
import { check, checkSampleTimes } from "../lib/anchor-check.mjs";

registerErrors({ ANCHOR_REFUSED: REFUSED_MESSAGE });

export const SKILLS = [SKILL];

export const FINDERS = {
  [SKILL]: {
    // Default candidates not among `exclude` (a review's past targets), FR-003; 0 without layer_info.
    focus(snapshot, { exclude = [] } = {}) {
      return finder(snapshot, { exclude });
    },
    review: true,
  },
};

// The reads and the snippet, through one object so tests can watch what each tool asks After
// Effects for (sample_times, and whether the demo snippet ran).
export const io = { takeSnapshot, runSnippet };

const r3 = (t) => Math.round(t * 1000) / 1000;
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const indexOf = (target) => Number(String(target).split("/")[1]);

function ownLesson() {
  const lesson = session.currentLesson(); // NO_SESSION when there's none
  if (lesson.skill !== SKILL) throw new MentorError("NO_SESSION", "There's no pivot lesson in progress. Take a fresh look at the comp first.");
  return lesson;
}

const baseOpts = (s) => ({ exclude: s.exclude || [], skill_options: s.skill_options || {} });

// FR-013: read 1, and a second, sampled read when a time the check will compare is missing.
async function lessonRead() {
  const read1 = await io.takeSnapshot();
  if (!layerInfo(read1).known) return { read: read1, reads: 1 };
  const needed = neededTimes(read1);
  if (!missingTimes(read1, needed).length) return { read: read1, reads: 1 };
  return { read: await io.takeSnapshot({ sample_times: needed }), reads: 2 };
}

async function anchorSnapshot({ mode = "lesson", focus_layers, skill_options, fresh } = {}) {
  const { read, reads } = await lessonRead();
  if (!layerInfo(read).known) {
    // Before wave B's reads there's nothing this skill can check, so no lesson starts.
    return json({ lesson: null, no_layer_info: true, host: parseHost(read), comp: { name: read.comp.name } });
  }
  const opts = { skill: SKILL, analyze, mode };
  if (focus_layers) opts.focus_layers = focus_layers;
  if (skill_options !== undefined) opts.skill_options = skill_options;
  if (fresh) opts.fresh = true;
  const { lesson, session: s } = session.start(read, opts);

  // Everything below is read on the lesson's baseline, which the targets come from.
  const base = analyze(s.baseline, { focus_layers, ...baseOpts(s) });
  const review = s.mode === "review";
  const proposal = review ? reviewProposal(s.baseline, { exclude: s.exclude || [] }) : base.proposal;
  const noNew = review && !proposal && !s.targets.length;
  let noDemo = s.demo ? null : base.no_demo_reason;
  if (review) noDemo = noNew ? "no_new_target" : "review";
  else if (!s.demo && !s.demo_target && s.targets.length === 1 && base.demo_target) noDemo = "single_target";

  const fps = s.baseline.comp.frame_rate;
  return json({
    lesson,
    mode: s.mode,
    host: parseHost(read),
    project: s.baseline.project,
    comp: { name: s.baseline.comp.name, time: s.baseline.comp.time, frame_rate: fps, width: s.baseline.comp.width ?? null, height: s.baseline.comp.height ?? null },
    candidates: base.candidates.map(({ layer, bucket, reason, rank }) => ({ layer, bucket, reason, rank })),
    proposal,
    focus: s.focus,
    places: Object.fromEntries(Object.entries(base.places).map(([k, v]) => [k, v.place])),
    // Where each focus layer's pivot is now (and the proposal's), at its check time, in the
    // baseline: one of the nine, "between" or "outside".
    place_now: Object.fromEntries(base.candidates
      .filter((c) => (s.focus || []).includes(c.layer) || (proposal && c.layer === proposal.layer))
      .map((c) => [c.layer, c.place_now])),
    check_times: base.check_times,
    already_there: base.already_there,
    focus_problems: base.focus_problems,
    targets: s.targets,
    demo_target: s.demo_target,
    demo_used: !!s.demo,
    no_demo_reason: noDemo,
    notes: base.notes,
    ...(base.rest_time_not_a_key ? { rest_time_not_a_key: base.rest_time_not_a_key } : {}),
    reads,
  });
}

async function anchorDemo({ target }) {
  const lesson = session.assertCanDemo(target); // REVIEW_NO_DEMO / DEMO_USED / NOT_DEMO_TARGET / NO_SESSION, before AE
  const base = analyze(lesson.baseline, baseOpts(lesson));
  const bEntry = byIndex(lesson.baseline, indexOf(target));
  if (!bEntry || !base.places[bEntry.name]) throw refused("not_found");
  const place = base.places[bEntry.name].place;
  const ct = base.check_times[bEntry.name];
  const rest = ct && ct.basis !== "current" && isNum(ct.time) ? ct.time : null;

  // One fresh read (FR-015), sampled at the rest key for a layer with Rotation or Scale keys.
  const read = await io.takeSnapshot(rest !== null ? { sample_times: [rest] } : {});
  if (read.comp.id !== lesson.comp_id) {
    throw new MentorError("NO_ACTIVE_COMP", `The active comp isn't ${lesson.baseline.comp.name}. Switch back to it, then ask for the demonstration again.`);
  }
  const matches = byName(read, bEntry.name);
  const entry = matches.length === 1 ? matches[0] : matches.find((m) => m.index === bEntry.index) || null;
  const reason = demoRefusal(read, entry, { rest_time: rest });
  if (reason) throw refused(reason);
  const sample = sampleAt(entry, read.comp.time);
  const values = sample ? demoValues(sample, rectOf(sample, entry.kind), place) : null;
  if (!values) throw refused("cant_read");

  const args = { comp_id: lesson.comp_id, layer_index: entry.index, layer_name: entry.name, anchor: values.anchor, position: values.position, rest_time: rest };
  let r;
  try {
    r = await io.runSnippet("anchor-demo", args, { undo: true });
  } catch (e) {
    // The snippet refuses with a bare reason; give the learner-facing sentence instead.
    if (e instanceof MentorError && e.code === "ANCHOR_REFUSED" && !e.reason) throw refused(String(e.message).trim());
    throw e;
  }
  session.recordDemo(target);
  return json({
    layer: r.layer,
    place,
    anchor_before: r.anchor_before,
    anchor_after: r.anchor_after,
    position_before: r.position_before,
    position_after: r.position_after,
    separated: r.separated,
    time: r3(read.comp.time),
    undo: "Edit > Undo",
  });
}

// Never changes the baseline, so the learner can fix things and check again.
async function anchorCheck() {
  const lesson = ownLesson();
  const current = await io.takeSnapshot({ sample_times: checkSampleTimes(lesson.baseline, lesson) });
  const result = check(lesson.baseline, current, lesson);
  if (result.comp_matches) session.markChecked(result.passed, { demoUndone: result.demo_undone });
  return json(result);
}

const SKILL_OPTIONS = {
  type: "object",
  description: "The learner's choices, sent whole every time one changes: one or two focus layers, each with its place.",
  properties: {
    focus: {
      type: "array",
      minItems: 1,
      maxItems: 2,
      description: "First the learner's layer; second, if any, the one they care less about.",
      items: {
        type: "object",
        properties: {
          layer: { type: "string", description: "The layer's name, exactly as in the comp." },
          place: { type: "string", enum: PLACES, description: "Where it should turn from." },
          rest_time: { type: "number", minimum: 0, description: "The learner's own rest pose, in seconds, if they named another key." },
        },
        required: ["layer", "place"],
        additionalProperties: false,
      },
    },
  },
  additionalProperties: false,
};

export const TOOLS = [
  {
    name: "anchor_snapshot",
    title: "Pivot: read the comp and set up the lesson",
    description:
      "Read the active comp and start or continue the pivot lesson. Returns every layer's candidacy with a reason, one " +
      "proposal with a suggested place, the focus layers' places, check times (the rest key on a layer with Rotation or " +
      "Scale keys), what's already in place, the targets, the demo_target and notes. Call again with skill_options when " +
      "the learner names a layer and a place. fresh: true restarts the lesson before any demo or check.",
    inputSchema: {
      type: "object",
      properties: {
        mode: { type: "string", enum: ["lesson", "review"], description: "\"review\" for a review: no demo, a new layer only." },
        focus_layers: { type: "array", items: { type: "string" }, description: "Limit the proposal to these layers, by name." },
        skill_options: SKILL_OPTIONS,
        fresh: { type: "boolean", description: "Start again from this read (for example after adding a solid). Refused after a demo or check." },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    handler: anchorSnapshot,
  },
  {
    name: "anchor_demo",
    title: "Pivot: demonstrate on one layer",
    description:
      "The lesson's one demonstration: move the demo_target layer's pivot to its place without the layer moving (Anchor " +
      "Point and Position together), as one undo step, never keyed. Works once per lesson, only on demo_target, never in a " +
      "review; the learner sets the rest.",
    inputSchema: {
      type: "object",
      properties: { target: { type: "string", description: "Must equal the lesson's demo_target." } },
      required: ["target"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false },
    handler: anchorDemo,
  },
  {
    name: "anchor_check",
    title: "Pivot: check the learner's attempt",
    description:
      "Compare the comp now with the lesson's start, per focus layer at its check time: where the pivot is now, whether " +
      "the layer moved and which way, whether it was set at rest, whether it slid at a Position key, whether anything else " +
      "moved, what can't be checked, hint codes, other changes, and whether it passed. Doesn't change the baseline.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    handler: anchorCheck,
  },
];

