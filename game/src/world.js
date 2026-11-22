// Room geometry: circle-vs-rectangle collision and line-of-sight tests.
// Cover blocks both movement and sight, so a thief behind a counter is safe
// from a cone sweeping the other side of it.

import { ROOM, COVER } from './config.js';

// Move a circle one axis at a time so it slides along walls instead of sticking.
export function moveCircle(pos, radius, dx, dy) {
  const blockers = COVER;
  let nx = pos.x + dx;
  if (!hitsAny(nx, pos.y, radius, blockers) && insideRoom(nx, pos.y, radius)) pos.x = nx;
  let ny = pos.y + dy;
  if (!hitsAny(pos.x, ny, radius, blockers) && insideRoom(pos.x, ny, radius)) pos.y = ny;
}

function insideRoom(x, y, radius) {
  return (
    x - radius >= ROOM.x + 12 &&
    x + radius <= ROOM.x + ROOM.w - 12 &&
    y - radius >= ROOM.y + 12 &&
    y + radius <= ROOM.y + ROOM.h - 12
  );
}

function hitsAny(x, y, radius, rects) {
  for (const r of rects) {
    if (circleHitsRect(x, y, radius, r)) return true;
  }
  return false;
}

export function circleHitsRect(cx, cy, radius, rect) {
  const nearX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const nearY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const ddx = cx - nearX;
  const ddy = cy - nearY;
  return ddx * ddx + ddy * ddy < radius * radius;
}

// True when the segment from watcher to target crosses no cover rect.
export function lineOfSightClear(ax, ay, bx, by) {
  for (const r of COVER) {
    if (segmentHitsRect(ax, ay, bx, by, r)) return false;
  }
  return true;
}

function segmentHitsRect(ax, ay, bx, by, rect) {
  // Liang-Barsky clip: the segment enters the rect when t enters [0, 1].
  let t0 = 0;
  let t1 = 1;
  const dx = bx - ax;
  const dy = by - ay;
  const p = [-dx, dx, -dy, dy];
  const q = [ax - rect.x, rect.x + rect.w - ax, ay - rect.y, rect.y + rect.h - ay];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return true;
}

export function distance(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}
