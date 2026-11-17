// One read of the active comp, shared by every skill's snapshot and check tools (spec 004 R12;
// moved from tools/easing.mjs). The snapshot includes `host` (R0) from snapshot.jsx.

import { runSnippet } from "../bridge-client.mjs";

// sample_times (spec 004 wave B, research R17): extra times for read R3's samples, such as a time a
// skill stored earlier. measure_layers (spec 015 research R9): layer indexes that get a fine sweep
// of their active transform expressions. With neither, the snippet gets {} as before. Fixture mode
// can't sample a saved capture again: a time it lacks gives comp-space's not_sampled, and a layer
// it wasn't captured with is listed in fine_not_read (mentor/fixture.mjs).
export async function takeSnapshot({ sample_times, measure_layers } = {}) {
  const args = {};
  if (sample_times) args.sample_times = sample_times;
  if (measure_layers && measure_layers.length) args.measure_layers = measure_layers;
  const raw = await runSnippet("snapshot", args);
  return { taken_at: new Date().toISOString(), ...raw };
}
