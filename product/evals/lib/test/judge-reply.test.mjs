import test from "node:test";
import assert from "node:assert/strict";
import { parseJudgeReply } from "../judge-reply.mjs";

const items = [{ item: "R-A", pass: true, reason: "ok [1]" }, { item: "R-B", pass: false, reason: 'said "x]"' }];
const json = JSON.stringify(items);

test("plain JSON", () => assert.deepEqual(parseJudgeReply(json), items));
test("a code fence", () => assert.deepEqual(parseJudgeReply("```json\n" + json + "\n```"), items));
test("a fence with no language", () => assert.deepEqual(parseJudgeReply("```\n" + json + "\n```"), items));
test("prose before and after the fence", () => assert.deepEqual(parseJudgeReply("Here is my grading:\n```json\n" + json + "\n```\nHope that helps."), items));
test("prose around bare JSON, brackets inside strings", () => assert.deepEqual(parseJudgeReply("Grading (2 items) follows. " + json + " Done."), items));
test("an unclosed fence", () => assert.deepEqual(parseJudgeReply("```json\n" + json), items));
test("a cut-off reply is null", () => assert.equal(parseJudgeReply(json.slice(0, 40)), null));
test("prose only, empty and non-arrays are null", () => {
  assert.equal(parseJudgeReply("I could not grade this."), null);
  assert.equal(parseJudgeReply(""), null);
  assert.equal(parseJudgeReply(undefined), null);
  assert.equal(parseJudgeReply('{"item":"R-A","pass":true}'), null);
});
test("a stray array with no items in it is not taken for the grading", () => assert.equal(parseJudgeReply("See steps [1, 2, 3]."), null));
