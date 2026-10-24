// One read of the active comp, shared by every skill's snapshot and check tools (spec 004 R12;
// moved from tools/easing.mjs). The snapshot includes `host` (R0) from snapshot.jsx.

import { runSnippet } from "../bridge-client.mjs";

// sample_times (spec 004 wave B, research R17): extra times for read R3's samples, such as a time a
// skill stored earlier. With none, the snippet gets {} as before. Fixture mode ignores them (a saved
// capture can't be sampled again), so a time it lacks gives comp-space's not_sampled.
export async function takeSnapshot({ sample_times } = {}) {
  const raw = await runSnippet("snapshot", sample_times ? { sample_times } : {});
  return { taken_at: new Date().toISOString(), ...raw };
}
