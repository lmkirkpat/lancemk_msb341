// Spec 014 T105 (A): an accepted give_answer ends the turn in the helper's loop, with no further
// request, so no words can follow the answer (FR-009, PQ-1). A refusal lets the turn go on. The
// conversation is saved at the answer and continues from it.
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createLesson, createClient } from "../lib/loop.mjs";
import { answerAccepted } from "../lib/answer-end.mjs";
import { createMcpClient } from "../lib/mcp-client.mjs";
import { saveConversation, loadConversation, isCompleteHistory } from "../lib/conversation.mjs";
import { loadSettings, HELPER_DIR } from "../lib/settings.mjs";
import { loadPreamble, loadSkillTool, withoutBreakpoints } from "../lib/prompt.mjs";
import { startFakeService, reply, text, thinking, toolUse } from "./fake-service.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SERVER = path.join(HERE, "fixtures", "answer-server.mjs");
const KEY = "sk-ant-api03-ANSWERENDKEY_abcdefghijklm";
const { settings: SETTINGS, prices } = loadSettings();
const preamble = loadPreamble(HELPER_DIR);
const skillTool = loadSkillTool(HELPER_DIR);
const ASK_BODY = "# Ask (test)\n\nRead, then answer with give_answer.\n";
const REPLY = (kind, explanation) => JSON.stringify({ kind, comp: "Intro", explanation, steps: [], offered_skills: [], closing_offer: null, runtime: "a", tags: {} });

// ---------- the rule ----------

test("answerAccepted: only give_answer's accepted reply; a refusal, an error, another tool or odd content isn't", () => {
  assert.equal(answerAccepted("give_answer", [{ type: "text", text: REPLY("describe", "In Intro, it's a matte.") }], false), true);
  for (const kind of ["answer", "describe", "howto", "clarify", "outside", "no_comp"]) assert.equal(answerAccepted("give_answer", [{ type: "text", text: REPLY(kind, "x") }], false), true, kind);
  assert.equal(answerAccepted("give_answer", [{ type: "text", text: "KIND_MISMATCH: An answer has one to four steps." }], true), false, "a refusal");
  assert.equal(answerAccepted("give_answer", [{ type: "text", text: REPLY("describe", "x") }], true), false, "an error flag wins");
  assert.equal(answerAccepted("describe_layers", [{ type: "text", text: REPLY("describe", "x") }], false), false);
  assert.equal(answerAccepted("snapshot_project", [{ type: "text", text: REPLY("describe", "x") }], false), false);
  assert.equal(answerAccepted("give_answer", [{ type: "text", text: REPLY("lesson", "x") }], false), false, "unknown kind");
  assert.equal(answerAccepted("give_answer", [{ type: "text", text: "{}" }, { type: "text", text: "{}" }], false), false);
  assert.equal(answerAccepted("give_answer", [{ type: "image", source: {} }], false), false);
  assert.equal(answerAccepted("give_answer", null, false), false);
});

// ---------- in the loop ----------

const cleanups = [];
afterEach(async () => {
  while (cleanups.length) await cleanups.pop()();
});

async function setup(patch, resume) {
  const svc = await startFakeService();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "AEMentor-answer-end-"));
  const home = path.join(dir, "home");
  const skillsDir = path.join(dir, "skills");
  fs.mkdirSync(home);
  fs.mkdirSync(path.join(skillsDir, "ask-mentor"), { recursive: true });
  fs.writeFileSync(path.join(skillsDir, "ask-mentor", "SKILL.md"), `---\nname: ask-mentor\ndescription: A test skill.\nallowed-tools: mcp__ae-mentor__describe_layers, mcp__ae-mentor__give_answer\n---\n${ASK_BODY}`);
  const mcpConfig = path.join(dir, ".mcp.json");
  fs.writeFileSync(mcpConfig, JSON.stringify({ mcpServers: { "ae-mentor": { command: "node", args: [SERVER] } } }));
  const mcp = createMcpClient({ mcpConfig, home });
  const logs = [];
  const saves = [];
  const settings = Object.freeze({ ...SETTINGS, ...(patch || {}) });
  const lesson = createLesson({
    getClient: async () => createClient({ apiKey: KEY, baseURL: svc.url, log: (e) => logs.push(e) }),
    mcp, settings, prices, preamble, skillTool, skillsDir,
    log: (e) => logs.push(e),
    onComplete: (s) => saves.push(JSON.parse(JSON.stringify(s))),
    ...(resume ? { resume } : {}),
  });
  cleanups.push(async () => {
    await mcp.stop();
    await svc.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });
  let events = [];
  const emit = (type, payload) => events.push({ type, ...payload });
  return { svc, home, lesson, logs, saves, settings, turn: async (t) => { events = []; const r = await lesson.runTurn(t, emit); return { r, events }; } };
}

const bodies = (svc) => svc.messageRequests.map((r) => r.body);
const MODELS = [
  ["Opus 5.5 (tool changes)", null],
  ["Haiku 5.5 (replaced list)", { model: "claude-haiku-5-5", fallbacks: null, thinking_display: "omitted" }],
];

for (const [label, patch] of MODELS) {
  test(`${label}: an accepted give_answer ends the turn: no request after it, so no words after it`, async () => {
    const s = await setup(patch);
    s.svc.script(
      reply([thinking("", "t1"), toolUse("describe_layers", {}, "tu_read")], { stop_reason: "tool_use" }),
      reply([toolUse("give_answer", { kind: "describe", explanation: "In Intro, Window Matte is a matte." }, "tu_ans")], { stop_reason: "tool_use" }),
      reply([text("Your answer about Window Matte is in the panel.")]), // what -p wrote after it; never asked for now
    );
    const { r, events } = await s.turn("/ask-mentor Why can't I see Window Matte?");
    assert.deepEqual(s.svc.rejected, []);
    assert.equal(r.ok, true);
    assert.equal(r.error_kind, null);
    assert.equal(r.steps, 2, "two requests, not three");
    assert.equal(bodies(s.svc).length, 2);
    const last = events.findIndex((e) => e.type === "tool_result" && e.name === "give_answer");
    assert.ok(last >= 0);
    assert.equal(events.slice(last + 1).some((e) => e.type === "text" || e.type === "text_delta"), false, "nothing written after the answer");
    assert.ok(s.logs.some((e) => e.event === "answer_ended_turn" && e.step === 2));
    const m = s.lesson.messages;
    assert.equal(m.at(-1).role, "user");
    assert.equal(m.at(-1).content[0].type, "tool_result");
    assert.equal(m.at(-1).content[0].tool_use_id, "tu_ans");
    assert.equal(isCompleteHistory(m), true, "it ends on a complete exchange");
  });

  test(`${label}: a refused give_answer lets the turn go on; the accepted retry ends it`, async () => {
    const s = await setup(patch);
    s.svc.script(
      reply([toolUse("describe_layers", {}, "tu_read")], { stop_reason: "tool_use" }),
      reply([toolUse("give_answer", { kind: "describe", explanation: "" }, "tu_bad")], { stop_reason: "tool_use" }),
      reply([toolUse("give_answer", { kind: "describe", explanation: "In Intro, it's a matte." }, "tu_ok")], { stop_reason: "tool_use" }),
      reply([text("Never asked for.")]),
    );
    const { r, events } = await s.turn("/ask-mentor Why can't I see Window Matte?");
    assert.equal(r.ok, true);
    assert.equal(bodies(s.svc).length, 3, "the refusal went back to the model; nothing after the accepted one");
    const results = events.filter((e) => e.type === "tool_result" && e.name === "give_answer").map((e) => e.ok);
    assert.deepEqual(results, [false, true]);
    const refused = withoutBreakpoints(bodies(s.svc)[2].messages).flatMap((x) => (Array.isArray(x.content) ? x.content : [])).find((b) => b.type === "tool_result" && b.tool_use_id === "tu_bad");
    assert.equal(refused.is_error, true);
  });

  test(`${label}: a turn with no give_answer ends as before, on the model's own end`, async () => {
    const s = await setup(patch);
    s.svc.script(reply([toolUse("describe_layers", {}, "tu_read")], { stop_reason: "tool_use" }), reply([text("Which layer do you mean?")]));
    const { r } = await s.turn("/ask-mentor Why?");
    assert.equal(r.ok, true);
    assert.equal(bodies(s.svc).length, 2);
    assert.equal(s.logs.some((e) => e.event === "answer_ended_turn"), false);
  });

  test(`${label}: saved at the answer, the conversation continues from it: the next message joins its result`, async () => {
    const s = await setup(patch);
    s.svc.script(
      reply([toolUse("describe_layers", {}, "tu_read")], { stop_reason: "tool_use" }),
      reply([toolUse("give_answer", { kind: "describe", explanation: "In Intro, Window Matte is a matte." }, "tu_ans")], { stop_reason: "tool_use" }),
    );
    await s.turn("/ask-mentor Why can't I see Window Matte?");
    const saved = s.saves.at(-1);
    assert.deepEqual(saved.messages, JSON.parse(JSON.stringify(s.lesson.messages)), "the last save is the answer's mark");
    const store = fs.mkdtempSync(path.join(os.tmpdir(), "AEMentor-answer-end-save-"));
    cleanups.push(async () => fs.rmSync(store, { recursive: true, force: true }));
    assert.deepEqual(saveConversation({ home: store, sessionId: "sess-1", settingsHash: "h", model: s.settings.model, prompt: saved.prompt, messages: saved.messages }), { saved: true });
    const back = loadConversation({ home: store, sessionId: "sess-1", model: s.settings.model });
    assert.equal(back.ok, true);

    // In this helper: the next message goes after the answer's result.
    s.svc.script(reply([toolUse("describe_layers", {}, "tu_read2")], { stop_reason: "tool_use" }), reply([toolUse("give_answer", { kind: "describe", explanation: "In Intro, Card uses it." }, "tu_ans2")], { stop_reason: "tool_use" }));
    const t2 = await s.turn("Which layer uses it?");
    assert.equal(t2.r.ok, true);
    assert.deepEqual(s.svc.rejected, []);
    const third = withoutBreakpoints(bodies(s.svc)[2].messages);
    const joined = third.filter((x) => x.role === "user").at(-1).content;
    assert.equal(joined[0].type, "tool_result");
    assert.equal(joined[0].tool_use_id, "tu_ans");
    assert.equal(joined.at(-1).text, "Which layer uses it?");

    // In a new helper (the panel reopened): continued from the saved file, and it goes on the same way.
    const again = await setup(patch, back.conversation);
    again.svc.script(reply([toolUse("give_answer", { kind: "describe", explanation: "In Intro, Card uses it." }, "tu_ans3")], { stop_reason: "tool_use" }), reply([text("Never asked for.")]));
    const t3 = await again.turn("Which layer uses it?");
    assert.equal(t3.r.ok, true);
    assert.deepEqual(again.svc.rejected, []);
    assert.equal(bodies(again.svc).length, 1, "continued, answered, ended");
    const first = withoutBreakpoints(bodies(again.svc)[0].messages);
    assert.equal(first.filter((x) => x.role === "user").at(-1).content[0].tool_use_id, "tu_ans", "the saved answer is in the history");
  });
}
