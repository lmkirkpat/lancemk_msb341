// Skill 6's tools, move a group with a null (spec 012 contracts/tools.md; spec 004
// contracts/skill-module.md › 3): read the comp and set up the lesson, the one demonstration, and
// the check. The analysis is mentor/lib/null-parenting.mjs and the check
// mentor/lib/null-parenting-check.mjs; this file only wires them to the session and After Effects.
//
// Hard rules kept here, not only in the prompt: a focus with a name another layer shares sets no
// lesson; the focus restarts the lesson from that read (its time is the stored before-read time);
// the lesson's null and its stored transform are written by these tools only (setSkillData), never
// by the model; no demo until the null is stored, never in a review, at most one, only on the demo
// target; the demo never retries.

import { runSnippet } from "../bridge-client.mjs";
import { MentorError, registerErrors } from "../errors.mjs";
import { parseHost } from "../lib/host.mjs";
import { layerInfo } from "../lib/layer-info.mjs";
import { pastTargets } from "../lib/learner-store.mjs";
import { allP2Times, analyze, finder, focusProblems, p2Times, SKILL } from "../lib/null-parenting.mjs";
import { check, demoRefusal, JUMP_PX, p2For, REFUSAL_REASONS, REFUSED_MESSAGE, refused, REGIONS, storeNull } from "../lib/null-parenting-check.mjs";
import { sourcesOf } from "../lib/motion-sources.mjs";
import { json } from "../lib/reply.mjs";
import * as session from "../lib/session.mjs";
import { takeSnapshot } from "../lib/snapshot.mjs";

registerErrors({ NULL_PARENT_REFUSED: REFUSED_MESSAGE });

export const SKILLS = [SKILL];

// Does this comp have a group to move with a null? The size of the group null_parent_snapshot
// would propose with the same `exclude` (a review's past targets); 0 without layer_info or the
// comp's size.
export const FINDERS = {
  [SKILL]: {
    focus(snapshot, { exclude = [] } = {}) {
      return finder(snapshot, { exclude });
    },
    review: true,
  },
};

const sameList = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && [...a].sort().every((x, i) => x === [...b].sort()[i]);

function ownLesson() {
  const lesson = session.currentLesson(); // NO_SESSION when there's none
  if (lesson.skill !== SKILL) throw new MentorError("NO_SESSION", "There's no lesson on moving a group in progress. Take a fresh look at the comp first.");
  return lesson;
}

function openLesson(compId, mode) {
  try {
    const l = session.currentLesson();
    return l.skill === SKILL && l.comp_id === compId && !l.passed && l.mode === mode ? l : null;
  } catch (e) {
    if (e.code === "NO_SESSION") return null;
    throw e;
  }
}

function snapshotReply(snapshot, { lesson, session: s, analysis }, extra = {}) {
  const base = s.baseline;
  return json({
    lesson,
    mode: s.mode,
    host: parseHost(snapshot),
    project: snapshot.project,
    comp: { name: snapshot.comp.name, duration: snapshot.comp.duration, frame_rate: snapshot.comp.frame_rate },
    proposal: analysis.proposal,
    no_proposal_reason: analysis.no_proposal_reason,
    left_out: analysis.left_out,
    duplicate_names: analysis.duplicate_names,
    rename_needed: analysis.rename_needed,
    focus: s.focus,
    matte_added: analysis.matte_added,
    targets: s.targets,
    demo_target: s.demo_target,
    demo_used: !!s.demo,
    // A review with no focus yet is waiting for one when there's a group to offer; only with no
    // group at all is there nothing new to review.
    no_demo_reason: s.mode === "review" ? (s.targets.length ? "review" : analysis.proposal ? "awaiting_focus" : "no_new_target") : s.demo ? null : analysis.no_demo_reason,
    before_time: s.focus && s.focus.length ? base.comp.time : null,
    null_ready: !!(s.skill_data && s.skill_data.stored),
    notes: analysis.notes,
    ...extra,
  });
}

async function nullParentSnapshot({ mode = "lesson", skill_options } = {}) {
  const snapshot = await takeSnapshot();
  if (!layerInfo(snapshot).known) {
    // A read from before wave B can't place layers on screen; start nothing.
    return json({ can_teach: false, why: "no_layer_info", comp: { name: snapshot.comp.name } });
  }
  const focus = skill_options && Array.isArray(skill_options.focus) ? skill_options.focus : null;
  const open = openLesson(snapshot.comp.id, mode);
  const opts = { skill: SKILL, analyze, mode };

  if (focus && !(open && sameList(open.focus, focus))) {
    // A new or changed focus: every name unique and every layer allowed before any lesson change.
    // A review refuses past targets here, before session.start writes anything (the session
    // fills the same list from the record).
    const exclude = mode === "review" ? (open ? open.exclude || [] : pastTargets(SKILL, snapshot.project, snapshot.comp.name)) : [];
    const problems = focusProblems(snapshot, focus, { exclude });
    if (problems.unknown.length) throw new MentorError("UNKNOWN_LAYER", `${problems.unknown.join(", ")} isn't in the comp. Use the layer's name exactly as it appears in the comp.`);
    if (!problems.ok) {
      return json({ focus_set: false, rename_needed: problems.rename_needed, refused: problems.refused, focus_size: problems.size, comp: { name: snapshot.comp.name } });
    }
    let started;
    try {
      started = session.start(snapshot, { ...opts, skill_options: { focus }, fresh: true });
    } catch (e) {
      if (e.code !== "LESSON_UNDERWAY") throw e;
      // The lesson may only be underway elsewhere (resumed): keep it if its focus is the same.
      const resumed = session.start(snapshot, opts);
      if (!sameList(resumed.session.focus, focus)) throw e;
      started = resumed;
    }
    if (started.session.focus === null || !started.session.focus) {
      return json({ focus_set: false, refused: started.analysis.focus_problems ? started.analysis.focus_problems.refused : [], comp: { name: snapshot.comp.name } });
    }
    return snapshotReply(snapshot, started, { focus_set: true });
  }
  return snapshotReply(snapshot, session.start(snapshot, opts));
}

// The target's P2 times in the baseline (the demo's reads ask for them).
const targetName = (target) => String(target).replace(/^parent\//, "");

async function nullParentDemo({ target }) {
  const lesson = session.assertCanDemo(target); // REVIEW_NO_DEMO / DEMO_USED / NOT_DEMO_TARGET / NO_SESSION, before AE
  if (lesson.skill !== SKILL) throw new MentorError("NOT_DEMO_TARGET");
  const sd = lesson.skill_data || {};
  if (!sd.stored || !sd.null || !sd.null.name) throw refused("null_not_ready"); // plan › Q1, before any read
  const base = lesson.baseline;
  const name = targetName(target);
  const sample_times = p2Times(base, name);
  const current = await takeSnapshot({ sample_times });
  if (current.comp.id !== lesson.comp_id) {
    throw new MentorError("NO_ACTIVE_COMP", `The active comp isn't ${base.comp.name}. Switch back to it, then ask for the demonstration again.`);
  }
  const r = demoRefusal(current, lesson);
  if (r.reason) throw refused(r.reason);

  // D-1: while no focus layer is parented to the null, the demo's fresh read re-stores it.
  const parentedToNull = (lesson.focus || []).some((n) => {
    const l = layerInfo(current).layers.find((x) => x.name === n);
    const src = l ? sourcesOf(current, l.index) : null;
    return !!(src && src.parents && src.parents[0] && src.parents[0].layer_index === r.nul.index);
  });
  let data = sd;
  if (!sd.parented_seen && !parentedToNull) {
    const stored = storeNull(current, r.nul.index, base.comp.time, "demo");
    if (stored) data = { ...sd, stored };
  }
  data = { ...data, parented_seen: true };

  const args = { comp_id: lesson.comp_id, layer_index: r.target.index, layer_name: r.target.name, null_index: r.nul.index, null_name: r.nul.name };
  try {
    await runSnippet("null-parent-demo", args, { undo: true });
  } catch (e) {
    // The snippet refuses with a bare reason; give the learner-facing sentence instead.
    if (e instanceof MentorError && e.code === "NULL_PARENT_REFUSED" && !e.reason) {
      const reason = String(e.message).trim();
      throw refused(REFUSAL_REASONS.includes(reason) ? reason : "not_found");
    }
    throw e;
  }
  session.recordDemo(target);
  session.setSkillData(SKILL, lesson.comp_id, data);

  // Measure it on a second read; never retried (TD B-7).
  const after = await takeSnapshot({ sample_times });
  const p2 = p2For(base, after, name, { throughNull: true, stored: data.stored });
  const couldnt = p2.not_checked.length > 0;
  return json({
    layer: r.target.name,
    null: r.nul.name,
    moved_px: couldnt ? null : p2.worst_px,
    jumped: !couldnt && p2.worst_px > JUMP_PX,
    direction: p2.direction,
    couldnt_check: couldnt ? [...new Set(p2.not_checked.map((n) => n.time))] : [],
    frame_time: base.comp.time,
    undo: "Edit > Undo",
  });
}

// Never changes the baseline, so the learner can fix things and check again.
async function nullParentCheck({ null: nullName, region, chain_on_purpose } = {}) {
  const lesson = ownLesson();
  if (!lesson.focus || !lesson.focus.length) {
    throw new MentorError("NO_SESSION", "We haven't agreed which layers move together yet. Agree the group first, then I can check it.");
  }
  const current = await takeSnapshot({ sample_times: allP2Times(lesson.baseline, lesson.focus) });
  const input = {};
  if (nullName) input.null = nullName;
  if (region) input.region = region;
  if (chain_on_purpose === true) input.chain_on_purpose = true;
  const { result, skill_data } = check(lesson.baseline, current, lesson, input);
  // A passed lesson is closed: a later check still answers, but stores and marks nothing.
  if (!lesson.passed && result.comp_matches && skill_data) session.setSkillData(SKILL, lesson.comp_id, skill_data);
  if (!lesson.passed && result.comp_matches && result.graded) session.markChecked(result.passed, { demoUndone: result.demo_undone });
  return json(result);
}

export const TOOLS = [
  {
    name: "null_parent_snapshot",
    title: "Null: read the comp and set up the lesson",
    description:
      "Read the active comp and start or continue the lesson on moving a group with a null. With no focus it proposes a group " +
      "of 2 to 4 layers that sit together and lists what it leaves out and why. Call again with skill_options.focus (layer " +
      "names) once the learner agrees a group: that read becomes the lesson's start. A name two layers share sets nothing " +
      "until the learner renames one.",
    inputSchema: {
      type: "object",
      properties: {
        mode: { type: "string", enum: ["lesson", "review"], description: "\"review\" for a review: no demo, a new group only." },
        skill_options: {
          type: "object",
          properties: { focus: { type: "array", items: { type: "string" }, minItems: 1, description: "The group's layer names, 2 to 4." } },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    handler: nullParentSnapshot,
  },
  {
    name: "null_parent_demo",
    title: "Null: parent one layer for the learner",
    description:
      "The lesson's one demonstration: parent the demo_target layer to the learner's null with no jump, as one undo step, then " +
      "measure how far it moved. Only after a check has passed the null; once per lesson, only on demo_target, never in a review.",
    inputSchema: {
      type: "object",
      properties: { target: { type: "string", description: "Must equal the lesson's demo_target." } },
      required: ["target"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false },
    handler: nullParentDemo,
  },
  {
    name: "null_parent_check",
    title: "Null: check the learner's attempt",
    description:
      "Compare the comp now with the lesson's start: the null (found by name), where its pivot sits in the group, each layer's " +
      "parent, whether it moved on screen at its key times, whether its own keys are intact, and once the parenting passes, " +
      "the null's move. Pass the learner's own answers: the null's name if they named it, the region the group turns or " +
      "scales from, and chain_on_purpose if they said a parent on the null is on purpose. Doesn't change the baseline.",
    inputSchema: {
      type: "object",
      properties: {
        null: { type: "string", description: "The null's name, only if the learner named it." },
        region: { type: "string", enum: [...REGIONS, "slides_only"], description: "Where the learner said the group turns or scales from, or slides_only." },
        chain_on_purpose: { type: "boolean", description: "True only when the learner said the null's parent is on purpose." },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false },
    handler: nullParentCheck,
  },
];
