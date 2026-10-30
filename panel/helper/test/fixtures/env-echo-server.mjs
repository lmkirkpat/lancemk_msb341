// A stand-in MCP server for the helper's tests: its `initialize` instructions are its own
// environment, so a test can see exactly what the helper passed to the mentor's server.
import readline from "node:readline";

readline.createInterface({ input: process.stdin }).on("line", (line) => {
  const msg = JSON.parse(line);
  if (msg.id === undefined) return;
  const result =
    msg.method === "initialize"
      ? { protocolVersion: msg.params.protocolVersion, capabilities: { tools: {} }, serverInfo: { name: "env-echo" }, instructions: JSON.stringify({ env: process.env, cwd: process.cwd() }) }
      : msg.method === "tools/list"
        ? { tools: [] }
        : {};
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: msg.id, result }) + "\n");
});
