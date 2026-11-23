// Guard: the runner's ask-turn allow list (run.mjs ASK_ALLOWED) must hold every tool ask-mentor's SKILL.md allows,
// except the hand-over pair (go_deeper, Skill), which checks.mjs allows only from a yes turn on.
// Found 2026-11-23: phase 3 added note_said to the skill, the list stayed at phase 1's three, and cases 26 and 30
// failed only_ask_tools on their first live run.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "../../../..");
const HAND_OVER = new Set(["go_deeper", "Skill"]);

test("ASK_ALLOWED holds every non-hand-over tool in ask-mentor's allowed-tools", () => {
  const skill = fs.readFileSync(path.join(REPO, ".claude/skills/ask-mentor/SKILL.md"), "utf8");
  const line = skill.match(/^allowed-tools:\s*(.+)$/m);
  assert.ok(line, "SKILL.md has an allowed-tools line");
  const skillTools = line[1].split(",").map((s) => s.trim().replace(/^mcp__ae-mentor__/, "")).filter((t) => !HAND_OVER.has(t));

  const runner = fs.readFileSync(path.join(HERE, "../run.mjs"), "utf8");
  const list = runner.match(/const ASK_ALLOWED = \[([^\]]*)\]/);
  assert.ok(list, "run.mjs defines ASK_ALLOWED");
  const allowed = [...list[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);

  assert.deepEqual(skillTools.filter((t) => !allowed.includes(t)), [], "tools the skill allows but the runner fails");
});
