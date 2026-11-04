// What the model is given (spec 013 FR-005, FR-010 to FR-013, FR-016, FR-025; research R5, R6,
// R8). Everything comes from an allowlist: the preamble file, the server's own instructions, the
// active skill's SKILL.md body byte for byte, the server's tool definitions (plus the hand-over
// tool), with the skill's allowed-tools on offer, and the conversation.
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

// The models that take mid-conversation tool changes (D2, research R5). On them the tool list never
// changes during a lesson; any other model (Haiku 5.5) gets a replaced list at a hand-over.
const TOOL_CHANGE_MODELS = /^claude-(opus|sonnet)-5-5$/;
export const usesToolChanges = (model) => TOOL_CHANGE_MODELS.test(model);

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

// D2's fixed list: every server tool in the server's order, then the hand-over tool. Tools outside
// `allowed` are deferred, so the model doesn't see them until a tool_addition names them. The
// service refuses a list with every tool deferred, so with nothing on offer (no skill yet) Skill
// stays undeferred, and the loop withdraws it in the first request.
export function buildDeclaredTools(serverTools, allowed, skillTool) {
  const tools = serverTools.map(toApiTool);
  if (skillTool) tools.push({ name: skillTool.name, description: skillTool.description, input_schema: skillTool.input_schema });
  const keep = allowed.size ? allowed : new Set([SKILL_TOOL]);
  return tools.map((t) => (keep.has(t.name) ? t : { ...t, defer_loading: true }));
}

// The blocks that take the model from the tools `offered` to the tools `allowed`: removals, then
// additions, each in the declared order, each naming its tool by reference. The service's real
// shape, checked live in T060.
export function toolChangeBlocks(tools, offered, allowed) {
  const names = tools.map((t) => t.name);
  const block = (type) => (name) => ({ type, tool: { type: "tool_reference", name } });
  return [
    ...names.filter((n) => offered.has(n) && !allowed.has(n)).map(block("tool_removal")),
    ...names.filter((n) => !offered.has(n) && allowed.has(n)).map(block("tool_addition")),
  ];
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

// The hand-over's mid-conversation system message (R5): the tool changes, if any, then the new
// skill's body, unedited, if there is one. One message: the live check found the service takes both
// together, and it keeps a tool_removal right before the assistant turn or last, as documented.
export function skillSystemMessage(body, toolChanges = []) {
  const content = [...toolChanges];
  if (typeof body === "string") content.push({ type: "text", text: body });
  return { role: "system", content };
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
  const toolChanges = usesToolChanges(settings.model);
  const built = skill ? buildTools(serverTools, skill.allowedTools, skillTool) : { tools: [], allowed: new Set() };
  const { allowed } = built;
  const tools = toolChanges ? buildDeclaredTools(serverTools, allowed, skillTool) : built.tools;
  const system = buildSystem({ preamble, instructions, skillBody: skill ? skill.body : null, placement, ttl: settings.cache_ttl });
  return {
    tools,
    allowed,
    toolChanges,
    system,
    skillName: skill ? skill.name : null,
    prompt_hash: promptHash({ tools, system, placement, skillName: skill && skill.name, skillBody: skill && skill.body }),
  };
}
