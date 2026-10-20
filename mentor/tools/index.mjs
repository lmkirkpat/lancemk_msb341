// The mentor's whole tool set. There is no tool that runs arbitrary ExtendScript (FR-013).
//
// Each skill keeps its tools in its own file here, exporting TOOLS and SKILLS (its learner-record
// skill IDs). This file finds them, so adding a skill means adding one file and editing none:
// parallel builders never conflict on a shared list. common.mjs holds the tools every skill shares.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { commonTools } from "./common.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const NOT_SKILLS = new Set(["index.mjs", "common.mjs"]);

const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".mjs") && !NOT_SKILLS.has(f)).sort();
const modules = await Promise.all(files.map((f) => import(`./${f}`)));

export const SKILLS = modules.flatMap((m) => m.SKILLS || []);
export const TOOLS = [...modules.flatMap((m) => m.TOOLS || []), ...commonTools(SKILLS)];

// Two skills naming a tool or skill ID the same would silently shadow one; refuse to start instead.
for (const [kind, names] of [["tool", TOOLS.map((t) => t.name)], ["skill ID", SKILLS]]) {
  const dup = names.find((n, i) => names.indexOf(n) !== i);
  if (dup) throw new Error(`Two files in mentor/tools/ declare the ${kind} "${dup}".`);
}
