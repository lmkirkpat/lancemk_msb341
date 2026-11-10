// The preview frame a run returns: a flat, dark 1920 x 1080 PNG (a comp's size and background),
// written as frame.png beside the snapshot copies, where the fixture server looks for a real frame.
// The server's own placeholder is 1 x 1, and a mentor said "a tiny one-pixel image" (null case 10,
// 2026-10-28; pivot case 50, 2026-11-09). Flat, not a picture of another comp: the layers in the
// snapshot wouldn't match it. Node built-ins only.

import zlib from "node:zlib";

export function blankFrame(w = 1920, h = 1080, rgb = [26, 26, 30]) {
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type), data]);
    const out = Buffer.alloc(body.length + 8);
    out.writeUInt32BE(data.length, 0);
    body.copy(out, 4);
    out.writeUInt32BE(zlib.crc32(body), body.length + 4);
    return out;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: w }, () => rgb).flat())]);
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
