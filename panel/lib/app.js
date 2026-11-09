// The panel's controller (spec 007 T015 to T023): every decision about what the panel shows and
// does, with no DOM and no host app, so all of it runs under `node --test`. main.js only draws
// app.model() and passes clicks in. What to teach comes from the mentor (decisions/005); this only
// keeps track of the screen, and never reads or changes the project.
"use strict";

const { homeView } = require("./home.js");
const { stateOf, listCollapsed } = require("./view-state.js");
const { initialLesson, reduceLesson, showsResuming, DEMO_TOOLS } = require("./lesson.js");
const list = require("./checklist/index.js");
const { treatError, logEntry } = require("./errors.js");
const { REQUESTS, showMeAgain, startRequest, newLessonRequest, warmUpRequest, followOnRequest } = require("./requests.js");
const { skillById, skillOfCommand, builtSkills, EASING } = require("./skills.js");
const { skillsView, skillDetail } = require("./skills-view.js");
const { skillOf } = require("./skill-tools.js");
const { statusFor } = require("./activity.js");
const { connectionFromTool } = require("./connection.js");
const { shortDate } = require("./memory.js");
const { COPY } = require("./copy.js");

const LOADING_AFTER_MS = 300; // FR-008
const AE_LOST = /AE_UNREACHABLE|AE_BUSY/;

const E = COPY.errors;
const VERB = COPY.buttons.pressed;
const PRESS = { check: VERB.check, check_again: VERB.check, hint: VERB.hint, show_me: VERB.show, show_me_again: VERB.show, try_again: VERB.try, continue: VERB.open };
const BUTTONS = { check: "check", check_again: "check", hint: "hint", show_me: "show_me", show_me_again: "show_me_again" };

const lessonOver = (v) => !!v && (v.saved === true || (v.passed && v.saved === false));

// FR-030: what a retry of `kind` really sends, given where the demo stands.
function retryKind(kind, v) {
  if (kind !== "show_me" || !v) return kind;
  if (v.demo_made) return "show_me_again";
  return v.demo_unknown ? "check" : kind;
}

// deps: { cfg, createAdapter, readRecord, pathData, session, appendTurn, bridgeStarted, pollNow,
// forgetPoll, log, onChange, now, setTimeout }. test/app-harness.js builds a fake set.
function createApp(deps) {
  const later = deps.setTimeout || setTimeout;
  const session = deps.session;
  const runtime = deps.cfg.runtime === "a" ? "a" : "b1";
  const now = () => (deps.now ? deps.now() : new Date());

  const state = {
    tab: "home",
    record: { status: "pending", record: null },
    unreadable_why: false,
    unreadable_dismissed: false,
    connection: null,
    reconnecting: false,
    // the saved session (FR-026 to FR-028)
    pending: null,
    saved: null,
    aeclosed: false,
    // the lesson
    adapter: null,
    lesson_open: false,
    lesson_over: false,
    resume_first: false,
    lesson: null,
    session: null,
    messages: [],
    mentorEntry: null,
    committed: "",
    block: "",
    busy: false,
    turn: null,
    last: null,
    start: null,
    picking: null, // "suggesting", then "starting" after Yes (FR-082)
    from_picking: false,
    pick_session: null,
    recommend: null,
    skill_detail: null,
    turnsDone: 0,
    error: null,
    turnError: null,
    aeNoticed: false,
    demoCallSeen: false,
    demoResult: false,
    passedBefore: false,
    sentAt: null,
    list_open: false,
    list_collapsed: null,
    done_unfolded: false,
    focus_tick: 0,
  };

  const changed = () => deps.onChange();
  const reduce = (ev) => { state.lesson = reduceLesson(state.lesson, ev); };

  // ---------- reading ----------

  function loadRecord() {
    return deps.readRecord().then((r) => {
      state.record = r;
      changed();
    });
  }

  function loadSaved() {
    state.pending = session.read();
    settleSaved();
  }

  function settleSaved() {
    const status = session.savedStatus(state.pending, state.connection);
    if (status === "aeclosed") {
      session.clear(); // gone for good; it shows once (FR-028)
      state.pending = null;
      state.saved = null;
      state.aeclosed = true;
    } else {
      state.saved = status === "waiting" ? "waiting" : null;
    }
  }

  function init() {
    later(() => {
      if (state.record.status === "pending") { state.record = { status: "loading", record: null }; changed(); }
    }, LOADING_AFTER_MS);
    loadRecord();
    loadSaved();
    if (deps.skillsBuilt === null && deps.log) deps.log({ kind: "skills_built_unreadable", length: 0 });
    changed();
  }

  function setConnection(c) {
    state.connection = c;
    state.reconnecting = false;
    settleSaved();
    changed();
  }

  function reconnect() {
    if (state.reconnecting) return;
    state.reconnecting = true;
    changed();
    deps.pollNow().then((c) => setConnection(c));
  }

  // ---------- the display log ----------

  function persist() {
    if (!state.session) return;
    state.session.lesson = state.lesson;
    state.session.messages = state.messages.map(({ srcs, ...m }) => m);
    session.write(state.session);
  }

  function push(entry) {
    const m = Object.assign({ frames: [], srcs: [] }, entry);
    state.messages.push(m);
    return m;
  }

  // Ahead of this turn's mentor message, if it has started, so a change or a resuming line sits above it.
  function pushBefore(entry) {
    const m = Object.assign({ frames: [], srcs: [] }, entry);
    const at = state.mentorEntry ? state.messages.indexOf(state.mentorEntry) : state.messages.length;
    state.messages.splice(at < 0 ? state.messages.length : at, 0, m);
  }

  const notice = (title, text) => { push({ role: "notice", title, text }); };

  function mentorEntry() {
    if (!state.mentorEntry) state.mentorEntry = push({ role: "mentor", text: "" });
    return state.mentorEntry;
  }

  function addFrames(images) {
    const entry = mentorEntry();
    for (const im of images) {
      entry.srcs.push(`data:${im.mimeType || "image/png"};base64,${im.data}`);
      const file = session.saveFrame(im);
      if (file) entry.frames.push(file);
    }
  }

  // ---------- adapters ----------

  function newAdapter() {
    const a = deps.createAdapter(deps.cfg);
    state.adapter = a;
    wire(a);
    return a;
  }

  function stopAdapter() {
    const a = state.adapter;
    state.adapter = null;
    if (a) a.stop();
  }

  // Every handler checks it's still the live adapter: a stopped process's late events can't touch a
  // lesson that has moved on (plan P3).
  function wire(a) {
    const live = (fn) => (e) => { if (state.adapter === a) fn(e); };
    a.on("turn_start", live((e) => { state.sentAt = e.at; }));
    a.on("tool_call", live((e) => {
      if (DEMO_TOOLS.has(e.name)) state.demoCallSeen = true;
      if (!state.block && !state.committed) { state.turn = Object.assign({}, state.turn, { status: statusFor(e.name) }); changed(); }
    }));
    a.on("text_delta", live((e) => {
      state.block += e.text;
      state.turn = Object.assign({}, state.turn, { status: null });
      syncMentor();
    }));
    a.on("text", live((e) => {
      state.committed += (state.committed ? "\n\n" : "") + e.text;
      state.block = "";
      syncMentor();
    }));
    a.on("tool_result", live(onToolResult));
    a.on("error", live(onError));
    a.on("turn_end", live(onTurnEnd));
    a.on("exit", live(() => {
      state.adapter = null;
      if (state.lesson_open) endLesson(treatError("process_exited", { runtime }));
      changed();
    }));
  }

  function syncMentor() {
    mentorEntry().text = state.committed + state.block;
    changed();
  }

  function onToolResult(e) {
    if (e.images && e.images.length) addFrames(e.images);
    const conn = connectionFromTool(e);
    if (conn) {
      state.connection = { state: conn, started: state.connection ? state.connection.started : null };
      deps.forgetPoll();
    }
    if (!e.ok && AE_LOST.test(e.text || "") && !state.aeNoticed) {
      state.aeNoticed = true;
      notice(COPY.lesson.ae_lost.title, COPY.lesson.ae_lost.body);
    }
    if (DEMO_TOOLS.has(e.name)) {
      state.demoResult = true;
      const line = e.ok ? list.changeLine(e.name, e.json) : null;
      if (line) pushBefore({ role: "change", text: `${COPY.lesson.changed_in_comp} ${line} ${COPY.lesson.undo}` });
    }
    reduce(Object.assign({}, e, { at: now().toISOString() }));
    if (showsResuming(state.lesson) && !state.messages.some((m) => m.role === "resuming")) pushBefore({ role: "resuming", text: COPY.lesson.picking_up });
    if (list.isCheck(e.name)) state.list_open = false;
    if (e.name === "recommend_next" && e.ok && e.json) state.recommend = e.json;
    if (state.picking === "starting" && list.isSnapshot(e.name)) state.picking = null;
    if (e.name === "record_lesson") {
      if (lessonOver(state.lesson)) {
        state.lesson_over = true;
        state.lesson_open = false;
        if (state.session) state.session.ended = true;
      }
      loadRecord();
    }
    persist();
    changed();
  }

  function onError(e) {
    const firstTurn = state.turnsDone === 0;
    const t = treatError(e.kind, { runtime, firstTurn });
    if (t.treatment === "logged") { deps.log(logEntry(e)); return; }
    state.turnError = t;
    if (state.lesson_over) return; // a question after the pass: onTurnEnd says so, and the pass stands
    if (t.treatment === "blocking") {
      state.error = t;
      if (firstTurn) closeUnstarted(); else changed();
      return;
    }
    if (t.treatment === "ended") { endLesson(t); changed(); return; }
    if (t.treatment === "passing") {
      state.error = t;
      notice(t.title, t.body);
      if (firstTurn) { stopAdapter(); state.lesson_open = false; state.busy = false; state.turn = Object.assign({}, state.turn, { busy: false }); clearSession(); }
      changed();
    }
    // cut_off: the notice and the state wait for turn_end, which knows where the demo stands.
  }

  function clearSession() {
    if (state.session) session.clear();
    state.session = null;
  }

  // A blocking error on the very first turn: nothing opened, so nothing stays open.
  function closeUnstarted() {
    stopAdapter();
    state.lesson = null;
    state.lesson_open = false;
    state.busy = false;
    state.turn = null;
    clearSession();
    state.messages = [];
    state.tab = "home";
    changed();
  }

  // process_exited, or the mentor's process going away (FR-056): the lesson is over and nothing saved.
  function endLesson(t) {
    if (state.lesson_over) { afterPassFailure(t); state.busy = false; state.turn = Object.assign({}, state.turn, { busy: false }); return; }
    reduce({ type: "exited" });
    notice(t.title, t.body);
    state.error = t;
    state.lesson_open = false;
    state.lesson_over = false;
    state.busy = false;
    state.turn = Object.assign({}, state.turn, { busy: false });
    stopAdapter();
    if (state.session) { state.session.ended = true; persist(); }
  }

  // A question asked after the pass went wrong (FR-046). The lesson's result doesn't change, so this
  // is a notice and never an error state. A stopped process means there's no session left to ask.
  function afterPassFailure(t) {
    if (state.mentorEntry) state.mentorEntry.cut_off = true;
    const stopped = !!t && t.treatment === "ended"; // no error event at all: the turn failed, the process lives
    const copy = stopped ? E.after_pass_stopped : E.after_pass_failed;
    notice(copy.title, copy.body);
    if (stopped) stopAdapter();
    state.resume_first = !stopped && !!t && t.kind === "timeout";
  }

  function cutOffNotice(error) {
    const v = state.lesson;
    const kind = state.turn && state.turn.kind;
    let copy = error.copy;
    if (kind === "show_me" && v && v.demo_unknown) copy = E.demo_unknown;
    else if (kind === "show_me" && v && v.demo_made) copy = v.skill === EASING.id ? E.demo_easing : E.demo_other;
    notice(copy.title, copy.body);
  }

  function onTurnEnd(e) {
    const ok = !!e.ok;
    if (ok) state.turnsDone++;
    reduce({ type: "turn_end" });
    if (state.picking === "starting") state.picking = null;
    if (!ok && !state.busy && state.error) { changed(); return; } // already handled on the first turn
    if (!ok && state.lesson_over) afterPassFailure(state.turnError);
    else if (!ok) {
      reduce({ type: "cut_off", kind: state.turn && state.turn.kind, announcesCalls: !!(state.adapter && state.adapter.announcesCalls), demoCallSeen: state.demoCallSeen, demoResult: state.demoResult });
      if (state.turnError && state.turnError.treatment !== "cut_off") { /* already shown at the error */ }
      else {
        const t = state.turnError || { kind: "stopped", treatment: "cut_off", state: "lesson-error", copy: E.stopped, title: E.stopped.title, body: E.stopped.body, try_again: true };
        const error = Object.assign({}, t, { copy: t.copy || E.timeout });
        state.error = error;
        if (state.mentorEntry) state.mentorEntry.cut_off = true;
        cutOffNotice(error);
      }
    }
    state.busy = false;
    state.turn = Object.assign({}, state.turn, { busy: false, status: null });
    state.mentorEntry = null;
    state.committed = "";
    state.block = "";
    persist();
    if (deps.appendTurn) {
      deps.appendTurn({ at: state.sentAt || undefined, kind: e.kind, wait_ms: e.wait_ms, first_event_ms: e.first_event_ms, total_ms: e.total_ms, cost_usd: e.cost_usd, ok: e.ok, lesson_passed: !state.passedBefore && !!(state.lesson && state.lesson.passed) });
    }
    state.focus_tick++;
    changed();
  }

  // ---------- sending ----------

  // B1's timeout ends the turn but leaves the process running, so whatever is sent next must not go
  // to it (research R5). False if the new process couldn't start and the lesson has closed.
  function resumeAfterTimeout() {
    stopAdapter();
    const a = newAdapter();
    const saved = state.session || state.pick_session;
    a.start({ resumeSessionId: saved.claude_session_id, skill: saved.skill });
    return !!state.adapter;
  }

  function send(kind, text, label, o) {
    const opts = o || {};
    if (state.busy || !state.adapter) return false;
    if (((state.error && state.error.kind === "timeout") || state.resume_first) && runtime !== "a" && !resumeAfterTimeout()) return false;
    state.resume_first = false;
    if (!opts.silent) push({ role: "learner", text: label });
    state.busy = true;
    state.turn = { busy: true, kind, pressed: opts.pressed || null, status: opts.status || statusFor("") };
    state.mentorEntry = null;
    state.committed = "";
    state.block = "";
    state.turnError = null;
    state.error = null;
    state.aeNoticed = false;
    state.demoCallSeen = false;
    state.demoResult = false;
    state.passedBefore = !!(state.lesson && state.lesson.passed);
    state.last = { kind, text, label };
    if (kind === "check") state.list_open = false;
    reduce({ type: "sent", kind });
    persist();
    changed();
    try {
      state.adapter.send(text, kind);
    } catch (e) {
      deps.log({ kind: "send_failed", length: 0 });
      state.busy = false;
      state.turn = Object.assign({}, state.turn, { busy: false });
      if (e.code !== "BUSY") endLesson(treatError("process_exited", { runtime }));
      changed();
    }
    return true;
  }

  function resetLessonFields() {
    state.turnsDone = 0;
    state.error = null;
    state.turnError = null;
    state.list_open = false;
    state.list_collapsed = null;
    state.done_unfolded = false;
    state.lesson_over = false;
    state.resume_first = false;
    state.picking = null;
    state.from_picking = false;
    state.pick_session = null;
    state.recommend = null;
  }

  // The path's first skill: what Start lesson means with no skill named (FR-010).
  function firstSkill() {
    const first = deps.pathData && Array.isArray(deps.pathData.skills) && deps.pathData.skills[0];
    return (first && skillById(first.id)) || EASING;
  }

  function startLesson(args) {
    if (!(args && args.skill) && state.start && state.start.picking) { findNext(); return; }
    const row = (args && args.skill && skillById(args.skill)) || (state.start && skillById(state.start.skill)) || firstSkill();
    beginLesson(row.id, startRequest(row.command), COPY.status.lesson_ready);
  }

  // Every lesson start: which request, whose lesson, and the status line (T041, FR-087).
  function beginLesson(skillId, req, status) {
    if (state.busy || state.lesson_open) return;
    stopAdapter();
    resetLessonFields();
    state.start = { skill: skillId, req, status };
    state.pending = null;
    state.saved = null;
    state.aeclosed = false;
    state.messages = [];
    state.lesson = initialLesson({ skill: skillId });
    state.lesson_open = true;
    state.tab = "lesson";
    const skill = skillOf(req.request);
    const a = newAdapter();
    const id = a.start({ skill });
    if (!state.adapter) return; // the start failed and onError already closed the lesson
    startSession(id, skill);
    send(req.kind, req.request, req.label, { silent: true, status });
  }

  function startSession(id, skill) {
    state.session = session.newSession({ claude_session_id: id, lesson: state.lesson, skill, bridge_started: state.connection ? state.connection.started : null });
    const sess = state.session;
    deps.bridgeStarted().then((started) => {
      if (started === null) return; // busy or gone: keep the start time the mark already had
      sess.bridge_started = started;
      if (state.session === sess) persist();
    });
  }

  function newLesson({ skill }) {
    const row = skillById(skill);
    if (row) beginLesson(row.id, newLessonRequest(row.command), COPY.status.lesson_ready);
  }

  // Warm up (RQ-11): only a skill the data file says has a review, so never easing.
  function warmUp({ skill }) {
    const row = builtSkills(deps.pathData, deps.skillsBuilt).find((s) => s.id === skill);
    if (row && row.review) beginLesson(row.id, warmUpRequest(row.command), COPY.status.warm_up_ready);
  }

  // Find my next lesson (FR-013, FR-082): one next-mentor turn. It isn't a lesson, so it writes no
  // display log and can't come back as home-cutoff.
  function findNext() {
    if (state.busy || state.lesson_open) return;
    stopAdapter();
    resetLessonFields();
    state.start = { picking: true };
    state.pending = null;
    state.saved = null;
    state.aeclosed = false;
    state.messages = [];
    state.session = null;
    state.lesson = initialLesson({});
    state.lesson_open = true;
    state.tab = "lesson";
    state.picking = "suggesting";
    const a = newAdapter();
    const id = a.start({ skill: "next-mentor" });
    if (!state.adapter) return;
    state.pick_session = { claude_session_id: id, skill: "next-mentor" };
    send("find_next", REQUESTS.find_next.request, REQUESTS.find_next.label, { silent: true, status: COPY.status.looking_comp });
  }

  // Yes's recommended skill: only with a recommendation, no `requested`, and a skill in the table (FR-082).
  function yesRow() {
    const r = state.recommend;
    if (state.picking !== "suggesting" || !r || r.requested || !r.recommendation) return null;
    return skillById(r.recommendation.skill);
  }

  function yes() {
    const row = yesRow();
    if (state.busy || !row) return;
    const follow = followOnRequest(state.recommend.recommendation, row.command);
    const pick = state.pick_session;
    if (state.adapter && state.adapter.handsOver) {
      // A: the mentor hands over in the same conversation; the lesson's skill comes from the next tool.
      state.picking = "starting";
      state.from_picking = true;
      state.start = { skill: row.id, req: follow };
      state.lesson = initialLesson({});
      state.turnsDone = 0;
      if (pick) startSession(pick.claude_session_id, row.skill);
      send("yes", REQUESTS.yes.request, REQUESTS.yes.label, { pressed: "yes", status: COPY.status.lesson_ready });
      return;
    }
    // B1 can't hand over: end next-mentor and start the recommended lesson as Start lesson would. A
    // new adapter replaces the old one, so its late exit can't touch this lesson (plan P3).
    stopAdapter();
    resetLessonFields();
    state.picking = "starting";
    state.from_picking = true;
    state.start = { skill: row.id, req: follow };
    state.lesson = initialLesson({ skill: row.id });
    state.lesson_open = true;
    const a = newAdapter();
    const id = a.start({ skill: row.skill });
    if (!state.adapter) return;
    startSession(id, row.skill);
    send("yes", follow.request, REQUESTS.yes.label, { pressed: "yes", status: COPY.status.lesson_ready });
  }

  function continueLesson() {
    if (state.busy || state.lesson_open || !state.pending) return;
    const saved = state.pending;
    stopAdapter();
    resetLessonFields();
    state.turnsDone = 1;
    state.saved = null;
    state.pending = null;
    state.session = saved;
    state.lesson = Object.assign(initialLesson(), saved.lesson || {});
    // So Start lesson, once this one has ended, starts the skill the header names.
    const row = skillById(state.lesson.skill) || skillOfCommand(`/${saved.skill}`);
    state.start = row ? { skill: row.id, req: startRequest(row.command) } : null;
    reduce({ type: "continued" });
    state.messages = saved.messages.map((m) => Object.assign({}, m, { srcs: (m.frames || []).map((f) => { const d = session.readFrame(f); return d ? `data:image/png;base64,${d}` : null; }) }));
    state.lesson_open = true;
    state.tab = "lesson";
    push({ role: "divider", text: `${COPY.lesson.resumed_divider} · ${shortDate(now().toISOString())}` });
    const a = newAdapter();
    a.start({ resumeSessionId: saved.claude_session_id, skill: saved.skill });
    if (!state.adapter) return;
    send("continue", REQUESTS.continue.request, COPY.buttons.continue, { pressed: "continue", status: COPY.status.picking_up });
  }

  function retry() {
    const last = state.last;
    if (!last) return;
    const rk = retryKind(last.kind, state.lesson);
    if (rk !== last.kind) { sendButton(rk); return; }
    send(last.kind, last.text, COPY.buttons.try_again, { pressed: "try_again", status: statusFor("") });
  }

  function tryAgain() {
    if (state.busy || !state.error) return;
    const e = state.error;
    if (e.state === "lesson-start-failed" || (!state.lesson_open && !state.lesson_over)) {
      state.error = null;
      if (state.start && state.start.picking) findNext();
      else if (state.start) beginLesson(state.start.skill, state.start.req, state.start.status || COPY.status.lesson_ready);
      else startLesson();
      return;
    }
    if (!state.lesson_open) { state.error = null; return; } // the lesson is saved: nothing to retry into
    retry();
  }

  function sendButton(name) {
    const kind = BUTTONS[name] || name;
    const v = state.lesson;
    const req = kind === "show_me_again" ? showMeAgain(v && v.skill) : REQUESTS[kind];
    if (!req || !state.lesson_open) return;
    const row = (v && skillById(v.skill)) || EASING;
    const toolStatus = name === "check" || name === "check_again" ? row.check : name === "show_me" ? row.demo : null;
    send(kind, req.request, name === "check_again" ? COPY.buttons.check_again : req.label, { pressed: name, status: toolStatus ? statusFor(toolStatus) : statusFor("") });
  }

  // FR-046: Ask stays after a pass, in the same mentor session, for as long as that session lives.
  const canAsk = () => state.lesson_open || (state.lesson_over && !!state.adapter && !!state.lesson && state.lesson.passed);

  function ask(text) {
    if (!canAsk() || state.busy) return false;
    return send("ask", text, text);
  }

  function endLessonNow() {
    if (!state.lesson_open || state.busy) return;
    stopAdapter();
    session.clear();
    state.pending = null;
    state.session = null;
    state.lesson_open = false;
    state.lesson = null;
    state.error = null;
    state.messages = [];
    state.tab = "home";
    resetPicking();
  }

  function resetPicking() {
    state.picking = null;
    state.from_picking = false;
    state.pick_session = null;
    state.recommend = null;
  }

  function setAside() {
    session.clear();
    state.pending = null;
    state.saved = null;
  }

  // What's next ›, See your skills, Back to Home after the lesson has ended.
  function leaveLesson(tab) {
    if (state.busy) return;
    stopAdapter();
    state.lesson_open = false;
    state.lesson_over = false;
    state.lesson = null;
    state.error = null;
    state.session = null;
    state.messages = [];
    state.tab = tab;
    resetPicking();
  }

  function toggleList(short) {
    if (short) { state.list_open = !state.list_open; return; }
    state.list_collapsed = !listCollapsed(model());
    state.list_open = false; // opened at a short dock and since resized: it would override the press
  }

  const ACTIONS = {
    tab: ({ tab }) => { if (tab) { state.tab = tab; if (tab === "skills") state.skill_detail = null; } },
    go_home: () => { state.tab = "home"; },
    pick_skill: () => { state.tab = "skills"; state.skill_detail = null; },
    back_lesson: () => { state.tab = "lesson"; },
    what_happened: () => { state.unreadable_why = true; },
    got_it_unreadable: () => { state.unreadable_why = false; state.unreadable_dismissed = true; },
    got_it_aeclosed: () => { state.aeclosed = false; },
    reconnect,
    start: ({ skill }) => startLesson({ skill }),
    new_lesson: newLesson,
    warm_up: warmUp,
    find_next: findNext,
    yes,
    leave_picking: () => leaveLesson("skills"),
    open_skill: ({ skill }) => { if (skill) state.skill_detail = skill; },
    back_skills: () => { state.skill_detail = null; },
    continue: continueLesson,
    set_aside: setAside,
    end_lesson: endLessonNow,
    check: () => sendButton("check"),
    check_again: () => sendButton("check_again"),
    hint: () => sendButton("hint"),
    show_me: () => sendButton("show_me"),
    show_me_again: () => sendButton("show_me_again"),
    try_again: tryAgain,
    whats_next: () => leaveLesson("home"),
    see_skills: () => leaveLesson("skills"),
    back_home: () => leaveLesson("home"),
    toggle_list: ({ short }) => toggleList(short),
    fold_done: () => { state.done_unfolded = !state.done_unfolded; },
  };

  function act(name, args) {
    if (Object.prototype.hasOwnProperty.call(ACTIONS, name)) ACTIONS[name](args || {});
    changed();
  }

  function shutdown() {
    persist();
    if (state.adapter) state.adapter.stop();
  }

  function model() {
    const recordStatus = state.record.status;
    const memory = recordStatus === "pending" || recordStatus === "loading" ? { status: "missing", record: null } : state.record;
    const built = builtSkills(deps.pathData, deps.skillsBuilt);
    const home = homeView({ memory, pathData: deps.pathData, built, now: now() });
    const saved = state.aeclosed ? "aeclosed" : state.saved;
    const m = {
      config_ok: true,
      tab: state.tab,
      step: 2,
      picking: state.picking,
      from_picking: state.from_picking,
      record: { status: recordStatus },
      has_history: home.has_history,
      connection: state.connection,
      unreadable_why: state.unreadable_why,
      unreadable_dismissed: state.unreadable_dismissed,
      lesson_open: state.lesson_open,
      lesson_over: state.lesson_over,
      can_ask: canAsk(),
      answering_after_pass: state.lesson_over && state.busy,
      lesson: state.lesson,
      turn: state.turn,
      error: state.error,
      saved,
      reconnecting: state.reconnecting,
    };
    const viewArgs = { memory, pathData: deps.pathData, built, now: now() };
    const skills_view = skillsView(viewArgs);
    const detail = state.skill_detail ? skillDetail(state.skill_detail, viewArgs) : null;
    m.skills_state = skills_view.state;
    m.skill_detail = detail ? detail.state : null;
    return Object.assign(m, {
      state: stateOf(m),
      home,
      skills_view,
      detail,
      skill_detail: state.skill_detail,
      yes_ready: !!yesRow(),
      names: Object.fromEntries(((deps.pathData && deps.pathData.skills) || []).map((s) => [s.id, s.name])),
      saved_lesson: state.pending,
      messages: state.messages,
      list_open: state.list_open,
      list_collapsed: state.list_collapsed,
      done_unfolded: state.done_unfolded,
      retry_kind: state.last ? retryKind(state.last.kind, state.lesson) : null,
      retry_same: state.last ? retryKind(state.last.kind, state.lesson) === state.last.kind : false,
      focus_tick: state.focus_tick,
    });
  }

  return { init, act, ask, model, setConnection, shutdown };
}

module.exports = { createApp, retryKind };
