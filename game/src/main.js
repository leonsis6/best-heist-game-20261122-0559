// The Meridian Job — game loop, alarm, tools and deterministic screenshot states.
// Win: lift the diamond and reach the EXIT. Lose: the alarm meter fills to 100.

import {
  CANVAS_W, CANVAS_H, ENTRY, EXIT, DIAMOND, CASH, GUARD_DEFS, CAMERA_DEFS, TUNING,
} from './config.js';
import { mulberry32 } from './rng.js';
import { createInput } from './input.js';
import { moveCircle, circleHitsRect, distance } from './world.js';
import { createGuard, createCamera, updateGuard, updateCamera, cameraSeesPlayer, sendGuardsToNoise } from './guards.js';
import { createAudio } from './audio.js';
import { drawScene } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(window.location.search);
const SHOT = params.get('shot');
const SEED = Number(params.get('seed') || 1);

const input = createInput(canvas);
const audio = createAudio();

function freshState() {
  const rng = mulberry32(SEED);
  return {
    phase: 'title', // title | playing | busted | escaped
    time: 0,
    elapsed: 0,
    player: { x: ENTRY.x, y: ENTRY.y },
    guards: GUARD_DEFS.map((def, i) => createGuard(def, i, rng)),
    cameras: CAMERA_DEFS.map((def) => createCamera(def)),
    alarm: 0,
    empUses: TUNING.empUses,
    lureUses: TUNING.lureUses,
    score: 0,
    hasDiamond: false,
    noise: null,
    spottedFlash: 0,
    moveTarget: null,
    lastSpottedAt: -10,
  };
}

let state = freshState();

function startGame() {
  const keepScore = 0;
  state = freshState();
  state.phase = 'playing';
  state.score = keepScore;
  audio.unlock();
}

function update(dt) {
  state.time += dt;
  if (state.phase !== 'playing') return;
  state.elapsed += dt;

  // --- Tools (edge-triggered). ---
  if (input.consumeEmp() && state.empUses > 0) {
    state.empUses -= 1;
    for (const camera of state.cameras) camera.disabledLeft = TUNING.empDurationSec;
    audio.emp();
  }
  if (input.consumeLure() && state.lureUses > 0) {
    state.lureUses -= 1;
    const target = input.mouse.inside
      ? { x: input.mouse.x, y: input.mouse.y }
      : { x: state.player.x, y: state.player.y - 120 };
    state.noise = { x: target.x, y: target.y, at: state.time };
    sendGuardsToNoise(state.guards, target.x, target.y);
    audio.lure();
  }

  // --- Move the thief: keys first, click-to-move second. ---
  const p = state.player;
  let vx = 0;
  let vy = 0;
  if (input.keys.has('up')) vy -= 1;
  if (input.keys.has('down')) vy += 1;
  if (input.keys.has('left')) vx -= 1;
  if (input.keys.has('right')) vx += 1;
  if (vx !== 0 || vy !== 0) {
    const len = Math.hypot(vx, vy);
    moveCircle(p, TUNING.playerRadius, (vx / len) * TUNING.playerSpeed * dt, (vy / len) * TUNING.playerSpeed * dt);
    input.clearMoveTarget();
  } else if (input.moveTarget) {
    const d = distance(p.x, p.y, input.moveTarget.x, input.moveTarget.y);
    if (d < 6) {
      input.clearMoveTarget();
    } else {
      moveCircle(
        p, TUNING.playerRadius,
        ((input.moveTarget.x - p.x) / d) * TUNING.playerSpeed * dt,
        ((input.moveTarget.y - p.y) / d) * TUNING.playerSpeed * dt,
      );
    }
  }
  state.moveTarget = input.moveTarget;

  // --- Guards and cameras. ---
  const alarmHigh = state.alarm > 50;
  let seenByGuard = false;
  let anySuspicious = false;
  for (const guard of state.guards) {
    const seen = updateGuard(guard, dt, state.time, p, alarmHigh);
    if (seen) seenByGuard = true;
    if (guard.state === 'chase' || guard.state === 'investigate') anySuspicious = true;
  }
  let seenByCamera = false;
  for (const camera of state.cameras) {
    updateCamera(camera, dt, state.time);
    if (cameraSeesPlayer(camera, p)) seenByCamera = true;
  }

  // --- Alarm meter: seen fills it fast, hidden drains it slowly. ---
  if (seenByGuard || seenByCamera) {
    if (seenByGuard) state.alarm += TUNING.alarmGuardPerSec * dt;
    if (seenByCamera) state.alarm += TUNING.alarmCameraPerSec * dt;
    if (state.time - state.lastSpottedAt > 2) {
      state.lastSpottedAt = state.time;
      state.spottedFlash = 1.2;
      audio.spotted();
    }
  } else {
    state.alarm -= TUNING.alarmDecayPerSec * dt;
    if (anySuspicious) state.alarm += TUNING.alarmSuspicionPerSec * dt;
  }
  state.alarm = Math.max(0, Math.min(TUNING.alarmBusted, state.alarm));
  state.spottedFlash = Math.max(0, state.spottedFlash - dt);
  audio.setAlarm(state.alarm / 100);

  if (state.alarm >= TUNING.alarmBusted) {
    state.phase = 'busted';
    audio.setAlarm(0);
    audio.busted();
    return;
  }

  // --- Loot. ---
  if (!state.hasDiamond && distance(p.x, p.y, DIAMOND.x, DIAMOND.y) < 34) {
    state.hasDiamond = true;
    state.score += DIAMOND.value;
    audio.diamond();
  }
  for (const cash of CASH) {
    if (!cash.taken && distance(p.x, p.y, cash.x, cash.y) < 28) {
      cash.taken = true;
      state.score += cash.value;
      audio.pickup();
    }
  }

  // --- Exit: only open once the diamond is in hand. ---
  if (state.hasDiamond && circleHitsRect(p.x, p.y, TUNING.playerRadius, EXIT)) {
    state.phase = 'escaped';
    state.score += Math.max(0, 300 - Math.floor(state.elapsed) * 2);
    audio.setAlarm(0);
    audio.win();
  }
}

// Deterministic screenshot states: fixed poses, no simulation advance.
function setupShot(name) {
  state = freshState();
  state.phase = 'playing';
  state.time = 2.0;
  const [g1, g2, g3] = state.guards;
  if (name === 'start') {
    g1.x = 300; g1.y = 150; g1.facing = 0;
    g2.x = 200; g2.y = 500; g2.facing = 0;
    g3.x = 1050; g3.y = 150; g3.facing = Math.PI / 2;
    state.cameras[0].angle = Math.PI / 2 + 0.4;
    state.cameras[1].angle = Math.PI - 0.3;
  } else if (name === 'play') {
    state.player.x = 430; state.player.y = 420;
    state.alarm = 18;
    g1.x = 700; g1.y = 150; g1.facing = Math.PI;
    g2.x = 520; g2.y = 500; g2.facing = Math.PI;
    g3.x = 1050; g3.y = 420; g3.facing = -Math.PI / 2;
    state.cameras[0].angle = Math.PI / 2 - 0.5;
    state.cameras[1].angle = Math.PI + 0.3;
  } else if (name === 'alarm') {
    state.player.x = 980; state.player.y = 380;
    state.alarm = 82;
    state.spottedFlash = 1;
    g1.x = 900; g1.y = 300; g1.facing = Math.PI / 4;
    g2.x = 600; g2.y = 500; g2.facing = 0;
    g3.x = 1050; g3.y = 480; g3.facing = -2.18; // cone trained on the thief
    g3.state = 'chase';
    g3.lastSeen = { x: state.player.x, y: state.player.y };
    state.cameras[0].angle = Math.PI / 2;
    state.cameras[1].angle = Math.PI - 0.6;
  } else if (name === 'escape') {
    state.player.x = EXIT.x + EXIT.w / 2;
    state.player.y = EXIT.y - 22; // just above the door, so the EXIT sign reads clean
    state.hasDiamond = true;
    state.score = 600;
    state.alarm = 12;
    state.elapsed = 74;
    state.phase = 'escaped';
    g1.x = 900; g1.y = 150; g1.facing = Math.PI;
    g2.x = 200; g2.y = 620; g2.facing = -Math.PI / 2;
    g3.x = 1120; g3.y = 620; g3.facing = -Math.PI / 2;
    state.cameras[0].angle = Math.PI / 2 + 0.5;
    state.cameras[1].angle = Math.PI;
  }
}

function frame(now) {
  const dt = Math.min(0.05, (now - frame.last) / 1000 || 0.016);
  frame.last = now;
  if (input.consumeStart()) {
    if (state.phase === 'title' || state.phase === 'busted' || state.phase === 'escaped') startGame();
  }
  update(dt);
  drawScene(ctx, state);
  requestAnimationFrame(frame);
}
frame.last = 0;

if (SHOT) {
  setupShot(SHOT);
  drawScene(ctx, state); // one frozen frame: reproducible screenshots
} else {
  requestAnimationFrame(frame);
}

// Hooks for automated play-testing (not part of the game UI).
window.__meridian = { get state() { return state; }, startGame, update };
