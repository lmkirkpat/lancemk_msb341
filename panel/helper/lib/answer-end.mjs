// Spec 014 T105 (A): an accepted give_answer ends the ask mentor's turn. Nothing it writes after the
// answer may reach the learner (FR-009, PQ-1), and B1 ends the turn there with a hook
// (panel/lib/runtime.js), so A sends no further request once the answer is in. A refusal is an error
// result ("CODE: message"), so the turn goes on and the mentor tries again.

export const ANSWER_TOOL = "give_answer";
const KINDS = ["answer", "describe", "howto", "clarify", "outside", "no_comp"];

// name: the tool's name as the model called it. content: the API tool result content
// ([{ type: "text", text }, ...]). isError: the server's own flag. → true only for an accepted answer:
// one text block holding a JSON object with a known kind and an explanation.
export function answerAccepted(name, content, isError) {
  if (name !== ANSWER_TOOL || isError || !Array.isArray(content)) return false;
  const texts = content.filter((b) => b && b.type === "text" && typeof b.text === "string");
  if (texts.length !== 1) return false;
  let j;
  try {
    j = JSON.parse(texts[0].text);
  } catch {
    return false;
  }
  return !!j && typeof j === "object" && !Array.isArray(j) && KINDS.includes(j.kind) && typeof j.explanation === "string";
}
