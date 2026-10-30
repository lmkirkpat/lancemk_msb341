// A turn's cost from the service's token counts by kind and the dated price table (spec 013
// FR-026, research R13). Unknown is null, never 0: a model or price missing from prices.json, or
// counts the service didn't report, make the cost null.

import fs from "node:fs";

const PER = 1e6;

export function loadPrices(file) {
  const p = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!p || typeof p.models !== "object" || !p.checked) throw new Error("prices.json has no models or no checked date");
  return p;
}

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

// The service's usage → { input, cache_write, cache_read, output } (the turn log's kinds).
// cache_write_1h is kept apart when the service splits writes by lifetime.
export function tokensOf(usage) {
  const u = usage || {};
  const split = u.cache_creation && typeof u.cache_creation === "object" ? u.cache_creation : null;
  return {
    input: num(u.input_tokens),
    cache_write: num(u.cache_creation_input_tokens),
    cache_read: num(u.cache_read_input_tokens),
    output: num(u.output_tokens),
    ...(split ? { cache_write_1h: num(split.ephemeral_1h_input_tokens) } : {}),
  };
}

export function addTokens(a, b) {
  return {
    input: a.input + b.input,
    cache_write: a.cache_write + b.cache_write,
    cache_read: a.cache_read + b.cache_read,
    output: a.output + b.output,
  };
}

export const ZERO_TOKENS = Object.freeze({ input: 0, cache_write: 0, cache_read: 0, output: 0 });

const isPrice = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0;

// One request's cost on one model. ttl ("5m" | "1h") prices cache writes the service didn't split.
function costOne(model, usage, prices, ttl) {
  const row = prices && prices.models && prices.models[model];
  if (!row || !usage || typeof usage.input_tokens !== "number" || typeof usage.output_tokens !== "number") return null;
  const t = tokensOf(usage);
  const prompt = t.input + t.cache_write + t.cache_read;
  const rates = row.long_prompt && prompt > (row.long_prompt.above_tokens || 100000) ? row.long_prompt : row;
  const write1h = typeof t.cache_write_1h === "number" ? t.cache_write_1h : ttl === "1h" ? t.cache_write : 0;
  const write5m = t.cache_write - write1h;
  const needed = [["input", t.input], ["output", t.output], ["cache_read", t.cache_read], ["cache_write_5m", write5m], ["cache_write_1h", write1h]];
  let total = 0;
  for (const [field, count] of needed) {
    if (count === 0) continue;
    if (!isPrice(rates[field])) return null;
    total += (count * rates[field]) / PER;
  }
  return total;
}

// A response's cost. With a server-side fallback, usage.iterations holds every attempt (each on
// the model that ran it); top-level usage covers only the last, so iterations win when present.
export function costOf({ model, usage }, prices, ttl) {
  const its = usage && Array.isArray(usage.iterations) ? usage.iterations : null;
  if (its && its.length) {
    let total = 0;
    for (const it of its) {
      const c = costOne(it.model || model, it, prices, ttl);
      if (c === null) return null;
      total += c;
    }
    return round(total);
  }
  const c = costOne(model, usage, prices, ttl);
  return c === null ? null : round(c);
}

// The sum of several costs; any null makes the sum null.
export function sumCosts(costs) {
  let total = 0;
  for (const c of costs) {
    if (c === null || c === undefined) return null;
    total += c;
  }
  return round(total);
}

function round(x) {
  return Math.round(x * 1e8) / 1e8;
}
