// ─── Grudge RTS — Main Game Module ───
import {
  TILE_SIZE, MAP_WIDTH, MAP_HEIGHT,
  FACTIONS, UNIT_DEFS,
  STARTING_GOLD, KNIGHT_COST,
  HUD_HEIGHT, MINIMAP_SIZE,
} from './config.js';
import { GameMap } from './map.js';
import { Unit, AIController } from './units.js';
import { InputHandler } from './input.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.running = false;
    this.frameCount = 0;
    this.fps = 0;
    this.lastFpsTime = 0;
    this.fpsFrames = 0;

    // Camera
    this.camera = {
      x: 0, y: 0,
      viewW: canvas.width,
      viewH: canvas.height - HUD_HEIGHT,
      clamp() {
        const maxX = MAP_WIDTH * TILE_SIZE - this.viewW;
        const maxY = MAP_HEIGHT * TILE_SIZE - this.viewH;
        this.x = Math.max(0, Math.min(this.x, maxX));
        this.y = Math.max(0, Math.min(this.y, maxY));
      }
    };

    // Systems
    this.map = new GameMap();
    this.input = new InputHandler(canvas);
    this.ai = new AIController(FACTIONS.ENEMY);

    // Game state
    this.units = [];
    this.gold = STARTING_GOLD;
    this.sprites = {};
    this.loaded = false;
    this.gameOver = null; // null | 'win' | 'lose'
    this.floatingTexts = []; // {x, y, text, color, life}

    // Training queue
    this.trainingTimer = 0;
    this.trainingQueue = 0;

    this._setupMouseEvents();
  }

  _setupMouseEvents() {
    this.canvas.addEventListener('mouseup', (e) => {
      this.input.handleMouseUp(e, this.camera, this.units, this.map);
    });
  }

  async load() {
    // Load sprites
    const knightImg = new Image();
    knightImg.src = UNIT_DEFS.knight.spriteFile;
    let spriteLoaded = false;
    await new Promise((resolve) => {
      knightImg.onload = () => { spriteLoaded = true; resolve(); };
      knightImg.onerror = () => {
        console.warn('Knight sprite not found, generating fallback');
        resolve();
      };
    });

    if (spriteLoaded) {
      this.sprites.knight = knightImg;
    } else {
      // Generate a fallback spritesheet (25 frames × 100px)
      const fb = document.createElement('canvas');
      const def = UNIT_DEFS.knight;
      fb.width = def.frameW * 25;
      fb.height = def.frameH;
      const fc = fb.getContext('2d');
      const colors = { idle: '#4488cc', walk: '#44cc88', attack: '#cc4444', death: '#666666' };
      const ranges = { idle: [0,5], walk: [6,13], attack: [14,20], death: [21,24] };
      for (const [state, [start, end]] of Object.entries(ranges)) {
        for (let f = start; f <= end; f++) {
          fc.fillStyle = colors[state];
          const pad = 10 + ((f - start) * 2);
          fc.fillRect(f * def.frameW + pad, pad, def.frameW - pad * 2, def.frameH - pad * 2);
          fc.fillStyle = '#fff';
          fc.font = 'bold 14px sans-serif';
          fc.textAlign = 'center';
          fc.fillText(state[0].toUpperCase(), f * def.frameW + def.frameW / 2, def.frameH / 2 + 5);
        }
      }
      this.sprites.knight = fb;
    }

    // Pre-render map
    this.map.buildCache();
    this.loaded = true;
  }

  start() {
    this.spawnInitialUnits();
    this.running = true;
    this.lastFpsTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  spawnInitialUnits() {
    // Player units (top-left)
    const psx = 4 * TILE_SIZE;
    const psy = 4 * TILE_SIZE;
    for (let i = 0; i < 5; i++) {
      const u = new Unit('knight', psx + (i % 3) * 50, psy + Math.floor(i / 3) * 50, FACTIONS.PLAYER);
      this.units.push(u);
    }

    // Enemy units (bottom-right)
    const esx = (MAP_WIDTH - 9) * TILE_SIZE;
    const esy = (MAP_HEIGHT - 9) * TILE_SIZE;
    for (let i = 0; i < 5; i++) {
      const u = new Unit('knight', esx + (i % 3) * 50, esy + Math.floor(i / 3) * 50, FACTIONS.ENEMY);
      this.units.push(u);
    }
  }

  trainKnight() {
    if (this.gold >= KNIGHT_COST && this.trainingQueue < 5) {
      this.gold -= KNIGHT_COST;
      this.trainingQueue++;
    }
  }

  loop(timestamp) {
    if (!this.running) return;

    this.update();
    this.render();

    // FPS counter
    this.fpsFrames++;
    if (timestamp - this.lastFpsTime >= 1000) {
      this.fps = this.fpsFrames;
      this.fpsFrames = 0;
      this.lastFpsTime = timestamp;
    }

    this.frameCount++;
    requestAnimationFrame((t) => this.loop(t));
  }

  addFloatingText(x, y, text, color) {
    this.floatingTexts.push({ x, y, text, color, life: 45 });
  }

  update() {
    if (this.gameOver) return; // freeze game on win/lose

    this.input.updateCamera(this.camera);

    // Update units and collect damage events
    for (const u of this.units) {
      const prevHp = u.hp;
      u.update(this.map, this.units);
      // Detect damage taken this frame
      if (u.hp < prevHp) {
        const dmg = prevHp - u.hp;
        this.addFloatingText(u.centerX, u.y - 4, `-${dmg}`, '#ff4444');
      }
    }

    // Remove dead units after their death animation
    this.units = this.units.filter(u => u.alive || u.removeTimer < 120);

    // AI (with reinforcement spawning)
    const newEnemies = this.ai.update(this.units, this.frameCount);
    if (newEnemies) {
      for (const u of newEnemies) this.units.push(u);
    }

    // Training
    if (this.trainingQueue > 0) {
      this.trainingTimer++;
      if (this.trainingTimer >= 120) { // 2 seconds at 60fps
        this.trainingTimer = 0;
        this.trainingQueue--;
        const u = new Unit('knight', 4 * TILE_SIZE + Math.random() * 100, 4 * TILE_SIZE + Math.random() * 100, FACTIONS.PLAYER);
        this.units.push(u);
      }
    }

    // Passive gold income
    if (this.frameCount % 300 === 0) {
      this.gold += 10;
    }

    // Floating text decay
    for (const ft of this.floatingTexts) {
      ft.y -= 0.8;
      ft.life--;
    }
    this.floatingTexts = this.floatingTexts.filter(ft => ft.life > 0);

    // Right-click marker decay
    if (this.input.rightClickMarker) {
      this.input.rightClickMarker.timer--;
      if (this.input.rightClickMarker.timer <= 0) {
        this.input.rightClickMarker = null;
      }
    }

    // Select all with Ctrl+A
    if (this.input.keys['control'] && this.input.keys['a']) {
      this.units.filter(u => u.alive && u.faction === FACTIONS.PLAYER).forEach(u => u.selected = true);
      this.input.keys['a'] = false;
    }

    // Win / lose check
    const playerAlive = this.units.some(u => u.faction === FACTIONS.PLAYER && u.alive);
    const enemyAlive = this.units.some(u => u.faction === FACTIONS.ENEMY && u.alive);
    if (!playerAlive && this.frameCount > 60) this.gameOver = 'lose';
    else if (!enemyAlive && this.frameCount > 60) this.gameOver = 'win';
  }

  render() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Save and clip to game viewport
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H - HUD_HEIGHT);
    ctx.clip();

    // Draw map
    this.map.draw(ctx, this.camera);

    // Draw units (sorted by Y for overlap)
    const sortedUnits = [...this.units].sort((a, b) => a.y - b.y);
    for (const u of sortedUnits) {
      u.draw(ctx, this.camera, this.sprites.knight);
    }

    // Right-click marker
    if (this.input.rightClickMarker) {
      const m = this.input.rightClickMarker;
      const sx = m.x - this.camera.x;
      const sy = m.y - this.camera.y;
      ctx.strokeStyle = `rgba(0, 255, 136, ${m.timer / 20})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, 12, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Floating damage numbers
    for (const ft of this.floatingTexts) {
      const sx = ft.x - this.camera.x;
      const sy = ft.y - this.camera.y;
      ctx.globalAlpha = Math.min(1, ft.life / 20);
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 14px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, sx, sy);
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
    }

    // Drag selection rectangle
    if (this.input.dragRect && this.input.mouse.down) {
      const r = this.input.dragRect;
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(0, 255, 136, 0.08)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }

    ctx.restore();

    // Game-over overlay
    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.fillStyle = this.gameOver === 'win' ? '#d4a843' : '#cc3333';
      ctx.font = 'bold 48px "Cinzel", serif';
      ctx.fillText(this.gameOver === 'win' ? 'VICTORY' : 'DEFEAT', W / 2, H / 2 - 20);
      ctx.fillStyle = '#aaa';
      ctx.font = '16px "Inter", sans-serif';
      ctx.fillText('Press R to restart', W / 2, H / 2 + 24);
      ctx.textAlign = 'left';
    }

    // HUD
    this.drawHUD(ctx, W, H);
  }

  drawHUD(ctx, W, H) {
    const hudY = H - HUD_HEIGHT;

    // Background
    ctx.fillStyle = '#0e0e14';
    ctx.fillRect(0, hudY, W, HUD_HEIGHT);
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, hudY);
    ctx.lineTo(W, hudY);
    ctx.stroke();

    // Minimap
    const mmX = W - MINIMAP_SIZE - 10;
    const mmY = hudY + 10;
    const mmScale = this.map.drawMinimap(ctx, mmX, mmY, MINIMAP_SIZE);

    // Draw units on minimap
    for (const u of this.units) {
      if (!u.alive) continue;
      ctx.fillStyle = u.faction === FACTIONS.PLAYER ? '#00aaff' : '#ff4444';
      const ux = mmX + (u.centerX / (MAP_WIDTH * TILE_SIZE)) * MINIMAP_SIZE;
      const uy = mmY + (u.centerY / (MAP_HEIGHT * TILE_SIZE)) * MINIMAP_SIZE;
      ctx.fillRect(ux - 1.5, uy - 1.5, 3, 3);
    }

    // Camera viewport on minimap
    ctx.strokeStyle = '#ffffff88';
    ctx.lineWidth = 1;
    const vx = mmX + (this.camera.x / (MAP_WIDTH * TILE_SIZE)) * MINIMAP_SIZE;
    const vy = mmY + (this.camera.y / (MAP_HEIGHT * TILE_SIZE)) * MINIMAP_SIZE;
    const vw = (this.camera.viewW / (MAP_WIDTH * TILE_SIZE)) * MINIMAP_SIZE;
    const vh = (this.camera.viewH / (MAP_HEIGHT * TILE_SIZE)) * MINIMAP_SIZE;
    ctx.strokeRect(vx, vy, vw, vh);

    // Resources
    ctx.fillStyle = '#d4a843';
    ctx.font = 'bold 16px "Cinzel", serif';
    ctx.fillText(`Gold: ${this.gold}`, 16, hudY + 28);

    ctx.fillStyle = '#c8c8d0';
    ctx.font = '13px "Inter", sans-serif';
    ctx.fillText(`FPS: ${this.fps}`, 16, hudY + 50);

    const playerCount = this.units.filter(u => u.faction === FACTIONS.PLAYER && u.alive).length;
    const enemyCount = this.units.filter(u => u.faction === FACTIONS.ENEMY && u.alive).length;
    ctx.fillText(`Units: ${playerCount}  |  Enemies: ${enemyCount}`, 16, hudY + 70);

    if (this.trainingQueue > 0) {
      ctx.fillStyle = '#00ccff';
      ctx.fillText(`Training: ${this.trainingQueue} (${Math.floor((this.trainingTimer / 120) * 100)}%)`, 16, hudY + 90);
    }

    // Selected unit info
    const selected = this.units.filter(u => u.selected && u.alive);
    if (selected.length === 1) {
      const u = selected[0];
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px "Inter", sans-serif';
      ctx.fillText(u.def.name, 220, hudY + 28);

      ctx.fillStyle = '#aaa';
      ctx.font = '12px "Inter", sans-serif';
      ctx.fillText(`HP: ${u.hp}/${u.maxHp}  |  ATK: ${u.def.basicDamage + u.def.piercingDamage}  |  Armor: ${u.armor}`, 220, hudY + 48);
      ctx.fillText(`State: ${u.state}`, 220, hudY + 66);
    } else if (selected.length > 1) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px "Inter", sans-serif';
      ctx.fillText(`${selected.length} units selected`, 220, hudY + 28);
    }

    // Train button
    const btnX = 220;
    const btnY = hudY + 80;
    const btnW = 160;
    const btnH = 32;

    ctx.fillStyle = this.gold >= KNIGHT_COST ? '#2a5a3a' : '#3a2a2a';
    ctx.fillRect(btnX, btnY, btnW, btnH);
    ctx.strokeStyle = this.gold >= KNIGHT_COST ? '#4aaa6a' : '#5a3a3a';
    ctx.strokeRect(btnX, btnY, btnW, btnH);
    ctx.fillStyle = this.gold >= KNIGHT_COST ? '#aaffcc' : '#886666';
    ctx.font = '12px "Inter", sans-serif';
    ctx.fillText(`Train Knight (${KNIGHT_COST}g) [T]`, btnX + 8, btnY + 20);

    // Store button bounds for click detection
    this._trainBtn = { x: btnX, y: btnY, w: btnW, h: btnH };

    // Controls help
    ctx.fillStyle = '#555';
    ctx.font = '11px "Inter", sans-serif';
    ctx.fillText('WASD: Scroll  |  LMB: Select  |  RMB: Move/Attack  |  T: Train  |  Ctrl+A: Select All', 16, hudY + HUD_HEIGHT - 10);
  }

  handleHUDClick(mx, my) {
    if (this._trainBtn) {
      const b = this._trainBtn;
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
        this.trainKnight();
        return true;
      }
    }
    return false;
  }

  resize(w, h) {
    this.canvas.width = w;
    this.canvas.height = h;
    this.camera.viewW = w;
    this.camera.viewH = h - HUD_HEIGHT;
  }
}
