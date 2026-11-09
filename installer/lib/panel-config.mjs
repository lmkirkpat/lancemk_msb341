// panel.json in the learner home (data-model › Panel config): runtime A, the private Node and the
// install folder through `current`, so an update only swaps the link. No claude_path. Mode 0600.

import path from "node:path";

export function panelConfig(L) {
  return {
    version: 1,
    runtime: "a",
    node_path: path.join(L.current, "runtime", "node", "bin", "node"),
    repo_path: L.current,
  };
}

export function writePanelConfig(L, g) {
  g.writeAtomic(L.panelJson, JSON.stringify(panelConfig(L), null, 2) + "\n", 0o600);
}
