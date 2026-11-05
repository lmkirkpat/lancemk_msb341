import { test } from "node:test";
import assert from "node:assert/strict";
import { watchBody, stallFetch, isStall, StalledError } from "../lib/stall.mjs";
import { classify } from "../lib/errors.mjs";

const bytes = (s) => new TextEncoder().encode(s);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// A body that hands out `parts` with `gapMs` before each, then ends (or stays open with hang).
function bodyOf(parts, gapMs, hang) {
  let i = 0;
  let cancelled = null;
  const stream = new ReadableStream({
    async pull(ctl) {
      if (i >= parts.length) {
        if (hang) return new Promise(() => {});
        return ctl.close();
      }
      await wait(gapMs);
      ctl.enqueue(bytes(parts[i++]));
    },
    cancel(reason) {
      cancelled = reason;
    },
  });
  return { stream, cancelledWith: () => cancelled };
}

async function readAll(stream) {
  const out = [];
  for await (const c of stream) out.push(new TextDecoder().decode(c));
  return out;
}

test("a body that keeps sending passes through whole, in order, however long it takes", async () => {
  const b = bodyOf(["a", "b", "c", "d"], 40);
  assert.deepEqual(await readAll(watchBody(b.stream, 100)), ["a", "b", "c", "d"]);
});

test("a quiet body fails with a StalledError and closes what's under it", async () => {
  const b = bodyOf(["a"], 5, true);
  const seen = [];
  const started = Date.now();
  await assert.rejects(readAll(watchBody(b.stream, 80, (e) => seen.push(e))), (e) => e instanceof StalledError);
  assert.ok(Date.now() - started < 1000);
  assert.equal(seen.length, 1);
  assert.ok(isStall(b.cancelledWith()), "the connection under it is cancelled");
});

test("a reader that's slow to read never looks like a quiet service", async () => {
  const b = bodyOf(["a", "b", "c"], 1);
  const r = watchBody(b.stream, 60).getReader();
  await r.read();
  await wait(150);
  assert.deepEqual((await r.read()).done, false);
  await wait(150);
  assert.deepEqual((await r.read()).done, false);
});

test("cancelling the watched body stops the timer and cancels the body under it", async () => {
  const b = bodyOf(["a"], 1, true);
  const seen = [];
  const w = watchBody(b.stream, 50, (e) => seen.push(e));
  const r = w.getReader();
  await r.read();
  await r.cancel("done");
  await wait(120);
  assert.equal(seen.length, 0);
  assert.equal(b.cancelledWith(), "done");
});

test("the error under a body comes through as itself, not as a stall", async () => {
  const boom = new Error("under");
  const src = new ReadableStream({ pull(ctl) { ctl.error(boom); } });
  await assert.rejects(readAll(watchBody(src, 500)), (e) => e === boom);
});

test("isStall finds one through the SDK's cause chain, and classify calls it service_busy", () => {
  const wrapped = Object.assign(new Error("wrapped"), { cause: new StalledError(5) });
  assert.equal(isStall(wrapped), true);
  assert.equal(isStall(new Error("other")), false);
  assert.equal(isStall(null), false);
  assert.equal(classify(wrapped), "service_busy");
});

test("stallFetch sends the request untouched and logs a failed attempt with no text", async () => {
  const seen = [];
  const logs = [];
  const f = stallFetch({
    stallMs: 100,
    log: (l) => logs.push(l),
    baseFetch: async (u, i) => {
      seen.push([u, i]);
      if (seen.length === 1) throw Object.assign(new Error("aborted"), { name: "AbortError" });
      return new Response("ok", { status: 201, statusText: "Created", headers: { "request-id": "req_1" } });
    },
  });
  const init = { method: "POST", body: "the body", headers: { "x-stainless-retry-count": "2" } };
  await assert.rejects(f("http://x/", init));
  const res = await f("http://x/", init);
  assert.equal(seen[1][1], init, "the same init object, unchanged");
  assert.equal(res.status, 201);
  assert.equal(res.headers.get("request-id"), "req_1");
  assert.equal(await res.text(), "ok");
  assert.equal(logs.length, 1);
  assert.equal(logs[0].event, "request_no_headers");
  assert.equal(logs[0].retry, 2);
  assert.equal(logs[0].name, "AbortError");
  assert.doesNotMatch(JSON.stringify(logs), /the body/);
});
