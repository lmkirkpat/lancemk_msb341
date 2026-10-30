import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createLesson, createClient, echoContent, BETAS, NOT_AVAILABLE, NO_SUCH_SKILL, DIDNT_RUN, NOT_FINISHED } from "../lib/loop.mjs";
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

async function setup({ patch, noKey, wrapMcp } = {}) {
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
    mcp: wrapMcp ? wrapMcp(mcp) : mcp,
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

// Every request's messages extend the previous request's, byte for byte (cache markers aside):
// the same messages, except that the last one may have gained content blocks at its end (the
// learner's text after a turn's tool results, the documented mid-turn user-input shape). The
// system prompt never changes within a lesson, and the tools change only where a test says a
// hand-over happened (toolChangesAt: the 0-based request indexes whose tools differ from the
// previous kept request's). Requests the fake rejected as invalid fail the check.
// skip: request indexes that were sent and failed, and whose taken-back tail was in them (a
// learner's message from a turn that completed nothing, or a skill body placed just before the
// failed step; FR-015). A skipped request must still extend the kept request before it, with the
// same system prompt and the tools toolChangesAt says; only later requests don't have to extend it.
function extendsHistory(prev, next) {
  if (next.length < prev.length) return false;
  const last = prev.length - 1;
  for (let j = 0; j < last; j++) if (JSON.stringify(prev[j]) !== JSON.stringify(next[j])) return false;
  if (last < 0) return true;
  const a = prev[last];
  const b = next[last];
  if (JSON.stringify(a) === JSON.stringify(b)) return true;
  if (a.role !== b.role || !Array.isArray(a.content) || !Array.isArray(b.content) || b.content.length <= a.content.length) return false;
  return JSON.stringify(b.content.slice(0, a.content.length)) === JSON.stringify(a.content);
}

function assertAppendOnly(svc, { toolChangesAt = [], skip = [] } = {}) {
  assert.deepEqual(svc.rejected, [], "the fake service rejected a request as invalid");
  const b = bodies(svc);
  let p = 0;
  for (let i = 1; i < b.length; i++) {
    const prev = withoutBreakpoints(b[p].messages);
    const next = withoutBreakpoints(b[i].messages);
    assert.ok(extendsHistory(JSON.parse(JSON.stringify(prev)), JSON.parse(JSON.stringify(next))), `request ${i + 1} rewrote the history of request ${p + 1}`);
    assert.equal(JSON.stringify(b[i].system), JSON.stringify(b[0].system), `request ${i + 1} changed the system prompt`);
    const sameTools = JSON.stringify(b[i].tools) === JSON.stringify(b[p].tools);
    assert.equal(sameTools, !toolChangesAt.includes(i), `request ${i + 1}'s tools ${sameTools ? "didn't change" : "changed"} unexpectedly`);
    if (!skip.includes(i)) p = i;
  }
}

test("assertAppendOnly: a block added to the last message is an extension; anything else isn't", () => {
  const u = { role: "user", content: [{ type: "tool_result", tool_use_id: "x", content: "r" }] };
  const a = { role: "assistant", content: [{ type: "text", text: "a" }] };
  const more = { role: "user", content: [...u.content, { type: "text", text: "next" }] };
  assert.equal(extendsHistory([a, u], [a, more]), true);
  assert.equal(extendsHistory([a, u], [a, u, a]), true);
  assert.equal(extendsHistory([a, more], [a, u]), false, "a removed block");
  assert.equal(extendsHistory([u, a], [more, a]), false, "only the last message may grow");
  assert.equal(extendsHistory([a, u], [a, { role: "user", content: [{ type: "text", text: "next" }, ...u.content] }]), false, "blocks go after, not before");
});

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
  assert.deepEqual(b0.thinking, { type: "adaptive", display: "updates", block_binding: { prefix_mismatch_behavior: "error" } });
  assert.deepEqual(b0.output_config, { effort: "medium" });
  assert.equal(b0.fallbacks, "default");
  assert.equal(b0.tool_choice, undefined);
  assert.equal(b0.betas, undefined, "betas travel as a header");
  assert.deepEqual(betasOf(s.svc.messageRequests[0]).sort(), [BETAS.binding, BETAS.fallback, BETAS.updates].sort());
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
  assert.ok(!events.some((e) => e.type === "tool_call"), "nor shown as a call (S6)");
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
  assert.deepEqual(b0.thinking.block_binding, { prefix_mismatch_behavior: "error" }, "checked strictly before the hand-over");
  assert.ok(betasOf(s.svc.messageRequests[0]).includes(BETAS.binding));
  // After: the result, then the new skill's body as a mid-conversation system message; its tools.
  assert.equal(b1.messages.length, 4);
  assert.deepEqual(withoutBreakpoints(b1.messages[2].content[0].content), [{ type: "text", text: "Loaded ease-mentor. Arguments: review" }]);
  assert.deepEqual(b1.messages[3], { role: "system", content: [{ type: "text", text: readSkill(SKILLS, "ease-mentor").body }] });
  assert.deepEqual(b1.tools.map((t) => t.name).sort(), readSkill(SKILLS, "ease-mentor").allowedTools.slice().sort());
  assert.deepEqual(b1.thinking, { type: "adaptive", display: "updates", block_binding: { prefix_mismatch_behavior: "drop_block" } });
  assert.ok(betasOf(s.svc.messageRequests[1]).includes(BETAS.binding));
  assert.equal(JSON.stringify(b2.tools), JSON.stringify(b1.tools));
  assertAppendOnly(s.svc, { toolChangesAt: [1] });
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
  assertAppendOnly(s.svc, { toolChangesAt: [1] });
});

test("service faults: each kind, nothing kept from the failed turn", async () => {
  const s = await setup();
  s.svc.script(failure(401, "authentication_error", "bad key"));
  assert.equal((await s.turn("/ease-mentor")).r.error_kind, "not_signed_in");
  assert.equal(s.lesson.messages.length, 0);
  assert.deepEqual(s.logs.find((l) => l.event === "service_error"), { event: "service_error", kind: "not_signed_in", status: 401, type: "authentication_error", detail: "bad key" });
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
  assert.deepEqual(b.thinking, { type: "adaptive", display: "omitted", block_binding: { prefix_mismatch_behavior: "error" } });
  assert.deepEqual(betasOf(s.svc.messageRequests[0]), [BETAS.binding], "only the binding beta");
});

test("a hand-over on the last step: the skill's body waits for the next learner message (M1)", async () => {
  const s = await setup({ patch: { max_steps: 1 } });
  s.svc.script(reply([text("Easing next."), toolUse("Skill", { skill: "ease-mentor" }, "tu_last")], { stop_reason: "tool_use" }));
  const first = await s.turn("/next-mentor");
  assert.equal(first.r.ok, false, "the step limit");
  assert.equal(first.r.error_kind, null);
  assert.equal(first.r.skill, "ease-mentor");
  assert.ok(first.events.some((e) => e.type === "skill_loaded"));
  assert.notEqual(s.lesson.messages.at(-1).role, "system", "no system message left waiting at the end");

  s.svc.script(reply([text("Let's ease the Title.")]));
  const second = await s.turn("Yes, easing please.");
  assert.equal(second.r.ok, true);
  const b1 = bodies(s.svc)[1];
  assert.deepEqual(b1.messages.slice(-2).map((m) => m.role), ["user", "system"]);
  // The learner's text goes after the step's tool results, in the same user message (M1 review fix).
  assert.deepEqual(b1.messages.at(-2).content.map((c) => c.type), ["tool_result", "text"]);
  assert.equal(b1.messages.at(-2).content.at(-1).text, "Yes, easing please.");
  assert.equal(b1.messages.at(-1).content[0].text, readSkill(SKILLS, "ease-mentor").body);
  assert.deepEqual(b1.tools.map((t) => t.name).sort(), readSkill(SKILLS, "ease-mentor").allowedTools.slice().sort());

  s.svc.script(reply([text("Check when ready.")]));
  assert.equal((await s.turn("Done.")).r.ok, true);
  assertAppendOnly(s.svc, { toolChangesAt: [1] });
});

test("an empty reply right after a hand-over: the body waits for the next learner message (M1)", async () => {
  const s = await setup();
  s.svc.script(
    reply([toolUse("Skill", { skill: "ease-mentor" }, "tu_h")], { stop_reason: "tool_use" }),
    reply([], { stop_reason: "end_turn" }),
  );
  const first = await s.turn("/next-mentor");
  assert.equal(first.r.ok, true);
  assert.notEqual(s.lesson.messages.at(-1).role, "system");
  s.svc.script(reply([text("Here we go.")]));
  const second = await s.turn("Hello?");
  assert.equal(second.r.ok, true);
  const last = bodies(s.svc).at(-1);
  assert.deepEqual(last.messages.slice(-2).map((m) => m.role), ["user", "system"]);
  // Requests 2 and 3 both carried the body last; request 3 has it after the new message instead.
  assert.deepEqual(s.svc.rejected, []);
  assert.equal(last.messages.filter((m) => m.role === "system").length, 1);
});

// ---------- D1 (spec FR-015 as amended 2026-10-30, T059): a failed turn keeps its complete
// exchanges and takes back only the incomplete tail. ----------

const FAST = { "retry-after-ms": "1" };
const busy = () => [failure(529, "overloaded_error", "o", FAST), failure(529, "overloaded_error", "o", FAST), failure(529, "overloaded_error", "o", FAST)];

// Turn 1 of a lesson: the snapshot, then a line. → the demo target ae-mentor named.
async function opening(s) {
  s.svc.script(reply([toolUse("snapshot_project", {}, "tu_open")], { stop_reason: "tool_use" }), reply([text("Your Title moves at one speed.")]));
  const { r, events } = await s.turn("/ease-mentor");
  assert.equal(r.ok, true);
  const target = events.find((e) => e.type === "tool_result").json.demo_target;
  assert.equal(typeof target, "string", "the fixture has a demo target");
  return target;
}

const stripped = (m) => JSON.parse(JSON.stringify(withoutBreakpoints(m)));

for (const [label, patch, step3, kind] of [
  ["a dropped connection", {}, () => [drop([text("half of an answer"), toolUse("snapshot_project", {}, "tu_never")], 1)], "offline"],
  ["a service error", {}, busy, "service_busy"],
  ["the turn timeout", { turn_timeout_ms: 2500 }, () => [reply([text("never")], { hang: true })], "timeout"],
  ["a refusal", {}, () => [reply([], { stop_reason: "refusal", stop_details: { type: "refusal", category: "other" } })], "refused"],
  ["an answer cut off mid call", {}, () => [reply([text("Now"), toolUse("snapshot_project", {}, "tu_cut")], { stop_reason: "max_tokens" })], null],
]) {
  test(`D1: the demo at step 1 and a check at step 2 stay when step 3 fails (${label})`, async () => {
    const s = await setup({ patch });
    const target = await opening(s);
    const before = s.lesson.messages.length;
    s.svc.script(
      reply([thinking("", "d1-a"), text("Watch the first pair."), toolUse("set_ease", { segment_id: target }, "tu_demo")], { stop_reason: "tool_use" }),
      reply([thinking("", "d1-b"), toolUse("diff_since_last", {}, "tu_diff")], { stop_reason: "tool_use" }),
      ...step3(),
    );
    const { r, events } = await s.turn("Show me one.");
    assert.equal(r.ok, false);
    assert.equal(r.error_kind, kind);
    assert.equal(r.steps, 3);
    const results = events.filter((e) => e.type === "tool_result");
    assert.deepEqual(results.map((e) => e.name), ["set_ease", "diff_since_last"]);
    assert.equal(results[0].ok, true, "the demo ran");

    // Kept: the learner's message and both complete exchanges, exactly as step 3 sent them.
    const step3Request = bodies(s.svc)[4]; // requests 0-1: the opening; 2-3: steps 1 and 2
    assert.equal(s.lesson.messages.length, before + 5);
    assert.deepEqual(s.lesson.messages.slice(before).map((m) => m.role), ["user", "assistant", "user", "assistant", "user"]);
    assert.deepEqual(stripped(s.lesson.messages), stripped(step3Request.messages), "nothing of step 3's answer is kept");
    assert.doesNotMatch(JSON.stringify(s.lesson.messages), /half of an answer|tu_never|tu_cut|"Now"/);

    // The next turn sends both calls and their results byte for byte, then the new text as a block
    // after the last tool results, in the same user message (the mid-turn shape; M1 review fix).
    s.svc.script(reply([text("That one's eased. Now the rest.")]));
    const next = await s.turn("Did it work?");
    assert.equal(next.r.ok, true);
    const sent = bodies(s.svc).at(-1).messages;
    assert.equal(sent.length, before + 5, "no second user message");
    assert.equal(JSON.stringify(withoutBreakpoints(sent.slice(0, before + 4))), JSON.stringify(withoutBreakpoints(step3Request.messages.slice(0, before + 4))));
    const merged = withoutBreakpoints(sent[before + 4]);
    assert.deepEqual(merged.content.slice(0, -1), withoutBreakpoints(step3Request.messages[before + 4]).content);
    assert.deepEqual(merged.content.at(-1), { type: "text", text: "Did it work?" });
    assertAppendOnly(s.svc);
    assert.equal((s.calls().match(/"tool":"set_ease"/g) || []).length, 1, "the demo ran once");
  });
}

test("D1: a demo runs, the next call in the same answer fails (ae-mentor exits): the answer is completed", async () => {
  let killNext = false;
  const s = await setup({
    wrapMcp: (m) => ({
      start: () => m.start(),
      pid: () => m.pid(),
      stop: () => m.stop(),
      async callTool(name, args) {
        if (killNext && name === "diff_since_last") {
          killNext = false;
          await m.stop(); // the server is gone when the call is made
        }
        return m.callTool(name, args);
      },
    }),
  });
  const target = await opening(s);
  const before = s.lesson.messages.length;
  killNext = true;
  s.svc.script(
    reply(
      [thinking("", "q7"), text("Watch."), toolUse("set_ease", { segment_id: target }, "tu_demo"), toolUse("diff_since_last", {}, "tu_diff"), toolUse("snapshot_project", {}, "tu_snap2")],
      { stop_reason: "tool_use" },
    ),
  );
  const { r, events } = await s.turn("Show me one.");
  assert.equal(r.ok, false);
  assert.equal(r.error_kind, "start_failed");
  assert.equal(r.steps, 1);
  assert.deepEqual(events.filter((e) => e.type === "tool_call").map((e) => e.id), ["tu_demo", "tu_diff", "tu_snap2"]);
  assert.deepEqual(events.filter((e) => e.type === "tool_result").map((e) => e.id), ["tu_demo"], "a call that didn't run shows no result");

  const kept = JSON.parse(JSON.stringify(s.lesson.messages.slice(before)));
  assert.deepEqual(kept.map((m) => m.role), ["user", "assistant", "user"]);
  const res = kept[2].content;
  assert.deepEqual(res.map((b) => b.tool_use_id), ["tu_demo", "tu_diff", "tu_snap2"]);
  assert.equal(res[0].is_error, undefined, "the demo keeps its own result");
  assert.notEqual(res[0].content[0].text, DIDNT_RUN);
  for (const b of res.slice(1)) {
    assert.equal(b.is_error, true);
    assert.deepEqual(withoutBreakpoints(b.content), [{ type: "text", text: DIDNT_RUN }]);
  }
  assert.equal(DIDNT_RUN, "That call didn't run.");

  // The next turn starts the server again and still has the demo's call and result.
  s.svc.script(reply([text("Your turn on the rest.")]));
  const next = await s.turn("What now?");
  assert.equal(next.r.ok, true);
  const sent = bodies(s.svc).at(-1).messages;
  assert.equal(sent.length, before + 3);
  assert.equal(JSON.stringify(withoutBreakpoints(sent.slice(before, before + 2))), JSON.stringify(kept.slice(0, 2)));
  assert.deepEqual(withoutBreakpoints(sent[before + 2]).content, [...kept[2].content, { type: "text", text: "What now?" }]);
  assertAppendOnly(s.svc);
  assert.equal((s.calls().match(/"tool":"set_ease"/g) || []).length, 1);
});

test("D1: a failure at step 1 takes the learner's message back too (resolved question 6)", async () => {
  const s = await setup();
  s.svc.script(reply([text("Hi.")]));
  await s.turn("/ease-mentor");
  const before = JSON.stringify(s.lesson.messages);
  s.svc.script(...busy());
  const { r } = await s.turn("Check my work.");
  assert.equal(r.error_kind, "service_busy");
  assert.equal(JSON.stringify(s.lesson.messages), before, "the learner's message came off");

  // A skill command whose turn completed nothing: the switch is undone with it.
  s.svc.script(failure(401, "authentication_error", "revoked"));
  assert.equal((await s.turn("/offset-mentor")).r.error_kind, "not_signed_in");
  assert.equal(s.lesson.skill, "ease-mentor");
  assert.equal(JSON.stringify(s.lesson.messages), before);

  s.svc.script(reply([text("Back.")]));
  assert.equal((await s.turn("Check my work.")).r.ok, true);
  const last = bodies(s.svc).at(-1);
  assert.equal(last.messages.length, 3, "the retry sends the message once");
  assert.ok(last.tools.some((t) => t.name === "set_ease"));
  // Requests 2 to 5 failed with nothing completed, so their learner messages were taken back;
  // request 5 carried offset's tools (its skill command), taken back with it.
  assertAppendOnly(s.svc, { skip: [1, 2, 3, 4], toolChangesAt: [4] });
});

test("D1: a hand-over completed in the failed turn stays in force; its body goes in before the next request", async () => {
  const s = await setup();
  s.svc.script(
    reply([thinking("", "h1"), toolUse("Skill", { skill: "ease-mentor", args: "review" }, "tu_h")], { stop_reason: "tool_use" }),
    drop([text("Let's")], 1), // step 2, with the body just placed
  );
  const { r, events } = await s.turn("/next-mentor");
  assert.equal(r.error_kind, "offline");
  assert.equal(r.skill, "ease-mentor");
  assert.ok(events.some((e) => e.type === "skill_loaded"));
  assert.equal(s.lesson.skill, "ease-mentor");
  assert.deepEqual(s.lesson.messages.map((m) => m.role), ["user", "assistant", "user"], "the body was in the failed step's tail");
  assert.deepEqual(withoutBreakpoints(s.lesson.messages[2].content[0].content), [{ type: "text", text: "Loaded ease-mentor. Arguments: review" }]);

  s.svc.script(reply([text("Let's review your easing.")]), reply([text("Ready when you are.")]));
  assert.equal((await s.turn("Hello?")).r.ok, true);
  assert.equal((await s.turn("Ok.")).r.ok, true);
  const b = bodies(s.svc);
  const body = readSkill(SKILLS, "ease-mentor").body;
  assert.deepEqual(b[2].messages.slice(-2).map((m) => m.role), ["user", "system"]);
  assert.equal(b[2].messages.at(-1).content[0].text, body);
  assert.equal(b[2].messages.filter((m) => m.role === "system").length, 1);
  assert.deepEqual(b[2].tools.map((t) => t.name).sort(), readSkill(SKILLS, "ease-mentor").allowedTools.slice().sort());
  assert.equal(b[2].thinking.block_binding.prefix_mismatch_behavior, "drop_block");
  // Request 2 (failed, skipped) already had ease-mentor's tools; request 3 is compared with request 1.
  assertAppendOnly(s.svc, { toolChangesAt: [1, 2], skip: [1] });
});

test("D1: a hand-over at step 1 and a call at step 2 stay when step 3 fails", async () => {
  const s = await setup();
  s.svc.script(
    reply([toolUse("Skill", { skill: "ease-mentor" }, "h")], { stop_reason: "tool_use" }),
    reply([toolUse("snapshot_project", {}, "s")], { stop_reason: "tool_use" }),
    failure(401, "authentication_error", "revoked"),
  );
  const { r } = await s.turn("/next-mentor");
  assert.equal(r.error_kind, "not_signed_in");
  assert.equal(r.steps, 3);
  assert.equal(s.lesson.skill, "ease-mentor", "the hand-over stays in force");
  assert.deepEqual(s.lesson.messages.map((m) => m.role), ["user", "assistant", "user", "system", "assistant", "user"]);
  s.svc.script(reply([text("Hi again.")]));
  assert.equal((await s.turn("Hello?")).r.ok, true);
  const last = bodies(s.svc).at(-1);
  assert.deepEqual(last.tools.map((t) => t.name).sort(), readSkill(SKILLS, "ease-mentor").allowedTools.slice().sort());
  assert.equal(last.messages.filter((m) => m.role === "system").length, 1);
  assertAppendOnly(s.svc, { toolChangesAt: [1] });
});

test("the fake service refuses what the real one does (S3)", async () => {
  const { invalidRequest, BETA } = await import("./fake-service.mjs");
  const u = { role: "user", content: "x" };
  const a = { role: "assistant", content: [{ type: "text", text: "y" }] };
  const sys = { role: "system", content: "z" };
  const all = [BETA.binding, BETA.fallback, BETA.updates].join(",");
  assert.equal(invalidRequest({ messages: [u, sys] }, ""), null);
  assert.equal(invalidRequest({ messages: [u, sys, a] }, ""), null);
  assert.match(invalidRequest({ messages: [u, sys, u] }, ""), /followed by an assistant/);
  assert.match(invalidRequest({ messages: [sys, u] }, ""), /can't be first/);
  assert.match(invalidRequest({ messages: [u, a, sys] }, ""), /must follow a user/);
  assert.match(invalidRequest({ messages: [u], thinking: { type: "adaptive", block_binding: { prefix_mismatch_behavior: "error" } } }, ""), /Extra inputs/);
  assert.equal(invalidRequest({ messages: [u], thinking: { type: "adaptive", block_binding: { prefix_mismatch_behavior: "error" } } }, all), null);
  assert.match(invalidRequest({ messages: [u], fallbacks: "default" }, BETA.binding), /fallbacks/);
  assert.match(invalidRequest({ messages: [u], thinking: { type: "adaptive", display: "updates" } }, BETA.fallback), /updates/);
  // Roles alternate, system messages aside; every tool_use is answered in the next user message.
  assert.match(invalidRequest({ messages: [u, a, u, u] }, ""), /two user messages in a row/);
  assert.match(invalidRequest({ messages: [u, a, a] }, ""), /two assistant messages/);
  const call = { role: "assistant", content: [{ type: "tool_use", id: "c1", name: "x", input: {} }] };
  const answer = { role: "user", content: [{ type: "tool_result", tool_use_id: "c1", content: "ok" }] };
  assert.equal(invalidRequest({ messages: [u, call, answer] }, ""), null);
  assert.equal(invalidRequest({ messages: [u, call, answer, sys, a] }, ""), null);
  assert.equal(invalidRequest({ messages: [u, call, { role: "user", content: [...answer.content, { type: "text", text: "and?" }] }] }, ""), null, "text after the results is the mid-turn shape");
  assert.match(invalidRequest({ messages: [u, call, u] }, ""), /tool_use c1 has no tool_result/);
  assert.match(invalidRequest({ messages: [u, call] }, ""), /tool_use c1 has no tool_result/);
});

test("the fake service records a real-looking key redacted, and keeps short stand-ins", async () => {
  const { redactKey } = await import("./fake-service.mjs");
  const real = "sk-ant-api03-" + "Ab3_".repeat(23) + "xyzAA";
  assert.equal(redactKey(`Bearer ${real}`), "Bearer [redacted]");
  assert.equal(redactKey(real), "[redacted]");
  assert.equal(redactKey(`Bearer ${KEY}`), `Bearer ${KEY}`);
  assert.equal(redactKey(null), null);
});

test("every request opts into the history check: error before a hand-over, drop_block after (M2)", async () => {
  const s = await setup();
  s.svc.script(
    reply([text("Hi.")]),
    reply([text("Offset now.")]),
    reply([text("Still offset.")]),
  );
  await s.turn("/ease-mentor");
  await s.turn("/offset-mentor");
  await s.turn("Next?");
  const behaviors = bodies(s.svc).map((b) => b.thinking.block_binding.prefix_mismatch_behavior);
  assert.deepEqual(behaviors, ["error", "drop_block", "drop_block"]);
  for (const r of s.svc.messageRequests) assert.ok(betasOf(r).includes(BETAS.binding));
  assertAppendOnly(s.svc, { toolChangesAt: [1] });
});

test("input_transformations are logged: type, reason and path only, never text (M2)", async () => {
  const s = await setup();
  s.svc.script(
    reply([text("Hi.")]),
    reply([text("Again.")], {
      input_transformations: [
        { type: "thinking_dropped", path: "messages.1.content.0", reason: "prefix_binding_mismatch", note: "secret learner words" },
        { type: "thinking_mismatch_allowed", path: "messages.3.content.0", reason: "prefix_binding_mismatch" },
      ],
    }),
  );
  await s.turn("/ease-mentor");
  assert.ok(!s.logs.some((l) => l.event === "input_transformations"), "an empty or missing list isn't logged");
  await s.turn("Hint?");
  assert.deepEqual(s.logs.find((l) => l.event === "input_transformations"), {
    event: "input_transformations",
    turn: 2,
    step: 1,
    entries: [
      { type: "thinking_dropped", reason: "prefix_binding_mismatch", path: "messages.1.content.0" },
      { type: "thinking_mismatch_allowed", reason: "prefix_binding_mismatch", path: "messages.3.content.0" },
    ],
  });
  assert.doesNotMatch(JSON.stringify(s.logs), /secret learner words/);
});

test("a fault in the helper is start_failed and logged as internal_error, not offline (S5)", async () => {
  const s = await setup();
  const broken = { beta: { messages: { stream: () => { throw new TypeError("Cannot read properties of undefined (reading 'x')"); } } } };
  const lesson = createLesson({
    getClient: async () => broken,
    mcp: s.mcp,
    settings: SETTINGS,
    prices,
    preamble,
    skillTool,
    skillsDir: SKILLS,
    log: (e) => s.logs.push(e),
  });
  const r = await lesson.runTurn("/ease-mentor", () => {});
  assert.equal(r.error_kind, "start_failed");
  assert.equal(lesson.messages.length, 0);
  const entry = s.logs.find((l) => l.event === "internal_error");
  assert.equal(entry.name, "TypeError");
  assert.ok(!s.logs.some((l) => l.event === "service_error"));
});

test("M1: after the step limit, a turn that completes nothing takes back only its text block", async () => {
  const s = await setup({ patch: { max_steps: 1 } });
  s.svc.script(reply([toolUse("snapshot_project", {}, "tu_lim")], { stop_reason: "tool_use" }));
  await s.turn("/ease-mentor");
  const atLimit = JSON.stringify(s.lesson.messages);
  assert.equal(s.lesson.messages.at(-1).role, "user");

  s.svc.script(failure(401, "authentication_error", "revoked"));
  assert.equal((await s.turn("Check my work.")).r.error_kind, "not_signed_in");
  assert.equal(JSON.stringify(s.lesson.messages), atLimit, "the tool results stay; only the added text came off");
  const failed = bodies(s.svc).at(-1).messages.at(-1);
  assert.deepEqual(failed.content.map((c) => c.type), ["tool_result", "text"], "the failed request had the mid-turn shape");

  s.svc.script(reply([text("Here's what I see.")]));
  assert.equal((await s.turn("Check my work.")).r.ok, true);
  const last = bodies(s.svc).at(-1).messages;
  assert.deepEqual(last.at(-1).content.filter((c) => c.type === "text").map((c) => c.text), ["Check my work."], "the retry sends the text once");
  assertAppendOnly(s.svc);
});

test("S4: a fault in the helper after a demo ran completes the answer instead of cutting past it", async () => {
  let second = false;
  const s = await setup({
    wrapMcp: (m) => ({
      start: () => m.start(),
      pid: () => m.pid(),
      stop: () => m.stop(),
      async callTool(name, args) {
        if (second && name === "diff_since_last") return { content: null, isError: false }; // malformed: a TypeError in the helper
        return m.callTool(name, args);
      },
    }),
  });
  const target = await opening(s);
  const before = s.lesson.messages.length;
  second = true;
  s.svc.script(reply([toolUse("set_ease", { segment_id: target }, "tu_demo"), toolUse("diff_since_last", {}, "tu_diff")], { stop_reason: "tool_use" }));
  const { r } = await s.turn("Show me one.");
  assert.equal(r.error_kind, "start_failed");
  const res = s.lesson.messages.at(-1).content;
  assert.deepEqual(res.map((b) => b.tool_use_id), ["tu_demo", "tu_diff"]);
  assert.equal(res[0].is_error, undefined, "the demo's result is kept");
  assert.deepEqual(withoutBreakpoints(res[1].content), [{ type: "text", text: DIDNT_RUN }]);
  assert.equal(s.lesson.messages.length, before + 3);
  assert.ok(s.logs.some((l) => l.event === "internal_error" && l.name === "TypeError"));
  s.svc.script(reply([text("Your turn.")]));
  assert.equal((await s.turn("What now?")).r.ok, true);
  assertAppendOnly(s.svc);
});

test("S1: a demo call still running when the turn times out gets the didn't-finish result; the answer is completed", async () => {
  let hang = false;
  const s = await setup({
    patch: { turn_timeout_ms: 1500 },
    wrapMcp: (m) => ({
      start: () => m.start(),
      pid: () => m.pid(),
      stop: () => m.stop(),
      callTool(name, args) {
        if (hang && name === "set_ease") return new Promise(() => {}); // sent, never answers
        return m.callTool(name, args);
      },
    }),
  });
  const target = await opening(s);
  const before = s.lesson.messages.length;
  hang = true;
  s.svc.script(reply([text("Watch."), toolUse("set_ease", { segment_id: target }, "tu_demo"), toolUse("diff_since_last", {}, "tu_diff")], { stop_reason: "tool_use" }));
  const { r, events } = await s.turn("Show me one.");
  assert.equal(r.error_kind, "timeout");
  assert.ok(!events.some((e) => e.type === "tool_result"), "no result shown for a call that didn't finish");

  // Nothing ran to completion, but AE may have changed: the answer is completed, not taken back.
  const kept = JSON.parse(JSON.stringify(s.lesson.messages.slice(before)));
  assert.deepEqual(kept.map((m) => m.role), ["user", "assistant", "user"]);
  const res = kept[2].content;
  assert.deepEqual(res.map((b) => b.tool_use_id), ["tu_demo", "tu_diff"]);
  assert.equal(NOT_FINISHED, "That call didn't finish, so it may or may not have changed the project.");
  assert.deepEqual(res[0], { type: "tool_result", tool_use_id: "tu_demo", content: [{ type: "text", text: NOT_FINISHED }], is_error: true });
  assert.deepEqual(res[1], { type: "tool_result", tool_use_id: "tu_diff", content: [{ type: "text", text: DIDNT_RUN }], is_error: true }, "never started");

  // The next turn has the call with its result, the learner's text after it, and valid roles.
  hang = false;
  s.svc.script(reply([text("Let's check what's there.")]));
  assert.equal((await s.turn("Did it land?")).r.ok, true);
  const sent = withoutBreakpoints(bodies(s.svc).at(-1).messages);
  assert.equal(sent.length, before + 3);
  assert.deepEqual(sent[before + 1], kept[1]);
  assert.deepEqual(sent[before + 2].content, [...res, { type: "text", text: "Did it land?" }]);
  assertAppendOnly(s.svc);
});

test("S1: a call never sent (the server already gone) is still \"didn't run\"; one in flight when the server dies \"didn't finish\"", async () => {
  let mode = null;
  const s = await setup({
    wrapMcp: (m) => ({
      start: () => m.start(),
      pid: () => m.pid(),
      stop: () => m.stop(),
      async callTool(name, args) {
        if (mode === "exit-mid-call" && name === "set_ease") {
          const p = m.callTool(name, args);
          process.kill(m.pid(), "SIGKILL"); // dies with the call sent
          return p;
        }
        return m.callTool(name, args);
      },
    }),
  });
  const target = await opening(s);
  mode = "exit-mid-call";
  s.svc.script(reply([toolUse("set_ease", { segment_id: target }, "tu_x")], { stop_reason: "tool_use" }));
  const { r } = await s.turn("Show me one.");
  assert.equal(r.error_kind, "start_failed");
  assert.deepEqual(withoutBreakpoints(s.lesson.messages.at(-1).content), [{ type: "tool_result", tool_use_id: "tu_x", content: [{ type: "text", text: NOT_FINISHED }], is_error: true }]);
  mode = null;
  s.svc.script(reply([text("Back.")]));
  assert.equal((await s.turn("Hello?")).r.ok, true);
  assertAppendOnly(s.svc);
});
