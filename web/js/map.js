// ─── Grudge RTS — Map Module ───
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from './config.js';

// Tile types
export const TILE = { GRASS: 0, WATER: 1, TREE: 2, DIRT: 3 };

const TILE_COLORS = {
  [TILE.GRASS]: ['#3a7d2c','#3f8531','#358226','#448a35'],
  [TILE.WATER]: ['#1a5276','#1f6090','#174d6b','#225e88'],
  [TILE.TREE]:  ['#2d6b1f','#256018','#1e5213','#34751f'],
  [TILE.DIRT]:  ['#8b7355','#7d6648','#9a8060','#6e5a3b'],
};

export class GameMap {
  constructor() {
    this.width = MAP_WIDTH;
    this.height = MAP_HEIGHT;
    this.tiles = [];
    this.generate();
    this.tileCanvas = null; // cached tile rendering
  }

  generate() {
    const rng = (n) => Math.floor(Math.random() * n);
    this.tiles = [];

    for (let y = 0; y < this.height; y++) {
      const row = [];
      for (let x = 0; x < this.width; x++) {
        // Water border (2 tiles thick)
        if (x < 2 || x >= this.width - 2 || y < 2 || y >= this.height - 2) {
          row.push(TILE.WATER);
        } else if (Math.random() < 0.06) {
          row.push(TILE.TREE);
        } else if (Math.random() < 0.04) {
          row.push(TILE.DIRT);
        } else {
          row.push(TILE.GRASS);
        }
      }
      this.tiles.push(row);
    }

    // Clear spawn areas (top-left for player, bottom-right for enemy)
    this.clearArea(3, 3, 8, 8);
    this.clearArea(this.width - 11, this.height - 11, 8, 8);
  }

  clearArea(sx, sy, w, h) {
    for (let y = sy; y < sy + h && y < this.height; y++) {
      for (let x = sx; x < sx + w && x < this.width; x++) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
          this.tiles[y][x] = TILE.GRASS;
        }
      }
    }
  }

  isWalkable(tx, ty) {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return false;
    const tile = this.tiles[ty][tx];
    return tile === TILE.GRASS || tile === TILE.DIRT;
  }

  isWalkableWorld(wx, wy) {
    return this.isWalkable(Math.floor(wx / TILE_SIZE), Math.floor(wy / TILE_SIZE));
  }

  // Pre-render tiles to offscreen canvas for performance
  buildCache() {
    this.tileCanvas = document.createElement('canvas');
    this.tileCanvas.width = this.width * TILE_SIZE;
    this.tileCanvas.height = this.height * TILE_SIZE;
    const ctx = this.tileCanvas.getContext('2d');

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.tiles[y][x];
        const colors = TILE_COLORS[tile];
        const color = colors[(x * 7 + y * 13) % colors.length];
        ctx.fillStyle = color;
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

        // Trees get an overlay circle
        if (tile === TILE.TREE) {
          ctx.fillStyle = '#1a4a10';
          ctx.beginPath();
          ctx.arc(x * TILE_SIZE + 16, y * TILE_SIZE + 12, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#5a3a1a';
          ctx.fillRect(x * TILE_SIZE + 14, y * TILE_SIZE + 20, 4, 12);
        }

        // Grid lines (subtle)
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  draw(ctx, camera) {
    if (!this.tileCanvas) this.buildCache();

    // Only draw visible portion
    const sx = Math.max(0, Math.floor(camera.x));
    const sy = Math.max(0, Math.floor(camera.y));
    const sw = Math.min(this.tileCanvas.width - sx, camera.viewW);
    const sh = Math.min(this.tileCanvas.height - sy, camera.viewH);

    if (sw > 0 && sh > 0) {
      ctx.drawImage(this.tileCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
    }
  }

  drawMinimap(ctx, x, y, size) {
    const scaleX = size / (this.width * TILE_SIZE);
    const scaleY = size / (this.height * TILE_SIZE);

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x, y, size, size);

    const tileW = size / this.width;
    const tileH = size / this.height;

    for (let ty = 0; ty < this.height; ty++) {
      for (let tx = 0; tx < this.width; tx++) {
        const tile = this.tiles[ty][tx];
        if (tile === TILE.WATER) ctx.fillStyle = '#1a5276';
        else if (tile === TILE.TREE) ctx.fillStyle = '#1e5213';
        else if (tile === TILE.DIRT) ctx.fillStyle = '#8b7355';
        else ctx.fillStyle = '#3a7d2c';
        ctx.fillRect(x + tx * tileW, y + ty * tileH, tileW + 0.5, tileH + 0.5);
      }
    }

    return { scaleX, scaleY };
  }
}
