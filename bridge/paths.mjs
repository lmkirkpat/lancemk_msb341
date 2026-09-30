// Where the bridge keeps its token (bridge.json), its log and render job records.
// Must match cep/host.js, cep/host.html and cep/panel.js.
//   Windows: %APPDATA%\AEMentorBridge
//   macOS:   ~/Library/Application Support/AEMentorBridge

import os from "node:os";
import path from "node:path";

export const CONFIG_DIR =
  process.platform === "win32"
    ? path.join(process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"), "AEMentorBridge")
    : path.join(os.homedir(), "Library", "Application Support", "AEMentorBridge");
export const CONFIG_FILE = path.join(CONFIG_DIR, "bridge.json");
export const JOBS_DIR = path.join(CONFIG_DIR, "jobs");
