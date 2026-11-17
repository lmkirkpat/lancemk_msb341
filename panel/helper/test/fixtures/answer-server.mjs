// A stand-in MCP server for T105 (spec 014): describe_layers, and give_answer answered the way
// ae-mentor does: the accepted fields as JSON, or a refusal as an error ("CODE: message") when the
// call's explanation is empty.
import readline from "node:readline";

const any = { type: "object", additionalProperties: true };
const TOOLS = [
  { name: "describe_layers", description: "Reads the comp.", inputSchema: any },
  { name: "give_answer", description: "Gives the answer.", inputSchema: any },
];

function call(name, args) {
  if (name === "describe_layers") return { content: [{ type: "text", text: JSON.stringify({ comp: { name: "Intro" }, layers: [] }) }] };
  if (name === "give_answer") {
    if (!args.explanation) return { content: [{ type: "text", text: "ANSWER_SHAPE: Give the answer as the tool describes it." }], isError: true };
    const reply = { kind: args.kind, comp: "Intro", explanation: args.explanation, steps: [], offered_skills: [], closing_offer: args.closing_offer ?? null, runtime: "a", tags: {} };
    return { content: [{ type: "text", text: JSON.stringify(reply, null, 2) }] };
  }
  return { content: [{ type: "text", text: "{}" }] };
}

readline.createInterface({ input: process.stdin }).on("line", (line) => {
  const msg = JSON.parse(line);
  if (msg.id === undefined) return;
  const result =
    msg.method === "initialize"
      ? { protocolVersion: msg.params.protocolVersion, capabilities: { tools: {} }, serverInfo: { name: "answer-stand-in" }, instructions: "Stand-in server." }
      : msg.method === "tools/list"
        ? { tools: TOOLS }
        : msg.method === "tools/call"
          ? call(msg.params.name, msg.params.arguments || {})
          : {};
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: msg.id, result }) + "\n");
});
