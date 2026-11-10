// Puts the payload in place (contracts/install-layout.md steps 5 to 7; FR-009, FR-012, FR-013).
// Each step leaves either the previous state or one a re-run completes: everything is copied into
// Knack/tmp first and verified, then moved in by rename. The learner home is only created when
// missing; nothing in it is touched except panel.json.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { EXTENSIONS, tilde } from "./layout.mjs";
import { writePanelConfig } from "./panel-config.mjs";
import { readJson } from "./preflight.mjs";

export const STEPS = Object.freeze(["clean", "stage", "place_version", "developer_links", "extensions", "current", "learner_home", "panel_config", "state"]);

function listFiles(dir) {
  const out = [];
  const walk = (d, rel) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === ".DS_Store") continue;
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(path.join(d, e.name), r);
      else out.push(r);
    }
  };
  walk(dir, "");
  return out.sort();
}

const hash = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");

// Every file in src is in dest with the same bytes.
export function sameTree(src, dest) {
  const a = listFiles(src);
  let b;
  try {
    b = new Set(listFiles(dest));
  } catch {
    return false;
  }
  return a.every((r) => b.has(r) && hash(path.join(src, r)) === hash(path.join(dest, r)));
}

export class InstallError extends Error {}

// A free name in `dir` for `name`: name, then name-2, name-3 and so on (nothing is ever overwritten).
function freeName(dir, name) {
  const taken = (n) => {
    try {
      fs.lstatSync(path.join(dir, n));
      return true;
    } catch {
      return false;
    }
  };
  let n = name;
  for (let i = 2; taken(n); i++) n = `${name}-${i}`;
  return path.join(dir, n);
}

// FR-024 (T037): a developer install's links move to Knack/developer-links, still pointing at the
// repo; they're never deleted or followed, and the repo is never touched. The old panel.json is
// copied there first (0600), once, so the developer can put both back. PlayerDebugMode is left as
// it is. → true if any link moved.
export function moveDeveloperLinks(L, g) {
  const links = EXTENSIONS.map((n) => path.join(L.cep, n)).filter((p) => {
    try {
      return fs.lstatSync(p).isSymbolicLink();
    } catch {
      return false;
    }
  });
  if (!links.length) return false;
  g.mkdir(L.devLinks);
  const savedConfig = path.join(L.devLinks, "panel.json");
  if (fs.existsSync(L.panelJson) && !fs.existsSync(savedConfig)) {
    g.copyFile(L.panelJson, savedConfig);
    g.chmod(savedConfig, 0o600);
  }
  for (const p of links) g.rename(p, freeName(L.devLinks, path.basename(p)));
  return true;
}

// opts: { L, g (fsx guard), payloadDir, nodeDir, release, replaceDev, afterStep(name) }
// → { learnerCreated, files }
export function installPayload({ L, g, payloadDir, nodeDir, release, replaceDev = false, afterStep = () => {} }) {
  const v = release.version;
  const staged = path.join(L.tmp, `version-${v}`);
  const target = path.join(L.versions, v);
  let learnerCreated = false;
  const step = (name, fn) => {
    fn();
    afterStep(name);
  };

  step("clean", () => {
    g.rm(L.tmp);
    g.mkdir(L.tmp);
    g.mkdir(L.versions);
  });

  step("stage", () => {
    g.copyTree(path.join(payloadDir, "version"), staged);
    const nodeTo = path.join(staged, "runtime", "node");
    g.mkdir(path.join(nodeTo, "bin"));
    g.copyFile(path.join(nodeDir, "bin", "node"), path.join(nodeTo, "bin", "node"));
    g.chmod(path.join(nodeTo, "bin", "node"), 0o755);
    if (fs.existsSync(path.join(nodeDir, "LICENSE"))) g.copyFile(path.join(nodeDir, "LICENSE"), path.join(nodeTo, "LICENSE"));
    if (!sameTree(path.join(payloadDir, "version"), staged) || !sameTree(nodeDir, nodeTo)) {
      throw new InstallError("The copied files don't match the installer's.");
    }
  });

  step("place_version", () => {
    if (fs.existsSync(target)) {
      const old = path.join(L.tmp, `old-version-${v}`);
      g.rename(target, old);
    }
    g.rename(staged, target);
  });

  step("developer_links", () => {
    if (replaceDev) moveDeveloperLinks(L, g);
  });

  step("extensions", () => {
    for (const name of EXTENSIONS) placeExtension({ L, g, payloadDir, name, work: L.tmp });
  });

  step("current", () => {
    const link = path.join(L.tmp, "current-new");
    g.rm(link);
    g.symlink(path.join("versions", v), link);
    let st = null;
    try {
      st = fs.lstatSync(L.current);
    } catch {}
    if (st && !st.isSymbolicLink()) throw new InstallError("Something unexpected is where Knack's current version goes.");
    g.rename(link, L.current);
  });

  step("learner_home", () => {
    if (!fs.existsSync(L.learner)) {
      g.mkdir(L.learner);
      learnerCreated = true;
    }
  });

  step("panel_config", () => writePanelConfig(L, g));

  const files = [];
  step("state", () => {
    const prev = readJson(L.state) || {};
    const prevFiles = Array.isArray(prev.files) ? prev.files : [];
    const add = [L.knack, ...EXTENSIONS.map((n) => path.join(L.cep, n)), L.panelJson];
    if (learnerCreated) add.push(L.learner);
    for (const f of [...prevFiles, ...add.map((p) => tilde(L, p))]) if (f && !files.includes(f)) files.push(f);
    const state = {
      version: v,
      files,
      keychain: prev.keychain && typeof prev.keychain === "object" ? prev.keychain : null,
      settings_changed: [],
    };
    // Kept developer links, so uninstall (T054) can put them back rather than remove them.
    if (fs.existsSync(L.devLinks)) state.developer_links = tilde(L, L.devLinks);
    g.writeAtomic(L.state, JSON.stringify(state, null, 2) + "\n");
  });

  g.rm(L.tmp);
  return { learnerCreated, files };
}

// One extension from the payload into CEP's folder: copied to `work` (inside Knack's own folder),
// verified, then swapped in by rename, the old one moved into `work`. A link in the way (a developer
// install) is refused, never followed. Used by the install and by Fix (T025).
export function placeExtension({ L, g, payloadDir, name, work }) {
  g.mkdir(L.cep);
  g.mkdir(work);
  const src = path.join(payloadDir, "cep", name);
  const fresh = path.join(work, `ext-${name}`);
  g.rm(fresh);
  g.copyTree(src, fresh);
  if (!sameTree(src, fresh) || !fs.existsSync(path.join(fresh, "META-INF", "signatures.xml"))) {
    throw new InstallError("The copied extension doesn't match the installer's.");
  }
  const dest = path.join(L.cep, name);
  let st = null;
  try {
    st = fs.lstatSync(dest);
  } catch {}
  if (st && st.isSymbolicLink()) throw new InstallError("A development copy is in the way.");
  if (!st) return g.rename(fresh, dest);
  const old = path.join(work, `old-ext-${name}`);
  g.rm(old);
  g.rename(dest, old);
  try {
    g.rename(fresh, dest);
  } catch (e) {
    // Put the old extension back, so a failed swap never leaves CEP's folder without it.
    try {
      if (!fs.existsSync(dest)) g.rename(old, dest);
    } catch {}
    throw e;
  }
}

// Records that the Keychain item is Knack's, for uninstall.
export function recordKeychain(L, g, item) {
  const state = readJson(L.state);
  if (!state) return;
  state.keychain = { service: item.service, account: item.account };
  g.writeAtomic(L.state, JSON.stringify(state, null, 2) + "\n");
}
