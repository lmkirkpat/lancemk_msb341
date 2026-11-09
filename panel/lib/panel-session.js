// Panel session (data-model › Panel session, research R6, FR-016): the display log that lets a
// lesson continue after the panel is reopened. One at a time; a new lesson replaces it. Frames are
// stored as files in panel-frames/, not base64, to keep the log small.
"use strict";

const nodeFs = require("fs");
const path = require("path");
const { defaultHome } = require("./config.js");

const FILE = "panel-session.json";
const FRAMES = "panel-frames";
const ROLES = ["learner", "mentor", "notice", "change", "divider", "resuming"];
const VERSION = 2; // version 2: the lesson view's shape (plan P8). An older file reads as nothing to continue.

const where = (opts) => ({ fs: (opts && opts.fs) || nodeFs, home: (opts && opts.home) || defaultHome() });

// skill: the lesson's opening skill, so Continue launches with the same tools (spec 013 FR-042).
// Older saves have none, and those are all easing lessons.
function newPanelSession({ claude_session_id, bridge_started, lesson, now, skill }) {
  const at = now || new Date().toISOString();
  return { version: VERSION, claude_session_id, bridge_started: bridge_started || null, started_at: at, updated_at: at, ended: false, lesson: lesson || null, skill: skill || null, messages: [] };
}

// The saved session, or null when it's missing, unreadable or another version.
function readPanelSession(opts) {
  const { fs, home } = where(opts);
  try {
    const s = JSON.parse(fs.readFileSync(path.join(home, FILE), "utf8"));
    if (!s || s.version !== VERSION || typeof s.claude_session_id !== "string" || !Array.isArray(s.messages)) return null;
    s.messages = s.messages
      .filter((m) => m && ROLES.includes(m.role))
      .map((m) => Object.assign({ role: m.role, text: String(m.text || ""), frames: Array.isArray(m.frames) ? m.frames.map(String) : [] }, m.title ? { title: String(m.title) } : {}, m.cut_off ? { cut_off: true } : {}));
    return s;
  } catch (e) {
    return null;
  }
}

// Temp file and rename, so a crash mid-write never leaves half a file. Never throws: saving the
// display log must not break a lesson.
function writePanelSession(opts, session) {
  const { fs, home } = where(opts);
  try {
    fs.mkdirSync(home, { recursive: true });
    const file = path.join(home, FILE);
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(Object.assign({}, session, { updated_at: new Date().toISOString() }), null, 2) + "\n");
    fs.renameSync(tmp, file);
    return true;
  } catch (e) {
    return false;
  }
}

function clearPanelSession(opts) {
  const { fs, home } = where(opts);
  try {
    fs.unlinkSync(path.join(home, FILE));
  } catch (e) {}
}

let lastStamp = "";
let seq = 0;

// image: { data (base64), mimeType }. → the saved file's path, or null if it couldn't be written.
function saveFrame(opts, image) {
  const { fs, home } = where(opts);
  try {
    const dir = path.join(home, FRAMES);
    fs.mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    seq = stamp === lastStamp ? seq + 1 : 0; // two frames in the same millisecond
    lastStamp = stamp;
    const file = path.join(dir, `frame-${stamp}${seq ? `-${seq}` : ""}.png`);
    fs.writeFileSync(file, Buffer.from(String(image.data), "base64"));
    return file;
  } catch (e) {
    return null;
  }
}

// A saved frame's base64, or null when the file is gone (FR-027).
function readFrame(opts, file) {
  const { fs } = where(opts);
  try {
    return fs.readFileSync(file).toString("base64");
  } catch (e) {
    return null;
  }
}

// FR-028: only a connected bridge answering with a different start time ends a saved lesson; a busy
// or absent bridge shows neither, and the connection poll asks again.
function savedStatus(saved, connection) {
  if (!saved || saved.ended !== false || !saved.bridge_started) return null;
  if (!connection || connection.state !== "connected" || !connection.started) return null;
  return connection.started === saved.bridge_started ? "waiting" : "aeclosed";
}

// Continue only an unfinished lesson from the same AE session: the bridge restarts with AE, so a
// changed (or unknown) start time means the mentor's view of the project may be out of date.
function canContinue(saved, bridgeStartedNow) {
  return !!saved && saved.ended === false && saved.bridge_started != null && saved.bridge_started === bridgeStartedNow;
}

module.exports = { newPanelSession, readPanelSession, writePanelSession, clearPanelSession, saveFrame, readFrame, savedStatus, canContinue, FILE, FRAMES };
