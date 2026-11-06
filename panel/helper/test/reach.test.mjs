import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import net from "node:net";
import { trackReach } from "../lib/reach.mjs";

async function listening(srv) {
  await new Promise((ok) => srv.listen(0, "127.0.0.1", ok));
  return srv.address().port;
}

// One fetch through trackReach, given up after ms; → attempt.reached.
async function reachedFor(url, ms = 300) {
  const attempt = {};
  try {
    await trackReach(attempt, () => fetch(url, { method: "POST", body: "x", signal: AbortSignal.timeout(ms) }));
  } catch {}
  return attempt.reached;
}

test("Node's fetch reports its requests on the channels reach.mjs listens to", async () => {
  // If a Node upgrade stops this, every no-headers failure reads as offline again: this test says so.
  const srv = http.createServer((req, res) => res.end("ok"));
  const port = await listening(srv);
  try {
    assert.equal(await reachedFor(`http://127.0.0.1:${port}/`), true);
    assert.equal(await reachedFor(`http://127.0.0.1:${port}/`), true, "a reused keep-alive connection counts too");
  } finally {
    srv.closeAllConnections();
    srv.close();
  }
});

test("a request on an open connection that never answers reached the service", async () => {
  const srv = http.createServer(() => {});
  const port = await listening(srv);
  try {
    assert.equal(await reachedFor(`http://127.0.0.1:${port}/`), true);
  } finally {
    srv.closeAllConnections();
    srv.close();
  }
});

test("refused, no DNS answer, a TLS handshake that never finishes: never reached", async () => {
  const gone = http.createServer();
  const port = await listening(gone);
  await new Promise((ok) => gone.close(ok));
  assert.equal(await reachedFor(`http://127.0.0.1:${port}/`), false);
  assert.equal(await reachedFor("http://knack-helper-test.invalid/", 5000), false);
  const mute = net.createServer(() => {});
  const tlsPort = await listening(mute);
  try {
    assert.equal(await reachedFor(`https://127.0.0.1:${tlsPort}/`), false);
  } finally {
    mute.close();
  }
});

test("attempts running at once are kept apart", async () => {
  const srv = http.createServer(() => {});
  const port = await listening(srv);
  const gone = http.createServer();
  const goneport = await listening(gone);
  await new Promise((ok) => gone.close(ok));
  try {
    const [a, b] = await Promise.all([reachedFor(`http://127.0.0.1:${port}/`), reachedFor(`http://127.0.0.1:${goneport}/`)]);
    assert.deepEqual([a, b], [true, false]);
  } finally {
    srv.closeAllConnections();
    srv.close();
  }
});

test("a fetch that isn't undici's reports nothing: never reached", async () => {
  const attempt = { reached: true };
  await assert.rejects(trackReach(attempt, async () => { throw new TypeError("fetch failed"); }));
  assert.equal(attempt.reached, false, "reset at the start of each attempt");
});
