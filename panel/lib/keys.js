// Keys in the ask box (spec 014 FR-054, MU › Accessibility): Enter sends, Shift+Enter adds a line,
// and nothing happens mid-composition (an IME's Enter picks a character). Pure, so it's tested here
// and main.js only calls it.
"use strict";

// ev: { key, shiftKey, altKey, ctrlKey, metaKey, isComposing }. → "send" or null.
function askBoxKey(ev) {
  if (!ev || ev.key !== "Enter" || ev.isComposing) return null;
  if (ev.shiftKey || ev.altKey || ev.ctrlKey || ev.metaKey) return null;
  return "send";
}

module.exports = { askBoxKey };
