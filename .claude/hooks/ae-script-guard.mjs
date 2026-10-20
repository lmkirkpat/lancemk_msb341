#!/usr/bin/env node
// PreToolUse on ae_run_script: a subagent's ExtendScript reads and builds, nothing more (decisions/008).
// ExtendScript runs inside After Effects, outside the Bash tool, so the git guard and the sandbox
// never see it. These calls reach past the comp: the disk, the shell, the saved .aep, AE itself.
// Like the git guard, this matches text, so it catches the usual ways of writing them, not every way.
// The cockpit isn't restricted.

import { readPayload, block } from "./lib.mjs";

const RULES = [
  [/\bcallSystem\b/, "`system.callSystem` runs shell commands from inside AE, past every Bash guard."],
  [/\.save(?:WithDialog)?\s*\(/, "saving writes over the learner's .aep, and Edit > Undo can't take that back."],
  [/\.remove\s*\(/, "`.remove()` deletes a file, folder, layer or project item."],
  [/\.(?:rename|copy|execute)\s*\(/, "renaming, copying or running files on disk reaches outside the comp."],
  [/\.open\s*\(\s*["'][wae]/, "opening a file for writing reaches outside the comp."],
  [/\bapp\.(?:quit|newProject|open)\b/, "quitting AE or switching projects ends every agent's AE work."],
  [/CloseOptions\.SAVE_CHANGES/, "closing with save writes over the learner's .aep."],
];

const p = readPayload();
if (!p.agent_type) process.exit(0);

const script = p.tool_input && p.tool_input.script;
if (typeof script !== "string") block("this ae_run_script call has no script, so it's blocked.");
for (const [re, why] of RULES) {
  if (re.test(script)) {
    block(`${why} Subagents use ae_run_script to read and build in the comp only. ` +
      "If the work needs this, stop and say so in your hand-back; the cockpit decides.");
  }
}
process.exit(0);
