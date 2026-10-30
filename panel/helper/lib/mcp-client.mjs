// Starts the `ae-mentor` server as `.mcp.json` describes and talks MCP to it over stdio (spec 013
// FR-004, FR-009, FR-011, FR-019; research R4, decisions/010). The server is the same code, call
// log and fixture mode the evals measure; its instructions come from its own `initialize` reply.
// Its environment is an allowlist: a fixed PATH, HOME, TZ, the learner home and the AE_MENTOR_*
// variables the start command passes. Never the key, never any ANTHROPIC_* variable.

import { spawn as nodeSpawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

export const SERVER = "ae-mentor";
export const PROTOCOL_VERSION = "2025-06-18";
export const CHILD_PATH = "/usr/bin:/bin:/usr/sbin:/sbin";
// What a start command may pass on to the server (the evals' fixture variables, a tools folder).
export const PASSABLE = /^AE_MENTOR_(?:HOME|TOOLS_DIR|FIXTURE_[A-Z0-9_]+)$/;
const KEY_SHAPE = /sk-ant-/;

export class McpError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

// The server's command line from a .mcp.json. "node" runs as the helper's own Node; script paths
// are resolved against the file's folder, as panel/lib/runtime.js does.
export function serverCommand(mcpConfigFile, execPath = process.execPath) {
  let cfg;
  try {
    cfg = JSON.parse(fs.readFileSync(mcpConfigFile, "utf8"));
  } catch {
    throw new McpError("NO_CONFIG", "The mentor's server settings can't be read.");
  }
  const entry = cfg && cfg.mcpServers && cfg.mcpServers[SERVER];
  if (!entry || typeof entry.command !== "string") throw new McpError("NO_SERVER", `No ${SERVER} server in the settings.`);
  const dir = path.dirname(path.resolve(mcpConfigFile));
  const command = entry.command === "node" ? execPath : entry.command;
  const args = (entry.args || []).map((a) => (typeof a === "string" && (a.endsWith(".mjs") || a.endsWith(".js")) ? path.resolve(dir, a) : a));
  return { command, args, cwd: dir };
}

// The server's environment: the allowlist only.
export function serverEnv({ home, fixtureEnv, baseEnv = process.env } = {}) {
  const env = { PATH: CHILD_PATH };
  if (baseEnv.HOME) env.HOME = baseEnv.HOME;
  if (baseEnv.TZ) env.TZ = baseEnv.TZ;
  for (const [k, v] of Object.entries(fixtureEnv || {})) {
    if (!PASSABLE.test(k) || typeof v !== "string" || KEY_SHAPE.test(v)) continue;
    env[k] = v;
  }
  if (home) env.AE_MENTOR_HOME = home;
  return env;
}

// opts: { mcpConfig, home, fixtureEnv, spawn, baseEnv, execPath, initTimeoutMs, onExit }
export function createMcpClient(opts) {
  const spawn = opts.spawn || nodeSpawn;
  const initTimeoutMs = opts.initTimeoutMs || 15000;
  let child = null;
  let nextId = 1;
  const pending = new Map();
  let ready = null; // Promise of { instructions, tools } for the running server
  let stderrTail = "";

  function failAll(err) {
    for (const p of pending.values()) p.reject(err);
    pending.clear();
  }

  function request(method, params, timeoutMs) {
    if (!child) return Promise.reject(new McpError("NOT_RUNNING", "The mentor's server isn't running."));
    const id = nextId++;
    return new Promise((resolve, reject) => {
      let timer = null;
      if (timeoutMs) {
        timer = setTimeout(() => {
          pending.delete(id);
          reject(new McpError("TIMEOUT", `The mentor's server didn't answer ${method}.`));
        }, timeoutMs);
      }
      pending.set(id, {
        resolve: (v) => (clearTimeout(timer), resolve(v)),
        reject: (e) => (clearTimeout(timer), reject(e)),
      });
      try {
        child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
      } catch (e) {
        pending.delete(id);
        clearTimeout(timer);
        reject(new McpError("NOT_RUNNING", "The mentor's server isn't running."));
      }
    });
  }

  function notify(method, params) {
    if (child) child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, ...(params ? { params } : {}) }) + "\n");
  }

  function launch() {
    const { command, args, cwd } = serverCommand(opts.mcpConfig, opts.execPath);
    const env = serverEnv({ home: opts.home, fixtureEnv: opts.fixtureEnv, baseEnv: opts.baseEnv });
    const c = spawn(command, args, { cwd, env, stdio: ["pipe", "pipe", "pipe"] });
    child = c;
    stderrTail = "";
    const exited = new Promise((resolve) => {
      c.on("error", (e) => {
        if (child === c) child = null;
        failAll(new McpError("START_FAILED", "The mentor's server couldn't start."));
        resolve({ code: null, error: e.code || "spawn_error" });
      });
      c.on("close", (code, signal) => {
        if (child === c) child = null;
        failAll(new McpError("EXITED", "The mentor's server stopped."));
        resolve({ code, signal });
        if (opts.onExit) opts.onExit({ code, signal });
      });
    });
    c.exited = exited;
    c.stderr.on("data", (d) => {
      stderrTail = (stderrTail + String(d)).slice(-2000);
    });
    readline.createInterface({ input: c.stdout }).on("line", (line) => {
      let msg;
      try {
        msg = JSON.parse(line);
      } catch {
        return;
      }
      if (!msg || msg.id === undefined || msg.id === null || !pending.has(msg.id)) return;
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) p.reject(new McpError("RPC_ERROR", String(msg.error.message || "error")));
      else p.resolve(msg.result);
    });
    return c;
  }

  async function initialize() {
    const init = await request(
      "initialize",
      { protocolVersion: PROTOCOL_VERSION, capabilities: {}, clientInfo: { name: "knack-helper", version: "0.1.0" } },
      initTimeoutMs,
    );
    notify("notifications/initialized");
    const list = await request("tools/list", {}, initTimeoutMs);
    return {
      instructions: typeof init.instructions === "string" ? init.instructions : "",
      serverInfo: init.serverInfo || null,
      tools: Array.isArray(list && list.tools) ? list.tools : [],
    };
  }

  return {
    // Starts the server if it isn't running. → { instructions, tools }. Throws McpError.
    async start() {
      if (child && ready) return ready;
      launch();
      ready = initialize().catch((e) => {
        ready = null;
        this.kill();
        throw e instanceof McpError ? e : new McpError("START_FAILED", "The mentor's server couldn't start.");
      });
      return ready;
    },
    running: () => child !== null,
    pid: () => (child ? child.pid : null),
    // → { content: [...], isError } exactly as the server returned them.
    async callTool(name, args) {
      const r = await request("tools/call", { name, arguments: args || {} });
      return { content: Array.isArray(r && r.content) ? r.content : [], isError: !!(r && r.isError) };
    },
    stderrTail: () => stderrTail,
    kill() {
      const c = child;
      if (!c) return;
      try {
        c.stdin.end();
      } catch {}
      try {
        c.kill("SIGTERM");
      } catch {}
    },
    // Stops the server and waits for it to exit (SIGKILL after 2 s).
    async stop() {
      const c = child;
      ready = null;
      if (!c) return;
      this.kill();
      const t = setTimeout(() => {
        try {
          c.kill("SIGKILL");
        } catch {}
      }, 2000);
      await c.exited;
      clearTimeout(t);
    },
  };
}

// MCP tool definitions → the Messages API's, exactly as the server gives them.
export function toApiTool(t) {
  return { name: t.name, description: t.description, input_schema: t.inputSchema };
}
