// Where an install puts things (specs/006-installer contracts/install-layout.md). Everything is
// under the person's own home folder (FR-013); `home` is injectable so tests use a temp folder.

import os from "node:os";
import path from "node:path";

export const EXTENSIONS = Object.freeze(["AEMentorBridge", "AEMentorPanel"]);
export const MIN_AE = Object.freeze([26, 4]);
export const MIN_MACOS = Object.freeze([26, 0]);

export function layout(home = os.homedir()) {
  const support = path.join(home, "Library", "Application Support");
  const knack = path.join(support, "Knack");
  const learner = path.join(support, "AEMentor");
  return Object.freeze({
    home,
    support,
    cep: path.join(support, "Adobe", "CEP", "extensions"),
    learner,
    panelJson: path.join(learner, "panel.json"),
    stamp: path.join(learner, "panel-loaded.json"),
    learnerFile: path.join(learner, "learner.json"),
    bridgeConfig: path.join(support, "AEMentorBridge", "bridge.json"),
    bridgeLog: path.join(support, "AEMentorBridge", "host.log"),
    knack,
    versions: path.join(knack, "versions"),
    current: path.join(knack, "current"),
    tmp: path.join(knack, "tmp"),
    state: path.join(knack, "install-state.json"),
    lastCheck: path.join(knack, "last-check.json"),
  });
}

// An absolute path inside the home folder, written with ~ so no user name appears.
export function tilde(L, p) {
  const rel = path.relative(L.home, p);
  return rel.startsWith("..") || path.isAbsolute(rel) ? null : `~/${rel.split(path.sep).join("/")}`;
}
