// The panel's screens as HTML strings, from app.model() (spec 007 T015 to T024). Pure, so tests read
// exactly what a screen shows. Words come from copy.js; only the mentor's text goes through
// renderMentorText. Layout and classes follow the mockup's states (product/mockups/ui-overhaul).
"use strict";

const { COPY } = require("./copy.js");
const { escapeHtml: esc, renderMentorText } = require("./text.js");
const { stageOf } = require("./lesson.js");
const { shortDate } = require("./memory.js");
const { visibleKinds } = require("./requests.js");
const { rowsOf } = require("./checklist/index.js");

const TABS = ["home", "lesson", "skills"];

// FR-077: which tab a key moves to from `current`, or null for any other key.
function nextTab(current, key) {
  const i = TABS.indexOf(current);
  if (key === "ArrowRight") return TABS[(i + 1) % TABS.length];
  if (key === "ArrowLeft") return TABS[(i - 1 + TABS.length) % TABS.length];
  if (key === "Home") return TABS[0];
  if (key === "End") return TABS[TABS.length - 1];
  return null;
}

const CONN = { connected: ["ok", COPY.connection.connected], not_connected: ["bad", COPY.connection.not_connected], busy: ["busy", COPY.connection.busy] };

function navHtml(m) {
  const tab = (id, label) => `<button role="tab" id="tab-${id}" aria-controls="view" aria-selected="${m.tab === id}" tabindex="${m.tab === id ? 0 : -1}" data-action="tab" data-tab="${id}">${label}</button>`;
  const open = m.lesson_open ? `<span class="live" aria-hidden="true"></span><span class="sr">${esc(COPY.tabs.open)}</span>` : "";
  const c = m.connection && CONN[m.connection.state];
  const conn = c ? `<span class="conn ${c[0]}" title="${esc(COPY.connection.title)}"><span class="dot" aria-hidden="true"></span>${esc(c[1])}</span>` : "";
  return `<div class="nav"><div role="tablist" aria-label="Knack">${tab("home", COPY.tabs.home)}${tab("lesson", `${COPY.tabs.lesson}${open}`)}${tab("skills", COPY.tabs.skills)}</div>${conn}</div>`;
}

function btn(label, action, cls, attrs) {
  return `<button type="button" class="${cls || ""}" data-action="${action}"${attrs ? ` ${attrs}` : ""}>${esc(label)}</button>`;
}
const pressed = (verb) => `<button type="button" class="pressed" disabled aria-busy="true"><span class="spin" aria-hidden="true"></span>${esc(verb)}</button>`;

function banner(kind, title, body, actions) {
  const ic = { bad: "!", warn: "!", info: "i" }[kind];
  const role = kind === "info" ? "status" : "alert";
  return `<div class="banner ${kind}" role="${role}" tabindex="-1"><span class="ic" aria-hidden="true">${ic}</span><div><b>${esc(title)}</b>${body ? `<p>${esc(body)}</p>` : ""}${actions ? `<div class="row">${actions}</div>` : ""}</div></div>`;
}

const statusline = (text) => (text ? `<div class="statusline" role="status" aria-live="polite"><span class="spin" aria-hidden="true"></span><span class="st">${esc(text)}</span></div>` : "");

// ---------- Home ----------

function memoryCard(h, hasHistory) {
  const v = h.memory;
  const bits = v.empty
    ? `<p>${esc(v.text)}</p>`
    : `<p><strong>${esc(v.date)}</strong> · ${esc(v.skill)} · ${esc(v.result)}</p>${v.next ? `<p>${esc(COPY.home.next_time)} ${esc(v.next)}</p>` : ""}${hasHistory ? btn(COPY.buttons.all_skills, "pick_skill", "quiet") : ""}`;
  return `<section class="memory" aria-label="${esc(h.memory_title)}"><h2 class="lbl">${esc(h.memory_title)}</h2>${bits}</section>`;
}

function upNextCard(h, o) {
  const u = h.up_next;
  if (!u) return "";
  const go = o.off ? `<p class="later">${esc(o.reason)}</p>` : u.start ? btn(u.start.label, "start", o.dim ? "" : "primary") : "";
  const pick = o.lessonOpen ? "" : btn(u.pick_skill, "pick_skill");
  return `<section class="card lead${o.dim ? " dim" : ""}" aria-label="${esc(COPY.home.up_next)}"><div class="kicker accent">${esc(COPY.home.up_next)}</div><h3 data-title tabindex="-1">${esc(u.name)}</h3><p class="why">${esc(u.why)}</p><div class="row">${go}${pick}</div></section>`;
}

function homeCards(m, o) {
  const h = m.home;
  const hello = o.hideHello || !h.hello ? "" : `<p class="hello">${esc(h.hello.text)}${h.hello.sub ? `<small>${esc(h.hello.sub)}</small>` : ""}</p>`;
  return `${hello}${upNextCard(h, o)}${memoryCard(h, h.has_history)}`;
}

const focusText = (v) => (v && Array.isArray(v.focus) && v.focus.length ? v.focus.join(", ") : null);

function lessonTitle(m, v) {
  const name = m.names[v.skill] || COPY.home.a_skill;
  const focus = focusText(v);
  return focus ? COPY.lesson.on(name, focus) : name;
}

// Lesson in progress, or Your lesson is waiting (FR-024, FR-026).
function lessonCard(m, kind) {
  const saved = kind === "waiting" ? m.saved_lesson : null;
  const v = saved ? saved.lesson : m.lesson;
  const copy = kind === "waiting" ? COPY.home.cutoff : COPY.home.lesson_open;
  const l = v && v.check_list;
  const bits = [l && l.summary, saved && l && l.checked_at ? `${COPY.lesson.last_check} ${checkClock(l.checked_at)}` : null].filter(Boolean).join(" · ");
  const actions = kind === "waiting"
    ? btn(COPY.buttons.continue, "continue", "primary") + btn(copy.set_aside, "set_aside")
    : btn(COPY.buttons.back_lesson, "back_lesson", "primary") + btn(COPY.buttons.end_lesson, "end_lesson");
  return `<section class="card lead note" aria-label="${esc(copy.kicker)}"><div class="kicker accent">${esc(copy.kicker)}</div><h3 data-title tabindex="-1">${esc(v ? lessonTitle(m, v) : "")}</h3>${bits ? `<p class="meta">${esc(bits)}</p>` : ""}<div class="row">${actions}</div><p class="meta">${esc(copy.note)}</p></section>`;
}

function checkClock(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const h = d.getHours();
  return `${shortDate(iso)}, ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}

function homeBody(m) {
  switch (m.state) {
    case "err-mentor": case "err-key": case "err-credit":
      return { banner: banner("bad", m.error.title, m.error.body, btn(COPY.buttons.try_again, "try_again")),
        cards: `${m.lesson_open ? lessonCard(m, "open") : ""}${homeCards(m, { off: true, reason: COPY.paused.needs_mentor, lessonOpen: m.lesson_open, hideHello: m.lesson_open })}` };
    case "home-lessonopen":
      return { banner: "", cards: `${lessonCard(m, "open")}${homeCards(m, { off: true, reason: COPY.paused.after_lesson, lessonOpen: true, hideHello: true })}` };
    case "home-cutoff":
      return { banner: "", cards: `${lessonCard(m, "waiting")}${homeCards(m, { dim: true, hideHello: true })}` };
    case "home-aeclosed":
      return { banner: banner("info", COPY.home.aeclosed.title, COPY.home.aeclosed.body, btn(COPY.buttons.got_it, "got_it_aeclosed")), cards: homeCards(m, {}) };
    case "home-unreachable":
      return { banner: banner("bad", COPY.home.unreachable.title, COPY.home.unreachable.body, m.reconnecting ? pressed(COPY.buttons.pressed.find) : btn(COPY.buttons.try_again, "reconnect")),
        cards: homeCards(m, { off: true, reason: COPY.paused.needs_ae }) };
    case "home-busy":
      return { banner: banner("warn", COPY.home.busy.title, COPY.home.busy.body, m.reconnecting ? pressed(COPY.buttons.pressed.find) : btn(COPY.buttons.try_again, "reconnect")),
        cards: homeCards(m, { off: true, reason: COPY.paused.waiting_ae }) };
    case "home-unreadable":
      return { banner: banner("warn", COPY.home.unreadable.title, COPY.home.unreadable.body, btn(COPY.buttons.what_happened, "what_happened")), cards: homeCards(m, { hideHello: true }) };
    case "home-unreadable-why":
      return { banner: banner("warn", COPY.home.unreadable_why.title, COPY.home.unreadable_why.body, btn(COPY.buttons.got_it, "got_it_unreadable")), cards: homeCards(m, { hideHello: true }) };
    default:
      return { banner: "", cards: homeCards(m, {}) };
  }
}

const SKELETON = `<div class="scroll" aria-busy="true"><div class="skel skel-55"></div><div class="skel skel-80"></div><div class="card"><div class="skel skel-30"></div><div class="skel skel-60"></div><div class="skel"></div></div><div class="card"><div class="skel skel-30"></div><div class="skel"></div><div class="skel skel-70"></div></div></div>`;

function homeHtml(m) {
  if (m.state === "home-loading") return SKELETON + statusline(COPY.status.history);
  if (m.record && m.record.status === "pending") return "";
  const b = homeBody(m);
  const status = m.reconnecting ? statusline(COPY.status.looking_ae) : "";
  return `${b.banner}<div class="scroll">${b.cards}</div>${status}`;
}

// ---------- the Lesson tab ----------

const LABELS = COPY.buttons;

function lessonNoneHtml() {
  return `<div class="scroll"><p class="hello" data-title tabindex="-1">${esc(COPY.lesson.none_title)}<small>${esc(COPY.lesson.none_sub)}</small></p><div class="row">${btn(LABELS.go_home, "go_home", "primary")}${btn(LABELS.pick_skill, "pick_skill")}</div></div>`;
}

const MARK = { done: "✓", current: "●", upcoming: "○" };
const CLASS = { done: "done", current: "current", upcoming: "up" };
const WORD = { done: "done", current: "now", upcoming: "to come" };

function stripHtml(view) {
  return `<ol class="strip" aria-label="Lesson progress">${stageOf(view).steps.map((s) => `<li class="${CLASS[s.state]}"${s.state === "current" ? ' aria-current="step"' : ""}><span class="mk" aria-hidden="true">${MARK[s.state]}</span>${esc(s.label)}<span class="sr"> (${WORD[s.state]})</span></li>`).join("")}</ol>`;
}

function headTitle(m) {
  if (m.state === "lesson-starting") return COPY.lesson.looking;
  if (m.state === "lesson-start-failed") return COPY.lesson.didnt_start;
  return focusText(m.lesson) || COPY.lesson.your_comp;
}

function headTag(m) {
  const v = m.lesson;
  if (m.state === "lesson-passed-asking") return `<span class="tag pass">${esc(COPY.lesson.check_passed_tag)}</span>`;
  if (m.state === "lesson-passed-unsaved" || (m.state === "lesson-passed" && v.passed)) return `<span class="tag pass">${esc(COPY.lesson.passed_tag)}</span>`;
  return v.checks > 0 ? `<span class="tag">${esc(COPY.lesson.check_tag(v.checks))}</span>` : "";
}

function headHtml(m) {
  const v = m.lesson;
  const name = m.names[v.skill] || "";
  return `<div class="lhead"><button type="button" class="back" data-action="go_home" aria-label="${esc(COPY.back.lesson)}" title="${esc(COPY.back.lesson)}">‹</button><div class="ltitle"><span class="kicker">${esc(name)}</span><strong>${esc(headTitle(m))}</strong></div>${headTag(m)}</div>${stripHtml(v)}`;
}

// D6: saved with no pass has no state of its own; it keeps its screen, adds Saved and the ways out, and says nothing about a pass.
const savedNoPass = (v) => !!v && v.saved === true && !v.passed;

function lessonBanner(m) {
  const s = m.state;
  if (savedNoPass(m.lesson)) return banner("info", COPY.lesson.saved, "");
  if (s === "lesson-passed") return banner("info", COPY.lesson.passed, `✓ ${COPY.lesson.saved}`);
  if (s === "lesson-passed-unsaved") return banner("warn", COPY.lesson.unsaved.title, COPY.lesson.unsaved.body);
  if (s === "lesson-passed-asking") return banner("info", COPY.lesson.check_passed, COPY.lesson.one_more_question);
  if (m.error && m.error.blocks_home) return banner("bad", m.error.title, m.error.body, btn(COPY.buttons.try_again, "try_again"));
  return "";
}

function frameHtml(src, i) {
  if (!src) return `<div class="frame-missing">${esc(COPY.lesson.frame_gone)}</div>`;
  return `<figure class="frame"><button type="button" class="framebtn" data-dom="frame" aria-expanded="false" aria-label="${esc(COPY.buttons.frame_bigger)}"><img src="${esc(src)}" alt="${esc(COPY.buttons.frame_alt)}" /></button></figure>`;
}

function framesHtml(srcs) {
  if (!srcs || !srcs.length) return "";
  if (srcs.length < 2 || srcs.some((s) => !s)) return srcs.map(frameHtml).join("");
  const sides = srcs.map((s, i) => `<div data-side="${i}"${i === srcs.length - 1 ? "" : " hidden"}>${frameHtml(s, i)}</div>`).join("");
  return `<div class="flip" data-flipbox>${sides}<button type="button" class="quiet" data-dom="flip" aria-label="${esc(COPY.buttons.flip_aria)}">${esc(COPY.buttons.flip)}</button></div>`;
}

function messageHtml(m) {
  if (m.role === "learner") return `<div class="msg learner"><span>${esc(m.text)}</span></div>`;
  if (m.role === "notice") return `<div class="msg notice" role="status" tabindex="-1">${m.title ? `<b>${esc(m.title)}</b> ` : ""}${esc(m.text)}</div>`;
  if (m.role === "change") {
    const sep = COPY.lesson.changed_in_comp;
    const text = m.text.startsWith(sep) ? `<b>${esc(sep)}</b>${esc(m.text.slice(sep.length))}` : esc(m.text);
    return `<div class="msg change">${text}</div>`;
  }
  if (m.role === "divider") return `<div class="divider">${esc(m.text)}</div>`;
  if (m.role === "resuming") return `<p class="resuming" role="status">${esc(m.text)}</p>`;
  return `<div class="msg mentor" tabindex="-1"><div class="who">${esc(COPY.mentor_label)}</div>${renderMentorText(m.text)}${framesHtml(m.srcs)}${m.cut_off ? `<p class="cutoff">${esc(COPY.lesson.cut_off)}</p>` : ""}</div>`;
}

// FR-085: older turns fold. The newest turn is the last learner message and what follows; while a
// reply is pending, the turn before it stays in view too.
function chatRegion(m) {
  if (m.state === "lesson-starting") {
    const items = [`<div class="msg mentor"><div class="who">${esc(COPY.mentor_label)}</div><div class="skel skel-85"></div><div class="skel skel-70"></div><div class="skel skel-40"></div></div>`];
    return { items };
  }
  const msgs = m.messages;
  let last = -1;
  for (let i = msgs.length - 1; i >= 0; i--) if (msgs[i].role === "learner") { last = i; break; }
  let foldAt = last;
  if (last >= 0 && last === msgs.length - 1) {
    foldAt = -1;
    for (let i = last - 1; i >= 0; i--) if (msgs[i].role === "learner") { foldAt = i; break; }
  }
  if (foldAt > 0 && msgs[foldAt - 1].role === "divider") foldAt--;
  if (foldAt <= 0) return { items: msgs.map(messageHtml) };
  const folded = msgs.slice(0, foldAt);
  const turns = folded.filter((x) => x.role === "mentor").length;
  if (!turns) return { items: msgs.map(messageHtml) };
  return { earlier: `<details class="earlier"><summary>${esc(COPY.lesson.earlier(turns))}</summary>${folded.map(messageHtml).join("")}</details>`, items: msgs.slice(foldAt).map(messageHtml) };
}

function rowHtml(r) {
  return `<li class="${r.family}${r.changed ? " fresh" : ""}"><span class="g" aria-hidden="true">${esc(r.glyph)}</span><span class="what"><span class="lab">${esc(r.subject)}</span>${r.detail ? `<small>${esc(r.detail)}</small>` : ""}</span><span class="st">${esc(r.word)}</span></li>`;
}

// At the opening the list is the mentor's whole read: the first section's rows, then a count for the
// rest, as the mockup draws it (README › The Proposed moment).
function visibleSections(l) {
  if (l.source !== "opening" || l.sections.length < 2) return { sections: l.sections, foldLine: null };
  const [first, ...rest] = l.sections;
  const n = rest.reduce((sum, s) => sum + s.rows.length, 0);
  const names = rest.map((s) => s.title).filter(Boolean);
  const joined = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0] || "";
  return { sections: [first], foldLine: COPY.check.more_on(n, joined) };
}

const COLLAPSED_BY_DEFAULT = new Set(["lesson-error", "lesson-error-demo", "lesson-error-demo-other", "lesson-error-demo-unknown", "lesson-passed", "lesson-passed-asking", "lesson-passed-unsaved"]);

function listHtml(m) {
  const v = m.lesson;
  const l = v.check_list;
  if (!l) return m.state === "lesson-starting" ? `<section class="check" aria-label="${esc(COPY.check.aria)}"><div class="check-body"><p class="emptyl"><span aria-hidden="true">○</span> ${esc(COPY.check.slot_starting)}</p></div></section>` : "";
  const { sections, foldLine } = visibleSections(l);
  const nDone = rowsOf(l).filter((r) => r.family === "done").length;
  const collapsed = !m.list_open && (m.list_collapsed === null ? COLLAPSED_BY_DEFAULT.has(m.state) : m.list_collapsed);
  const body = sections.map((s) => {
    const allDone = s.rows.length > 0 && s.rows.every((r) => r.family === "done");
    return `${s.title ? `<h3${allDone ? ' class="alld"' : ""}>${esc(s.title)}</h3>` : ""}<ul>${s.rows.map(rowHtml).join("")}</ul>`;
  }).join("");
  const fold = nDone >= 2 ? `<button type="button" class="foldline" data-action="fold_done" data-keep-focus aria-expanded="${!!m.done_unfolded}"><span aria-hidden="true">✓</span> ${esc(COPY.check.done_fold(nDone, m.done_unfolded))}</button>` : "";
  const lines = [foldLine, l.more].filter(Boolean).map((t) => `<p class="more">${esc(t)}</p>`).join("");
  const outside = l.outside && l.outside.length ? `<h3>${esc(COPY.check.outside)}</h3><ul class="plain">${l.outside.map((o) => `<li><span class="what">${esc(o)}</span></li>`).join("")}</ul>` : "";
  const cls = ["check", m.done_unfolded ? "unfold" : "", l.stale ? "stale" : ""].filter(Boolean).join(" ");
  return `<section class="${cls}" aria-label="${esc(COPY.check.aria)}"><button type="button" class="check-head" aria-expanded="${!collapsed}" data-action="toggle_list" data-keep-focus><span class="chev" aria-hidden="true"><span class="ch-tall">${collapsed ? "▸" : "▾"}</span><span class="ch-short">▸</span><span class="ch-short-open">▾</span></span><span class="sum">${esc(l.summary)}${l.sub ? `<small>${esc(l.sub)}</small>` : ""}</span></button><div class="check-body"${collapsed ? " hidden" : ""}>${l.stale ? `<p class="stale-note">${esc(l.stale)}</p>` : ""}${fold}${body}${lines}${outside}</div></section>`;
}

const whyOff = (text) => `<div class="actions"><p class="why-off">${esc(text)}</p></div>`;
const buttonOf = (kind) => ({ check: [LABELS.check, "check"], hint: [LABELS.hint, "hint"], show_me: [LABELS.show_me, "show_me"], show_me_again: [LABELS.show_me_again, "show_me_again"] }[kind]);

function actionsHtml(m) {
  const v = m.lesson;
  const s = m.state;
  const t = m.turn || {};
  const busy = !!t.busy;
  if (s === "lesson-exited") return `<div class="actions">${btn(LABELS.start, "start", "primary")}${btn(LABELS.back_home, "back_home")}</div>`;
  if (s === "lesson-start-failed") return `<div class="actions">${btn(LABELS.try_again, "try_again", "primary")}${btn(LABELS.back_home, "back_home")}</div>`;
  if (s === "lesson-passed" || savedNoPass(v)) return `<div class="actions">${btn(LABELS.whats_next, "whats_next", "primary")}${btn(LABELS.see_skills, "see_skills")}</div>`;
  if (s === "lesson-passed-unsaved") return `<div class="actions">${btn(LABELS.whats_next, "whats_next", "primary")}</div>`;
  if (s === "lesson-passed-asking") return "";
  if (s === "lesson-starting") return whyOff(COPY.paused.after_look);
  if (busy && !t.pressed) return whyOff(COPY.paused.after_answer);
  if (m.error && m.error.blocks_home) return whyOff(COPY.paused.needs_mentor);

  const press = busy ? t.pressed : null;
  const verb = (action, label, cls) => {
    if (press === action) return pressed(COPY.buttons.pressed[VERB_KEY[action]]);
    return `<button type="button" class="${cls || ""}" data-action="${action}"${busy ? " disabled" : ""}>${esc(label)}</button>`;
  };

  if (m.error && m.error.state !== "lesson-start-failed" && !m.error.blocks_home) {
    const parts = [];
    if (m.error.try_again && m.retry_kind) {
      if (m.retry_same) parts.push(verb("try_again", LABELS.try_again, "primary"));
      else if (m.retry_kind !== "check") parts.push(verb(m.retry_kind, buttonOf(m.retry_kind)[0], "primary"));
    }
    if (m.retry_kind !== "check" || !m.error.try_again) parts.push(verb("check", LABELS.check, parts.length ? "" : "primary"));
    else parts.push(verb("check", LABELS.check, "primary"));
    return `<div class="actions">${parts.join("")}</div>`;
  }
  if (s === "lesson-stale") {
    return `<div class="actions">${verb("check_again", LABELS.check_again, "primary")}<button type="button" disabled>${esc(LABELS.hint)}</button><p class="why-off">${esc(COPY.paused.hint_needs_ae)}</p></div>`;
  }
  const parts = visibleKinds(v, { lessonOpen: true }).map((kind, i) => {
    const [label, action] = buttonOf(kind);
    return verb(action, label, i === 0 ? "primary" : "");
  });
  return `<div class="actions">${parts.join("")}</div>`;
}

const VERB_KEY = { check: "check", check_again: "check", hint: "hint", show_me: "show", show_me_again: "show", try_again: "try", continue: "open" };

function askHtml(m) {
  const s = m.state;
  if (["lesson-exited", "lesson-start-failed", "lesson-passed", "lesson-passed-unsaved"].includes(s) || savedNoPass(m.lesson)) return "";
  const open = m.lesson_open && !(m.turn && m.turn.busy) && !m.error;
  return `<form class="ask" data-ask autocomplete="off"><label class="sr" for="ask-in">${esc(COPY.ask_label)}</label><input id="ask-in" type="text" placeholder="${esc(COPY.ask_placeholder)}"${open ? "" : " disabled"} /><button type="submit" aria-label="${esc(COPY.buttons.send)}"${open ? "" : " disabled"}>⏎</button></form>`;
}

function lessonRegions(m) {
  return {
    head: headHtml(m),
    banner: lessonBanner(m),
    chat: chatRegion(m),
    list: listHtml(m),
    status: statusline(m.turn && m.turn.busy ? m.turn.status : null),
    actions: actionsHtml(m),
    ask: askHtml(m),
    list_open: !!m.list_open,
  };
}

// Step 1's interim (plan P9): one line and the same start as Home. T050 replaces it.
function skillsHtml(m) {
  const u = m.home.up_next;
  const off = homeOff(m);
  const go = !u ? "" : off ? `<p class="later">${esc(off)}</p>` : u.start ? btn(u.start.label, "start", "primary") : "";
  return `<div class="scroll"><p class="hello" data-title tabindex="-1">${esc(COPY.skills.title)}<small>${esc(COPY.skills.interim_line)}</small></p><div class="row">${go}</div></div>`;
}

function homeOff(m) {
  if (m.lesson_open) return COPY.paused.after_lesson;
  if (m.error && m.error.blocks_home) return COPY.paused.needs_mentor;
  const conn = m.connection && m.connection.state;
  if (conn === "not_connected") return COPY.paused.needs_ae;
  if (conn === "busy") return COPY.paused.waiting_ae;
  return null;
}

function renderApp(m) {
  const nav = navHtml(m);
  if (m.tab === "home") return { nav, view: homeHtml(m), lesson: null };
  if (m.tab === "skills") return { nav, view: skillsHtml(m), lesson: null };
  if (!m.lesson || m.state === "lesson-none" || /^err-/.test(m.state) && !m.lesson_open) return { nav, view: `${/^err-/.test(m.state) ? banner("bad", m.error.title, m.error.body, btn(COPY.buttons.try_again, "try_again")) : ""}${lessonNoneHtml()}`, lesson: null };
  return { nav, view: "", lesson: lessonRegions(m) };
}

module.exports = { renderApp, nextTab, TABS, banner, btn, pressed, statusline };
