// The curriculum path as data (spec 004 FR-001, research R6): mentor/curriculum/path.json, read once.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "curriculum", "path.json");
let cached = null;

export function readPath() {
  if (!cached) cached = JSON.parse(fs.readFileSync(FILE, "utf8"));
  return cached;
}

// The plain name the mentor says (FR-008), or null for an ID the path doesn't have.
export function skillName(id) {
  const p = readPath();
  if (id === p.on_ramp.id) return p.on_ramp.name;
  const s = p.skills.find((x) => x.id === id);
  return s ? s.name : null;
}

// Spec 014 FR-021: the short name a step tag and Go deeper use (MU › Short skill tags), or the full
// name for a skill without one, or null for an ID the path doesn't have. Lesson headers and the
// Skills tab keep the full name.
export function shortName(id) {
  const s = readPath().skills.find((x) => x.id === id);
  if (s) return typeof s.short_name === "string" && s.short_name ? s.short_name : s.name;
  return skillName(id);
}

export const pathOrder = () => [...readPath().skills].sort((a, b) => a.position - b.position).map((s) => s.id);

// Built means a tool file declares the ID (FR-003): `skills` is every declared ID.
export const isBuilt = (id, skills) => skills.includes(id);
