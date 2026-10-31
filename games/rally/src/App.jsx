import { useCallback, useEffect, useRef, useState } from 'react';
import * as audio from './audio.js';

// Logical screen size. The canvas is scaled up with CSS, pixels stay crisp.
const W = 640;
const H = 480;
const PADDLE_W = 10;
const PADDLE_H = 60;
const MARGIN = 26;
const BALL = 10;
const WIN_SCORE = 11;
const SERVE_SPEED = 300;
const MAX_SPEED = 760;
const PLAYER_SPEED = 420;

const LEFT_FACE = MARGIN + PADDLE_W;
const RIGHT_FACE = W - MARGIN - PADDLE_W;

const PHOSPHOR = '#d9ffe2';
const GLOW = '#5dff8a';

// Chunky 3x5 digits, like the score readouts on old cabinet hardware.
const DIGITS = {
  0: ['111', '101', '101', '101', '111'],
  1: ['110', '010', '010', '010', '111'],
  2: ['111', '001', '111', '100', '111'],
  3: ['111', '001', '111', '001', '111'],
  4: ['101', '101', '111', '001', '001'],
  5: ['111', '100', '111', '001', '111'],
  6: ['111', '100', '111', '101', '111'],
  7: ['111', '001', '001', '001', '001'],
  8: ['111', '101', '111', '101', '111'],
  9: ['111', '101', '111', '001', '111'],
};

function newGame(mode, attract = false) {
  return {
    mode, // 1 = vs CPU, 2 = two players
    attract, // title-screen demo where two CPUs play each other
    left: { y: H / 2 - PADDLE_H / 2, score: 0, aiError: 0 },
    right: { y: H / 2 - PADDLE_H / 2, score: 0, aiError: 0 },
    ball: { x: W / 2 - BALL / 2, y: H / 2 - BALL / 2, vx: 0, vy: 0 },
    speed: SERVE_SPEED,
    rally: 0,
    serveTimer: 1.2,
    serveDir: Math.random() < 0.5 ? -1 : 1,
    mouseY: null,
    flash: 0,
  };
}

function clampPaddle(p) {
  p.y = Math.max(0, Math.min(H - PADDLE_H, p.y));
}

function moveAI(p, g, dt, side, maxSpeed) {
  const b = g.ball;
  const coming = side === 'left' ? b.vx < 0 : b.vx > 0;
  // Track the ball when it's coming, drift back to the middle when it isn't.
  const target = coming ? b.y + BALL / 2 + p.aiError : H / 2;
  const diff = target - (p.y + PADDLE_H / 2);
  const step = Math.min(Math.abs(diff), maxSpeed * dt);
  p.y += Math.sign(diff) * step;
  clampPaddle(p);
}

function bounceOff(g, paddle, dir, sound) {
  const b = g.ball;
  // Where the ball hits the paddle sets the angle: edges send it steep.
  const rel = (b.y + BALL / 2 - (paddle.y + PADDLE_H / 2)) / (PADDLE_H / 2 + BALL / 2);
  const angle = Math.max(-1, Math.min(1, rel)) * (Math.PI / 3.2);
  g.speed = Math.min(g.speed * 1.06, MAX_SPEED);
  b.vx = dir * g.speed * Math.cos(angle);
  b.vy = g.speed * Math.sin(angle);
  g.rally++;
  // The CPU misjudges a little more as the ball speeds up.
  const sloppiness = 0.25 + (g.speed / MAX_SPEED) * 0.55;
  g.left.aiError = (Math.random() * 2 - 1) * PADDLE_H * sloppiness;
  g.right.aiError = (Math.random() * 2 - 1) * PADDLE_H * sloppiness;
  if (sound) audio.sfx.paddle(g.rally);
}

// Returns 'left' or 'right' when someone wins, otherwise null.
function update(g, dt, keys) {
  const sound = !g.attract;

  // Left paddle
  if (g.attract) {
    moveAI(g.left, g, dt, 'left', 380);
  } else {
    let dy = 0;
    if (keys.has('w')) dy -= 1;
    if (keys.has('s')) dy += 1;
    if (g.mode === 1) {
      if (keys.has('arrowup')) dy -= 1;
      if (keys.has('arrowdown')) dy += 1;
    }
    if (dy !== 0) {
      g.mouseY = null;
      g.left.y += Math.sign(dy) * PLAYER_SPEED * dt;
    } else if (g.mouseY != null) {
      const diff = g.mouseY - (g.left.y + PADDLE_H / 2);
      g.left.y += Math.sign(diff) * Math.min(Math.abs(diff), 900 * dt);
    }
    clampPaddle(g.left);
  }

  // Right paddle
  if (g.mode === 2 && !g.attract) {
    let dy = 0;
    if (keys.has('arrowup')) dy -= 1;
    if (keys.has('arrowdown')) dy += 1;
    g.right.y += dy * PLAYER_SPEED * dt;
    clampPaddle(g.right);
  } else {
    moveAI(g.right, g, dt, 'right', g.attract ? 380 : 330);
  }

  const b = g.ball;
  g.flash = Math.max(0, g.flash - dt);

  // Waiting to serve
  if (g.serveTimer > 0) {
    g.serveTimer -= dt;
    b.x = W / 2 - BALL / 2;
    b.y = H / 2 - BALL / 2;
    if (g.serveTimer <= 0) {
      const angle = (Math.random() * 2 - 1) * (Math.PI / 7);
      g.speed = SERVE_SPEED;
      g.rally = 0;
      b.vx = g.serveDir * g.speed * Math.cos(angle);
      b.vy = g.speed * Math.sin(angle);
      g.left.aiError = 0;
      g.right.aiError = 0;
      if (sound) audio.sfx.serve();
    }
    return null;
  }

  const prevX = b.x;
  b.x += b.vx * dt;
  b.y += b.vy * dt;

  // Top and bottom walls
  if (b.y < 0) {
    b.y = -b.y;
    b.vy = Math.abs(b.vy);
    if (sound) audio.sfx.wall();
  } else if (b.y + BALL > H) {
    b.y = 2 * (H - BALL) - b.y;
    b.vy = -Math.abs(b.vy);
    if (sound) audio.sfx.wall();
  }

  const overlaps = (p) => b.y + BALL >= p.y && b.y <= p.y + PADDLE_H;

  // Paddles (swept, so a fast ball can't tunnel through)
  if (b.vx < 0 && prevX >= LEFT_FACE && b.x < LEFT_FACE && overlaps(g.left)) {
    b.x = LEFT_FACE;
    bounceOff(g, g.left, 1, sound);
  } else if (
    b.vx > 0 &&
    prevX + BALL <= RIGHT_FACE &&
    b.x + BALL > RIGHT_FACE &&
    overlaps(g.right)
  ) {
    b.x = RIGHT_FACE - BALL;
    bounceOff(g, g.right, -1, sound);
  }

  // Points
  let scorer = null;
  if (b.x + BALL < 0) scorer = 'right';
  else if (b.x > W) scorer = 'left';

  if (scorer) {
    g[scorer].score++;
    g.flash = 0.25;
    g.serveDir = scorer === 'left' ? 1 : -1; // serve to whoever just lost the point
    g.serveTimer = 1.1;
    b.vx = 0;
    b.vy = 0;
    if (g[scorer].score >= WIN_SCORE) {
      if (g.attract) {
        g.left.score = 0;
        g.right.score = 0;
        return null;
      }
      return scorer;
    }
    if (sound) audio.sfx.score();
  }
  return null;
}

function drawNumber(ctx, n, cx, y, cell) {
  const str = String(n);
  const width = str.length * 4 * cell - cell;
  let x = cx - width / 2;
  for (const ch of str) {
    DIGITS[ch].forEach((row, r) => {
      [...row].forEach((on, c) => {
        if (on === '1') ctx.fillRect(x + c * cell, y + r * cell, cell, cell);
      });
    });
    x += 4 * cell;
  }
}

function draw(ctx, g, time) {
  // Don't clear all the way: the leftover glow is the phosphor trail.
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(4, 10, 6, 0.42)';
  ctx.fillRect(0, 0, W, H);

  if (g.flash > 0) {
    ctx.fillStyle = `rgba(120, 255, 160, ${g.flash * 0.25})`;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.fillStyle = PHOSPHOR;
  ctx.shadowColor = GLOW;
  ctx.shadowBlur = 10;

  // Net
  for (let y = 6; y < H; y += 24) ctx.fillRect(W / 2 - 2, y, 4, 12);

  // Scores
  drawNumber(ctx, g.left.score, W / 4, 28, 9);
  drawNumber(ctx, g.right.score, (3 * W) / 4, 28, 9);

  // Paddles
  ctx.fillRect(MARGIN, Math.round(g.left.y), PADDLE_W, PADDLE_H);
  ctx.fillRect(RIGHT_FACE, Math.round(g.right.y), PADDLE_W, PADDLE_H);

  // Ball (blinks while waiting to serve)
  const waiting = g.serveTimer > 0;
  if (!waiting || Math.floor(time * 6) % 2 === 0) {
    ctx.fillRect(Math.round(g.ball.x), Math.round(g.ball.y), BALL, BALL);
  }
}

export default function App() {
  const canvasRef = useRef(null);
  const gameRef = useRef(newGame(1, true));
  const keysRef = useRef(new Set());
  const phaseRef = useRef('title');
  const audioStarted = useRef(false);

  const [phase, setPhaseState] = useState('title');
  const [mode, setMode] = useState(1);
  const [winner, setWinner] = useState(null);
  const [musicOn, setMusicOn] = useState(true);
  const [sfxOn, setSfxOn] = useState(true);

  const setPhase = useCallback((p) => {
    phaseRef.current = p;
    setPhaseState(p);
    audio.setDimmed(p === 'paused');
  }, []);

  const wakeAudio = useCallback(() => {
    audio.init();
    if (!audioStarted.current) {
      audioStarted.current = true;
      audio.startMusic();
    }
  }, []);

  const startGame = useCallback(
    (m) => {
      wakeAudio();
      audio.sfx.start();
      setMode(m);
      setWinner(null);
      gameRef.current = newGame(m);
      setPhase('playing');
    },
    [setPhase, wakeAudio]
  );

  const toTitle = useCallback(() => {
    audio.sfx.menu();
    gameRef.current = newGame(1, true);
    setPhase('title');
  }, [setPhase]);

  const toggleMusic = useCallback(() => {
    wakeAudio();
    setMusicOn((on) => {
      audio.setMusic(!on);
      return !on;
    });
  }, [wakeAudio]);

  const toggleSfx = useCallback(() => {
    wakeAudio();
    setSfxOn((on) => {
      audio.setSfx(!on);
      return !on;
    });
  }, [wakeAudio]);

  // Keyboard
  useEffect(() => {
    const onDown = (e) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', ' '].includes(k)) e.preventDefault();
      // Keep a clicked menu button from also reacting to Space or Enter.
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      wakeAudio();
      keysRef.current.add(k);
      if (e.repeat) return;

      const p = phaseRef.current;
      if (k === 'm') return toggleMusic();
      if (k === 'n') return toggleSfx();
      if (p === 'title') {
        if (k === '1' || k === 'enter' || k === ' ') startGame(1);
        else if (k === '2') startGame(2);
      } else if (p === 'playing') {
        if (k === ' ' || k === 'p' || k === 'escape') {
          audio.sfx.menu();
          setPhase('paused');
        }
      } else if (p === 'paused') {
        if (k === ' ' || k === 'p') {
          audio.sfx.menu();
          setPhase('playing');
        } else if (k === 'escape' || k === 'q') toTitle();
      } else if (p === 'over') {
        if (k === ' ' || k === 'enter') startGame(gameRef.current.mode);
        else if (k === 'escape' || k === 'q') toTitle();
      }
    };
    const onUp = (e) => keysRef.current.delete(e.key.toLowerCase());
    const onBlur = () => {
      keysRef.current.clear();
      if (phaseRef.current === 'playing') setPhase('paused');
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [setPhase, startGame, toTitle, toggleMusic, toggleSfx, wakeAudio]);

  // Game loop
  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = '#040a06';
    ctx.fillRect(0, 0, W, H);
    let raf;
    let last = performance.now();
    const frame = (t) => {
      const dt = Math.min((t - last) / 1000, 1 / 30);
      last = t;
      const g = gameRef.current;
      const p = phaseRef.current;
      if (p === 'title' || p === 'playing') {
        const won = update(g, dt, keysRef.current);
        if (won) {
          const humanWon = g.mode === 2 || won === 'left';
          if (humanWon) audio.sfx.win();
          else audio.sfx.lose();
          setWinner(won);
          setPhase('over');
        }
      }
      draw(ctx, g, t / 1000);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [setPhase]);

  // Mouse and touch steer the left paddle
  const pointerTo = (clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    gameRef.current.mouseY = ((clientY - rect.top) / rect.height) * H;
  };

  const winnerName =
    winner === 'left' ? 'PLAYER 1' : mode === 2 ? 'PLAYER 2' : 'THE COMPUTER';

  return (
    <div className="room">
      <div className="cabinet">
        <div className="marquee">RALLY &rsquo;78</div>
        <div className="bezel">
          <div className="screen">
            <canvas
              ref={canvasRef}
              width={W}
              height={H}
              onMouseMove={(e) => pointerTo(e.clientY)}
              onTouchMove={(e) => pointerTo(e.touches[0].clientY)}
              onTouchStart={(e) => pointerTo(e.touches[0].clientY)}
            />

            {phase === 'title' && (
              <div className="overlay">
                <h1 className="title">RALLY</h1>
                <div className="subtitle">TELE-TENNIS &middot; EST. 1978</div>
                <button className="menu-item" onClick={() => startGame(1)}>
                  1 &nbsp;ONE PLAYER
                </button>
                <button className="menu-item" onClick={() => startGame(2)}>
                  2 &nbsp;TWO PLAYERS
                </button>
                <div className="blink">INSERT COIN</div>
                <div className="hint">FIRST TO {WIN_SCORE} WINS</div>
              </div>
            )}

            {phase === 'paused' && (
              <div className="overlay dim">
                <h2 className="big">PAUSED</h2>
                <div className="hint">SPACE TO RESUME &middot; ESC FOR TITLE</div>
              </div>
            )}

            {phase === 'over' && (
              <div className="overlay dim">
                <h2 className="big">GAME OVER</h2>
                <div className="winner">{winnerName} WINS</div>
                <button className="menu-item" onClick={() => startGame(mode)}>
                  PLAY AGAIN
                </button>
                <button className="menu-item" onClick={toTitle}>
                  TITLE SCREEN
                </button>
              </div>
            )}

            <div className="scanlines" />
            <div className="vignette" />
          </div>
        </div>

        <div className="panel">
          <div className="controls">
            {mode === 2 && phase !== 'title' ? (
              <>
                <span><kbd>W</kbd><kbd>S</kbd> PLAYER 1</span>
                <span><kbd>&uarr;</kbd><kbd>&darr;</kbd> PLAYER 2</span>
              </>
            ) : (
              <span><kbd>W</kbd><kbd>S</kbd> / <kbd>&uarr;</kbd><kbd>&darr;</kbd> / MOUSE</span>
            )}
            <span><kbd>SPACE</kbd> PAUSE</span>
          </div>
          <div className="switches">
            <button className={`switch ${musicOn ? 'on' : ''}`} onClick={toggleMusic}>
              <span className="led" /> MUSIC <kbd>M</kbd>
            </button>
            <button className={`switch ${sfxOn ? 'on' : ''}`} onClick={toggleSfx}>
              <span className="led" /> SOUND <kbd>N</kbd>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
