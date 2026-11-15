// A stand-in MCP server for the hand-over test (spec 014 T002): one tool writes a value to
// session.json in the learner home, another reads it back, so a test can see whether a value saved
// before a hand-over reaches a tool after it. Each reply also says which process answered and what
// AE_MENTOR_RUNTIME it was given (research R4).
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const file = () => path.join(process.env.AE_MENTOR_HOME || ".", "session.json");
const obj = { type: "object", properties: { value: { type: "string" } }, additionalProperties: false };
const TOOLS = [
  { name: "note_value", description: "Saves a value in session.json.", inputSchema: obj },
  { name: "read_value", description: "Reads the value saved in session.json.", inputSchema: { type: "object", properties: {} } },
  { name: "other_tool", description: "A tool neither test skill lists.", inputSchema: { type: "object", properties: {} } },
];

function call(name, args) {
  const who = { pid: process.pid, runtime: process.env.AE_MENTOR_RUNTIME || null };
  if (name === "note_value") {
    fs.writeFileSync(file(), JSON.stringify({ hand_in: { value: String(args.value) } }));
    return { content: [{ type: "text", text: JSON.stringify({ saved: true, ...who }) }] };
  }
  if (name === "read_value") {
    let session = null;
    try {
      session = JSON.parse(fs.readFileSync(file(), "utf8"));
    } catch {}
    return { content: [{ type: "text", text: JSON.stringify({ session, ...who }) }] };
  }
  return { content: [{ type: "text", text: "{}" }] };
}

readline.createInterface({ input: process.stdin }).on("line", (line) => {
  const msg = JSON.parse(line);
  if (msg.id === undefined) return;
  const result =
    msg.method === "initialize"
      ? { protocolVersion: msg.params.protocolVersion, capabilities: { tools: {} }, serverInfo: { name: "session-stand-in" }, instructions: "Stand-in server." }
      : msg.method === "tools/list"
        ? { tools: TOOLS }
        : msg.method === "tools/call"
          ? call(msg.params.name, msg.params.arguments || {})
          : {};
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: msg.id, result }) + "\n");
});
