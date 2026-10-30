import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createMcpClient } from "../lib/mcp-client.mjs";
import { readSkill } from "../lib/skills.mjs";
import { HELPER_DIR, loadSettings } from "../lib/settings.mjs";
import {
  buildLessonPrompt,
  buildTools,
  loadPreamble,
  loadSkillTool,
  userContent,
  withBreakpoint,
  withoutBreakpoints,
  skillSystemMessage,
} from "../lib/prompt.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const SKILLS = path.join(REPO, ".claude", "skills");
const settings = loadSettings().settings;
const preamble = loadPreamble(HELPER_DIR);
const skillTool = loadSkillTool(HELPER_DIR);
let server;
let mcp;
let home;

before(async () => {
  home = fs.mkdtempSync(path.join(os.tmpdir(), "AEMentor-prompt-"));
  mcp = createMcpClient({ mcpConfig: path.join(REPO, ".mcp.json"), home });
  server = await mcp.start();
});
after(async () => {
  await mcp.stop();
  fs.rmSync(home, { recursive: true, force: true });
});

const lesson = (name, patch) =>
  buildLessonPrompt({ preamble, instructions: server.instructions, serverTools: server.tools, skill: readSkill(SKILLS, name), skillTool, settings: { ...settings, ...patch } });

test("the preamble file is exactly the approved text", () => {
  assert.equal(
    preamble,
    "You are the mentor inside Knack, a panel docked in Adobe After Effects. The person you're talking\n" +
      "with is learning After Effects in their own open project. They read your replies in a narrow panel\n" +
      "beside their comp, and they answer by typing or by pressing the panel's buttons, whose requests\n" +
      "arrive as ordinary messages. You can see and change their project only through the tools you've\n" +
      "been given. Your instructions for this lesson follow.\n",
  );
});

test("system: preamble, server instructions, skill body byte for byte; breakpoint on the last", () => {
  const p = lesson("ease-mentor");
  assert.equal(p.system.length, 3);
  assert.equal(p.system[0].text, preamble);
  assert.equal(p.system[1].text, server.instructions);
  assert.equal(p.system[2].text, readSkill(SKILLS, "ease-mentor").body);
  const fileBytes = fs.readFileSync(path.join(SKILLS, "ease-mentor", "SKILL.md"));
  assert.ok(fileBytes.subarray(-Buffer.byteLength(p.system[2].text)).equals(Buffer.from(p.system[2].text)));
  assert.deepEqual(p.system[2].cache_control, { type: "ephemeral", ttl: "5m" });
  assert.equal(p.system[0].cache_control, undefined);
  assert.equal(p.system[1].cache_control, undefined);
});

test("tools: exactly the skill's, in the server's order, as the server describes them", () => {
  const p = lesson("ease-mentor");
  const serverOrder = server.tools.map((t) => t.name).filter((n) => readSkill(SKILLS, "ease-mentor").allowedTools.includes(n));
  assert.deepEqual(p.tools.map((t) => t.name), serverOrder);
  assert.equal(p.tools.length, 6);
  for (const t of p.tools) {
    const s = server.tools.find((x) => x.name === t.name);
    assert.deepEqual(t, { name: s.name, description: s.description, input_schema: s.inputSchema });
  }
  assert.ok(!p.tools.some((t) => t.name === "offset_snapshot" || t.name === "Skill"), "an unlisted tool is absent");
  assert.deepEqual([...p.allowed].sort(), serverOrder.slice().sort());
});

test("each skill gets only its own tools; only next-mentor gets the hand-over tool", () => {
  for (const name of ["anchor-mentor", "key-types-mentor", "null-parenting-mentor", "offset-mentor", "speed-graph-mentor"]) {
    const p = lesson(name);
    const want = readSkill(SKILLS, name).allowedTools.filter((t) => server.tools.some((s) => s.name === t));
    assert.deepEqual(p.tools.map((t) => t.name).sort(), want.sort(), name);
    assert.ok(!p.allowed.has("Skill"));
  }
  const next = lesson("next-mentor");
  assert.deepEqual(next.tools.map((t) => t.name), ["read_learner_record", "recommend_next", "Skill"]);
  assert.deepEqual(next.tools[2], { name: "Skill", description: skillTool.description, input_schema: skillTool.input_schema });
});

test("a tool the skill lists but the server doesn't have is left out", () => {
  const { tools, allowed } = buildTools(server.tools, ["snapshot_project", "no_such_tool"], skillTool);
  assert.deepEqual(tools.map((t) => t.name), ["snapshot_project"]);
  assert.ok(!allowed.has("no_such_tool"));
});

test("identical output on two calls, and nothing that varies: no date, path or id", () => {
  const a = lesson("offset-mentor");
  const b = lesson("offset-mentor");
  assert.equal(JSON.stringify(a.system), JSON.stringify(b.system));
  assert.equal(JSON.stringify(a.tools), JSON.stringify(b.tools));
  assert.equal(a.prompt_hash, b.prompt_hash);
  assert.match(a.prompt_hash, /^[0-9a-f]{64}$/);
  const text = JSON.stringify({ s: a.system, t: a.tools });
  assert.doesNotMatch(text, /\/Users\/|\/private\/|\/tmp\/|AppData|Application Support\/AEMentor/);
  assert.doesNotMatch(text, /20\d\d-\d\d-\d\dT\d\d:/, "no timestamp");
  assert.doesNotMatch(text, /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/, "no uuid");
  assert.ok(!text.includes(home));
  assert.notEqual(lesson("ease-mentor").prompt_hash, a.prompt_hash);
});

test("message placement: two system blocks, the body ahead of the first learner text", () => {
  const p = lesson("ease-mentor", { skill_placement: "message" });
  assert.equal(p.system.length, 2);
  assert.deepEqual(p.system[1].cache_control, { type: "ephemeral", ttl: "5m" });
  const body = readSkill(SKILLS, "ease-mentor").body;
  assert.deepEqual(userContent("/ease-mentor", body), [{ type: "text", text: body }, { type: "text", text: "/ease-mentor" }]);
  assert.deepEqual(userContent("Hint?"), [{ type: "text", text: "Hint?" }]);
  assert.notEqual(p.prompt_hash, lesson("ease-mentor").prompt_hash);
});

test("1-hour cache lifetime from the settings", () => {
  assert.deepEqual(lesson("ease-mentor", { cache_ttl: "1h" }).system[2].cache_control, { type: "ephemeral", ttl: "1h" });
});

test("the message breakpoint goes on a copy; the history is never changed", () => {
  const history = [
    { role: "user", content: userContent("/next-mentor") },
    { role: "assistant", content: [{ type: "thinking", thinking: "", signature: "s" }, { type: "tool_use", id: "t", name: "Skill", input: { skill: "ease-mentor" } }] },
    { role: "user", content: [{ type: "tool_result", tool_use_id: "t", content: [{ type: "text", text: "Loaded ease-mentor." }] }] },
    skillSystemMessage("BODY"),
  ];
  const frozen = JSON.stringify(history);
  const sent = withBreakpoint(history, "5m");
  assert.equal(JSON.stringify(history), frozen);
  assert.deepEqual(sent[2].content[0].cache_control, { type: "ephemeral", ttl: "5m" }, "the newest non-system message");
  assert.equal(sent[3].content[0].cache_control, undefined);
  assert.equal(JSON.stringify(withoutBreakpoints(sent)), frozen);
});
