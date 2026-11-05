// Stopping a request that goes quiet (spec 013 T068). The SDK's `timeout` only covers the wait for
// response headers, and undici's own limits are 5 minutes, so an answer that goes silent after its
// headers would otherwise hold the learner until the turn limit. This fetch watches the response's
// bytes, pings included (the SDK drops pings before any event reaches the loop), and fails the body
// when none arrive for stallMs, which also closes that connection. Holds no text; logs ids only.

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
// runs only while a read is waiting, so a slow reader never looks like a quiet service.
export function watchBody(body, stallMs, onStall) {
  const reader = body.getReader();
  let timer = null;
  const disarm = () => {
    clearTimeout(timer);
    timer = null;
  };
  return new ReadableStream({
    async pull(ctl) {
      timer = setTimeout(() => {
        timer = null;
        const err = new StalledError(stallMs);
        if (onStall) onStall(err);
        ctl.error(err);
        reader.cancel(err).catch(() => {});
      }, stallMs);
      try {
        const { done, value } = await reader.read();
        disarm();
        if (done) ctl.close();
        else ctl.enqueue(value);
      } catch (e) {
        disarm();
        try {
          ctl.error(e);
        } catch {}
      }
    },
    cancel(reason) {
      disarm();
      return reader.cancel(reason);
    },
  });
}

// A fetch for the SDK client. Requests go out untouched; only the response body is watched.
export function stallFetch({ stallMs, log = () => {}, baseFetch = globalThis.fetch }) {
  return async (url, init) => {
    const t0 = Date.now();
    const retry = new Headers(init && init.headers).get("x-stainless-retry-count");
    let res;
    try {
      res = await baseFetch(url, init);
    } catch (e) {
      // What the SDK's own timeout or a connection failure looks like, before its retry.
      log({ event: "request_no_headers", retry: retry === null ? null : Number(retry), ms: Date.now() - t0, name: (e && e.name) || null, code: (e && e.cause && e.cause.code) || null });
      throw e;
    }
    if (!res.body) return res;
    const requestId = res.headers.get("request-id");
    const body = watchBody(res.body, stallMs, () => log({ event: "response_went_quiet", request_id: requestId, silent_ms: stallMs, ms: Date.now() - t0 }));
    return new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers });
  };
}
