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
  assert.deepEqual(Object.keys(s).sort(), ["bridge_started", "claude_session_id", "ended", "lesson", "messages", "skill", "started_at", "updated_at", "version"]);
  assert.equal(s.version, 3);
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

test("the opening skill is saved, so Continue launches with the same tools (spec 013 FR-042)", () => {
  const home = tmpHome();
  const s = ps.newPanelSession({ claude_session_id: "abc", bridge_started: STARTED, skill: "key-types-mentor" });
  assert.equal(s.skill, "key-types-mentor");
  ps.writePanelSession({ home }, Object.assign(s, { lesson: { checks: 1 } }));
  assert.equal(ps.readPanelSession({ home }).skill, "key-types-mentor");
  assert.equal(ps.newPanelSession({ claude_session_id: "abc" }).skill, null, "a request with no skill");
});

test("a save from before the skill was kept still reads, with no skill (so easing's list)", () => {
  const home = tmpHome();
  fs.writeFileSync(path.join(home, ps.FILE), JSON.stringify({ version: 2, claude_session_id: "old", bridge_started: STARTED, ended: false, messages: [] }));
  const back = ps.readPanelSession({ home });
  assert.equal(back.claude_session_id, "old");
  assert.equal(back.skill, undefined);
  assert.equal(ps.canContinue(back, STARTED), true);
});

test("missing, broken or other-version files read as null; bad messages are dropped", () => {
  const home = tmpHome();
  assert.equal(ps.readPanelSession({ home }), null);
  fs.writeFileSync(path.join(home, ps.FILE), "{ broken");
  assert.equal(ps.readPanelSession({ home }), null);
  fs.writeFileSync(path.join(home, ps.FILE), JSON.stringify({ version: 1, claude_session_id: "a", messages: [] }));
  assert.equal(ps.readPanelSession({ home }), null);
  fs.writeFileSync(path.join(home, ps.FILE), JSON.stringify({ version: 2, claude_session_id: "a", ended: false, messages: [{ role: "system", text: "x" }, { role: "mentor", text: "hi" }, null] }));
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

// ---------- spec 014 T026: version 3, the ask thread beside the lesson (research R12) ----------
const at = require("../lib/ask-thread.js");

const thread = (id) => at.answer(at.addQuestion(at.newThread({ id, claude_session_id: `s-${id}` }), { text: "Why does it swing?", kind: "question" }), { view: { kind: "answer", explanation: "In Comp 1, Door turns from its middle.", steps: [{ number: 1, text: "Pan Behind its pivot.", tag: "Set the pivot", not_taught: false, layer: "Door" }], offers: [], closing_offer: "Try it?" }, had_result: true });

test("a version 2 file reads as today, and has no thread", () => {
  const home = tmpHome();
  fs.writeFileSync(path.join(home, ps.FILE), JSON.stringify({ version: 2, claude_session_id: "old", bridge_started: STARTED, ended: false, lesson: { checks: 1 }, messages: [{ role: "mentor", text: "hi" }] }));
  assert.equal(ps.readPanelSession({ home }).claude_session_id, "old");
  assert.deepEqual(ps.readPanelSession({ home }).lesson, { checks: 1 });
  assert.equal(ps.readThread({ home }), null);
});

test("the thread and the lesson keep separate slots: writing or clearing one leaves the other", () => {
  const home = tmpHome();
  ps.writePanelSession({ home }, ps.newPanelSession({ claude_session_id: "lesson-1", bridge_started: STARTED }));
  assert.equal(ps.writeThread({ home }, thread("t1")), true);
  assert.equal(ps.readPanelSession({ home }).claude_session_id, "lesson-1", "a waiting lesson stays when a question is asked");
  assert.equal(ps.readThread({ home }).id, "t1");
  assert.equal("thread" in ps.readPanelSession({ home }), false, "the lesson read never carries the thread");
  ps.writePanelSession({ home }, Object.assign(ps.newPanelSession({ claude_session_id: "lesson-2", bridge_started: STARTED }), { thread: "ignored" }));
  assert.equal(ps.readThread({ home }).id, "t1", "a lesson write keeps the saved thread");
  ps.clearPanelSession({ home });
  assert.equal(ps.readPanelSession({ home }), null);
  assert.equal(ps.readThread({ home }).id, "t1", "clearing the lesson keeps the thread");
  ps.writePanelSession({ home }, ps.newPanelSession({ claude_session_id: "lesson-3", bridge_started: STARTED }));
  ps.clearThread({ home });
  assert.equal(ps.readThread({ home }), null);
  assert.equal(ps.readPanelSession({ home }).claude_session_id, "lesson-3", "ending the thread keeps the lesson");
  ps.clearPanelSession({ home });
  assert.deepEqual(fs.readdirSync(home), [], "both slots empty: no file");
});

test("a saved thread round-trips: questions, answers' views, the latest steps", () => {
  const home = tmpHome();
  const th = thread("t2");
  ps.writeThread({ home }, th);
  const back = ps.readThread({ home });
  assert.deepEqual(back.questions, th.questions);
  assert.deepEqual(back.latest_steps, th.latest_steps);
  assert.equal(back.claude_session_id, "s-t2");
  ps.clearThread({ home });
  assert.deepEqual(fs.readdirSync(home), []);
});

test("a thread file of the wrong shape reads as no thread, and never as a lesson", () => {
  const home = tmpHome();
  fs.writeFileSync(path.join(home, ps.FILE), JSON.stringify({ version: 3, thread: { version: 9, id: "x", questions: [] } }));
  assert.equal(ps.readThread({ home }), null);
  assert.equal(ps.readPanelSession({ home }), null);
  fs.writeFileSync(path.join(home, ps.FILE), JSON.stringify({ version: 2, claude_session_id: "a", messages: [], thread: thread("t3") }));
  assert.equal(ps.readThread({ home }), null, "version 2 never had a thread");
});
