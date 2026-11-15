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
const { listCollapsed } = require("./view-state.js");
const { skillById } = require("./skills.js");
const PHASE = require("./phase.js");

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

// ---------- Home, ask-first (spec 014 FR-055, MU › Home) ----------

const A = COPY.ask;

// What the mentor remembers: drawn on Skills since spec 014 (FR-050 moved), under the path.
function memoryCard(h) {
  const v = h.memory;
  const bits = v.empty
    ? `<p>${esc(v.text)}</p>`
    : `<p><strong>${esc(v.date)}</strong> · ${esc(v.skill)} · ${esc(v.result)}</p>${v.next ? `<p>${esc(COPY.home.next_time)} ${esc(v.next)}</p>` : ""}`;
  return `<section class="memory" aria-label="${esc(h.memory_title)}"><h2 class="lbl">${esc(h.memory_title)}</h2>${bits}</section>`;
}

// The ask card (MU askCard). Paused, Ask stays focusable (aria-disabled) with its reason linked
// (FR-054); an empty box links "Type a question first." for screen readers. The box keeps what was
// typed: main.js restores its value and focus across redraws.
function askCard(m) {
  const off = m.ask_off;
  const sending = m.ask.sending;
  const lock = m.lesson_open;
  const empty = !m.draft;
  const go = sending
    ? `<button type="button" id="ask-go" class="primary pressed" aria-disabled="true" aria-busy="true" aria-describedby="ask-why"><span class="spin" aria-hidden="true"></span>${esc(A.pressed)}</button>`
    : `<button type="submit" id="ask-go" class="primary" data-action="ask_home" data-keep-focus aria-disabled="${!!off || empty}" aria-describedby="ask-why${!off && empty ? " ask-empty" : ""}">${esc(A.button)}</button><span class="sr" id="ask-empty">${esc(A.empty)}</span>`;
  return `<section class="card lead askcard" aria-label="${esc(A.card_title)}"><h3 data-title tabindex="-1">${esc(A.card_title)}</h3>`
    + `<form data-askhome autocomplete="off"><label class="small" for="ask-q">${esc(A.label)}</label>`
    + `<textarea id="ask-q" rows="3" data-keep-value${lock ? " disabled" : sending ? " readonly" : ""}>${esc(m.draft_text || "")}</textarea>`
    + `<div class="row between"><p class="meta" id="ask-why">${esc(off && !sending ? off : A.hint)}</p>${go}</div></form></section>`;
}

const chev = `<span class="chev" aria-hidden="true">›</span>`;

// The one quiet line (decisions/012): a lesson open, else a lesson in progress, else Find my next
// lesson. Long names are drawn short; the full text is the title and the accessible name.
function quietLine(m) {
  if (m.lesson_open && m.lesson) {
    const title = lessonTitle(m, m.lesson);
    const sum = m.lesson.check_list && m.lesson.check_list.summary;
    const full = [COPY.quiet.back_lesson, title, sum].filter(Boolean).join(". ");
    const answering = !!m.turn && !!m.turn.busy; // FR-060, FR-061
    const end = btn(COPY.buttons.end_lesson, "end_lesson", "quiet", answering ? 'aria-disabled="true" aria-describedby="end-why"' : "");
    const why = answering ? `<span id="end-why">${esc(COPY.paused.end_after_answer)}</span>` : esc(COPY.quiet.end_note);
    return `<div class="quietwrap"><button type="button" class="qline" data-action="back_lesson" title="${esc(full)}" aria-label="${esc(full)}"><span class="ql">${esc(COPY.quiet.back_lesson)}<small>${esc([title, sum].filter(Boolean).join(" · "))}</small></span>${chev}</button><p class="aside meta">${end} ${why}</p></div>`;
  }
  const off = m.quiet_off;
  if (m.saved === "waiting" && m.saved_lesson) {
    const v = m.saved_lesson.lesson || {};
    const skill = m.names[v.skill] || COPY.home.a_skill;
    const title = COPY.quiet.pick_up(skill, focusText(v));
    const l = v.check_list;
    const sub = [l && l.summary, l && l.checked_at ? `${COPY.lesson.last_check} ${checkClock(l.checked_at)}` : null].filter(Boolean).join(" · ");
    const full = [title, sub, off].filter(Boolean).join(". ");
    const attrs = off ? `aria-disabled="true" aria-describedby="quiet-why"` : `data-action="continue"`;
    return `<div class="quietwrap"><button type="button" class="qline" ${attrs} title="${esc(full)}" aria-label="${esc(full)}"><span class="ql">${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ""}</span>${chev}</button>`
      + `${off ? `<p class="aside meta" id="quiet-why">${esc(off)}</p>` : ""}<p class="aside meta">${esc(COPY.quiet.not_finished)} ${btn(COPY.home.cutoff.set_aside, "set_aside", "quiet")}</p></div>`;
  }
  const label = COPY.buttons.find_next;
  const attrs = off ? `aria-disabled="true" aria-describedby="quiet-why"` : `data-action="find_next"`;
  return `<div class="quietwrap"><button type="button" class="qline" ${attrs} title="${esc(off ? `${label}. ${off}` : label)}"><span class="ql">${esc(label)}${off ? `<small id="quiet-why">${esc(off)}</small>` : ""}</span>${chev}</button></div>`;
}

function homeCards(m, o) {
  const h = m.home;
  const hello = (o && o.hideHello) || !h.hello ? "" : `<p class="hello">${esc(h.hello.text)}</p>`;
  const link = m.ask.thread ? `<div class="thread-link">${btn(A.back_to_question, "back_question", "quiet")}</div>` : "";
  return `${hello}${askCard(m)}${quietLine(m)}${link}`;
}

const focusText = (v) => (v && Array.isArray(v.focus) && v.focus.length ? v.focus.join(", ") : null);

function lessonTitle(m, v) {
  if (m.picking) return COPY.lesson.picking_title;
  const name = m.names[v.skill] || COPY.home.a_skill;
  const focus = focusText(v);
  return focus ? COPY.lesson.on(name, focus) : name;
}

function checkClock(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const h = d.getHours();
  return `${shortDate(iso)}, ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}

function homeBody(m) {
  const tryBtn = m.reconnecting ? pressed(COPY.buttons.pressed.find) : btn(COPY.buttons.try_again, "reconnect");
  switch (m.state) {
    case "err-mentor": case "err-key": case "err-credit":
      return { banner: banner("bad", m.error.title, m.error.body, btn(COPY.buttons.try_again, "try_again")), cards: homeCards(m, { hideHello: m.lesson_open }) };
    case "home-aeclosed":
      return { banner: banner("info", COPY.home.aeclosed.title, COPY.home.aeclosed.body, btn(COPY.buttons.got_it, "got_it_aeclosed")), cards: homeCards(m) };
    case "home-unreachable":
      return { banner: banner("bad", COPY.home.unreachable.title, COPY.home.unreachable.body, tryBtn), cards: homeCards(m) };
    case "home-busy":
      return { banner: banner("warn", COPY.home.busy.title, COPY.home.busy.body, tryBtn), cards: homeCards(m) };
    case "home-unreadable":
      return { banner: banner("warn", COPY.home.unreadable.title, COPY.home.unreadable.body, btn(COPY.buttons.what_happened, "what_happened")), cards: homeCards(m, { hideHello: true }) };
    case "home-unreadable-why":
      return { banner: banner("warn", COPY.home.unreadable_why.title, COPY.home.unreadable_why.body, btn(COPY.buttons.got_it, "got_it_unreadable")), cards: homeCards(m, { hideHello: true }) };
    default:
      return { banner: "", cards: homeCards(m, { hideHello: m.lesson_open }) };
  }
}

// One card and one line (MU home-loading).
const SKELETON = `<div class="scroll" aria-busy="true"><div class="card"><div class="skel skel-30"></div><div class="skel skel-55"></div><div class="skel skel-box"></div><div class="skel skel-30 skel-end"></div></div><div class="skel skel-60"></div></div>`;

function homeHtml(m) {
  if (m.state === "home-loading") return SKELETON + statusline(COPY.status.history);
  if (m.record && m.record.status === "pending") return "";
  const b = homeBody(m);
  let status = m.reconnecting ? statusline(COPY.status.looking_ae) : "";
  if (m.ask.sending) status = statusline(A.reading);
  return `${b.banner}<div class="scroll">${b.cards}</div>${status}`;
}

// ---------- the ask thread (spec 014 T023, MU › Asking) ----------

const learnerMsg = (text) => `<div class="msg learner"><span>${esc(text)}</span></div>`;
const skeletonMsg = () => `<div class="msg mentor" aria-busy="true"><div class="who">${esc(COPY.mentor_label)}</div><div class="skel skel-85"></div><div class="skel skel-70"></div><div class="skel skel-40"></div></div>`;

function stepItems(steps) {
  return steps.map((st) => `<li>${esc(st.text)}${st.tag ? ` <em class="skill">${esc(st.tag)}</em>` : ""}</li>`).join("");
}

// One Go deeper per offer, inside its answer (FR-048, FR-050). Gray, not primary: the usual choice
// is to try the steps. Paused, it stays focusable with its reason linked.
function deeperHtml(m, offers, i) {
  if (!PHASE.FLAGS.go_deeper || !offers.length) return ""; // phase 2 (lib/phase.js)
  const off = m.follow_off;
  const pressedSkill = m.ask.busy ? m.ask.pressed : null;
  const why = `deeper-why-${i}`;
  const btns = offers.map((o) => {
    if (pressedSkill === o.skill) return pressed(COPY.buttons.pressed.start);
    return off && !pressedSkill
      ? `<button type="button" class="deeper-btn" aria-disabled="true" aria-describedby="${why}">${esc(A.go_deeper(o.tag))}</button>`
      : `<button type="button" class="deeper-btn" data-action="go_deeper" data-skill="${esc(o.skill)}"${pressedSkill ? ` aria-disabled="true" aria-describedby="${why}"` : ""}>${esc(A.go_deeper(o.tag))}</button>`;
  }).join("");
  const reason = off && !pressedSkill ? off : pressedSkill ? A.answering : null;
  return `<div class="deeper">${btns}${reason ? `<p class="why-off" id="${why}">${esc(reason)}</p>` : ""}</div>`;
}

// FR-048: explanation, then (only with steps) the Steps heading and the numbered list from the step
// data, then the closing offer, then Go deeper. The turn's prose isn't drawn beside a valid view
// (research R2). With no view, the mentor's words as they came.
function answerHtml(m, entry, i, srcs, frames) {
  const v = entry.view;
  const pics = framesHtml(srcs || []);
  if (!v) {
    if (!entry.prose) return "";
    return `<div class="msg mentor" tabindex="-1"><div class="who">${esc(COPY.mentor_label)}</div>${renderMentorText(entry.prose)}${pics}</div>`;
  }
  const steps = v.steps.length
    ? `<section class="stepsblock" aria-labelledby="ask-steps-h-${i}"><h3 class="steps-lbl" id="ask-steps-h-${i}">${esc(A.steps)}</h3><ol class="ans">${stepItems(v.steps)}</ol></section>`
    : "";
  const offers = entry.folded ? [] : v.offers;
  return `<div class="msg mentor" tabindex="-1"><div class="who">${esc(COPY.mentor_label)}</div>${renderMentorText(v.explanation)}${pics}${steps}${v.closing_offer ? renderMentorText(v.closing_offer) : ""}${deeperHtml(m, offers, i)}</div>`;
}

function entryHtml(m, entry, i) {
  const parts = [learnerMsg(entry.text)];
  const last = i === m.thread.questions.length - 1;
  if (last && m.ask_turn) {
    // In flight: the answer's view as soon as it's in, else any prose as it streams, else a skeleton.
    const live = Object.assign({}, entry, { view: m.ask_turn.view, prose: m.ask_turn.committed || null });
    parts.push(answerHtml(m, live, i, m.ask_turn.srcs) || skeletonMsg());
  } else {
    parts.push(answerHtml(m, entry, i, (m.ask_frames || {})[i]));
  }
  if (entry.notice) parts.push(`<div class="msg notice" role="status" tabindex="-1">${entry.notice.title ? `<b>${esc(entry.notice.title)}</b> ` : ""}${esc(entry.notice.text)}</div>`);
  return parts.filter(Boolean).join("");
}

function threadChat(m) {
  const th = m.thread;
  const items = [];
  let earlier = null;
  const folded = [];
  th.questions.forEach((q, i) => {
    const html = entryHtml(m, q, i);
    if (q.folded) folded.push(html);
    else items.push(`<div class="turn">${html}</div>`);
  });
  if (folded.length) {
    const n = th.questions.filter((q) => q.folded && q.kind === "question").length;
    earlier = `<details class="earlier"><summary>${esc(A.earlier(n))}</summary>${folded.join("")}</details>`;
  }
  return { earlier, items };
}

// Your steps (FR-049): the checklist frame, folded, holding only the latest answer's steps. No
// glyphs or ticks, ever; nothing is pressable. At short docks it swaps with the chat.
function stepsDock(m) {
  const steps = m.thread.latest_steps;
  if (!steps || !steps.length) return "";
  const open = m.ask.steps_open || m.steps_list_open;
  return `<section class="check steps" aria-label="${esc(A.steps_aria)}"><button type="button" class="check-head" aria-expanded="${!!open}" aria-controls="ask-steps-body" data-action="toggle_steps" data-keep-focus>`
    + `<span class="chev" aria-hidden="true"><span class="ch-tall">${m.ask.steps_open ? "▾" : "▸"}</span><span class="ch-short">▸</span><span class="ch-short-open">▾</span></span>`
    + `<span class="sum">${esc(A.your_steps(steps.length))}<small>${esc(A.steps_note)}</small></span></button>`
    + `<div class="check-body" id="ask-steps-body"${open ? "" : " hidden"}><ol class="ans">${stepItems(steps)}</ol></div></section>`;
}

function threadStatus(m) {
  if (m.state === "ask-busy" && m.ask.busy) return statusline(A.busy_status);
  if (!m.ask.busy) return "";
  if (m.ask.pressed && m.ask.pressed !== "try_again") return statusline(COPY.status.lesson_ready); // Go deeper pressed
  return statusline(m.ask.long ? A.reading_long : A.reading);
}

function threadActions(m) {
  const s = m.state;
  if (s === "ask-outside") return `<div class="actions">${btn(A.see_covered, "see_covered", "quiet")}</div>`;
  const q = m.thread.questions[m.thread.questions.length - 1];
  const retryable = q && q.answered && (q.notice || s === "ask-nocomp" || (s === "ask-unreachable" && !q.view));
  if (m.ask.busy && m.ask.pressed === "try_again") return `<div class="actions">${pressed(COPY.buttons.pressed.try)}</div>`;
  if (!retryable || m.ask.busy) return "";
  const off = s === "ask-unreachable" ? null : m.follow_off;
  return `<div class="actions">${off ? `<button type="button" class="primary" aria-disabled="true" aria-describedby="retry-why">${esc(COPY.buttons.try_again)}</button><p class="why-off" id="retry-why">${esc(off)}</p>` : btn(COPY.buttons.try_again, "ask_try_again", "primary")}</div>`;
}

// The follow-up bar: spec 007's single-line Ask bar. Paused, the box still takes text and Send says
// why (FR-054); a paused send keeps what was typed.
function followBar(m) {
  const off = m.follow_off;
  const send = `<button type="submit" aria-label="${esc(COPY.buttons.send)}"${off ? ' aria-disabled="true" aria-describedby="ask-in-why"' : ""}>⏎</button>`;
  return `<form class="ask" data-followup autocomplete="off"><label class="sr" for="ask-in">${esc(A.followup_label)}</label><input id="ask-in" type="text" data-keep-value placeholder="${esc(A.followup_placeholder)}" />${send}</form>${off ? `<p class="ask-why" id="ask-in-why">${esc(off)}</p>` : ""}`;
}

function threadRegions(m) {
  const head = `<div class="lhead thread-head"><button type="button" class="back" data-action="thread_back" aria-label="${esc(A.back_thread)}" title="${esc(A.back_thread)}">‹</button><div class="ltitle"><span class="kicker">${esc(A.thread_kicker)}</span><strong data-title tabindex="-1">${esc(A.thread_title)}</strong></div></div>`;
  return { head, banner: "", chat: threadChat(m), list: stepsDock(m), status: threadStatus(m), actions: threadActions(m), ask: followBar(m), list_open: !!m.steps_list_open };
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
  if (m.state === "lesson-starting" || m.state === "lesson-picking-starting") return COPY.lesson.looking;
  if (m.state === "lesson-start-failed") return COPY.lesson.didnt_start;
  if (m.state === "practice-nothing-new") return COPY.lesson.this_comp;
  const row = skillById(m.lesson && m.lesson.skill);
  return focusText(m.lesson) || (row && row.no_focus && m.lesson.checks === 0 ? row.no_focus : COPY.lesson.your_comp);
}

function headTag(m) {
  const v = m.lesson;
  if (m.state === "lesson-passed-asking") return `<span class="tag pass">${esc(COPY.lesson.check_passed_tag)}</span>`;
  if (m.state === "lesson-passed-unsaved" || (FINISHED.includes(m.state) && v.passed)) return `<span class="tag pass">${esc(COPY.lesson.passed_tag)}</span>`;
  if (v.mode === "review") return `<span class="tag practice">${esc(COPY.lesson.review_tag)}</span>`; // FR-014: from the tool's mode alone
  return v.checks > 0 ? `<span class="tag">${esc(COPY.lesson.check_tag(v.checks))}</span>` : "";
}

function headHtml(m) {
  const v = m.lesson;
  if (m.state === "lesson-picking") return `<div class="lhead"><button type="button" class="back" data-action="go_home" aria-label="${esc(COPY.back.lesson)}" title="${esc(COPY.back.lesson)}">‹</button><div class="ltitle"><span class="kicker">${esc(COPY.lesson.picking_kicker)}</span><strong>${esc(COPY.lesson.picking_title)}</strong></div></div>`;
  const name = m.names[v.skill] || "";
  return `<div class="lhead"><button type="button" class="back" data-action="go_home" aria-label="${esc(COPY.back.lesson)}" title="${esc(COPY.back.lesson)}">‹</button><div class="ltitle"><span class="kicker">${esc(name)}</span><strong>${esc(headTitle(m))}</strong></div>${headTag(m)}</div>${stripHtml(v)}`;
}

// The saved passes: same page, different first line and due line (FR-021).
const FINISHED = ["lesson-passed", "lesson-passed-pivot", "practice-passed"];

function savedLine(m) {
  const n = m.review_date;
  const due = !n || m.state === "lesson-passed" ? "" : m.state === "practice-passed" ? COPY.lesson.next_warm_up(n) : COPY.lesson.warm_up_due(n);
  return `✓ ${COPY.lesson.saved}${due ? ` ${due}` : ""}`;
}

// D6: saved with no pass has no state of its own; it keeps its screen, adds Saved and the ways out, and says nothing about a pass.
const savedNoPass = (v) => !!v && v.saved === true && !v.passed;

function lessonBanner(m) {
  const s = m.state;
  if (savedNoPass(m.lesson)) return banner("info", COPY.lesson.saved, "");
  if (s === "lesson-passed" || s === "lesson-passed-pivot") return banner("info", COPY.lesson.passed, savedLine(m));
  if (s === "practice-passed") return banner("info", COPY.lesson.review_passed, savedLine(m));
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
  // FR-082: a lesson reached from a suggestion keeps the suggestion above its opening, unfolded.
  if (m.from_picking && m.lesson && !m.lesson.replied) return { items: msgs.map(messageHtml) };
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

// Offset's timeline (FR-088): one scale for the whole lesson, hidden from screen readers since the
// detail line says the same.
function trackHtml(r, timeline) {
  if (r.time === null || r.time === undefined || !timeline || !(timeline.end > timeline.start)) return "";
  const at = Math.min(100, Math.max(0, ((r.time - timeline.start) / (timeline.end - timeline.start)) * 100));
  return `<span class="track" aria-hidden="true"><i style="left:${at.toFixed(1)}%"></i></span>`;
}

function rowHtml(r, timeline) {
  const track = trackHtml(r, timeline);
  return `<li class="${r.family}${r.changed ? " fresh" : ""}${track ? " trk" : ""}"><span class="g" aria-hidden="true">${esc(r.glyph)}</span><span class="what"><span class="lab">${esc(r.subject)}</span>${r.detail ? `<small>${esc(r.detail)}</small>` : ""}</span><span class="st">${esc(r.word)}</span>${track}</li>`;
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

function listHtml(m) {
  if (m.state === "practice-nothing-new") return "";
  const v = m.lesson;
  const l = v.check_list;
  if (!l) {
    const row = skillById(v.skill);
    if (m.state === "lesson-picking") return "";
    const slot = m.state === "lesson-starting" || m.state === "lesson-picking-starting" ? COPY.check.slot_starting : row && row.slot;
    return slot ? `<section class="check" aria-label="${esc(COPY.check.aria)}"><div class="check-body"><p class="emptyl"><span aria-hidden="true">○</span> ${esc(slot)}</p></div></section>` : "";
  }
  const { sections, foldLine } = visibleSections(l);
  const nDone = rowsOf(l).filter((r) => r.family === "done").length;
  const collapsed = listCollapsed(m);
  // A fold the learner chose can outlast the moment the list goes stale; the note still has to show (FR-017).
  const noteOnly = collapsed && !!l.stale && m.list_collapsed === true;
  const body = sections.map((s) => {
    const allDone = s.rows.length > 0 && s.rows.every((r) => r.family === "done");
    return `${s.title ? `<h3${allDone ? ' class="alld"' : ""}>${esc(s.title)}</h3>` : ""}<ul>${s.rows.map((row) => rowHtml(row, v.timeline)).join("")}</ul>`;
  }).join("");
  const fold = nDone >= 2 ? `<button type="button" class="foldline" data-action="fold_done" data-keep-focus aria-expanded="${!!m.done_unfolded}"><span aria-hidden="true">✓</span> ${esc(COPY.check.done_fold(nDone, m.done_unfolded))}</button>` : "";
  const lines = [foldLine, l.more].filter(Boolean).map((t) => `<p class="more">${esc(t)}</p>`).join("");
  const plainList = (title, items) => (items && items.length ? `<h3>${esc(title)}</h3><ul class="plain">${items.map((o) => `<li><span class="what">${esc(o)}</span></li>`).join("")}</ul>` : "");
  const footer = (l.footer || []).map((t) => `<p class="foot">${esc(t)}</p>`).join("");
  const outside = `${footer}${plainList(COPY.check.worth_a_look, l.worth_a_look)}${plainList(COPY.check.outside, l.outside)}`;
  const cls = ["check", m.done_unfolded ? "unfold" : "", l.stale ? "stale" : ""].filter(Boolean).join(" ");
  return `<section class="${cls}" aria-label="${esc(COPY.check.aria)}"><button type="button" class="check-head" aria-expanded="${!collapsed}" data-action="toggle_list" data-keep-focus><span class="chev" aria-hidden="true"><span class="ch-tall">${collapsed ? "▸" : "▾"}</span><span class="ch-short">▸</span><span class="ch-short-open">▾</span></span><span class="sum">${esc(l.summary)}${l.sub ? `<small>${esc(l.sub)}</small>` : ""}</span></button><div class="check-body"${collapsed && !noteOnly ? " hidden" : ""}>${l.stale ? `<p class="stale-note">${esc(l.stale)}</p>` : ""}${noteOnly ? "" : `${fold}${body}${lines}${outside}`}</div></section>`;
}

const whyOff = (text) => `<div class="actions"><p class="why-off">${esc(text)}</p></div>`;
const buttonOf = (kind) => ({ check: [LABELS.check, "check"], hint: [LABELS.hint, "hint"], show_me: [LABELS.show_me, "show_me"], show_me_again: [LABELS.show_me_again, "show_me_again"] }[kind]);

function actionsHtml(m) {
  const v = m.lesson;
  const s = m.state;
  const t = m.turn || {};
  const busy = !!t.busy;
  if (s === "lesson-picking") {
    if (busy) return whyOff(COPY.paused.after_answer);
    return `<div class="actions">${m.yes_ready ? btn(LABELS.yes, "yes", "primary") : ""}${btn(LABELS.pick_skill, "leave_picking", m.yes_ready ? "" : "primary")}</div>`;
  }
  if (s === "lesson-picking-starting") return `<div class="actions">${pressed(COPY.buttons.pressed.start)}<button type="button" disabled>${esc(LABELS.pick_skill)}</button></div>`;
  if (s === "practice-nothing-new") {
    if (busy) return whyOff(COPY.paused.after_answer);
    return `<div class="actions">${btn(LABELS.back_home, "back_home", "primary")}${btn(LABELS.pick_skill, "see_skills")}</div>`;
  }
  if (s === "lesson-exited") return `<div class="actions">${btn(LABELS.start, "start", "primary")}${btn(LABELS.back_home, "back_home")}</div>`;
  if (s === "lesson-start-failed") return `<div class="actions">${btn(LABELS.try_again, "try_again", "primary")}${btn(LABELS.back_home, "back_home")}</div>`;
  if ((FINISHED.includes(s) || s === "lesson-passed-unsaved" || savedNoPass(v)) && busy) return whyOff(COPY.paused.after_answer);
  if (FINISHED.includes(s) || savedNoPass(v)) return `<div class="actions">${btn(LABELS.whats_next, "whats_next", "primary")}${btn(LABELS.see_skills, "see_skills")}</div>`;
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
  if (["lesson-exited", "lesson-start-failed", "lesson-picking-starting", "practice-nothing-new"].includes(s) || savedNoPass(m.lesson)) return "";
  if ([...FINISHED, "lesson-passed-unsaved"].includes(s) && !m.can_ask) return "";
  const open = m.can_ask && !(m.turn && m.turn.busy) && !m.error;
  return `<form class="ask" data-ask autocomplete="off"><label class="sr" for="ask-in">${esc(COPY.ask_label)}</label><input id="ask-in" type="text" placeholder="${esc(COPY.ask_placeholder)}"${open ? "" : " disabled"} /><button type="submit" aria-label="${esc(COPY.buttons.send)}"${open ? "" : " disabled"}>⏎</button></form>`;
}

function lessonRegions(m) {
  const chat = chatRegion(m);
  if (m.state === "practice-nothing-new") chat.items = chat.items.concat(`<p class="ro">${esc(COPY.lesson.nothing_new)}</p>`);
  return {
    head: headHtml(m),
    banner: lessonBanner(m),
    chat,
    list: listHtml(m),
    status: statusline(m.turn && m.turn.busy ? m.turn.status : null),
    actions: actionsHtml(m),
    ask: askHtml(m),
    list_open: !!m.list_open,
  };
}

// ---------- Skills (T050, T051) ----------

function skillRowHtml(r) {
  const inner = `<span class="g" aria-hidden="true">${esc(r.glyph)}</span><span class="n">${esc(r.name)}</span><span class="s">${esc(r.word)}</span>`;
  const body = r.pressable ? `<button type="button" class="rowbtn" data-action="open_skill" data-skill="${esc(r.id)}">${inner}</button>` : `<span class="rowbtn">${inner}</span>`;
  return `<li class="${esc(r.cls)}">${body}</li>`;
}

// Practice due, moved off Home (spec 014 FR-055, MU skills-due): one line at the top, the first due
// skill in path order with a count of the rest, and Warm up.
function dueLine(m) {
  const p = m.home.practice;
  if (!p) return "";
  const sub = [COPY.skills.due_line(p.last_practiced), p.rest ? COPY.skills.more_due(p.rest) : null].filter(Boolean).join(" · ");
  const off = homeOff(m);
  const go = off ? `<button type="button" aria-disabled="true" aria-describedby="due-why">${esc(COPY.buttons.warm_up)}</button>` : btn(COPY.buttons.warm_up, "warm_up", "", `data-skill="${esc(p.skill)}"`);
  return `<section class="dueline" aria-label="${esc(COPY.home.practice_due)}"><span class="g" aria-hidden="true">↻</span><span class="n">${esc(p.name)}<small>${esc(sub)}</small>${off ? `<small id="due-why">${esc(off)}</small>` : ""}</span>${go}</section>`;
}

function skillsHtml(m) {
  const v = m.skills_view;
  if (m.detail) return detailHtml(m, m.detail);
  const bars = `<i class="l"></i>`.repeat(v.learned) + `<i class="p"></i>`.repeat(v.in_progress) + `<i></i>`.repeat(Math.max(0, v.total - v.learned - v.in_progress));
  return `<div class="scroll"><h2 class="lbl" data-title tabindex="-1">${esc(COPY.skills.title)}</h2><p class="lead-count">${esc(v.summary)}</p><div class="meter" role="img" aria-label="${esc(v.summary)}">${bars}</div>${dueLine(m)}<p class="meta">${esc(COPY.skills.pick)}</p><ul class="skills">${v.rows.map(skillRowHtml).join("")}</ul>${memoryCard(m.home)}</div>`;
}

function detailHtml(m, d) {
  const off = homeOff(m);
  const tag = d.tag === "due" ? `<span class="tag practice">↻ ${esc(COPY.skills.words.due.toLowerCase())}</span>` : d.tag === "learned" ? `<span class="tag pass">✓ ${esc(COPY.skills.words.learned.toLowerCase())}</span>` : "";
  const line = d.builds_on.length ? `<p>${esc(COPY.skills.builds_on(d.builds_on))}</p>` : d.status_line ? `<p>${esc(d.status_line)}</p>` : "";
  const skill = `data-skill="${esc(d.id)}"`;
  const go = off ? `<p class="later">${esc(off)}</p>`
    : d.state === "review" ? btn(COPY.buttons.warm_up, "warm_up", "primary", skill) + btn(COPY.buttons.new_lesson, "new_lesson", "", skill)
      : btn(COPY.buttons.new_lesson, "new_lesson", "primary", skill);
  const history = d.history.length
    ? `<ul class="hist">${d.history.map((h) => `<li><b>${esc(h.date)}</b>${[h.comp, h.result].filter(Boolean).map((p) => ` · ${esc(p)}`).join("")}${h.summary || h.next ? `<small>${esc([h.summary, h.next ? `${COPY.home.next_time} ${h.next}` : ""].filter(Boolean).join(" "))}</small>` : ""}</li>`).join("")}</ul>`
    : `<p class="meta">${esc(COPY.skills.no_lessons)}</p>`;
  return `<div class="lhead"><button type="button" class="back" data-action="back_skills" aria-label="${esc(COPY.back.skills)}" title="${esc(COPY.back.skills)}">‹</button><div class="ltitle"><span class="kicker">${esc(COPY.skills.skill_kicker)}</span><strong data-title tabindex="-1">${esc(d.name)}</strong></div>${tag}</div><div class="scroll">${line}<div class="row detail-go">${go}</div><h2 class="lbl">${esc(COPY.home.memory_title)}</h2>${history}<p class="ro">${esc(COPY.skills.history_note)}</p></div>`;
}

function homeOff(m) {
  if (m.lesson_open) return COPY.paused.after_lesson;
  if (m.ask && (m.ask.busy || m.ask.sending)) return COPY.ask.after_answer;
  if (m.answering_after_pass) return COPY.paused.after_answer;
  if (m.error && m.error.blocks_home) return COPY.paused.needs_mentor;
  const conn = m.connection && m.connection.state;
  if (conn === "not_connected") return COPY.paused.needs_ae;
  if (conn === "busy") return COPY.paused.waiting_ae;
  return null;
}

function renderApp(m) {
  const nav = navHtml(m);
  if (m.tab === "home" && /^ask-/.test(m.state || "") && m.state !== "ask-typing" && m.state !== "ask-sending") return { nav, view: "", lesson: threadRegions(m) };
  if (m.tab === "home") return { nav, view: homeHtml(m), lesson: null };
  if (m.tab === "skills") return { nav, view: skillsHtml(m), lesson: null };
  if (!m.lesson || m.state === "lesson-none" || /^err-/.test(m.state) && !m.lesson_open) return { nav, view: `${/^err-/.test(m.state) ? banner("bad", m.error.title, m.error.body, btn(COPY.buttons.try_again, "try_again")) : ""}${lessonNoneHtml()}`, lesson: null };
  return { nav, view: "", lesson: lessonRegions(m) };
}

module.exports = { renderApp, nextTab, TABS, banner, btn, pressed, statusline };
