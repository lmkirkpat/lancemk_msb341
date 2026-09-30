#!/usr/bin/env bash
# Installs the AE Mentor Bridge panel on macOS. Non-interactive and safe to re-run.
#   bash bridge/install.sh
# 1. symlinks cep/ into ~/Library/Application Support/Adobe/CEP/extensions/AEMentorBridge
# 2. lets After Effects load unsigned CEP extensions (PlayerDebugMode, current user only)
# Unlike upstream, it does not register an MCP server: the repo's .mcp.json registers ae-mentor,
# and the upstream "after-effects" registration is left untouched (research R1).
# Undo with uninstall.sh. Check with: node bridge/scripts/doctor.mjs
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"

command -v node >/dev/null || { echo "Node.js is not installed. Install Node 18+ from https://nodejs.org and re-run." >&2; exit 1; }
MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$MAJOR" -ge 18 ] || { echo "Node $(node -v) is too old. Install Node 18+ and re-run." >&2; exit 1; }
echo "OK   Node $(node -v)"

EXT_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions"
LINK="$EXT_DIR/AEMentorBridge"
mkdir -p "$EXT_DIR"
if [ -L "$LINK" ]; then
  ln -sfn "$ROOT/cep" "$LINK"; echo "OK   CEP extension linked: $LINK -> $ROOT/cep"
elif [ -e "$LINK" ]; then
  echo "$LINK exists and is not a symlink. Move it aside and re-run." >&2; exit 1
else
  ln -s "$ROOT/cep" "$LINK"; echo "OK   CEP extension linked: $LINK -> $ROOT/cep"
fi

for v in 9 10 11 12 13 14; do defaults write "com.adobe.CSXS.$v" PlayerDebugMode 1; done
echo "OK   PlayerDebugMode=1 for CSXS.9 to CSXS.14"

echo
echo "NEXT STEPS (a person has to do these):"
echo "  1. Restart After Effects (quit fully, then open it). The bridge starts with AE."
echo "  2. In AE: After Effects > Settings > Scripting & Expressions > tick 'Allow Scripts to Write Files and Access Network'."
echo "  3. Start a new Claude Code session in the repo so it loads ae-mentor from .mcp.json."
echo "Then verify:  node bridge/scripts/doctor.mjs   (bridge checks pass once AE is open)"
