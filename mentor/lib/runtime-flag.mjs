// Which runtime the server runs under (spec 014 research R4, FR-017): "a" only when the panel's helper
// sets AE_MENTOR_RUNTIME=a in the server's environment; anything else, unset included, is "b1". Fail
// closed: a misconfigured A is treated as B1, so it offers no lesson it can't hand over to.

export const RUNTIMES = ["a", "b1"];

export function runtime(env = process.env) {
  return env && env.AE_MENTOR_RUNTIME === "a" ? "a" : "b1";
}
