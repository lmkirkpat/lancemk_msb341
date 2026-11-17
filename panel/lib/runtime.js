// The folder headless Claude Code runs the mentor in (agent audit 2026-10-12, lesson 4.5). Run
// from the repo, Claude Code loads the builder's CLAUDE.md and auto-memory into every lesson
// (sprint notes, the Adobe positioning), and --setting-sources can't turn those off. This folder
// has no repo above it, so it gets neither. It holds only links to the repo's mentor skills (every
// .claude/skills/*-mentor folder, spec 004 plan P3, so a new skill needs no change here) and an
// .mcp.json for the repo's ae-mentor server, with its paths made absolute. Nothing else from the
// repo's .claude/ (agents, hooks, settings, the builder's own skills) is linked. The folder's own
// .claude/settings.json holds one hook the panel writes itself (spec 014 T105, below). Rebuilt on every
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

// ---------- spec 014 T105: end the turn after an accepted answer (B1) ----------
// The ask mentor's turn is over once give_answer accepts its answer (FR-009, PQ-1), but in -p mode
// it kept writing prose after it in 6 of 6 runs, whatever SKILL.md or the reply said. A PostToolUse
// hook on give_answer returns {"continue": false}, which ends the turn there: exit 0, an empty
// result, the session saved and resumable (checked live 2026-11-17). A refusal comes back as an
// error ("CODE: message", not JSON), so the hook says nothing and the mentor tries again. No lesson
// skill has give_answer, so lessons never meet it.

const ANSWER_TOOL = `mcp__${SERVER}__give_answer`;
const HOOK_FILE = "end-turn-after-answer.js";

// The hook's whole decision. input: what Claude Code passes a PostToolUse hook ({ tool_name,
// tool_response, ... }); for an MCP tool tool_response is the result's content blocks,
// [{ type: "text", text }], and give_answer's accepted reply is one JSON object with its kind.
// → true only for that. Self-contained: it's written into the hook script as it stands.
function answerAccepted(input) {
  const KINDS = ["answer", "describe", "howto", "clarify", "outside", "no_comp"];
  if (!input || typeof input !== "object" || !/^mcp__ae-mentor__give_answer$/.test(String(input.tool_name))) return false;
  let r = input.tool_response;
  if (r && typeof r === "object" && !Array.isArray(r)) {
    if (r.isError === true || r.is_error === true) return false;
    r = r.content;
  }
  if (!Array.isArray(r)) return false;
  if (r.some((b) => b && (b.isError === true || b.is_error === true))) return false;
  const texts = r.filter((b) => b && b.type === "text" && typeof b.text === "string");
  if (texts.length !== 1) return false;
  let j;
  try { j = JSON.parse(texts[0].text); } catch (e) { return false; }
  return !!j && typeof j === "object" && !Array.isArray(j) && KINDS.includes(j.kind) && typeof j.explanation === "string";
}

// The script the hook runs: reads the hook input on stdin, prints {"continue": false} for an accepted
// answer, nothing otherwise. Always exits 0, so a hook problem never blocks a turn.
const HOOK_SCRIPT = `// Written by panel/lib/runtime.js (spec 014 T105). Rebuilt on every launch; don't edit.
"use strict";
${answerAccepted.toString()}
let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (d) => { raw += d; });
process.stdin.on("end", () => {
  let input = null;
  try { input = JSON.parse(raw); } catch (e) { input = null; }
  if (answerAccepted(input)) process.stdout.write(JSON.stringify({ continue: false }));
  process.exit(0);
});
`;

// → the folder's .claude/settings.json: only the one hook, matched to give_answer alone.
function runtimeSettings(scriptPath) {
  return { hooks: { PostToolUse: [{ matcher: `^${ANSWER_TOOL}$`, hooks: [{ type: "command", command: `node ${JSON.stringify(scriptPath)}` }] }] } };
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

  // B1 sets no runtime flag (spec 014 research R4): the server fails closed to B1, so an answer
  // offers no skill and nothing hands over. A flag in the repo's own .mcp.json doesn't come along.
  const entry = Object.assign({}, server, { args });
  if (entry.env && typeof entry.env === "object") {
    entry.env = Object.assign({}, entry.env);
    delete entry.env.AE_MENTOR_RUNTIME;
  }
  const out = { mcpServers: { [SERVER]: entry } };
  fs.writeFileSync(path.join(dir, ".mcp.json"), JSON.stringify(out, null, 2) + "\n");

  // T105: the hook that ends the turn after an accepted answer. B1's adapter (node on its PATH,
  // config.js) and the eval runner both run from here, so both get it.
  const hooks = path.join(dir, ".claude", "hooks");
  fs.mkdirSync(hooks, { recursive: true });
  for (const name of fs.readdirSync(hooks)) if (name !== HOOK_FILE) fs.rmSync(path.join(hooks, name), { recursive: true, force: true });
  const script = path.join(hooks, HOOK_FILE);
  fs.writeFileSync(script, HOOK_SCRIPT);
  fs.writeFileSync(path.join(dir, ".claude", "settings.json"), JSON.stringify(runtimeSettings(script), null, 2) + "\n");
  return dir;
}

module.exports = { ensureRuntime, mentorSkills, answerAccepted, runtimeSettings, HOOK_SCRIPT, HOOK_FILE, ANSWER_TOOL };
