// The easing skill's tools (specs/002-easing-slice/contracts/mentor-tools.md): read the comp,
// demonstrate on one pair, check the learner's attempt.

import { runSnippet } from "../bridge-client.mjs";
import { diff } from "../lib/diff.mjs";
import * as session from "../lib/session.mjs";
import { json } from "../lib/reply.mjs";

export const SKILLS = ["easing.basic"];

async function takeSnapshot() {
  const raw = await runSnippet("snapshot", {});
  return { taken_at: new Date().toISOString(), ...raw };
}

// "<layer index>/<match-name path>/<key index>"; the path itself contains slashes.
function parseSegmentId(id) {
  const first = id.indexOf("/");
  const last = id.lastIndexOf("/");
  return { layer_index: Number(id.slice(0, first)), property_path: id.slice(first + 1, last), key_index: Number(id.slice(last + 1)) };
}

async function snapshotProject({ focus_layers } = {}) {
  const snapshot = await takeSnapshot();
  const { lesson, analysis } = session.start(snapshot, { focus_layers });
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
  });
}

async function setEase({ segment_id }) {
  const lesson = session.assertCanDemo(segment_id); // DEMO_USED / NOT_DEMO_TARGET / NO_SESSION, before AE
  const r = await runSnippet("set-ease", { comp_id: lesson.comp_id, ...parseSegmentId(segment_id) }, { undo: true });
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
  if (result.comp_matches) session.markChecked(result.passed, { demoUndone: result.demo_undone });
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
      "still_linear or removed, plus other changes, and whether the lesson passed. Doesn't change the baseline.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    handler: diffSinceLast,
  },
];
