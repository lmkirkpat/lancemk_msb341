// The panel's table of built skills (spec 007 T042, PN-16, plan P1): commands, tool names and the
// display fields per skill, joined with path.json and the generated skills-built.json. Pure apart
// from reading those two files. The panel never decides what is built: the data file does.
"use strict";

const nodeFs = require("fs");
const path = require("path");
const { COPY } = require("./copy.js");

const row = (id, command, snapshot, demo, check, slot, no_focus) => ({ id, command, skill: command.slice(1), snapshot, demo, check, slot, no_focus });
const S = COPY.check;
const L = COPY.lesson;
const TABLE = Object.freeze([
  row("easing.basic", "/ease-mentor", "snapshot_project", "set_ease", "diff_since_last", null, null),
  row("keyframes.types", "/key-types-mentor", "key_types_snapshot", "key_types_demo", "key_types_check", S.slot_key_types, L.no_focus),
  row("easing.speed_graph", "/speed-graph-mentor", "speed_graph_snapshot", "speed_graph_demo", "speed_graph_check", null, null),
  row("timing.offset", "/offset-mentor", "offset_snapshot", "offset_demo", "offset_check", null, null),
  row("transform.anchor", "/anchor-mentor", "anchor_snapshot", "anchor_demo", "anchor_check", S.slot_pivot, L.no_focus),
  row("parenting.null", "/null-parenting-mentor", "null_parent_snapshot", "null_parent_demo", "null_parent_check", S.slot_null, L.no_group),
]);
const EASING = TABLE[0];

const skillById = (id) => TABLE.find((s) => s.id === id) || null;
const skillOfCommand = (command) => TABLE.find((s) => s.command === command) || null;
// tool → skill: which skill a tool result belongs to. Shared tools (a frame, the record) have none.
function skillIdForTool(tool) {
  const s = TABLE.find((t) => t.snapshot === tool || t.demo === tool || t.check === tool);
  return s ? s.id : null;
}

// → skills-built.json's { skills: { id: { review } } }, or null when it can't be read.
function readSkillsBuilt(opts) {
  const fs = (opts && opts.fs) || nodeFs;
  try {
    const data = JSON.parse(fs.readFileSync(path.join(opts.repoPath, "mentor", "curriculum", "skills-built.json"), "utf8"));
    return data && data.skills && typeof data.skills === "object" ? data : null;
  } catch (e) {
    return null;
  }
}

// Built skills in path order, each a table row plus name, hard and review. With no data file only the
// path's first skill counts as built (plan P2), and `log` hears about it once from the caller.
function builtSkills(pathData, data) {
  const list = pathData && Array.isArray(pathData.skills) ? pathData.skills : [];
  const has = (id) => (data ? Object.prototype.hasOwnProperty.call(data.skills, id) : !!list[0] && list[0].id === id);
  return list.filter((s) => has(s.id) && skillById(s.id)).map((s) => Object.assign({}, skillById(s.id), {
    name: s.name, hard: s.hard || [], review: !!data && !!data.skills[s.id] && data.skills[s.id].review === true,
  }));
}

module.exports = { TABLE, EASING, skillById, skillOfCommand, skillIdForTool, readSkillsBuilt, builtSkills };
