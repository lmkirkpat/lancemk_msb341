#!/usr/bin/env bash
# Removes the AE Mentor panel on macOS: the CEP symlink and panel.json. Leaves the learner record,
# the bridge, PlayerDebugMode, and every other AEMentor file alone.
LINK="$HOME/Library/Application Support/Adobe/CEP/extensions/AEMentorPanel"
if [ -L "$LINK" ]; then rm "$LINK"; echo "Removed the AEMentorPanel symlink"; elif [ -e "$LINK" ]; then echo "Left AEMentorPanel alone: not a symlink."; fi
CFG="${AE_MENTOR_HOME:-$HOME/Library/Application Support/AEMentor}/panel.json"
[ -f "$CFG" ] && rm "$CFG" && echo "Removed panel.json"
echo "Restart After Effects to unload the panel."
