// What went wrong, as one of the adapter's error kinds, with the fixed plain message the panel
// shows for it (spec 013 FR-027, research R10, contracts/helper-protocol.md › Error kinds).
// Messages are chosen by kind, never built from the service's text, so none holds a status code,
// a path, a tool name or the key. scrub() is applied to anything from the service before it
// reaches a log line (FR-021).

import Anthropic from "@anthropic-ai/sdk";
import { isStall } from "./stall.mjs";

export const MESSAGES = Object.freeze({
  not_signed_in: "The mentor can't start: its access key is missing or isn't working. Check setup, then start the lesson again.",
  out_of_credit: "The mentor's access key has run out of credit or hit its spending limit. Check setup or top it up, then try again.",
  rate_limited: "The mentor is getting too many requests right now. Wait a minute, then try again.",
  service_busy: "The mentor's service is busy right now. Try again in a moment.",
  offline: "The mentor can't reach the internet. Check your connection, then try again.",
  refused: "The mentor couldn't answer that. Try rephrasing.",
  timeout: "The mentor took more than 5 minutes to answer, so the panel stopped waiting. Try again.",
  start_failed: "The mentor couldn't start. Close and reopen the panel; if it happens again, check setup.",
  process_exited: "The mentor stopped unexpectedly. Start the lesson again.",
  busy: "",
});

export const KINDS = Object.freeze(Object.keys(MESSAGES));

// → { kind, message } for an error event.
export function errorEvent(kind) {
  return { kind, message: MESSAGES[kind] ?? MESSAGES.start_failed };
}

// Billing: provisional until T038 checks the real shape against the service. Today's reference
// says out of credit is `billing_error` (HTTP 402, or a 400 carrying that type); a workspace spend
// limit's shape is unverified, so its usual wording is matched too.
const BILLING_TEXT = /credit balance|spend(?:ing)? limit|billing/i;

function isBilling(err) {
  if (err.status === 402 || err.type === "billing_error") return true;
  const msg = err.error && err.error.error && typeof err.error.error.message === "string" ? err.error.error.message : "";
  return (err.status === 400 || err.status === 403 || err.status === 429) && BILLING_TEXT.test(msg);
}

// An error thrown while calling the service → its kind (research R10's table). The SDK has
// already retried 429, 5xx and connection errors twice by the time one reaches here.
//
// offline is only for a request that never reached the service: no DNS answer, refused, no route,
// a connect timeout, a TLS handshake that never finished. Once the request went out on an open
// connection, anything that goes wrong is the service's side as far as the learner can tell, so it's
// service_busy (builder's decision, 2026-11-05). reached comes from the client's last attempt
// (loop.mjs lastReach); the SDK's connection errors, its timeout included, can't say on their own.
export function classify(err, { reached = false } = {}) {
  if (!err) return "service_busy";
  if (err.code === "NO_KEY") return "not_signed_in";
  if (isStall(err)) return "service_busy"; // headers came, so the connection worked; then silence
  // Includes the timeout subclass: no headers in time, or (from undici) no connection in time.
  if (err instanceof Anthropic.APIConnectionError) return reached ? "service_busy" : "offline";
  if (err instanceof Anthropic.APIError) {
    if (isBilling(err)) return "out_of_credit";
    const s = err.status;
    const t = err.type;
    if (s === 401 || s === 403 || t === "authentication_error" || t === "permission_error") return "not_signed_in";
    if (s === 429 || t === "rate_limit_error") return "rate_limited";
    if ((typeof s === "number" && s >= 500) || t === "overloaded_error" || t === "api_error") return "service_busy";
    // A status the table doesn't list (400, 404, 413 …) is a setup or helper fault, not the
    // learner's: the start_failed message tells them to reopen and check setup.
    if (typeof s === "number") return "start_failed";
    // An SSE error event of a type the table doesn't list, mid-answer.
    return "service_busy";
  }
  // A connection that dropped mid-answer reaches here as the SDK's plain error ("terminated")
  // over undici's socket error. Every failure before headers comes wrapped as an APIConnectionError
  // (above), so this one came after the headers: the connection was made, so service_busy. If the
  // learner's network did go down, trying again fails before connecting and says offline. Anything
  // else is a fault in the helper, not the network: the start_failed message (reopen, check setup),
  // and the loop logs it as internal_error so it's never mistaken for a connection problem.
  return isNetworkError(err) ? "service_busy" : "start_failed";
}

const NET_CODE = /^(?:ECONNRESET|ECONNREFUSED|ECONNABORTED|ETIMEDOUT|EPIPE|ENOTFOUND|EAI_AGAIN|ENETUNREACH|ENETDOWN|EHOSTUNREACH|UND_ERR_[A-Z_]+)$/;
const NET_MESSAGE = /^(?:terminated|fetch failed|other side closed)$/;

// The SDK's connection and timeout classes, or an error whose cause chain holds a network error
// code or undici's own wording for a dropped connection.
export function isNetworkError(err) {
  let e = err;
  for (let depth = 0; e && typeof e === "object" && depth < 6; depth++) {
    if (e instanceof Anthropic.APIConnectionError) return true;
    if (typeof e.code === "string" && NET_CODE.test(e.code)) return true;
    if (e instanceof TypeError && NET_MESSAGE.test(String(e.message))) return true;
    e = e.cause;
  }
  return false;
}

const KEY_SHAPE = /sk-ant-[A-Za-z0-9_-]{10,}/g;

// Any key-shaped text, and the given key itself, replaced before logging.
export function scrub(text, key) {
  let s = typeof text === "string" ? text : String(text);
  if (key && typeof key === "string" && key.length >= 8) s = s.split(key).join("[key removed]");
  return s.replace(KEY_SHAPE, "[key removed]");
}

// One log line for stderr: JSON, scrubbed.
export function logLine(entry, key) {
  return scrub(JSON.stringify({ at: new Date().toISOString(), ...entry }), key);
}
