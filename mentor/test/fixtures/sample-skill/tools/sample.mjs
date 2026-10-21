// A sample skill's tool file (contracts/skill-module.md › 2): SKILLS, FINDERS and TOOLS, with every
// tool name starting with the skill's prefix. Not a real skill: its tools only report what the
// sample analysis finds in a snapshot passed to them, so it needs no After Effects and no shared
// state. mentor/test/skill-module.test.mjs loads it through the same discovery mentor/tools/index.mjs
// uses.

import { analyze, focus } from "../lib/sample.mjs";

export const SKILLS = ["sample.skill"];

export const FINDERS = {
  "sample.skill": { focus, review: true },
};

const reply = (value) => ({ content: [{ type: "text", text: JSON.stringify(value) }] });

export const TOOLS = [
  {
    name: "sample_snapshot",
    title: "Sample: read a snapshot",
    description: "Sample skill only. Lists the sample analysis's targets in the snapshot it's given.",
    inputSchema: { type: "object", properties: { snapshot: { type: "object" } }, required: ["snapshot"], additionalProperties: false },
    annotations: { readOnlyHint: true },
    handler: async ({ snapshot }) => reply(analyze(snapshot)),
  },
  {
    name: "sample_check",
    title: "Sample: check",
    description: "Sample skill only. Says how many targets the sample analysis finds.",
    inputSchema: { type: "object", properties: { snapshot: { type: "object" } }, required: ["snapshot"], additionalProperties: false },
    annotations: { readOnlyHint: true },
    handler: async ({ snapshot }) => reply(focus(snapshot)),
  },
];
