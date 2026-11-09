// File writes for the installer, each checked to land inside one root folder (the person's
// Application Support). A write anywhere else throws, so "nothing outside the home folder"
// (FR-013, contracts/install-layout.md) holds by construction, not only by test.

import fs from "node:fs";
import path from "node:path";

export class OutsideError extends Error {}

export function guard(root) {
  const base = path.resolve(root);
  const inside = (p) => {
    const r = path.resolve(p);
    if (r !== base && !r.startsWith(base + path.sep)) throw new OutsideError("A write outside the install's own folders was refused.");
    return r;
  };
  const g = {
    root: base,
    inside,
    mkdir: (p) => fs.mkdirSync(inside(p), { recursive: true }),
    rm: (p) => fs.rmSync(inside(p), { recursive: true, force: true }),
    rename: (a, b) => fs.renameSync(inside(a), inside(b)),
    symlink: (target, p) => fs.symlinkSync(target, inside(p)),
    chmod: (p, mode) => fs.chmodSync(inside(p), mode),
    copyFile: (a, b) => fs.copyFileSync(a, inside(b)),
    // Writes beside the file, then renames over it, so a reader never sees half a file.
    writeAtomic: (p, data, mode = 0o644) => {
      const dest = inside(p);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      const tmp = `${dest}.tmp-${process.pid}`;
      fs.writeFileSync(tmp, data, { mode });
      fs.chmodSync(tmp, mode);
      fs.renameSync(tmp, dest);
    },
    // Copies a folder, skipping Finder's .DS_Store. Links are refused: nothing we ship is one.
    copyTree: (src, dest) => {
      inside(dest);
      fs.mkdirSync(dest, { recursive: true });
      for (const e of fs.readdirSync(src, { withFileTypes: true })) {
        if (e.name === ".DS_Store") continue;
        const s = path.join(src, e.name);
        const d = path.join(dest, e.name);
        if (e.isSymbolicLink()) throw new Error("The payload holds a link, which it never should.");
        if (e.isDirectory()) g.copyTree(s, d);
        else {
          fs.copyFileSync(s, inside(d));
          fs.chmodSync(d, fs.statSync(s).mode & 0o777);
        }
      }
    },
  };
  return g;
}
