// Spec 015 OQ-9 (option 4, approved 2026-11-16): a lesson's baseline in session.json keeps each
// expression's text and error only while the lesson can still use them (the checks' FR-014 "text
// changed", and record_lesson's FR-020 guard, which runs in a later turn on a fresh server under B1).
// Once the lesson's record is saved, or the lesson can't be continued, the session clears them.
//
// A cleared entry keeps `text_length` and `text_cut`, gains `cleared: true` and `text_hash` (SHA-256
// of the text as read, line ends and all), and has no `text`. Its `error` becomes `true` when there
// was one (null stays null), so "has an error" reads the same and no wording is kept. Nothing reads a
// cleared entry as "no expression" or "unchanged": a text comparison with a cleared side compares
// hashes, and one that can't be made counts as changed (FR-018).

import crypto from "node:crypto";

export const textHash = (text) => crypto.createHash("sha256").update(String(text), "utf8").digest("hex");

// Clears one snapshot's expression text and error in place. Safe to call again, and on a snapshot
// from before spec 015 (no `expressions`), which it leaves as it is.
export function clearExpressionText(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.expressions)) return snapshot;
  for (const x of snapshot.expressions) {
    if (!x || typeof x !== "object" || x.cleared) continue;
    if (typeof x.text === "string") x.text_hash = textHash(x.text);
    delete x.text;
    if (x.error != null) x.error = !!x.error || null;
    x.cleared = true;
  }
  return snapshot;
}

// FR-014's "text changed" between two expression entries. Two entries with their text compare as
// before (`!==`), so every reply on uncleared reads is unchanged (FR-028). With a cleared side, the
// hashes are compared; a side whose text can't be told counts as changed, never as the same.
export function expressionTextDiffers(was, now) {
  if (!was.cleared && !now.cleared) return was.text !== now.text;
  const hashOf = (x) => (x.cleared ? (typeof x.text_hash === "string" ? x.text_hash : null) : typeof x.text === "string" ? textHash(x.text) : null);
  const a = hashOf(was);
  const b = hashOf(now);
  return a === null || b === null || a !== b;
}
