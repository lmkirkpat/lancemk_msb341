// The saved lesson conversation (spec 013 FR-015, FR-023, FR-024; data-model › Lesson conversation):
// panel-conversation.json in the learner home, with tool-result images as files in
// panel-conversation-frames/, so a lesson can continue after the panel closes. What loads is what
// was saved, byte for byte, because the service checks the history it gets back. Nothing here reads
// the AE project, session.json or learner.json, and nothing here throws: a conversation that can't
// be saved or continued must never break a lesson. Reasons are fixed words, safe to log.
//
// Version 2 (T044, data-model › Prompt state): the file also holds the lesson's prompt state at the
// same complete exchange as the history, so a continued lesson can rebuild the same next request.
// The loop checks that rebuild (request_hash); a mismatch is the reason `prompt`. Version 1 (T043's,
// never wired) had no prompt state and isn't continued (reason `version`).

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { SKILL_PATTERN } from "./skills.mjs";

export const CONVERSATION_FILE = "panel-conversation.json";
export const FRAMES_DIR = "panel-conversation-frames";
const VERSION = 2;
// Why a saved conversation wasn't continued. `prompt` comes from the loop's rebuild (lib/loop.mjs).
export const NOT_CONTINUED = Object.freeze(["none", "unreadable", "version", "session", "model", "frames", "prompt"]);
const PROMPT_FIELDS = ["start_skill", "skill", "offered", "handed_over", "pending_skill", "request_hash"];
const ROLES = new Set(["user", "assistant", "system"]);
// A frame's name is the sha256 of its bytes: the same frame is one file, and a load can tell it's
// intact. Only this exact shape is ever opened, so a damaged file can't point outside the folder.
const FRAME_PATH = new RegExp(`^${FRAMES_DIR}/([0-9a-f]{64})\\.png$`);

const isBlockList = (c) => Array.isArray(c) && c.every((b) => b && typeof b === "object" && !Array.isArray(b));
const blocksOf = (message, type) => (Array.isArray(message.content) ? message.content.filter((b) => b && b.type === type) : []);

// Whether the history ends on a complete exchange (data-model): an answer with no tool call, or an
// answer with tool calls plus the message holding a result for every one. A user message with
// anything besides results at the end is the learner's words waiting for an answer.
export function isCompleteHistory(messages) {
  if (!Array.isArray(messages) || !messages.length) return false;
  const last = messages[messages.length - 1];
  if (!last || !Array.isArray(last.content) || !last.content.length) return false;
  if (last.role === "assistant") return blocksOf(last, "tool_use").length === 0;
  if (last.role !== "user" || messages.length < 2) return false;
  if (blocksOf(last, "tool_result").length !== last.content.length) return false;
  const answer = messages[messages.length - 2];
  if (!answer || answer.role !== "assistant") return false;
  const uses = blocksOf(answer, "tool_use");
  const answered = new Set(blocksOf(last, "tool_result").map((b) => b.tool_use_id));
  return uses.length > 0 && uses.every((u) => answered.has(u.id));
}

// Replaces one key of an object with another in the same position, so restoring the original key
// gives back the same JSON.
function swapKey(obj, from, to, value) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => (k === from ? [to, value] : [k, v])));
}

// Calls change(imageBlock) on every image in a tool result; a returned block replaces it.
function mapToolResultImages(messages, change) {
  return messages.map((m) => {
    if (m.role !== "user" || !Array.isArray(m.content)) return m;
    return {
      ...m,
      content: m.content.map((b) => {
        if (!b || b.type !== "tool_result" || !Array.isArray(b.content)) return b;
        return { ...b, content: b.content.map((c) => (c && c.type === "image" && c.source && typeof c.source === "object" ? change(c) : c)) };
      }),
    };
  });
}

// Temp file and rename, so a reader only ever sees a whole file. Owner-only: it holds the learner's words.
function writeWhole(file, data) {
  const temp = `${file}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(temp, data, { mode: 0o600 });
    fs.renameSync(temp, file);
  } catch (e) {
    fs.rmSync(temp, { force: true });
    throw e;
  }
}

// Swaps a block's image data for its file, writing the file if it's new. Data that wouldn't come
// back the same from a decode and encode stays inline, since exactness comes first.
function frameOut(home, block) {
  const { data } = block.source;
  if (typeof data !== "string") return block;
  const bytes = Buffer.from(data, "base64");
  if (bytes.toString("base64") !== data) return block;
  const name = `${crypto.createHash("sha256").update(bytes).digest("hex")}.png`;
  const dir = path.join(home, FRAMES_DIR);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const file = path.join(dir, name);
  if (!fs.existsSync(file)) writeWhole(file, bytes);
  return { ...block, source: swapKey(block.source, "data", "frame_file", `${FRAMES_DIR}/${name}`) };
}

class FrameError extends Error {}

function frameIn(home, block) {
  if (!("frame_file" in block.source)) return block;
  const ref = block.source.frame_file;
  const match = typeof ref === "string" ? FRAME_PATH.exec(ref) : null;
  if (!match) throw new FrameError();
  let bytes;
  try {
    bytes = fs.readFileSync(path.join(home, ref));
  } catch {
    throw new FrameError();
  }
  if (crypto.createHash("sha256").update(bytes).digest("hex") !== match[1]) throw new FrameError();
  return { ...block, source: swapKey(block.source, "frame_file", "data", bytes.toString("base64")) };
}

// Saves the history and the prompt state (the loop's, at the same complete exchange) if the history
// ends on a complete exchange, frames first so the file never names one that isn't there. A save
// that fails deletes the last one and its frames (best effort): an older save may be missing a
// demonstration or record_lesson that ran after it, so it must never be continued.
// → { saved: true }, { saved: false, reason: "incomplete" } (the last save stays), or
// { saved: false, reason: "write_failed", cleared } (cleared: whether the deletion worked).
export function saveConversation({ home, sessionId, settingsHash, model, prompt, messages }) {
  if (!isCompleteHistory(messages)) return { saved: false, reason: "incomplete" };
  try {
    fs.mkdirSync(home, { recursive: true });
    const onDisk = mapToolResultImages(messages, (block) => frameOut(home, block));
    writeWhole(path.join(home, CONVERSATION_FILE), JSON.stringify({ version: VERSION, session_id: sessionId, settings_hash: settingsHash, model, prompt, messages: onDisk }));
    return { saved: true };
  } catch {
    return { saved: false, reason: "write_failed", cleared: clearConversation(home) };
  }
}

const skillName = (v) => v === null || (typeof v === "string" && SKILL_PATTERN.test(v));

// The prompt state's shape (data-model › Prompt state): every field, nothing else. Whether it
// rebuilds the same request is the loop's check, not this one.
function wellFormedPrompt(p) {
  if (!p || typeof p !== "object" || Array.isArray(p)) return false;
  const keys = Object.keys(p);
  if (keys.length !== PROMPT_FIELDS.length || !PROMPT_FIELDS.every((f) => keys.includes(f))) return false;
  if (!skillName(p.start_skill) || !skillName(p.skill) || !skillName(p.pending_skill)) return false;
  if (p.offered !== null && !(Array.isArray(p.offered) && p.offered.every((n) => typeof n === "string"))) return false;
  if (typeof p.handed_over !== "boolean") return false;
  return typeof p.request_hash === "string" && /^[0-9a-f]{64}$/.test(p.request_hash);
}

function wellFormed(saved) {
  if (!wellFormedPrompt(saved.prompt)) return false;
  if (typeof saved.settings_hash !== "string") return false;
  if (!Array.isArray(saved.messages)) return false;
  if (!saved.messages.every((m) => m && ROLES.has(m.role) && isBlockList(m.content))) return false;
  return isCompleteHistory(saved.messages);
}

// The saved conversation for this session and model, with its frames restored.
// → { ok: true, conversation: { version, session_id, settings_hash, model, prompt, messages } } or
// { ok: false, reason: "none" | "unreadable" | "version" | "session" | "model" | "frames" }. Every
// refusal means the same to the learner: a fresh start with nothing alarming said (spec 003's
// rule). A different settings hash isn't a refusal: request_hash catches what changes a request.
export function loadConversation({ home, sessionId, model }) {
  let raw;
  try {
    raw = fs.readFileSync(path.join(home, CONVERSATION_FILE), "utf8");
  } catch (e) {
    return { ok: false, reason: e && e.code === "ENOENT" ? "none" : "unreadable" };
  }
  let saved;
  try {
    saved = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "unreadable" };
  }
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return { ok: false, reason: "unreadable" };
  if (saved.version !== VERSION) return { ok: false, reason: "version" };
  if (saved.session_id !== sessionId) return { ok: false, reason: "session" };
  if (saved.model !== model) return { ok: false, reason: "model" };
  if (!wellFormed(saved)) return { ok: false, reason: "unreadable" };
  try {
    return { ok: true, conversation: { ...saved, messages: mapToolResultImages(saved.messages, (block) => frameIn(home, block)) } };
  } catch {
    return { ok: false, reason: "frames" };
  }
}

// A new lesson starts: the file goes first, so a crash partway can't leave it naming deleted frames.
// → true, or false if something couldn't be removed.
export function clearConversation(home) {
  try {
    fs.rmSync(path.join(home, CONVERSATION_FILE), { recursive: true, force: true });
    fs.rmSync(path.join(home, FRAMES_DIR), { recursive: true, force: true });
    if (fs.existsSync(home)) {
      for (const name of fs.readdirSync(home)) {
        if (name.startsWith(`${CONVERSATION_FILE}.`) && name.endsWith(".tmp")) fs.rmSync(path.join(home, name), { force: true });
      }
    }
    return true;
  } catch {
    return false;
  }
}
