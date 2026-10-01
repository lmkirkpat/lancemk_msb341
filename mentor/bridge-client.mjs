// The mentor's only way into After Effects. Adapted from upstream server/server.mjs (bridge()),
// but it can only send the fixed snippets in mentor/jsx/, never arbitrary code (FR-013).

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { BRIDGE_CONFIG, JSX_DIR } from "./paths.mjs";
import { CODES, MentorError } from "./errors.mjs";

// JSON literals are valid ExtendScript once U+2028/2029 are escaped (from upstream tools.mjs).
const LINE_SEPARATORS = new RegExp("[" + String.fromCharCode(0x2028, 0x2029) + "]", "g");
export const lit = (v) =>
  JSON.stringify(v === undefined ? null : v).replace(LINE_SEPARATORS, (c) => "\\u" + c.charCodeAt(0).toString(16));

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(BRIDGE_CONFIG, "utf8"));
  } catch {
    throw new MentorError("AE_UNREACHABLE");
  }
}

// node:http rather than fetch: fetch gives up on any response slower than 300 s (upstream note).
function bridge(method, route, body, timeoutMs) {
  const cfg = readConfig();
  const payload = body ? JSON.stringify(body) : null;
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1", port: cfg.port, path: route, method,
        headers: {
          Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let text = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (text += c));
        res.on("end", () => {
          clearTimeout(timer);
          if (res.statusCode === 401) return reject(new MentorError("AE_UNREACHABLE"));
          if (res.statusCode !== 200) return reject(new Error(`Bridge error ${res.statusCode}: ${text}`));
          try { resolve(JSON.parse(text)); } catch { reject(new Error(`Unreadable bridge reply: ${text.slice(0, 300)}`)); }
        });
      },
    );
    const timer = setTimeout(() => {
      req.destroy();
      reject(new MentorError("AE_BUSY"));
    }, timeoutMs);
    req.on("error", (e) => {
      clearTimeout(timer);
      if (e.code === "ECONNREFUSED" || e.code === "ECONNRESET") reject(new MentorError("AE_UNREACHABLE"));
      else reject(new Error(`Bridge connection failed: ${e.message}`));
    });
    if (payload) req.write(payload);
    req.end();
  });
}

export const health = () => bridge("GET", "/health", null, 5000);

// Every snippet gets the shared ES3 libraries (mentor/jsx/lib/*.jsx) and its arguments as ARGS.
function libSource() {
  const dir = path.join(JSX_DIR, "lib");
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".jsx")).sort() : [];
  return files.map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join("\n");
}

// Libraries + ARGS + the script at `file`. Also used by mentor/dev/assemble.mjs for dev scripts.
export function buildSource(file, args) {
  const prefix = `${libSource()}\nvar ARGS = ${lit(args ?? {})};\n`;
  return { code: prefix + fs.readFileSync(file, "utf8"), prefixLines: prefix.split("\n").length - 1 };
}

export function assemble(name, args) {
  if (!/^[\w-]+$/.test(name)) throw new Error(`Bad snippet name: ${name}`);
  return buildSource(path.join(JSX_DIR, `${name}.jsx`), args);
}

// bridge.jsx reports errors as "<Error name>: <message>". Snippets throw "CODE: message" for the
// contract's codes, so strip the name, then look for a known code.
const CODED = new RegExp(`^(?:[A-Za-z]*Error: )?(${CODES.join("|")}): ?(.*)$`, "s");

export function toError(r, name, prefixLines) {
  const m = CODED.exec(r.error || "");
  if (m) return new MentorError(m[1], m[2] || undefined);
  const line = r.line != null ? ` (${name}.jsx line ${r.line - prefixLines})` : "";
  const logs = r.logs && r.logs.length ? `\nlog:\n${r.logs.join("\n")}` : "";
  return new Error(`After Effects script error${line}: ${r.error}${logs}`);
}

// Runs mentor/jsx/<name>.jsx. Pass undo: true only for snippets that change the project, so the
// learner gets exactly one undo step per change.
export async function runSnippet(name, args, { undo = false, timeoutMs = 30000 } = {}) {
  const { code, prefixLines } = assemble(name, args);
  const r = await bridge("POST", "/run", { code, undo: undo ? `AE Mentor: ${name}` : "", label: name }, timeoutMs);
  if (!r.ok) throw toError(r, name, prefixLines);
  return r.result;
}
