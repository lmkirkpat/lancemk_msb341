// A sample fixture twin (contracts/skill-module.md › 5, tasks T018): what a skill's demo snippet
// "sample-snippet" would do in fixture mode. The change is a no-op for the comp: it only leaves a
// note on the snapshot, so a test can see the edit was recorded and replayed. Self-contained (no
// imports), so it can be copied into any twin folder.

export function run(args, { snapshot, saveEdit }) {
  saveEdit({ note: args.note ?? null });
  return { comp: snapshot.comp.name, layers: snapshot.layers.length, notes_before: snapshot.sample_notes || [] };
}

export function apply(snapshot, edit) {
  snapshot.sample_notes = [...(snapshot.sample_notes || []), edit.note];
}
