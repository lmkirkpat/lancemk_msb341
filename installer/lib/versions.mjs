// Version numbers: "26.5", "26.5.1x12" (AE builds), "0.1.0". Only the leading numbers count.

export function parseVersion(text) {
  const m = /^\s*(\d+)(?:\.(\d+))?(?:\.(\d+))?/.exec(String(text || ""));
  return m ? [Number(m[1]), Number(m[2] || 0), Number(m[3] || 0)] : null;
}

// → -1, 0 or 1. Missing parts count as 0.
export function compareVersions(a, b) {
  const x = Array.isArray(a) ? a : parseVersion(a);
  const y = Array.isArray(b) ? b : parseVersion(b);
  for (let i = 0; i < 3; i++) {
    const d = (x[i] || 0) - (y[i] || 0);
    if (d) return d < 0 ? -1 : 1;
  }
  return 0;
}

export const atLeast = (v, min) => !!parseVersion(v) && compareVersions(parseVersion(v), min) >= 0;
