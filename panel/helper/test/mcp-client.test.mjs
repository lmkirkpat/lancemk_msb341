import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createMcpClient, serverCommand, serverEnv, toApiTool, CHILD_PATH } from "../lib/mcp-client.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "../../..");
const MCP = path.join(REPO, ".mcp.json");
const FIXTURE = path.join(REPO, "product", "evals", "easing", "fixtures", "before.json");
const KEY = "sk-ant-api03-MCPKEY_abcdefghijklm";
const temps = [];

function tempHome() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "AEMentor-mcp-"));
  temps.push(home);
  const state = path.join(home, "fixture-state.json");
  fs.writeFileSync(state, JSON.stringify({ project: FIXTURE }));
  return { home, state };
}

after(() => temps.forEach((d) => fs.rmSync(d, { recursive: true, force: true })));

test("the command comes from .mcp.json: node is the helper's Node, the script is absolute", () => {
  const c = serverCommand(MCP, "/opt/node/bin/node");
  assert.equal(c.command, "/opt/node/bin/node");
  assert.deepEqual(c.args, [path.join(REPO, "mentor", "server.mjs")]);
  assert.equal(c.cwd, REPO);
  assert.throws(() => serverCommand(path.join(HERE, "nope.json")), (e) => e.code === "NO_CONFIG");
});

test("the server's environment is the allowlist only", () => {
  const env = serverEnv({
    home: "/tmp/h",
    fixtureEnv: { AE_MENTOR_FIXTURE_STATE: "/tmp/s", AE_MENTOR_FIXTURE_TWINS: "/tmp/t", AE_MENTOR_TOOLS_DIR: "/tmp/tools", ANTHROPIC_API_KEY: KEY, AE_MENTOR_FIXTURE_X: KEY, NODE_OPTIONS: "--inspect" },
    baseEnv: { HOME: "/Users/u", TZ: "UTC", PATH: "/opt/bin", ANTHROPIC_API_KEY: KEY, KNACK_EVAL_API_KEY: KEY, SHELL: "/bin/zsh" },
  });
  assert.deepEqual(env, {
    PATH: CHILD_PATH,
    HOME: "/Users/u",
    TZ: "UTC",
    AE_MENTOR_FIXTURE_STATE: "/tmp/s",
    AE_MENTOR_FIXTURE_TWINS: "/tmp/t",
    AE_MENTOR_TOOLS_DIR: "/tmp/tools",
    AE_MENTOR_HOME: "/tmp/h",
  });
});

test("the spawned server really gets no key and no ANTHROPIC_* variable (FR-009, FR-019)", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-env-"));
  temps.push(dir);
  const cfg = path.join(dir, ".mcp.json");
  fs.writeFileSync(cfg, JSON.stringify({ mcpServers: { "ae-mentor": { command: "node", args: [path.join(HERE, "fixtures", "env-echo-server.mjs")] } } }));
  const client = createMcpClient({
    mcpConfig: cfg,
    home: dir,
    fixtureEnv: { AE_MENTOR_FIXTURE_STATE: "/tmp/s" },
    baseEnv: { ...process.env, ANTHROPIC_API_KEY: KEY, ANTHROPIC_AUTH_TOKEN: KEY, KNACK_EVAL_API_KEY: KEY },
  });
  const { instructions } = await client.start();
  const { env, cwd } = JSON.parse(instructions);
  await client.stop();
  assert.equal(fs.realpathSync(cwd), fs.realpathSync(dir));
  assert.ok(!Object.keys(env).some((k) => k.startsWith("ANTHROPIC_") || k.startsWith("KNACK_")), Object.keys(env).join(","));
  assert.ok(!Object.values(env).some((v) => /sk-ant-/.test(v)));
  assert.equal(env.PATH, CHILD_PATH);
  assert.equal(env.AE_MENTOR_HOME, dir);
  assert.equal(env.AE_MENTOR_FIXTURE_STATE, "/tmp/s");
});

test("the real ae-mentor in fixture mode: instructions, tools, a call, a frame, exit and restart", async () => {
  const { home, state } = tempHome();
  const exits = [];
  const client = createMcpClient({ mcpConfig: MCP, home, fixtureEnv: { AE_MENTOR_FIXTURE_STATE: state }, onExit: (e) => exits.push(e) });
  const first = await client.start();
  assert.match(first.instructions, /^Tools for an After Effects mentor/);
  assert.match(first.instructions, /\(8\) Never put a name, email or phone number in record_lesson\.$/);
  const names = first.tools.map((t) => t.name);
  for (const n of ["read_learner_record", "snapshot_project", "preview_frame", "set_ease", "diff_since_last", "record_lesson", "offset_snapshot", "recommend_next"]) assert.ok(names.includes(n), n);

  const api = toApiTool(first.tools.find((t) => t.name === "snapshot_project"));
  assert.deepEqual(Object.keys(api), ["name", "description", "input_schema"]);
  assert.equal(api.input_schema.type, "object");

  const snap = await client.callTool("snapshot_project", {});
  assert.equal(snap.isError, false);
  assert.equal(snap.content[0].type, "text");
  assert.ok(JSON.parse(snap.content[0].text));
  const frame = await client.callTool("preview_frame", { time: 0.5 });
  assert.equal(frame.isError, false);
  assert.deepEqual(frame.content.map((c) => c.type), ["image", "text"]);
  assert.equal(frame.content[0].mimeType, "image/png");
  assert.ok(frame.content[0].data.length > 100);
  const calls = fs.readFileSync(path.join(home, "calls.jsonl"), "utf8");
  assert.match(calls, /"tool":"snapshot_project"/, "the server's own call log, in the given home");

  fs.writeFileSync(state, JSON.stringify({ project: "unreachable" }));
  const down = await client.callTool("snapshot_project", {});
  assert.equal(down.isError, true);
  assert.match(down.content[0].text, /^AE_UNREACHABLE/);
  fs.writeFileSync(state, JSON.stringify({ project: FIXTURE }));

  const pid = client.pid();
  process.kill(pid, "SIGTERM");
  await new Promise((r) => setTimeout(r, 300));
  assert.equal(client.running(), false);
  assert.equal(exits.length, 1, "the exit is reported");
  await assert.rejects(client.callTool("snapshot_project", {}), (e) => e.code === "NOT_RUNNING");

  const again = await client.start();
  assert.notEqual(client.pid(), pid);
  assert.equal(again.instructions, first.instructions);
  await client.stop();
  assert.equal(client.running(), false);
  assert.throws(() => process.kill(pid, 0));
});

test("a server that can't start is a start failure", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-bad-"));
  temps.push(dir);
  const cfg = path.join(dir, ".mcp.json");
  fs.writeFileSync(cfg, JSON.stringify({ mcpServers: { "ae-mentor": { command: "/nonexistent/node", args: ["x.mjs"] } } }));
  const client = createMcpClient({ mcpConfig: cfg, home: dir });
  await assert.rejects(client.start(), (e) => e.code === "START_FAILED" || e.code === "EXITED");
  fs.writeFileSync(cfg, JSON.stringify({ mcpServers: { "ae-mentor": { command: "node", args: [path.join(dir, "missing.mjs")] } } }));
  await assert.rejects(createMcpClient({ mcpConfig: cfg, home: dir }).start(), (e) => e.code === "EXITED" || e.code === "START_FAILED");
});
