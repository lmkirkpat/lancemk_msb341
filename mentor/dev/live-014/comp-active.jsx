// Spec 014 T001 (research R10): is a comp active? Read-only; run through ae_run_script.
// Returns whether app.project.activeItem is a CompItem, its name and time, and what else is active.
var out = { at: (new Date()).toString() };
try {
  if (!app.project) { out.project = false; return out; }
  out.project = app.project.file ? app.project.file.name : "(unsaved)";
  var it = app.project.activeItem;
  out.comp_active = (it !== null && it instanceof CompItem);
  out.active_type = it === null ? null : (it instanceof CompItem ? "comp" : (it instanceof FootageItem ? "footage" : (it instanceof FolderItem ? "folder" : "other")));
  out.active_name = it === null ? null : it.name;
  if (out.comp_active) { out.time = it.time; }
  var sel = app.project.selection; out.project_selection = [];
  for (var i = 0; i < sel.length; i++) { out.project_selection.push(sel[i].name); }
  out.render_queue_items = app.project.renderQueue.numItems;
  out.rendering = app.project.renderQueue.rendering;
} catch (e) { out.error = String(e); }
return out;
