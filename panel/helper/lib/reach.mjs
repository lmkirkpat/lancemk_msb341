// Whether a request reached the service: a connection opened (TLS finished, for https) and the
// request went out on it. That's what tells "the service is slow" from "the learner is offline"
// when a request gets no headers in time (T068 follow-up, 2026-11-05): the SDK turns both its own
// timeout and undici's connect timeout into the same APIConnectionTimeoutError, with no cause, so
// the error alone can't say which it was.
//
// Node's fetch (undici) reports each request on diagnostics channels: `undici:request:create` when
// the request is made, in the async context of the fetch call, and `undici:client:sendHeaders` when
// its headers are written to an open connection. A DNS failure, a refused or unreachable host, a
// connect timeout or a TLS handshake that never finishes never reach sendHeaders. A reused keep-alive
// connection still does. Built-ins only; reads no request or response content.

import dc from "node:diagnostics_channel";
import { AsyncLocalStorage } from "node:async_hooks";

const current = new AsyncLocalStorage(); // the attempt whose fetch is running
const owner = new WeakMap(); // undici's request → its attempt
let listening = false;

function listen() {
  if (listening) return;
  listening = true;
  dc.subscribe("undici:request:create", (m) => {
    const attempt = current.getStore();
    if (attempt && m && m.request) owner.set(m.request, attempt);
  });
  dc.subscribe("undici:client:sendHeaders", (m) => {
    const attempt = m && m.request ? owner.get(m.request) : null;
    if (attempt) attempt.reached = true;
  });
}

// Runs fetchOnce() (one fetch) and records on `attempt` whether its request reached the service.
// → fetchOnce()'s promise. attempt.reached stays false if the runtime reports nothing (a fetch that
// isn't undici's), which reads as "never connected": the same as before this file existed.
export function trackReach(attempt, fetchOnce) {
  listen();
  attempt.reached = false;
  return current.run(attempt, fetchOnce);
}
