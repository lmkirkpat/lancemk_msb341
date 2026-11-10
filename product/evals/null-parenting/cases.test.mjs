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

const OFF = "Tile, Caption and Stamp don't follow it yet: their Parent columns still say none.";
const MOVE_ON = "I checked it: Null 1 is in place.\n\nNow parent Tile, Caption and Stamp to it with the pick whip in the Parent column, and say done.";

test("45 no_offer: any offer in a turn that says a layer is still off is caught, with or without 'so you can watch' (2026-11-09)", () => {
  const re = check("45-button-check-partial.json", "no_offer");
  for (const offer of [
    "I can parent Tile first so you can watch, if you like.",
    "Want me to parent Tile so you can watch?",
    "Shall I fix Caption for you?",
    "Let me do the rest.",
    "I'll parent Stamp so you can see it.",
  ]) assert.ok(re.test(`${OFF}\n\n${offer}`), offer);
});

test("45 no_offer: the offer is allowed when the turn moves on to the parenting ask (accepted 2026-11-09)", () => {
  const re = check("45-button-check-partial.json", "no_offer");
  assert.ok(!re.test(`${MOVE_ON} I can parent Tile first so you can watch, if you like.`));
});

test("45 no_offer: naming what is still off, or saying the learner can do it, is not an offer", () => {
  const re = check("45-button-check-partial.json", "no_offer");
  for (const s of [
    "The null is in place, but Tile, Caption and Stamp aren't parented to it yet.",
    `${OFF} Parent each of them to the null, then tell me when it's done.`,
    "I can't see a parent on Caption yet.",
    "Drag the null and watch Tile follow once you've parented it.",
  ]) assert.ok(!re.test(s), s);
});
