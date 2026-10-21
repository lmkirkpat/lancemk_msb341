// One read of the active comp, shared by every skill's snapshot and check tools (spec 004 R12;
// moved from tools/easing.mjs). The snapshot includes `host` (R0) from snapshot.jsx.

import { runSnippet } from "../bridge-client.mjs";

export async function takeSnapshot() {
  const raw = await runSnippet("snapshot", {});
  return { taken_at: new Date().toISOString(), ...raw };
}
