// The panel's controller (spec 007 T015 to T023): every decision about what the panel shows and
// does, with no DOM and no host app, so all of it runs under `node --test`. main.js only draws
// app.model() and passes clicks in. What to teach comes from the mentor (decisions/005); this only
// keeps track of the screen, and never reads or changes the project.
"use strict";

const { homeView, startRequest } = require("./home.js");
const { stateOf } = require("./view-state.js");
const { initialLesson, reduceLesson, showsResuming, DEMO_TOOLS } = require("./lesson.js");
const list = require("./checklist/index.js");
const { treatError, logEntry } = require("./errors.js");
const { REQUESTS } = require("./requests.js");
const { skillOf } = require("./skill-tools.js");
const { statusFor } = require("./activity.js");
const { connectionFromTool } = require("./connection.js");
const { shortDate } = require("./memory.js");
const { COPY } = require("./copy.js");

const LOADING_AFTER_MS = 300; // FR-008
const SKILL = "easing.basic"; // step 1 teaches easing only (plan P9); T041 passes the request's skill
const AE_LOST = /AE_UNREACHABLE|AE_BUSY/;

const E = COPY.errors;
const VERB = COPY.buttons.pressed;
const PRESS = { check: VERB.check, check_again: VERB.check, hint: VERB.hint, show_me: VERB.show, show_me_again: VERB.show, try_again: VERB.try, continue: VERB.open };
const PRESS_STATUS = { check: "diff_since_last", check_again: "diff_since_last", show_me: "set_ease" };
const BUTTONS = { check: "check", check_again: "check", hint: "hint", show_me: "show_me", show_me_again: "show_me_again" };

const lessonOver = (v) => !!v && (v.saved === true || (v.passed && v.saved === false));

// FR-030: what a retry of `kind` really sends, given where the demo stands.
function retryKind(kind, v) {
  if (kind !== "show_me" || !v) return kind;
  if (v.demo_made) return "show_me_again";
  return v.demo_unknown ? "check" : kind;
}

// deps: { cfg, createAdapter, readRecord, pathData, session, appendTurn, bridgeStarted, pollNow,
// log, onChange, now, setTimeout }. test/app-harness.js builds a fake set.
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
    lesson: null,
    session: null,
    messages: [],
    mentorEntry: null,
    committed: "",
    block: "",
    busy: false,
    turn: null,
    last: null,
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
    if (conn) state.connection = { state: conn, started: state.connection ? state.connection.started : null };
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
    reduce({ type: "exited" });
    notice(t.title, t.body);
    state.error = t;
    state.lesson_open = false;
    state.lesson_over = false;
    state.busy = false;
    state.turn = Object.assign({}, state.turn, { busy: false });
    state.adapter = null;
    if (state.session) { state.session.ended = true; persist(); }
  }

  function cutOffNotice(error) {
    const v = state.lesson;
    const kind = state.turn && state.turn.kind;
    let copy = error.copy;
    if (kind === "show_me" && v && v.demo_unknown) copy = E.demo_unknown;
    else if (kind === "show_me" && v && v.demo_made) copy = v.skill === SKILL ? E.demo_easing : E.demo_other;
    notice(copy.title, copy.body);
  }

  function onTurnEnd(e) {
    const ok = !!e.ok;
    if (ok) state.turnsDone++;
    reduce({ type: "turn_end" });
    if (!ok && !state.busy && state.error) { changed(); return; } // already handled on the first turn
    if (!ok) {
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
    state.list_collapsed = null;
    persist();
    if (deps.appendTurn) {
      deps.appendTurn({ at: state.sentAt || undefined, kind: e.kind, wait_ms: e.wait_ms, first_event_ms: e.first_event_ms, total_ms: e.total_ms, cost_usd: e.cost_usd, ok: e.ok, lesson_passed: !state.passedBefore && !!(state.lesson && state.lesson.passed) });
    }
    state.focus_tick++;
    changed();
  }

  // ---------- sending ----------

  function send(kind, text, label, o) {
    const opts = o || {};
    if (state.busy || !state.adapter) return false;
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
    state.list_collapsed = null;
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
  }

  function startLesson() {
    if (state.busy || state.lesson_open) return;
    stopAdapter();
    const req = startRequest(SKILL) || REQUESTS.start;
    resetLessonFields();
    state.pending = null;
    state.saved = null;
    state.aeclosed = false;
    state.messages = [];
    state.lesson = initialLesson({ skill: SKILL });
    state.lesson_open = true;
    state.tab = "lesson";
    const skill = skillOf(req.request);
    const a = newAdapter();
    const id = a.start({ skill });
    if (!state.adapter) return; // the start failed and onError already closed the lesson
    state.session = session.newSession({ claude_session_id: id, lesson: state.lesson, skill, bridge_started: state.connection ? state.connection.started : null });
    const sess = state.session;
    deps.bridgeStarted().then((started) => {
      sess.bridge_started = started;
      if (state.session === sess) persist();
    });
    send("start", req.request, req.label, { silent: true, status: COPY.status.lesson_ready });
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
    if (state.error && state.error.kind === "timeout" && runtime !== "a") {
      // B1's timeout leaves the old process running; stop it and resume the session (research R5).
      const old = state.adapter;
      state.adapter = null;
      if (old) old.stop();
      const a = newAdapter();
      a.start({ resumeSessionId: state.session.claude_session_id, skill: state.session.skill });
      if (!state.adapter) return;
    }
    send(last.kind, last.text, COPY.buttons.try_again, { pressed: "try_again", status: statusFor("") });
  }

  function tryAgain() {
    if (state.busy || !state.error) return;
    const e = state.error;
    if (e.state === "lesson-start-failed") {
      state.error = null;
      startLesson();
      return;
    }
    if (!state.lesson_open) { state.error = null; return; } // no lesson to retry into (FR-056)
    retry();
  }

  function sendButton(name) {
    const kind = BUTTONS[name] || name;
    const req = REQUESTS[kind];
    if (!req || !state.lesson_open) return;
    const toolStatus = PRESS_STATUS[name];
    send(kind, req.request, name === "check_again" ? COPY.buttons.check_again : req.label, { pressed: name, status: toolStatus ? statusFor(toolStatus) : statusFor("") });
  }

  function ask(text) {
    if (!state.lesson_open || state.busy) return false;
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
  }

  function toggleList(short) {
    if (short) state.list_open = !state.list_open;
    else state.list_collapsed = !(state.list_collapsed === true);
  }

  const ACTIONS = {
    tab: ({ tab }) => { if (tab) state.tab = tab; },
    go_home: () => { state.tab = "home"; },
    pick_skill: () => { state.tab = "skills"; },
    back_lesson: () => { state.tab = "lesson"; },
    what_happened: () => { state.unreadable_why = true; },
    got_it_unreadable: () => { state.unreadable_why = false; state.unreadable_dismissed = true; },
    got_it_aeclosed: () => { state.aeclosed = false; },
    reconnect,
    start: startLesson,
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
    const home = homeView({ memory, pathData: deps.pathData });
    const saved = state.aeclosed ? "aeclosed" : state.saved;
    const m = {
      config_ok: true,
      tab: state.tab,
      step: 1,
      record: { status: recordStatus },
      has_history: home.has_history,
      connection: state.connection,
      unreadable_why: state.unreadable_why,
      unreadable_dismissed: state.unreadable_dismissed,
      lesson_open: state.lesson_open,
      lesson_over: state.lesson_over,
      lesson: state.lesson,
      turn: state.turn,
      error: state.error,
      saved,
      reconnecting: state.reconnecting,
    };
    return Object.assign(m, {
      state: stateOf(m),
      home,
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
