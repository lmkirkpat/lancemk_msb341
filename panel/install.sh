#!/usr/bin/env bash
# Installs the AE Mentor panel on macOS (specs/003-mentor-panel). Non-interactive, safe to re-run.
#   bash panel/install.sh
# 1. symlinks panel/ into ~/Library/Application Support/Adobe/CEP/extensions/AEMentorPanel
# 2. lets After Effects load unsigned CEP extensions (PlayerDebugMode, current user only)
# 3. writes panel.json with the claude, node and repo paths (research R3): apps opened from the
#    Dock don't get the shell's PATH, so the panel can't find either program on its own.
# Needs the bridge too (bash bridge/install.sh). Undo with panel/uninstall.sh.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$ROOT/.." && pwd)"
tilde() { printf '%s' "${1/#$HOME/~}"; }

CLAUDE="$(command -v claude || true)"
[ -n "$CLAUDE" ] || { echo "Claude Code isn't installed (no 'claude' on PATH). Install it, sign in with 'claude', and re-run." >&2; exit 1; }
NODE="$(command -v node || true)"
[ -n "$NODE" ] || { echo "Node.js isn't installed. Install Node 18+ from https://nodejs.org and re-run." >&2; exit 1; }
[ -f "$REPO/.mcp.json" ] || { echo "No .mcp.json in $(tilde "$REPO"). Run this from the repo's panel/ folder." >&2; exit 1; }
echo "OK   claude: $(tilde "$CLAUDE")"
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

HOME_DIR="${AE_MENTOR_HOME:-$HOME/Library/Application Support/AEMentor}"
mkdir -p "$HOME_DIR"
CFG="$HOME_DIR/panel.json"
"$NODE" -e 'const [f, c, n, r] = process.argv.slice(1);
  require("fs").writeFileSync(f, JSON.stringify({ version: 1, claude_path: c, node_path: n, repo_path: r }, null, 2) + "\n", { mode: 0o600 });' \
  "$CFG" "$CLAUDE" "$NODE" "$REPO"
chmod 600 "$CFG"
echo "OK   wrote $(tilde "$CFG")"

echo
echo "NEXT: restart After Effects, then open Window > Extensions > AE Mentor."
