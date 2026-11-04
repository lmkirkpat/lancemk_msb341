#!/usr/bin/env node
// Is a skill ready for option A? (spec 013 T067, FR-043). Free: no service call, no credit, no key.
//   node product/evals/lib/ready-for-a.mjs <skill> [<skill> ...]     a skill folder name, e.g. offset-mentor
//   node product/evals/lib/ready-for-a.mjs --all                     every .claude/skills/*-mentor
// Checks, per skill:
//   name         the folder name is one A accepts (a `*-mentor` name) and the frontmatter `name` matches it;
//   listed       every tool in `allowed-tools` is one the server lists (or `Skill`, the runtime's hand-over);
//   body         every ae-mentor tool the SKILL.md body names is in `allowed-tools`. The tools are the
//                server's real list, so a plain word in prose is never taken for a tool. A name used only
//                to forbid it ("never `snapshot_project`") passes, with the line listed in the detail;
//   runner       the skill's eval runner passes `--runtime a --dry-run`. A skill with no eval set (no runner
//                calls ab.toolSets for it) is reported as "no runner", not as a failure.
// Exit 0 when nothing failed ("no runner" is not a failure), 1 otherwise. Node built-ins only.

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { SKILL_PATTERN, skillBodyOf } from "./allowlist-check.mjs";
import { probeServer } from "./server-probe.mjs";
import { allowedToolsOf, skillFile, MCP_PREFIX } from "./skill-tools.mjs";
import { KEY_VAR } from "./runtime-a.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPO = path.resolve(HERE, "..", "..", "..");

// The eval folder whose runner builds its tools from this skill, or null.
export function runnerFor(repo, skill) {
  const evals = path.join(repo, "product", "evals");
  if (!fs.existsSync(evals)) return null;
  for (const d of fs.readdirSync(evals).sort()) {
    const file = path.join(evals, d, "run.mjs");
    if (fs.existsSync(file) && fs.readFileSync(file, "utf8").includes(`ab.toolSets(REPO, "${skill}")`)) return d;
  }
  return null;
}

// Tools the body names → Map(name → [line numbers]). `names` is the server's real tool list.
// A line that names the tool only after "never" (optionally "never use|call") is a prohibition, not an
// instruction to call it; those lines are left out of `named` and returned in `forbidden`.
export function toolsNamedIn(body, names, forbidden = new Map()) {
  const found = new Map();
  const lines = body.split("\n");
  for (const name of names) {
    const re = new RegExp(`(?<![A-Za-z0-9_])(?:${MCP_PREFIX})?${name}(?![A-Za-z0-9_])`);
    const never = new RegExp(`\\bnever\\s+(?:(?:use|call)\\s+)?(?:the\\s+)?\`?(?:${MCP_PREFIX})?${name}(?![A-Za-z0-9_])`, "i");
    lines.forEach((l, i) => {
      if (!re.test(l)) return;
      const target = never.test(l) ? forbidden : found;
      target.set(name, [...(target.get(name) || []), i + 1]);
    });
  }
  return found;
}

// Runs a runner's `--runtime a --dry-run` with no key in its environment. → { ok, detail }
function dryRunOf(repo, dir) {
  const env = { ...process.env };
  delete env[KEY_VAR];
  const r = spawnSync(process.execPath, [path.join(repo, "product", "evals", dir, "run.mjs"), "--runtime", "a", "--dry-run"], { cwd: repo, env, encoding: "utf8", timeout: 120000 });
  const out = `${r.stdout || ""}${r.stderr || ""}`.trim().split("\n").filter(Boolean);
  if (r.status === 0) return { ok: true, detail: out.find((l) => /cases valid/.test(l)) || out.at(-1) || "ok" };
  return { ok: false, detail: `exit ${r.status ?? r.signal}: ${out.slice(-3).join(" | ")}` };
}

// → { skill, ok, checks: [{ check, status: "pass" | "fail" | "none", detail }] }
export async function readyForA({ repo = DEFAULT_REPO, skill, server, dryRun = dryRunOf } = {}) {
  const checks = [];
  const add = (check, status, detail) => checks.push({ check, status, detail });
  const file = skillFile(repo, skill);
  const text = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;

  const fm = text && /^---\n([\s\S]*?)\n---\n/.exec(text);
  const fmName = fm && (/^name\s*:\s*(.+)$/m.exec(fm[1]) || [])[1]?.trim();
  if (!SKILL_PATTERN.test(skill)) add("name", "fail", `${skill} is not a *-mentor name; A loads only those`);
  else if (text === null) add("name", "fail", `no SKILL.md at ${path.relative(repo, file)}`);
  else if (fmName !== skill) add("name", "fail", `the frontmatter name is ${fmName ?? "missing"}, not ${skill}`);
  else add("name", "pass", skill);
  if (text === null) return { skill, ok: false, checks };

  const allowed = allowedToolsOf(text);
  const body = skillBodyOf(text);
  const probed = server || (await probeServer(repo));
  const listed = new Set(probed.tools.map((t) => t.name));
  if (!allowed || !allowed.length) add("listed", "fail", "SKILL.md has no allowed-tools");
  else {
    const missing = allowed.filter((t) => t !== "Skill" && !listed.has(t));
    add("listed", missing.length ? "fail" : "pass", missing.length ? `allowed tools the server doesn't list: ${missing.join(", ")}` : `${allowed.length} allowed tools, all listed`);
  }

  if (body === null) add("body", "fail", "SKILL.md has no body after the frontmatter");
  else {
    const allowedSet = new Set(allowed || []);
    const forbidden = new Map();
    const named = toolsNamedIn(body, [...listed], forbidden);
    const only = [...forbidden].filter(([n]) => !allowedSet.has(n) && !named.has(n)).map(([n, ls]) => `${n} (line${ls.length === 1 ? "" : "s"} ${ls.join(", ")})`);
    const bad = [...named].filter(([n]) => !allowedSet.has(n)).map(([n, ls]) => `${n} (line${ls.length === 1 ? "" : "s"} ${ls.join(", ")} of the body)`);
    add("body", bad.length ? "fail" : "pass", bad.length ? `names tools it doesn't allow: ${bad.join("; ")}` : `${named.size} tools named, all allowed${only.length ? `; also names only to forbid: ${only.join("; ")}` : ""}`);
  }

  const dir = runnerFor(repo, skill);
  if (!dir) add("runner", "none", "no runner: no eval set calls ab.toolSets for this skill, so there is no --runtime a --dry-run to run");
  else {
    const r = dryRun(repo, dir);
    add("runner", r.ok ? "pass" : "fail", `product/evals/${dir}: ${r.detail}`);
  }
  return { skill, ok: checks.every((c) => c.status !== "fail"), checks };
}

export function render(result) {
  const mark = { pass: "pass", fail: "FAIL", none: "n/a " };
  return [`${result.ok ? "ready" : "NOT READY"}  ${result.skill}`, ...result.checks.map((c) => `  ${mark[c.status]}  ${c.check}: ${c.detail}`)].join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  let skills = args.filter((a) => !a.startsWith("--"));
  if (args.includes("--all")) {
    skills = fs.readdirSync(path.join(DEFAULT_REPO, ".claude", "skills")).filter((n) => n.endsWith("-mentor")).sort();
  }
  if (!skills.length) {
    console.error("usage: ready-for-a.mjs <skill> [<skill> ...] | --all");
    process.exit(2);
  }
  const server = await probeServer(DEFAULT_REPO);
  let bad = 0;
  for (const skill of skills) {
    const r = await readyForA({ skill, server });
    console.log(render(r));
    if (!r.ok) bad++;
  }
  process.exit(bad ? 1 : 0);
}
