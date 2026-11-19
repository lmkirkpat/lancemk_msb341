// Knack panel: DOM wiring only (spec 007 plan P1). lib/app.js holds every decision and lib/screens.js
// the markup; this file draws app.model() and passes clicks in. CEP-only code stays here.
(function () {
  "use strict";

  const req = typeof require === "function" ? require : window.cep_node && window.cep_node.require;
  const path = req("path");
  const DIR = path.dirname(decodeURIComponent(window.location.pathname));
  const lib = (name) => req(path.join(DIR, "lib", name));

  const { loadConfig, defaultHome } = lib("config.js");
  const { ensureRuntime } = lib("runtime.js");
  const { createAdapter: createB1Adapter } = lib("adapter-claude-code.js");
  const { createAdapter: createApiAdapter } = lib("adapter-api.js");
  const { readLearnerRecordAsync } = lib("memory.js");
  const { readPathData } = lib("home.js");
  const { readSkillsBuilt } = lib("skills.js");
  const { readConnection, createPoller } = lib("connection.js");
  const { bridgeStarted } = lib("bridge-status.js");
  const { appendTurn } = lib("turns.js");
  const ps = lib("panel-session.js");
  const { createApp } = lib("app.js");
  const { writeLoadedStamp } = lib("loaded-stamp.js");
  const { renderApp, nextTab } = lib("screens.js");
  const { askBoxKey } = lib("keys.js");

  const $ = (id) => document.getElementById(id);
  const SHORT = window.matchMedia("(max-height: 560px)");

  // ---------- drawing: only what changed, so scroll, focus and Flip survive a redraw ----------

  // A redraw replaces the markup, so a box keeps what was typed (data-keep-value) and the focused
  // control keeps focus by its id: focus is never dropped to the page (spec 014 FR-054).
  function setHtml(el, html) {
    if (el.__html === html) return;
    const list = el.querySelector && el.querySelector(".check-body");
    const top = list ? list.scrollTop : 0;
    const active = document.activeElement && el.contains(document.activeElement) && document.activeElement.id ? document.activeElement : null;
    const kept = [...el.querySelectorAll("[data-keep-value][id]")].map((b) => ({ id: b.id, value: b.value, start: b.selectionStart, end: b.selectionEnd }));
    el.innerHTML = html;
    el.__html = html;
    const after = el.querySelector && el.querySelector(".check-body");
    if (after) after.scrollTop = top;
    for (const k of kept) {
      const b = document.getElementById(k.id);
      if (b && b.tagName === "INPUT") b.value = k.value; // the textarea's text comes from the app's draft
      if (b && active && active.id === k.id && typeof k.start === "number") { try { b.setSelectionRange(k.start, k.end); } catch (e) {} }
    }
    if (active) {
      const again = document.getElementById(active.id);
      if (again && document.activeElement !== again) again.focus();
    }
  }

  function patchChat(el, chat) {
    const want = (chat.earlier ? [chat.earlier] : []).concat(chat.items);
    // A message that had focus can be replaced (the skeleton, when the hand-in's reply comes): focus
    // moves to the newest message, or the chat itself, never to the page (FR-054).
    const hadFocus = !!document.activeElement && document.activeElement !== el && el.contains(document.activeElement);
    while (el.children.length > want.length) el.removeChild(el.lastElementChild);
    let changed = false;
    want.forEach((html, i) => {
      const old = el.children[i];
      if (old && old.__html === html) return;
      const t = document.createElement("template");
      t.innerHTML = html;
      const node = t.content.firstElementChild;
      node.__html = html;
      if (old && old.tagName === "DETAILS" && node.tagName === "DETAILS") node.open = old.open;
      if (old) el.replaceChild(node, old); else el.appendChild(node);
      changed = true;
    });
    if (changed) el.scrollTop = el.scrollHeight;
    if (hadFocus && !el.contains(document.activeElement)) {
      const msgs = el.querySelectorAll(".msg.mentor, .msg.notice");
      const target = msgs.length ? msgs[msgs.length - 1] : el;
      target.setAttribute("tabindex", "-1");
      target.focus();
    }
  }

  function focusNewest() {
    const view = $("lesson").hidden ? $("view") : $("lesson");
    const msgs = view.querySelectorAll(".msg.mentor, .msg.notice");
    const target = msgs.length ? msgs[msgs.length - 1] : view.querySelector(".banner") || view.querySelector("[data-title]");
    if (!target) return;
    target.setAttribute("tabindex", "-1");
    target.focus();
  }

  let app;
  let focusTick = 0;

  function draw() {
    const m = app.model();
    const r = renderApp(m);
    const onTab = document.activeElement && document.activeElement.getAttribute("role") === "tab" ? document.activeElement.id : null;
    setHtml($("nav"), r.nav);
    if (onTab && $(onTab)) $(onTab).focus();
    $("view").setAttribute("aria-labelledby", `tab-${m.tab}`);
    $("lesson").setAttribute("aria-labelledby", `tab-${m.tab}`);
    $("lesson").setAttribute("role", r.lesson ? "tabpanel" : "presentation");
    $("view").hidden = !!r.lesson;
    $("lesson").hidden = !r.lesson;
    if (r.lesson) {
      $("lesson").classList.toggle("list-open", !!r.lesson.list_open);
      setHtml($("r-head"), r.lesson.head);
      setHtml($("r-banner"), r.lesson.banner);
      patchChat($("r-chat"), r.lesson.chat);
      setHtml($("r-list"), r.lesson.list);
      setHtml($("r-status"), r.lesson.status);
      setHtml($("r-actions"), r.lesson.actions);
      setHtml($("r-ask"), r.lesson.ask);
    } else {
      setHtml($("view"), r.view);
    }
    if (m.focus_tick !== focusTick) {
      focusTick = m.focus_tick;
      focusNewest();
    }
  }

  // ---------- input ----------

  document.addEventListener("click", (ev) => {
    const dom = ev.target.closest("[data-dom]");
    if (dom) return domAction(dom);
    const el = ev.target.closest("[data-action]");
    if (!el || el.disabled || el.getAttribute("aria-disabled") === "true") return; // paused, but focusable (FR-054)
    if (el.type === "submit") ev.preventDefault(); // the form's own submit would send twice
    const keepFocus = el.getAttribute("role") === "tab" || el.hasAttribute("data-keep-focus");
    app.act(el.dataset.action, { tab: el.dataset.tab, skill: el.dataset.skill, short: SHORT.matches });
    if (!keepFocus) focusNewest();
  });

  // Flip and frame size are the frames' own state, so they stay in the DOM (FR-085).
  function domAction(el) {
    if (el.dataset.dom === "frame") return el.setAttribute("aria-expanded", String(el.getAttribute("aria-expanded") !== "true"));
    const sides = [...el.closest("[data-flipbox]").querySelectorAll("[data-side]")];
    const now = sides.findIndex((s) => !s.hidden);
    const next = (now + 1) % sides.length;
    sides.forEach((s, i) => { s.hidden = i !== next; });
  }

  // Home's ask box: the app keeps the draft, so Ask turns on with text and a redraw keeps it.
  document.addEventListener("input", (ev) => {
    if (ev.target && ev.target.id === "ask-q") app.setDraft(ev.target.value);
  });

  document.addEventListener("keydown", (ev) => {
    if (ev.target && ev.target.id === "ask-q" && askBoxKey(ev) === "send") {
      ev.preventDefault();
      app.setDraft(ev.target.value);
      app.act("ask_home");
      return;
    }
    if (ev.target.getAttribute && ev.target.getAttribute("role") === "tab") {
      const tab = nextTab(ev.target.dataset.tab, ev.key);
      if (!tab) return;
      ev.preventDefault();
      app.act("tab", { tab });
      $(`tab-${tab}`).focus();
    }
  });

  document.addEventListener("submit", (ev) => {
    if (ev.target.closest("[data-askhome]")) {
      ev.preventDefault();
      app.act("ask_home");
      return;
    }
    const follow = ev.target.closest("[data-followup]");
    if (follow) {
      ev.preventDefault();
      const box = follow.querySelector("input");
      if (app.followUp(box.value)) box.value = ""; // paused: what was typed stays
      return;
    }
    const form = ev.target.closest("[data-ask]");
    if (!form) return;
    ev.preventDefault();
    const input = form.querySelector("input");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    app.ask(text);
  });

  window.addEventListener("beforeunload", () => app && app.shutdown());

  // ---------- start-up ----------

  // Tells the setup check this panel version has loaded in AE (spec 006 T007). Before the config,
  // so a setup problem still shows the panel loaded. Never throws.
  writeLoadedStamp({ panelDir: DIR });

  const cfg = loadConfig();
  if (cfg.ok && cfg.runtime !== "a") {
    // B1 only: option A needs no runtime folder (spec 013 FR-017).
    try {
      cfg.runtime_path = ensureRuntime(cfg.repo_path, path.join(defaultHome(), "runtime"));
    } catch (e) {
      Object.assign(cfg, { ok: false, fix: `The panel couldn't set up its working folder (${e.message}). Run \`bash panel/install.sh\` from the repo, then reopen the panel.` });
    }
  }
  if (!cfg.ok) {
    // The one named exception (FR-055): builder-only, and stays as it is.
    $("view").textContent = cfg.fix;
    return;
  }

  const poller = createPoller({ read: () => readConnection(), onChange: (v) => app.setConnection(v) });
  app = createApp({
    cfg,
    createAdapter: (c) => (c.runtime === "a" ? createApiAdapter : createB1Adapter)(c),
    readRecord: () => readLearnerRecordAsync(),
    pathData: readPathData({ repoPath: cfg.repo_path }),
    skillsBuilt: readSkillsBuilt({ repoPath: cfg.repo_path }),
    session: {
      read: () => ps.readPanelSession({}),
      write: (s) => ps.writePanelSession({}, s),
      clear: () => ps.clearPanelSession({}),
      saveFrame: (im) => ps.saveFrame({}, im),
      readFrame: (file) => ps.readFrame({}, file),
      newSession: ps.newPanelSession,
      savedStatus: ps.savedStatus,
      readThread: () => ps.readThread({}),
      writeThread: (t) => ps.writeThread({}, t),
      clearThread: () => ps.clearThread({}),
    },
    appendTurn: (entry) => appendTurn({}, entry),
    bridgeStarted: () => bridgeStarted(),
    pollNow: () => poller.now(),
    forgetPoll: () => poller.forget(),
    log: (entry) => console.warn("[Knack] error", JSON.stringify(entry)),
    onChange: () => draw(),
  });
  app.init();
  poller.setVisible(!document.hidden);
  document.addEventListener("visibilitychange", () => poller.setVisible(!document.hidden));
})();
