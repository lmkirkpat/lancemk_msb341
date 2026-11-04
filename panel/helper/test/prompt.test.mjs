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
  toolChangeBlocks,
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

const HAIKU = { model: "claude-haiku-5-5", fallbacks: null, thinking_display: "omitted" };
const offered = (p) => p.tools.filter((t) => !t.defer_loading).map((t) => t.name);

test("tools on Opus 5.5 and Sonnet 5.5: every server tool plus Skill; those outside the skill deferred (D2)", () => {
  for (const model of ["claude-opus-5-5", "claude-sonnet-5-5"]) {
    const p = lesson("ease-mentor", { model });
    assert.deepEqual(p.tools.map((t) => t.name), [...server.tools.map((t) => t.name), "Skill"], model);
    const listed = readSkill(SKILLS, "ease-mentor").allowedTools;
    assert.deepEqual(offered(p), server.tools.map((t) => t.name).filter((n) => listed.includes(n)));
    for (const t of p.tools) {
      const s = server.tools.find((x) => x.name === t.name);
      const def = s ? { name: s.name, description: s.description, input_schema: s.inputSchema } : { name: "Skill", description: skillTool.description, input_schema: skillTool.input_schema };
      assert.deepEqual(t, listed.includes(t.name) ? def : { ...def, defer_loading: true });
    }
    assert.deepEqual([...p.allowed].sort(), listed.slice().sort());
    assert.equal(p.toolChanges, true);
  }
});

test("tools on Opus 5.5: the same declaration whichever skill lists what, apart from which are deferred", () => {
  const strip = (p) => p.tools.map(({ defer_loading, ...t }) => t);
  assert.equal(JSON.stringify(strip(lesson("ease-mentor"))), JSON.stringify(strip(lesson("offset-mentor"))));
  assert.deepEqual(offered(lesson("next-mentor")), ["read_learner_record", "recommend_next", "Skill"]);
  assert.ok(!lesson("offset-mentor").allowed.has("Skill"));
});

test("tools with no skill: Skill alone isn't deferred, since the service refuses a list with none", () => {
  const p = buildLessonPrompt({ preamble, instructions: server.instructions, serverTools: server.tools, skill: null, skillTool, settings });
  assert.deepEqual(offered(p), ["Skill"]);
  assert.equal(p.allowed.size, 0, "and it can't be run");
});

test("tool-change blocks: removals then additions, in the declared order, by reference", () => {
  const { tools } = lesson("next-mentor");
  const blocks = toolChangeBlocks(tools, new Set(["read_learner_record", "recommend_next", "Skill"]), new Set(["read_learner_record", "snapshot_project", "set_ease"]));
  const order = tools.map((t) => t.name);
  assert.ok(order.indexOf("snapshot_project") < order.indexOf("set_ease") || order.indexOf("set_ease") < order.indexOf("snapshot_project"));
  assert.deepEqual(blocks.slice(0, 2), [
    { type: "tool_removal", tool: { type: "tool_reference", name: "recommend_next" } },
    { type: "tool_removal", tool: { type: "tool_reference", name: "Skill" } },
  ]);
  assert.deepEqual(blocks.slice(2).map((b) => b.type), ["tool_addition", "tool_addition"]);
  assert.deepEqual(blocks.slice(2).map((b) => b.tool.name), order.filter((n) => n === "snapshot_project" || n === "set_ease"));
  assert.deepEqual(toolChangeBlocks(tools, new Set(["a"]), new Set(["a"])), []);
});

test("the hand-over's system message: tool changes first, then the body; either can be alone", () => {
  const change = { type: "tool_removal", tool: { type: "tool_reference", name: "Skill" } };
  assert.deepEqual(skillSystemMessage("BODY", [change]), { role: "system", content: [change, { type: "text", text: "BODY" }] });
  assert.deepEqual(skillSystemMessage("BODY"), { role: "system", content: [{ type: "text", text: "BODY" }] });
  assert.deepEqual(skillSystemMessage(null, [change]), { role: "system", content: [change] });
});

test("tools on Haiku 5.5: exactly the skill's, in the server's order, as the server describes them", () => {
  const p = lesson("ease-mentor", HAIKU);
  const serverOrder = server.tools.map((t) => t.name).filter((n) => readSkill(SKILLS, "ease-mentor").allowedTools.includes(n));
  assert.deepEqual(p.tools.map((t) => t.name), serverOrder);
  assert.equal(p.tools.length, 6);
  for (const t of p.tools) {
    const s = server.tools.find((x) => x.name === t.name);
    assert.deepEqual(t, { name: s.name, description: s.description, input_schema: s.inputSchema });
  }
  assert.ok(!p.tools.some((t) => t.name === "offset_snapshot" || t.name === "Skill"), "an unlisted tool is absent");
  assert.deepEqual([...p.allowed].sort(), serverOrder.slice().sort());
  assert.equal(p.toolChanges, false);
});

test("each skill offers only its own tools; only next-mentor offers the hand-over tool", () => {
  for (const patch of [undefined, HAIKU]) {
    for (const name of ["anchor-mentor", "key-types-mentor", "null-parenting-mentor", "offset-mentor", "speed-graph-mentor"]) {
      const p = lesson(name, patch);
      const want = readSkill(SKILLS, name).allowedTools.filter((t) => server.tools.some((s) => s.name === t));
      assert.deepEqual(offered(p).sort(), want.sort(), name);
      assert.ok(!p.allowed.has("Skill"));
    }
    const next = lesson("next-mentor", patch);
    assert.deepEqual(offered(next), ["read_learner_record", "recommend_next", "Skill"]);
    assert.deepEqual(next.tools.find((t) => t.name === "Skill"), { name: "Skill", description: skillTool.description, input_schema: skillTool.input_schema });
  }
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
