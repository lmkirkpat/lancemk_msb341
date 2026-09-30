#!/usr/bin/env bash
# Removes the AE Mentor Bridge on macOS: the CEP symlink and the token folder. Leaves
# PlayerDebugMode alone (other unsigned panels, such as the upstream bridge, rely on it), leaves
# every MCP registration alone (ae-mentor lives in the repo's .mcp.json), and leaves this folder
# in place.
LINK="$HOME/Library/Application Support/Adobe/CEP/extensions/AEMentorBridge"
if [ -L "$LINK" ]; then rm "$LINK"; echo "Removed symlink $LINK"; elif [ -e "$LINK" ]; then echo "Left $LINK alone: not a symlink."; fi
CFG="$HOME/Library/Application Support/AEMentorBridge"
[ -d "$CFG" ] && rm -rf "$CFG" && echo "Removed $CFG"
echo "Restart After Effects to unload the bridge."
