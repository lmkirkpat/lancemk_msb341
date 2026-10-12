// Reading the mentor's own JSON files (session.json, learner.json). A missing file is empty. A
// file that's there but can't be read as the right shape is set aside unchanged, next to the
// original, and reported with `code`. It's never read as empty and then written over (usage notes,
// mentor-panel › To fix later: an unreadable learner.json was overwritten).

import fs from "node:fs";
import { MentorError } from "../errors.mjs";

export function readJson(file, { empty, valid, code }) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch (e) {
    if (e.code === "ENOENT") return empty();
    throw e;
  }
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    value = undefined;
  }
  if (value !== undefined && valid(value)) return value;
  const aside = `${file}.unreadable-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  try {
    fs.renameSync(file, aside);
  } catch {
    // Another call already moved it; the next read starts fresh either way.
  }
  throw new MentorError(code);
}
