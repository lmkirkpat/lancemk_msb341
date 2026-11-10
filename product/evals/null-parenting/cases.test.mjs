// Offline tests for check regexes in null-parenting cases (no model). Run: node --test product/evals/null-parenting/
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const check = (file, id) => {
  const c = JSON.parse(fs.readFileSync(path.join(HERE, "cases", file), "utf8"));
  const x = c.expect.say.find((s) => s.id === id);
  return new RegExp(x.never, "i");
};

test("45 no_offer: any offer to parent, with or without 'so you can watch', is caught (2026-11-09)", () => {
  const re = check("45-button-check-partial.json", "no_offer");
  for (const s of [
    "I can parent Tile first so you can watch, if you like.",
    "Want me to parent Tile so you can watch?",
    "Shall I fix Caption for you?",
    "Let me do the rest.",
    "I'll parent Stamp so you can see it.",
  ]) assert.ok(re.test(s), s);
});

test("45 no_offer: naming what is still off, or saying the learner can do it, is not an offer", () => {
  const re = check("45-button-check-partial.json", "no_offer");
  for (const s of [
    "The null is in place, but Tile, Caption and Stamp aren't parented to it yet.",
    "Parent each of them to the null, then tell me when it's done.",
    "I can't see a parent on Caption.",
    "Drag the null and watch Tile follow once you've parented it.",
  ]) assert.ok(!re.test(s), s);
});
