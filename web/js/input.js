// ─── Grudge RTS — Input Module ───
import { FACTIONS, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, MINIMAP_SIZE, HUD_HEIGHT } from './config.js';

const EDGE_SCROLL_ZONE = 20;
const SCROLL_SPEED = 8;

export class InputHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = {};
    this.mouse = { x: 0, y: 0, down: false, button: 0 };
    this.dragStart = null;
    this.dragRect = null;
    this.rightClickMarker = null;

    this._bindEvents();
  }

  _bindEvents() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.mouse.down = true;
      this.mouse.button = e.button;
      this.mouse.x = e.offsetX;
      this.mouse.y = e.offsetY;
      if (e.button === 0) {
        this.dragStart = { x: e.offsetX, y: e.offsetY };
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      this.mouse.x = e.offsetX;
      this.mouse.y = e.offsetY;
      if (this.dragStart && this.mouse.down && this.mouse.button === 0) {
        this.dragRect = {
          x: this.dragStart.x,
          y: this.dragStart.y,
          w: e.offsetX - this.dragStart.x,
          h: e.offsetY - this.dragStart.y,
        };
      }
    });

    this.canvas.addEventListener('mouseup', (e) => {
      this.mouse.down = false;
    });

    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  // Call from game loop to process clicks
  processClick(camera, units, gameMap, gold) {
    // Nothing to process if mouse not just released
    return null;
  }

  handleMouseUp(e, camera, units, gameMap) {
    const mx = e.offsetX;
    const my = e.offsetY;
    const btn = e.button;

    // Check minimap click
    const mmX = this.canvas.width - MINIMAP_SIZE - 10;
    const mmY = this.canvas.height - HUD_HEIGHT + 10;
    if (mx >= mmX && mx <= mmX + MINIMAP_SIZE && my >= mmY && my <= mmY + MINIMAP_SIZE) {
      const relX = (mx - mmX) / MINIMAP_SIZE;
      const relY = (my - mmY) / MINIMAP_SIZE;
      camera.x = relX * MAP_WIDTH * TILE_SIZE - camera.viewW / 2;
      camera.y = relY * MAP_HEIGHT * TILE_SIZE - camera.viewH / 2;
      camera.clamp();
      this.dragStart = null;
      this.dragRect = null;
      return { type: 'minimap' };
    }

    const worldX = mx + camera.x;
    const worldY = my + camera.y;

    if (btn === 0) {
      // Left click — select
      const selected = units.filter(u => u.selected);

      if (this.dragRect && (Math.abs(this.dragRect.w) > 8 || Math.abs(this.dragRect.h) > 8)) {
        // Box select
        const rx = this.dragRect.x + camera.x;
        const ry = this.dragRect.y + camera.y;
        units.forEach(u => u.selected = false);
        units.filter(u => u.alive && u.faction === FACTIONS.PLAYER)
             .forEach(u => {
               if (u.isInsideRect(rx, ry, this.dragRect.w, this.dragRect.h)) {
                 u.selected = true;
               }
             });
      } else {
        // Single click select
        units.forEach(u => u.selected = false);
        const clicked = units.find(u => u.alive && u.faction === FACTIONS.PLAYER && u.isInside(worldX, worldY));
        if (clicked) clicked.selected = true;
      }

      this.dragStart = null;
      this.dragRect = null;
      return { type: 'select' };
    }

    if (btn === 2) {
      // Right click — move or attack
      const selected = units.filter(u => u.selected && u.alive && u.faction === FACTIONS.PLAYER);
      if (selected.length === 0) return null;

      // Check if clicking an enemy unit
      const target = units.find(u => u.alive && u.faction === FACTIONS.ENEMY && u.isInside(worldX, worldY));

      if (target) {
        selected.forEach(u => u.attackUnit(target));
        return { type: 'attack', target };
      } else {
        // Move command with formation spread
        const count = selected.length;
        const cols = Math.ceil(Math.sqrt(count));
        selected.forEach((u, i) => {
          const row = Math.floor(i / cols);
          const col = i % cols;
          u.moveTo(worldX + col * 40 - (cols * 20), worldY + row * 40 - (Math.ceil(count / cols) * 20));
        });

        this.rightClickMarker = { x: worldX, y: worldY, timer: 20 };
        return { type: 'move' };
      }
    }

    return null;
  }

  updateCamera(camera) {
    const sp = SCROLL_SPEED;

    // Keyboard scroll (WASD or arrow keys)
    if (this.keys['w'] || this.keys['arrowup'])    camera.y -= sp;
    if (this.keys['s'] || this.keys['arrowdown'])   camera.y += sp;
    if (this.keys['a'] || this.keys['arrowleft'])   camera.x -= sp;
    if (this.keys['d'] || this.keys['arrowright'])   camera.x += sp;

    // Edge scroll
    if (this.mouse.x < EDGE_SCROLL_ZONE) camera.x -= sp;
    if (this.mouse.x > this.canvas.width - EDGE_SCROLL_ZONE) camera.x += sp;
    if (this.mouse.y < EDGE_SCROLL_ZONE) camera.y -= sp;
    if (this.mouse.y > this.canvas.height - EDGE_SCROLL_ZONE) camera.y += sp;

    camera.clamp();
  }
}
