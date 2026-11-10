// Whether a module is the script Node was started with. Compares real paths: Node resolves links
// for import.meta.url but not for process.argv[1], so a plain compare fails when the script is run
// through a link, as the applet runs Knack/current/setup/setup-check.mjs (current is a link), and
// the script then exits silently (spec 006 T017 run 1, 2026-11-09).

import fs from "node:fs";
import { fileURLToPath } from "node:url";

export function isMain(metaUrl, argv1 = process.argv[1]) {
  if (!argv1) return false;
  try {
    return fs.realpathSync(argv1) === fs.realpathSync(fileURLToPath(metaUrl));
  } catch {
    return false;
  }
}
