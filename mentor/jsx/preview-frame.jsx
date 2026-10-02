// Renders one frame of the active comp to a PNG, adapted from upstream ae_preview_frame. ES3
// function body. ARGS = { file, time } (time in seconds, or null for the current time indicator).
// saveFrameToPng finishes writing after it returns; mentor/tools.mjs waits for a stable file size.

var comp = app.project.activeItem;
if (!(comp && comp instanceof CompItem)) throw new Error("NO_ACTIVE_COMP: Open a composition first.");
var t = (ARGS.time === null || ARGS.time === undefined) ? comp.time : ARGS.time;
if (t < 0 || t > comp.duration) throw new Error("Time " + t + " s is outside the comp (0 to " + comp.duration + " s).");
if (typeof comp.saveFrameToPng !== "function") throw new Error("This version of After Effects has no saveFrameToPng.");
comp.saveFrameToPng(t, new File(ARGS.file));
return { comp: comp.name, time: Math.round(t * 1000) / 1000 };
