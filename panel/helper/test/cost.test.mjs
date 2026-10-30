import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPrices, costOf, sumCosts, tokensOf, addTokens, ZERO_TOKENS } from "../lib/cost.mjs";

const HELPER = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const prices = loadPrices(path.join(HELPER, "prices.json"));
const u = (input, cache_write, cache_read, output, extra) => ({
  input_tokens: input,
  cache_creation_input_tokens: cache_write,
  cache_read_input_tokens: cache_read,
  output_tokens: output,
  ...extra,
});

test("the repo's price table is dated and has research R13's rows", () => {
  assert.equal(prices.checked, "2026-10-30");
  assert.deepEqual(Object.keys(prices.models).sort(), ["claude-haiku-5-5", "claude-opus-5-5", "claude-sonnet-5-5"]);
  const o = prices.models["claude-opus-5-5"];
  assert.deepEqual([o.input, o.output, o.cache_read, o.cache_write_5m, o.cache_write_1h], [4, 20, 0.2, 5, 8]);
  const h = prices.models["claude-haiku-5-5"];
  assert.equal(h.long_prompt.above_tokens, 100000);
  assert.equal(h.cache_read, 0.01);
});

test("Opus 5.5: each kind at its own rate, 5-minute writes at 1.25x input", () => {
  // 1000 input × $4 + 2000 writes × $5 + 10000 reads × $0.20 + 500 output × $20, per million
  const c = costOf({ model: "claude-opus-5-5", usage: u(1000, 2000, 10000, 500) }, prices, "5m");
  assert.equal(c, (1000 * 4 + 2000 * 5 + 10000 * 0.2 + 500 * 20) / 1e6);
});

test("1-hour writes at 2x input, from the setting or from the service's split", () => {
  assert.equal(costOf({ model: "claude-opus-5-5", usage: u(0, 1000, 0, 0) }, prices, "1h"), (1000 * 8) / 1e6);
  const split = u(0, 1000, 0, 0, { cache_creation: { ephemeral_5m_input_tokens: 600, ephemeral_1h_input_tokens: 400 } });
  assert.equal(costOf({ model: "claude-opus-5-5", usage: split }, prices, "5m"), (600 * 5 + 400 * 8) / 1e6);
});

test("Haiku 5.5's long-prompt prices above 100K prompt tokens", () => {
  const short = costOf({ model: "claude-haiku-5-5", usage: u(90000, 0, 10000, 1000) }, prices, "5m");
  assert.equal(short, (90000 * 0.1 + 10000 * 0.01 + 1000 * 0.5) / 1e6);
  const long = costOf({ model: "claude-haiku-5-5", usage: u(90000, 0, 10001, 1000) }, prices, "5m");
  assert.equal(long, (90000 * 0.5 + 10001 * 0.05 + 1000 * 2.5) / 1e6);
});

test("unknown is null, never 0", () => {
  assert.equal(costOf({ model: "claude-unknown-9", usage: u(10, 0, 0, 10) }, prices, "5m"), null);
  assert.equal(costOf({ model: "claude-opus-5-5", usage: null }, prices, "5m"), null);
  assert.equal(costOf({ model: "claude-opus-5-5", usage: { input_tokens: 5 } }, prices, "5m"), null);
  const noRead = { models: { m: { input: 1, output: 1, cache_write_5m: 1, cache_write_1h: 1 } }, checked: "x" };
  assert.equal(costOf({ model: "m", usage: u(1, 0, 5, 1) }, noRead, "5m"), null, "a missing price for a kind that was used");
  assert.equal(costOf({ model: "m", usage: u(1, 0, 0, 1) }, noRead, "5m"), 2 / 1e6, "a missing price for an unused kind is fine");
  assert.equal(sumCosts([0.01, null, 0.02]), null);
  assert.equal(sumCosts([0.01, 0.02]), 0.03);
  assert.equal(sumCosts([]), 0);
});

test("a fallback's attempts are each priced on the model that ran them", () => {
  const usage = u(10, 0, 0, 1, {
    iterations: [
      { type: "message", model: "claude-opus-5-5", ...u(1000, 0, 0, 100) },
      { type: "fallback_message", model: "claude-sonnet-5-5", ...u(1000, 0, 0, 100) },
    ],
  });
  assert.equal(costOf({ model: "claude-sonnet-5-5", usage }, prices, "5m"), (1000 * 4 + 100 * 20 + 1000 * 2 + 100 * 10) / 1e6);
  const unpriced = u(1, 0, 0, 1, { iterations: [{ model: "claude-opus-4-8", ...u(1, 0, 0, 1) }] });
  assert.equal(costOf({ model: "claude-opus-5-5", usage: unpriced }, prices, "5m"), null);
});

test("token counts by kind", () => {
  assert.deepEqual(tokensOf(u(1, 2, 3, 4)), { input: 1, cache_write: 2, cache_read: 3, output: 4 });
  assert.deepEqual(addTokens(ZERO_TOKENS, tokensOf(u(1, 2, 3, 4))), { input: 1, cache_write: 2, cache_read: 3, output: 4 });
});
