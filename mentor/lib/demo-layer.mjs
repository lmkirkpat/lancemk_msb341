// Overlap audit 2026-10-29, T467 (spec 004 tasks-wave-b): which layer a demo writes to. Pair ids and
// demo targets carry the lesson's starting layer index, and a null added or a layer duplicated since
// then renumbers the layers below it. A demo reads the comp first and sends the layer's index now,
// with its name, so the snippet can refuse if the layer at that index has changed since the read.
// Pure: the tool does the read.

import { MentorError, registerErrors } from "../errors.mjs";
import { layerNow } from "./renumber.mjs";

registerErrors({
  DEMO_LAYER_UNCLEAR:
    "More than one layer has that name now, so I can't tell which one to show it on. Rename the copy, or undo it, then ask again.",
  DEMO_LAYER_MOVED: "The layers moved while I was looking, so I didn't change anything. Ask for the demonstration again.",
});

// → { layer_index, layer_name } for the baseline's layer `index` in `current`, or throws a MentorError
// the learner can read: NO_ACTIVE_COMP (another comp is active), DEMO_LAYER_UNCLEAR (a same-name
// layer can't be told apart), UNKNOWN_LAYER (the layer is gone).
export function demoLayer(lesson, current, index) {
  if (!current || !current.comp || current.comp.id !== lesson.comp_id) {
    throw new MentorError("NO_ACTIVE_COMP", `The active comp isn't ${lesson.baseline.comp.name}. Switch back to it, then ask for the demonstration again.`);
  }
  const now = layerNow(lesson.baseline, current, index);
  if (now.reason === "not_unique") throw new MentorError("DEMO_LAYER_UNCLEAR");
  if (now.reason) {
    throw new MentorError("UNKNOWN_LAYER", "That layer isn't in the comp now, so I can't show it there. Check the layer is still there, then ask again.");
  }
  return { layer_index: now.index, layer_name: now.name };
}
