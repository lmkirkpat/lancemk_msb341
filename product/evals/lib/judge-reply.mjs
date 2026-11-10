// Reading a judge's reply, shared by the runners. The judge is told "JSON only", and still sometimes
// wraps the array in a code fence or adds a line of prose before or after it. That is the judge's
// formatting, not the mentor's teaching, so read it leniently:
//   1. the text as is,
//   2. the text inside a code fence, if it has one,
//   3. the first complete JSON array in the text (found by balanced brackets, strings respected).
// → an array of rubric items, or null. A reply that still gives null is plumbing: the runners mark
// the run `plumbing` and leave it out of the case's pass count (README › Plumbing). Node built-ins only.

const tryParse = (t) => { try { return JSON.parse(t); } catch { return null; } };

// The first balanced [...] in text, or null. Brackets inside JSON strings don't count.
function firstArray(text) {
  for (let start = text.indexOf("["); start !== -1; start = text.indexOf("[", start + 1)) {
    let depth = 0, inStr = false, esc = false;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (inStr) {
        if (esc) esc = false;
        else if (ch === "\\") esc = true;
        else if (ch === '"') inStr = false;
        continue;
      }
      if (ch === '"') inStr = true;
      else if (ch === "[") depth++;
      else if (ch === "]" && --depth === 0) {
        const got = tryParse(text.slice(start, i + 1));
        if (Array.isArray(got)) return got;
        break;
      }
    }
  }
  return null;
}

export function parseJudgeReply(raw) {
  const text = String(raw ?? "").trim();
  const whole = tryParse(text);
  if (Array.isArray(whole)) return whole;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    const inner = tryParse(fenced[1].trim());
    if (Array.isArray(inner)) return inner;
  }
  // The reply is cut off inside an open fence: take what follows the fence line.
  const open = text.match(/```(?:json)?\s*([\s\S]*)$/i);
  if (open) {
    const inner = tryParse(open[1].trim());
    if (Array.isArray(inner)) return inner;
  }
  const found = firstArray(text);
  return found && found.every((x) => x && typeof x === "object" && "item" in x) ? found : null;
}
