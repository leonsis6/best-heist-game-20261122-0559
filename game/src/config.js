// The Meridian Job — room layout, tuning and palette.
// One room, one job: cross the Meridian Gallery, lift the diamond from its
// pedestal and slip out the service door without tripping the alarm.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;
export const HUD_H = 64;

// Playable room inside the outer wall (wall thickness 12).
export const ROOM = { x: 16, y: HUD_H + 16, w: 1248, h: 624 };

// Furniture and fixtures. Every rect blocks movement and blocks sight:
// a guard cannot see through a display counter, a crate stack or a planter.
export const COVER = [
  { x: 300, y: 250, w: 220, h: 70, kind: 'counter', label: 'DISPLAY COUNTER' },
  { x: 640, y: 180, w: 150, h: 60, kind: 'desk', label: 'CURATOR DESK' },
  { x: 640, y: 480, w: 150, h: 60, kind: 'desk', label: 'CURATOR DESK' },
  { x: 180, y: 420, w: 110, h: 80, kind: 'crates', label: 'CRATES' },
  { x: 980, y: 180, w: 70, h: 70, kind: 'plant', label: 'PALM' },
  { x: 980, y: 520, w: 70, h: 70, kind: 'plant', label: 'PALM' },
  { x: 1120, y: 330, w: 90, h: 90, kind: 'pedestal', label: 'VAULT PEDESTAL' },
];

// The loot. The diamond sits on the vault pedestal; the two cash stacks are
// optional side scores for a thief who wants to risk a longer route.
export const DIAMOND = { x: 1165, y: 375, r: 16, value: 500 };
export const CASH = [
  { x: 250, y: 620, r: 14, value: 100, taken: false },
  { x: 900, y: 640, r: 14, value: 100, taken: false },
];

// Entry door (bottom centre) and the service exit (bottom left).
export const ENTRY = { x: 640, y: 668 };
export const EXIT = { x: 56, y: 660, w: 104, h: 44 };

// Guards patrol the room on waypoint loops and sweep their gaze at each stop.
export const GUARD_DEFS = [
  {
    name: 'Mara',
    waypoints: [[300, 150], [900, 150], [900, 300], [300, 300]],
    speed: 75, range: 205, halfAngle: 0.62, color: '#e8b23a',
  },
  {
    name: 'Doss',
    waypoints: [[200, 500], [600, 500], [600, 620], [200, 620]],
    speed: 70, range: 195, halfAngle: 0.62, color: '#e8743a',
  },
  {
    name: 'Ilya',
    waypoints: [[1050, 150], [1050, 600]],
    speed: 88, range: 215, halfAngle: 0.58, color: '#3aa7e8',
  },
];

// Wall cameras sweep a fixed arc from their mount.
export const CAMERA_DEFS = [
  { x: 520, y: 96, baseAngle: Math.PI / 2, sweep: 0.7, speed: 0.55, range: 265, halfAngle: 0.5 },
  { x: 1252, y: 300, baseAngle: Math.PI, sweep: 0.6, speed: 0.45, range: 265, halfAngle: 0.5 },
];

export const TUNING = {
  playerSpeed: 178,
  playerRadius: 14,
  guardRadius: 15,
  chaseSpeed: 138,
  investigateSpeed: 105,
  alarmGuardPerSec: 55,
  alarmCameraPerSec: 42,
  alarmSuspicionPerSec: 8,
  alarmDecayPerSec: 14,
  alarmBusted: 100,
  empUses: 2,
  empDurationSec: 6,
  lureUses: 3,
  lureHearRadius: 380,
  lureInvestigateSec: 4,
  chaseLoseSightSec: 2.5,
};

export const COLORS = {
  floor: '#1b1e28',
  floorTile: '#20242f',
  wall: '#3a3f52',
  wallTop: '#4a5068',
  hud: '#10121a',
  hudLine: '#2a2e40',
  text: '#e8e6da',
  dim: '#9a978a',
  safe: '#57c785',
  danger: '#e84b3a',
  warn: '#e8b23a',
  loot: '#7fe3ff',
  diamond: '#b8f4ff',
  player: '#f2f0e4',
  cone: 'rgba(232, 178, 58, 0.20)',
  coneHot: 'rgba(232, 75, 58, 0.32)',
  camCone: 'rgba(127, 227, 255, 0.16)',
};
