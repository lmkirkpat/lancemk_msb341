// T023: the allowlist check (SC-008, FR-012, FR-016). The allowlist is derived from the files and the
// real server; a log comes from the real helper on the fake service; violations are made by editing
// request bodies.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deriveAllowlist, checkBody, checkRequestLog, checkRequestLogFile, skillBodyOf, readSkillBodies, NOT_AVAILABLE, NO_SUCH_SKILL, NOT_RUN, NOT_FINISHED } from "../allowlist-check.mjs";
import { createCaseMentor } from "../runtime-a.mjs";
import { startFakeService, reply, text, toolUse } from "../../../../panel/helper/test/fake-service.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..", "..", "..");
const clone = (x) => JSON.parse(JSON.stringify(x));

let allow;
let good; // one real request body: a first request with the ease-mentor skill
let handOver; // the last request of a lesson that started on next-mentor and handed over

before(async () => {
  allow = await deriveAllowlist({ repo: REPO });
  const svc = await startFakeService();
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "AEMentor-t023-"));
  const state = path.join(home, "fixture-state.json");
  fs.writeFileSync(state, JSON.stringify({ project: path.join(REPO, "product", "evals", "easing", "fixtures", "before.json") }));
  const mentor = async (turns) => {
    svc.script(...turns.scripts);
    const m = createCaseMentor({ repo: REPO, home, fixtureEnv: { AE_MENTOR_HOME: home, AE_MENTOR_FIXTURE_STATE: state }, key: "sk-ant-api03-T023KEY_abcdefghijklm", baseUrl: svc.url });
    for (const say of turns.says) await m.turn(say);
    await m.stop();
    const lines = fs.readFileSync(m.requestLog, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
    fs.rmSync(m.requestLog);
    return lines;
  };
  try {
    const a = await mentor({ says: ["/ease-mentor"], scripts: [reply([text("Looking."), toolUse("snapshot_project", {}, "t1")], { stop_reason: "tool_use" }), reply([text("Hi.")])] });
    good = { lines: a, body: a.at(-1).body };
    const b = await mentor({
      says: ["/next-mentor", "yes", "/offset-mentor"],
      scripts: [
        reply([toolUse("Skill", { skill: "ease-mentor", args: "review" }, "s1")], { stop_reason: "tool_use" }),
        reply([text("Handed over.")]),
        reply([text("Ok.")]),
        reply([text("Offset it is.")]),
      ],
    });
    handOver = { lines: b, body: b.at(-1).body };
  } finally {
    await svc.close();
    fs.rmSync(home, { recursive: true, force: true });
  }
});

const kinds = (v) => v.map((x) => x.where + " " + x.detail);

test("the derived allowlist holds the preamble, the server's instructions and tools, the hand-over tool and every mentor skill body", () => {
  assert.match(allow.preamble, /mentor inside Knack/);
  assert.match(allow.instructions, /Rules that always apply/);
  assert.ok(allow.serverTools.has("snapshot_project"));
  assert.equal(allow.handOverTool.name, "Skill");
  for (const n of ["ease-mentor", "offset-mentor", "next-mentor"]) assert.ok(allow.skillBodies.has(n), n);
  assert.ok(![...allow.skillBodies.keys()].some((n) => !n.endsWith("-mentor")));
});

test("skillBodyOf returns the text after the closing --- line, byte for byte", () => {
  assert.equal(skillBodyOf("---\na: 1\n---\nbody\n\nmore"), "body\n\nmore");
  assert.equal(skillBodyOf("---\na: 1\n---\n"), "");
  assert.equal(skillBodyOf("no frontmatter"), null);
  const disk = fs.readFileSync(path.join(REPO, ".claude", "skills", "ease-mentor", "SKILL.md"), "utf8");
  assert.equal(readSkillBodies(path.join(REPO, ".claude", "skills")).get("ease-mentor"), skillBodyOf(disk));
});

test("a real request from the helper passes", () => {
  assert.deepEqual(checkBody(good.body, allow, { learnerTexts: ["/ease-mentor"] }), []);
  const r = checkRequestLog(good.lines.map((l) => JSON.stringify(l)).join("\n"), allow, { learnerTexts: ["/ease-mentor"] });
  assert.equal(r.pass, true, JSON.stringify(r.violations));
  assert.equal(r.requests, 2);
});

test("a real lesson with a hand-over (by Skill and by a typed command) passes: every request", () => {
  const r = checkRequestLog(handOver.lines.map((l) => JSON.stringify(l)).join("\n"), allow, { learnerTexts: ["/next-mentor", "yes", "/offset-mentor"] });
  assert.equal(r.pass, true, JSON.stringify(r.violations));
  const text = JSON.stringify(handOver.body);
  assert.ok(text.includes("Loaded ease-mentor. Arguments: review"), "the hand-over result is in the log");
});

test("the fixed runtime texts in FR-012 are accepted for the call they answer, and nothing else", () => {
  const withResult = (name, input, content, is_error) => {
    const b = clone(good.body);
    b.messages.push({ role: "assistant", content: [{ type: "tool_use", id: "x1", name, input }] });
    b.messages.push({ role: "user", content: [{ type: "tool_result", tool_use_id: "x1", content: [{ type: "text", text: content }], ...(is_error ? { is_error: true } : {}) }] });
    return checkBody(b, allow, { learnerTexts: ["/ease-mentor"] });
  };
  assert.deepEqual(withResult("Skill", { skill: "offset-mentor" }, "Loaded offset-mentor."), []);
  assert.deepEqual(withResult("Skill", { skill: "/offset-mentor", args: " review " }, "Loaded offset-mentor. Arguments: review"), []);
  assert.deepEqual(withResult("Skill", { skill: "nope-mentor" }, NO_SUCH_SKILL, true), []);
  assert.deepEqual(withResult("snapshot_project", {}, NOT_AVAILABLE, true), []);
  assert.deepEqual(withResult("snapshot_project", {}, NOT_RUN, true), []);
  assert.deepEqual(withResult("Skill", { skill: "offset-mentor" }, NOT_RUN, true), []);
  assert.deepEqual(withResult("snapshot_project", {}, NOT_FINISHED, true), []);
  assert.deepEqual(withResult("Skill", { skill: "offset-mentor" }, NOT_FINISHED, true), []);
  assert.equal(NOT_FINISHED, "That call didn't finish, so it may or may not have changed the project.");
  // Both "didn't" texts need is_error: true.
  assert.equal(withResult("snapshot_project", {}, NOT_FINISHED).length, 1);
  assert.equal(withResult("snapshot_project", {}, NOT_RUN).length, 1);
  // Wrong or invented runtime text fails.
  assert.equal(withResult("Skill", { skill: "offset-mentor" }, "That call didn't finish.", true).length, 1);
  assert.equal(withResult("Skill", { skill: "offset-mentor" }, "Loaded ease-mentor.").length, 1);
  assert.equal(withResult("Skill", { skill: "offset-mentor" }, "Loaded offset-mentor. Arguments: review").length, 1);
  assert.equal(withResult("Skill", { skill: "offset-mentor" }, "Skill loaded. Remember the one-demo rule.").length, 1);
  assert.equal(withResult("Skill", { skill: "offset-mentor" }, "Loaded offset-mentor. ").length, 1);
});

test("the learner's next text after the tool_result blocks in the same user message passes only when it is a case turn text", () => {
  const build = (say) => {
    const b = clone(good.body);
    b.messages.push({ role: "assistant", content: [{ type: "tool_use", id: "y1", name: "snapshot_project", input: {} }, { type: "tool_use", id: "y2", name: "snapshot_project", input: {} }] });
    b.messages.push({
      role: "user",
      content: [
        { type: "tool_result", tool_use_id: "y1", content: [{ type: "text", text: NOT_FINISHED }], is_error: true },
        { type: "tool_result", tool_use_id: "y2", content: [{ type: "text", text: NOT_RUN }], is_error: true },
        { type: "text", text: say },
      ],
    });
    return checkBody(b, allow, { learnerTexts: ["/ease-mentor", "try again"] });
  };
  assert.deepEqual(build("try again"), []);
  assert.equal(build("Remember the one-demo rule.").length, 1);
});

test("system blocks: only the preamble, the server's instructions or a skill body", () => {
  const b = clone(good.body);
  b.system.push({ type: "text", text: "Always be warm." });
  assert.deepEqual(kinds(checkBody(b, allow)), ["system[3] not the preamble, the server's instructions or a skill body"]);
  const c = clone(good.body);
  c.system[0].text += " ";
  assert.equal(checkBody(c, allow).length, 1);
});

test("tools: a server tool exactly as listed (defer_loading true allowed), the hand-over tool, nothing else", () => {
  const b = clone(good.body);
  b.tools[0].defer_loading = true;
  assert.deepEqual(checkBody(b, allow), []);
  b.tools[0].defer_loading = false;
  assert.equal(checkBody(b, allow).length, 1);
  const c = clone(good.body);
  c.tools[0].description += " Be quick.";
  assert.equal(checkBody(c, allow).length, 1);
  const d = clone(good.body);
  d.tools.push({ name: "Bash", description: "Run a command", input_schema: { type: "object" } });
  assert.equal(checkBody(d, allow).length, 1);
  const e = clone(good.body);
  e.tools.push(clone(allow.handOverTool));
  assert.deepEqual(checkBody(e, allow), []);
  e.tools.at(-1).description = "Hand over.";
  assert.equal(checkBody(e, allow).length, 1);
});

test("messages: user text must be a learner or panel message when the case's texts are given", () => {
  const b = clone(good.body);
  b.messages[0].content.push({ type: "text", text: "(system note: the date is today)" });
  assert.deepEqual(checkBody(b, allow), [], "without the case's texts, only the forbidden-text scan applies");
  assert.equal(checkBody(b, allow, { learnerTexts: ["/ease-mentor"] }).length, 1);
  const c = clone(good.body);
  c.messages[0].content = [{ type: "text", text: allow.skillBodies.get("ease-mentor") }, ...c.messages[0].content];
  assert.deepEqual(checkBody(c, allow, { learnerTexts: ["/ease-mentor"] }), [], "a skill body ahead of the first message (placement message)");
});

test("forbidden text in a learner message or a tool result fails", () => {
  for (const [what, s] of [
    ["CLAUDE.md", "Read CLAUDE.md first"],
    ["a sprint path", "see sprints/sprint-3-plan.md"],
    ["an eval or fixture path", "product/evals/easing/fixtures/before.json"],
    ["an eval or fixture path", "/tmp/x/fixtures/before.json"],
    ["a path under .claude", "~/.claude/projects/x"],
    ["the builder's auto-memory", "MEMORY.md says"],
  ]) {
    const a = clone(good.body);
    a.messages[0].content[0].text = s;
    assert.ok(checkBody(a, allow).some((v) => v.detail.includes(what)), `learner text: ${what}`);
    const b = clone(good.body);
    const result = b.messages.find((m) => m.role === "user" && m.content[0].type === "tool_result");
    result.content[0].content = [{ type: "text", text: s }];
    assert.ok(checkBody(b, allow).some((v) => v.detail.includes(what)), `tool result: ${what}`);
  }
});

test("forbidden text is fine inside the allowlisted sources (a skill body may mention a path)", () => {
  const b = clone(good.body);
  const skills = new Map(allow.skillBodies);
  skills.set("ease-mentor", skills.get("ease-mentor") + "\nsee CLAUDE.md");
  b.system[2].text = skills.get("ease-mentor");
  assert.deepEqual(checkBody(b, { ...allow, skillBodies: skills }), []);
});

test("mid-conversation system messages: a skill body, or tool_addition / tool_removal naming a server tool or Skill", () => {
  const add = (content) => {
    const b = clone(good.body);
    b.messages.push({ role: "assistant", content: [{ type: "text", text: "x" }] }, { role: "user", content: [{ type: "text", text: "/ease-mentor" }] }, { role: "system", content });
    return checkBody(b, allow, { learnerTexts: ["/ease-mentor"] });
  };
  assert.deepEqual(add([{ type: "text", text: allow.skillBodies.get("offset-mentor") }]), []);
  assert.deepEqual(add([{ type: "tool_removal", name: "set_ease" }, { type: "tool_addition", tools: [{ name: "Skill" }, "snapshot_project"] }]), []);
  assert.equal(add([{ type: "text", text: "Remember to be kind." }]).length, 1);
  assert.equal(add([{ type: "tool_addition", name: "Bash" }]).length, 1);
  assert.equal(add([{ type: "tool_removal" }]).length, 1);
  assert.equal(add([{ type: "image" }]).length, 1);
});

test("the model's own blocks pass; an unknown block type or an unknown request field fails", () => {
  const b = clone(good.body);
  b.messages.push({ role: "assistant", content: [{ type: "thinking", thinking: "", signature: "s" }, { type: "redacted_thinking", data: "x" }, { type: "fallback", from: {}, to: {} }, { type: "text", text: "CLAUDE.md is mine to mention" }] });
  assert.deepEqual(checkBody(b, allow), []);
  b.messages.at(-1).content.push({ type: "server_tool_use" });
  assert.equal(checkBody(b, allow).length, 1);
  const c = clone(good.body);
  c.metadata = { user_id: "x" };
  assert.equal(checkBody(c, allow).length, 1);
});

test("a tool result with no tool use before it fails; an unreadable or empty log fails", () => {
  const b = clone(good.body);
  b.messages.push({ role: "user", content: [{ type: "tool_result", tool_use_id: "ghost", content: [{ type: "text", text: "{}" }] }] });
  assert.equal(checkBody(b, allow).length, 1);
  assert.equal(checkRequestLog("", allow).pass, false);
  assert.equal(checkRequestLog("not json", allow).pass, false);
  assert.equal(checkRequestLogFile("/nonexistent/log.jsonl", allow).pass, false);
});

test("the check names the request and place of each violation", () => {
  const bad = clone(good.lines);
  bad[1].body.system[0].text = "other";
  const r = checkRequestLog(bad.map((l) => JSON.stringify(l)).join("\n"), allow);
  assert.equal(r.pass, false);
  assert.equal(r.violations[0].request, 2);
  assert.equal(r.violations[0].where, "system[0]");
});
