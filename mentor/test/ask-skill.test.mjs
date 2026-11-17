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

test("the stale 'too small to see' wording (before H-7) is never an example", () => {
  assert.doesNotMatch(SKILL, /0\.75° at most, too small to see/);
  assert.doesNotMatch(SKILL, /about 9 px/, "§ 16's 9 px is an estimate, not a read");
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
