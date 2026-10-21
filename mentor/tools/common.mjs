// Tools every skill shares: showing a frame, and reading and writing the learner record. Built by
// index.mjs from the skill IDs the skill files declare, so a new skill never edits this file.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runSnippet } from "../bridge-client.mjs";
import * as session from "../lib/session.mjs";
import * as learner from "../lib/learner-store.mjs";
import { json } from "../lib/reply.mjs";
import { MentorError } from "../errors.mjs";

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

// The record must match what the session saw, so a wrong "passed" can't mark the skill learned:
// passed only after a passing check, partial only after some check, not_checked only before one,
// and demo_used only if set_ease ran. With no lesson at all, only not_checked with no demo fits.
function assertMatchesLesson({ result, demo_used }) {
  let lesson = null;
  try {
    lesson = session.currentLesson();
  } catch (e) {
    if (e.code !== "NO_SESSION") throw e;
  }
  const checked = !!lesson && (lesson.checked || lesson.status === "checked");
  const demo = !!(lesson && lesson.demo);
  const off = [];
  if (result === "passed" && !(lesson && lesson.passed)) off.push('result can\'t be "passed": the last check didn\'t pass');
  if (result === "partial" && !checked) off.push('result can\'t be "partial": there was no check, so use "not_checked"');
  if (result === "not_checked" && checked) off.push(`result can't be "not_checked": there was a check, so use "${lesson.passed ? "passed" : "partial"}"`);
  if (typeof demo_used === "boolean" && demo_used !== demo) off.push(`demo_used must be ${demo}: set_ease ${demo ? "ran" : "didn't run"} in this lesson`);
  if (off.length) throw new MentorError("RECORD_MISMATCH", `The record doesn't match this lesson's checks: ${off.join("; ")}.`);
}

// `skills`: every skill ID the tool files declare; `finders`: their FINDERS, by skill ID
// (mentor/tools/index.mjs). A plain array is read as `skills` (the call before spec 004).
export function commonTools(options) {
  const { skills, finders = {} } = Array.isArray(options) ? { skills: options } : options;
  async function recordLesson(entry) {
    assertMatchesLesson(entry);
    const { skill } = learner.recordLesson(entry, skills);
    return json({ saved: true, skill: { status: skill.status, next: skill.next } });
  }

  return [
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
          skill: { type: "string", enum: skills },
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
}
