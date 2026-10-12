"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const ps = require("../lib/panel-session.js");

const tmpHome = () => fs.mkdtempSync(path.join(os.tmpdir(), "panel-session-"));
const STARTED = "2026-10-12T15:00:00.000Z";

test("new session has exactly the data-model fields", () => {
  const s = ps.newPanelSession({ claude_session_id: "abc", bridge_started: STARTED, now: "2026-10-12T16:00:00.000Z" });
  assert.deepEqual(Object.keys(s).sort(), ["bridge_started", "claude_session_id", "ended", "lesson", "messages", "started_at", "updated_at", "version"]);
  assert.equal(s.version, 1);
  assert.equal(s.ended, false);
  assert.deepEqual(s.messages, []);
});

test("write then read round-trips, atomically (no temp file left)", () => {
  const home = tmpHome();
  const s = ps.newPanelSession({ claude_session_id: "abc", bridge_started: STARTED });
  s.lesson = { demo_made: true, checks: 1, passed: false, check_list: null, recorded: false };
  s.messages.push({ role: "learner", text: "Show me", frames: [] }, { role: "mentor", text: "Here.", frames: ["/x/frame.png"] });
  assert.equal(ps.writePanelSession({ home }, s), true);
  const back = ps.readPanelSession({ home });
  assert.equal(back.claude_session_id, "abc");
  assert.deepEqual(back.lesson, s.lesson);
  assert.deepEqual(back.messages, s.messages);
  assert.deepEqual(fs.readdirSync(home), [ps.FILE]);
});

test("a new lesson replaces the file", () => {
  const home = tmpHome();
  ps.writePanelSession({ home }, ps.newPanelSession({ claude_session_id: "one", bridge_started: STARTED }));
  ps.writePanelSession({ home }, ps.newPanelSession({ claude_session_id: "two", bridge_started: STARTED }));
  assert.equal(ps.readPanelSession({ home }).claude_session_id, "two");
});

test("missing, broken or other-version files read as null; bad messages are dropped", () => {
  const home = tmpHome();
  assert.equal(ps.readPanelSession({ home }), null);
  fs.writeFileSync(path.join(home, ps.FILE), "{ broken");
  assert.equal(ps.readPanelSession({ home }), null);
  fs.writeFileSync(path.join(home, ps.FILE), JSON.stringify({ version: 2, claude_session_id: "a", messages: [] }));
  assert.equal(ps.readPanelSession({ home }), null);
  fs.writeFileSync(path.join(home, ps.FILE), JSON.stringify({ version: 1, claude_session_id: "a", ended: false, messages: [{ role: "system", text: "x" }, { role: "mentor", text: "hi" }, null] }));
  assert.deepEqual(ps.readPanelSession({ home }).messages, [{ role: "mentor", text: "hi", frames: [] }]);
});

test("clearPanelSession removes the file, and is fine when there's none", () => {
  const home = tmpHome();
  ps.writePanelSession({ home }, ps.newPanelSession({ claude_session_id: "a", bridge_started: STARTED }));
  ps.clearPanelSession({ home });
  ps.clearPanelSession({ home });
  assert.equal(ps.readPanelSession({ home }), null);
});

test("writePanelSession never throws when the folder can't be written", () => {
  const badFs = { mkdirSync() { throw new Error("EACCES"); } };
  assert.equal(ps.writePanelSession({ home: "/nope", fs: badFs }, ps.newPanelSession({ claude_session_id: "a" })), false);
});

test("saveFrame writes the decoded image to panel-frames/ with unique names", () => {
  const home = tmpHome();
  const data = Buffer.from("png bytes").toString("base64");
  const a = ps.saveFrame({ home }, { data, mimeType: "image/png" });
  const b = ps.saveFrame({ home }, { data, mimeType: "image/png" });
  assert.notEqual(a, b);
  assert.equal(path.dirname(a), path.join(home, ps.FRAMES));
  assert.match(path.basename(a), /^frame-.+\.png$/);
  assert.equal(fs.readFileSync(a, "utf8"), "png bytes");
});

test("canContinue: only unfinished, same bridge start, known start", () => {
  const s = ps.newPanelSession({ claude_session_id: "a", bridge_started: STARTED });
  assert.equal(ps.canContinue(s, STARTED), true);
  assert.equal(ps.canContinue(s, "2026-10-12T17:00:00.000Z"), false); // AE (or the bridge) restarted
  assert.equal(ps.canContinue(s, null), false); // bridge not reachable now
  assert.equal(ps.canContinue(Object.assign({}, s, { ended: true }), STARTED), false);
  assert.equal(ps.canContinue(Object.assign({}, s, { bridge_started: null }), null), false); // unknown then and now
  assert.equal(ps.canContinue(null, STARTED), false);
});
