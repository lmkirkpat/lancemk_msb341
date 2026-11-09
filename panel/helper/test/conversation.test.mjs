import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { saveConversation, loadConversation, clearConversation, isCompleteHistory, CONVERSATION_FILE, FRAMES_DIR } from "../lib/conversation.mjs";
import { createLesson, createClient } from "../lib/loop.mjs";
import { createMcpClient } from "../lib/mcp-client.mjs";
import { loadSettings, HELPER_DIR } from "../lib/settings.mjs";
import { loadPreamble, loadSkillTool, withoutBreakpoints } from "../lib/prompt.mjs";
import { startFakeService, reply, drop, text, thinking, toolUse } from "./fake-service.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const SKILLS = path.join(REPO, ".claude", "skills");
const FIXTURE = path.join(REPO, "product", "evals", "easing", "fixtures", "before.json");
const { settings: SETTINGS, prices } = loadSettings();

const SESSION = "11111111-2222-4333-8444-555555555555";
const MODEL = "claude-opus-5-5";
const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0xde, 0xad, 0xbe, 0xef]);
const PNG = PNG_BYTES.toString("base64");
const PNG_NAME = `${crypto.createHash("sha256").update(PNG_BYTES).digest("hex")}.png`;

const cleanups = [];
afterEach(async () => {
  while (cleanups.length) await cleanups.pop()();
});

function tempHome() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "AEMentor-conv-"));
  cleanups.push(() => fs.rmSync(home, { recursive: true, force: true }));
  return home;
}

const image = (data = PNG) => ({ type: "image", source: { type: "base64", media_type: "image/png", data } });
const userText = (t) => ({ role: "user", content: [{ type: "text", text: t }] });
const answer = (t) => ({ role: "assistant", content: [{ type: "text", text: t }] });
const calls = (...ids) => ({ role: "assistant", content: ids.map((id) => ({ type: "tool_use", id, name: "snapshot_project", input: {} })) });
const results = (...ids) => ({ role: "user", content: ids.map((id) => ({ type: "tool_result", tool_use_id: id, content: [{ type: "text", text: "{}" }] })) });

// A history with everything the file has to carry: thinking, a frame, an error result, a hand-over's
// system message, the learner's text added after tool results (M1), awkward characters.
function fullHistory() {
  return [
    { role: "user", content: [{ type: "text", text: "/ease-mentor “Title” café 🎬 \n\t\\  " }] },
    {
      role: "assistant",
      content: [
        { type: "thinking", thinking: "plan", signature: "sig_abc+/=" },
        { type: "text", text: "Here's a frame." },
        { type: "tool_use", id: "toolu_1", name: "get_frame", input: { z: 1, a: [1.5, null, { data: PNG }], frame_file: "../../not-a-frame.png" } },
      ],
    },
    {
      role: "user",
      content: [
        { type: "tool_result", tool_use_id: "toolu_1", content: [{ type: "text", text: "{\"frame_file\":\"x\"}" }, image()] },
        { type: "text", text: "added after the results" },
      ],
    },
    { role: "system", content: [{ type: "tool_removal", tools: [{ type: "tool_reference", tool_name: "set_ease" }] }, { type: "text", text: "the next skill's body" }] },
    { role: "assistant", content: [{ type: "text", text: "On we go." }, { type: "tool_use", id: "toolu_2", name: "get_frame", input: {} }] },
    { role: "user", content: [{ type: "tool_result", tool_use_id: "toolu_2", is_error: true, content: [{ type: "text", text: "That call didn't run." }, image()] }] },
    answer("Your turn."),
  ];
}

const baseSave = (home, messages, extra = {}) => saveConversation({ home, sessionId: SESSION, skill: "ease-mentor", settingsHash: "hash-1", model: MODEL, messages, ...extra });
const baseLoad = (home, extra = {}) => loadConversation({ home, sessionId: SESSION, model: MODEL, ...extra });
const convFile = (home) => path.join(home, CONVERSATION_FILE);
const framesDir = (home) => path.join(home, FRAMES_DIR);
const readSaved = (home) => JSON.parse(fs.readFileSync(convFile(home), "utf8"));

function rewriteSaved(home, change) {
  const saved = readSaved(home);
  change(saved);
  fs.writeFileSync(convFile(home), JSON.stringify(saved));
}

// ---------- round trip ----------

test("a saved conversation loads back byte for byte, with its metadata", () => {
  const home = tempHome();
  const messages = fullHistory();
  assert.deepEqual(baseSave(home, messages), { saved: true });
  const r = baseLoad(home);
  assert.equal(r.ok, true);
  assert.equal(JSON.stringify(r.conversation.messages), JSON.stringify(fullHistory()));
  assert.equal(r.conversation.skill, "ease-mentor");
  assert.equal(r.conversation.settings_hash, "hash-1");
  assert.equal(r.conversation.session_id, SESSION);
  assert.equal(r.conversation.model, MODEL);
});

test("the file has the data model's fields, in its place in the learner home", () => {
  const home = tempHome();
  baseSave(home, fullHistory());
  assert.equal(CONVERSATION_FILE, "panel-conversation.json");
  assert.equal(FRAMES_DIR, "panel-conversation-frames");
  assert.deepEqual(Object.keys(readSaved(home)), ["version", "session_id", "skill", "settings_hash", "model", "messages"]);
  assert.equal(readSaved(home).version, 1);
});

test("a lesson with no skill loaded yet saves and loads", () => {
  const home = tempHome();
  baseSave(home, [userText("hi"), answer("hello")], { skill: null });
  const r = baseLoad(home);
  assert.equal(r.ok, true);
  assert.equal(r.conversation.skill, null);
});

test("saving doesn't change the history it's given", () => {
  const home = tempHome();
  const messages = fullHistory();
  baseSave(home, messages);
  assert.equal(JSON.stringify(messages), JSON.stringify(fullHistory()));
});

// ---------- frames ----------

test("images in tool results are files on disk and not in the JSON", () => {
  const home = tempHome();
  baseSave(home, fullHistory());
  const raw = fs.readFileSync(convFile(home), "utf8");
  const inResult = readSaved(home).messages[2].content[0].content[1];
  assert.deepEqual(inResult, { type: "image", source: { type: "base64", media_type: "image/png", frame_file: `panel-conversation-frames/${PNG_NAME}` } });
  assert.equal(raw.match(new RegExp(PNG.replace(/[+/=]/g, "\\$&"), "g")).length, 1, "only the tool input's own text has those characters");
  assert.deepEqual(fs.readFileSync(path.join(framesDir(home), PNG_NAME)), PNG_BYTES);
});

test("the same frame twice is one file", () => {
  const home = tempHome();
  baseSave(home, fullHistory());
  assert.deepEqual(fs.readdirSync(framesDir(home)), [PNG_NAME]);
});

test("a frame's fields come back in their original order", () => {
  const home = tempHome();
  const build = () => [
    calls("a"),
    { role: "user", content: [{ type: "tool_result", tool_use_id: "a", content: [{ type: "image", source: { data: PNG, type: "base64", media_type: "image/png" } }] }] },
  ];
  baseSave(home, [userText("hi"), ...build()]);
  assert.equal(JSON.stringify(baseLoad(home).conversation.messages), JSON.stringify([userText("hi"), ...build()]));
});

test("only images in tool results become files", () => {
  const home = tempHome();
  const messages = [{ role: "user", content: [image()] }, answer("ok")];
  baseSave(home, messages);
  assert.equal(readSaved(home).messages[0].content[0].source.data, PNG);
  assert.equal(fs.existsSync(framesDir(home)), false);
});

test("image data that wouldn't survive a decode stays inline, so the history is still exact", () => {
  const home = tempHome();
  const odd = "AAA"; // unpadded: decoding and encoding it again gives "AAA="
  const build = () => [calls("a"), { role: "user", content: [{ type: "tool_result", tool_use_id: "a", content: [image(odd)] }] }];
  const history = [userText("hi"), ...build()];
  baseSave(home, history);
  assert.equal(readSaved(home).messages[2].content[0].content[0].source.data, odd);
  assert.equal(JSON.stringify(baseLoad(home).conversation.messages), JSON.stringify([userText("hi"), ...build()]));
});

test("the conversation and its frames can only be read by this user", () => {
  const home = tempHome();
  baseSave(home, fullHistory());
  assert.equal(fs.statSync(convFile(home)).mode & 0o777, 0o600);
  assert.equal(fs.statSync(framesDir(home)).mode & 0o777, 0o700);
  assert.equal(fs.statSync(path.join(framesDir(home), PNG_NAME)).mode & 0o777, 0o600);
});

// ---------- writing ----------

test("a save leaves no temp file behind and replaces the last one whole", () => {
  const home = tempHome();
  baseSave(home, [userText("hi"), answer("one")]);
  baseSave(home, [userText("hi"), answer("one"), userText("more"), answer("two")]);
  assert.deepEqual(fs.readdirSync(home), [CONVERSATION_FILE]);
  assert.equal(baseLoad(home).conversation.messages.length, 4);
});

test("a frame that can't be written leaves the last save as it was", () => {
  const home = tempHome();
  baseSave(home, [userText("hi"), answer("one")]);
  const before = fs.readFileSync(convFile(home), "utf8");
  fs.writeFileSync(framesDir(home), "a file where the folder should be");
  const r = baseSave(home, fullHistory());
  assert.deepEqual(r, { saved: false, reason: "write_failed" });
  assert.equal(fs.readFileSync(convFile(home), "utf8"), before);
});

test("a rename that fails reports it, throws nothing and leaves no temp file", () => {
  const home = tempHome();
  fs.mkdirSync(path.join(convFile(home), "occupied"), { recursive: true });
  const r = baseSave(home, [userText("hi"), answer("one")]);
  assert.deepEqual(r, { saved: false, reason: "write_failed" });
  assert.deepEqual(fs.readdirSync(home), [CONVERSATION_FILE]);
});

// ---------- only after a complete exchange ----------

const COMPLETE = [
  ["an answer with no tool call", [userText("hi"), answer("hello")]],
  ["calls with every result", [userText("hi"), calls("a", "b"), results("a", "b")]],
  ["results in another order", [userText("hi"), calls("a", "b"), results("b", "a")]],
];

for (const [name, messages] of COMPLETE) {
  test(`complete: ${name}`, () => {
    assert.equal(isCompleteHistory(messages), true);
    assert.deepEqual(baseSave(tempHome(), messages), { saved: true });
  });
}

const INCOMPLETE = [
  ["nothing yet", []],
  ["the learner's message with no answer", [userText("hi")]],
  ["an answer whose calls have no results", [userText("hi"), calls("a")]],
  ["one result missing", [userText("hi"), calls("a", "b"), results("a")]],
  ["a result for some other call", [userText("hi"), calls("a"), results("z")]],
  ["results with no answer before them", [userText("hi"), results("a")]],
  ["text added after results, not answered yet", [userText("hi"), calls("a"), { role: "user", content: [...results("a").content, { type: "text", text: "next" }] }]],
  ["a hand-over's system message last", [userText("hi"), { role: "system", content: [{ type: "text", text: "body" }] }]],
  ["an empty answer", [userText("hi"), { role: "assistant", content: [] }]],
];

for (const [name, messages] of INCOMPLETE) {
  test(`incomplete, not saved: ${name}`, () => {
    const home = tempHome();
    assert.equal(isCompleteHistory(messages), false);
    assert.deepEqual(baseSave(home, messages), { saved: false, reason: "incomplete" });
    assert.equal(fs.existsSync(convFile(home)), false);
  });
}

test("an incomplete history leaves the last save in place", () => {
  const home = tempHome();
  const kept = [userText("hi"), answer("one")];
  baseSave(home, kept);
  baseSave(home, [...kept, userText("more")]);
  assert.equal(JSON.stringify(baseLoad(home).conversation.messages), JSON.stringify(kept));
});

// ---------- not continued ----------

const NOT_CONTINUED = [
  ["no file", "none", (home) => fs.rmSync(convFile(home))],
  ["not JSON", "unreadable", (home) => fs.writeFileSync(convFile(home), "{ not json")],
  ["not an object", "unreadable", (home) => fs.writeFileSync(convFile(home), "[]")],
  ["null", "unreadable", (home) => fs.writeFileSync(convFile(home), "null")],
  ["messages missing", "unreadable", (home) => rewriteSaved(home, (s) => delete s.messages)],
  ["messages empty", "unreadable", (home) => rewriteSaved(home, (s) => (s.messages = []))],
  ["a message with no content list", "unreadable", (home) => rewriteSaved(home, (s) => (s.messages[0].content = "text"))],
  ["a message with an unknown role", "unreadable", (home) => rewriteSaved(home, (s) => (s.messages[0].role = "tool"))],
  ["a block that isn't an object", "unreadable", (home) => rewriteSaved(home, (s) => (s.messages[0].content = [null]))],
  ["a skill that isn't text", "unreadable", (home) => rewriteSaved(home, (s) => (s.skill = 7))],
  ["a settings hash that isn't text", "unreadable", (home) => rewriteSaved(home, (s) => (s.settings_hash = null))],
  ["its tail incomplete", "unreadable", (home) => rewriteSaved(home, (s) => s.messages.splice(-2))],
  ["another version", "version", (home) => rewriteSaved(home, (s) => (s.version = 2))],
  ["another session", "session", (home) => rewriteSaved(home, (s) => (s.session_id = "someone-else"))],
  ["another model", "model", (home) => rewriteSaved(home, (s) => (s.model = "claude-sonnet-5-5"))],
  ["a frame missing", "frames", (home) => fs.rmSync(path.join(framesDir(home), PNG_NAME))],
  ["a frame altered", "frames", (home) => fs.writeFileSync(path.join(framesDir(home), PNG_NAME), "changed")],
  ["a frame path outside the folder", "frames", (home) => rewriteSaved(home, (s) => (s.messages[2].content[0].content[1].source.frame_file = "../secret.png"))],
  ["a frame path that isn't text", "frames", (home) => rewriteSaved(home, (s) => (s.messages[2].content[0].content[1].source.frame_file = 3))],
];

for (const [name, reason, damage] of NOT_CONTINUED) {
  test(`not continued, quietly: ${name}`, () => {
    const home = tempHome();
    baseSave(home, fullHistory());
    damage(home);
    assert.deepEqual(baseLoad(home), { ok: false, reason });
  });
}

test("a load that's refused leaves the files for the new lesson to clear", () => {
  const home = tempHome();
  baseSave(home, fullHistory());
  assert.equal(baseLoad(home, { sessionId: "other" }).ok, false);
  assert.equal(fs.existsSync(convFile(home)), true);
  assert.equal(fs.existsSync(path.join(framesDir(home), PNG_NAME)), true);
});

test("a different settings hash still continues: the data model doesn't list it as a reason", () => {
  const home = tempHome();
  baseSave(home, fullHistory());
  rewriteSaved(home, (s) => (s.settings_hash = "another-hash"));
  const r = baseLoad(home);
  assert.equal(r.ok, true);
  assert.equal(r.conversation.settings_hash, "another-hash");
});

// ---------- a new lesson ----------

test("clearing deletes the file, its frames and any temp file, and nothing else", () => {
  const home = tempHome();
  baseSave(home, fullHistory());
  fs.writeFileSync(path.join(home, `${CONVERSATION_FILE}.99.tmp`), "left by a crash");
  fs.writeFileSync(path.join(home, "panel-session.json"), "{}");
  fs.mkdirSync(path.join(home, "panel-frames"));
  fs.writeFileSync(path.join(home, "panel-frames", "keep.png"), "x");
  fs.writeFileSync(path.join(home, "learner.json"), "{}");
  assert.equal(clearConversation(home), true);
  assert.deepEqual(fs.readdirSync(home).sort(), ["learner.json", "panel-frames", "panel-session.json"]);
  assert.deepEqual(fs.readdirSync(path.join(home, "panel-frames")), ["keep.png"]);
  assert.deepEqual(baseLoad(home), { ok: false, reason: "none" });
});

test("clearing with nothing there is fine, even with no home folder", () => {
  const home = tempHome();
  assert.equal(clearConversation(home), true);
  assert.equal(clearConversation(path.join(home, "does-not-exist")), true);
});

// ---------- through the real loop (FR-015, FR-023, SC-007's automated half) ----------

async function lessonOn(svc, home) {
  const state = path.join(home, "fixture-state.json");
  fs.writeFileSync(state, JSON.stringify({ project: FIXTURE }));
  const mcp = createMcpClient({ mcpConfig: path.join(REPO, ".mcp.json"), home, fixtureEnv: { AE_MENTOR_FIXTURE_STATE: state } });
  cleanups.push(() => mcp.stop());
  // The real server, with a frame added to each result so the history carries an image.
  const withFrame = {
    start: () => mcp.start(),
    stop: () => mcp.stop(),
    callTool: async (name, input) => {
      const r = await mcp.callTool(name, input);
      return { ...r, content: [...r.content, { type: "image", data: PNG, mimeType: "image/png" }] };
    },
  };
  return createLesson({
    getClient: async () => createClient({ apiKey: "sk-ant-api03-CONVKEY_abcdefghijklm", baseURL: svc.url }),
    mcp: withFrame,
    settings: Object.freeze({ ...SETTINGS }),
    prices,
    preamble: loadPreamble(HELPER_DIR),
    skillTool: loadSkillTool(HELPER_DIR),
    skillsDir: SKILLS,
  });
}

async function service() {
  const svc = await startFakeService();
  cleanups.push(() => svc.close());
  return svc;
}

const noBreakpoints = (messages) => JSON.parse(JSON.stringify(withoutBreakpoints(messages)));

test("the resumed request's history equals what was sent before, byte for byte", async () => {
  const svc = await service();
  const home = tempHome();
  const first = await lessonOn(svc, home);
  svc.script(reply([thinking("look first"), text("Let me look."), toolUse("snapshot_project", { detail: "café" })], { stop_reason: "tool_use" }));
  svc.script(reply([thinking("then answer"), text("Your turn — ease “Title”.")]));
  const done = await first.runTurn("/ease-mentor", () => {});
  assert.equal(done.ok, true);
  assert.deepEqual(baseSave(home, first.messages), { saved: true });

  // What went over the wire last, plus the answer it got.
  const sentLast = noBreakpoints(svc.messageRequests[1].body.messages);
  const before = [...sentLast, first.messages[first.messages.length - 1]];
  assert.equal(JSON.stringify(before), JSON.stringify(first.messages));
  assert.equal(JSON.stringify(sentLast).includes(PNG), true, "the frame went to the model");
  assert.equal(fs.readFileSync(convFile(home), "utf8").includes(PNG), false, "the frame isn't in the file");

  // The panel closes; a new helper process loads the file.
  const loaded = baseLoad(home);
  assert.equal(loaded.ok, true);
  const second = await lessonOn(svc, home);
  second.messages.push(...loaded.conversation.messages);
  svc.script(reply([text("Picking up where we left off.")]));
  // Opened with the skill's command so this lesson has the first one's tools (T044 restores them).
  assert.equal((await second.runTurn("/ease-mentor I eased it", () => {})).ok, true);

  const resumed = noBreakpoints(svc.messageRequests[2].body.messages);
  assert.equal(JSON.stringify(resumed.slice(0, before.length)), JSON.stringify(before));
  assert.deepEqual(resumed.slice(before.length), [{ role: "user", content: [{ type: "text", text: "/ease-mentor I eased it" }] }]);
});

test("a turn that fails mid-answer saves its complete exchanges and none of its tail", async () => {
  const svc = await service();
  const home = tempHome();
  const lesson = await lessonOn(svc, home);
  svc.script(reply([text("Let me look."), toolUse("snapshot_project", {})], { stop_reason: "tool_use" }));
  // Enough drops to use up the SDK's retries, if it makes any for a dropped stream.
  for (let i = 0; i < 3; i++) svc.script(drop([text("Half an ans"), toolUse("snapshot_project", {})], 1));
  const r = await lesson.runTurn("/ease-mentor", () => {});
  assert.equal(r.ok, false);

  assert.deepEqual(baseSave(home, lesson.messages), { saved: true });
  const saved = baseLoad(home).conversation.messages;
  assert.deepEqual(saved.map((m) => m.role), ["user", "assistant", "user"]);
  assert.equal(saved[2].content[0].type, "tool_result");
  assert.equal(JSON.stringify(saved).includes("Half an ans"), false);
});
