// Spec 014 phase 3 (K3, K6; FR-026, FR-033; contracts/hand-in.md › Per skill, data-model § 4 and § 5):
// what the four keyframe skills (easing, key types, speed graph, offset) share for a lesson opened from
// an answer, and the motion_from field their snapshots gain. Pivot and null keep their own (phase 2).
//
// Nothing here changes a reply that has no hand-in, or a read without spec 015's read R2: the snapshot
// tools add `hand_in` only when they took one and `motion_from` only when the read has expressions,
// so replies on older captures (the eval sets') stay byte-identical.

import { layerInfo } from "./layer-info.mjs";
import { motionFrom } from "./motion-sources.mjs";

// What the lesson keeps from the session's hand-in: no learner words (FR-045), the answer's own step
// lines as text.
export const lessonHandIn = (h) => ({
  layer: typeof h.layer === "string" ? h.layer : null,
  step_number: Number.isInteger(h.step_number) ? h.step_number : null,
  steps: (Array.isArray(h.steps) ? h.steps : []).map((x) => (x && typeof x.text === "string" ? x.text : typeof x === "string" ? x : "")),
  place_named: h.place_named === true,
});

// The reply's slice (data-model § 4). `practice` when the record has this skill learned (FR-023).
// `keyed`: whether the layer has keys this skill reads; false means the lesson can't open on it.
export function handInSlice(h, learner, { keyed } = {}) {
  const kept = lessonHandIn(h);
  const out = {
    layer: kept.layer, step_number: kept.step_number,
    steps_after: kept.step_number ? kept.steps.slice(kept.step_number) : [],
    place_named: kept.place_named, practice: !!learner && learner.status === "learned",
  };
  if (keyed !== undefined) out.keyed = keyed;
  return out;
}

// The text of the step the lesson goes deeper on, or "".
export function stepText(h) {
  const steps = Array.isArray(h && h.steps) ? h.steps : [];
  const s = Number.isInteger(h && h.step_number) ? steps[h.step_number - 1] : null;
  return s && typeof s.text === "string" ? s.text : typeof s === "string" ? s : "";
}

// Is `name` a layer with keys in the read (the keyframe skills' focus names, which their analyzers
// accept)? Precomp layers count, as the analyzers count them.
export const keyedLayer = (snapshot, name) =>
  typeof name === "string" && [...(snapshot.layers || []), ...(snapshot.precomp_layers || [])].some((l) => l && l.name === name);

const isWordChar = (c) => c !== undefined && /[\p{L}\p{N}_]/u.test(c);
export function namesWhole(text, name) {
  if (typeof text !== "string" || typeof name !== "string" || !name) return false;
  const t = text.toLowerCase();
  const n = name.toLowerCase();
  for (let i = t.indexOf(n); i >= 0; i = t.indexOf(n, i + 1)) {
    if (!isWordChar(t[i - 1]) && !isWordChar(t[i + n.length])) return true;
  }
  return false;
}

// Every other keyed layer the step's text names in full, in the comp's order (offset's group).
export function otherLayersNamed(snapshot, h) {
  const text = stepText(h);
  const names = (snapshot.layers || []).map((l) => l.name).filter((n, i, all) => all.indexOf(n) === i);
  return names.filter((n) => n !== h.layer && namesWhole(text, n));
}

// Spec 015 FR-015's shape (data-model § 4 there), per layer name: { [name]: motionFrom(...) }, for the
// names given, in the order given, each once. Undefined on a read without R2, so no field is added.
export function motionFromFor(snapshot, names) {
  if (!Array.isArray(snapshot && snapshot.expressions)) return undefined;
  const info = layerInfo(snapshot);
  const list = info.known ? info.layers : snapshot.layers || [];
  const out = {};
  for (const name of names) {
    if (typeof name !== "string" || name in out) continue;
    const l = list.find((x) => x && x.name === name);
    if (l) out[name] = motionFrom(snapshot, l.index);
  }
  return out;
}

// Layer names from lists of names or of objects with a `layer` (findings, candidates, members).
export function layerNames(...lists) {
  const out = [];
  for (const list of lists) {
    for (const x of Array.isArray(list) ? list : []) {
      const n = typeof x === "string" ? x : x && typeof x.layer === "string" ? x.layer : null;
      if (n && !out.includes(n)) out.push(n);
    }
  }
  return out;
}

// The focus layers a hand-in lesson opened with, for a later call on the same lesson that names none
// (speed graph's second opening call, a snapshot after a demo), so the focus never falls back to the
// whole comp. Only when session.start would continue that lesson: the same test it uses (openMode:
// the current lesson, this skill and comp, not passed, not stale, in the call's mode). A stale or new
// lesson gets none (T081 review), and start() then keeps no hand-in on it either, so no hand-back.
export function carriedFocus(session, skill, snapshot, mode = "lesson") {
  if (session.openMode(skill, snapshot.comp.id, snapshot) !== mode) return null;
  let lesson;
  try {
    lesson = session.currentLesson();
  } catch {
    return null;
  }
  if (!lesson || lesson.skill !== skill || lesson.comp_id !== snapshot.comp.id || lesson.passed) return null;
  const f = lesson.hand_in && lesson.hand_in.focus_layers;
  return Array.isArray(f) && f.length ? [...f] : null;
}

// T081 review: a hand-in whose layer has no keys this skill reads opens no lesson (nothing would be
// left open for a record or an end). The reply says so with the slice (keyed false) and nothing else
// the lesson would use.
export const noKeysReply = (snapshot, fields) => ({
  lesson: null, project: snapshot.project, comp: { name: snapshot.comp.name }, ...fields,
});
