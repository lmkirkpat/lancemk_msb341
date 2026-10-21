// Tools every skill shares: showing a frame, reading and writing the learner record, and
// recommending what to learn next. Built by index.mjs from the skill IDs and finders the skill files
// declare, so a new skill never edits this file.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runSnippet } from "../bridge-client.mjs";
import * as session from "../lib/session.mjs";
import * as learner from "../lib/learner-store.mjs";
import * as reviews from "../lib/reviews.mjs";
import { readPath } from "../lib/path.mjs";
import { recommend } from "../lib/recommend.mjs";
import { takeSnapshot } from "../lib/snapshot.mjs";
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

// Learner record tools (§5–6). These never contact AE, so they work even when it's closed. Each
// skill comes back with its review fields worked out (spec 004 FR-023: older records have none) and
// whether a review is due today, so the mentor never does date arithmetic. Reading never writes.
async function readLearnerRecord() {
  const record = learner.readRecord();
  const now = new Date();
  const skills = {};
  for (const [id, s] of Object.entries(record.skills)) skills[id] = { ...reviews.withReviewFields(s), review_is_due: reviews.isDue(s, now) };
  return json({ ...record, skills });
}

// The record must match what the session saw, so a wrong "passed" can't mark the skill learned:
// the current lesson's skill only, passed only after a passing check, partial only after some check,
// not_checked only before one, demo_used only if the demonstration ran, and never in a review
// (FR-021). With no lesson at all, only not_checked with no demo fits. Returns the lesson.
function assertMatchesLesson({ skill, result, demo_used }) {
  let lesson = null;
  try {
    lesson = session.currentLesson();
  } catch (e) {
    if (e.code !== "NO_SESSION") throw e;
  }
  const checked = !!lesson && (lesson.checked || lesson.status === "checked");
  const demo = !!(lesson && lesson.demo);
  const off = [];
  if (lesson && typeof skill === "string" && skill !== lesson.skill) off.push(`skill must be "${lesson.skill}": that's the lesson in progress`);
  if (lesson && lesson.mode === "review" && demo_used === true) off.push("demo_used must be false: a review has no demonstration");
  if (result === "passed" && !(lesson && lesson.passed)) off.push('result can\'t be "passed": the last check didn\'t pass');
  if (result === "partial" && !checked) off.push('result can\'t be "partial": there was no check, so use "not_checked"');
  if (result === "not_checked" && checked) off.push(`result can't be "not_checked": there was a check, so use "${lesson.passed ? "passed" : "partial"}"`);
  if (typeof demo_used === "boolean" && demo_used !== demo && !(lesson && lesson.mode === "review" && demo_used === true)) {
    off.push(`demo_used must be ${demo}: the demonstration ${demo ? "ran" : "didn't run"} in this lesson`);
  }
  if (off.length) throw new MentorError("RECORD_MISMATCH", `The record doesn't match this lesson's checks: ${off.join("; ")}.`);
  return lesson;
}

// recommend_next (contracts/shared-tools.md): the record (unreadable → treated as empty, and left as
// it is), one look at the comp if AE answers, then the deterministic rule in lib/recommend.mjs.
async function recommendNext({ requested_skill } = {}, { skills, finders }) {
  const record = learner.peekRecord();
  let snapshot = null;
  try {
    snapshot = await takeSnapshot();
  } catch (e) {
    if (!(e instanceof MentorError) || !["AE_UNREACHABLE", "AE_BUSY", "NO_ACTIVE_COMP"].includes(e.code)) throw e;
  }
  let offers = [];
  try {
    offers = session.reviewOffers();
  } catch {
    // An unreadable session file: no offers remembered. The next lesson start sets it aside.
  }
  const result = recommend({ path: readPath(), record, built: skills, finders, snapshot, now: new Date(), offers, requested_skill });
  // Remember a review the first time it's offered in this window. Offering it again doesn't add
  // another, so the window stays where it started (FR-020, research R8).
  if (result.recommendation && result.recommendation.kind === "review" && !offers.some((o) => o && o.skill === result.recommendation.skill)) {
    try {
      session.recordReviewOffer(result.recommendation.skill);
    } catch {
      // Remembering the offer is best effort; the recommendation still stands.
    }
  }
  return json(result);
}

// `skills`: every skill ID the tool files declare; `finders`: their FINDERS, by skill ID
// (mentor/tools/index.mjs). A plain array is read as `skills` (the call before spec 004).
export function commonTools(options) {
  const { skills, finders = {} } = Array.isArray(options) ? { skills: options } : options;
  async function recordLesson(entry) {
    const lesson = assertMatchesLesson(entry);
    const { skill } = learner.recordLesson(entry, skills, lesson ? { lesson } : {});
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
    {
      name: "recommend_next",
      title: "Recommend what to learn next",
      description:
        "Pick the one skill to suggest next, from the learner record and a look at the active comp: a skill in progress, " +
        "then a review that's due, then the next skill in the path. Say skill_name, never the ID. Pass requested_skill " +
        "when the learner asks for a skill, to learn whether it's ready, what it builds on, and whether it has a review.",
      inputSchema: {
        type: "object",
        properties: {
          requested_skill: { type: "string", description: "A skill the learner asked for, by ID or by name." },
        },
        additionalProperties: false,
      },
      // Not read-only: it remembers the review it offers (session.json › review_offers).
      annotations: { readOnlyHint: false, destructiveHint: false },
      handler: (args) => recommendNext(args, { skills, finders }),
    },
  ];
}
