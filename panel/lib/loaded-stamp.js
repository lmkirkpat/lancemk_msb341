// Panel stamp (spec 006 data-model › Panel stamp, T007): at start-up the panel writes
// panel-loaded.json to the learner home with the manifest's bundle version and the time, so the
// setup check can tell the panel has loaded in AE (contracts/setup-check.md › panel_loads,
// versions_match). Reads only the panel's own manifest; never the record, the project or
// panel.json. Temp file then rename; never throws, so a failed stamp can't stop the panel.
// No CEP API: a UXP panel can call the same function.
"use strict";

const nodeFs = require("fs");
const path = require("path");
const { defaultHome } = require("./config.js");

const FILE = "panel-loaded.json";

// The manifest's ExtensionBundleVersion (the installer stamps the staged copy before signing), or
// null when the manifest can't be read or has none.
function manifestVersion(panelDir, fs) {
  try {
    const xml = (fs || nodeFs).readFileSync(path.join(panelDir, "CSXS", "manifest.xml"), "utf8");
    const m = xml.match(/ExtensionBundleVersion="([^"]+)"/);
    return m ? m[1] : null;
  } catch (e) {
    return null;
  }
}

// opts: { panelDir (required), home, fs, now }. → true when the stamp was written. Doesn't create
// the learner home: the installer does that, and without it there's nothing to set up yet.
function writeLoadedStamp(opts) {
  const fs = opts.fs || nodeFs;
  let tmp = null;
  try {
    const version = manifestVersion(opts.panelDir, fs);
    if (!version) return false;
    const home = opts.home || defaultHome();
    const at = (opts.now ? opts.now() : new Date()).toISOString();
    const file = path.join(home, FILE);
    tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify({ version, at }) + "\n");
    fs.renameSync(tmp, file);
    return true;
  } catch (e) {
    try {
      if (tmp) fs.unlinkSync(tmp);
    } catch (e2) {
      // nothing to clean up
    }
    return false;
  }
}

module.exports = { writeLoadedStamp, manifestVersion, FILE };
