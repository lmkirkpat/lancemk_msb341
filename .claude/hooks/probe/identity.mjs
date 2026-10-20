#!/usr/bin/env node
// decisions/008's identity test: do hooks still learn which subagent is calling? Run it before each
// sprint's first parallel run, and after a Claude Code update:
//   node .claude/hooks/probe/identity.mjs
// One short headless run (about $0.50). The repo's settings stay untouched: the logging hook comes
// in through --settings from a temp folder. Exit 0 if every check passes, 1 if not.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "identity-probe-"));
const log = path.join(dir, "log.jsonl");
const logger = path.join(dir, "log-hook.mjs");
const settings = path.join(dir, "settings.json");

fs.writeFileSync(
  logger,
  `import fs from "node:fs";
let p = {}; try { p = JSON.parse(fs.readFileSync(0, "utf8")); } catch {}
const { hook_event_name: event, tool_name: tool, agent_type, agent_id, session_id } = p;
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify({ event, tool, agent_type, agent_id, session_id }) + "\\n");
`
);
const hook = [{ type: "command", command: `node "${logger}"` }];
fs.writeFileSync(settings, JSON.stringify({ hooks: { PreToolUse: [{ matcher: ".*", hooks: hook }], SubagentStop: [{ hooks: hook }] } }));

const PROMPT =
  "Read the first 5 lines of CLAUDE.md yourself. Then use the Agent tool with subagent_type reviewer and ask it to " +
  "read the first 5 lines of CLAUDE.md and reply with its first heading only. Then reply DONE.";

const version = spawnSync("claude", ["--version"], { encoding: "utf8" }).stdout.trim();
console.log(`Claude Code ${version}. Running the probe (about a minute)...`);
const run = spawnSync(
  "claude",
  ["-p", PROMPT, "--settings", settings, "--allowedTools", "Read,Glob,Agent", "--output-format", "json"],
  { cwd: REPO, encoding: "utf8", timeout: 5 * 60 * 1000 }
);
if (run.status !== 0) {
  // A usage limit or login problem shows up in stdout's result, not stderr.
  const why = [run.stderr, run.error, (run.stdout.match(/"result":"([^"]*)"/g) || []).pop()].filter(Boolean).join(" ");
  console.error(`The headless run failed (exit ${run.status}), so nothing was tested: ${why.toString().trim() || "no message"}`);
  process.exit(1);
}
const cost = (run.stdout.match(/"total_cost_usd":([0-9.]+)/g) || []).pop()?.split(":")[1];

const lines = fs.existsSync(log) ? fs.readFileSync(log, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
const pre = lines.filter((l) => l.event === "PreToolUse");
const cockpit = pre.filter((l) => !l.agent_type && !l.agent_id);
const sub = pre.filter((l) => l.agent_type === "reviewer");
const stops = lines.filter((l) => l.event === "SubagentStop");
const subId = sub[0] && sub[0].agent_id;

const checks = [
  ["The cockpit's calls carry no agent identity", cockpit.length > 0 && pre.every((l) => l.agent_type || !l.agent_id)],
  ["The subagent's calls carry agent_type and agent_id", sub.length > 0 && sub.every((l) => l.agent_id)],
  ["SubagentStop carries the same agent_id (frees the AE lock)", !!subId && stops.some((l) => l.agent_id === subId)],
];
for (const [what, ok] of checks) console.log(`${ok ? "PASS" : "FAIL"}  ${what}`);
const sessions = new Set(lines.map((l) => l.session_id));
console.log(`note  ${sessions.size === 1 ? "All calls share one session_id, as 008 expects" : `${sessions.size} session_ids seen: re-read 008's session_id finding`}`);
console.log(`${lines.length} hook calls logged in ${log}${cost ? `; cost $${cost}` : ""}.`);

if (checks.some(([, ok]) => !ok)) {
  console.log("\nA FAIL means the hooks can't tell agents apart: stop parallel runs until it's fixed (decisions/008).");
  process.exit(1);
}
