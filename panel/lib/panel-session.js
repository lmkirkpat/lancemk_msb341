// Panel session (data-model › Panel session, research R6, FR-016): the display log that lets a
// lesson continue after the panel is reopened. One at a time; a new lesson replaces it. Frames are
// stored as files in panel-frames/, not base64, to keep the log small.
"use strict";

const nodeFs = require("fs");
const path = require("path");
const { defaultHome } = require("./config.js");

const FILE = "panel-session.json";
const FRAMES = "panel-frames";
const ROLES = ["learner", "mentor", "notice"];

const where = (opts) => ({ fs: (opts && opts.fs) || nodeFs, home: (opts && opts.home) || defaultHome() });

function newPanelSession({ claude_session_id, bridge_started, lesson, now }) {
  const at = now || new Date().toISOString();
  return { version: 1, claude_session_id, bridge_started: bridge_started || null, started_at: at, updated_at: at, ended: false, lesson: lesson || null, messages: [] };
}

// The saved session, or null when it's missing, unreadable or another version.
function readPanelSession(opts) {
  const { fs, home } = where(opts);
  try {
    const s = JSON.parse(fs.readFileSync(path.join(home, FILE), "utf8"));
    if (!s || s.version !== 1 || typeof s.claude_session_id !== "string" || !Array.isArray(s.messages)) return null;
    s.messages = s.messages
      .filter((m) => m && ROLES.includes(m.role))
      .map((m) => ({ role: m.role, text: String(m.text || ""), frames: Array.isArray(m.frames) ? m.frames.map(String) : [] }));
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

// Continue only an unfinished lesson from the same AE session: the bridge restarts with AE, so a
// changed (or unknown) start time means the mentor's view of the project may be out of date.
function canContinue(saved, bridgeStartedNow) {
  return !!saved && saved.ended === false && saved.bridge_started != null && saved.bridge_started === bridgeStartedNow;
}

module.exports = { newPanelSession, readPanelSession, writePanelSession, clearPanelSession, saveFrame, canContinue, FILE, FRAMES };
