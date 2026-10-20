// Shared helpers for the agent team's hooks (decisions/008). Node built-ins only.
//
// Hooks tell agents apart by `agent_type` and `agent_id`, which Claude Code sends only for
// subagent calls. Subagents share the cockpit's `session_id`, so never key on that.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

// Fail closed: a hook that can't read its input blocks the call rather than allowing it.
export function readPayload() {
  let raw;
  try {
    raw = fs.readFileSync(0, "utf8");
  } catch {
    block("the hook couldn't read its input, so this call is blocked.");
  }
  try {
    const p = JSON.parse(raw);
    if (p && typeof p === "object") return p;
  } catch {}
  block("the hook couldn't parse its input, so this call is blocked.");
}

// Exit code 2 blocks the tool call and shows stderr to the agent.
export function block(msg) {
  process.stderr.write(`Blocked (decisions/008): ${msg}\n`);
  process.exit(2);
}

export function git(args, cwd) {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

// Lock state lives under the common git dir, so the main checkout and every worktree share it.
export function stateDir(cwd) {
  const common = git(["rev-parse", "--path-format=absolute", "--git-common-dir"], cwd);
  if (!common) return null;
  const dir = path.join(common, "knack-agents");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function inLinkedWorktree(cwd) {
  const gitDir = git(["rev-parse", "--path-format=absolute", "--git-dir"], cwd);
  const common = git(["rev-parse", "--path-format=absolute", "--git-common-dir"], cwd);
  return Boolean(gitDir && common && gitDir !== common);
}

// The repo a path belongs to, and the path relative to it with forward slashes.
// Works for files that don't exist yet by resolving the nearest existing folder.
export function repoRelative(absPath) {
  let dir = path.dirname(absPath);
  while (!fs.existsSync(dir)) {
    const up = path.dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
  const real = path.join(fs.realpathSync(dir), path.relative(dir, absPath));
  const root = git(["rev-parse", "--show-toplevel"], fs.realpathSync(dir));
  if (!root) return null;
  const rel = path.relative(root, real);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return { root, rel: rel.split(path.sep).join("/") };
}

export function isTempPath(absPath) {
  const temps = [os.tmpdir(), "/tmp", "/private/tmp", "/private/var/folders", "/var/folders"];
  return temps.some((t) => absPath === t || absPath.startsWith(t.endsWith("/") ? t : t + "/"));
}

// `*` matches within one folder, `**/` any number of folders, `**` anything.
export function globToRegExp(glob) {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        i++;
        if (glob[i + 1] === "/") {
          i++;
          re += "(?:.*/)?";
        } else re += ".*";
      } else re += "[^/]*";
    } else if (c === "?") re += "[^/]";
    else re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${re}$`);
}

// Patterns apply in order and the last match wins; `!` takes a path back out.
export function owns(patterns, rel) {
  let ok = false;
  for (const pat of patterns) {
    const neg = pat.startsWith("!");
    if (globToRegExp(neg ? pat.slice(1) : pat).test(rel)) ok = !neg;
  }
  return ok;
}

export function ownerOf(table, rel) {
  return Object.keys(table.agents).find((name) => owns(table.agents[name], rel)) || null;
}

export function loadOwnership(file) {
  const table = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!table || typeof table.agents !== "object") throw new Error("no agents table");
  return table;
}
