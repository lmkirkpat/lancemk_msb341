#!/usr/bin/env bash
# Installs the Knack panel on macOS (specs/003-mentor-panel). Non-interactive, safe to re-run.
#   bash panel/install.sh
# 1. symlinks panel/ into ~/Library/Application Support/Adobe/CEP/extensions/AEMentorPanel
# 2. lets After Effects load unsigned CEP extensions (PlayerDebugMode, current user only)
# 3. writes panel.json with the claude, node and repo paths (research R3): apps opened from the
#    Dock don't get the shell's PATH, so the panel can't find either program on its own. A
#    runtime already chosen in panel.json ("b1" or "a", spec 013 FR-037) is kept. On runtime "a"
#    Claude Code isn't needed (spec 013 FR-038): it isn't checked, and an existing claude_path is
#    kept but none is added.
# 4. installs the option A helper's one dependency (panel/helper, decisions/010) with npm ci,
#    using the npm that comes with that node.
# Needs the bridge too (bash bridge/install.sh). Undo with panel/uninstall.sh.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$ROOT/.." && pwd)"
tilde() { printf '%s' "${1/#$HOME/~}"; }

NODE="$(command -v node || true)"
[ -n "$NODE" ] || { echo "Node.js isn't installed. Install Node 18+ from https://nodejs.org and re-run." >&2; exit 1; }
HOME_DIR="${AE_MENTOR_HOME:-$HOME/Library/Application Support/AEMentor}"
CFG="$HOME_DIR/panel.json"
# The runtime already chosen in panel.json, if any ("a" or "b1"; anything else counts as none).
RUNTIME="$("$NODE" -e 'try { const r = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).runtime; if (r === "a" || r === "b1") process.stdout.write(r); } catch (e) {}' "$CFG")"
CLAUDE="$(command -v claude || true)"
if [ "$RUNTIME" != "a" ]; then
  [ -n "$CLAUDE" ] || { echo "Claude Code isn't installed (no 'claude' on PATH). Install it, sign in with 'claude', and re-run." >&2; exit 1; }
fi
[ -f "$REPO/.mcp.json" ] || { echo "No .mcp.json in $(tilde "$REPO"). Run this from the repo's panel/ folder." >&2; exit 1; }
if [ "$RUNTIME" = "a" ]; then
  echo "OK   claude: not needed (runtime A)"
else
  echo "OK   claude: $(tilde "$CLAUDE")"
fi
echo "OK   node:   $(tilde "$NODE") ($("$NODE" -v))"

EXT_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions"
LINK="$EXT_DIR/AEMentorPanel"
mkdir -p "$EXT_DIR"
if [ -L "$LINK" ] || [ ! -e "$LINK" ]; then
  ln -sfn "$ROOT" "$LINK"; echo "OK   CEP extension linked: $(tilde "$LINK") -> $(tilde "$ROOT")"
else
  echo "$(tilde "$LINK") exists and is not a symlink. Move it aside and re-run." >&2; exit 1
fi

for v in 9 10 11 12 13 14; do defaults write "com.adobe.CSXS.$v" PlayerDebugMode 1; done
echo "OK   PlayerDebugMode=1 for CSXS.9 to CSXS.14"

mkdir -p "$HOME_DIR"
"$NODE" -e 'const fs = require("fs"); const [f, c, n, r, runtime] = process.argv.slice(1);
  let old = {}; try { old = JSON.parse(fs.readFileSync(f, "utf8")) || {}; } catch (e) {}
  const cfg = { version: 1 };
  if (runtime !== "a") cfg.claude_path = c;
  else if (typeof old.claude_path === "string" && old.claude_path) cfg.claude_path = old.claude_path;
  cfg.node_path = n;
  cfg.repo_path = r;
  if (runtime) cfg.runtime = runtime;
  fs.writeFileSync(f, JSON.stringify(cfg, null, 2) + "\n", { mode: 0o600 });' \
  "$CFG" "$CLAUDE" "$NODE" "$REPO" "$RUNTIME"
chmod 600 "$CFG"
echo "OK   wrote $(tilde "$CFG")"

NODE_DIR="$(dirname "$NODE")"
NPM="$NODE_DIR/npm"
[ -x "$NPM" ] || { echo "No npm next to $(tilde "$NODE"). Reinstall Node.js 18+ from https://nodejs.org and re-run." >&2; exit 1; }
(cd "$ROOT/helper" && PATH="$NODE_DIR:/usr/bin:/bin:/usr/sbin:/sbin" "$NPM" ci --no-audit --no-fund --loglevel=error >/dev/null) \
  || { echo "Couldn't install the helper's packages in $(tilde "$ROOT/helper") (npm ci failed; see above)." >&2; exit 1; }
echo "OK   helper packages installed: $(tilde "$ROOT/helper/node_modules")"

echo
echo "NEXT: restart After Effects, then open Window > Extensions > Knack."
