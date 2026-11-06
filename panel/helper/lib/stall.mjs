// Stopping a request that goes quiet (spec 013 T068). The SDK's `timeout` only covers the wait for
// response headers, and undici's own limits are 5 minutes, so an answer that goes silent after its
// headers would otherwise hold the learner until the turn limit. This fetch watches the response's
// bytes, pings included (the SDK drops pings before any event reaches the loop), and fails the body
// when none arrive for stallMs, which also closes that connection. Holds no text; logs ids only.

import { trackReach } from "./reach.mjs";

const CODE = "KNACK_STALLED";

export class StalledError extends Error {
  constructor(silentMs) {
    super("the service went quiet mid-answer");
    this.name = "StalledError";
    this.code = CODE;
    this.silentMs = silentMs;
  }
}

// True for a StalledError, or an error from the SDK with one in its cause chain.
export function isStall(err) {
  let e = err;
  for (let depth = 0; e && typeof e === "object" && depth < 6; depth++) {
    if (e.code === CODE) return true;
    e = e.cause;
  }
  return false;
}

// A copy of `body` that errors with a StalledError if a read waits longer than stallMs. The timer
// runs only while a read is waiting, so a slow reader never looks like a quiet service. onEnd gets
// the longest wait and how the body ended (done, quiet, error, cancelled), once.
export function watchBody(body, stallMs, onStall, onEnd) {
  const reader = body.getReader();
  let timer = null;
  let maxGap = 0;
  let ended = false;
  const end = (how) => {
    if (ended) return;
    ended = true;
    if (onEnd) onEnd({ maxGapMs: maxGap, how });
  };
  const disarm = () => {
    clearTimeout(timer);
    timer = null;
  };
  return new ReadableStream({
    async pull(ctl) {
      const waitFrom = Date.now();
      timer = setTimeout(() => {
        timer = null;
        maxGap = Math.max(maxGap, Date.now() - waitFrom);
        const err = new StalledError(stallMs);
        if (onStall) onStall(err);
        end("quiet");
        ctl.error(err);
        reader.cancel(err).catch(() => {});
      }, stallMs);
      try {
        const { done, value } = await reader.read();
        disarm();
        if (!ended) maxGap = Math.max(maxGap, Date.now() - waitFrom);
        if (done) {
          end("done");
          ctl.close();
        } else ctl.enqueue(value);
      } catch (e) {
        disarm();
        end("error");
        try {
          ctl.error(e);
        } catch {}
      }
    },
    cancel(reason) {
      disarm();
      end("cancelled");
      return reader.cancel(reason);
    },
  });
}

// A fetch for the SDK client. Requests go out untouched; only the response body is watched.
// reach, if given, is the caller's object: reach.last is set to each attempt as it starts, and its
// `reached` says whether the request reached the service (lib/reach.mjs). The SDK sends one
// attempt at a time per request, so after a failure reach.last is the attempt that failed.
export function stallFetch({ stallMs, log = () => {}, baseFetch = globalThis.fetch, reach = null }) {
  return async (url, init) => {
    const t0 = Date.now();
    const retry = new Headers(init && init.headers).get("x-stainless-retry-count");
    const attempt = { reached: false };
    if (reach) reach.last = attempt;
    let res;
    try {
      res = await trackReach(attempt, () => baseFetch(url, init));
    } catch (e) {
      // What the SDK's own timeout or a connection failure looks like, before its retry.
      log({ event: "request_no_headers", retry: retry === null ? null : Number(retry), ms: Date.now() - t0, name: (e && e.name) || null, code: (e && e.cause && e.cause.code) || null, reached: attempt.reached });
      throw e;
    }
    if (!res.body) return res;
    const requestId = res.headers.get("request-id");
    const headersMs = Date.now() - t0;
    // Per request, numbers only, so the limits can be checked against real data.
    const body = watchBody(
      res.body,
      stallMs,
      () => log({ event: "response_went_quiet", request_id: requestId, silent_ms: stallMs, ms: Date.now() - t0 }),
      ({ maxGapMs, how }) => log({ event: "response_timing", request_id: requestId, status: res.status, headers_ms: headersMs, max_gap_ms: maxGapMs, total_ms: Date.now() - t0, end: how }),
    );
    return new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers });
  };
}
