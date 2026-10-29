import test from "node:test";
import assert from "node:assert/strict";
import { recordPlainHit } from "./record-plain.mjs";

const ok = [
  { summary: "Gaps about 4 and 8 frames; kept one split on purpose.", attempted: "Staggered Dot 1, Dot 2 and Dot 3, in that order", next: "Try a third layer" },
  { summary: "The starts are now about 0 and 4 frames apart.", next: "Check the rhythm on a longer group" },
];
ok.push({ summary: "Each layer's properties moved together; gaps about 4 and 4 frames." });
const bad = [
  [{ summary: "Dragged the bar earlier" }, "Dragged"],
  [{ summary: "Pulled the bar earlier" }, "the bar"],
  [{ summary: "Shortened the Glow so it starts later" }, "Shortened"],
  [{ summary: "Layers shifted a few frames" }, "shifted"],
  [{ summary: "Gaps about 4 frames", next: "Stagger Bar and Glow" }, "Bar"],
  [{ summary: "Moved the second one" }, "Moved"],
  [{ summary: "Nudged the starts" }, "Nudged"],
  [{ summary: "Used Quick Offset" }, "Quick Offset"],
  [{ summary: "Dragged the bars" }, "Dragged"],
  [{ summary: "Dot 2 now starts later" }, "Dot 2"],
];
test("measured frame gaps and attempted members pass", () => {
  for (const r of ok) assert.equal(recordPlainHit(r), null);
});
test("layer names and method words in summary or next are caught", () => {
  for (const [r, w] of bad) assert.equal(recordPlainHit(r), w);
});
