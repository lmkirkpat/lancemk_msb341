// The mentor's whole tool set. There is no tool that runs arbitrary ExtendScript (FR-013).
//
// Each skill keeps its tools in its own file here, exporting TOOLS, SKILLS (its learner-record
// skill IDs) and FINDERS (does a comp have something to teach each skill on; spec 004
// contracts/skill-module.md › 2). This file finds them, so adding a skill means adding one file and
// editing none: parallel builders never conflict on a shared list. common.mjs holds the tools every
// skill shares.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { commonTools } from "./common.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const NOT_SKILLS = new Set(["index.mjs", "common.mjs"]);

// Loads every skill file in `dirs` and checks they fit together. Exported so tests can add a sample
// skill's folder (mentor/test/skill-module.test.mjs).
export async function discover(dirs) {
  const files = dirs.flatMap((dir) =>
    fs.readdirSync(dir).filter((f) => f.endsWith(".mjs") && !NOT_SKILLS.has(f)).sort().map((f) => path.join(dir, f)));
  const modules = await Promise.all(files.map((f) => import(pathToFileURL(f).href)));

  const skills = modules.flatMap((m) => m.SKILLS || []);
  const finders = {};
  modules.forEach((m, i) => {
    for (const [id, finder] of Object.entries(m.FINDERS || {})) {
      if (!(m.SKILLS || []).includes(id)) {
        throw new Error(`${path.basename(files[i])} has a finder for "${id}", which isn't one of its SKILLS.`);
      }
      finders[id] = finder;
    }
  });
  const tools = [...modules.flatMap((m) => m.TOOLS || []), ...commonTools({ skills, finders })];

  // Two skills naming a tool or skill ID the same would silently shadow one; refuse to start instead.
  for (const [kind, names] of [["tool", tools.map((t) => t.name)], ["skill ID", skills]]) {
    const dup = names.find((n, i) => names.indexOf(n) !== i);
    if (dup) throw new Error(`Two files in mentor/tools/ declare the ${kind} "${dup}".`);
  }
  return { SKILLS: skills, TOOLS: tools, FINDERS: finders };
}

// AE_MENTOR_TOOLS_DIR points tests at another folder (test-only, like AE_MENTOR_FIXTURE_TWINS).
export const { SKILLS, TOOLS, FINDERS } = await discover([process.env.AE_MENTOR_TOOLS_DIR || DIR]);
