// The offset set's record_plain check, in its own file so it can be tested without starting a run.
const RECORD_METHOD = new RegExp("\\bdrag(?:ged|ging)?\\b|\\b(?:the|a|its|each|layer) bar\\b|\\bbecause\\b|\\bso that\\b|\\bQuick Offset\\b|\\bshortcut\\b", "i");
// The bare word "bar" is not a method word: Mentor Practice has a layer named Bar, which the layer-name check below reports under its own name.
// Added 2026-10-29 (human-approved): the summary and next hold no layer names and no method words
// (SKILL.md step 10: "no layer or property names, never how they did it"). Measured frame gaps
// ("about 4 and 8 frames") stay allowed. `attempted` is exempt: it names the members by design.
const RECORD_LAYER_NAMES = /\b(?:Title|Dots?(?: \d+)?|Chips?(?: [A-C])?|Rows?(?: [A-C])?|Bar|Glow|Badge|Caption|Subtitle|Logo|Icon|Card|Tab|Plate|Sign|Seal|Lamp|Shadow|Stamp|Banner|Gauge|Spinner|Wobble|Flag|Peg|Plaque)\b/;
const RECORD_METHOD_WORDS = /\b(?:shorten(?:ed|ing)?|shift(?:ed|ing)?|moved|moving|dragg?(?:ed|ing)|nudg(?:ed|ing)|slid|slipped|Quick Offset)\b/i;
// "moved together" / "moving together" describes the result the check saw (properties that still start
// together), not how the learner did it, so it is removed before the method words are matched.
const STATE_PHRASE = /\bmo(?:ved|ving) together\b/gi;
export function recordPlainHit(r) {
  const all = [r.summary, r.attempted, r.next].filter(Boolean).join(" | ");
  const sn = [r.summary, r.next].filter(Boolean).join(" | ");
  const snMethod = sn.replace(STATE_PHRASE, "");
  return (all.match(RECORD_METHOD) || snMethod.match(RECORD_METHOD_WORDS) || sn.match(RECORD_LAYER_NAMES) || [])[0] || null;
}
