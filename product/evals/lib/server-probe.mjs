// Starts the ae-mentor server by itself and reads what it declares: its `initialize` instructions
// and its `tools/list` (spec 013 T023). The allowlist check and the A dry run use this instead of
// the helper's own client, so the allowlist is derived independently of the code it checks.
// Node built-ins only.

import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";

// → { instructions, tools } (tools as the server lists them). Rejects after timeoutMs.
export function probeServer(repo, { timeoutMs = 15000 } = {}) {
  const cfg = JSON.parse(fs.readFileSync(path.join(repo, ".mcp.json"), "utf8")).mcpServers["ae-mentor"];
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "AEMentor-probe-"));
  const child = spawn(process.execPath, cfg.args.map((a) => (a.endsWith(".mjs") ? path.resolve(repo, a) : a)), {
    cwd: repo,
    env: { PATH: "/usr/bin:/bin:/usr/sbin:/sbin", HOME: process.env.HOME || home, AE_MENTOR_HOME: home },
    stdio: ["pipe", "pipe", "ignore"],
  });
  return new Promise((resolve, reject) => {
    const replies = new Map();
    const done = (fn, v) => {
      clearTimeout(timer);
      try {
        child.kill("SIGTERM");
      } catch {}
      fs.rmSync(home, { recursive: true, force: true });
      fn(v);
    };
    const timer = setTimeout(() => done(reject, new Error("the mentor server didn't answer initialize and tools/list")), timeoutMs);
    child.on("error", (e) => done(reject, e));
    child.on("close", () => done(reject, new Error("the mentor server exited before answering")));
    const send = (id, method, params) => child.stdin.write(JSON.stringify({ jsonrpc: "2.0", ...(id ? { id } : {}), method, params }) + "\n");
    readline.createInterface({ input: child.stdout }).on("line", (line) => {
      let m;
      try {
        m = JSON.parse(line);
      } catch {
        return;
      }
      if (m.id === 1) {
        replies.set(1, m.result || {});
        send(null, "notifications/initialized");
        send(2, "tools/list", {});
      } else if (m.id === 2) {
        const init = replies.get(1) || {};
        done(resolve, { instructions: typeof init.instructions === "string" ? init.instructions : "", tools: (m.result && m.result.tools) || [] });
      }
    });
    send(1, "initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "eval-allowlist-probe", version: "0.1.0" } });
  });
}
