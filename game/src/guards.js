// Guards and cameras: patrols with sweeping vision cones, chases when the
// thief is seen, investigations when a noise-maker lands nearby, and wall
// cameras that sweep a fixed arc until an EMP burst takes them offline.

import { TUNING } from './config.js';
import { lineOfSightClear, distance } from './world.js';

export function createGuard(def, index, rng) {
  const [sx, sy] = def.waypoints[0];
  return {
    name: def.name,
    color: def.color,
    waypoints: def.waypoints,
    speed: def.speed,
    range: def.range,
    halfAngle: def.halfAngle,
    x: sx,
    y: sy,
    facing: rng() * Math.PI * 2,
    waypointIndex: 1,
    state: 'patrol', // patrol | sweep | chase | investigate
    pauseLeft: 0,
    sweepPhase: rng() * Math.PI * 2,
    sweepBase: 0,
    chaseLeft: 0,
    investigateTarget: null,
    investigateLeft: 0,
    lastSeen: null,
    index,
  };
}

export function createCamera(def) {
  return {
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    sweep: def.sweep,
    speed: def.speed,
    range: def.range,
    halfAngle: def.halfAngle,
    angle: def.baseAngle,
    disabledLeft: 0,
  };
}

// Is the target inside the watcher's cone and in open sight?
export function inVisionCone(watcher, tx, ty) {
  const dx = tx - watcher.x;
  const dy = ty - watcher.y;
  const dist = Math.hypot(dx, dy);
  if (dist > watcher.range) return false;
  let diff = Math.atan2(dy, dx) - watcher.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > watcher.halfAngle) return false;
  return lineOfSightClear(watcher.x, watcher.y, tx, ty);
}

function angleToward(x, y, tx, ty) {
  return Math.atan2(ty - y, tx - x);
}

function turnToward(current, target, maxStep) {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) <= maxStep) return target;
  return current + Math.sign(diff) * maxStep;
}

function stepToward(entity, tx, ty, speed, dt) {
  const dx = tx - entity.x;
  const dy = ty - entity.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const step = Math.min(dist, speed * dt);
  entity.x += (dx / dist) * step;
  entity.y += (dy / dist) * step;
  entity.facing = angleToward(entity.x, entity.y, tx, ty);
  return dist - step < 2;
}

// One guard tick. Returns 'seen' when the guard has the thief in its cone.
export function updateGuard(guard, dt, time, player, alarmHigh) {
  const sees = inVisionCone(guard, player.x, player.y);
  const speedBoost = alarmHigh ? 22 : 0;

  if (sees) {
    guard.state = 'chase';
    guard.chaseLeft = TUNING.chaseLoseSightSec;
    guard.lastSeen = { x: player.x, y: player.y };
  }

  if (guard.state === 'chase') {
    if (guard.lastSeen) stepToward(guard, guard.lastSeen.x, guard.lastSeen.y, TUNING.chaseSpeed + speedBoost, dt);
    guard.chaseLeft -= dt;
    if (!sees && guard.chaseLeft <= 0) {
      guard.state = 'patrol';
      guard.lastSeen = null;
    }
    return sees;
  }

  if (guard.state === 'investigate') {
    const arrived = stepToward(guard, guard.investigateTarget.x, guard.investigateTarget.y, TUNING.investigateSpeed, dt);
    if (arrived) {
      guard.investigateLeft -= dt;
      guard.facing += Math.sin(time * 2.2 + guard.index) * 1.6 * dt; // look around
      if (guard.investigateLeft <= 0) guard.state = 'patrol';
    }
    return sees;
  }

  if (guard.state === 'sweep') {
    guard.pauseLeft -= dt;
    guard.facing = guard.sweepBase + Math.sin(guard.sweepPhase + time * 1.4) * 0.9;
    if (guard.pauseLeft <= 0) {
      guard.state = 'patrol';
      guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
    }
    return sees;
  }

  // Patrol: walk the loop, stop and sweep at each waypoint.
  const [wx, wy] = guard.waypoints[guard.waypointIndex];
  const arrived = stepToward(guard, wx, wy, guard.speed + speedBoost, dt);
  if (arrived) {
    guard.state = 'sweep';
    guard.pauseLeft = 1.4;
    guard.sweepBase = guard.facing;
    guard.sweepPhase = time * 1.4;
  }
  return sees;
}

// Send every guard in earshot to check out a noise.
export function sendGuardsToNoise(guards, x, y) {
  for (const guard of guards) {
    if (guard.state === 'chase') continue;
    if (distance(guard.x, guard.y, x, y) <= TUNING.lureHearRadius) {
      guard.state = 'investigate';
      guard.investigateTarget = { x, y };
      guard.investigateLeft = TUNING.lureInvestigateSec;
    }
  }
}

export function updateCamera(camera, dt, time) {
  if (camera.disabledLeft > 0) {
    camera.disabledLeft -= dt;
    return;
  }
  camera.angle = camera.baseAngle + Math.sin(time * camera.speed) * camera.sweep;
}

export function cameraSeesPlayer(camera, player) {
  if (camera.disabledLeft > 0) return false;
  return inVisionCone(camera, player.x, player.y);
}
