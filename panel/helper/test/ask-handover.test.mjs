// Spec 014 T002 (phase 0, research R4 and R5): does the helper already hand a lesson over the way
// Go deeper needs, on the fake service? Two test skills in a temporary skills folder: ask-mentor
// (a tool that saves a value in session.json, plus Skill) hands over to handin-mentor (a tool that
// reads it). A stand-in server (fixtures/session-server.mjs) does the saving and reading, so this
// checks the helper only, not ae-mentor's hand-in (that's T045 onward).
//
// The four claims: (1) a *-mentor skill with Skill in its tools hands over to another; (2) the
// conversation is kept; (3) the tools on offer switch to the second skill's; (4) a value written to
// session.json by a tool before the switch is read by a tool after it; and (5) a later
// "/ask-mentor …" message switches back. Run on Opus 5.5 (tool changes, D2) and Haiku 5.5 (the
// replaced list).

import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createLesson, createClient } from "../lib/loop.mjs";
import { createMcpClient } from "../lib/mcp-client.mjs";
import { loadSettings, HELPER_DIR } from "../lib/settings.mjs";
import { loadPreamble, loadSkillTool, withoutBreakpoints } from "../lib/prompt.mjs";
import { startFakeService, reply, text, thinking, toolUse } from "./fake-service.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SERVER = path.join(HERE, "fixtures", "session-server.mjs");
const KEY = "sk-ant-api03-HANDOVERKEY_abcdefghijklm";
const { settings: SETTINGS, prices } = loadSettings();
const preamble = loadPreamble(HELPER_DIR);
const skillTool = loadSkillTool(HELPER_DIR);

const ASK = { name: "ask-mentor", tools: ["note_value", "Skill"], body: "# Ask (test)\n\nAnswer, save the step, offer to go deeper.\n" };
const LESSON = { name: "handin-mentor", tools: ["read_value"], body: "# Hand-in lesson (test)\n\nRead the hand-in and teach.\n" };

function writeSkill(dir, s) {
  fs.mkdirSync(path.join(dir, s.name), { recursive: true });
  const tools = s.tools.map((t) => (t === "Skill" ? t : `mcp__ae-mentor__${t}`)).join(", ");
  fs.writeFileSync(path.join(dir, s.name, "SKILL.md"), `---\nname: ${s.name}\ndescription: A test skill.\nallowed-tools: ${tools}\n---\n${s.body}`);
}

const cleanups = [];
afterEach(async () => {
  while (cleanups.length) await cleanups.pop()();
});

async function setup(patch) {
  const svc = await startFakeService();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "AEMentor-handover-"));
  const home = path.join(dir, "home");
  const skillsDir = path.join(dir, "skills");
  fs.mkdirSync(home);
  writeSkill(skillsDir, ASK);
  writeSkill(skillsDir, LESSON);
  const mcpConfig = path.join(dir, ".mcp.json");
  fs.writeFileSync(mcpConfig, JSON.stringify({ mcpServers: { "ae-mentor": { command: "node", args: [SERVER] } } }));
  const mcp = createMcpClient({ mcpConfig, home });
  const logs = [];
  const lesson = createLesson({
    getClient: async () => createClient({ apiKey: KEY, baseURL: svc.url, log: (e) => logs.push(e) }),
    mcp,
    settings: Object.freeze({ ...SETTINGS, ...(patch || {}) }),
    prices,
    preamble,
    skillTool,
    skillsDir,
    log: (e) => logs.push(e),
  });
  cleanups.push(async () => {
    await mcp.stop();
    await svc.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });
  let events = [];
  const emit = (type, payload) => events.push({ type, ...payload });
  return {
    svc,
    home,
    lesson,
    logs,
    turn: async (t) => {
      events = [];
      const r = await lesson.runTurn(t, emit);
      return { r, events };
    },
  };
}

const bodies = (svc) => svc.messageRequests.map((r) => r.body);

// What the model can call at a request: tools declared without defer_loading, then each
// tool_removal and tool_addition in the messages, in order. Sorted.
function offeredIn(body) {
  const offered = new Set((body.tools || []).filter((t) => !t.defer_loading).map((t) => t.name));
  for (const m of body.messages) {
    if (m.role !== "system") continue;
    for (const b of m.content) {
      if (b.type === "tool_removal") offered.delete(b.tool.name);
      else if (b.type === "tool_addition") offered.add(b.tool.name);
    }
  }
  return [...offered].sort();
}

// next's messages start with prev's, byte for byte (cache markers aside); only prev's last message
// may have gained blocks at its end.
function extendsHistory(prevBody, nextBody) {
  const prev = JSON.parse(JSON.stringify(withoutBreakpoints(prevBody.messages)));
  const next = JSON.parse(JSON.stringify(withoutBreakpoints(nextBody.messages)));
  if (next.length < prev.length) return false;
  const last = prev.length - 1;
  for (let j = 0; j < last; j++) if (JSON.stringify(prev[j]) !== JSON.stringify(next[j])) return false;
  if (last < 0) return true;
  const a = prev[last];
  const b = next[last];
  if (JSON.stringify(a) === JSON.stringify(b)) return true;
  return a.role === b.role && b.content.length > a.content.length && JSON.stringify(b.content.slice(0, a.content.length)) === JSON.stringify(a.content);
}

// The JSON a tool result carried, found by its tool_use id in a request's history.
function resultJson(body, id) {
  for (const m of body.messages) {
    if (m.role !== "user" || !Array.isArray(m.content)) continue;
    const r = m.content.find((b) => b.type === "tool_result" && b.tool_use_id === id);
    if (r) return { isError: Boolean(r.is_error), json: JSON.parse(withoutBreakpoints(r.content)[0].text) };
  }
  return null;
}

const systemTexts = (body) => body.messages.filter((m) => m.role === "system").map((m) => m.content.filter((b) => b.type === "text").map((b) => b.text).join(""));

const MODELS = [
  ["Opus 5.5 (tool changes)", null],
  ["Haiku 5.5 (replaced list)", { model: "claude-haiku-5-5", fallbacks: null, thinking_display: "omitted" }],
];

for (const [label, patch] of MODELS) {
  // Turn 1: the ask answers, saves a value, then hands over; the lesson reads the value.
  // Turn 2: the panel's "/ask-mentor I've ended that lesson." switches back.
  async function run() {
    const s = await setup(patch);
    s.svc.script(
      reply([thinking("", "a1"), text("Your logo shakes from its parent."), toolUse("note_value", { value: "step-2:Shake Control" }, "tu_note")], { stop_reason: "tool_use" }),
      reply([toolUse("Skill", { skill: "handin-mentor" }, "tu_skill")], { stop_reason: "tool_use" }),
      reply([toolUse("read_value", {}, "tu_read")], { stop_reason: "tool_use" }),
      reply([text("Let's set the pivot on Shake Control.")]),
      reply([text("That was step 2; next is step 3.")]),
      reply([toolUse("read_value", {}, "tu_read_after")], { stop_reason: "tool_use" }),
      reply([text("Ok.")]),
    );
    const t1 = await s.turn("/ask-mentor Why does my logo shake?");
    const t2 = await s.turn("/ask-mentor I've ended that lesson.");
    const t3 = await s.turn("And the next one?");
    return { s, t1, t2, t3, b: bodies(s.svc) };
  }

  test(`${label}: (1) an ask-mentor skill with Skill in its tools hands over to another`, async () => {
    const { s, t1, b } = await run();
    assert.deepEqual(s.svc.rejected, [], "the fake service refused a request");
    assert.equal(t1.r.ok, true);
    assert.equal(t1.r.skill, "handin-mentor");
    assert.deepEqual(t1.events.find((e) => e.type === "skill_loaded"), { type: "skill_loaded", skill: "handin-mentor" });
    // The new skill's body goes in as a mid-conversation system message, once.
    assert.equal(systemTexts(b[2]).filter((t) => t === LESSON.body).length, 1);
    assert.equal(systemTexts(b[0]).some((t) => t === LESSON.body), false);
  });

  test(`${label}: (2) the conversation is kept across the hand-over and back`, async () => {
    const { s, b } = await run();
    assert.equal(b.length, 7);
    for (let i = 1; i < b.length; i++) {
      assert.ok(extendsHistory(b[i - 1], b[i]), `request ${i + 1} doesn't extend request ${i}`);
      assert.equal(JSON.stringify(b[i].system), JSON.stringify(b[0].system), `request ${i + 1} changed the system prompt`);
    }
    const first = withoutBreakpoints(b[6].messages[0].content);
    assert.equal(first[0].text, "/ask-mentor Why does my logo shake?", "the learner's first words are still there");
    assert.deepEqual(s.lesson.messages.length, withoutBreakpoints(b[6].messages).length + 1, "the last answer was kept too");
  });

  test(`${label}: (3) the tools on offer switch to the second skill's`, async () => {
    const { b } = await run();
    assert.deepEqual(offeredIn(b[0]), ["Skill", "note_value"]);
    assert.deepEqual(offeredIn(b[1]), ["Skill", "note_value"]);
    assert.deepEqual(offeredIn(b[2]), ["read_value"]);
    assert.deepEqual(offeredIn(b[3]), ["read_value"]);
    for (const x of b) assert.ok(!offeredIn(x).includes("other_tool"), "a tool neither skill lists is never on offer");
  });

  test(`${label}: (4) a session.json value written before the switch is read after it`, async () => {
    const { s, b } = await run();
    const saved = resultJson(b[1], "tu_note");
    const read = resultJson(b[3], "tu_read");
    assert.equal(saved.isError, false);
    assert.equal(read.isError, false);
    assert.deepEqual(read.json.session, { hand_in: { value: "step-2:Shake Control" } });
    assert.equal(read.json.pid, saved.json.pid, "the same server process answered both calls");
    assert.ok(fs.existsSync(path.join(s.home, "session.json")), "session.json is in the learner home");
  });

  test(`${label}: (5) a mid-conversation /ask-mentor command switches back`, async () => {
    const { s, t2, t3, b } = await run();
    assert.equal(t2.r.ok, true);
    assert.equal(t2.r.skill, "ask-mentor");
    assert.deepEqual(t2.events.find((e) => e.type === "skill_loaded"), { type: "skill_loaded", skill: "ask-mentor" });
    assert.equal(s.lesson.skill, "ask-mentor");
    // The command's text goes to the model unchanged, with the ask skill's body after it.
    const last = withoutBreakpoints(b[4].messages);
    assert.equal(last.at(-2).role, "user");
    assert.equal(last.at(-2).content.at(-1).text, "/ask-mentor I've ended that lesson.");
    assert.equal(last.at(-1).role, "system");
    assert.equal(systemTexts(b[4]).at(-1), ASK.body);
    assert.deepEqual(offeredIn(b[4]), ["Skill", "note_value"]);
    // Back on the ask, the lesson's read tool is refused with the fixed answer.
    assert.equal(t3.r.skill, "ask-mentor");
    const refused = b[6].messages.flatMap((m) => (m.role === "user" ? m.content : [])).find((x) => x.type === "tool_result" && x.tool_use_id === "tu_read_after");
    assert.equal(refused.is_error, true);
    assert.ok(s.logs.some((l) => l.event === "tool_not_allowed" && l.name === "read_value"));
  });
}

// R4: on A the helper tells the server it's on A, so give_answer can offer skills and go_deeper can
// hand in. Not built yet: that's T028 (serverEnv in lib/mcp-client.mjs).
test("R4: the server is started with AE_MENTOR_RUNTIME=a", { todo: "serverEnv (lib/mcp-client.mjs:44) doesn't set it yet; T028 builds it" }, async () => {
  const s = await setup();
  s.svc.script(reply([toolUse("note_value", { value: "x" }, "tu_n")], { stop_reason: "tool_use" }), reply([text("Ok.")]));
  await s.turn("/ask-mentor hi");
  assert.equal(resultJson(bodies(s.svc)[1], "tu_n").json.runtime, "a");
});
