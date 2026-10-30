import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createLesson, createClient, echoContent, BETAS, NOT_AVAILABLE, NO_SUCH_SKILL } from "../lib/loop.mjs";
import { createMcpClient } from "../lib/mcp-client.mjs";
import { loadSettings, HELPER_DIR } from "../lib/settings.mjs";
import { loadPreamble, loadSkillTool, withoutBreakpoints } from "../lib/prompt.mjs";
import { readSkill } from "../lib/skills.mjs";
import { createRequestLog } from "../lib/request-log.mjs";
import { startFakeService, reply, failure, drop, text, thinking, toolUse, fallbackBlock } from "./fake-service.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const SKILLS = path.join(REPO, ".claude", "skills");
const FIXTURE = path.join(REPO, "product", "evals", "easing", "fixtures", "before.json");
const KEY = "sk-ant-api03-LOOPKEY_abcdefghijklm";
const { settings: SETTINGS, prices } = loadSettings();
const preamble = loadPreamble(HELPER_DIR);
const skillTool = loadSkillTool(HELPER_DIR);

const cleanups = [];
afterEach(async () => {
  while (cleanups.length) await cleanups.pop()();
});

async function setup({ patch, noKey } = {}) {
  const svc = await startFakeService();
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "AEMentor-loop-"));
  const state = path.join(home, "fixture-state.json");
  fs.writeFileSync(state, JSON.stringify({ project: FIXTURE }));
  const mcp = createMcpClient({ mcpConfig: path.join(REPO, ".mcp.json"), home, fixtureEnv: { AE_MENTOR_FIXTURE_STATE: state } });
  const settings = Object.freeze({ ...SETTINGS, ...(patch || {}) });
  const logs = [];
  const reqLogFile = path.join(home, "requests.jsonl");
  const lesson = createLesson({
    getClient: async () => (noKey ? null : createClient({ apiKey: KEY, baseURL: svc.url, timeoutMs: settings.turn_timeout_ms })),
    mcp,
    settings,
    prices,
    preamble,
    skillTool,
    skillsDir: SKILLS,
    requestLog: createRequestLog(reqLogFile, KEY),
    log: (e) => logs.push(e),
  });
  let events = [];
  const emit = (type, payload) => events.push({ type, ...payload });
  cleanups.push(async () => {
    await mcp.stop();
    await svc.close();
    fs.rmSync(home, { recursive: true, force: true });
  });
  return {
    svc,
    home,
    mcp,
    logs,
    lesson,
    reqLogFile,
    turn: async (t) => {
      events = [];
      const r = await lesson.runTurn(t, emit);
      return { r, events };
    },
    calls: () => (fs.existsSync(path.join(home, "calls.jsonl")) ? fs.readFileSync(path.join(home, "calls.jsonl"), "utf8") : ""),
  };
}

const bodies = (svc) => svc.messageRequests.map((r) => r.body);
const betasOf = (req) => (req.headers["anthropic-beta"] || "").split(",").map((s) => s.trim()).filter(Boolean);

// Every request's messages start with the previous request's, byte for byte (cache markers aside),
// and the system prompt never changes within a lesson.
function assertAppendOnly(svc) {
  const b = bodies(svc);
  for (let i = 1; i < b.length; i++) {
    const prev = JSON.stringify(withoutBreakpoints(b[i - 1].messages));
    const next = JSON.stringify(withoutBreakpoints(b[i].messages.slice(0, b[i - 1].messages.length)));
    assert.equal(next, prev, `request ${i + 1} rewrote the history of request ${i}`);
    assert.equal(JSON.stringify(b[i].system), JSON.stringify(b[0].system), `request ${i + 1} changed the system prompt`);
  }
}

test("an easing turn end to end: the request, the events, the tool through ae-mentor", async () => {
  const s = await setup();
  s.svc.script(
    reply([thinking("", "sig-one"), text("Let me look at your comp."), toolUse("snapshot_project", {}, "tu_snap")], { stop_reason: "tool_use", usage: { input_tokens: 5000, cache_creation_input_tokens: 4000, output_tokens: 80 } }),
    reply([thinking("Checking the pairs.", "sig-two"), text("Your Title layer moves at one speed.")], { usage: { input_tokens: 200, cache_read_input_tokens: 9000, output_tokens: 40 } }),
  );
  const { r, events } = await s.turn("/ease-mentor");

  assert.equal(r.ok, true);
  assert.equal(r.error_kind, null);
  assert.equal(r.steps, 2);
  assert.equal(r.skill, "ease-mentor");
  assert.equal(r.model, "claude-opus-5-5");
  assert.equal(r.other_model, false);
  assert.deepEqual(r.tokens, { input: 5200, cache_write: 4000, cache_read: 9000, output: 120 });
  assert.equal(r.cost_usd, (5000 * 4 + 4000 * 5 + 80 * 20 + 200 * 4 + 9000 * 0.2 + 40 * 20) / 1e6);
  assert.match(r.prompt_hash, /^[0-9a-f]{64}$/);

  // Events: words stream, complete blocks, the call with its input, its result whole. No thinking.
  const types = events.map((e) => e.type);
  assert.ok(types.indexOf("text_delta") < types.indexOf("text"));
  assert.deepEqual(events.filter((e) => e.type === "text").map((e) => e.text), ["Let me look at your comp.", "Your Title layer moves at one speed."]);
  assert.equal(events.filter((e) => e.type === "text_delta").map((e) => e.text).join(""), "Let me look at your comp.Your Title layer moves at one speed.");
  const call = events.find((e) => e.type === "tool_call");
  assert.deepEqual(call, { type: "tool_call", id: "tu_snap", name: "snapshot_project", input: {} });
  const result = events.find((e) => e.type === "tool_result");
  assert.equal(result.id, "tu_snap");
  assert.equal(result.ok, true);
  assert.equal(typeof result.json, "object");
  assert.deepEqual(result.images, []);
  assert.ok(types.indexOf("tool_call") < types.indexOf("tool_result"));
  assert.ok(!events.some((e) => JSON.stringify(e).includes("Checking the pairs")), "thinking is never shown");
  assert.match(s.calls(), /"tool":"snapshot_project"/);

  // The first request.
  const [b0, b1] = bodies(s.svc);
  assert.equal(b0.model, "claude-opus-5-5");
  assert.equal(b0.max_tokens, 32000);
  assert.deepEqual(b0.thinking, { type: "adaptive", display: "updates" });
  assert.deepEqual(b0.output_config, { effort: "medium" });
  assert.equal(b0.fallbacks, "default");
  assert.equal(b0.tool_choice, undefined);
  assert.equal(b0.betas, undefined, "betas travel as a header");
  assert.deepEqual(betasOf(s.svc.messageRequests[0]).sort(), [BETAS.fallback, BETAS.updates].sort());
  assert.equal(b0.system.length, 3);
  assert.equal(b0.system[2].text, readSkill(SKILLS, "ease-mentor").body);
  assert.deepEqual(b0.tools.map((t) => t.name).sort(), readSkill(SKILLS, "ease-mentor").allowedTools.slice().sort());
  assert.deepEqual(b0.messages, [{ role: "user", content: [{ type: "text", text: "/ease-mentor", cache_control: { type: "ephemeral", ttl: "5m" } }] }]);

  // The second: the assistant turn exactly as received (thinking and its signature), the result whole.
  assert.deepEqual(b1.messages[1], {
    role: "assistant",
    content: [
      { type: "thinking", thinking: "", signature: "sig-one" },
      { type: "text", text: "Let me look at your comp." },
      { type: "tool_use", id: "tu_snap", name: "snapshot_project", input: {} },
    ],
  });
  const tr = b1.messages[2].content[0];
  assert.equal(tr.type, "tool_result");
  assert.equal(tr.tool_use_id, "tu_snap");
  assert.equal(tr.is_error, undefined);
  assert.equal(tr.content[0].type, "text");
  assert.deepEqual(tr.cache_control, { type: "ephemeral", ttl: "5m" }, "the breakpoint on the newest message's last block");
  assert.equal(b1.messages[0].content[0].cache_control, undefined, "the earlier breakpoint moved");
  assertAppendOnly(s.svc);

  // A second turn continues the same history.
  s.svc.script(reply([text("Try it on the Title's Position.")]));
  const t2 = await s.turn("Can I have a hint?");
  assert.equal(t2.r.ok, true);
  assertAppendOnly(s.svc);
  const b2 = bodies(s.svc)[2];
  assert.equal(b2.messages.length, 5);
  assert.deepEqual(b2.messages[3].content[0], { type: "thinking", thinking: "Checking the pairs.", signature: "sig-two" });
  assert.equal(b2.messages[4].content[0].text, "Can I have a hint?");

  // The request log has every request, with its betas, and no key.
  const lines = fs.readFileSync(s.reqLogFile, "utf8").trim().split("\n").map((l) => JSON.parse(l));
  assert.equal(lines.length, 3);
  assert.deepEqual(lines.map((l) => l.turn), [1, 1, 2]);
  assert.ok(lines[0].betas.includes(BETAS.updates));
  assert.doesNotMatch(fs.readFileSync(s.reqLogFile, "utf8"), /LOOPKEY/);
  assert.equal(s.svc.messageRequests[0].headers.authorization, `Bearer ${KEY}`, "the key goes to the service only");
});

test("a frame goes back to the model as an image, and to the panel as images", async () => {
  const s = await setup();
  s.svc.script(reply([toolUse("preview_frame", { time: 0.5 }, "tu_f")], { stop_reason: "tool_use" }), reply([text("Here's your comp.")]));
  const { r, events } = await s.turn("/ease-mentor");
  assert.equal(r.ok, true);
  const ev = events.find((e) => e.type === "tool_result");
  assert.equal(ev.images.length, 1);
  assert.equal(ev.images[0].mimeType, "image/png");
  const sent = bodies(s.svc)[1].messages[2].content[0].content;
  assert.equal(sent[0].type, "image");
  assert.deepEqual(Object.keys(sent[0].source).sort(), ["data", "media_type", "type"]);
  assert.equal(sent[0].source.type, "base64");
  assert.equal(sent[0].source.data, ev.images[0].data);
  assert.equal(sent[1].type, "text");
});

test("a tool the skill doesn't list isn't run: an error result, and the name is logged", async () => {
  const s = await setup();
  s.svc.script(reply([toolUse("offset_snapshot", {}, "tu_x")], { stop_reason: "tool_use" }), reply([text("Sorry.")]));
  const { r, events } = await s.turn("/ease-mentor");
  assert.equal(r.ok, true);
  const res = events.find((e) => e.type === "tool_result");
  assert.equal(res.ok, false);
  assert.equal(res.text, NOT_AVAILABLE);
  const tr = bodies(s.svc)[1].messages[2].content[0];
  assert.equal(tr.is_error, true);
  assert.deepEqual(withoutBreakpoints(tr.content), [{ type: "text", text: NOT_AVAILABLE }]);
  assert.doesNotMatch(s.calls(), /offset_snapshot/, "never reached the server");
  assert.deepEqual(s.logs.find((l) => l.event === "tool_not_allowed"), { event: "tool_not_allowed", name: "offset_snapshot" });
});

test("the step limit ends the turn without an answer and no error; the lesson goes on", async () => {
  const s = await setup({ patch: { max_steps: 2 } });
  s.svc.script(reply([toolUse("snapshot_project", {}, "a")], { stop_reason: "tool_use" }), reply([toolUse("snapshot_project", {}, "b")], { stop_reason: "tool_use" }));
  const { r, events } = await s.turn("/ease-mentor");
  assert.equal(r.ok, false);
  assert.equal(r.error_kind, null);
  assert.equal(r.steps, 2);
  assert.equal(s.svc.messageRequests.length, 2);
  assert.equal(events.filter((e) => e.type === "tool_result").length, 2);
  assert.equal(s.lesson.messages.length, 5, "every call made has its result in the history");
  s.svc.script(reply([text("Where were we?")]));
  assert.equal((await s.turn("Hello?")).r.ok, true);
  assertAppendOnly(s.svc);
});

test("the 5-minute timeout (shortened here) ends the turn with timeout and takes it back", async () => {
  const s = await setup({ patch: { turn_timeout_ms: 400 } });
  s.svc.script(reply([text("One.")]));
  await s.turn("/ease-mentor");
  const before = s.lesson.messages.length;
  s.svc.script(reply([text("never")], { hang: true }));
  const started = Date.now();
  const { r } = await s.turn("Check my work.");
  assert.equal(r.error_kind, "timeout");
  assert.equal(r.ok, false);
  assert.ok(Date.now() - started < 3000);
  assert.equal(s.lesson.messages.length, before, "nothing from the timed-out turn is kept");
  s.svc.script(reply([text("Back.")]));
  assert.equal((await s.turn("Check my work.")).r.ok, true);
});

test("a refusal ends the turn as refused; its category is logged, never the learner's text", async () => {
  const s = await setup();
  s.svc.script(reply([], { stop_reason: "refusal", stop_details: { type: "refusal", category: "cyber", explanation: "x" } }));
  const { r } = await s.turn("/ease-mentor secret words");
  assert.equal(r.error_kind, "refused");
  assert.equal(s.lesson.messages.length, 0);
  assert.deepEqual(s.logs.find((l) => l.event === "refused"), { event: "refused", category: "cyber" });
  assert.doesNotMatch(JSON.stringify(s.logs), /secret words/);
});

test("an answer from another model is marked; a fallback's declined attempt isn't sent back", async () => {
  const s = await setup();
  s.svc.script(
    reply([thinking("", "declined"), toolUse("set_ease", {}, "cut"), fallbackBlock("claude-opus-5-5", "claude-opus-5"), text("Let's look together.")], { model: "claude-opus-5" }),
  );
  const { r, events } = await s.turn("/ease-mentor");
  assert.equal(r.ok, true);
  assert.equal(r.other_model, true);
  assert.equal(r.model, "claude-opus-5");
  assert.equal(r.cost_usd, null, "no price row for the fallback model: unknown, not 0");
  assert.ok(!events.some((e) => e.type === "tool_result"), "the declined attempt's call is never run");
  assert.deepEqual(s.lesson.messages[1].content, [{ type: "fallback", from: { model: "claude-opus-5-5" }, to: { model: "claude-opus-5" } }, { type: "text", text: "Let's look together." }]);
  assert.deepEqual(echoContent([text("a"), thinking("", "s"), fallbackBlock("x", "y"), thinking("", "t"), text("b")]), [text("a"), fallbackBlock("x", "y"), thinking("", "t"), text("b")]);
});

test("the hand-over: next-mentor loads ease-mentor without editing anything earlier", async () => {
  const s = await setup();
  s.svc.script(
    reply([thinking("", "n1"), text("Easing it is."), toolUse("Skill", { skill: "ease-mentor", args: "review" }, "tu_skill")], { stop_reason: "tool_use" }),
    reply([toolUse("snapshot_project", {}, "tu_s")], { stop_reason: "tool_use" }),
    reply([text("Let's review.")]),
  );
  const { r, events } = await s.turn("/next-mentor");
  assert.equal(r.ok, true);
  assert.equal(r.skill, "ease-mentor");
  assert.ok(!events.some((e) => (e.type === "tool_call" || e.type === "tool_result") && e.name === "Skill"), "the hand-over isn't a mentor tool call");
  assert.deepEqual(events.find((e) => e.type === "skill_loaded"), { type: "skill_loaded", skill: "ease-mentor" });

  const [b0, b1, b2] = bodies(s.svc);
  assert.deepEqual(b0.tools.map((t) => t.name), ["read_learner_record", "recommend_next", "Skill"]);
  assert.equal(b0.system[2].text, readSkill(SKILLS, "next-mentor").body);
  assert.equal(b0.thinking.block_binding, undefined);
  assert.ok(!betasOf(s.svc.messageRequests[0]).includes(BETAS.binding));
  // After: the result, then the new skill's body as a mid-conversation system message; its tools.
  assert.equal(b1.messages.length, 4);
  assert.deepEqual(withoutBreakpoints(b1.messages[2].content[0].content), [{ type: "text", text: "Loaded ease-mentor. Arguments: review" }]);
  assert.deepEqual(b1.messages[3], { role: "system", content: [{ type: "text", text: readSkill(SKILLS, "ease-mentor").body }] });
  assert.deepEqual(b1.tools.map((t) => t.name).sort(), readSkill(SKILLS, "ease-mentor").allowedTools.slice().sort());
  assert.deepEqual(b1.thinking, { type: "adaptive", display: "updates", block_binding: { prefix_mismatch_behavior: "drop_block" } });
  assert.ok(betasOf(s.svc.messageRequests[1]).includes(BETAS.binding));
  assert.equal(JSON.stringify(b2.tools), JSON.stringify(b1.tools));
  assertAppendOnly(s.svc);
  assert.match(s.calls(), /snapshot_project/);
});

test("only *-mentor skills can be handed over to", async () => {
  const s = await setup();
  s.svc.script(reply([toolUse("Skill", { skill: "agent-audit" }, "tu_bad")], { stop_reason: "tool_use" }), reply([text("Not that one.")]));
  const { r } = await s.turn("/next-mentor");
  assert.equal(r.ok, true);
  assert.equal(r.skill, "next-mentor");
  const tr = bodies(s.svc)[1].messages[2].content[0];
  assert.equal(tr.is_error, true);
  assert.deepEqual(withoutBreakpoints(tr.content), [{ type: "text", text: NO_SUCH_SKILL }]);
  assert.equal(bodies(s.svc)[1].messages.length, 3, "no system message added");
});

test("a later skill command switches skills the same way (append, never edit)", async () => {
  const s = await setup();
  s.svc.script(reply([text("Easing.")]), reply([text("Offset now.")]));
  await s.turn("/ease-mentor");
  await s.turn("/offset-mentor review");
  const b1 = bodies(s.svc)[1];
  assert.deepEqual(b1.messages.slice(-2).map((m) => m.role), ["user", "system"]);
  assert.equal(b1.messages[3].content[0].text, readSkill(SKILLS, "offset-mentor").body);
  assert.ok(b1.tools.some((t) => t.name === "offset_snapshot"));
  assert.ok(!b1.tools.some((t) => t.name === "set_ease"));
  assertAppendOnly(s.svc);
});

test("service faults: each kind, nothing kept from the failed turn", async () => {
  const s = await setup();
  s.svc.script(failure(401, "authentication_error", "bad key"));
  assert.equal((await s.turn("/ease-mentor")).r.error_kind, "not_signed_in");
  assert.equal(s.lesson.messages.length, 0);
  s.svc.script(drop([text("half of an answer"), text("never sent")], 1));
  const d = await s.turn("/ease-mentor");
  assert.equal(d.r.error_kind, "offline");
  assert.equal(d.r.cost_usd, null, "the service had started answering: cost unknown");
  assert.ok(d.events.some((e) => e.type === "text_delta"), "words already streamed stay on screen");
  assert.equal(s.lesson.messages.length, 0, "the half answer is never sent back");
  assert.ok(s.logs.some((l) => l.event === "service_error" && l.kind === "offline"));
  assert.doesNotMatch(JSON.stringify(s.logs), /LOOPKEY/);
  s.svc.script(reply([text("Hello.")]));
  assert.equal((await s.turn("/ease-mentor")).r.ok, true);
});

test("no key: not_signed_in with no request made", async () => {
  const s = await setup({ noKey: true });
  const { r } = await s.turn("/ease-mentor");
  assert.equal(r.error_kind, "not_signed_in");
  assert.equal(r.cost_usd, 0);
  assert.equal(s.svc.requests.length, 0);
});

test("ae-mentor exits between turns: the next turn starts it again", async () => {
  const s = await setup();
  s.svc.script(reply([text("Hi.")]));
  await s.turn("/ease-mentor");
  const pid = s.mcp.pid();
  process.kill(pid, "SIGKILL");
  await new Promise((res) => setTimeout(res, 200));
  s.svc.script(reply([toolUse("snapshot_project", {}, "t")], { stop_reason: "tool_use" }), reply([text("Got it.")]));
  const { r } = await s.turn("Check my work.");
  assert.equal(r.ok, true);
  assert.notEqual(s.mcp.pid(), pid);
  assertAppendOnly(s.svc);
});

test("no skill command: no tools and no skill body", async () => {
  const s = await setup();
  s.svc.script(reply([text("Hello!")]));
  const { r } = await s.turn("hello");
  assert.equal(r.ok, true);
  assert.equal(r.skill, null);
  const b = bodies(s.svc)[0];
  assert.equal(b.tools, undefined);
  assert.equal(b.system.length, 2);
});

test("skill_placement message: the body ahead of the first text, two system blocks", async () => {
  const s = await setup({ patch: { skill_placement: "message" } });
  s.svc.script(reply([text("Hi.")]), reply([text("Again.")]));
  await s.turn("/ease-mentor");
  await s.turn("Hint?");
  const [b0, b1] = bodies(s.svc);
  assert.equal(b0.system.length, 2);
  assert.equal(b0.messages[0].content[0].text, readSkill(SKILLS, "ease-mentor").body);
  assert.equal(b0.messages[0].content[1].text, "/ease-mentor");
  assert.equal(b1.messages[2].content.length, 1);
  assertAppendOnly(s.svc);
});

test("effort and the 1-hour cache come from the settings; no fallback field when it's off", async () => {
  const s = await setup({ patch: { effort: "high", cache_ttl: "1h", fallbacks: null, thinking_display: "omitted" } });
  s.svc.script(reply([text("Hi.")]));
  await s.turn("/ease-mentor");
  const b = bodies(s.svc)[0];
  assert.deepEqual(b.output_config, { effort: "high" });
  assert.deepEqual(b.system[2].cache_control, { type: "ephemeral", ttl: "1h" });
  assert.equal("fallbacks" in b, false);
  assert.deepEqual(b.thinking, { type: "adaptive", display: "omitted" });
  assert.equal(s.svc.messageRequests[0].headers["anthropic-beta"], null);
});
