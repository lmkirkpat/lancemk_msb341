// Checks on one named turn, shared by the runners (spec 007, T027 and T032 to T037). The panel's
// buttons send one request into a lesson that is already open, so the question a case asks is often
// about the last turn only: which tools it called, how long it ran. Node built-ins only.
//
// An expect block may carry:
//   last_turn_tools_called      names that must have a successful call in the last turn
//   last_turn_tools_not_called  names that must have no call in the last turn
//   say_max_sentences           [{ id, turns: [n], max }]: the mentor's words in those turns run at most `max` sentences
//
// Events are the runners' own: { kind: "say", text } and { kind: "tool", name, ok }, names without the prefix.

export const TURN_KEYS = ["last_turn_tools_called", "last_turn_tools_not_called", "say_max_sentences"];

// Sentences, counted by their ending marks. A list line or a line break ends one too, so a
// bulleted answer can't pass as a single sentence. "e.g." and "Edit > Undo" don't end one.
export function countSentences(text) {
  const flat = String(text)
    .replace(/\b(?:e\.g|i\.e|etc|vs)\./gi, (m) => m.replace(".", ""))
    .replace(/(\d)\.(\d)/g, "$1\u0001$2");
  return flat
    .split(/(?<=[.?!])["')\]]*\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => /[A-Za-z0-9]/.test(s)).length;
}

// → [{ check, pass, detail }] for the keys above that `expect` carries. `mentorTools`: every name the
// runner recognizes as a mentor tool.
export function turnChecks(expect, turns, mentorTools) {
  const out = [];
  const last = turns.at(-1) || { events: [] };
  const calls = last.events.filter((e) => e.kind === "tool" && mentorTools.includes(e.name));
  if ("last_turn_tools_called" in expect) {
    const missing = expect.last_turn_tools_called.filter((n) => !calls.some((e) => e.name === n && e.ok));
    out.push({ check: "last_turn_tools_called", pass: missing.length === 0, detail: missing.length ? `no successful ${missing.join(", ")} in the last turn` : "all called" });
  }
  if ("last_turn_tools_not_called" in expect) {
    const called = expect.last_turn_tools_not_called.filter((n) => calls.some((e) => e.name === n));
    out.push({ check: "last_turn_tools_not_called", pass: called.length === 0, detail: called.length ? `called ${called.join(", ")} in the last turn` : "none called" });
  }
  for (const s of expect.say_max_sentences || []) {
    const words = (s.turns || []).flatMap((n) => (turns[n - 1] ? turns[n - 1].events : []).filter((e) => e.kind === "say").map((e) => e.text)).join("\n");
    const n = countSentences(words);
    out.push({ check: `say_max_sentences:${s.id}`, pass: n <= s.max, detail: `${n} sentences in turn ${(s.turns || []).join(", ")} (at most ${s.max})` });
  }
  return out;
}

// Problems in a case's keys, for a runner's validate().
export function turnProblems(expect, turnCount) {
  const problems = [];
  for (const s of (expect || {}).say_max_sentences || []) {
    if (!s.id || !Number.isInteger(s.max) || !Array.isArray(s.turns) || !s.turns.length) problems.push(`say_max_sentences needs an id, turns and a whole max: ${JSON.stringify(s).slice(0, 60)}`);
    for (const t of s.turns || []) if (!Number.isInteger(t) || t < 1 || t > turnCount) problems.push(`say_max_sentences ${s.id}: turn ${t} is out of range`);
  }
  for (const k of ["last_turn_tools_called", "last_turn_tools_not_called"]) {
    if (expect && k in expect && !Array.isArray(expect[k])) problems.push(`${k} must be a list`);
  }
  return problems;
}
