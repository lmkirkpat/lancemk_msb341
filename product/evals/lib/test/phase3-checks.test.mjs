// The phase 3 lesson-set checks (spec 014 T079): free, no model.
import { test } from "node:test";
import assert from "node:assert/strict";
import { lastSentence, phase3Checks, phase3Problems } from "../phase3-checks.mjs";

const say = (text) => ({ kind: "say", text });
const tool = (name, input = {}, ok = true) => ({ kind: "tool", name, input, ok, result: "{}" });
const TOOLS = ["end_lesson", "record_lesson", "snapshot_project", "set_ease", "diff_since_last"];
const run = (expect, turns) => phase3Checks(expect, turns, TOOLS);

test("turn_tools: a stop calls end_lesson and not record_lesson, in that turn only", () => {
  const turns = [{ events: [tool("snapshot_project"), say("Hello")] }, { events: [tool("end_lesson"), say("OK.")] }];
  const want = { turn_tools: [{ turn: 2, called: ["end_lesson"], not_called: ["record_lesson", "set_ease"] }] };
  assert.equal(run(want, turns)[0].pass, true);
  const bad = [turns[0], { events: [tool("end_lesson"), tool("record_lesson")] }];
  assert.match(run(want, bad)[0].detail, /called record_lesson/);
  const none = [turns[0], { events: [tool("end_lesson", {}, false)] }];
  assert.match(run(want, none)[0].detail, /no successful end_lesson/);
});

test("record_text_never reads every saved record, and ignores a refused one", () => {
  const rec = (summary, ok = true) => tool("record_lesson", { summary, attempted: "Eased two pairs", next: "Try Logo." }, ok);
  const want = { record_text_never: [{ id: "no_ctrl_change", pattern: "CTRL[^.]*\\b(?:moved|undid|changed)\\b|\\b(?:moved|undid|changed)\\b[^.]*CTRL" }] };
  assert.equal(run(want, [{ events: [rec("Moved CTRL by mistake", false), rec("Eased both pairs by the first check")] }])[0].pass, true);
  assert.equal(run(want, [{ events: [rec("Undid a change to CTRL, then eased both")] }])[0].pass, false);
  assert.match(run(want, [{ events: [] }])[0].detail, /nothing was recorded/);
});

test("say_ends_with reads the last sentence of the turn", () => {
  assert.equal(lastSentence(["I've noted it.", "That was step 3; next is Play it back and watch the turn."]), "That was step 3; next is Play it back and watch the turn.");
  assert.equal(lastSentence(["Done.\n\nThat was the last step."]), "That was the last step.");
  assert.equal(lastSentence([]), "");
  const want = { say_ends_with: [{ id: "hand_back", turn: 1, pattern: "^That was step 3[;.] Next is" }] };
  assert.equal(run(want, [{ events: [say("Noted. That was step 3; next is Play it back.")] }])[0].pass, true);
  assert.equal(run(want, [{ events: [say("That was step 3; next is Play it back. Want a review?")] }])[0].pass, false);
});

test("say_never_when_called checks the words only when the tool was called", () => {
  const want = { say_never_when_called: [{ id: "silent", turn: 1, tool: "record_lesson", pattern: "couldn't save|try again|refus" }] };
  assert.equal(run(want, [{ events: [tool("record_lesson"), say("Saved. Want to try Logo?")] }])[0].pass, true);
  assert.equal(run(want, [{ events: [tool("record_lesson"), say("It wouldn't save, let me try again.")] }])[0].pass, false);
  assert.match(run(want, [{ events: [say("Nothing")] }])[0].detail, /wasn't called/);
});

test("phase3Problems names a bad turn, regex and missing tool", () => {
  assert.deepEqual(phase3Problems({ turn_tools: [{ turn: 1, called: ["x"] }], say_ends_with: [{ id: "a", turn: 2, pattern: "x" }] }, 2), []);
  assert.match(phase3Problems({ turn_tools: [{ turn: 5 }] }, 2)[0], /out of range/);
  assert.match(phase3Problems({ record_text_never: [{ id: "a", pattern: "(" }] }, 2)[0], /bad regex/);
  assert.match(phase3Problems({ say_never_when_called: [{ id: "a", turn: 1, pattern: "x" }] }, 2)[0], /needs a tool/);
});
