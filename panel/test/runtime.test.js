"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { ensureRuntime } = require("../lib/runtime.js");

function repo(mcp) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "panel-runtime-"));
  const r = path.join(root, "repo");
  fs.mkdirSync(path.join(r, ".claude", "skills", "ease-mentor"), { recursive: true });
  fs.writeFileSync(path.join(r, ".claude", "skills", "ease-mentor", "SKILL.md"), "# skill\n");
  fs.writeFileSync(path.join(r, "CLAUDE.md"), "builder notes\n");
  fs.writeFileSync(path.join(r, ".mcp.json"), JSON.stringify(mcp || {
    mcpServers: { "ae-mentor": { type: "stdio", command: "node", args: ["mentor/server.mjs"] }, other: { command: "x" } },
  }));
  return { root, repo: r, dir: path.join(root, "home", "runtime") };
}

test("the runtime folder links the skill and starts the repo's server by absolute path", () => {
  const t = repo();
  assert.equal(ensureRuntime(t.repo, t.dir), t.dir);
  assert.equal(fs.readFileSync(path.join(t.dir, ".claude", "skills", "ease-mentor", "SKILL.md"), "utf8"), "# skill\n");
  const mcp = JSON.parse(fs.readFileSync(path.join(t.dir, ".mcp.json"), "utf8"));
  assert.deepEqual(Object.keys(mcp.mcpServers), ["ae-mentor"], "only the mentor's server");
  assert.deepEqual(mcp.mcpServers["ae-mentor"].args, [path.join(t.repo, "mentor", "server.mjs")]);
  assert.equal(fs.existsSync(path.join(t.dir, "CLAUDE.md")), false, "no builder notes in the runtime folder");
});

test("running it again is safe and repoints a stale link", () => {
  const t = repo();
  ensureRuntime(t.repo, t.dir);
  ensureRuntime(t.repo, t.dir);
  const moved = path.join(t.root, "moved");
  fs.renameSync(t.repo, moved);
  ensureRuntime(moved, t.dir);
  assert.equal(fs.readlinkSync(path.join(t.dir, ".claude", "skills", "ease-mentor")), path.join(moved, ".claude", "skills", "ease-mentor"));
});

function addSkill(r, name, body) {
  fs.mkdirSync(path.join(r, ".claude", "skills", name), { recursive: true });
  fs.writeFileSync(path.join(r, ".claude", "skills", name, "SKILL.md"), body || `# ${name}\n`);
}

function runtimeSkills(dir) {
  return fs.readdirSync(path.join(dir, ".claude", "skills")).sort();
}

test("every *-mentor skill is linked, found by pattern, and nothing else from .claude/", () => {
  const t = repo();
  addSkill(t.repo, "speed-graph-mentor");
  addSkill(t.repo, "next-mentor");
  addSkill(t.repo, "learn");
  addSkill(t.repo, "sprint-review");
  addSkill(t.repo, "mentor-notes"); // doesn't end in -mentor
  fs.writeFileSync(path.join(t.repo, ".claude", "skills", "stray-mentor"), "a file, not a skill\n");
  fs.mkdirSync(path.join(t.repo, ".claude", "agents"), { recursive: true });
  fs.writeFileSync(path.join(t.repo, ".claude", "agents", "panel-builder.md"), "persona\n");
  fs.mkdirSync(path.join(t.repo, ".claude", "hooks"), { recursive: true });
  fs.writeFileSync(path.join(t.repo, ".claude", "settings.json"), "{}\n");

  ensureRuntime(t.repo, t.dir);
  assert.deepEqual(runtimeSkills(t.dir), ["ease-mentor", "next-mentor", "speed-graph-mentor"]);
  assert.deepEqual(fs.readdirSync(path.join(t.dir, ".claude")).sort(), ["hooks", "settings.json", "skills"], "no agents; hooks and settings are the panel's own (T105)");
  assert.deepEqual(fs.readdirSync(path.join(t.dir, ".claude", "hooks")), ["end-turn-after-answer.js"], "none of the repo's hooks");
  assert.notEqual(fs.readFileSync(path.join(t.dir, ".claude", "settings.json"), "utf8"), "{}\n", "not the repo's settings");
  assert.deepEqual(fs.readdirSync(t.dir).sort(), [".claude", ".mcp.json"]);
  assert.equal(fs.readFileSync(path.join(t.dir, ".claude", "skills", "next-mentor", "SKILL.md"), "utf8"), "# next-mentor\n");
  assert.equal(fs.readlinkSync(path.join(t.dir, ".claude", "skills", "speed-graph-mentor")), path.join(t.repo, ".claude", "skills", "speed-graph-mentor"));
});

test("ease-mentor alone links exactly as before", () => {
  const t = repo();
  ensureRuntime(t.repo, t.dir);
  assert.deepEqual(runtimeSkills(t.dir), ["ease-mentor"]);
  assert.equal(fs.readlinkSync(path.join(t.dir, ".claude", "skills", "ease-mentor")), path.join(t.repo, ".claude", "skills", "ease-mentor"));
});

test("a skill removed from the repo disappears on the next sync, and its files are kept", () => {
  const t = repo();
  addSkill(t.repo, "offset-mentor");
  ensureRuntime(t.repo, t.dir);
  assert.deepEqual(runtimeSkills(t.dir), ["ease-mentor", "offset-mentor"]);
  const kept = path.join(t.root, "kept-offset-mentor");
  fs.renameSync(path.join(t.repo, ".claude", "skills", "offset-mentor"), kept);
  ensureRuntime(t.repo, t.dir);
  assert.deepEqual(runtimeSkills(t.dir), ["ease-mentor"]);
  assert.equal(fs.existsSync(path.join(kept, "SKILL.md")), true);
});

test("anything else left in the runtime's skills folder is cleared, without touching the repo", () => {
  const t = repo();
  addSkill(t.repo, "learn");
  const skills = path.join(t.dir, ".claude", "skills");
  fs.mkdirSync(path.join(skills, "old-copy"), { recursive: true });
  fs.writeFileSync(path.join(skills, "old-copy", "SKILL.md"), "stale\n");
  fs.symlinkSync(path.join(t.repo, ".claude", "skills", "learn"), path.join(skills, "learn"));
  ensureRuntime(t.repo, t.dir);
  assert.deepEqual(runtimeSkills(t.dir), ["ease-mentor"]);
  assert.equal(fs.existsSync(path.join(t.repo, ".claude", "skills", "learn", "SKILL.md")), true, "only the link went");
});

test("a real folder where a link belongs is replaced by the link", () => {
  const t = repo();
  const stale = path.join(t.dir, ".claude", "skills", "ease-mentor");
  fs.mkdirSync(stale, { recursive: true });
  fs.writeFileSync(path.join(stale, "SKILL.md"), "old copy\n");
  ensureRuntime(t.repo, t.dir);
  assert.equal(fs.readlinkSync(stale), path.join(t.repo, ".claude", "skills", "ease-mentor"));
  assert.equal(fs.readFileSync(path.join(stale, "SKILL.md"), "utf8"), "# skill\n");
});

test("a repo .mcp.json with no ae-mentor server throws a plain message", () => {
  const t = repo({ mcpServers: {} });
  assert.throws(() => ensureRuntime(t.repo, t.dir), /no ae-mentor server/);
});

test("spec 014 R4: B1's folder sets no runtime flag, even if the repo's server entry has one", () => {
  const plain = repo();
  ensureRuntime(plain.repo, plain.dir);
  const a = JSON.parse(fs.readFileSync(path.join(plain.dir, ".mcp.json"), "utf8")).mcpServers["ae-mentor"];
  assert.equal(JSON.stringify(a).includes("AE_MENTOR_RUNTIME"), false);
  const t = repo({ mcpServers: { "ae-mentor": { command: "node", args: ["mentor/server.mjs"], env: { AE_MENTOR_RUNTIME: "a", AE_MENTOR_HOME: "/tmp/h" } } } });
  ensureRuntime(t.repo, t.dir);
  const b = JSON.parse(fs.readFileSync(path.join(t.dir, ".mcp.json"), "utf8")).mcpServers["ae-mentor"];
  assert.deepEqual(b.env, { AE_MENTOR_HOME: "/tmp/h" });
});

// ---------- spec 014 T105: the hook that ends the turn after an accepted give_answer (B1) ----------
const { spawnSync } = require("child_process");
const { answerAccepted, runtimeSettings, HOOK_FILE, ANSWER_TOOL } = require("../lib/runtime.js");

// What Claude Code passed the hook in the live probe (2026-11-17, Claude Code 2.1.326): an MCP tool's
// tool_response is its content blocks.
const REPLY = { kind: "describe", comp: "Intro", explanation: "In Intro, Window Matte is a solid used as a matte.", steps: [], offered_skills: [], closing_offer: "Want to ask how its shape shows up?", runtime: "b1", tags: {} };
const hookInput = (over) => Object.assign({ session_id: "s", hook_event_name: "PostToolUse", tool_name: ANSWER_TOOL, tool_input: {}, tool_response: [{ type: "text", text: JSON.stringify(REPLY, null, 2) }], tool_use_id: "toolu_1" }, over);

test("T105: an accepted give_answer ends the turn; a refusal, another tool or anything odd doesn't", () => {
  assert.equal(ANSWER_TOOL, "mcp__ae-mentor__give_answer");
  assert.equal(answerAccepted(hookInput()), true);
  for (const kind of ["answer", "describe", "howto", "clarify", "outside", "no_comp"]) assert.equal(answerAccepted(hookInput({ tool_response: [{ type: "text", text: JSON.stringify(Object.assign({}, REPLY, { kind })) }] })), true, kind);
  assert.equal(answerAccepted(hookInput({ tool_response: { content: [{ type: "text", text: JSON.stringify(REPLY) }] } })), true, "the result object shape too");
  const no = {
    "a refusal (the server's error text)": { tool_response: [{ type: "text", text: "KIND_MISMATCH: An answer has one to four steps." }] },
    "a refusal marked as an error": { tool_response: { content: [{ type: "text", text: JSON.stringify(REPLY) }], isError: true } },
    "a lesson tool": { tool_name: "mcp__ae-mentor__snapshot_project" },
    "describe_layers": { tool_name: "mcp__ae-mentor__describe_layers" },
    "a lookalike name": { tool_name: "mcp__ae-mentor__give_answer_x" },
    "an unknown kind": { tool_response: [{ type: "text", text: JSON.stringify(Object.assign({}, REPLY, { kind: "lesson" })) }] },
    "no explanation": { tool_response: [{ type: "text", text: JSON.stringify(Object.assign({}, REPLY, { explanation: 3 })) }] },
    "two text blocks": { tool_response: [{ type: "text", text: JSON.stringify(REPLY) }, { type: "text", text: "{}" }] },
    "no response": { tool_response: undefined },
    "a string response": { tool_response: JSON.stringify(REPLY) },
  };
  for (const [why, over] of Object.entries(no)) assert.equal(answerAccepted(hookInput(over)), false, why);
  assert.equal(answerAccepted(null), false);
});

test("T105: the runtime folder's settings hold only this hook, matched to give_answer alone, by absolute path", () => {
  const t = repo();
  ensureRuntime(t.repo, t.dir);
  const script = path.join(t.dir, ".claude", "hooks", HOOK_FILE);
  const settings = JSON.parse(fs.readFileSync(path.join(t.dir, ".claude", "settings.json"), "utf8"));
  assert.deepEqual(settings, runtimeSettings(script));
  assert.deepEqual(Object.keys(settings), ["hooks"], "no other setting");
  assert.deepEqual(Object.keys(settings.hooks), ["PostToolUse"]);
  const [entry] = settings.hooks.PostToolUse;
  assert.equal(settings.hooks.PostToolUse.length, 1);
  assert.equal(entry.hooks[0].command, `node ${JSON.stringify(script)}`);
  const m = new RegExp(entry.matcher);
  assert.equal(m.test("mcp__ae-mentor__give_answer"), true);
  // Every lesson skill's tools, and the ask skill's others: none match (lessons never meet the hook).
  for (const tool of ["snapshot_project", "set_ease", "diff_since_last", "record_lesson", "read_learner_record", "preview_frame", "recommend_next", "key_types_check", "speed_graph_demo", "offset_check", "anchor_snapshot", "null_parent_check", "describe_layers", "go_deeper", "note_said", "give_answer_x"]) {
    assert.equal(m.test(`mcp__ae-mentor__${tool}`), false, tool);
  }
});

function runHook(dir, input) {
  return spawnSync(process.execPath, [path.join(dir, ".claude", "hooks", HOOK_FILE)], { input: typeof input === "string" ? input : JSON.stringify(input), encoding: "utf8" });
}

test("T105: the generated script, run as Claude Code runs it: {\"continue\": false} for an accepted answer, nothing otherwise, always exit 0", () => {
  const t = repo();
  ensureRuntime(t.repo, t.dir);
  const ok = runHook(t.dir, hookInput());
  assert.equal(ok.status, 0);
  assert.deepEqual(JSON.parse(ok.stdout), { continue: false }, "no stopReason: nothing new to show (checked live: the result text stays empty)");
  for (const input of [hookInput({ tool_response: [{ type: "text", text: "BAD_OFFER: Offer at most two skills." }] }), hookInput({ tool_name: "mcp__ae-mentor__describe_layers" }), "not json", ""]) {
    const r = runHook(t.dir, input);
    assert.equal(r.status, 0);
    assert.equal(r.stdout, "", "a refusal lets the mentor try again");
    assert.equal(r.stderr, "");
  }
});

test("T105: rebuilt on every launch: a stray file in hooks/ goes, an edited script is rewritten", () => {
  const t = repo();
  ensureRuntime(t.repo, t.dir);
  const hooks = path.join(t.dir, ".claude", "hooks");
  fs.writeFileSync(path.join(hooks, "stray.js"), "x\n");
  fs.writeFileSync(path.join(hooks, HOOK_FILE), "edited\n");
  ensureRuntime(t.repo, t.dir);
  assert.deepEqual(fs.readdirSync(hooks), [HOOK_FILE]);
  assert.match(fs.readFileSync(path.join(hooks, HOOK_FILE), "utf8"), /function answerAccepted/);
  assert.equal(fs.readdirSync(path.join(t.dir, ".claude", "skills")).includes("hooks"), false);
});
