// The phase 3 cases' regexes (spec 014 T078, T079) against the rubric's own Pass lines and the slips each case names:
// a Pass line must satisfy the case's `must` checks and break none of its `never` checks; a slip must be caught.
// No model. Run: node --test product/evals/lib/test/
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { phase3Checks } from "../phase3-checks.mjs";

const EVALS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const load = (set, prefix) => {
  const dir = path.join(EVALS, set, "cases");
  const f = fs.readdirSync(dir).find((x) => x.startsWith(prefix));
  return JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
};
const say = (text) => ({ kind: "say", text });
// Runs a case's `say` checks (the lesson sets' shape) on the words of one turn.
function sayChecks(c, turn, text) {
  return (c.expect.say || []).filter((s) => !s.turns || s.turns.includes(turn)).map((s) => {
    const m = text.match(new RegExp(s.must || s.never, s.cs ? "" : "i"));
    return { id: s.id, pass: s.must ? !!m : !m };
  });
}
const failedIds = (rs) => rs.filter((r) => !r.pass).map((r) => r.id);

const RULE_ONE = {
  easing: ["easing", "34", "Title rides on CTRL, whose Position keys move it, so easing Title's own keys won't change that part.", 2],
  "key-types": ["key-types", "38", "Title rides on CTRL, whose Position keys move it, so holding Title's own keys won't change that part.", 2],
  "speed-graph": ["speed-graph", "38", "Subtitle rides on CTRL, whose Position keys move it, so shaping Subtitle's own keys won't change that part.", 3],
  offset: ["offset", "45", "Dot 2 rides on Plate, whose Position keys move it, so shifting Dot 2's own keys won't change that part.", 2],
};
for (const [name, [set, prefix, pass, turn]] of Object.entries(RULE_ONE)) {
  test(`${name}: rule 1's Pass line satisfies the case; silence on the parent does not`, () => {
    const c = load(set, prefix);
    assert.deepEqual(failedIds(sayChecks(c, turn, pass)), []);
    assert.deepEqual(failedIds(sayChecks(c, turn, "Ease both keys of a pair and say done.")).sort(), ["names_the_parent", "own_keys_wont_change_it"]);
  });
}

const HAND_BACK = [["easing", "39", "I've noted that for next time. That was step 1; next is Play it back and watch how Title lands."], ["easing", "42", "That was step 1; next is step 2: play it back and watch how Title lands."],
  ["key-types", "40", "That was step 1; next is Play it back and watch Blink snap on and off."], ["speed-graph", "40", "That was step 1; next is to play it back and watch how Subtitle lands."], ["offset", "47", "That was step 1; next is Play it back and watch the Dots land one after another."]];
test("each hand-back case accepts the Pass line (and the panel's 'step 2:' wording) and rejects a line with something after it", () => {
  for (const [set, prefix, line] of HAND_BACK) {
    const c = load(set, prefix);
    const turn = c.expect.say_ends_with[0].turn;
    const run = (text) => phase3Checks({ say_ends_with: c.expect.say_ends_with }, Array.from({ length: turn }, (_, i) => ({ events: i === turn - 1 ? [say(text)] : [] })), []);
    assert.equal(run(line)[0].pass, true, `${set} ${prefix}: ${line}`);
    assert.equal(run(line + " Want a quick review of Easing?")[0].pass, false, `${set} ${prefix}: trailing offer`);
    assert.equal(run("That was step 2; next is Play it back.")[0].pass, false, `${set} ${prefix}: wrong step`);
  }
});

test("the K5 cases catch a change word beside the unattributed layer, in either order, and skip a clean record", () => {
  const sets = [["easing", "43", "Subtitle"], ["key-types", "45", "Cut"], ["speed-graph", "44", "Title"], ["offset", "51", "Badge"], ["anchor", "64", "Needle"], ["null-parenting", "59", "Row A"]];
  for (const [set, prefix, layer] of sets) {
    const c = load(set, prefix);
    const rec = (summary) => [{ events: [{ kind: "tool", name: "record_lesson", input: { summary, attempted: "x", next: "y" }, ok: true }] }];
    const run = (summary) => phase3Checks({ record_text_never: c.expect.record_text_never }, rec(summary), []);
    assert.equal(run(`Moved ${layer} by mistake; undid that, then finished`)[0].pass, false, `${set}: change after the name`);
    assert.equal(run(`Undid a change to ${layer} and finished`)[0].pass, false, `${set}: change before the name`);
    assert.equal(run("Finished every pair by the first check")[0].pass, true, `${set}: clean`);
    const said = c.expect.say_never_when_called.map((w) => new RegExp(w.pattern, "i"));
    assert.ok(said.every((re) => re.test("I had to rewrite that and try again.") && !re.test("Good work. Want to try the next layer?")), `${set}: refusal words`);
  }
});

test("the ask cases' attribution, verdict and offer regexes catch their slips and pass the Pass lines", () => {
  const c21 = load("ask", "21");
  const never = Object.fromEntries(c21.expect.text.map((s) => [s.id, new RegExp(s.never, "i")]));
  assert.ok(never.never_you_moved.test("You moved Shake Control's pivot."));
  assert.ok(never.never_you_moved.test("you've changed the pivot"));
  assert.ok(!never.never_you_moved.test("You haven't moved it, as far as I can read."), "a negation passes");
  assert.ok(!never.never_you_moved.test("If you moved the pivot, I can't read it."), "a conditional passes");
  assert.ok(!never.never_you_moved.test("Shake Control looks different from my last read; that may be its expression moving it."));
  assert.ok(never.no_verdict.test("Nice, that passed.") && never.no_verdict.test("You did it!"));
  assert.ok(!never.no_verdict.test("I didn't read where its pivot is, so I can't tell you whether step 3 landed."));
  const c23 = load("ask", "23");
  const offer = new RegExp(c23.expect.text.find((s) => s.id === "no_offer_after").never, "i");
  assert.ok(offer.test("Want to go deeper on step 1 with Easing?") && offer.test("I can walk you through it") && offer.test("Happy to show you."));
  assert.ok(!offer.test("The four Position keys; select them all, then F9. Step 1 again: Select Title's Position keys and press F9."));
  const c28 = load("ask", "28");
  const mark = new RegExp(c28.expect.text.find((s) => s.id === "never_says_the_mark").never, "i");
  assert.ok(mark.test("You've already learned this.") && mark.test("Remember when you did Door?") && mark.test("As we covered last time"));
  assert.ok(!mark.test("This is the same pivot move you did on Door, just on the null."), "a crediting bridge is allowed");
});
