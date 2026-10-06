// Claude Code stream-json stdout → adapter events (contracts/mentor-adapter.md › Claude Code stream
// mapping). Shapes confirmed by the spike (research R1 › Spike result). Everything not listed is
// ignored: thinking, signatures, tool-input deltas, ToolSearch, system and rate-limit lines.
"use strict";

const PREFIX = "mcp__ae-mentor__";
const AUTH = /not (?:logged|signed) in|log ?in|authenticat|api key|\/login|unauthori[sz]ed|\b401\b/i;

function textOf(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.filter((b) => b && b.type === "text").map((b) => b.text).join("\n");
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return undefined;
  }
}

// emit(event) receives { type, ...payload }. turn_end carries the raw cumulative cost
// (cost_total_usd); the adapter turns it into a per-turn cost.
function createStreamParser(emit) {
  let buf = "";
  const calls = new Map(); // tool_use id → tool name (prefix stripped)

  function onMessage(m) {
    if (m.type === "stream_event") {
      const e = m.event || {};
      if (e.type === "content_block_delta" && e.delta && e.delta.type === "text_delta" && e.delta.text) {
        emit({ type: "text_delta", text: e.delta.text });
      }
      return;
    }
    if (m.type === "assistant" && m.message && Array.isArray(m.message.content)) {
      for (const b of m.message.content) {
        if (b.type === "text" && b.text) emit({ type: "text", text: b.text });
        if (b.type === "tool_use" && typeof b.name === "string" && b.name.startsWith(PREFIX)) {
          const name = b.name.slice(PREFIX.length);
          calls.set(b.id, name);
          emit({ type: "tool_call", id: b.id, name });
        }
      }
      return;
    }
    if (m.type === "user" && m.message && Array.isArray(m.message.content)) {
      for (const b of m.message.content) {
        if (b.type !== "tool_result" || !calls.has(b.tool_use_id)) continue;
        const text = textOf(b.content);
        const images = Array.isArray(b.content)
          ? b.content.filter((x) => x && x.type === "image" && x.source && x.source.data).map((x) => ({ data: x.source.data, mimeType: x.source.media_type || "image/png" }))
          : [];
        const ev = { type: "tool_result", id: b.tool_use_id, name: calls.get(b.tool_use_id), ok: !b.is_error, text, images };
        // A frame's result has an image plus a JSON text part; try each text part for JSON.
        const parts = Array.isArray(b.content) ? b.content.filter((x) => x && x.type === "text").map((x) => x.text) : [text];
        for (const p of [text, ...parts]) {
          const j = parseJson(p);
          if (j !== undefined) { ev.json = j; break; }
        }
        emit(ev);
      }
      return;
    }
    if (m.type === "result") {
      const resultText = typeof m.result === "string" ? m.result : "";
      if (m.is_error && AUTH.test(resultText)) {
        emit({ type: "error", kind: "not_signed_in", message: resultText.slice(0, 300) });
      }
      emit({ type: "turn_end", ok: !m.is_error, cost_total_usd: typeof m.total_cost_usd === "number" ? m.total_cost_usd : null, session_id: m.session_id || null });
    }
  }

  function onLine(line) {
    if (!line.trim()) return;
    let m;
    try {
      m = JSON.parse(line);
    } catch (e) {
      emit({ type: "error", kind: "bad_stream", message: line.slice(0, 300) });
      return;
    }
    if (m && typeof m === "object") onMessage(m);
  }

  return {
    push(chunk) {
      buf += chunk;
      let nl;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl);
        buf = buf.slice(nl + 1);
        onLine(line);
      }
    },
    end() {
      if (buf) onLine(buf);
      buf = "";
    },
  };
}

module.exports = { createStreamParser };
