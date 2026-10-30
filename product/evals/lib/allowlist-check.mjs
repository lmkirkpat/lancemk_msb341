// The allowlist check (spec 013 T023, SC-008, FR-016): reads a request log the helper wrote
// (`request_log` in the start command) and proves every request body held only allowed input.
//
// The allowlist is derived here, independently of the helper's code: the preamble and the hand-over
// tool's definition are read from their files, the server's instructions and tool list come from
// starting mentor/server.mjs itself (server-probe.mjs), and the skill bodies from the `*-mentor`
// SKILL.md files. A request passes when
//   - every `system` block is the preamble, the server's instructions or a skill body;
//   - every tool is a server tool (unchanged, optionally `defer_loading: true`) or the hand-over tool;
//   - every message is learner or panel text, a tool result, a tool use or the model's own block,
//     or a `role: "system"` message holding a skill body or tool_addition / tool_removal blocks;
//   - the runtime's own tool-result texts are exactly the five in FR-012 (items 3 to 6);
//   - no text that isn't an allowlisted source mentions CLAUDE.md, a sprint or eval-fixture path,
//     or anything under .claude/.
// Node built-ins only.

import fs from "node:fs";
import path from "node:path";
import { probeServer } from "./server-probe.mjs";

export const SKILL_PATTERN = /^[a-z0-9][a-z0-9-]*-mentor$/;
export const NOT_AVAILABLE = "That tool isn't available in this lesson.";
export const NO_SUCH_SKILL = "That skill isn't available.";
export const NOT_RUN = "That call didn't run.";
export const HAND_OVER = "Skill";

// Text that must never reach the model from anywhere but an allowlisted source.
export const FORBIDDEN = [
  { name: "CLAUDE.md", re: /CLAUDE\.md/i },
  { name: "a sprint path", re: /\bsprints?\/|sprint-\d+-(?:plan|review)/i },
  { name: "an eval or fixture path", re: /product\/evals|\bevals\/[a-z-]+\/(?:cases|fixtures|results)|\/fixtures?\//i },
  { name: "a path under .claude", re: /\.claude\b/ },
  { name: "the builder's auto-memory", re: /\bMEMORY\.md\b/ },
];

// The text after the frontmatter's closing `---` line, as the model should get it.
export function skillBodyOf(markdown) {
  const lines = markdown.split("\n");
  if (lines[0].replace(/\r$/, "") !== "---") return null;
  let offset = lines[0].length + 1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].replace(/\r$/, "") === "---") return markdown.slice(offset + lines[i].length + 1);
    offset += lines[i].length + 1;
  }
  return null;
}

export function readSkillBodies(skillsDir) {
  const bodies = new Map();
  for (const n of fs.readdirSync(skillsDir).sort()) {
    const file = path.join(skillsDir, n, "SKILL.md");
    if (!SKILL_PATTERN.test(n) || !fs.existsSync(file)) continue;
    const body = skillBodyOf(fs.readFileSync(file, "utf8"));
    if (body !== null) bodies.set(n, body);
  }
  return bodies;
}

// → the allowlist: { preamble, instructions, handOverTool, serverTools (name → {name, description,
// input_schema}), skillBodies (name → body) }. `server` may be passed to skip starting it (tests).
export async function deriveAllowlist({ repo, helperDir = path.join(repo, "panel", "helper"), skillsDir = path.join(repo, ".claude", "skills"), server } = {}) {
  const probed = server || (await probeServer(repo));
  const serverTools = new Map();
  for (const t of probed.tools) serverTools.set(t.name, { name: t.name, description: t.description, input_schema: t.inputSchema });
  const handOver = JSON.parse(fs.readFileSync(path.join(helperDir, "skill-tool.json"), "utf8"));
  return {
    preamble: fs.readFileSync(path.join(helperDir, "preamble.md"), "utf8"),
    instructions: probed.instructions,
    handOverTool: { name: handOver.name, description: handOver.description, input_schema: handOver.input_schema },
    serverTools,
    skillBodies: readSkillBodies(skillsDir),
  };
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const loadedText = (name, args) => (args ? `Loaded ${name}. Arguments: ${args}` : `Loaded ${name}.`);

const REQUEST_KEYS = new Set(["model", "max_tokens", "system", "tools", "messages", "thinking", "output_config", "fallbacks", "stream", "input_transformations"]);
const ASSISTANT_BLOCKS = new Set(["text", "thinking", "redacted_thinking", "tool_use", "fallback"]);

// The tool names a tool_addition / tool_removal block names (shape settled by T060; reads `name`,
// `tool_name`, `names` and `tools` so the check doesn't depend on which one the service wants).
function namedBy(block) {
  const names = [];
  for (const k of ["name", "tool_name"]) if (typeof block[k] === "string") names.push(block[k]);
  for (const k of ["names", "tools"]) {
    if (!Array.isArray(block[k])) continue;
    for (const x of block[k]) names.push(typeof x === "string" ? x : x && typeof x.name === "string" ? x.name : undefined);
  }
  return names;
}

// One request body → a list of { where, detail } violations.
export function checkBody(body, allow, { learnerTexts } = {}) {
  const bad = [];
  const fail = (where, detail) => bad.push({ where, detail });
  const bodies = new Set(allow.skillBodies.values());
  const sources = new Set([allow.preamble, allow.instructions, ...bodies]);
  const learner = learnerTexts ? new Set(learnerTexts) : null;

  if (!body || typeof body !== "object") return [{ where: "request", detail: "not a request body" }];
  for (const k of Object.keys(body)) if (!REQUEST_KEYS.has(k)) fail(`request.${k}`, "a field outside the known request fields");

  // system
  const system = typeof body.system === "string" ? [{ type: "text", text: body.system }] : body.system || [];
  system.forEach((b, i) => {
    if (!b || b.type !== "text" || !sources.has(b.text)) fail(`system[${i}]`, "not the preamble, the server's instructions or a skill body");
  });

  // tools
  (body.tools || []).forEach((t, i) => {
    const { defer_loading, cache_control, ...def } = t || {};
    if (defer_loading !== undefined && defer_loading !== true) fail(`tools[${i}]`, "defer_loading is not true");
    if (same(def, allow.handOverTool)) return;
    const server = allow.serverTools.get(def.name);
    if (!server || !same(def, server)) fail(`tools[${i}]`, `${def.name}: not the hand-over tool or a server tool exactly as the server lists it`);
  });

  // messages
  const uses = new Map(); // tool_use id → { name, input }
  const known = new Set([...allow.serverTools.keys(), HAND_OVER]);
  const scan = (where, text) => {
    for (const f of FORBIDDEN) if (f.re.test(text)) fail(where, `mentions ${f.name}`);
  };
  (body.messages || []).forEach((m, i) => {
    const at = `messages[${i}]`;
    const blocks = typeof m.content === "string" ? [{ type: "text", text: m.content }] : m.content || [];
    if (m.role === "assistant") {
      blocks.forEach((b, j) => {
        if (!b || !ASSISTANT_BLOCKS.has(b.type)) fail(`${at}.content[${j}]`, `assistant block of type ${b && b.type}`);
        else if (b.type === "tool_use") uses.set(b.id, { name: b.name, input: b.input || {} });
      });
    } else if (m.role === "user") {
      blocks.forEach((b, j) => {
        const w = `${at}.content[${j}]`;
        if (b && b.type === "text") {
          if (bodies.has(b.text)) return; // a skill body ahead of the first message (placement "message")
          if (learner && !learner.has(b.text)) fail(w, "user text that isn't a learner or panel message");
          scan(w, b.text);
        } else if (b && b.type === "tool_result") {
          const parts = typeof b.content === "string" ? [{ type: "text", text: b.content }] : b.content || [];
          const texts = parts.filter((p) => p.type === "text").map((p) => p.text);
          const use = uses.get(b.tool_use_id);
          if (!use) fail(w, "a tool result with no matching tool use before it");
          const only = texts.length === 1 && parts.length === 1 ? texts[0] : null;
          if (use && use.name === HAND_OVER) {
            const name = String(use.input.skill || "").trim().replace(/^\//, "");
            const args = typeof use.input.args === "string" ? use.input.args.trim() : "";
            const ok = only === NO_SUCH_SKILL || only === NOT_AVAILABLE || only === NOT_RUN || (allow.skillBodies.has(name) && only === loadedText(name, args));
            if (!ok) fail(w, "the hand-over tool's result isn't one of its fixed texts for this call");
          } else {
            for (const t of texts) scan(w, t);
          }
          for (const p of parts) if (p.type !== "text" && p.type !== "image") fail(w, `tool result part of type ${p.type}`);
        } else if (b && b.type === "image") {
          fail(w, "an image outside a tool result");
        } else {
          fail(w, `user block of type ${b && b.type}`);
        }
      });
    } else if (m.role === "system") {
      blocks.forEach((b, j) => {
        const w = `${at}.content[${j}]`;
        if (b && b.type === "text") {
          if (!bodies.has(b.text)) fail(w, "a system message that isn't a skill body");
        } else if (b && (b.type === "tool_addition" || b.type === "tool_removal")) {
          const names = namedBy(b);
          if (!names.length) fail(w, `${b.type} names no tool`);
          for (const n of names) if (!known.has(n)) fail(w, `${b.type} names ${n}, which is not a server tool or the hand-over tool`);
        } else {
          fail(w, `system block of type ${b && b.type}`);
        }
      });
    } else {
      fail(at, `a message with role ${m.role}`);
    }
  });
  return bad;
}

// Checks every line of a request log. → { pass, requests, violations: [{ request, turn, where, detail }] }.
// opts: { learnerTexts } (the case's turn texts: any other user text fails).
export function checkRequestLog(logText, allow, opts = {}) {
  const violations = [];
  let requests = 0;
  const lines = logText.split("\n").filter((l) => l.trim());
  lines.forEach((line, i) => {
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      violations.push({ request: i + 1, turn: null, where: "log line", detail: "unreadable" });
      return;
    }
    requests++;
    for (const v of checkBody(entry.body, allow, opts)) violations.push({ request: i + 1, turn: entry.turn ?? null, ...v });
  });
  if (!requests) violations.push({ request: 0, turn: null, where: "log", detail: "no requests were logged" });
  return { pass: violations.length === 0, requests, violations };
}

export function checkRequestLogFile(file, allow, opts = {}) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return { pass: false, requests: 0, violations: [{ request: 0, turn: null, where: "log", detail: "the request log can't be read" }] };
  }
  return checkRequestLog(text, allow, opts);
}

export function describe(result, max = 3) {
  if (result.pass) return `${result.requests} requests, all inside the allowlist`;
  const first = result.violations.slice(0, max).map((v) => `request ${v.request} ${v.where}: ${v.detail}`);
  return `${result.violations.length} violation(s): ${first.join("; ")}`;
}
