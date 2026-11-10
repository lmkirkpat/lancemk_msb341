#!/usr/bin/env node
// Knack's setup check (specs/006-installer T013, contracts/setup-check.md). Run on the private Node
// from the installer's last screen (and later from the panel, T033):
//   setup-check.mjs [--json]
// Prints plain lines (or the JSON result), saves the result as Knack/last-check.json, and exits 0
// only if every line is working. Changes nothing else; finishes within 15 seconds.

import fs from "node:fs";
import { layout } from "./lib/layout.mjs";
import { isMain } from "./lib/main.mjs";
import { guard } from "./lib/fsx.mjs";
import { runChecks, formatText } from "./lib/checks.mjs";

// opts: { home, json, ...runChecks deps } → { out, code, result }
export async function setupCheck(opts = {}) {
  const L = layout(opts.home);
  const result = await runChecks({ ...opts, L });
  // Saved only where Knack is installed; a Mac without Knack gets no new folder.
  if (fs.existsSync(L.knack)) {
    try {
      guard(L.support).writeAtomic(L.lastCheck, JSON.stringify(result, null, 2) + "\n");
    } catch {}
  }
  return { out: opts.json ? JSON.stringify(result, null, 2) : formatText(result), code: result.all_working ? 0 : 1, result };
}

if (isMain(import.meta.url)) {
  const args = process.argv.slice(2);
  const r = await setupCheck({ json: args.includes("--json") });
  process.stdout.write(r.out + "\n");
  process.exitCode = r.code;
}
