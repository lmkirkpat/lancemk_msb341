// R0 (research R10, data-model › Host): the After Effects version and OS, from the `host` field
// snapshot.jsx adds. Only the version, build, OS name and OS version are kept: nothing else from the
// raw strings, so no user, path or machine name can get through (FR-011).

const UNKNOWN = Object.freeze({ known: false });

// app.version is "26.5x12": major.minor, then the build after the x.
function parseVersion(raw) {
  const m = typeof raw === "string" ? /^\s*(\d+)\.(\d+)(?:\.\d+)*(?:x(\d+))?/.exec(raw) : null;
  return m ? { version: `${Number(m[1])}.${Number(m[2])}`, build: m[3] ?? null } : null;
}

// $.os is "Macintosh OS 27.0.1/64" on a Mac and "Windows/64 10.0.22631" (or similar) on Windows.
function parseOs(raw) {
  if (typeof raw !== "string") return null;
  const mac = /^\s*Mac(?:intosh)?\s*OS\s*X?\s*(\d+(?:\.\d+)*)/i.exec(raw);
  if (mac) return { os: `macOS ${mac[1]}`, platform: "mac" };
  const win = /^\s*Windows(?:\/\d+)?\s+(\d+(?:\.\d+)*)/i.exec(raw);
  if (win) return { os: `Windows ${win[1]}`, platform: "win" };
  if (/^\s*Windows/i.test(raw)) return { os: "Windows", platform: "win" };
  return null;
}

export function parseHost(snapshot) {
  const host = snapshot && snapshot.host;
  if (!host || typeof host !== "object") return { ...UNKNOWN };
  const v = parseVersion(host.ae_version);
  const o = parseOs(host.os);
  if (!v && !o) return { ...UNKNOWN };
  return {
    known: true,
    version: v ? v.version : null,
    build: v ? v.build : null,
    os: o ? o.os : null,
    platform: o ? o.platform : null,
    // Unknown until quickstart › 2 settles whether app.version marks a beta build (FR-030).
    beta: null,
  };
}

// True when the host's AE is at least `min` ("25.4"), compared as numbers. False when unknown.
export function atLeast(host, min) {
  if (!host || !host.known || !host.version) return false;
  const [a, b] = host.version.split(".").map(Number);
  const [x, y = 0] = String(min).split(".").map(Number);
  return a > x || (a === x && b >= y);
}
