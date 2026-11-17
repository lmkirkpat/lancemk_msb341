// Spec 015's read tool for the ask mode, describe_layers (contracts/describe-layers.md, OQ-2; research
// R10, R11). Read-only: one or two snapshots, never a write snippet, and never the learner record
// (FR-019, FR-020). No skill lists it yet; spec 014 decides who calls it, so this file exports TOOLS
// and no SKILLS.
//
// Two shapes (FR-016): a summary per layer, with no expression text ever, and a detail for named
// layers with each expression's text cut at 1,500 characters. "Not read" is always explicit
// (FR-018). Phase 1 never reads inside precomps: read.precomps is always not_read.

import { MentorError, registerErrors } from "../errors.mjs";
import { byIndex, layerInfo } from "../lib/layer-info.mjs";
import { expressionReads, expressionsRead, linksIn, normalizeLineEnds, rawExpression, valuesAt } from "../lib/expressions.mjs";
import { footprintShifts } from "../lib/footprint-shift.mjs";
import { segmentState } from "../lib/analyze.mjs";
import { snaps } from "../lib/key-types.mjs";
import { motionSources } from "../lib/motion-sources.mjs";
import { takeSnapshot } from "../lib/snapshot.mjs";

registerErrors({
  DETAIL_NEEDS_LAYERS: "Detail is for named layers. Name the layers you want in detail, or ask for the summary of the whole comp.",
});

// The reads, through one object so tests can watch what each call asks for.
export const io = { takeSnapshot };

export const LIMITS = { layer_bytes: 4096, summary_bytes: 12288, detail_bytes: 16384, text_chars: 1500 };
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const notRead = (reason) => ({ status: "not_read", reason });
const bytes = (v) => Buffer.byteLength(JSON.stringify(v), "utf8");
const textReply = (value) => ({ content: [{ type: "text", text: JSON.stringify(value) }] });

// A name that isn't any layer's exact name, matched loosely (T037 case 09): the asked text, ignoring
// case, as a whole word or words in the layer's name. That covers the same name in another case, the
// name without its file extension ("rock" for rock.png) and a word in a longer name ("rock" in Rock
// Shadow.png), all one tier, so "rock" with rock.png and Rock Shadow.png is two candidates.
const escape = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export function loosely(asked, name) {
  const a = String(asked).trim().toLowerCase();
  if (!a) return false;
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escape(a)}($|[^\\p{L}\\p{N}])`, "u").test(String(name).toLowerCase());
}

// Each asked entry as a layer index, or an error entry. FR-017: a shared name returns the candidates.
// A name with no exact match but one loose match resolves to that layer, and the reply says which name
// it matched (`asked` on the entry); two or more loose matches return NAME_PARTIAL with each candidate.
function resolveAsked(snapshot, asked) {
  const layers = layerInfo(snapshot).layers;
  const nameOf = (i) => (i == null ? null : (layers.find((x) => x.index === i) || {}).name ?? null);
  return asked.map((a) => {
    if (typeof a === "number") {
      const l = layers.find((x) => x.index === a);
      return l ? { index: l.index } : { asked: a, error: "NOT_FOUND" };
    }
    const same = layers.filter((x) => x.name === a);
    if (same.length === 1) return { index: same[0].index };
    if (same.length > 1) {
      return { asked: a, error: "NAME_SHARED", candidates: same.map((l) => ({ layer_index: l.index, parent: nameOf(l.parent) })) };
    }
    const near = layers.filter((x) => loosely(a, x.name));
    if (near.length === 1) return { index: near[0].index, asked: a };
    if (near.length > 1) {
      return { asked: a, error: "NAME_PARTIAL", candidates: near.map((l) => ({ layer_index: l.index, layer: l.name, parent: nameOf(l.parent) })) };
    }
    return { asked: a, error: "NOT_FOUND" };
  });
}

// The layers asked for plus every layer up their Parent chains (research R9's fine sweeps).
function withParents(snapshot, indexes) {
  const out = new Set();
  for (const i of indexes) {
    const seen = new Set();
    for (let l = byIndex(snapshot, i); l && !seen.has(l.index); l = l.parent == null ? null : byIndex(snapshot, l.parent)) {
      seen.add(l.index);
      out.add(l.index);
    }
  }
  return [...out].sort((a, b) => a - b);
}

// FR-004b (data-model § 6): a layer's own keyed properties, from the snapshot's layers[].properties
// (which already skip the hidden half of a separable Position), each rolled up by key types' `snaps`.
export const OWN_KEYS_SUMMARY = 8;
function keyTypes(keys) {
  if (keys.length === 1) return "single_key";
  let held = 0;
  for (let i = 1; i < keys.length; i++) if (snaps(keys[i - 1], keys[i])) held++;
  return held === keys.length - 1 ? "all_held" : held === 0 ? "none_held" : "some_held";
}
// T037 case 05: whether the pairs that move are eased, by easing's own pair rule (analyze.mjs'
// segmentState, the one the easing lessons use). A pair that snaps (key types' `snaps`, so a hold on
// either side) doesn't move and doesn't count; with no pair that moves (one key, or every pair held)
// there's no `ease`. A partly eased pair makes it "mixed".
function easeOf(keys) {
  const moving = [];
  for (let i = 1; i < keys.length; i++) if (!snaps(keys[i - 1], keys[i])) moving.push(segmentState(keys[i - 1], keys[i]));
  if (!moving.length) return null;
  if (moving.every((x) => x === "eased")) return "eased";
  if (moving.every((x) => x === "linear")) return "linear";
  return "mixed";
}
function ownKeys(snapshot, index, detail) {
  const keyed = (snapshot.layers || []).find((l) => l.index === index);
  const props = keyed ? (keyed.properties || []).filter((p) => Array.isArray(p.keys) && p.keys.length > 0) : [];
  const list = props.map((p) => {
    const ease = easeOf(p.keys);
    return {
      property: p.display_name,
      ...(detail ? { display_path: p.display_path } : {}),
      keys: p.keys.length,
      key_types: keyTypes(p.keys),
      ...(ease ? { ease } : {}),
      ...(p.expression_enabled ? { expression_on: true } : {}),
    };
  });
  if (detail || list.length <= OWN_KEYS_SUMMARY) return { own_keys: list };
  return { own_keys: list.slice(0, OWN_KEYS_SUMMARY), own_keys_more: list.length - OWN_KEYS_SUMMARY };
}
// Locked and 3D on every layer; Collapse only on precomp and footage layers (OQ-12: AE reads it on
// for text and shape layers whatever the switch shows). A switch read as null is not read, never false.
const COLLAPSE_KINDS = new Set(["precomp", "footage"]);
// Review N4: with no layer_info the switches weren't read at all, which the read block says as
// older_snapshot, so each layer says the same.
export function switches(entry, known = true) {
  const one = (v) => (typeof v === "boolean" ? v : notRead(known ? "error" : "older_snapshot"));
  const out = { locked: one(entry.locked), three_d: one(entry.three_d) };
  if (COLLAPSE_KINDS.has(entry.kind)) out.collapse = one(entry.collapse);
  return out;
}
// Named layers say everything; the whole-comp summary leaves out what's empty or off (SC-007).
function keysAndSwitches(snapshot, entry, { named, detail }) {
  const keys = ownKeys(snapshot, entry.index, detail);
  const sw = switches(entry, layerInfo(snapshot).known);
  if (named) return { ...keys, ...sw };
  const out = keys.own_keys.length ? keys : {};
  for (const [k, v] of Object.entries(sw)) if (v !== false) out[k] = v;
  return out;
}

function exprSummary(x) {
  return { property: x.property, group: x.group, on: x.on, error: !!x.error, builds_on: x.builds_on, moves: x.moves };
}

// A parent's expression in a child's entry. How much it moves is said once, on the parent's own entry,
// when the parent is in the same reply (live Comp 1: 13 children of one shaking null repeated it,
// 2.6 KB of a 12 KB cap); otherwise it's here.
function parentExpr(x, parentListed) {
  return parentListed ? { property: x.property, error: !!x.error } : { property: x.property, error: !!x.error, moves: x.moves };
}

function summaryOf(entry, ctx) {
  const { map, links, exprOf } = ctx;
  const m = map.layers.find((l) => l.layer_index === entry.index);
  const li = links.get(entry.index);
  const mine = exprOf.get(entry.index) || [];
  const refsOut = mine.reduce((n, x) => n + x.refs.length, 0);
  return {
    layer_index: entry.index,
    layer: entry.name,
    ...(entry.asked_as != null ? { asked: entry.asked_as } : {}),
    kind: entry.kind,
    class: m ? m.class : null,
    ...keysAndSwitches(ctx.snapshot, entry, { named: ctx.named, detail: ctx.detail }),
    parents: m && Array.isArray(m.parents)
      ? m.parents.map((p) => ({ layer_index: p.layer_index, layer: p.layer, class: p.class, moves_children: p.moves_children, moves_by: p.moves_by ?? null, expressions: (exprOf.get(p.layer_index) || []).filter((x) => x.active || (x.on && x.error)).map((x) => parentExpr(x, ctx.listed.has(p.layer_index))) }))
      : notRead("no_layer_info"),
    // FR-004a: only on layers the caller named (a whole-comp summary has none).
    ...(ctx.shiftsFor ? { shifts: ctx.shiftsFor(entry.index) } : {}),
    children: m && Array.isArray(m.children) ? m.children.length : notRead("no_layer_info"),
    effects: Array.isArray(entry.effects) ? entry.effects.map((f) => f.name) : notRead(entry.effects === undefined ? "older_snapshot" : "error"),
    expressions: ctx.exprRead === "all" ? mine.map(exprSummary) : ctx.exprRead,
    links_in: li && li.status === "read"
      ? { count: li.links.length, first: li.links.slice(0, 3).map((l) => ({ from_layer: l.from_layer, from_property: l.from_property, property: l.property, inferred: true, target_renders: l.target_renders.renders })), unresolved_in_comp: li.unresolved_in_comp }
      : li || notRead("older_snapshot"),
    refs_out: ctx.exprRead === "all" ? refsOut : ctx.exprRead,
    precomp: entry.kind === "precomp" ? notRead("phase_2") : "not_a_precomp",
  };
}

function detailOf(entry, ctx, snapshot, atTime) {
  const s = summaryOf(entry, ctx);
  const mine = ctx.exprOf.get(entry.index) || [];
  const li = ctx.links.get(entry.index);
  return {
    ...s,
    expressions: ctx.exprRead === "all"
      ? mine.map((x) => {
        const raw = rawExpression(snapshot, x.layer_index, x.path);
        // AE's `\r` line ends as `\n` (T015), so the model reads, quotes and counts lines the
        // usual way. A `\r\n` becomes one character, and the full length drops by as many.
        const rawText = raw ? raw.text : "";
        const text = normalizeLineEnds(rawText);
        const full = raw ? raw.text_length - (rawText.length - text.length) : 0;
        const cut = text.length > LIMITS.text_chars || (raw && raw.text_cut);
        return {
          ...exprSummary(x),
          display_path: x.display_path,
          keys: x.keys,
          error: x.error == null ? x.error : normalizeLineEnds(x.error),
          text: text.slice(0, LIMITS.text_chars),
          cut_short: !!cut,
          full_length: full,
          values: isNum(atTime) && raw ? valuesAt(snapshot, raw, atTime) : notRead("no_time"),
          refs: x.refs,
        };
      })
      : ctx.exprRead,
    links_in: li && li.status === "read" ? { ...li, links: li.links } : li || notRead("older_snapshot"),
  };
}

function sweepsRead(snapshot, measured) {
  if (!Array.isArray(snapshot.expression_sweeps)) return notRead("older_snapshot");
  const missing = (snapshot.fine_not_read || []).filter((f) => measured.includes(f.layer));
  if (missing.length) return { status: "not_read", reason: missing[0].reason, coarse: "read" };
  return measured.length ? "fine" : "coarse";
}

// Drops layers from the end until the reply fits, naming each one left out. The reply is built again
// after each drop, so a parent that's dropped has its moves back on its children's entries, and the
// size note itself is counted against the cap (T015: it once tipped a fitted reply over).
function fit(entries, build, cap) {
  const list = [...entries];
  const cut = [];
  let reply = build(list);
  const measured = () => (cut.length ? bytes({ ...reply, size: { bytes: cap, cut } }) : bytes(reply));
  while (measured() > cap && list.length > 1) {
    const e = list.pop();
    cut.unshift(e.name ?? e.asked);
    reply = build(list);
  }
  if (cut.length) {
    reply.size = { bytes: 0, cut };
    reply.size.bytes = bytes(reply);
    reply.size.bytes = bytes(reply);
  }
  return reply;
}

export async function describeLayers({ layers: asked, detail = false, at_time } = {}) {
  if (detail && !(Array.isArray(asked) && asked.length)) throw new MentorError("DETAIL_NEEDS_LAYERS");
  const times = isNum(at_time) ? { sample_times: [at_time] } : {};
  let snapshot = await io.takeSnapshot(times);
  const named = Array.isArray(asked) && asked.length ? resolveAsked(snapshot, asked) : null;
  const indexes = named ? named.filter((e) => e.index != null).map((e) => e.index) : [];
  let measured = [];
  if (indexes.length && expressionsRead(snapshot) === "all") {
    const chain = withParents(snapshot, indexes);
    const swept = new Set(snapshot.expressions.filter((x) => x.active && x.group === "transform").map((x) => x.layer));
    measured = chain.filter((i) => swept.has(i));
    if (measured.length) snapshot = await io.takeSnapshot({ ...times, measure_layers: measured });
  }
  const atTime = isNum(at_time) ? at_time : snapshot.comp.time;
  const exprRead = expressionsRead(snapshot);
  const er = expressionReads(snapshot);
  const exprOf = new Map();
  for (const x of er.list) exprOf.set(x.layer_index, [...(exprOf.get(x.layer_index) || []), x]);
  const ctx = { map: motionSources(snapshot), links: linksIn(snapshot, { time: atTime }), exprOf, exprRead, snapshot, detail: !!detail, named: !!named };
  // FR-004a (research R15): each named layer's footprint shifts at the reading time, worked out once.
  if (named) {
    const shifts = new Map();
    ctx.shiftsFor = (index) => {
      if (!shifts.has(index)) shifts.set(index, footprintShifts(snapshot, index, atTime));
      return shifts.get(index);
    };
  }
  const read = {
    expressions: exprRead,
    links: exprRead === "all" ? "read" : exprRead,
    sweeps: sweepsRead(snapshot, measured),
    shifts: !named ? notRead("not_asked") : exprRead === "all" ? "read" : exprRead,
    own_keys: "read",
    switches: layerInfo(snapshot).known ? "read" : notRead("older_snapshot"),
    precomps: notRead("phase_2"),
  };
  const entries = named
    ? named.map((e) => (e.index == null ? e : e.asked != null ? { ...byIndex(snapshot, e.index), asked_as: e.asked } : byIndex(snapshot, e.index)))
    : layerInfo(snapshot).layers;
  const build = (list) => {
    ctx.listed = new Set(list.filter((e) => !e.error).map((e) => e.index));
    const out = list.map((e) => (e.error ? e : detail ? detailOf(e, ctx, snapshot, atTime) : summaryOf(e, ctx)));
    return { comp: { name: snapshot.comp.name, time: snapshot.comp.time }, read, layers: out };
  };
  return textReply(fit(entries, build, detail ? LIMITS.detail_bytes : LIMITS.summary_bytes));
}

export const TOOLS = [
  {
    name: "describe_layers",
    title: "Describe layers",
    description:
      "Read-only. What moves the active comp's layers: expressions on any property (on, error, whether each builds on its own " +
      "value, how far it moves), what links to each layer and whether that shows, effects, parents, and each layer's own " +
      "keys (key types, and whether they're eased). Omit layers for a summary of the whole comp; name layers (index, or a " +
      "name only one layer has) for their summary, or with detail for each expression's text. A name that's a word in one " +
      "layer's name (rock for rock.png) reads that layer; a word in several returns them all, to ask which. Links and " +
      "builds-on are inferred from the text. It can't see inside precomps yet.",
    inputSchema: {
      type: "object",
      properties: {
        layers: { type: "array", items: { type: ["integer", "string"] }, description: "Layer indexes or names. Omit for the whole comp." },
        detail: { type: "boolean", description: "Each named layer's expression text, errors, links and references. Needs layers." },
        at_time: { type: "number", minimum: 0, description: "Seconds: the time for values before and after each expression. Default: the playhead." },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    handler: describeLayers,
  },
];
