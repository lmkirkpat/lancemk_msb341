// Writes the key-types eval set's own synthetic fixtures from live captures only (no new shapes):
//   host-25.json         practice2b.json (Mentor Practice 2 as built) with host.ae_version "25.2x17",
//                        so the snapshot's `host` is not 26.5 (case 25: no shortcut is said).
//   blink-toggled-off.json  blink-one-held.json with Blink's pair 1 (1 s to 1.4 s) held and pair 2
//                        (1.4 s to 1.8 s, held in blink-one-held) back to bezier: the learner used
//                        Toggle Hold Keyframe on the already-held key (case 26).
// Run by hand if either source changes:
//   node product/evals/key-types/fixtures/synthetic/make-synthetic.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIX = path.join(HERE, "../../../../../mentor/test/fixtures");
const read = (p) => JSON.parse(fs.readFileSync(path.join(FIX, p), "utf8"));
const write = (name, obj) => fs.writeFileSync(path.join(HERE, name), JSON.stringify(obj, null, 1) + "\n");

const host = structuredClone(read("layer-info/practice2b.json"));
host.host = { ...host.host, ae_version: "25.2x17" };
write("host-25.json", { synthetic: "Not a live capture: practice2b.json with another After Effects version in host.", ...host });

const off = structuredClone(read("key-types/blink-one-held.json"));
const keys = off.layers.find((l) => l.name === "Blink").properties.find((p) => p.match_name === "ADBE Opacity").keys;
const held = (k) => { k.out_type = "hold"; k.out_ease = [{ speed: 0, influence: 16.667 }]; };
const unheld = (k) => { k.out_type = "bezier"; k.out_ease = [{ speed: 0, influence: 33.33 }]; };
held(keys[0]);
unheld(keys[1]);
write("blink-toggled-off.json", { synthetic: "Not a live capture: blink-one-held.json with pair 1 held and pair 2 toggled back off.", ...off });
