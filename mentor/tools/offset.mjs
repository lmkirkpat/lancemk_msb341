// Skill 3's tools, break the lockstep with offset (spec 010 contracts/tools.md; spec 004
// contracts/skill-module.md › 3): read the comp and set up the lesson, the one demonstration, and
// the check. The analysis and check are mentor/lib/offset.mjs; this file only wires them to the
// session and After Effects.

import { runSnippet } from "../bridge-client.mjs";
import { MentorError } from "../errors.mjs";
import { parseHost } from "../lib/host.mjs";
import { analyze, check, demoRefusal, finder, refused, SKILL } from "../lib/offset.mjs";
import { matchLayer } from "../lib/offset-keys.mjs";
import { json } from "../lib/reply.mjs";
import * as session from "../lib/session.mjs";
import { takeSnapshot } from "../lib/snapshot.mjs";

export const SKILLS = [SKILL];

// Does this comp have a group to stagger? Counts the members of the group offset_snapshot would
// propose with the same `exclude` (a review's past targets). `kept_linear` doesn't matter here:
// constant speed isn't timing, and analyze() ignores it too.
export const FINDERS = {
  [SKILL]: {
    focus(snapshot, { exclude = [] } = {}) {
      return finder(snapshot, { exclude });
    },
    review: true,
  },
};

const r3 = (t) => Math.round(t * 1000) / 1000;

function ownLesson() {
  const lesson = session.currentLesson(); // NO_SESSION when there's none
  if (lesson.skill !== SKILL) throw new MentorError("NO_SESSION", "There's no offset lesson in progress. Take a fresh look at the comp first.");
  return lesson;
}

async function offsetSnapshot({ mode = "lesson", focus_layers, skill_options } = {}) {
  const snapshot = await takeSnapshot();
  const opts = { skill: SKILL, analyze, mode };
  if (focus_layers) opts.focus_layers = focus_layers;
  if (skill_options !== undefined) opts.skill_options = skill_options;
  const { lesson, session: s, analysis } = session.start(snapshot, opts);

  // The group and the learner's choices are read on the lesson's baseline, which the targets come
  // from, so a continued lesson still describes the group as it was before the learner moved it.
  const base = lesson === "new" ? analysis : analyze(s.baseline, { focus_layers, exclude: s.exclude || [], skill_options: s.skill_options || {} });
  const fps = s.baseline.comp.frame_rate;
  return json({
    lesson,
    mode: s.mode,
    host: parseHost(snapshot),
    project: snapshot.project,
    comp: { name: snapshot.comp.name, duration: snapshot.comp.duration, frame_rate: snapshot.comp.frame_rate },
    group: base.group,
    proposed_kind: base.proposed_kind,
    other_kind: base.other_kind,
    other_group: base.other_group,
    left_out: base.left_out,
    refused_members: base.refused_members,
    order: base.order,
    order_unmatched: base.order_unmatched,
    focus: s.focus,
    targets: s.targets,
    demo_target: s.demo_target,
    demo_used: !!s.demo,
    no_demo_reason: s.mode === "review" ? (s.targets.length ? "review" : "no_new_target") : s.demo ? null : base.no_demo_reason,
    frame_together: base.frame_together,
    ...(base.gap_frames != null ? { floor_check: { gap_frames: base.gap_frames, gap_seconds: r3(base.gap_frames / fps), gap_under_floor: base.gap_under_floor } } : {}),
  });
}

// The demo shifts keys only (FR-010): every keyed property on the layer for the layers kind, the
// one property's keys (both dimensions if separated) for the properties kind.
function demoPlan(lesson, current, target) {
  const base = lesson.baseline;
  const lm = /^layer\/(\d+)$/.exec(target);
  const index = Number(lm ? lm[1] : target.slice(0, target.indexOf("/")));
  const bl = base.layers.find((l) => l.index === index);
  const cl = bl ? matchLayer(base, current, bl) : null;
  if (!cl) throw new MentorError("UNKNOWN_LAYER", "That layer isn't in the comp now, so I can't shift it. Check the layer is still there and has its keys.");
  let paths;
  if (lm) {
    paths = cl.properties.filter((p) => !p.expression_enabled).map((p) => p.path);
  } else {
    // "<layer index>/<unit>/<move>": a separated Position is the unit "Position", any other
    // property is its display path.
    const unit = target.slice(target.indexOf("/") + 1, target.lastIndexOf("/"));
    const inUnit = (p) => (unit === "Position" ? /^ADBE Transform Group\/ADBE Position_[012]$/.test(p.path) : p.display_path === unit);
    paths = cl.properties.filter(inUnit).map((p) => p.path);
  }
  const keyed = cl.properties.filter((p) => paths.includes(p.path));
  const from = Math.min(...keyed.flatMap((p) => p.keys.map((k) => k.time)));
  return { layer: cl, property_paths: paths, from };
}

async function offsetDemo({ target }) {
  const lesson = session.assertCanDemo(target); // REVIEW_NO_DEMO / DEMO_USED / NOT_DEMO_TARGET / NO_SESSION, before AE
  const gap = lesson.skill_options && lesson.skill_options.gap_frames;
  const current = await takeSnapshot();
  if (current.comp.id !== lesson.comp_id) {
    throw new MentorError("NO_ACTIVE_COMP", `The active comp isn't ${lesson.baseline.comp.name}. Switch back to it, then ask for the demonstration again.`);
  }
  const plan = demoPlan(lesson, current, target);
  const args = { comp_id: lesson.comp_id, layer_index: plan.layer.index, property_paths: plan.property_paths, shift_frames: gap };
  const reason = demoRefusal(current, args); // what the read already shows: no snippet run
  if (reason) throw refused(reason);
  let r;
  try {
    r = await runSnippet("offset-demo", args, { undo: true });
  } catch (e) {
    // The snippet refuses with a bare reason; give the learner-facing sentence instead.
    if (e instanceof MentorError && e.code === "OFFSET_REFUSED" && !e.reason) throw refused(String(e.message).trim());
    throw e;
  }
  session.recordDemo(target);
  const fps = current.comp.frame_rate;
  return json({
    layer: r.layer,
    properties: r.properties,
    shift_frames: r.shift_frames,
    from: r3(plan.from),
    to: r3(plan.from + gap / fps),
    undo: "Edit > Undo",
  });
}

// Never changes the baseline, so the learner can fix things and check again.
async function offsetCheck({ split } = {}) {
  const lesson = ownLesson();
  const current = await takeSnapshot();
  const result = check(lesson.baseline, current, lesson, { split: split || [] });
  if (result.comp_matches) session.markChecked(result.passed, { demoUndone: result.demo_undone });
  return json(result);
}

const SKILL_OPTIONS = {
  type: "object",
  description:
    "The learner's choices, sent whole every time one changes: kind, members, order, gap_frames, split.",
  properties: {
    kind: { type: "string", enum: ["layers", "properties"], description: "The kind of group the learner chose." },
    members: { type: "array", items: { type: "string" }, description: "Layer names the learner picked themselves." },
    order: { type: "array", items: { type: "string" }, description: "Member names (layers, or properties for one layer) in the learner's order, first first." },
    gap_frames: { type: "integer", minimum: 1, description: "The learner's gap, converted to whole frames." },
    split: { type: "array", items: { type: "string" }, description: "Layers whose properties the learner wants split on purpose." },
  },
  additionalProperties: false,
};

export const TOOLS = [
  {
    name: "offset_snapshot",
    title: "Offset: read the comp and set up the lesson",
    description:
      "Read the active comp and start or continue the offset lesson. Returns the group that moves in lockstep (layers that " +
      "start together, or one layer's properties that start and land together), the other kind if there is one, what's " +
      "left out, the lesson's targets and demo_target, and frame_together. Call again with skill_options when the learner " +
      "picks the kind, the order or the gap.",
    inputSchema: {
      type: "object",
      properties: {
        mode: { type: "string", enum: ["lesson", "review"], description: "\"review\" for a review: no demo, new group only." },
        focus_layers: { type: "array", items: { type: "string" }, description: "Limit the search to these layers, by name." },
        skill_options: SKILL_OPTIONS,
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    handler: offsetSnapshot,
  },
  {
    name: "offset_demo",
    title: "Offset: demonstrate on one member",
    description:
      "The lesson's one demonstration: shift every key of the demo_target member later by the learner's gap, as one undo " +
      "step. Works once per lesson, only on demo_target, never in a review; the learner staggers the rest.",
    inputSchema: {
      type: "object",
      properties: { target: { type: "string", description: "Must equal the lesson's demo_target." } },
      required: ["target"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false },
    handler: offsetDemo,
  },
  {
    name: "offset_check",
    title: "Offset: check the learner's attempt",
    description:
      "Compare the comp now with the lesson's start. Per member: start (and landing) before and now, how far each property " +
      "moved, any split, and whose shift it is; pairs still together, order changes, keys outside the comp, other changes, " +
      "the rhythm, and whether it passed. Doesn't change the baseline.",
    inputSchema: {
      type: "object",
      properties: {
        split: { type: "array", items: { type: "string" }, description: "Layers the learner just said they split on purpose." },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    handler: offsetCheck,
  },
];
