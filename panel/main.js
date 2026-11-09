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
  const { readConnection, createPoller } = lib("connection.js");
  const { bridgeStarted } = lib("bridge-status.js");
  const { appendTurn } = lib("turns.js");
  const ps = lib("panel-session.js");
  const { createApp } = lib("app.js");
  const { renderApp, nextTab } = lib("screens.js");

  const $ = (id) => document.getElementById(id);
  const SHORT = window.matchMedia("(max-height: 560px)");

  // ---------- drawing: only what changed, so scroll, focus and Flip survive a redraw ----------

  function setHtml(el, html) {
    if (el.__html === html) return;
    const list = el.querySelector && el.querySelector(".check-body");
    const top = list ? list.scrollTop : 0;
    el.innerHTML = html;
    el.__html = html;
    const after = el.querySelector && el.querySelector(".check-body");
    if (after) after.scrollTop = top;
  }

  function patchChat(el, chat) {
    const want = (chat.earlier ? [chat.earlier] : []).concat(chat.items);
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
    if (!el || el.disabled) return;
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

  document.addEventListener("keydown", (ev) => {
    if (ev.target.getAttribute && ev.target.getAttribute("role") === "tab") {
      const tab = nextTab(ev.target.dataset.tab, ev.key);
      if (!tab) return;
      ev.preventDefault();
      app.act("tab", { tab });
      $(`tab-${tab}`).focus();
    }
  });

  document.addEventListener("submit", (ev) => {
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
    session: {
      read: () => ps.readPanelSession({}),
      write: (s) => ps.writePanelSession({}, s),
      clear: () => ps.clearPanelSession({}),
      saveFrame: (im) => ps.saveFrame({}, im),
      readFrame: (file) => ps.readFrame({}, file),
      newSession: ps.newPanelSession,
      savedStatus: ps.savedStatus,
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
