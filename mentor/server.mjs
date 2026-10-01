#!/usr/bin/env node
// AE Mentor MCP server ("ae-mentor"). Speaks MCP (JSON-RPC over stdio), adapted from upstream
// after-effects-mcp server/server.mjs. The tools are the whole of what the mentor can do in AE
// (specs/002-easing-slice/contracts/mentor-tools.md). No dependencies: Node 18+.

import fs from "node:fs";
import readline from "node:readline";
import { TOOLS } from "./tools.mjs";
import { CALLS_LOG } from "./paths.mjs";
import { MentorError } from "./errors.mjs";

const SERVER_INFO = { name: "ae-mentor", title: "AE Mentor", version: "0.1.0" };
const PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];

const INSTRUCTIONS =
  "Tools for an After Effects mentor that teaches easing inside the learner's own comp. Rules that always apply: " +
  "(1) To reverse a change, tell the learner to use Edit > Undo. Never name an undo label; AE may show a different one. " +
  "(2) After an AE_UNREACHABLE or AE_BUSY error, make no claims about the project; say you can't see it and pass on the fix. " +
  "(3) At most one demonstration (set_ease) per lesson, on the lesson's demo_target only; the learner does the rest. " +
  "(4) Start with snapshot_project and use real layer and property names from its output.";

// One line per tool call, in live and fixture mode alike, for SC-004 checks, speed goals and evals.
function logCall(entry) {
  try {
    fs.appendFileSync(CALLS_LOG, JSON.stringify(entry) + "\n");
  } catch {
    // Logging must never break a lesson.
  }
}

async function callTool(name, args) {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) throw Object.assign(new Error(`Unknown tool: ${name}`), { code: -32602 });
  const started = Date.now();
  try {
    const result = await tool.handler(args);
    logCall({ tool: name, args, ok: true, error_code: null, ms: Date.now() - started, at: new Date().toISOString() });
    return result;
  } catch (e) {
    const code = e instanceof MentorError ? e.code : null;
    logCall({ tool: name, args, ok: false, error_code: code, ms: Date.now() - started, at: new Date().toISOString() });
    const text = code ? `${code}: ${e.message}` : String(e.message || e);
    return { content: [{ type: "text", text }], isError: true };
  }
}

async function route(method, params) {
  switch (method) {
    case "initialize":
      return {
        protocolVersion: PROTOCOL_VERSIONS.includes(params.protocolVersion) ? params.protocolVersion : PROTOCOL_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: INSTRUCTIONS,
      };
    case "ping":
      return {};
    case "tools/list":
      return { tools: TOOLS.map(({ name, title, description, inputSchema, annotations }) => ({ name, title, description, inputSchema, annotations })) };
    case "tools/call":
      return callTool(params.name, params.arguments || {});
    default:
      throw Object.assign(new Error(`Method not found: ${method}`), { code: -32601 });
  }
}

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + "\n");
}

async function dispatch(msg) {
  if (!msg || typeof msg !== "object" || Array.isArray(msg)) {
    return send({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid request" } });
  }
  // Notifications (initialized, cancelled) need no reply.
  if (msg.id === undefined || msg.id === null || typeof msg.method !== "string") return;
  try {
    send({ jsonrpc: "2.0", id: msg.id, result: await route(msg.method, msg.params || {}) });
  } catch (e) {
    send({ jsonrpc: "2.0", id: msg.id, error: { code: e.code || -32603, message: String(e.message || e) } });
  }
}

readline.createInterface({ input: process.stdin }).on("line", (line) => {
  if (!line.trim()) return;
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
  }
  dispatch(msg);
});
