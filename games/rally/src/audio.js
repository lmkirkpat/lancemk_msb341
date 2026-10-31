// All sound is synthesized live with the Web Audio API: square-wave blips for
// the game and a small step sequencer for the music. No audio files.

let ctx = null;
let master, musicBus, sfxBus, noiseBuffer;
let musicOn = true;
let sfxOn = true;
let dimmed = false;
let duckUntil = 0;

const MUSIC_LEVEL = 0.3;
const SFX_LEVEL = 0.5;

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

export function init() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();

    // A gentle low-pass makes everything sound like it's coming out of an
    // old TV speaker instead of a modern laptop.
    const tvSpeaker = ctx.createBiquadFilter();
    tvSpeaker.type = 'lowpass';
    tvSpeaker.frequency.value = 5200;
    tvSpeaker.connect(ctx.destination);

    master = ctx.createGain();
    master.gain.value = 0.6;
    master.connect(tvSpeaker);

    musicBus = ctx.createGain();
    musicBus.gain.value = 0;
    musicBus.connect(master);

    sfxBus = ctx.createGain();
    sfxBus.gain.value = sfxOn ? SFX_LEVEL : 0;
    sfxBus.connect(master);

    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  applyMusicLevel();
}

function tone({ freq, t, dur, type = 'square', vol = 0.3, bus = sfxBus, slide }) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.004);
  g.gain.setValueAtTime(vol, t + dur * 0.6);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(bus);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise({ t, dur, vol = 0.2, bus = musicBus, cutoff = 6000 }) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = cutoff;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(hp);
  hp.connect(g);
  g.connect(bus);
  src.start(t);
  src.stop(t + dur + 0.02);
}

const ready = () => ctx && ctx.state === 'running';
const now = () => ctx.currentTime;

// ---------- Sound effects ----------

export const sfx = {
  paddle(rally = 0) {
    if (!ready()) return;
    // Pitch creeps up as the rally gets longer, so long rallies feel tense.
    tone({ freq: 480 + Math.min(rally, 14) * 14, t: now(), dur: 0.06 });
  },
  wall() {
    if (!ready()) return;
    tone({ freq: 240, t: now(), dur: 0.05 });
  },
  score() {
    if (!ready()) return;
    tone({ freq: 260, slide: 70, t: now(), dur: 0.45, vol: 0.28 });
  },
  serve() {
    if (!ready()) return;
    tone({ freq: 960, t: now(), dur: 0.03, vol: 0.15 });
  },
  menu() {
    if (!ready()) return;
    tone({ freq: 660, t: now(), dur: 0.04, vol: 0.2 });
    tone({ freq: 990, t: now() + 0.05, dur: 0.05, vol: 0.2 });
  },
  start() {
    if (!ready()) return;
    [523, 659, 784, 1047].forEach((f, i) =>
      tone({ freq: f, t: now() + i * 0.07, dur: 0.08, vol: 0.22 })
    );
  },
  win() {
    if (!ready()) return;
    duck(2.6);
    const notes = [523, 659, 784, 1047, 0, 784, 1047];
    const lens = [0.12, 0.12, 0.12, 0.25, 0.1, 0.12, 0.6];
    let t = now() + 0.05;
    notes.forEach((f, i) => {
      if (f) tone({ freq: f, t, dur: lens[i], vol: 0.25 });
      t += lens[i] + 0.02;
    });
  },
  lose() {
    if (!ready()) return;
    duck(2.6);
    [392, 349, 311, 262, 196].forEach((f, i) =>
      tone({ freq: f, t: now() + 0.05 + i * 0.2, dur: i === 4 ? 0.7 : 0.18, vol: 0.25 })
    );
  },
};

// ---------- Music: an original 4-bar chiptune loop in A minor ----------

const BPM = 128;
const STEP = 60 / BPM / 4; // one 16th note

// Am, F, C, G (MIDI note numbers for the chord tones)
const PROG = [
  [57, 60, 64],
  [53, 57, 60],
  [48, 52, 55],
  [55, 59, 62],
];

// 64 sixteenth-note steps; null is a rest.
// prettier-ignore
const MELODY = [
  69, null, null, null, 72, null, 71, null, 69, null, null, null, 64, null, null, null,
  65, null, null, null, 69, null, 72, null, 74, null, 72, null, 69, null, null, null,
  67, null, null, null, 64, null, 67, null, 72, null, null, null, 71, null, 72, null,
  74, null, null, null, 71, null, null, null, 67, null, 69, null, 71, null, null, null,
];

// How many steps each melody note rings before the next one (max 4).
const MELODY_LEN = MELODY.map((n, i) => {
  if (n == null) return 0;
  let len = 1;
  while (len < 4 && MELODY[(i + len) % 64] == null) len++;
  return len;
});

const ARP = [0, 1, 2, 1];

let timer = null;
let step = 0;
let loop = 0;
let nextTime = 0;

function playStep(i, t) {
  const bar = Math.floor(i / 16);
  const s = i % 16;
  const chord = PROG[bar];
  const withMelody = loop % 2 === 1;

  // Bass: root, bouncing up an octave on the off-beats.
  if (s % 2 === 0) {
    const note = chord[0] - 12 + (s % 4 === 2 ? 12 : 0);
    tone({ freq: mtof(note), t, dur: STEP * 1.6, type: 'triangle', vol: 0.55, bus: musicBus });
  }

  // Arpeggio: the classic "can't afford a real chord" sound.
  tone({
    freq: mtof(chord[ARP[s % 4]] + 12),
    t,
    dur: STEP * 0.8,
    vol: withMelody ? 0.045 : 0.075,
    bus: musicBus,
  });

  // Melody on every other pass through the loop.
  if (withMelody && MELODY[i] != null) {
    tone({ freq: mtof(MELODY[i]), t, dur: STEP * MELODY_LEN[i] * 0.95, vol: 0.13, bus: musicBus });
  }

  // Drums: a kick, a noisy snare and a ticking hat.
  if (s === 0 || s === 8 || (s === 10 && bar % 2 === 1)) {
    tone({ freq: 150, slide: 40, t, dur: 0.14, type: 'sine', vol: 0.7, bus: musicBus });
  }
  if (s === 4 || s === 12) noise({ t, dur: 0.12, vol: 0.18, cutoff: 1800 });
  if (s % 4 === 2) noise({ t, dur: 0.03, vol: 0.08, cutoff: 7000 });
}

function scheduler() {
  // If the tab was in the background, don't play a burst of catch-up notes.
  if (nextTime < now() - 0.2) nextTime = now() + 0.05;
  while (nextTime < now() + 0.12) {
    playStep(step, nextTime);
    nextTime += STEP;
    step = (step + 1) % 64;
    if (step === 0) loop++;
  }
}

export function startMusic() {
  if (!ctx || timer) return;
  step = 0;
  loop = 0;
  nextTime = now() + 0.08;
  timer = setInterval(scheduler, 25);
  applyMusicLevel();
}

function applyMusicLevel() {
  if (!ctx) return;
  let level = musicOn ? MUSIC_LEVEL : 0;
  if (dimmed) level *= 0.3;
  const t = now();
  musicBus.gain.cancelScheduledValues(t);
  if (t < duckUntil) {
    musicBus.gain.setTargetAtTime(0, t, 0.05);
    musicBus.gain.setTargetAtTime(level, duckUntil, 0.3);
  } else {
    musicBus.gain.setTargetAtTime(level, t, 0.08);
  }
}

function duck(seconds) {
  duckUntil = now() + seconds;
  applyMusicLevel();
}

export function setMusic(on) {
  musicOn = on;
  applyMusicLevel();
}

export function setSfx(on) {
  sfxOn = on;
  if (ctx) sfxBus.gain.setTargetAtTime(on ? SFX_LEVEL : 0, now(), 0.02);
}

// Turn the music down (not off) while paused.
export function setDimmed(on) {
  dimmed = on;
  applyMusicLevel();
}
