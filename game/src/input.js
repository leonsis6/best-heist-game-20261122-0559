// Keyboard and mouse input: WASD / arrow keys to move, click to walk to a
// point, Q to fire the EMP burst, E to toss a noise-maker at the mouse.
// Edge-triggered actions are consumed once by the game loop.

export function createInput(canvas) {
  const keys = new Set();
  const mouse = { x: 0, y: 0, inside: false };
  let moveTarget = null;
  let empQueued = false;
  let lureQueued = false;
  let startQueued = false;

  const KEYMAP = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
  };

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  window.addEventListener('keydown', (event) => {
    const dir = KEYMAP[event.code];
    if (dir) {
      keys.add(dir);
      moveTarget = null; // keys override click-to-move
      event.preventDefault();
      return;
    }
    if (event.code === 'KeyQ' && !event.repeat) empQueued = true;
    if (event.code === 'KeyE' && !event.repeat) lureQueued = true;
    if ((event.code === 'Enter' || event.code === 'Space') && !event.repeat) startQueued = true;
  });
  window.addEventListener('keyup', (event) => {
    const dir = KEYMAP[event.code];
    if (dir) keys.delete(dir);
  });
  canvas.addEventListener('mousemove', (event) => {
    const p = canvasPoint(event);
    mouse.x = p.x;
    mouse.y = p.y;
    mouse.inside = true;
  });
  canvas.addEventListener('mousedown', (event) => {
    const p = canvasPoint(event);
    mouse.x = p.x;
    mouse.y = p.y;
    moveTarget = p;
  });
  window.addEventListener('blur', () => keys.clear());

  return {
    keys,
    mouse,
    get moveTarget() { return moveTarget; },
    clearMoveTarget() { moveTarget = null; },
    consumeEmp() { const v = empQueued; empQueued = false; return v; },
    consumeLure() { const v = lureQueued; lureQueued = false; return v; },
    consumeStart() { const v = startQueued; startQueued = false; return v; },
  };
}
