// What the model is given (spec 013 FR-005, FR-010 to FR-013, FR-016, FR-025; research R5, R6,
// R8). Everything comes from an allowlist: the preamble file, the server's own instructions, the
// active skill's SKILL.md body byte for byte, the server's tool definitions filtered by the
// skill's allowed-tools (plus the hand-over tool where a skill lists it), and the conversation.
// Render order is tools, system, messages, in a fixed order with nothing that varies (no date,
// time, path or id), so the stable part caches.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { toApiTool } from "./mcp-client.mjs";

export const SKILL_TOOL = "Skill";

export function loadPreamble(helperDir) {
  return fs.readFileSync(path.join(helperDir, "preamble.md"), "utf8");
}

export function loadSkillTool(helperDir) {
  const t = JSON.parse(fs.readFileSync(path.join(helperDir, "skill-tool.json"), "utf8"));
  if (t.name !== SKILL_TOOL) throw new Error("skill-tool.json must define the Skill tool");
  return t;
}

export function cacheControl(ttl) {
  return { type: "ephemeral", ttl };
}

// The server's tools in the server's order, only those the skill lists, as the API takes them;
// then the hand-over tool if the skill lists it. → { tools, allowed: Set of runnable names }.
export function buildTools(serverTools, allowedTools, skillTool) {
  const wanted = new Set(allowedTools);
  const tools = serverTools.filter((t) => wanted.has(t.name)).map(toApiTool);
  const allowed = new Set(tools.map((t) => t.name));
  if (wanted.has(SKILL_TOOL) && skillTool) {
    tools.push({ name: skillTool.name, description: skillTool.description, input_schema: skillTool.input_schema });
    allowed.add(SKILL_TOOL);
  }
  return { tools, allowed };
}

// Three text blocks (preamble, server instructions, skill body), or two when the skill goes in the
// first message instead (skill_placement "message", R5's fallback). Breakpoint on the last.
export function buildSystem({ preamble, instructions, skillBody, placement, ttl }) {
  const texts = [preamble, instructions];
  if (placement === "system" && typeof skillBody === "string") texts.push(skillBody);
  const blocks = texts.filter((t) => typeof t === "string" && t.length > 0).map((t) => ({ type: "text", text: t }));
  if (blocks.length) blocks[blocks.length - 1] = { ...blocks[blocks.length - 1], cache_control: cacheControl(ttl) };
  return blocks;
}

// The content of a learner's or the panel's message: their text, verbatim. On the first message
// with skill_placement "message", the skill body goes ahead of it, as Claude Code expands a /skill.
export function userContent(text, skillBodyAhead) {
  const blocks = [];
  if (typeof skillBodyAhead === "string") blocks.push({ type: "text", text: skillBodyAhead });
  blocks.push({ type: "text", text: String(text) });
  return blocks;
}

// The hand-over's mid-conversation system message (R5): the new skill's body, unedited.
export function skillSystemMessage(body) {
  return { role: "system", content: [{ type: "text", text: body }] };
}

// A copy of the messages for one request with the second breakpoint on the last block of the
// newest message that can carry one (a system message can't be first, and is never cached here).
// The history itself is never changed: moving a breakpoint isn't an edit (R8, FR-015).
export function withBreakpoint(messages, ttl) {
  const out = messages.slice();
  for (let i = out.length - 1; i >= 0; i--) {
    const m = out[i];
    if (m.role === "system" || !Array.isArray(m.content) || m.content.length === 0) continue;
    const last = m.content[m.content.length - 1];
    if (last.type === "thinking" || last.type === "redacted_thinking" || last.type === "fallback") continue;
    const content = m.content.slice();
    content[content.length - 1] = { ...last, cache_control: cacheControl(ttl) };
    out[i] = { ...m, content };
    break;
  }
  return out;
}

// Removes cache_control markers (for comparing histories across requests).
export function withoutBreakpoints(value) {
  return JSON.parse(JSON.stringify(value), (k, v) => (k === "cache_control" ? undefined : v));
}

export function promptHash({ tools, system, placement, skillName, skillBody }) {
  const h = crypto.createHash("sha256");
  h.update(JSON.stringify({ tools, system: withoutBreakpoints(system), placement, skill: skillName || null }));
  if (placement === "message" && typeof skillBody === "string") h.update(skillBody);
  return h.digest("hex");
}

// The lesson prompt for one skill (or none yet). skill: readSkill()'s result or null.
export function buildLessonPrompt({ preamble, instructions, serverTools, skill, skillTool, settings }) {
  const placement = settings.skill_placement;
  const { tools, allowed } = skill ? buildTools(serverTools, skill.allowedTools, skillTool) : { tools: [], allowed: new Set() };
  const system = buildSystem({ preamble, instructions, skillBody: skill ? skill.body : null, placement, ttl: settings.cache_ttl });
  return {
    tools,
    allowed,
    system,
    skillName: skill ? skill.name : null,
    prompt_hash: promptHash({ tools, system, placement, skillName: skill && skill.name, skillBody: skill && skill.body }),
  };
}
