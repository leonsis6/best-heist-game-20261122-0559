// All drawing: the gallery floor, the furniture that hides you, the cones
// you have to read before you move, the thief, the loot and the alarm meter.
// Safe cover reads green-grey, danger reads amber and red, loot reads cyan.

import { CANVAS_W, CANVAS_H, HUD_H, ROOM, COVER, DIAMOND, CASH, EXIT, ENTRY, COLORS } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, range, halfAngle, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawFloor(ctx) {
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, HUD_H, CANVAS_W, CANVAS_H - HUD_H);
  ctx.strokeStyle = COLORS.floorTile;
  ctx.lineWidth = 1;
  for (let x = ROOM.x; x <= ROOM.x + ROOM.w; x += 64) {
    ctx.beginPath(); ctx.moveTo(x, ROOM.y); ctx.lineTo(x, ROOM.y + ROOM.h); ctx.stroke();
  }
  for (let y = ROOM.y; y <= ROOM.y + ROOM.h; y += 64) {
    ctx.beginPath(); ctx.moveTo(ROOM.x, y); ctx.lineTo(ROOM.x + ROOM.w, y); ctx.stroke();
  }
  // Outer wall.
  ctx.strokeStyle = COLORS.wall;
  ctx.lineWidth = 12;
  ctx.strokeRect(ROOM.x + 6, ROOM.y + 6, ROOM.w - 12, ROOM.h - 12);
  ctx.strokeStyle = COLORS.wallTop;
  ctx.lineWidth = 2;
  ctx.strokeRect(ROOM.x + 12, ROOM.y + 12, ROOM.w - 24, ROOM.h - 24);
}

function drawCover(ctx) {
  for (const c of COVER) {
    ctx.fillStyle = c.kind === 'pedestal' ? '#2c3040' : '#2a2e3d';
    roundRect(ctx, c.x, c.y, c.w, c.h, 8);
    ctx.fill();
    ctx.strokeStyle = '#454a61';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (c.kind === 'plant') {
      ctx.fillStyle = COLORS.safe;
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1d5c34';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2 - 8, c.y + c.h / 2 - 6, 8, 0, Math.PI * 2);
      ctx.arc(c.x + c.w / 2 + 9, c.y + c.h / 2 + 5, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    if (c.kind === 'crates') {
      ctx.strokeStyle = '#5a5f78';
      ctx.beginPath();
      ctx.moveTo(c.x + c.w / 2, c.y); ctx.lineTo(c.x + c.w / 2, c.y + c.h);
      ctx.moveTo(c.x, c.y + c.h / 2); ctx.lineTo(c.x + c.w, c.y + c.h / 2);
      ctx.stroke();
    }
    ctx.fillStyle = COLORS.dim;
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(c.label, c.x + c.w / 2, c.y + c.h + 14);
  }
}

function drawLoot(ctx, state) {
  // The Meridian Diamond on its pedestal.
  if (!state.hasDiamond) {
    const pulse = 1 + Math.sin(state.time * 3) * 0.12;
    ctx.save();
    ctx.translate(DIAMOND.x, DIAMOND.y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = COLORS.diamond;
    ctx.beginPath();
    ctx.moveTo(0, -14); ctx.lineTo(11, 0); ctx.lineTo(0, 14); ctx.lineTo(-11, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = COLORS.loot;
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MERIDIAN DIAMOND', DIAMOND.x, DIAMOND.y - 30);
  }
  for (const cash of CASH) {
    if (cash.taken) continue;
    ctx.fillStyle = COLORS.safe;
    roundRect(ctx, cash.x - 12, cash.y - 8, 24, 16, 3);
    ctx.fill();
    ctx.fillStyle = '#0e2b18';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('$', cash.x, cash.y + 4);
  }
  // Exit door, glowing once the diamond is in hand.
  const exitOpen = state.hasDiamond;
  ctx.fillStyle = exitOpen ? COLORS.safe : '#3a3f52';
  roundRect(ctx, EXIT.x, EXIT.y, EXIT.w, EXIT.h, 6);
  ctx.fill();
  ctx.fillStyle = exitOpen ? '#0e2b18' : COLORS.text;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(exitOpen ? 'EXIT — GO!' : 'EXIT', EXIT.x + EXIT.w / 2, EXIT.y + 28);
  // Entry door marker (hidden while the thief stands on it, so the labels
  // never print on top of each other).
  if (Math.hypot(state.player.x - ENTRY.x, state.player.y - ENTRY.y) > 60) {
    ctx.fillStyle = COLORS.dim;
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText('ENTRY', ENTRY.x, ENTRY.y + 26);
  }
}

function drawGuards(ctx, state) {
  for (const guard of state.guards) {
    const hot = guard.state === 'chase';
    drawCone(ctx, guard.x, guard.y, guard.facing, guard.range, guard.halfAngle, hot ? COLORS.coneHot : COLORS.cone);
    ctx.fillStyle = guard.color;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0c0e14';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Facing tick.
    ctx.strokeStyle = '#0c0e14';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.facing) * 20, guard.y + Math.sin(guard.facing) * 20);
    ctx.stroke();
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(guard.name.toUpperCase(), guard.x, guard.y - 22);
    if (guard.state === 'investigate') {
      ctx.fillStyle = COLORS.warn;
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText('?', guard.x, guard.y - 34);
    }
    if (hot) {
      ctx.fillStyle = COLORS.danger;
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText('!', guard.x, guard.y - 34);
    }
  }
  for (const camera of state.cameras) {
    const off = camera.disabledLeft > 0;
    if (!off) drawCone(ctx, camera.x, camera.y, camera.angle, camera.range, camera.halfAngle, COLORS.camCone);
    ctx.fillStyle = off ? '#555a6e' : '#20242f';
    ctx.beginPath();
    ctx.arc(camera.x, camera.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = off ? '#777c92' : COLORS.loot;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = off ? COLORS.dim : COLORS.loot;
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(off ? 'OFFLINE' : 'CAM', camera.x, camera.y - 16);
  }
}

function drawPlayer(ctx, state) {
  const p = state.player;
  // Click-to-move target ring.
  if (state.moveTarget) {
    ctx.strokeStyle = 'rgba(232, 230, 218, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(state.moveTarget.x, state.moveTarget.y, 8, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0c0e14';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Domino mask band.
  ctx.fillStyle = '#14161f';
  ctx.fillRect(p.x - 10, p.y - 4, 20, 7);
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(p.x - 5, p.y - 1, 2, 0, Math.PI * 2);
  ctx.arc(p.x + 5, p.y - 1, 2, 0, Math.PI * 2);
  ctx.fill();
  if (state.hasDiamond) {
    ctx.fillStyle = COLORS.diamond;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - 24); ctx.lineTo(p.x + 6, p.y - 16); ctx.lineTo(p.x, p.y - 8); ctx.lineTo(p.x - 6, p.y - 16);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('YOU', p.x, p.y + 26);
}

function drawNoise(ctx, state) {
  if (!state.noise) return;
  const age = state.time - state.noise.at;
  const radius = 12 + age * 60;
  ctx.strokeStyle = `rgba(232, 178, 58, ${Math.max(0, 0.8 - age * 0.4)})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(state.noise.x, state.noise.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = COLORS.warn;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CLINK!', state.noise.x, state.noise.y - 14);
}

function drawHud(ctx, state) {
  ctx.fillStyle = COLORS.hud;
  ctx.fillRect(0, 0, CANVAS_W, HUD_H);
  ctx.strokeStyle = COLORS.hudLine;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, HUD_H); ctx.lineTo(CANVAS_W, HUD_H); ctx.stroke();

  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('THE MERIDIAN JOB', 16, 28);
  ctx.fillStyle = COLORS.dim;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(state.hasDiamond ? 'Diamond secured — reach the EXIT' : 'Steal the Meridian Diamond, then reach the EXIT', 16, 48);

  // Alarm meter.
  const meterX = 470, meterW = 320, meterY = 18;
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', meterX, meterY + 11);
  ctx.fillStyle = '#262a38';
  roundRect(ctx, meterX + 62, meterY, meterW, 16, 8);
  ctx.fill();
  const frac = Math.min(1, state.alarm / 100);
  ctx.fillStyle = frac > 0.66 ? COLORS.danger : frac > 0.33 ? COLORS.warn : COLORS.safe;
  if (frac > 0) {
    roundRect(ctx, meterX + 62, meterY, Math.max(16, meterW * frac), 16, 8);
    ctx.fill();
  }
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText(`${Math.floor(state.alarm)}%`, meterX + 62 + meterW + 10, meterY + 13);

  // Tools.
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(`EMP [Q] ${'●'.repeat(state.empUses)}${'○'.repeat(2 - state.empUses)}`, 900, 28);
  ctx.fillText(`LURE [E] ${'●'.repeat(state.lureUses)}${'○'.repeat(3 - state.lureUses)}`, 900, 48);
  // Score and time.
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.loot;
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText(`$${state.score}`, CANVAS_W - 16, 28);
  ctx.fillStyle = COLORS.dim;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(`${Math.floor(state.elapsed)}s`, CANVAS_W - 16, 48);
  ctx.textAlign = 'left';
}

function drawBanner(ctx, state) {
  if (state.phase === 'title') {
    ctx.fillStyle = 'rgba(12, 14, 20, 0.72)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 54px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THE MERIDIAN JOB', CANVAS_W / 2, 300);
    ctx.fillStyle = COLORS.loot;
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('One room. Three guards. Two cameras. One diamond.', CANVAS_W / 2, 340);
    ctx.fillStyle = COLORS.dim;
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('WASD / arrows to move · click to walk · Q EMP burst · E toss a noise-maker', CANVAS_W / 2, 380);
    ctx.fillStyle = COLORS.warn;
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText('Press ENTER to start the job', CANVAS_W / 2, 430);
    ctx.textAlign = 'left';
    return;
  }
  if (state.phase === 'busted') {
    ctx.fillStyle = 'rgba(120, 10, 5, 0.55)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 56px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BUSTED!', CANVAS_W / 2, 330);
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('The alarm hit 100%. The gallery locks down. Press ENTER to try again.', CANVAS_W / 2, 372);
    ctx.textAlign = 'left';
    return;
  }
  if (state.phase === 'escaped') {
    ctx.fillStyle = 'rgba(8, 60, 30, 0.6)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CLEAN GETAWAY', CANVAS_W / 2, 330);
    ctx.font = '22px system-ui, sans-serif';
    ctx.fillText(`The Meridian Diamond is yours — $${state.score}. Press ENTER to run it again.`, CANVAS_W / 2, 372);
    ctx.textAlign = 'left';
    return;
  }
  if (state.spottedFlash > 0) {
    ctx.fillStyle = COLORS.danger;
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPOTTED!', CANVAS_W / 2, 130);
    ctx.textAlign = 'left';
  }
}

export function drawScene(ctx, state) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawFloor(ctx);
  drawCover(ctx);
  drawLoot(ctx, state);
  drawNoise(ctx, state);
  drawGuards(ctx, state);
  drawPlayer(ctx, state);
  drawHud(ctx, state);
  // Red vignette as the alarm climbs.
  if (state.alarm > 55 && state.phase === 'playing') {
    const a = ((state.alarm - 55) / 45) * 0.22 * (0.7 + 0.3 * Math.sin(state.time * 6));
    ctx.strokeStyle = `rgba(232, 75, 58, ${a})`;
    ctx.lineWidth = 26;
    ctx.strokeRect(0, HUD_H, CANVAS_W, CANVAS_H - HUD_H);
  }
  drawBanner(ctx, state);
}
