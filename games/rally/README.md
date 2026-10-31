# RALLY '78

A small retro paddle-ball game built with React. It's a side project, separate from Knack.

## Run it

```bash
cd games/rally
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173). Press any key or click once, because
browsers keep audio muted until you do something on the page.

## Controls

| Key | What it does |
| --- | --- |
| `1` / `2` | One player (vs. the computer) / two players |
| `W` `S` or `↑` `↓` or mouse | Move your paddle (in 2-player, P1 uses `W` `S` and P2 uses `↑` `↓`) |
| `Space` | Pause / resume |
| `Esc` | Back to the title screen (from pause or game over) |
| `M` / `N` | Music on/off / sound effects on/off |

First to 11 wins. Where the ball hits your paddle sets its angle: the edges send it steep. The ball
speeds up with every hit, and the beep gets higher the longer a rally goes.

## What makes it feel old

- **Look:** a green phosphor CRT with scanlines, curved-glass corners, a slight flicker, and glow
  trails behind the ball. It sits in a woodgrain console with a brushed-metal control strip.
- **Sound effects:** square-wave blips for the paddle and walls, a falling buzz when someone scores,
  and fanfares for winning and losing.
- **Music:** an original 4-bar chiptune loop in A minor (Am, F, C, G) with a triangle bass,
  arpeggios, a noise drum kit, and a melody on every other pass. It turns down while paused and
  drops out for the win/lose jingle.
- **Attract mode:** two computer paddles play each other behind the title screen.

All audio is made live with the Web Audio API (`src/audio.js`), so there are no sound files.

## Files

- `src/App.jsx`: game state, physics, the computer opponent, drawing, and the screens
- `src/audio.js`: sound effects and the music sequencer
- `src/styles.css`: the CRT and cabinet look
