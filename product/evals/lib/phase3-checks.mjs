// Checks the phase 3 cases need in the lesson sets (spec 014 T079): what happened in one named turn, what a
// saved record says, and how a turn's words end. Shared by the runners, unit-tested without a model
// (test/phase3-checks.test.mjs). Node built-ins only.
//
// An expect block may carry:
//   turn_tools         [{ turn, called?: [names], not_called?: [names] }]: in that turn, each `called` name has a
//                      successful call and each `not_called` name has no call at all (T106: a stop in turn 3 calls
//                      end_lesson and not record_lesson; a stop after a check calls record_lesson and not end_lesson)
//   record_text_never  [{ id, pattern, cs? }]: no saved record_lesson's summary, attempted or next matches the regex
//                      (K5: a layer no check attributed isn't named with a change word)
//   say_ends_with      [{ id, turn, pattern, cs? }]: the last sentence the mentor says in that turn matches the regex
//                      (the hand-back line is the last line, nothing after it)
//   say_never_when_called  [{ id, turn, tool, pattern }]: when that turn has a call to `tool`, no words of that turn
//                      match the regex (nothing said about a refusal the learner never sees)
//
// Events are the runners': { kind: "say", text } and { kind: "tool", name, ok, input }, names without the prefix.

export const PHASE3_KEYS = ["turn_tools", "record_text_never", "say_ends_with", "say_never_when_called"];

const toolsOf = (turn) => (turn ? turn.events : []).filter((e) => e.kind === "tool");
const saysOf = (turn) => (turn ? turn.events : []).filter((e) => e.kind === "say").map((e) => e.text);
const rx = (s, key = "pattern") => new RegExp(s[key], s.cs ? "" : "i");

// The last sentence of what was said, ignoring a trailing run of whitespace. A line break ends one too.
export function lastSentence(texts) {
  const flat = texts.join("\n").trim();
  if (!flat) return "";
  const parts = flat
    .replace(/\b(?:e\.g|i\.e|etc|vs)\./gi, (m) => m.replace(".", ""))
    .replace(/(\d)\.(\d)/g, "$1\u0001$2")
    .split(/(?<=[.?!])["')\]]*\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => /[A-Za-z0-9]/.test(s));
  return (parts.at(-1) || "").replace(/\u0001/g, ".");
}

// → [{ check, pass, detail }]
export function phase3Checks(expect, turns, mentorTools) {
  const out = [];
  const add = (check, pass, detail) => out.push({ check, pass, detail });
  for (const w of expect.turn_tools || []) {
    const calls = toolsOf(turns[w.turn - 1]).filter((e) => mentorTools.includes(e.name));
    const missing = (w.called || []).filter((n) => !calls.some((e) => e.name === n && e.ok));
    const hit = (w.not_called || []).filter((n) => calls.some((e) => e.name === n));
    const wrong = [...(missing.length ? [`no successful ${missing.join(", ")}`] : []), ...(hit.length ? [`called ${hit.join(", ")}`] : [])];
    add(`turn_tools@${w.turn}`, wrong.length === 0, wrong.length ? `turn ${w.turn}: ${wrong.join("; ")}` : "ok");
  }
  for (const w of expect.record_text_never || []) {
    const recs = turns.flatMap(toolsOf).filter((e) => e.name === "record_lesson" && e.ok);
    const re = rx(w);
    const hit = recs.map((e) => [e.input?.summary, e.input?.attempted, e.input?.next].filter(Boolean).join(" | ")).map((t) => t.match(re)).find(Boolean);
    add(`record_text_never:${w.id}`, !hit, hit ? `a saved record says "${hit[0]}"` : recs.length ? "clean" : "clean (nothing was recorded)");
  }
  for (const w of expect.say_ends_with || []) {
    const last = lastSentence(saysOf(turns[w.turn - 1]));
    add(`say_ends_with:${w.id}`, rx(w).test(last), `turn ${w.turn} ends "${last.slice(0, 90)}"`);
  }
  for (const w of expect.say_never_when_called || []) {
    const t = turns[w.turn - 1];
    const called = toolsOf(t).some((e) => e.name === w.tool);
    const m = called ? saysOf(t).join("\n").match(rx(w)) : null;
    add(`say_never_when_called:${w.id}`, !m, m ? `turn ${w.turn} said "${m[0]}"` : called ? "clean" : `${w.tool} wasn't called in turn ${w.turn}`);
  }
  return out;
}

// Problems in a case's keys, for a runner's validate().
export function phase3Problems(expect, turnCount) {
  const problems = [];
  const turn = (n, what) => { if (!Number.isInteger(n) || n < 1 || n > turnCount) problems.push(`${what}: turn ${n} is out of range`); };
  const regex = (s, what, key = "pattern") => {
    if (!s.id || typeof s[key] !== "string") problems.push(`${what} needs an id and a ${key}`);
    else try { new RegExp(s[key]); } catch { problems.push(`${what} ${s.id}: bad regex`); }
  };
  for (const w of (expect || {}).turn_tools || []) {
    turn(w.turn, "turn_tools");
    for (const k of ["called", "not_called"]) if (k in w && !Array.isArray(w[k])) problems.push(`turn_tools ${k} must be a list`);
  }
  for (const w of (expect || {}).record_text_never || []) regex(w, "record_text_never");
  for (const w of (expect || {}).say_ends_with || []) { turn(w.turn, "say_ends_with"); regex(w, "say_ends_with"); }
  for (const w of (expect || {}).say_never_when_called || []) { turn(w.turn, "say_never_when_called"); regex(w, "say_never_when_called"); if (!w.tool) problems.push("say_never_when_called needs a tool"); }
  return problems;
}
