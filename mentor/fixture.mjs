// Fixture mode (FR-014, contracts/mentor-tools.md › Fixture mode): when AE_MENTOR_FIXTURE_STATE is
// set, runSnippet comes here instead of After Effects. Evals and tests use it to run the real
// server and skill with no AE open.
//
// The state file says which saved snapshot is "the project" right now, and the eval runner
// rewrites it between turns. Demonstrations are kept in MENTOR_HOME/fixture-edits.json and
// applied to every snapshot of the same comp, so a demo survives the server restarting between
// headless turns, as it would in a real project. Fixture files are never written.

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { MENTOR_HOME, MENTOR_ROOT } from "./paths.mjs";
import { MentorError } from "./errors.mjs";

export const FIXTURE_STATE = process.env.AE_MENTOR_FIXTURE_STATE || null;
const EDITS_FILE = path.join(MENTOR_HOME, "fixture-edits.json");

// A 1×1 transparent PNG.
const PLACEHOLDER_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

function readState() {
  try {
    return JSON.parse(fs.readFileSync(FIXTURE_STATE, "utf8"));
  } catch {
    throw new MentorError("AE_UNREACHABLE");
  }
}

// The named fixture, or AE_UNREACHABLE for "unreachable" or a missing state file. Paths are
// relative to the state file.
function loadProject() {
  const state = readState();
  if (!state.project || state.project === "unreachable") throw new MentorError("AE_UNREACHABLE");
  const file = path.resolve(path.dirname(FIXTURE_STATE), state.project);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readEdits() {
  try {
    return JSON.parse(fs.readFileSync(EDITS_FILE, "utf8"));
  } catch {
    return [];
  }
}

function findProp(snapshot, { layer_index, property_path }) {
  const layer = snapshot.layers.find((l) => l.index === layer_index);
  const prop = layer && layer.properties.find((p) => p.path === property_path);
  if (!prop) throw new Error(`Fixture has no property ${layer_index}/${property_path}`);
  return { layer, prop };
}

// What set-ease.jsx does in AE: Easy Ease (33.33% influence) on the pair's inner sides only,
// leaving the other side of each key as it was.
function applyEase(snapshot, edit) {
  const { layer, prop } = findProp(snapshot, edit);
  const from = prop.keys[edit.key_index - 1];
  const to = prop.keys[edit.key_index];
  if (!from || !to) throw new Error(`Fixture has no key pair ${edit.key_index} on ${prop.display_path}`);
  const easy = (list) => list.map(() => ({ speed: 0, influence: 33.33 }));
  from.out_type = "bezier";
  from.out_ease = easy(from.out_ease);
  to.in_type = "bezier";
  to.in_ease = easy(to.in_ease);
  return { layer, prop, from, to };
}

function saveEdit(edit) {
  const edits = readEdits();
  edits.push(edit);
  fs.writeFileSync(EDITS_FILE, JSON.stringify(edits, null, 2) + "\n");
}

// A skill's fixture twin, mentor/fixture/<snippet>.mjs (spec 004 research R9, contracts/skill-module.md
// › 5). AE_MENTOR_FIXTURE_TWINS points tests at another folder.
const twinsDir = () => process.env.AE_MENTOR_FIXTURE_TWINS || path.join(MENTOR_ROOT, "fixture");
async function loadTwin(name) {
  const file = /^[\w-]+$/.test(name) ? path.join(twinsDir(), `${name}.mjs`) : null;
  if (!file || !fs.existsSync(file)) return null;
  const twin = await import(pathToFileURL(file).href);
  if (typeof twin.run !== "function" || typeof twin.apply !== "function") {
    throw new Error(`Fixture twin ${name}.mjs must export run(args, ctx) and apply(snapshot, edit)`);
  }
  return twin;
}

// Every saved edit for this comp, each replayed by its own snippet's twin. An edit with no snippet
// is from before twins existed, and is an ease.
async function applyEdits(project) {
  for (const edit of readEdits()) {
    if (edit.comp_id !== project.comp.id) continue;
    if (!edit.snippet || edit.snippet === "set-ease") {
      applyEase(project, edit);
      continue;
    }
    const twin = await loadTwin(edit.snippet);
    if (!twin) throw new Error(`Fixture mode has no twin for the saved ${edit.snippet} edit`);
    twin.apply(project, edit);
  }
  return project;
}

// A state with "undo_demo": true is the learner's Edit > Undo of the demo: the demo edit is left
// out of this snapshot (usage notes, panel session 1).
async function snapshot() {
  const project = loadProject();
  if (readState().undo_demo) return project;
  return applyEdits(project);
}

function setEase(args) {
  const project = loadProject();
  if (project.comp.id !== args.comp_id) throw new MentorError("NO_ACTIVE_COMP");
  const { layer, prop, from, to } = applyEase(project, args);
  saveEdit({ snippet: "set-ease", comp_id: args.comp_id, layer_index: args.layer_index, property_path: args.property_path, key_index: args.key_index });
  return {
    layer: layer.name,
    display_name: prop.display_name,
    display_path: prop.display_path,
    from_time: from.time,
    to_time: to.time,
    dimensions: to.in_ease.length,
    out_influence: from.out_ease.map((e) => e.influence),
    in_influence: to.in_ease.map((e) => e.influence),
  };
}

// A real frame of Mentor Practice (frame.png next to the snapshot fixtures, rendered at 0.5 s in
// panel session 1) when there is one, else the placeholder. It returns exactly what the real
// snippet returns, with no "fixture" flag: in eval case 21 the mentor spotted that flag and the
// placeholder and wrote a note to the tester instead of teaching (usage notes, 2026-10-06).
function previewFrame(args) {
  const project = loadProject();
  const real = path.join(path.dirname(path.resolve(path.dirname(FIXTURE_STATE), readState().project)), "frame.png");
  fs.writeFileSync(args.file, fs.existsSync(real) ? fs.readFileSync(real) : PLACEHOLDER_PNG);
  return { comp: project.comp.name, time: args.time ?? 0 };
}

const SNIPPETS = { snapshot, "set-ease": setEase, "preview-frame": previewFrame };

// Built-in snippets first; any other name is a skill's twin, given the current snapshot (with every
// saved edit applied) and a saveEdit that records { snippet, comp_id, ...edit }.
export async function runFixtureSnippet(name, args) {
  if (Object.hasOwn(SNIPPETS, name)) return SNIPPETS[name](args);
  const twin = await loadTwin(name);
  if (!twin) throw new Error(`Fixture mode has no snippet named ${name}`);
  const current = await snapshot();
  return twin.run(args, {
    snapshot: current,
    saveEdit: (edit) => saveEdit({ snippet: name, comp_id: current.comp.id, ...edit }),
  });
}
