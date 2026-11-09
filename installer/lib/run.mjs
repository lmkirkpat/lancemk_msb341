// Runs one program and collects its output (no shell, so nothing is ever parsed or expanded).
// Anything secret goes in `input` (stdin), never in `args` or `env`. Every caller passes `env`
// explicitly; the installer's default is the fixed system PATH and nothing else.

import { spawn } from "node:child_process";

export const SYSTEM_PATH = "/usr/bin:/bin:/usr/sbin:/sbin";

// → Promise<{ code, stdout, stderr, timedOut }>. Never rejects: a program that can't start gives
// code -1. opts: { cwd, env, input, timeoutMs, maxBytes }
export function run(cmd, args = [], opts = {}) {
  return new Promise((resolve) => {
    let child;
    const env = opts.env || { PATH: SYSTEM_PATH };
    try {
      child = spawn(cmd, args, { cwd: opts.cwd, env, stdio: ["pipe", "pipe", "pipe"] });
    } catch {
      return resolve({ code: -1, stdout: "", stderr: "", timedOut: false });
    }
    const max = opts.maxBytes || 8 * 1024 * 1024;
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let done = false;
    const finish = (code) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve({ code, stdout, stderr, timedOut });
    };
    child.stdout.on("data", (d) => {
      if (stdout.length < max) stdout += d;
    });
    child.stderr.on("data", (d) => {
      if (stderr.length < max) stderr += d;
    });
    child.on("error", () => finish(-1));
    child.on("close", (code) => finish(code === null ? -1 : code));
    const timer = opts.timeoutMs
      ? setTimeout(() => {
          timedOut = true;
          try {
            child.kill("SIGKILL");
          } catch {}
        }, opts.timeoutMs)
      : null;
    child.stdin.on("error", () => {});
    if (opts.input !== undefined) child.stdin.end(opts.input);
    else child.stdin.end();
  });
}
