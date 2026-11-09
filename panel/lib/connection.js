// The After Effects connection (spec 007 FR-002, FR-057, FR-091, plan P6, research R9). Reads the
// bridge's port and token from bridge.json and calls GET /health, which returns no project data.
// bridge-status.js flattens every failure to null, which can't tell busy from gone; this keeps them
// apart and returns the start time, so only a start time that answers and differs ends a saved
// lesson (FR-028). A read never rejects.
"use strict";

const nodeFs = require("fs");
const nodeHttp = require("http");
const { BRIDGE_FILE } = require("./bridge-status.js");

const CONNECTED = "connected";
const NOT_CONNECTED = "not_connected";
const BUSY = "busy";
const TIMEOUT_MS = 2000;
const POLL_MS = 5000;

// → Promise of { state, started }. An answer is connected, nothing listening is not connected, and
// no answer within 2 s is busy.
function readConnection(opts) {
  const fs = (opts && opts.fs) || nodeFs;
  const http = (opts && opts.http) || nodeHttp;
  const file = (opts && opts.file) || BRIDGE_FILE;
  return new Promise((resolve) => {
    let done = false;
    const finish = (state, started) => {
      if (!done) { done = true; resolve({ state, started: started || null }); }
    };
    let cfg;
    try {
      cfg = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (e) {
      return finish(NOT_CONNECTED);
    }
    if (!cfg || !cfg.port || !cfg.token) return finish(NOT_CONNECTED);
    try {
      const req = http.get(
        { host: "127.0.0.1", port: cfg.port, path: "/health", headers: { Authorization: `Bearer ${cfg.token}` }, timeout: TIMEOUT_MS },
        (res) => {
          let text = "";
          res.on("data", (c) => (text += c));
          res.on("end", () => {
            try {
              const h = JSON.parse(text);
              if (h && h.ok === true) finish(CONNECTED, typeof h.started === "string" ? h.started : null);
              else finish(NOT_CONNECTED);
            } catch (e) {
              finish(NOT_CONNECTED);
            }
          });
          res.on("error", () => finish(NOT_CONNECTED));
        }
      );
      req.on("timeout", () => { req.destroy(); finish(BUSY); });
      req.on("error", () => finish(NOT_CONNECTED));
    } catch (e) {
      finish(NOT_CONNECTED);
    }
  });
}

// A failed mentor tool can also say where After Effects stands (FR-091). → a state, or null.
function connectionFromTool(ev) {
  if (!ev || ev.ok || typeof ev.text !== "string") return null;
  if (/AE_BUSY/.test(ev.text)) return BUSY;
  if (/AE_UNREACHABLE/.test(ev.text)) return NOT_CONNECTED;
  return null;
}

// Polls while the panel is visible, and on Try again (now). onChange gets a reading only when it
// differs from the last one. A read still running is never doubled up.
function createPoller({ read, onChange, timers, intervalMs }) {
  // Wrapped: Chromium's timers throw "Illegal invocation" when called as a method of a plain object.
  const t = timers || { setInterval: (f, ms) => setInterval(f, ms), clearInterval: (h) => clearInterval(h) };
  let handle = null;
  let last = null;
  let running = null;

  function now() {
    if (running) return running;
    running = Promise.resolve(read()).then((v) => {
      running = null;
      const changed = !last || last.state !== v.state || last.started !== v.started;
      last = v;
      if (changed) onChange(v);
      return v;
    });
    return running;
  }

  function setVisible(visible) {
    if (visible && handle === null) {
      handle = t.setInterval(now, intervalMs || POLL_MS);
      now();
    } else if (!visible && handle !== null) {
      t.clearInterval(handle);
      handle = null;
    }
  }

  return { now, setVisible, current: () => last };
}

module.exports = { readConnection, connectionFromTool, createPoller, POLL_MS, CONNECTED, NOT_CONNECTED, BUSY };
