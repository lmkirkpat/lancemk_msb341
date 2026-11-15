// Spec 015 read R2 in Node (data-model § 2; research R3 to R5, R9): expression reads from a snapshot,
// whether each builds on its own value (inferred from the text), its base and after values at a time,
// how much it moves its property, the layer references in its text, and what links into a layer.
// Pure: it reads the snapshot's `expressions`, `expression_sweeps` and `layer_info` and never
// contacts After Effects.
//
// "Not read" is always explicit (FR-018): a snapshot from before spec 015 has no `expressions`, and
// every function here says { status: "not_read", reason: "older_snapshot" }, never none or empty.

import { byIndex, layerInfo } from "./layer-info.mjs";
import { sampleAt } from "./comp-space.mjs";
import { visibility } from "./visibility.mjs";

const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const notRead = (reason) => ({ status: "not_read", reason });
const TIME_TOL = 0.0005;

// ---- What was read

// "all", or why the expressions weren't read.
export function expressionsRead(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.expressions)) return notRead("older_snapshot");
  if (snapshot.expressions_read !== "all") {
    const r = snapshot.expressions_read;
    return r && typeof r === "object" && r.status === "not_read" ? r : notRead("error");
  }
  return "all";
}

const SAMPLE_KEYS = {
  "ADBE Transform Group/ADBE Anchor Point": "anchor",
  "ADBE Transform Group/ADBE Position": "position",
  "ADBE Transform Group/ADBE Position_0": "position",
  "ADBE Transform Group/ADBE Position_1": "position",
  "ADBE Transform Group/ADBE Position_2": "position",
  "ADBE Transform Group/ADBE Scale": "scale",
  "ADBE Transform Group/ADBE Rotate Z": "rotation",
  "ADBE Transform Group/ADBE Opacity": "opacity",
};
// The sample key an expression's property is read into, or null (effects, Orientation, text...).
export const sampleKeyOf = (path) => SAMPLE_KEYS[path] || null;

const UNITS = { anchor: "px", position: "px", scale: "percent", rotation: "degrees", opacity: "percent" };

const propertyName = (x) => {
  const parts = String(x.display_path || x.path || "").split(" › ");
  return parts[parts.length - 1] || null;
};

// FR-006: a source of motion only when it's on and has no error (T001: AE 27.0 keeps an erroring
// expression on and gives its base value).
export const isSource = (x) => !!x && x.enabled === true && !x.error;

// ---- Builds on its own value (FR-002, research R3)

// Comments and string literals out of the text; strings kept aside (for names) and replaced by a
// placeholder `__S<n>__`. `ok` is false on an unclosed string or block comment.
export function strip(text) {
  let code = "";
  const strings = [];
  let i = 0;
  const s = String(text);
  while (i < s.length) {
    const c = s[i];
    const n = s[i + 1];
    if (c === "/" && n === "/") {
      const end = s.indexOf("\n", i);
      i = end < 0 ? s.length : end;
      continue;
    }
    if (c === "/" && n === "*") {
      const end = s.indexOf("*/", i + 2);
      if (end < 0) return { ok: false, code, strings };
      code += " ";
      i = end + 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      let val = "";
      while (j < s.length && s[j] !== c) {
        if (s[j] === "\\") { val += s[j + 1] ?? ""; j += 2; continue; }
        if (s[j] === "\n" && c !== "`") return { ok: false, code, strings };
        val += s[j];
        j++;
      }
      if (j >= s.length) return { ok: false, code, strings };
      code += ` __S${strings.length}__ `;
      strings.push(val);
      i = j + 1;
      continue;
    }
    code += c;
    i++;
  }
  return { ok: true, code, strings };
}

// Calls that read this property's own value or keys without the word `value`.
const OWN_CALLS = ["wiggle", "temporalWiggle", "smooth", "loopIn", "loopOut", "loopInDuration", "loopOutDuration", "key", "nearestKey", "valueAtTime"];
// Attributes of this property, used bare.
const OWN_ATTRS = ["value", "numKeys", "velocity", "speed"];
const notAfterDot = "(?:^|[^\\w$.])";
const OWN_BARE = new RegExp(`${notAfterDot}(?:${OWN_ATTRS.join("|")})(?![\\w$])|${notAfterDot}(?:${OWN_CALLS.join("|")})\\s*\\(`);
const OWN_THIS = new RegExp(`\\bthisProperty\\s*\\.\\s*(?:${[...OWN_ATTRS, ...OWN_CALLS].join("|")})(?![\\w$])`);

// "builds_on" | "sets_own" | "cant_tell", always inferred from the text (TD 014 Q3).
export function buildsOn(x) {
  if (!x || typeof x.text !== "string" || x.text_cut) return "cant_tell";
  const { ok, code } = strip(x.text);
  if (!ok || /\beval\s*\(/.test(code)) return "cant_tell";
  return OWN_BARE.test(code) || OWN_THIS.test(code) ? "builds_on" : "sets_own";
}

// ---- References out of one expression (FR-008 to FR-010, research R4)

const TRANSFORM_NAMES = {
  position: "Position", anchorPoint: "Anchor Point", scale: "Scale", rotation: "Rotation", zRotation: "Rotation",
  opacity: "Opacity", xPosition: "X Position", yPosition: "Y Position", zPosition: "Z Position",
  xRotation: "X Rotation", yRotation: "Y Rotation", orientation: "Orientation",
};

// The argument of a call that opens at `open` (the index of "("), and where it closes.
function callArg(code, open) {
  let depth = 0;
  for (let j = open; j < code.length; j++) {
    if (code[j] === "(") depth++;
    else if (code[j] === ")" && --depth === 0) return { arg: code.slice(open + 1, j).trim(), end: j + 1 };
  }
  return { arg: null, end: code.length };
}

// The property named right after a layer reference, when the chain is plain.
function chainProperty(code, from, strings) {
  const rest = code.slice(from);
  const str = (m) => strings[Number(m)];
  let m = rest.match(/^\s*\.\s*(?:transform\s*\.\s*)?(\w+)(?![\w$]*\s*\()/);
  if (m && TRANSFORM_NAMES[m[1]]) return TRANSFORM_NAMES[m[1]];
  m = rest.match(/^\s*\.\s*effect\s*\(\s*__S(\d+)__\s*\)\s*(?:\(\s*__S(\d+)__\s*\)|\.\s*param\s*\(\s*__S(\d+)__\s*\))/);
  if (m) return `Effects › ${str(m[1])} › ${str(m[2] ?? m[3])}`;
  return null;
}

// Every layer reference in one expression's text, not resolved against a comp: { how, name, index,
// offset, property }. A reference that can't be read is how "unresolved"; another comp's, "other_comp".
export function referencesIn(text) {
  const { ok, code, strings } = strip(text);
  if (!ok) return [{ how: "unresolved", name: null, index: null, offset: null, property: null }];
  const out = [];
  const taken = [];
  // Another comp: comp("…") is never followed (E13, E26), and its layer() calls aren't this comp's.
  for (const m of code.matchAll(/(?:^|[^\w$.])comp\s*\(/g)) {
    const open = m.index + m[0].length - 1;
    const { arg, end } = callArg(code, open);
    const sm = arg && arg.match(/^__S(\d+)__$/);
    out.push({ how: "other_comp", name: sm ? strings[Number(sm[1])] : null, index: null, offset: null, property: null });
    const layerCall = code.slice(end).match(/^\s*\.\s*layer\s*\(/);
    if (layerCall) taken.push([end, callArg(code, end + layerCall[0].length - 1).end]);
  }
  for (const m of code.matchAll(/\bthisComp\s*\.\s*layer\s*\(/g)) {
    const open = m.index + m[0].length - 1;
    const { arg, end } = callArg(code, open);
    taken.push([m.index, end]);
    const ref = { how: "unresolved", name: null, index: null, offset: null, property: chainProperty(code, end, strings) };
    let a;
    if (arg && (a = arg.match(/^__S(\d+)__$/))) Object.assign(ref, { how: "name", name: strings[Number(a[1])] });
    else if (arg && /^\d+$/.test(arg)) Object.assign(ref, { how: "index", index: Number(arg) });
    else if (arg && (a = arg.match(/^(?:thisLayer\s*\.\s*)?index\s*([+-])\s*(\d+)$/))) Object.assign(ref, { how: "index_offset", offset: (a[1] === "-" ? -1 : 1) * Number(a[2]) });
    else if (arg && /^(?:thisLayer\s*\.\s*)?index$/.test(arg)) Object.assign(ref, { how: "this_layer" });
    out.push(ref);
  }
  const inside = (i) => taken.some(([a, b]) => i >= a && i < b);
  for (const m of code.matchAll(/(?:^|[^\w$.])(?:thisLayer\s*\.\s*)?parent(?![\w$])/g)) {
    if (inside(m.index + 1)) continue;
    out.push({ how: "parent", name: null, index: null, offset: null, property: chainProperty(code, m.index + m[0].length, strings) });
  }
  for (const m of code.matchAll(/(?:^|[^\w$.])thisLayer(?![\w$])(?!\s*\.\s*(?:parent|index)(?![\w$]))/g)) {
    if (inside(m.index + 1)) continue;
    out.push({ how: "this_layer", name: null, index: null, offset: null, property: chainProperty(code, m.index + m[0].length, strings) });
  }
  return out;
}

// One reference resolved against the comp: { how, target_index, target_name, property, shared_name,
// inferred: true } plus not_found when a plain name or index matches no layer.
function resolve(snapshot, layerIndex, ref) {
  const layers = layerInfo(snapshot).layers;
  const out = { how: ref.how, target_index: null, target_name: null, property: ref.property, shared_name: false, inferred: true };
  const at = (i) => layers.find((l) => l.index === i) || null;
  let target = null;
  if (ref.how === "name") {
    const same = layers.filter((l) => l.name === ref.name).sort((a, b) => a.index - b.index);
    target = same[0] || null; // AE uses the topmost (E10)
    out.shared_name = same.length > 1;
    if (!target) Object.assign(out, { target_name: ref.name, not_found: true });
  } else if (ref.how === "index") target = at(ref.index);
  else if (ref.how === "index_offset") target = at(layerIndex + ref.offset);
  else if (ref.how === "this_layer") target = at(layerIndex);
  else if (ref.how === "parent") {
    const self = at(layerIndex);
    if (!layerInfo(snapshot).known || !self) return { ...out, how: "unresolved" };
    target = self.parent == null ? null : at(self.parent);
    if (!target) out.not_found = true;
  } else if (ref.how === "other_comp") {
    return { ...out, target_name: ref.name, comp: "not_followed" };
  } else return { ...out, how: "unresolved" };
  if (target) Object.assign(out, { target_index: target.index, target_name: target.name });
  else if (ref.how === "index" || ref.how === "index_offset" || ref.how === "this_layer") out.not_found = true;
  return out;
}

// Every reference in `text`, resolved as if the expression were on the layer at `layerIndex`.
export const resolveRefs = (snapshot, layerIndex, text) => referencesIn(text).map((r) => resolve(snapshot, layerIndex, r));

// ---- Values and motion (FR-003, FR-004)

// The base value and the value after the expression at `time`, from the samples (research R5).
// { base, after, time } or not_read: not_sampled (no sample there), not_a_sampled_property (an
// effect's or text property), not_active (base equals after when off or erroring, but it isn't read).
export function valuesAt(snapshot, x, time) {
  const key = sampleKeyOf(x.path);
  if (!key) return notRead("not_a_sampled_property");
  const s = sampleAt(byIndex(snapshot, x.layer), time);
  if (!s || s[key] == null) return notRead("not_sampled");
  if (!isSource(x)) return { base: s[key], after: s[key], time, note: "not_running" };
  if (!s.base || s.base[key] == null) return notRead("not_sampled");
  return { base: s.base[key], after: s[key], time };
}

// How much an active transform expression moves its property: the fine sweep when there is one,
// else the coarse one, else not_read with the reason.
export function movesOf(snapshot, x) {
  if (x.group !== "transform") return notRead("not_transform");
  if (!isSource(x)) return notRead("not_running");
  const sweeps = Array.isArray(snapshot.expression_sweeps) ? snapshot.expression_sweeps : null;
  if (!sweeps) return notRead("older_snapshot");
  const mine = sweeps.filter((w) => w.layer === x.layer && w.path === x.path && w.status !== "not_read");
  const fine = mine.find((w) => w.kind === "fine");
  const coarse = mine.find((w) => w.kind === "coarse");
  const w = fine || coarse;
  if (!w) {
    const failed = sweeps.some((v) => v.layer === x.layer && v.path === x.path);
    return notRead(failed ? "error" : "not_swept");
  }
  const key = sampleKeyOf(x.path);
  const out = { varies: w.varies, max_offset: w.max_offset, max_at: w.max_at, units: key ? UNITS[key] : null, sampled_every: w.sampled_every, sweep: w.kind };
  if (!fine) {
    const skipped = (snapshot.fine_not_read || []).find((f) => f.layer === x.layer);
    if (skipped) out.fine = notRead(skipped.reason);
  }
  return out;
}

// ---- Expression reads (data-model § 2)

// { read: "all" | not_read, list: [Expression read] }. The text stays out of the list: detail
// replies add it (FR-016).
export function expressionReads(snapshot) {
  const read = expressionsRead(snapshot);
  if (read !== "all") return { read, list: [] };
  const names = new Map(layerInfo(snapshot).layers.map((l) => [l.index, l.name]));
  const list = snapshot.expressions.map((x) => ({
    layer_index: x.layer,
    layer: names.get(x.layer) ?? null,
    property: propertyName(x),
    display_path: x.display_path,
    path: x.path,
    group: x.group,
    keys: x.keys,
    on: x.enabled === true,
    active: isSource(x),
    error: x.error || null,
    builds_on: buildsOn(x),
    builds_on_inferred: true,
    moves: movesOf(snapshot, x),
    refs: resolveRefs(snapshot, x.layer, x.text),
  }));
  return { read, list };
}

// The raw entry behind an expression read (for text in detail replies).
export function rawExpression(snapshot, layerIndex, path) {
  return (Array.isArray(snapshot.expressions) ? snapshot.expressions : []).find((x) => x.layer === layerIndex && x.path === path) || null;
}

// ---- Links into a layer, and whether their target renders (FR-008 to FR-011)

// Whether the layer holding the expression renders at `time`: spec 004 FR-013's class plus its in
// and out points. A matte renders through its fill layer, so it's never "doesn't render" (E15).
export function rendersAt(snapshot, layerIndex, time) {
  const v = visibility(snapshot).find((e) => e.layer_index === layerIndex);
  const entry = byIndex(snapshot, layerIndex);
  const at = isNum(time) ? time : null;
  if (!v) return { renders: null, why: "not_read", at_time: at };
  if (v.class === "matte") return { renders: true, why: "matte_renders", at_time: at };
  if (v.class === "null") return { renders: false, why: "null", at_time: at };
  if (v.class === "hidden") return { renders: false, why: "eye_off", at_time: at };
  if (v.class === "guide") return { renders: false, why: "guide", at_time: at };
  if (v.soloed_elsewhere) return { renders: false, why: "soloed_elsewhere", at_time: at };
  if (entry && at !== null && ((isNum(entry.in_point) && isNum(entry.out_point)) &&
    (at < Math.min(entry.in_point, entry.out_point) - TIME_TOL || at >= Math.max(entry.in_point, entry.out_point) - TIME_TOL))) {
    return { renders: false, why: "outside_in_out", at_time: at };
  }
  return { renders: true, why: "renders", at_time: at };
}

// Every layer's incoming links, by index: { status: "read", links, unresolved_in_comp } or not_read.
// "No links" is only true when links is empty and unresolved_in_comp is 0 (FR-010).
export function linksIn(snapshot, { time } = {}) {
  const { read, list } = expressionReads(snapshot);
  const at = isNum(time) ? time : snapshot.comp && snapshot.comp.time;
  const out = new Map();
  if (read !== "all") {
    for (const l of layerInfo(snapshot).layers) out.set(l.index, read);
    return out;
  }
  const unresolved = list.reduce((n, x) => n + x.refs.filter((r) => r.how === "unresolved").length, 0);
  for (const l of layerInfo(snapshot).layers) out.set(l.index, { status: "read", links: [], unresolved_in_comp: unresolved });
  for (const x of list) {
    for (const r of x.refs) {
      if (r.target_index == null || r.how === "other_comp") continue;
      const into = out.get(r.target_index);
      if (!into) continue;
      into.links.push({
        from_layer_index: x.layer_index, from_layer: x.layer, from_property: x.display_path, property: r.property,
        how: r.how, shared_name: r.shared_name, inferred: true, from_active: x.active,
        target_renders: rendersAt(snapshot, x.layer_index, at),
      });
    }
  }
  return out;
}
