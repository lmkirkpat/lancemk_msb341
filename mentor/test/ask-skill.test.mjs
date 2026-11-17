// Spec 014 T014 (FR-057, research R16): the ask-mentor skill file. Its allowed tools are exactly the three
// read-only ones and exist on the server; it names no slash command; it stays under about 2,500 words; and
// every example line it quotes is copied whole from the teaching design's § 16 or § 19 (the model copies
// example sentences word for word). Reads the files only.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tempHome } from "./helpers.mjs";

tempHome();
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SKILL = fs.readFileSync(path.join(REPO, ".claude", "skills", "ask-mentor", "SKILL.md"), "utf8");
const TD = fs.readFileSync(path.join(REPO, "specs", "014-ask-mentor", "teaching-design.md"), "utf8");
const { TOOLS } = await import("../tools/index.mjs");

const front = /^---\n([\s\S]*?)\n---\n/.exec(SKILL)[1];
const field = (name) => (new RegExp(`^${name}: (.*)$`, "m").exec(front) || [])[1];
const section = (heading) => {
  const start = TD.indexOf(`\n## ${heading}`);
  assert.ok(start >= 0, heading);
  const rest = TD.slice(start + 1);
  const end = rest.indexOf("\n## ", 3);
  return end < 0 ? rest : rest.slice(0, end);
};
const squash = (t) => t.replace(/\s+/g, " ").trim();
const SOURCES = squash(section("16.") + section("19."));

test("FR-057: named ask-mentor; allowed tools are describe_layers, preview_frame and give_answer, all on the server", () => {
  assert.equal(field("name"), "ask-mentor");
  const tools = field("allowed-tools").split(",").map((t) => t.trim());
  assert.deepEqual(tools, ["mcp__ae-mentor__describe_layers", "mcp__ae-mentor__preview_frame", "mcp__ae-mentor__give_answer"]);
  for (const t of tools) assert.ok(TOOLS.find((x) => x.name === t.replace("mcp__ae-mentor__", "")), t);
});

test("no slash command anywhere in the file", () => {
  assert.doesNotMatch(SKILL, /(^|\s)\/[a-z][\w-]*/m);
});

test("research R16: under about 2,500 words", () => {
  const words = SKILL.split(/\s+/).filter(Boolean).length;
  assert.ok(words <= 2500, `${words} words`);
});

test("every quoted example line in the worked answer is copied whole from TD § 16 or § 19", () => {
  const worked = SKILL.slice(SKILL.indexOf("### The worked answer"), SKILL.indexOf("## After the answer"));
  const quoted = [
    ...[...worked.matchAll(/^\s*> (.+)$/gm)].map((m) => m[1]),
    ...[...worked.matchAll(/"([^"]{12,})"/g)].map((m) => m[1]),
  ];
  assert.ok(quoted.length >= 7, `found ${quoted.length}`);
  for (const line of quoted) assert.ok(SOURCES.includes(squash(line)), line);
});

test("the stale 'too small to see' wording (before H-7) is never an example; § 16's rotation bullet is", () => {
  assert.doesNotMatch(SKILL, /0\.75° at most, too small to see/);
  // § 16's 9 px is a read since 2026-11-16 (015 T064: 9.36 px on rock.png), placed after the hit sizes.
  const hits = SKILL.indexOf("> - All three hits are the same size.");
  const turn = SKILL.indexOf("> - Rotation moves the rock about 9 px at most, gone in about 1/3 s.");
  assert.ok(hits > 0 && turn > hits, "the rotation bullet follows the Position bullet");
});

test("Sizes (015 FR-004a, TD § 5.1a): the 1 px floor on the read's pixel shifts, its one quoted line copied from § 5.1a", () => {
  const sizes = SKILL.slice(SKILL.indexOf("**Sizes.**"), SKILL.indexOf("### Skills"));
  assert.match(sizes, /Under 1 px at its peak/);
  assert.match(sizes, /in its own units/, "falls back to the read's own units with no pixel number");
  const quoted = [...sizes.matchAll(/"([^"]{12,})"/g)].map((m) => m[1]);
  assert.ok(quoted.length >= 1);
  for (const line of quoted) assert.ok(squash(section("5.")).includes(squash(line)), line);
  assert.doesNotMatch(sizes, /hard to tell apart/, "the deferred band isn't used");
});

test("every quoted phrase anywhere in the file is copied from the teaching design (015 FR-004b's keys, holds and locks included)", () => {
  const body = SKILL.slice(SKILL.indexOf("\n---\n", 4));
  const quoted = [...body.matchAll(/"([^"\n]{12,})"/g)].map((m) => m[1]);
  const td = squash(TD).toLowerCase();
  for (const q of quoted) assert.ok(td.includes(squash(q).toLowerCase()), q);
  for (const want of ["set, not animated", "unlock rock.png first"]) assert.ok(quoted.includes(want), want);
  assert.match(SKILL, /biggest first; then the sources with no pixel\s+number, in the order the read lists them/, "014 OQ-6's order");
  assert.match(SKILL, /you can't tell, so never call\s+it off/, "a switch not read is never off");
});

test("T103 (amendment (e)): the context-after-a-lesson rule, word for word, and none of the wrapper's labels", () => {
  const tasks = fs.readFileSync(path.join(REPO, "specs", "014-ask-mentor", "tasks.md"), "utf8");
  const rule = /Add one line to `\.claude\/skills\/ask-mentor\/SKILL\.md`: "([^"]+)"/.exec(tasks)[1];
  assert.ok(squash(SKILL).includes(squash(rule)), rule);
  for (const label of ["as shown in the panel", "Question:", "Answer:", "Closing:", "Follow-up:", "(layer:"]) assert.ok(!SKILL.includes(label), label);
  assert.match(SKILL, /never mention it, quote it,\s+or repeat its labels/);
});

test("eval fix (a): the turn-over rule closes the answer section, after the worked answer", () => {
  const answer = SKILL.slice(SKILL.indexOf("## The answer"), SKILL.indexOf("## After the answer"));
  const rule = answer.indexOf("Once `give_answer` is accepted your turn is over:");
  assert.ok(rule > answer.indexOf("### The worked answer"), "near the end of the answer section");
  assert.match(squash(answer.slice(rule)), /end it without writing anything, not even a sentence saying the answer is shown\./);
});

test("eval fixes (c) and (d): the outside and how-to lines", () => {
  assert.match(squash(SKILL), /An outside part names no tool, menu, preset or setting, only that it's outside and what you do cover\./);
});

test("eval fix (d): the how-to line", () => {
  assert.match(SKILL, /A how-to's explanation is at most two sentences, no bullets\./);
});

test("eval fix (e), moved into the tool by T037 fix (h): a name the read returns candidates for, shared or partial, gets a question naming them", () => {
  assert.match(squash(SKILL), /A name that comes back with candidates \(two layers share it, or it's part of several names\) is a clarifying question \(below\) naming them\./);
  assert.match(squash(SKILL), /both clarify conditions hold \(a name the read gives candidates for,/);
  assert.doesNotMatch(SKILL, /When a name matches part of two layers' names/, "the tool decides a partial match now");
});

test("eval fix (f): steps look at an expression that sets a property by itself, never at its keys", () => {
  assert.match(squash(SKILL), /When an expression sets a property by itself over keys, the steps look at the expression, never at the keys\./);
});

test("eval fix (g): one skill when the question sits inside one, and a firmer word limit", () => {
  assert.match(squash(SKILL), /Offer one skill when the question sits inside one\./);
  assert.match(squash(SKILL), /At most about 120 words in all, steps included\.\*\* Count before you call/);
});

test("T037 fix (i): own keys say whether they're eased, and an already-eased landing goes to the speed graph", () => {
  assert.match(squash(SKILL), /each keyed property with its key count, key types and whether it's eased;/);
  assert.match(squash(SKILL), /Keys already eased: a softer landing is \*Speed graph\*, never Easy Ease again\./);
});

test("T037 fix (j): a follow-up after a lesson is as short as any follow-up", () => {
  const after = squash(SKILL.slice(SKILL.indexOf("- **After a lesson:**"), SKILL.indexOf("- **\"Do it for me\"")));
  assert.match(after, /Then reply as a follow-up \(above\): one or two sentences, then the step again in one\.$/);
});

test("T037 fix (k): a pivot and a spot the learner names are never read, so they're marked; the worked answer no longer states the turn's center", () => {
  const honest = squash(SKILL.slice(SKILL.indexOf("## Honest about what was read"), SKILL.indexOf("## The answer")));
  assert.match(honest, /A layer's pivot and any spot the learner names are never read: mark them \("looks like"\) or say so\./);
  assert.doesNotMatch(SKILL, /The turn centers on/, "case 01 copied this unmarked line word for word");
});

test("T037 fix (l): a link's render state is said of the layer holding the expression, never of the linked control null", () => {
  assert.match(squash(SKILL), /Each link says whether that layer \(the one with the expression\) renders now; a control null never does\./);
  assert.doesNotMatch(SKILL, /Say whether the layer it drives renders/);
});

test("T037 fix (m): after a clarifying reply, the first line names the layer chosen and the goal as read, as a pattern, not a sentence to copy", () => {
  assert.match(squash(SKILL), /After their reply, even a vague one, answer; the explanation's first line names the layer they chose and what you took their goal to mean \(\*In \[comp\], taking \[their word\] as \[a change\] on \[layer\], …\*\)\./);
  assert.match(squash(SKILL), /A guess about what they want is stated once, as an assumption, in the first line\./);
});
