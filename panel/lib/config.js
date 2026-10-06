// Panel config (data-model › Panel config, research R3). install.sh writes panel.json with the
// claude, node and repo paths, because AE's child processes don't get the shell's PATH.
"use strict";

const nodeFs = require("fs");
const os = require("os");
const path = require("path");

const FIX = "Run `bash panel/install.sh` from the repo, then reopen the panel.";

function defaultHome(env) {
  return (env || process.env).AE_MENTOR_HOME || path.join(os.homedir(), "Library", "Application Support", "AEMentor");
}

function isExecutable(fs, p) {
  try {
    fs.accessSync(p, fs.constants.X_OK);
    return fs.statSync(p).isFile();
  } catch (e) {
    return false;
  }
}

// → { ok: true, claude_path, node_path, repo_path } or { ok: false, fix }
function loadConfig(opts) {
  const fs = (opts && opts.fs) || nodeFs;
  const home = (opts && opts.home) || defaultHome();
  const file = path.join(home, "panel.json");
  let cfg;
  try {
    cfg = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    return { ok: false, fix: `The panel isn't set up yet. ${FIX}` };
  }
  if (!cfg || cfg.version !== 1) return { ok: false, fix: `The panel's settings are from a different version. ${FIX}` };
  if (typeof cfg.claude_path !== "string" || !isExecutable(fs, cfg.claude_path)) {
    return { ok: false, fix: `The panel can't find Claude Code. Check that \`claude\` works in Terminal, then ${FIX.charAt(0).toLowerCase()}${FIX.slice(1)}` };
  }
  if (typeof cfg.node_path !== "string" || !isExecutable(fs, cfg.node_path)) {
    return { ok: false, fix: `The panel can't find Node.js. Check that \`node\` works in Terminal, then ${FIX.charAt(0).toLowerCase()}${FIX.slice(1)}` };
  }
  if (typeof cfg.repo_path !== "string" || !fs.existsSync(path.join(cfg.repo_path, ".mcp.json"))) {
    return { ok: false, fix: `The panel can't find the mentor's project folder. ${FIX}` };
  }
  return { ok: true, claude_path: cfg.claude_path, node_path: cfg.node_path, repo_path: cfg.repo_path };
}

// PATH for the Claude Code child process: the claude and node folders first, so .mcp.json's
// "command": "node" resolves inside AE (contracts/mentor-adapter.md › Launch arguments).
function childPath(cfg) {
  return [path.dirname(cfg.claude_path), path.dirname(cfg.node_path), "/usr/bin:/bin:/usr/sbin:/sbin"].join(":");
}

module.exports = { loadConfig, childPath, defaultHome };
