// The access key (specs/006-installer T012, FR-004, research R7; spec 013's Keychain item). The
// key is checked through the payload's own helper (`key_check`, which needs no install) and stored
// with `security -i`, both over stdin. It never goes in an argument list, an environment, a file
// or a log, and nothing here prints it.

import { spawn } from "node:child_process";
import path from "node:path";
import { run as defaultRun, SYSTEM_PATH } from "./run.mjs";
import { TOOLS } from "./ae.mjs";

export const KEY_ITEM = Object.freeze({ service: "Knack", account: "anthropic-api-key" });
export const STATUSES = Object.freeze(["works", "rejected", "out_of_credit", "offline", "no_key"]);
const KEY_SHAPE = /^[A-Za-z0-9_-]{20,400}$/;

// Pasted text → the key, or null when it can't be one. The shape check also keeps the text from
// ever being read as a second command by `security -i`.
export function normalizeKey(raw) {
  const k = String(raw || "").trim();
  return KEY_SHAPE.test(k) ? k : null;
}

// A key that works, or works but needs credit, is stored. An offline check stores nothing
// (contracts/install-layout.md step 8); the setup check reports the key as not yet checked.
export const shouldStore = (status) => status === "works" || status === "out_of_credit";

// Runs the helper's key_check with the key on stdin (contracts/helper-protocol.md).
// opts: { key, nodePath, helperPath, home, timeoutMs } → one of STATUSES, or "unknown" when the
// helper couldn't answer (it didn't start, replied with an error, or took too long).
export function checkKey({ key, nodePath, helperPath, home, timeoutMs = 20000 }) {
  return new Promise((resolve) => {
    let child;
    let done = false;
    let buf = "";
    const finish = (status) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try {
        child.stdin.end();
      } catch {}
      setTimeout(() => {
        try {
          child.kill("SIGKILL");
        } catch {}
      }, 2000).unref();
      resolve(status);
    };
    try {
      child = spawn(nodePath, [helperPath], {
        cwd: path.dirname(helperPath),
        env: { PATH: SYSTEM_PATH, HOME: home },
        stdio: ["pipe", "pipe", "ignore"],
      });
    } catch {
      return resolve("unknown");
    }
    const timer = setTimeout(() => finish("unknown"), timeoutMs);
    child.on("error", () => finish("unknown"));
    child.on("close", () => finish("unknown"));
    child.stdin.on("error", () => {});
    child.stdout.on("data", (d) => {
      buf += d;
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i);
        buf = buf.slice(i + 1);
        let ev;
        try {
          ev = JSON.parse(line);
        } catch {
          continue;
        }
        if (ev && ev.type === "key_status") return finish(STATUSES.includes(ev.status) ? ev.status : "unknown");
        if (ev && ev.type === "error") return finish("unknown");
      }
    });
    const cmd = { type: "key_check" };
    if (key) cmd.key = key;
    child.stdin.write(JSON.stringify(cmd) + "\n");
  });
}

// → true when the item is in the login Keychain afterwards.
export async function storeKey({ key, run = defaultRun, tools = TOOLS }) {
  const k = normalizeKey(key);
  if (!k) return false;
  const env = { PATH: SYSTEM_PATH };
  const add = `add-generic-password -U -s ${KEY_ITEM.service} -a ${KEY_ITEM.account} -w ${k}\n`;
  await run(tools.security, ["-i"], { env, input: add, timeoutMs: 15000 });
  return hasKey({ run, tools });
}

// Is the item there? Reads attributes only, never the key.
export async function hasKey({ run = defaultRun, tools = TOOLS } = {}) {
  const r = await run(tools.security, ["find-generic-password", "-s", KEY_ITEM.service, "-a", KEY_ITEM.account], {
    env: { PATH: SYSTEM_PATH },
    timeoutMs: 10000,
  });
  return r.code === 0;
}
