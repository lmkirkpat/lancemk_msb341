// The mentor's six tools, as defined in specs/002-easing-slice/contracts/mentor-tools.md. This is
// the entire set: there is no tool that runs arbitrary ExtendScript (FR-013).

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runSnippet } from "./bridge-client.mjs";
import { diff } from "./lib/diff.mjs";
import * as session from "./lib/session.mjs";
import * as learner from "./lib/learner-store.mjs";

const json = (value) => ({ content: [{ type: "text", text: JSON.stringify(value, null, 2) }] });

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
  if (result.comp_matches) session.markChecked(result.passed);
  return json(result);
}

// From upstream ae_preview_frame: saveFrameToPng finishes writing after it returns.
const FRAME_DIR = path.join(os.tmpdir(), "ae-mentor-frames");
const MAX_IMAGE_BYTES = 4.5 * 1024 * 1024;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function pruneFrames() {
  try {
    const cutoff = Date.now() - 24 * 3600 * 1000;
    for (const f of fs.readdirSync(FRAME_DIR)) {
      const p = path.join(FRAME_DIR, f);
      if (fs.statSync(p).mtimeMs < cutoff) fs.unlinkSync(p);
    }
  } catch {}
}

async function waitForFile(file, timeoutMs) {
  const end = Date.now() + timeoutMs;
  let last = -1;
  while (Date.now() < end) {
    try {
      const size = fs.statSync(file).size;
      if (size > 0 && size === last) return size;
      last = size;
    } catch {}
    await sleep(250);
  }
  throw new Error(`After Effects did not write the frame within ${timeoutMs / 1000} s.`);
}

async function previewFrame({ time } = {}) {
  fs.mkdirSync(FRAME_DIR, { recursive: true });
  pruneFrames();
  const file = path.join(FRAME_DIR, `frame-${Date.now()}.png`);
  const r = await runSnippet("preview-frame", { file: file.replace(/\\/g, "/"), time: time ?? null });
  const bytes = await waitForFile(file, 30000);
  if (bytes > MAX_IMAGE_BYTES) {
    return json({ ...r, file, note: `The PNG is ${(bytes / 1048576).toFixed(1)} MB, too large to return inline. Open the file instead.` });
  }
  return {
    content: [
      { type: "image", data: fs.readFileSync(file).toString("base64"), mimeType: "image/png" },
      { type: "text", text: JSON.stringify(r) },
    ],
  };
}

// Learner record tools (§5–6). These never contact AE, so they work even when it's closed.
async function readLearnerRecord() {
  return json(learner.readRecord());
}

async function recordLesson(entry) {
  const { skill } = learner.recordLesson(entry);
  return json({ saved: true, skill: { status: skill.status, next: skill.next } });
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
    name: "preview_frame",
    title: "Preview a frame",
    description: "Render one frame of the active comp as an image, to show the learner their own animation. Defaults to the current time.",
    inputSchema: {
      type: "object",
      properties: { time: { type: "number", minimum: 0, description: "Seconds from the start of the comp." } },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    handler: previewFrame,
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
  {
    name: "read_learner_record",
    title: "Read the learner record",
    description: "What the learner has practiced before, and what to review or do next. Read it before opening a lesson.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    handler: readLearnerRecord,
  },
  {
    name: "record_lesson",
    title: "Record the lesson",
    description:
      "Save what happened in this lesson to the learner record, in plain language. Never include names, emails or phone numbers.",
    inputSchema: {
      type: "object",
      properties: {
        skill: { type: "string", enum: ["easing.basic"] },
        project: { type: "string" },
        comp: { type: "string" },
        attempted: { type: "string" },
        result: { type: "string", enum: ["passed", "partial", "not_checked"] },
        demo_used: { type: "boolean" },
        summary: { type: "string" },
        next: { type: "string" },
      },
      required: ["skill", "project", "comp", "attempted", "result", "demo_used", "summary", "next"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false },
    handler: recordLesson,
  },
];
