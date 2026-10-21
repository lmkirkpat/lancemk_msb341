// Where a keyframe pair's move is fastest (spec 008 FR-016, research R2). Pure.
//
// After Effects' temporal ease for one dimension is a cubic bezier in (time, value): with duration
// T, value change D, the start key's out speed s0 and influence a, and the landing key's in speed s1
// and influence b (both as shares of T):
//   P0 = (0, 0), P1 = (a·T, s0·a·T), P2 = (T − b·T, D − s1·b·T), P3 = (T, D).
// When a + b is more than 1 the two are scaled down to sum to 1, so time never runs backwards (an
// assumption L-6 checks against the speed graph). The curve is sampled at 200 even steps of its
// parameter; speed is |dv/du| / (dt/du), and the peak's time is returned as a share of T.

export const SAMPLES = 200;
export const PART_TOLERANCE = 0.05;

const share = (influence) => Math.max(0, Math.min(100, Number(influence) || 0)) / 100;

// `out` is the start key's out side, `in` the landing key's in side: { speed, influence (percent) }.
// Speeds must have the same sign convention as `delta` (the caller makes spatial speeds, which AE
// reports as magnitudes, follow the distance). Returns { peak, parts }.
export function fastestPart({ duration, delta, out, in: inn }) {
  const T = duration > 0 ? duration : 1;
  let a = share(out && out.influence);
  let b = share(inn && inn.influence);
  if (a + b > 1) {
    const k = a + b;
    a /= k;
    b /= k;
  }
  const s0 = Number(out && out.speed) || 0;
  const s1 = Number(inn && inn.speed) || 0;
  const P = [[0, 0], [a * T, s0 * a * T], [T - b * T, delta - s1 * b * T], [T, delta]];

  let best = -Infinity;
  let peak = 0.5;
  for (let i = 0; i <= SAMPLES; i++) {
    const u = i / SAMPLES;
    const v = 1 - u;
    const d = (k) => 3 * v * v * (P[1][k] - P[0][k]) + 6 * v * u * (P[2][k] - P[1][k]) + 3 * u * u * (P[3][k] - P[2][k]);
    const dt = d(0);
    if (!(dt > 1e-12)) continue; // a zero-length handle: speed there is a limit, the neighbours carry it
    const speed = Math.abs(d(1)) / dt;
    if (speed > best + 1e-12) {
      best = speed;
      const t = v * v * v * P[0][0] + 3 * v * v * u * P[1][0] + 3 * v * u * u * P[2][0] + u * u * u * P[3][0];
      peak = t / T;
    }
  }
  return { peak, parts: partsOf(peak) };
}

// first below 1/3, last above 2/3, middle between; within PART_TOLERANCE of a boundary, both
// neighbours count.
export function partsOf(peak) {
  const parts = [];
  const near = (x) => Math.abs(peak - x) <= PART_TOLERANCE;
  if (peak < 1 / 3 || near(1 / 3)) parts.push("first");
  if ((peak >= 1 / 3 && peak <= 2 / 3) || near(1 / 3) || near(2 / 3)) parts.push("middle");
  if (peak > 2 / 3 || near(2 / 3)) parts.push("last");
  return parts;
}
