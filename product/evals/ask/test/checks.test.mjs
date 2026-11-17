// Unit tests for the ask set's checks (spec 014 T032): each check passes on a good answer and fails on the
// one slip it exists for. No model, no AE. Run: node --test product/evals/ask/test/
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { askChecks, answerOf, answerCalls, refusalCode, refusalsOf, renderAnswer, pieces, fixtureFacts, wordCount } from "../checks.mjs";
import { fixtures, subset } from "../fixtures/build.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ALLOWED = ["describe_layers", "preview_frame", "give_answer"];
const FX = [{ comp: "Comp 1", layers: ["Shake Control", "rock.png"], sweeps: false }];

const STEP_1 = "Open Shake Control's Position expression and look at how it sets each hit's size: it uses the first hit's size for all three. Not something I teach yet.";
const STEP_2 = "Select Shake Control (the null, not a letter) and Pan Behind its pivot to where the hammer hits.";
const good = (over = {}) => ({
  kind: "answer", comp: "Comp 1", runtime: "a",
  explanation: "In Comp 1, rock.png rides on Shake Control, a null moved by expressions:\n- All three hits are the same size.",
  steps: [{ text: STEP_1, skill: "not_taught", layer: "Shake Control" }, { text: STEP_2, skill: "transform.anchor", layer: "Shake Control" }],
  offered_skills: ["transform.anchor"],
  closing_offer: "Try them, or want to go deeper on step 2 with *Set the pivot*?",
  tags: { "transform.anchor": "Set the pivot" },
  ...over,
});
const call = (reply, ok = true) => ({ kind: "tool", name: "give_answer", input: {}, ok, result: typeof reply === "string" ? reply : JSON.stringify(reply) });
const read = { kind: "tool", name: "describe_layers", input: {}, ok: true, result: "{}" };
const turn = (...events) => ({ events });
const answerTurn = (reply = good(), extra = []) => turn(read, ...extra, call(reply));

const EXPECT = { answers: [{ turn: 1, kind: "answer", steps: [2, 4], step_on_layer: "Shake Control", no_keyframe_skills: true }] };
const run = (turns, expect = EXPECT, over = {}) => askChecks(expect, { turns, c: {}, runtime: "a", fixtures: FX, record: null, allowed: ALLOWED, ...over });
const failed = (checks) => checks.filter((c) => !c.pass && !c.warn).map((c) => c.check);
const byName = (checks, n) => checks.find((c) => c.check === n);

test("a good answer passes every check on A", () => {
  assert.deepEqual(failed(run([answerTurn()])), []);
});

test("a good answer passes on B1 with no offered skills", () => {
  const t = answerTurn(good({ runtime: "b1", offered_skills: [] }));
  assert.deepEqual(failed(run([t], EXPECT, { runtime: "b1" })), []);
});

test("B1 with offered skills fails offers_valid; A with three, or one no step uses, fails", () => {
  assert.ok(failed(run([answerTurn(good({ runtime: "b1" }))], EXPECT, { runtime: "b1" })).includes("offers_valid@1"));
  assert.ok(failed(run([answerTurn(good({ offered_skills: ["transform.anchor", "easing.basic", "timing.offset"] }))])).includes("offers_valid@1"));
  assert.ok(failed(run([answerTurn(good({ offered_skills: ["easing.basic"] }))])).includes("offers_valid@1"));
});

test("prose next to the answer fails answer_prose_empty; a clean turn passes it", () => {
  const withProse = turn(read, { kind: "say", text: "Here's what I found." }, call(good()));
  assert.ok(failed(run([withProse])).includes("answer_prose_empty@1"));
  assert.equal(byName(run([answerTurn()]), "answer_prose_empty@1").pass, true);
});

test("no accepted answer fails answer_given and reads the refusal code", () => {
  const refused = turn(read, call("That answer was refused: BAD_OFFER. Offer only skills the steps use.", false));
  const checks = run([refused]);
  assert.ok(failed(checks).includes("answer_given@1"));
  assert.match(byName(checks, "answer_given@1").detail, /BAD_OFFER/);
  assert.equal(refusalCode("x COMP_NOT_NAMED y"), "COMP_NOT_NAMED");
  assert.deepEqual(refusalsOf([refused]), [{ turn: 1, code: "BAD_OFFER" }]);
});

test("a refusal then an accepted answer counts one refusal and passes", () => {
  const t = turn(read, call("REFUSED: TOO_MANY_STEPS", false), call(good()));
  assert.deepEqual(refusalsOf([t]), [{ turn: 1, code: "TOO_MANY_STEPS" }]);
  assert.deepEqual(failed(run([t])), []);
});

test("two accepted answers in one turn fail one_answer", () => {
  assert.ok(failed(run([turn(read, call(good()), call(good()))])).includes("one_answer@1"));
});

test("words the learner reads: field names, narration, test tells, slash commands, can't see, Undo, code", () => {
  const bad = (explanation) => failed(run([answerTurn(good({ explanation }))]));
  assert.ok(bad("In Comp 1, the value is motion_sources here.").includes("plain_words"));
  assert.ok(bad("In Comp 1, let me call the read first.").includes("no_narration"));
  assert.ok(bad("In Comp 1, this fixture rides on Shake Control.").includes("no_test_tell"));
  assert.ok(bad("In Comp 1, run /ease-mentor to learn easing.").includes("no_slash_command"));
  assert.ok(bad("In Comp 1, I can't see what Shake Control does.").includes("no_cant_see"));
  assert.ok(bad("In Comp 1, press Edit > Undo to go back.").includes("no_undo"));
  assert.ok(bad("In Comp 1, use `value + amp` instead.").includes("no_code"));
  assert.deepEqual(failed(run([answerTurn(good({ explanation: "In Comp 1, I couldn't see inside Icon, so nothing more." }))])), []);
});

test("a numbered or labelled step list in the explanation, or a repeated step, fails", () => {
  const bad = (explanation) => failed(run([answerTurn(good({ explanation }))]));
  assert.ok(bad("In Comp 1, rock.png rides on Shake Control.\n1. Open it.\n2. Pan it.").includes("no_step_list_in_prose@1"));
  assert.ok(bad("In Comp 1, rock.png rides on Shake Control. Steps: open it.").includes("no_step_list_in_prose@1"));
  assert.ok(bad(`In Comp 1, ${STEP_2}`).includes("no_step_list_in_prose@1"));
});

test("the first line must name the comp", () => {
  assert.ok(failed(run([answerTurn(good({ explanation: "rock.png rides on Shake Control, a null moved by expressions." }))])).includes("first_line_names_comp@1"));
});

test("steps: count, real layers, the not-taught marker, known skills", () => {
  assert.ok(failed(run([answerTurn(good({ steps: [good().steps[0]], offered_skills: [] }))])).includes("steps_count@1"));
  const five = Array.from({ length: 5 }, () => good().steps[1]);
  assert.ok(failed(run([answerTurn(good({ steps: five }))])).includes("steps_one_to_four@1"));
  assert.ok(failed(run([answerTurn(good({ steps: [{ ...good().steps[0], layer: "Ghost" }, good().steps[1]] }))])).includes("step_layers_real@1"));
  assert.ok(failed(run([answerTurn(good({ steps: [{ ...good().steps[0], text: "Open Shake Control's Position expression." }, good().steps[1]] }))])).includes("not_taught_marked@1"));
  assert.ok(failed(run([answerTurn(good({ steps: [{ ...good().steps[0], skill: "motion.sources" }, good().steps[1]] }))])).includes("step_skills_known@1"));
});

test("a step that doesn't start with an action is a warning, never a failure", () => {
  const checks = run([answerTurn(good({ steps: [{ text: "The rotation is too small to see.", skill: null, layer: null }, good().steps[1]] }))]);
  const w = byName(checks, "step_starts_with_action@1");
  assert.ok(w && w.warn && !w.pass);
  assert.deepEqual(failed(checks), []);
});

test("a keyframe skill tagged or offered fails no_keyframe_skills", () => {
  const tagged = good({ steps: [good().steps[0], { ...good().steps[1], skill: "easing.basic" }], offered_skills: [] });
  assert.ok(failed(run([answerTurn(tagged)])).includes("no_keyframe_skills@1"));
});

test("a tool that changes the project, or a lesson started, fails; only the ask tools pass", () => {
  assert.ok(failed(run([answerTurn(good(), [{ kind: "tool", name: "set_ease", input: {}, ok: true, result: "{}" }])])).includes("no_project_change"));
  assert.ok(failed(run([answerTurn(good(), [{ kind: "tool", name: "go_deeper", input: {}, ok: true, result: "{}" }])])).includes("no_lesson_started"));
  assert.ok(failed(run([answerTurn(good(), [{ kind: "tool", name: "snapshot_project", input: {}, ok: true, result: "{}" }])])).includes("no_lesson_started"));
  assert.ok(failed(run([answerTurn(good(), [{ kind: "tool", name: "read_learner_record", input: {}, ok: true, result: "{}" }])])).includes("only_ask_tools"));
});

test("the asked entry changes no skill state", () => {
  const start = { skills: { "easing.basic": { status: "learned" } }, lessons: [] };
  assert.equal(byName(run([answerTurn()], EXPECT, { record: { start, end: start } }), "record_skills_unchanged").pass, true);
  const end = { skills: { "easing.basic": { status: "practicing" } }, lessons: [] };
  assert.ok(failed(run([answerTurn()], EXPECT, { record: { start, end } })).includes("record_skills_unchanged"));
  assert.equal(byName(run([answerTurn()], EXPECT, { record: { start: null, end: null } }), "record_skills_unchanged").pass, true);
});

test("kinds: no steps for describe, howto, clarify, outside; no offer for clarify and outside", () => {
  const ex = (kind) => ({ answers: [{ turn: 1, kind }] });
  const outside = good({ kind: "outside", comp: null, explanation: "That's outside what I cover.", steps: [], offered_skills: [], closing_offer: null });
  assert.deepEqual(failed(run([turn(call(outside))], ex("outside"))), []);
  assert.ok(failed(run([turn(call({ ...outside, steps: good().steps }))], ex("outside"))).includes("no_steps_for_kind@1"));
  assert.ok(!failed(run([turn(call({ ...outside, closing_offer: "I can help with the motion in your layers." }))], ex("outside"))).includes("no_offer_for_kind@1"));
  assert.ok(failed(run([turn(call({ ...outside, offered_skills: ["easing.basic"] }))], ex("outside"))).includes("no_offer_for_kind@1"));
  assert.ok(failed(run([turn(call(outside))], ex("answer"))).includes("kind@1"));
  assert.deepEqual(failed(run([turn(call(outside))], ex(["answer", "outside"]))), []);
});

test("a how-to may offer one skill with no steps on A; offered_equals is A only", () => {
  const howto = good({ kind: "howto", comp: null, explanation: "The speed graph shows how fast a value changes. Dragging the handles changes the speed.", steps: [], offered_skills: ["easing.speed_graph"], closing_offer: "Want to try it on your own layers?", tags: { "easing.speed_graph": "Speed graph" } });
  const ex = { answers: [{ turn: 1, kind: "howto", max_sentences: [{ field: "explanation", max: 2 }], offered_equals: ["easing.speed_graph"] }] };
  assert.deepEqual(failed(run([turn(call(howto))], ex)), []);
  assert.ok(failed(run([turn(call({ ...howto, offered_skills: [] }))], ex)).includes("offered_equals@1"));
  const b1 = askChecks(ex, { turns: [turn(call({ ...howto, runtime: "b1", offered_skills: [] }))], c: {}, runtime: "b1", fixtures: FX, record: null, allowed: ALLOWED });
  assert.deepEqual(failed(b1), []);
  assert.ok(failed(run([turn(call({ ...howto, explanation: "One. Two. Three." }))], ex)).includes("max_sentences:explanation@1"));
});

test("a follow-up turn must not be an answer turn", () => {
  const ex = { answers: [{ turn: 1, kind: "answer" }], no_answer_turns: [2] };
  const prose = turn({ kind: "say", text: "I'll leave the changes to you. Start with step 1." });
  assert.deepEqual(failed(run([answerTurn(), prose], ex)), []);
  assert.ok(failed(run([answerTurn(), answerTurn()], ex)).includes("no_answer@2"));
});

test("text checks read the answer's own fields: in, turns, runtimes", () => {
  const ex = { answers: [{ turn: 1, kind: "answer" }], text: [
    { id: "must_expl", must: "Shake Control", in: "explanation" },
    { id: "must_offer", must: "Set the pivot", in: "offer" },
    { id: "never_steps", never: "undo", in: "steps" },
    { id: "a_only", must: "nothing like this", in: "all", runtimes: ["b1"] },
  ] };
  const checks = run([answerTurn()], ex);
  assert.deepEqual(failed(checks), []);
  assert.equal(byName(checks, "text:a_only"), undefined, "a b1-only text check is skipped on A");
  assert.ok(failed(run([answerTurn()], { ...ex, text: [{ id: "x", must: "Ghost", in: "steps" }] })).includes("text:x"));
});

test("step_order is skipped without sweeps and checked with them", () => {
  const ex = { answers: [{ turn: 1, kind: "answer", step_order: [{ id: "o", first: "not_taught", then: "transform.anchor", needs_sweeps: true }] }] };
  const off = byName(run([answerTurn()], ex), "step_order:o@1");
  assert.ok(off.pass && /skipped/.test(off.detail));
  const reversed = good({ steps: [good().steps[1], good().steps[0]] });
  assert.ok(failed(run([answerTurn(reversed)], ex, { fixtures: [{ ...FX[0], sweeps: true }] })).includes("step_order:o@1"));
  assert.ok(byName(run([answerTurn()], ex, { fixtures: [{ ...FX[0], sweeps: true }] }), "step_order:o@1").pass);
});

test("turn_first_tool reads the first non-ToolSearch call", () => {
  const ex = { answers: [{ turn: 1, kind: "answer" }], turn_first_tool: [{ turn: 1, tool: "describe_layers" }] };
  const t = turn({ kind: "tool", name: "ToolSearch", ok: true }, read, call(good()));
  assert.ok(byName(run([t], ex), "turn_first_tool@1").pass);
  assert.ok(!byName(run([turn(call(good()))], ex), "turn_first_tool@1").pass);
});

test("the judge reads the answer rebuilt from the call, with tags and the B1 note", () => {
  const text = renderAnswer(good({ runtime: "b1", offered_skills: [] }), "b1");
  assert.match(text, /^ANSWER \(kind: answer/);
  assert.match(text, /1\. Open Shake Control's Position expression/);
  assert.match(text, /\[no tag: not taught yet; layer: Shake Control\]/);
  assert.match(text, /\[tag: Set the pivot; layer: Shake Control\]/);
  assert.match(text, /GO DEEPER BUTTONS: none \(B1 never offers/);
  assert.equal(renderAnswer(null, "a"), "(no accepted answer in this turn)");
  assert.equal(answerOf(turn(call("not json"))), null);
  assert.equal(answerCalls(turn(call("not json"))).refused.length, 1);
});

test("the whole good answer is about 120 words or fewer", () => {
  assert.ok(wordCount(pieces(good()).all) < 120);
  const long = good({ explanation: "In Comp 1, " + "word ".repeat(160) });
  const w = byName(run([answerTurn(long)]), "answer_length@1");
  assert.ok(w && w.warn);
});

// ---------- fixtures ----------

test("every fixture on disk is what build.mjs would write, and is consistent", () => {
  const dir = path.join(HERE, "..", "fixtures");
  for (const [name, snap] of Object.entries(fixtures())) {
    const onDisk = fs.readFileSync(path.join(dir, name), "utf8");
    assert.equal(onDisk, JSON.stringify(snap, null, 1) + "\n", `${name} is stale: run node product/evals/ask/fixtures/build.mjs`);
    assert.deepEqual(fixtureFacts(snap).problems, [], name);
  }
});

test("subset renumbers layers and carries parent, matte, expression and sweep references", () => {
  const p = JSON.parse(fs.readFileSync(path.resolve(HERE, "..", "..", "..", "..", "mentor", "test", "fixtures", "expressions", "planted.json"), "utf8"));
  const s = subset(p, [1, 9, 10], { rename: { 9: "Window Matte" }, comp: "Intro" });
  assert.deepEqual(s.layer_info.map((l) => [l.index, l.name]), [[1, "Ctrl"], [2, "Window Matte"], [3, "Matte Fill"]]);
  assert.equal(s.layer_info[2].matte.layer, 2);
  assert.ok(s.expressions.every((e) => e.layer >= 1 && e.layer <= 3));
  assert.equal(s.comp.name, "Intro");
});

test("fixtureFacts reports a dangling reference", () => {
  const f = fixtureFacts({ comp: { name: "X" }, layers: [], layer_info: [{ index: 1, name: "A", parent: 9 }], expressions: [{ layer: 4 }] });
  assert.equal(f.problems.length, 2);
});

test("case files: each is valid JSON with the keys the runner needs, and the numbers run 01 to 18", () => {
  const dir = path.join(HERE, "..", "cases");
  const files = fs.readdirSync(dir).filter((f) => /^\d\d-.*\.json$/.test(f)).sort();
  assert.deepEqual(files.map((f) => f.slice(0, 2)), Array.from({ length: 18 }, (_, i) => String(i + 1).padStart(2, "0")));
  for (const f of files) {
    const c = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    assert.equal(c.id, f.replace(/\.json$/, ""));
    for (const k of ["title", "covers", "turns", "expect", "rubric"]) assert.ok(k in c, `${f}: ${k}`);
  }
});

test("the five newer refusal codes are read by name", () => {
  for (const c of ["ANSWER_SHAPE", "KIND_MISMATCH", "STEP_NEEDS_LAYER", "COMP_IS_OPEN", "NOT_PLAIN_WORDS"]) assert.equal(refusalCode(`That answer was refused: ${c}. Try again.`), c);
});

test("read_before_answer: describe_layers must come before give_answer on a comp-based answer", () => {
  assert.ok(byName(run([answerTurn()]), "read_before_answer@1").pass);
  assert.ok(failed(run([turn(call(good()))])).includes("read_before_answer@1"));
  assert.ok(failed(run([turn(call(good()), read)])).includes("read_before_answer@1"));
  // a how-to (no comp target) needs no read
  assert.equal(byName(run([turn(call(good({ kind: "howto", steps: [], offered_skills: [], closing_offer: "Want the lesson?" })))], { answers: [{ turn: 1, kind: "howto" }] }), "read_before_answer@1"), undefined);
});

test("step_text_order: the bigger pixel source's step comes first, and only with sweeps", () => {
  const ex = { answers: [{ turn: 1, kind: "answer", step_text_order: [{ id: "p", first: "Position", then: "Rotation", needs_sweeps: true }] }] };
  const sw = { fixtures: [{ ...FX[0], sweeps: true }] };
  const steps = (a, b) => good({ steps: [{ text: a, skill: "not_taught", layer: "Shake Control" }, { text: b, skill: "not_taught", layer: "Shake Control" }], offered_skills: [], closing_offer: "Try them?" });
  const P = "Open Shake Control's Position expression and look at its sizes. Not something I teach yet.";
  const R = "Open Shake Control's Rotation expression and look at its amounts. Not something I teach yet.";
  assert.ok(byName(run([answerTurn(steps(P, R))], ex, sw), "step_text_order:p@1").pass);
  assert.ok(failed(run([answerTurn(steps(R, P))], ex, sw)).includes("step_text_order:p@1"));
  assert.ok(/skipped/.test(byName(run([answerTurn(steps(R, P))], ex), "step_text_order:p@1").detail));
});

test("the Comp 1 fixtures carry the shifts the order check needs (Position 12.15 px, Rotation 9.36 px on rock.png)", () => {
  const f = fixtures()["comp1.json"];
  assert.ok(f.expression_sweeps.some((s) => s.kind === "fine" && s.path.endsWith("ADBE Position") && s.max_offset > 12));
  assert.ok(f.expression_sweeps.some((s) => s.kind === "fine" && s.path.endsWith("ADBE Rotate Z")));
});

test("case 18: the wrapper is the contract's, and its checks pass a follow-up answer and fail a leaked label", () => {
  const c = JSON.parse(fs.readFileSync(path.join(HERE, "..", "cases", "18-followup-after-lesson.json"), "utf8"));
  const lines = c.turns[0].say.split("\n");
  assert.equal(lines[0], "/ask-mentor Earlier question and answer, as shown in the panel:");
  assert.deepEqual(lines.map((l) => l.split(":")[0]).filter((l) => /^(Question|Answer|Steps|Closing|Follow-up)$/.test(l)), ["Question", "Answer", "Steps", "Closing", "Follow-up"]);
  assert.match(lines.at(-1), /^Follow-up: /);
  const prose = (text) => turn(read, { kind: "say", text });
  const ok = "Step 2 is Shake Control's Rotation expression, which tips rock.png a little with each hit. Open it and look at its three amounts. Not something I teach yet.";
  assert.deepEqual(failed(run([prose(ok)], c.expect)), []);
  assert.ok(failed(run([prose("Follow-up: Rotation tips rock.png.")], c.expect)).includes("text:no_wrapper_label"));
  assert.ok(failed(run([turn({ kind: "say", text: ok })], c.expect)).includes("turn_first_tool@1"));
  assert.ok(failed(run([turn(read, call(good()))], c.expect)).includes("no_answer@1"));
  // a diagnostic waiver reports the check and never fails the case
  const waived = run([answerTurn(good({ steps: good().steps }), [{ kind: "say", text: "Done." }])], EXPECT, { waive: ["answer_prose_empty"] });
  assert.deepEqual(failed(waived), []);
  assert.ok(byName(waived, "answer_prose_empty@1").waived);
});

test("a promise to read after the learner acts isn't narration; narrating a call still is", () => {
  const closing = good({ closing_offer: "Open it, then ask me again from inside that comp, and I'll read the layers that move?" });
  assert.ok(byName(run([answerTurn(closing)]), "no_narration").pass);
  const narrated = turn(read, { kind: "say", text: "Let me read the layers." }, call(good()));
  assert.ok(!byName(run([narrated]), "no_narration").pass);
});
