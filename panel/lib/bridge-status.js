// The bridge's start time, the "same AE session" test for continuing a lesson (research R6). Reads
// the bridge's port and token from bridge.json and calls GET /health, which returns no project
// data. It calls nothing else on the bridge (constitution 1.1.0 › II: the panel never touches AE).
"use strict";

const nodeFs = require("fs");
const nodeHttp = require("http");
const os = require("os");
const path = require("path");

const BRIDGE_FILE = path.join(os.homedir(), "Library", "Application Support", "AEMentorBridge", "bridge.json");
const TIMEOUT_MS = 2000;

// → Promise of the bridge's `started` ISO time, or null on any failure. Never rejects.
function bridgeStarted(opts) {
  const fs = (opts && opts.fs) || nodeFs;
  const http = (opts && opts.http) || nodeHttp;
  const file = (opts && opts.file) || BRIDGE_FILE;
  return new Promise((resolve) => {
    let cfg;
    try {
      cfg = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (e) {
      return resolve(null);
    }
    if (!cfg || !cfg.port || !cfg.token) return resolve(null);
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };
    try {
      const req = http.get(
        { host: "127.0.0.1", port: cfg.port, path: "/health", headers: { Authorization: `Bearer ${cfg.token}` }, timeout: TIMEOUT_MS },
        (res) => {
          let text = "";
          res.on("data", (c) => (text += c));
          res.on("end", () => {
            try {
              const h = JSON.parse(text);
              finish(h && h.ok === true && typeof h.started === "string" ? h.started : null);
            } catch (e) {
              finish(null);
            }
          });
          res.on("error", () => finish(null));
        }
      );
      req.on("timeout", () => { req.destroy(); finish(null); });
      req.on("error", () => finish(null));
    } catch (e) {
      finish(null);
    }
  });
}

module.exports = { bridgeStarted, BRIDGE_FILE };
