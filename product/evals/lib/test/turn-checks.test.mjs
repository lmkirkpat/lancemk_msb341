// Spec 007 T027, T032 to T037: the per-turn checks the runners share.
import { test } from "node:test";
import assert from "node:assert/strict";
import { countSentences, turnChecks, turnProblems } from "../turn-checks.mjs";

const say = (text) => ({ kind: "say", text });
const tool = (name, ok = true) => ({ kind: "tool", name, ok });
const TOOLS = ["preview_frame", "record_lesson", "set_ease"];

test("countSentences: plain sentences, decimals, a list and 'Edit > Undo'", () => {
  assert.equal(countSentences("Title runs 0.5 to 1.5 s. Want to start there?"), 2);
  assert.equal(countSentences("One. Two! Three?"), 3);
  assert.equal(countSentences("It changed. Edit > Undo takes it back."), 2);
  assert.equal(countSentences("- one\n- two\n- three"), 3);
  assert.equal(countSentences(""), 0);
});

test("last_turn_tools_called counts successful calls in the last turn only", () => {
  const turns = [{ events: [tool("preview_frame")] }, { events: [say("hi"), tool("preview_frame", false)] }];
  const [c] = turnChecks({ last_turn_tools_called: ["preview_frame"] }, turns, TOOLS);
  assert.equal(c.pass, false);
  turns[1].events.push(tool("preview_frame"));
  assert.equal(turnChecks({ last_turn_tools_called: ["preview_frame"] }, turns, TOOLS)[0].pass, true);
});

test("last_turn_tools_not_called ignores earlier turns", () => {
  const turns = [{ events: [tool("record_lesson")] }, { events: [say("Sure.")] }];
  assert.equal(turnChecks({ last_turn_tools_not_called: ["record_lesson"] }, turns, TOOLS)[0].pass, true);
  turns[1].events.push(tool("record_lesson"));
  assert.equal(turnChecks({ last_turn_tools_not_called: ["record_lesson"] }, turns, TOOLS)[0].pass, false);
});

test("say_max_sentences joins the named turns", () => {
  const turns = [{ events: [say("One. Two."), say("Three.")] }];
  assert.equal(turnChecks({ say_max_sentences: [{ id: "x", turns: [1], max: 3 }] }, turns, TOOLS)[0].pass, true);
  assert.equal(turnChecks({ say_max_sentences: [{ id: "x", turns: [1], max: 2 }] }, turns, TOOLS)[0].pass, false);
});

test("turnProblems flags a bad key", () => {
  assert.deepEqual(turnProblems({ say_max_sentences: [{ id: "a", turns: [1], max: 2 }] }, 1), []);
  assert.equal(turnProblems({ say_max_sentences: [{ id: "a", turns: [4], max: 2 }] }, 1).length, 1);
  assert.equal(turnProblems({ last_turn_tools_called: "x" }, 1).length, 1);
});
