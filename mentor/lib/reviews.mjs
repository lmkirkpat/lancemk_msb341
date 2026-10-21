// What a review needs from the record (spec 004 FR-018 to FR-021, research R5). Pure: callers read
// the record.

const refKey = (t) => `${t.layer}\u0000${t.property}`;

// {layer, property} pairs, de-duplicated, in first-seen order.
export function uniqueRefs(refs) {
  const seen = new Set();
  const out = [];
  for (const t of refs || []) {
    if (!t || typeof t.layer !== "string" || typeof t.property !== "string") continue;
    const k = refKey(t);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ layer: t.layer, property: t.property });
  }
  return out;
}

// Past targets for a skill on one project and comp (data-model › Lesson entry › Past targets).
export function pastTargetsIn(record, skill, project, comp) {
  if (!record || !Array.isArray(record.lessons)) return [];
  return uniqueRefs(
    record.lessons
      .filter((l) => l && l.skill === skill && l.project === project && l.comp === comp && Array.isArray(l.targets))
      .flatMap((l) => l.targets),
  );
}
