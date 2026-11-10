import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { saveConversation, loadConversation, clearConversation, isCompleteHistory, CONVERSATION_FILE, FRAMES_DIR } from "../lib/conversation.mjs";
import { createLesson, createClient, NOT_FINISHED } from "../lib/loop.mjs";
import { createMcpClient } from "../lib/mcp-client.mjs";
import { loadSettings, HELPER_DIR } from "../lib/settings.mjs";
import { loadPreamble, loadSkillTool, withoutBreakpoints } from "../lib/prompt.mjs";
import { readSkill } from "../lib/skills.mjs";
import { startFakeService, reply, drop, failure, text, thinking, toolUse } from "./fake-service.mjs";

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

// A prompt state as the loop saves it (data-model › Prompt state).
const PROMPT = Object.freeze({ start_skill: "next-mentor", skill: "ease-mentor", offered: ["snapshot_project", "set_ease", "Skill"], handed_over: false, pending_skill: "ease-mentor", request_hash: "a".repeat(64) });
const NO_SKILL = Object.freeze({ start_skill: null, skill: null, offered: ["Skill"], handed_over: false, pending_skill: null, request_hash: "b".repeat(64) });

const baseSave = (home, messages, extra = {}) => saveConversation({ home, sessionId: SESSION, settingsHash: "hash-1", model: MODEL, prompt: { ...PROMPT }, messages, ...extra });
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
  assert.deepEqual(r.conversation.prompt, PROMPT);
  assert.equal(r.conversation.settings_hash, "hash-1");
  assert.equal(r.conversation.session_id, SESSION);
  assert.equal(r.conversation.model, MODEL);
});

test("the file has the data model's fields, in its place in the learner home", () => {
  const home = tempHome();
  baseSave(home, fullHistory());
  assert.equal(CONVERSATION_FILE, "panel-conversation.json");
  assert.equal(FRAMES_DIR, "panel-conversation-frames");
  assert.deepEqual(Object.keys(readSaved(home)), ["version", "session_id", "settings_hash", "model", "prompt", "messages"]);
  assert.equal(readSaved(home).version, 2);
  assert.deepEqual(Object.keys(readSaved(home).prompt), ["start_skill", "skill", "offered", "handed_over", "pending_skill", "request_hash"]);
});

test("a lesson with no skill loaded yet saves and loads", () => {
  const home = tempHome();
  baseSave(home, [userText("hi"), answer("hello")], { prompt: { ...NO_SKILL } });
  const r = baseLoad(home);
  assert.equal(r.ok, true);
  assert.deepEqual(r.conversation.prompt, NO_SKILL);
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

// A failed save deletes the last one (data-model › Saving and clearing): an older save may be
// missing a demonstration or record_lesson that ran after it, so it must never be continued.
test("a frame that can't be written deletes the last save and its frames", () => {
  const home = tempHome();
  baseSave(home, fullHistory());
  assert.equal(fs.existsSync(path.join(framesDir(home), PNG_NAME)), true);
  fs.rmSync(framesDir(home), { recursive: true });
  fs.writeFileSync(framesDir(home), "a file where the folder should be");
  const r = baseSave(home, fullHistory());
  assert.deepEqual(r, { saved: false, reason: "write_failed", cleared: true });
  assert.deepEqual(fs.readdirSync(home), []);
  assert.deepEqual(baseLoad(home), { ok: false, reason: "none" });
});

test("a rename that fails reports it, throws nothing and leaves nothing behind", () => {
  const home = tempHome();
  fs.mkdirSync(path.join(convFile(home), "occupied"), { recursive: true });
  const r = baseSave(home, [userText("hi"), answer("one")]);
  assert.deepEqual(r, { saved: false, reason: "write_failed", cleared: true });
  assert.deepEqual(fs.readdirSync(home), []);
});

test("a failed save whose clearing fails too says so and still throws nothing", () => {
  const home = tempHome();
  baseSave(home, [userText("hi"), answer("one")]);
  fs.chmodSync(home, 0o500); // nothing in the home can be written or removed
  cleanups.push(() => fs.chmodSync(home, 0o700));
  const r = baseSave(home, [userText("hi"), answer("one"), userText("more"), answer("two")]);
  assert.deepEqual(r, { saved: false, reason: "write_failed", cleared: false });
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
  ["no prompt state", "unreadable", (home) => rewriteSaved(home, (s) => delete s.prompt)],
  ["a prompt state that isn't an object", "unreadable", (home) => rewriteSaved(home, (s) => (s.prompt = "ease-mentor"))],
  ["a prompt field missing", "unreadable", (home) => rewriteSaved(home, (s) => delete s.prompt.pending_skill)],
  ["a prompt field unknown", "unreadable", (home) => rewriteSaved(home, (s) => (s.prompt.extra = 1))],
  ["a skill that isn't a mentor skill", "unreadable", (home) => rewriteSaved(home, (s) => (s.prompt.skill = "../builder"))],
  ["a start skill that isn't text", "unreadable", (home) => rewriteSaved(home, (s) => (s.prompt.start_skill = 7))],
  ["a waiting skill that isn't a mentor skill", "unreadable", (home) => rewriteSaved(home, (s) => (s.prompt.pending_skill = "x"))],
  ["offered tools that aren't a list of names", "unreadable", (home) => rewriteSaved(home, (s) => (s.prompt.offered = ["a", 2]))],
  ["handed_over that isn't true or false", "unreadable", (home) => rewriteSaved(home, (s) => (s.prompt.handed_over = "no"))],
  ["a request hash that isn't one", "unreadable", (home) => rewriteSaved(home, (s) => (s.prompt.request_hash = "short"))],
  ["a settings hash that isn't text", "unreadable", (home) => rewriteSaved(home, (s) => (s.settings_hash = null))],
  ["its tail incomplete", "unreadable", (home) => rewriteSaved(home, (s) => s.messages.splice(-2))],
  ["another version", "version", (home) => rewriteSaved(home, (s) => (s.version = 3))],
  // T043's file as merged: version 1, a top-level skill and no prompt state.
  ["a version 1 file", "version", (home) => rewriteSaved(home, (s) => { s.version = 1; s.skill = "ease-mentor"; delete s.prompt; })],
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

// ---------- through the real loop (FR-015, FR-023, FR-023a, SC-007's automated half) ----------
//
// The rule (data-model › Continuing): a continued lesson's next request is exactly the request the
// same helper would have sent had it stayed open and the turn in progress at the close had failed
// at that moment. So each case runs one lesson (the "live" one, which saves after each complete
// exchange as main.mjs does) up to a turn that fails at the point of the close, takes the file as
// it stands, lets the live lesson send the next text, then opens a second lesson from the file
// (a new ae-mentor, as a new helper process would start) and sends the same text. The two
// requests must be equal byte for byte: params, betas and messages, cache markers aside.

const OPUS = {};
const HAIKU = { model: "claude-haiku-5-5", fallbacks: null, thinking_display: "omitted" };
const MODELS = [["Opus 5.5", OPUS], ["Haiku 5.5", HAIKU]];
const FAST = { "retry-after-ms": "1" };
const busy = () => [failure(529, "overloaded_error", "o", FAST), failure(529, "overloaded_error", "o", FAST), failure(529, "overloaded_error", "o", FAST)];
const BACK = "I'm back. Pick up where we left off.";

async function service() {
  const svc = await startFakeService();
  cleanups.push(() => svc.close());
  return svc;
}

// The real ae-mentor in fixture mode, with a frame added to each result so the history carries an
// image (and the file a frame). hang(name) → true makes that call hang, sent and never answered.
function mentorOn(home, { hang, change } = {}) {
  const state = path.join(home, "fixture-state.json");
  if (!fs.existsSync(state)) fs.writeFileSync(state, JSON.stringify({ project: FIXTURE }));
  const mcp = createMcpClient({ mcpConfig: path.join(REPO, ".mcp.json"), home, fixtureEnv: { AE_MENTOR_FIXTURE_STATE: state } });
  cleanups.push(() => mcp.stop());
  const calls = [];
  return {
    calls,
    start: async () => (change ? change(await mcp.start()) : mcp.start()),
    stop: () => mcp.stop(),
    pid: () => mcp.pid(),
    callTool: async (name, input) => {
      calls.push(name);
      if (hang && hang(name)) return new Promise(() => {});
      const r = await mcp.callTool(name, input);
      return { ...r, content: [...r.content, { type: "image", data: PNG, mimeType: "image/png" }] };
    },
  };
}

// opts: { patch (settings), skillsDir, preamble, resume (a loaded conversation), freshSkill,
// mentor (mentorOn's options), save (false: no saving), onResume }
function lessonIn(svc, home, opts = {}) {
  const settings = Object.freeze({ ...SETTINGS, ...(opts.patch || {}) });
  const mcp = mentorOn(home, opts.mentor);
  const lesson = createLesson({
    getClient: async () => createClient({ apiKey: "sk-ant-api03-CONVKEY_abcdefghijklm", baseURL: svc.url }),
    mcp,
    settings,
    prices,
    preamble: opts.preamble ?? loadPreamble(HELPER_DIR),
    skillTool: loadSkillTool(HELPER_DIR),
    skillsDir: opts.skillsDir || SKILLS,
    resume: opts.resume || null,
    freshSkill: opts.freshSkill || null,
    onResume: opts.onResume,
    onComplete:
      opts.save === false
        ? undefined
        : ({ messages, prompt }) => {
            const r = saveConversation({ home, sessionId: SESSION, settingsHash: "hash-1", model: settings.model, prompt, messages });
            assert.deepEqual(r, { saved: true }, "every complete exchange saves");
          },
  });
  let events = [];
  return {
    lesson,
    mcp,
    settings,
    events: () => events,
    turn: async (t) => {
      events = [];
      return lesson.runTurn(t, (type, payload) => events.push({ type, ...payload }));
    },
  };
}

const strip = (v) => JSON.stringify(withoutBreakpoints(v));
const lastRequest = (svc) => svc.messageRequests.at(-1);

// Takes the file as it stands at the close, has the live lesson send `next` (the reference), then
// a lesson opened from the file sends `next` too. → { ref, cont, live, opened, saved }.
async function closeAndContinue(svc, home, live, { next = BACK, answer = [text("Welcome back.")], patch, skillsDir } = {}) {
  const loaded = baseLoad(home, { model: live.settings.model });
  assert.equal(loaded.ok, true, `the file loads (${loaded.reason})`);
  const saved = loaded.conversation;

  svc.script(reply(answer));
  const liveEnd = await live.turn(next);
  assert.equal(liveEnd.ok, true);
  const ref = lastRequest(svc);

  const resumes = [];
  const opened = lessonIn(svc, home, { patch, skillsDir, resume: saved, freshSkill: "ease-mentor", onResume: (r) => resumes.push(r) });
  assert.deepEqual(await opened.lesson.settleResume(), { resumed: true });
  assert.deepEqual(resumes, [{ resumed: true }]);
  assert.equal(opened.lesson.skill, saved.prompt.skill);
  svc.script(reply(answer));
  const openedEnd = await opened.turn(next);
  assert.equal(openedEnd.ok, true);
  const cont = lastRequest(svc);

  assert.deepEqual(svc.rejected, [], "the fake service rejected a request as invalid");
  assert.equal(svc.pending(), 0, "every scripted reply was used");
  assert.equal(strip(cont.body), strip(ref.body), "the continued request is the uninterrupted one, byte for byte");
  assert.equal(cont.headers["anthropic-beta"], ref.headers["anthropic-beta"], "the same betas");
  assert.equal(openedEnd.prompt_hash, liveEnd.prompt_hash, "turn_end reports the same prompt_hash");
  assert.equal(openedEnd.skill, liveEnd.skill);
  return { ref: ref.body, cont: cont.body, live, opened, saved };
}

// Turn 1 of an easing lesson: the snapshot, then a line. → the demo target ae-mentor named.
async function easeOpening(svc, live) {
  svc.script(reply([thinking("", "sig-open"), text("Let me look."), toolUse("snapshot_project", { detail: "café" }, "tu_open")], { stop_reason: "tool_use" }), reply([thinking("", "sig-open2"), text("Your Title moves at one speed.")]));
  assert.equal((await live.turn("/ease-mentor")).ok, true);
  const target = live.events().find((e) => e.type === "tool_result").json.demo_target;
  assert.equal(typeof target, "string", "the fixture has a demo target");
  return target;
}

async function nextOpening(svc, live) {
  svc.script(reply([thinking("", "sig-next"), text("Easing is next. Want to start?")]));
  assert.equal((await live.turn("/next-mentor")).ok, true);
}

const handOver = (id = "tu_hand") => reply([thinking("", `sig-${id}`), text("Easing it is."), toolUse("Skill", { skill: "ease-mentor" }, id)], { stop_reason: "tool_use" });
const systemMessages = (body) => body.messages.filter((m) => m.role === "system");
const EASE_BODY = readSkill(SKILLS, "ease-mentor").body;
const bodyText = (m) => m.content.filter((b) => b.type === "text").map((b) => b.text).join("");

test("the file holds the history and the prompt state of the last complete exchange, frames as files", async () => {
  const svc = await service();
  const home = tempHome();
  const live = lessonIn(svc, home);
  await easeOpening(svc, live);
  const raw = fs.readFileSync(convFile(home), "utf8");
  assert.equal(raw.includes(PNG), false, "the frame isn't in the file");
  assert.equal(fs.existsSync(path.join(framesDir(home), PNG_NAME)), true);
  const saved = baseLoad(home).conversation;
  assert.equal(strip(saved.messages), strip(live.lesson.messages));
  // offered: what the first request declared without defer_loading, in the declared order.
  const offered = svc.messageRequests[0].body.tools.filter((t) => !t.defer_loading).map((t) => t.name);
  assert.deepEqual(offered.slice().sort(), readSkill(SKILLS, "ease-mentor").allowedTools.slice().sort());
  assert.deepEqual({ ...saved.prompt, request_hash: "-" }, { start_skill: "ease-mentor", skill: "ease-mentor", offered, handed_over: false, pending_skill: null, request_hash: "-" });
  assert.match(saved.prompt.request_hash, /^[0-9a-f]{64}$/);
});

test("continuing: a plain lesson after the demo, closed during the next turn's first request", async () => {
  const svc = await service();
  const home = tempHome();
  const live = lessonIn(svc, home);
  const target = await easeOpening(svc, live);
  svc.script(reply([thinking("", "sig-demo"), text("Watch the first pair."), toolUse("set_ease", { segment_id: target }, "tu_demo")], { stop_reason: "tool_use" }), reply([text("Your turn on the rest.")]));
  assert.equal((await live.turn("Show me one.")).ok, true);
  svc.script(...busy());
  assert.equal((await live.turn("I eased the rest.")).error_kind, "service_busy");

  const { cont, saved } = await closeAndContinue(svc, home, live);
  assert.equal(saved.prompt.pending_skill, null);
  assert.equal(JSON.stringify(cont).includes("I eased the rest."), false, "a message whose turn completed nothing isn't there");
  assert.equal(live.mcp.calls.filter((n) => n === "set_ease").length, 1, "the demo ran once");
  assert.ok(JSON.stringify(cont).includes("tu_demo"), "the demo is in the continued history");
});

for (const [model, patch] of MODELS) {
  test(`hand-over across a close, ${model}: the Skill call written, its result not in (the answer cut off)`, async () => {
    const svc = await service();
    const home = tempHome();
    const live = lessonIn(svc, home, { patch });
    await nextOpening(svc, live);
    svc.script(drop([text("Easing it is."), toolUse("Skill", { skill: "ease-mentor" }, "tu_hand")], 1));
    const r = await live.turn("Yes.");
    assert.equal(r.ok, false);
    assert.equal(live.lesson.skill, "next-mentor");
    const { cont, saved } = await closeAndContinue(svc, home, live, { patch });
    assert.equal(saved.prompt.skill, "next-mentor");
    assert.equal(saved.prompt.pending_skill, null);
    assert.equal(systemMessages(cont).length, 0, "no hand-over");
  });

  test(`hand-over across a close, ${model}: the Skill exchange completed, its body placed for a request that never finished`, async () => {
    const svc = await service();
    const home = tempHome();
    const live = lessonIn(svc, home, { patch });
    await nextOpening(svc, live);
    svc.script(handOver(), ...busy());
    const r = await live.turn("Yes.");
    assert.equal(r.error_kind, "service_busy");
    assert.equal(live.lesson.skill, "ease-mentor");
    const { cont, saved } = await closeAndContinue(svc, home, live, { patch });
    assert.deepEqual([saved.prompt.start_skill, saved.prompt.skill, saved.prompt.pending_skill], ["next-mentor", "ease-mentor", "ease-mentor"]);
    assert.equal(saved.prompt.handed_over, patch === HAIKU);
    // The next text joins the last user message (M1), then one system message with the body.
    assert.deepEqual(cont.messages.slice(-2).map((m) => m.role), ["user", "system"]);
    assert.deepEqual(cont.messages.at(-2).content.map((b) => b.type), ["tool_result", "text"]);
    assert.equal(systemMessages(cont).length, 1, "the body goes in once");
    assert.equal(bodyText(cont.messages.at(-1)), EASE_BODY);
  });

  test(`hand-over across a close, ${model}: the body went in and an exchange after it completed`, async () => {
    const svc = await service();
    const home = tempHome();
    const live = lessonIn(svc, home, { patch });
    await nextOpening(svc, live);
    svc.script(handOver(), reply([thinking("", "sig-snap"), toolUse("snapshot_project", {}, "tu_snap")], { stop_reason: "tool_use" }), ...busy());
    assert.equal((await live.turn("Yes.")).error_kind, "service_busy");
    const { cont, saved } = await closeAndContinue(svc, home, live, { patch });
    assert.equal(saved.prompt.pending_skill, null);
    assert.equal(saved.prompt.skill, "ease-mentor");
    assert.equal(systemMessages(cont).length, 1, "the body isn't sent twice");
  });

  test(`hand-over across a close, ${model}: a typed command with no exchange completed after it`, async () => {
    const svc = await service();
    const home = tempHome();
    const live = lessonIn(svc, home, { patch });
    await nextOpening(svc, live);
    svc.script(...busy());
    assert.equal((await live.turn("/ease-mentor")).error_kind, "service_busy");
    assert.equal(live.lesson.skill, "next-mentor", "the switch went back with the turn");
    const { cont, saved } = await closeAndContinue(svc, home, live, { patch });
    assert.equal(saved.prompt.skill, "next-mentor");
    assert.equal(systemMessages(cont).length, 0);
    assert.equal(JSON.stringify(cont.messages).includes("/ease-mentor"), false, "the learner's message isn't there");
  });

  test(`hand-over across a close, ${model}: the reply right after the placed body was empty`, async () => {
    const svc = await service();
    const home = tempHome();
    const live = lessonIn(svc, home, { patch });
    await nextOpening(svc, live);
    svc.script(handOver(), reply([], { stop_reason: "end_turn" }));
    assert.equal((await live.turn("Yes.")).ok, true);
    const { cont, saved } = await closeAndContinue(svc, home, live, { patch });
    assert.equal(saved.prompt.pending_skill, "ease-mentor", "as the second row");
    assert.equal(systemMessages(cont).length, 1);
    assert.equal(bodyText(cont.messages.at(-1)), EASE_BODY);
  });

  test(`a chain of two hand-overs, ${model}: next-mentor to easing by the hand-over tool, then to the speed graph by command`, async () => {
    const svc = await service();
    const home = tempHome();
    const live = lessonIn(svc, home, { patch });
    await nextOpening(svc, live);
    svc.script(handOver(), reply([thinking("", "sig-ease"), text("Let's ease.")]));
    assert.equal((await live.turn("Yes.")).ok, true);
    svc.script(reply([thinking("", "sig-sg"), text("Speed graph time.")]));
    assert.equal((await live.turn("/speed-graph-mentor")).ok, true);
    svc.script(...busy());
    assert.equal((await live.turn("Ok.")).error_kind, "service_busy");
    const { cont, saved } = await closeAndContinue(svc, home, live, { patch });
    assert.deepEqual([saved.prompt.start_skill, saved.prompt.skill, saved.prompt.pending_skill], ["next-mentor", "speed-graph-mentor", null]);
    assert.equal(systemMessages(cont).length, 2, "both hand-overs are in the history, once each");
  });
}

test("continuing a history that ends on tool results (M1): the next text joins that message", async () => {
  const svc = await service();
  const home = tempHome();
  const live = lessonIn(svc, home);
  const target = await easeOpening(svc, live);
  svc.script(
    reply([thinking("", "sig-d"), text("Watch."), toolUse("set_ease", { segment_id: target }, "tu_demo")], { stop_reason: "tool_use" }),
    reply([thinking("", "sig-c"), toolUse("diff_since_last", {}, "tu_diff")], { stop_reason: "tool_use" }),
    ...busy(),
  );
  assert.equal((await live.turn("Show me one.")).error_kind, "service_busy");
  assert.equal(live.lesson.messages.at(-1).role, "user");
  const { cont } = await closeAndContinue(svc, home, live);
  assert.deepEqual(cont.messages.at(-1).content.map((b) => b.type), ["tool_result", "text"]);
  assert.equal(cont.messages.at(-1).content.at(-1).text, BACK);
});

test("stop during a demo call: the call is saved with the didn't-finish result, and continuing doesn't demonstrate again", async () => {
  const svc = await service();
  const home = tempHome();
  let hang = false;
  const live = lessonIn(svc, home, { mentor: { hang: (name) => hang && name === "set_ease" } });
  const target = await easeOpening(svc, live);
  hang = true;
  svc.script(reply([thinking("", "sig-w"), text("Watch."), toolUse("set_ease", { segment_id: target }, "tu_demo"), toolUse("diff_since_last", {}, "tu_diff")], { stop_reason: "tool_use" }));
  const turn = live.turn("Show me one.");
  while (!live.mcp.calls.includes("set_ease")) await new Promise((r) => setTimeout(r, 10));
  live.lesson.stop();
  const r = await turn;
  assert.equal(r.ok, false);
  assert.deepEqual(live.mcp.calls.filter((n) => n === "diff_since_last"), [], "nothing is sent after the stop");
  const res = baseLoad(home).conversation.messages.at(-1).content;
  assert.deepEqual(res, [
    { type: "tool_result", tool_use_id: "tu_demo", content: [{ type: "text", text: NOT_FINISHED }], is_error: true },
    { type: "tool_result", tool_use_id: "tu_diff", content: [{ type: "text", text: "That call didn't run." }], is_error: true },
  ]);
  hang = false;
  const { cont } = await closeAndContinue(svc, home, live);
  assert.ok(strip(cont).includes(NOT_FINISHED));
});

test("stop while a request streams: nothing of the turn is saved", async () => {
  const svc = await service();
  const home = tempHome();
  const live = lessonIn(svc, home);
  await easeOpening(svc, live);
  const before = fs.readFileSync(convFile(home), "utf8");
  svc.script(reply([text("never")], { hang: true }));
  const turn = live.turn("Show me one.");
  while (svc.messageRequests.length < 3) await new Promise((r) => setTimeout(r, 10));
  live.lesson.stop();
  assert.equal((await turn).ok, false);
  assert.equal(fs.readFileSync(convFile(home), "utf8"), before);
});

// ---------- not continued: something that goes in a request changed (FR-023a, OQ-C1) ----------

function copySkills() {
  const dir = tempHome();
  fs.cpSync(SKILLS, dir, { recursive: true });
  return dir;
}

// A lesson handed over to easing, closed with the body waiting (the second row), so the file names
// a start skill, an active skill and a waiting one. → { svc, home, saved, skillsDir }.
async function savedHandOver(skillsDir) {
  const svc = await service();
  const home = tempHome();
  const live = lessonIn(svc, home, { skillsDir });
  await nextOpening(svc, live);
  svc.script(handOver(), ...busy());
  assert.equal((await live.turn("Yes.")).error_kind, "service_busy");
  const loaded = baseLoad(home);
  assert.equal(loaded.ok, true);
  return { svc, home, saved: loaded.conversation, live };
}

const CHANGES = [
  ["the opening skill's SKILL.md", (o) => fs.appendFileSync(path.join(o.skillsDir, "next-mentor", "SKILL.md"), "\nOne more line.\n")],
  ["the active and waiting skill's SKILL.md", (o) => fs.appendFileSync(path.join(o.skillsDir, "ease-mentor", "SKILL.md"), "\nOne more line.\n")],
  ["the opening skill gone", (o) => fs.rmSync(path.join(o.skillsDir, "next-mentor"), { recursive: true })],
  ["the preamble", (o) => (o.preamble = loadPreamble(HELPER_DIR) + "\nChanged.")],
  ["a server tool's definition", (o) => (o.mentor = { change: (srv) => ({ ...srv, tools: srv.tools.map((t, i) => (i === 0 ? { ...t, description: `${t.description} Changed.` } : t)) }) })],
  ["the server's instructions", (o) => (o.mentor = { change: (srv) => ({ ...srv, instructions: `${srv.instructions} Changed.` }) })],
  ["a request setting (effort)", (o) => (o.patch = { effort: "high" })],
  ["a request setting (max_tokens)", (o) => (o.patch = { max_tokens: 16000 })],
];

for (const [what, change] of CHANGES) {
  test(`not continued when ${what} changed: reason prompt, then a fresh start on the opening skill`, async () => {
    const skillsDir = copySkills();
    const { svc, home, saved } = await savedHandOver(skillsDir);
    const o = { skillsDir };
    change(o);
    const resumes = [];
    const opened = lessonIn(svc, home, { ...o, resume: saved, freshSkill: "ease-mentor", onResume: (r) => resumes.push(r) });
    assert.deepEqual(await opened.lesson.settleResume(), { resumed: false, reason: "prompt" });
    assert.deepEqual(resumes, [{ resumed: false, reason: "prompt" }]);
    assert.equal(opened.lesson.skill, null);
    assert.deepEqual(opened.lesson.messages, []);

    // The first send builds the prompt as if it started with the opening skill's command; the
    // text goes in unchanged, and nothing alarming is said (no error).
    svc.script(reply([text("Let's look at your easing.")]));
    const end = await opened.turn(BACK);
    assert.equal(end.ok, true);
    assert.equal(end.error_kind, null);
    assert.equal(end.skill, "ease-mentor");
    assert.ok(!opened.events().some((e) => e.type === "error"));
    const body = lastRequest(svc).body;
    assert.deepEqual(withoutBreakpoints(body.messages), [{ role: "user", content: [{ type: "text", text: BACK }] }]);
    assert.equal(body.system.at(-1).text, readSkill(skillsDir, "ease-mentor").body);
  });
}

test("still continued when only the cache lifetime changed: moving or retiming a breakpoint isn't an edit", async () => {
  const { svc, home, saved } = await savedHandOver();
  const opened = lessonIn(svc, home, { patch: { cache_ttl: "1h" }, resume: saved });
  assert.deepEqual(await opened.lesson.settleResume(), { resumed: true });
  assert.equal(svc.rejected.length, 0);
});

test("a fresh start with no command and no opening skill loads nothing, as before", async () => {
  const svc = await service();
  const home = tempHome();
  const opened = lessonIn(svc, home);
  svc.script(reply([text("Hi.")]));
  assert.equal((await opened.turn(BACK)).skill, null);
  assert.equal(lastRequest(svc).body.system.length, 2);
});

test("the opening skill is used only when continuing was refused; a command in the first text still wins", async () => {
  const svc = await service();
  const home = tempHome();
  const opened = lessonIn(svc, home, { freshSkill: "ease-mentor", resume: { messages: [], prompt: { start_skill: "nope-mentor", skill: "nope-mentor", offered: null, handed_over: false, pending_skill: null, request_hash: "0".repeat(64) } } });
  assert.deepEqual(await opened.lesson.settleResume(), { resumed: false, reason: "prompt" });
  svc.script(reply([text("Offsets.")]));
  assert.equal((await opened.turn("/offset-mentor")).skill, "offset-mentor");
});
