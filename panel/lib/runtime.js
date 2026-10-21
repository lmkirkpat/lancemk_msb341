// The folder headless Claude Code runs the mentor in (agent audit 2026-10-12, lesson 4.5). Run
// from the repo, Claude Code loads the builder's CLAUDE.md and auto-memory into every lesson
// (sprint notes, the Adobe positioning), and --setting-sources can't turn those off. This folder
// has no repo above it, so it gets neither. It holds only links to the repo's mentor skills (every
// .claude/skills/*-mentor folder, spec 004 plan P3, so a new skill needs no change here) and an
// .mcp.json for the repo's ae-mentor server, with its paths made absolute. Nothing else from the
// repo's .claude/ (agents, hooks, settings, the builder's own skills) is linked. Rebuilt on every
// launch, so it always matches the repo: a skill removed from the repo is removed here too. The
// eval runner uses it too, so evals run what the panel runs (decisions/005).
"use strict";

const nodeFs = require("fs");
const path = require("path");

const SKILL_PATTERN = /^[a-z0-9][a-z0-9-]*-mentor$/;
const SERVER = "ae-mentor";

// → the names of the repo's mentor skill folders, sorted. A name that matches but isn't a folder
// (or a link to one) is skipped.
function mentorSkills(repoPath, fs) {
  fs = fs || nodeFs;
  const dir = path.join(repoPath, ".claude", "skills");
  let names = [];
  try {
    names = fs.readdirSync(dir);
  } catch (e) {
    return [];
  }
  return names
    .filter((n) => SKILL_PATTERN.test(n))
    .filter((n) => {
      try {
        return fs.statSync(path.join(dir, n)).isDirectory();
      } catch (e) {
        return false;
      }
    })
    .sort();
}

function linkTo(link, target, fs) {
  let current = null;
  try {
    current = fs.readlinkSync(link);
  } catch (e) {
    // Missing, or not a link.
  }
  if (current !== target) {
    fs.rmSync(link, { recursive: true, force: true });
    fs.symlinkSync(target, link);
  }
}

// → the folder's path. Throws with a plain message if the repo's .mcp.json has no ae-mentor server.
function ensureRuntime(repoPath, dir, fs) {
  fs = fs || nodeFs;
  const mcp = JSON.parse(fs.readFileSync(path.join(repoPath, ".mcp.json"), "utf8"));
  const server = mcp.mcpServers && mcp.mcpServers[SERVER];
  if (!server) throw new Error(`The repo's .mcp.json has no ${SERVER} server.`);
  const args = (server.args || []).map((a) => (a.endsWith(".mjs") || a.endsWith(".js") ? path.resolve(repoPath, a) : a));

  const skills = path.join(dir, ".claude", "skills");
  fs.mkdirSync(skills, { recursive: true });
  const wanted = mentorSkills(repoPath, fs);
  // Anything here that isn't a current mentor skill goes: a skill removed from the repo, or
  // anything else that got in. rmSync removes a link itself, never what it points to.
  for (const name of fs.readdirSync(skills)) {
    if (!wanted.includes(name)) fs.rmSync(path.join(skills, name), { recursive: true, force: true });
  }
  for (const name of wanted) linkTo(path.join(skills, name), path.join(repoPath, ".claude", "skills", name), fs);

  const out = { mcpServers: { [SERVER]: Object.assign({}, server, { args }) } };
  fs.writeFileSync(path.join(dir, ".mcp.json"), JSON.stringify(out, null, 2) + "\n");
  return dir;
}

module.exports = { ensureRuntime, mentorSkills };
