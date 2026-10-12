// The folder headless Claude Code runs the mentor in (agent audit 2026-10-12, lesson 4.5). Run
// from the repo, Claude Code loads the builder's CLAUDE.md and auto-memory into every lesson
// (sprint notes, the Adobe positioning), and --setting-sources can't turn those off. This folder
// has no repo above it, so it gets neither. It holds only a link to the repo's ease-mentor skill
// and an .mcp.json for the repo's ae-mentor server, with its paths made absolute. Rebuilt on every
// launch, so it always matches the repo. The eval runner uses it too, so evals run what the panel
// runs (decisions/005).
"use strict";

const nodeFs = require("fs");
const path = require("path");

const SKILL = "ease-mentor";
const SERVER = "ae-mentor";

// → the folder's path. Throws with a plain message if the repo's .mcp.json has no ae-mentor server.
function ensureRuntime(repoPath, dir, fs) {
  fs = fs || nodeFs;
  const mcp = JSON.parse(fs.readFileSync(path.join(repoPath, ".mcp.json"), "utf8"));
  const server = mcp.mcpServers && mcp.mcpServers[SERVER];
  if (!server) throw new Error(`The repo's .mcp.json has no ${SERVER} server.`);
  const args = (server.args || []).map((a) => (a.endsWith(".mjs") || a.endsWith(".js") ? path.resolve(repoPath, a) : a));

  const skills = path.join(dir, ".claude", "skills");
  fs.mkdirSync(skills, { recursive: true });
  const link = path.join(skills, SKILL);
  const target = path.join(repoPath, ".claude", "skills", SKILL);
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
  const out = { mcpServers: { [SERVER]: Object.assign({}, server, { args }) } };
  fs.writeFileSync(path.join(dir, ".mcp.json"), JSON.stringify(out, null, 2) + "\n");
  return dir;
}

module.exports = { ensureRuntime };
