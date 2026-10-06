// AE Mentor panel: DOM wiring only (FR-013). What to teach, when to demonstrate and how to grade
// all come from the mentor. What the panel shows besides the mentor's words comes from tool
// results and the learner record (research R5), through the pure modules in lib/.
(function () {
  "use strict";

  const req = typeof require === "function" ? require : window.cep_node && window.cep_node.require;
  const path = req("path");
  const DIR = path.dirname(decodeURIComponent(window.location.pathname));
  const lib = (name) => req(path.join(DIR, "lib", name));

  const { loadConfig } = lib("config.js");
  const { createAdapter } = lib("adapter-claude-code.js");
  const { REQUESTS, visibleKinds } = lib("requests.js");
  const { initialLesson, reduceLesson, stageOf } = lib("lesson.js");
  const { pathView } = lib("path.js");
  const { readLearnerRecord, memoryView } = lib("memory.js");
  const { renderMentorText, escapeHtml } = lib("text.js");
  const { statusFor } = lib("activity.js");
  const { appendTurn } = lib("turns.js");

  const $ = (id) => document.getElementById(id);
  const conversation = $("conversation");

  const state = {
    cfg: null,
    adapter: null,
    lessonOpen: false,
    view: null,
    busy: false,
    mentorEl: null, // the mentor message being written this turn
    committed: "", // finished text blocks this turn
    block: "", // the text block being streamed
    passedBeforeTurn: false,
    turnError: false,
    record: null, // learner.json, read-only (FR-011)
  };

  // ---------- conversation ----------

  function scrollToEnd() {
    conversation.scrollTop = conversation.scrollHeight;
  }

  function addMessage(role, html) {
    const empty = $("empty");
    if (empty) empty.remove();
    const el = document.createElement("div");
    el.className = `msg ${role}`;
    el.innerHTML = html;
    conversation.appendChild(el);
    scrollToEnd();
    return el;
  }

  const learnerSays = (label) => addMessage("learner", `<span>${escapeHtml(label)}</span>`);
  const notice = (text) => addMessage("notice", escapeHtml(text));

  function mentorMessage() {
    if (!state.mentorEl) {
      state.mentorEl = addMessage("mentor", '<div class="text"></div><div class="frames"></div>');
    }
    return state.mentorEl;
  }

  function renderMentor() {
    const el = mentorMessage();
    el.querySelector(".text").innerHTML = renderMentorText(state.committed + state.block);
    scrollToEnd();
  }

  function addFrames(images) {
    const frames = mentorMessage().querySelector(".frames");
    for (const im of images) {
      const img = document.createElement("img");
      img.className = "frame";
      img.alt = "A frame from your comp";
      img.src = `data:${im.mimeType || "image/png"};base64,${im.data}`;
      frames.appendChild(img);
    }
    scrollToEnd();
  }

  // ---------- status, check list, buttons ----------

  function setStatus(text) {
    $("status").hidden = !text;
    $("status-text").textContent = text || "";
  }

  function setConn(kind, text) {
    $("conn").className = `conn ${kind || ""}`;
    $("conn-text").textContent = text;
  }

  function renderCheck() {
    const list = state.view && state.view.check_list;
    $("check").hidden = !list;
    if (!list) return;
    $("check").classList.toggle("stale", list.stale);
    $("check-stale").hidden = !list.stale;
    $("check-summary").textContent = list.passed ? "All eased. Lesson passed ✓" : list.summary;
    $("check-rows").innerHTML = list.rows
      .map((r) => `<li class="${r.ok ? "ok" : "bad"}"><span>${escapeHtml(r.label)}</span><span>${escapeHtml(r.shown)}</span></li>`)
      .join("");
    $("check-outside").hidden = list.outside.length === 0;
    $("check-outside-rows").innerHTML = list.outside.map((o) => `<li>${escapeHtml(o)}</li>`).join("");
  }

  function renderButtons() {
    const nav = $("buttons");
    nav.innerHTML = "";
    if (!state.cfg) return;
    for (const kind of visibleKinds(state.view, { lessonOpen: state.lessonOpen, canContinue: false })) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = REQUESTS[kind].label;
      if (kind === "start" || kind === "continue" || kind === "check") b.className = "primary";
      b.disabled = state.busy;
      b.addEventListener("click", () => onButton(kind));
      nav.appendChild(b);
    }
    $("ask-input").disabled = !state.lessonOpen || state.busy;
    $("ask-send").disabled = !state.lessonOpen || state.busy;
  }

  const MARKS = { done: "✓", current: "●", upcoming: "○", skipped: "–", next: "○" };

  // Stage (FR-009): only while a lesson is open. Path (FR-010): always, from the record.
  function renderStage() {
    $("stage").hidden = !state.lessonOpen;
    if (!state.lessonOpen) return;
    $("stage").innerHTML = "<ol>" + stageOf(state.view).steps
      .map((s) => `<li class="${s.state}"><span class="mark">${MARKS[s.state]}</span>${escapeHtml(s.label)}</li>`)
      .join("") + "</ol>";
  }

  function renderPath() {
    $("path").hidden = !state.cfg;
    $("path").innerHTML = "<h2>Path · Motion basics</h2><ol>" + pathView(state.record, state.view)
      .map((s) => `<li class="${s.state}">${MARKS[s.state]} ${escapeHtml(s.name)}${s.state === "next" ? " (next)" : ""}</li>`)
      .join("") + "</ol>";
  }

  // Memory (FR-011): read-only, no controls (US3-4).
  function renderMemory() {
    $("memory").hidden = !state.cfg;
    const m = memoryView(state.record);
    $("memory").innerHTML = "<h2>Memory</h2>" + (m.empty
      ? `<p>${escapeHtml(m.text)}</p>`
      : `<p><strong>${escapeHtml(m.date)}</strong> · ${escapeHtml(m.skill)} · ${escapeHtml(m.result)}</p>` +
        (m.next ? `<p>Next: ${escapeHtml(m.next)}</p>` : ""));
  }

  function renderExtras() {
    renderStage();
    renderPath();
    renderMemory();
  }

  function render() {
    renderCheck();
    renderButtons();
    renderExtras();
  }

  // ---------- talking to the mentor ----------

  function send(kind, text, label) {
    if (state.busy || !state.adapter) return;
    learnerSays(label);
    state.busy = true;
    state.mentorEl = null;
    state.committed = "";
    state.block = "";
    state.turnError = false;
    state.passedBeforeTurn = !!(state.view && state.view.passed);
    setStatus("Working…");
    render();
    try {
      state.adapter.send(text, kind);
    } catch (e) {
      state.busy = false;
      setStatus("");
      notice(e.code === "BUSY" ? "The mentor is still answering. Wait for it to finish." : "The mentor isn't running. Start the lesson again.");
      render();
    }
  }

  function onButton(kind) {
    if (kind === "start") return startLesson();
    send(kind, REQUESTS[kind].request, REQUESTS[kind].label);
  }

  const ERRORS = {
    not_signed_in: "Claude Code isn't signed in. Open Terminal and run `claude` once to sign in, then start the lesson again.",
    start_failed: "Claude Code couldn't start.",
    timeout: "The mentor took more than 5 minutes to answer, so the panel stopped waiting. Try again.",
    process_exited: "Claude Code stopped unexpectedly. Start the lesson again.",
    bad_stream: null, // logged, not shown: one bad line isn't worth interrupting the lesson
  };

  function wireAdapter(a) {
    a.on("tool_call", (e) => {
      if (!state.block && !state.committed) setStatus(statusFor(e.name));
    });
    a.on("text_delta", (e) => {
      setStatus("");
      state.block += e.text;
      renderMentor();
    });
    a.on("text", (e) => {
      state.committed += (state.committed ? "\n\n" : "") + e.text;
      state.block = "";
      renderMentor();
    });
    a.on("tool_result", (e) => {
      if (e.images && e.images.length) addFrames(e.images);
      if (!e.ok && /AE_UNREACHABLE|AE_BUSY/.test(e.text || "")) {
        notice("The mentor can't see After Effects right now. Check that AE is open with no dialog showing and nothing rendering.");
      }
      state.view = reduceLesson(state.view, e);
      if (e.name === "record_lesson" && e.ok) state.record = readLearnerRecord(); // US3-3
      render();
    });
    a.on("error", (e) => {
      const msg = ERRORS[e.kind];
      if (e.kind === "bad_stream") return console.warn("[AE Mentor] bad stream line", e.message);
      state.turnError = true;
      notice(msg === undefined ? `Something went wrong: ${e.message}` : e.kind === "start_failed" ? `${msg} ${e.message || ""}`.trim() : msg);
    });
    a.on("turn_end", (e) => {
      state.busy = false;
      setStatus("");
      state.mentorEl = null;
      if (!e.ok && !state.turnError) notice("The mentor stopped before finishing. Try again.");
      appendTurn({}, {
        kind: e.kind,
        wait_ms: e.wait_ms,
        first_event_ms: e.first_event_ms,
        total_ms: e.total_ms,
        cost_usd: e.cost_usd,
        ok: e.ok,
        lesson_passed: !state.passedBeforeTurn && !!(state.view && state.view.passed),
      });
      render();
    });
    a.on("exit", () => {
      state.adapter = null;
      state.lessonOpen = false;
      state.busy = false;
      setStatus("");
      setConn("", "AE Mentor");
      render();
    });
  }

  function startLesson() {
    if (state.adapter) state.adapter.stop();
    state.view = initialLesson();
    state.lessonOpen = true;
    state.adapter = createAdapter(state.cfg);
    wireAdapter(state.adapter);
    state.adapter.start();
    setConn("ok", "AE Mentor · lesson open");
    send("start", REQUESTS.start.request, REQUESTS.start.label);
  }

  // ---------- start-up ----------

  $("ask").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const input = $("ask-input");
    const text = input.value.trim();
    if (!text || !state.lessonOpen || state.busy) return;
    input.value = "";
    send("ask", text, text);
  });

  window.addEventListener("beforeunload", () => {
    if (state.adapter) state.adapter.stop();
  });

  const cfg = loadConfig();
  if (!cfg.ok) {
    setConn("bad", "AE Mentor · not set up");
    notice(cfg.fix);
  } else {
    state.cfg = cfg;
    state.record = readLearnerRecord();
    setConn("", "AE Mentor");
  }
  render();
})();
