// Minimal JSON writer (ES3). ExtendScript has no JSON object; the bridge serializes return values
// itself, so this is only for scripts that write JSON to disk (the practice-comp answer key).

// Quotes, backslashes, control characters and U+2028/2029, built from char codes so no literal
// line separator ever sits in this file (it would end the regex on some engines).
var __JSON_UNSAFE = new RegExp('[\\\\"\\x00-\\x1f' + String.fromCharCode(0x2028, 0x2029) + "]", "g");

function toJSON(v, indent, depth) {
    indent = indent || "";
    depth = depth || 0;
    var pad = indent ? "\n" + new Array(depth + 2).join(indent) : "";
    var end = indent ? "\n" + new Array(depth + 1).join(indent) : "";
    if (v === null || v === undefined) return "null";
    var t = typeof v;
    if (t === "number") return isFinite(v) ? String(v) : "null";
    if (t === "boolean") return String(v);
    if (t === "string") {
        return '"' + v.replace(__JSON_UNSAFE, function (c) {
            if (c === '"') return '\\"';
            if (c === "\\") return "\\\\";
            if (c === "\n") return "\\n";
            if (c === "\t") return "\\t";
            var h = c.charCodeAt(0).toString(16);
            return "\\u" + "0000".substr(h.length) + h;
        }) + '"';
    }
    var parts = [];
    if (Object.prototype.toString.call(v) === "[object Array]") {
        if (v.length === 0) return "[]";
        for (var i = 0; i < v.length; i++) parts.push(toJSON(v[i], indent, depth + 1));
        return "[" + pad + parts.join("," + pad) + end + "]";
    }
    for (var k in v) {
        if (v.hasOwnProperty(k) && typeof v[k] !== "function") {
            parts.push(toJSON(k) + (indent ? ": " : ":") + toJSON(v[k], indent, depth + 1));
        }
    }
    if (parts.length === 0) return "{}";
    return "{" + pad + parts.join("," + pad) + end + "}";
}
