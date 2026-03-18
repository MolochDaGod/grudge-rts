// ─── Grudge RTS — Unit Module ───
import { UNIT_DEFS, FACTIONS, TILE_SIZE } from './config.js';

let nextId = 1;

export class Unit {
  constructor(type, x, y, faction) {
    const def = UNIT_DEFS[type];
    this.id = nextId++;
    this.type = type;
    this.def = def;
    this.faction = faction;

    // Position (world px)
    this.x = x;
    this.y = y;

    // Stats
    this.hp = def.hp;
    this.maxHp = def.maxHp;
    this.armor = def.armor;
    this.speed = def.speed;

    // State
    this.state = 'idle';       // idle, walk, attack, death
    this.selected = false;
    this.alive = true;
    this.removeTimer = 0;

    // Movement
    this.targetX = x;
    this.targetY = y;
    this.facingLeft = faction === FACTIONS.ENEMY;

    // Combat
    this.attackTarget = null;
    this.attackCooldown = 0;

    // Animation
    this.animFrame = 0;
    this.animTick = 0;
  }

  get centerX() { return this.x + this.def.drawSize / 2; }
  get centerY() { return this.y + this.def.drawSize / 2; }

  distanceTo(other) {
    const dx = this.centerX - other.centerX;
    const dy = this.centerY - other.centerY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  moveTo(tx, ty) {
    this.targetX = tx - this.def.drawSize / 2;
    this.targetY = ty - this.def.drawSize / 2;
    this.attackTarget = null;
    this.state = 'walk';
  }

  attackUnit(target) {
    this.attackTarget = target;
  }

  takeDamage(amount) {
    const reduced = Math.max(1, amount - this.armor);
    this.hp -= reduced;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.state = 'death';
      this.animFrame = 0;
      this.animTick = 0;
      this.selected = false;
    }
    return reduced;
  }

  update(gameMap, allUnits) {
    if (!this.alive) {
      this.updateAnim();
      const anim = this.def.anims.death;
      if (this.animFrame >= anim.frames.length - 1) {
        this.removeTimer++;
      }
      return;
    }

    if (this.attackCooldown > 0) this.attackCooldown--;

    // Attack target management
    if (this.attackTarget) {
      if (!this.attackTarget.alive) {
        this.attackTarget = null;
        this.state = 'idle';
      } else {
        const dist = this.distanceTo(this.attackTarget);
        if (dist <= this.def.attackRange) {
          // In range — attack
          this.state = 'attack';
          this.facingLeft = this.attackTarget.centerX < this.centerX;
          if (this.attackCooldown <= 0) {
            const dmg = this.def.basicDamage + this.def.piercingDamage;
            this.attackTarget.takeDamage(dmg);
            this.attackCooldown = this.def.attackCooldown;
          }
        } else {
          // Move towards target
          this.targetX = this.attackTarget.x;
          this.targetY = this.attackTarget.y;
          this.state = 'walk';
        }
      }
    }

    // Movement
    if (this.state === 'walk') {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 2) {
        const nx = (dx / dist) * this.speed;
        const ny = (dy / dist) * this.speed;
        const newX = this.x + nx;
        const newY = this.y + ny;

        if (gameMap.isWalkableWorld(newX + this.def.drawSize / 2, newY + this.def.drawSize / 2)) {
          this.x = newX;
          this.y = newY;
        }
        this.facingLeft = dx < 0;
      } else if (!this.attackTarget) {
        this.state = 'idle';
      }
    }

    this.updateAnim();
  }

  updateAnim() {
    const anim = this.def.anims[this.state] || this.def.anims.idle;
    this.animTick++;
    if (this.animTick >= anim.speed) {
      this.animTick = 0;
      this.animFrame++;
      if (this.state === 'death') {
        if (this.animFrame >= anim.frames.length) {
          this.animFrame = anim.frames.length - 1;
        }
      } else {
        this.animFrame = this.animFrame % anim.frames.length;
      }
    }
  }

  getSpriteFrame() {
    const anim = this.def.anims[this.state] || this.def.anims.idle;
    const idx = Math.min(this.animFrame, anim.frames.length - 1);
    return anim.frames[idx];
  }

  isInside(wx, wy) {
    return wx >= this.x && wx <= this.x + this.def.drawSize &&
           wy >= this.y && wy <= this.y + this.def.drawSize;
  }

  isInsideRect(rx, ry, rw, rh) {
    const cx = this.centerX;
    const cy = this.centerY;
    const left = Math.min(rx, rx + rw);
    const right = Math.max(rx, rx + rw);
    const top = Math.min(ry, ry + rh);
    const bottom = Math.max(ry, ry + rh);
    return cx >= left && cx <= right && cy >= top && cy <= bottom;
  }

  draw(ctx, camera, spriteImg) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    const size = this.def.drawSize;

    // Don't draw if off-screen
    if (sx + size < 0 || sy + size < 0 || sx > camera.viewW || sy > camera.viewH) return;

    const frame = this.getSpriteFrame();

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (this.facingLeft) {
      ctx.translate(sx + size, sy);
      ctx.scale(-1, 1);
      ctx.drawImage(spriteImg, frame * this.def.frameW, 0, this.def.frameW, this.def.frameH, 0, 0, size, size);
    } else {
      ctx.drawImage(spriteImg, frame * this.def.frameW, 0, this.def.frameW, this.def.frameH, sx, sy, size, size);
    }
    ctx.restore();

    // Faction color tint overlay
    if (this.alive) {
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = this.faction === FACTIONS.PLAYER ? '#0088ff' : '#ff4444';
      ctx.fillRect(sx, sy, size, size);
      ctx.globalAlpha = 1.0;
    }

    // Selection ring
    if (this.selected) {
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(sx + size / 2, sy + size - 4, size / 2.2, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Health bar
    if (this.alive && this.hp < this.maxHp) {
      const barW = size;
      const barH = 4;
      const bx = sx;
      const by = sy - 8;
      ctx.fillStyle = '#333';
      ctx.fillRect(bx, by, barW, barH);
      ctx.fillStyle = this.hp > this.maxHp * 0.5 ? '#00cc44' : this.hp > this.maxHp * 0.25 ? '#ddaa00' : '#dd2200';
      ctx.fillRect(bx, by, barW * (this.hp / this.maxHp), barH);
    }
  }
}

// Simple AI controller
export class AIController {
  constructor(faction) {
    this.faction = faction;
    this.tick = 0;
    this.aggroRange = 6 * TILE_SIZE;
  }

  update(units) {
    this.tick++;
    if (this.tick % 30 !== 0) return; // Think every 30 frames

    const myUnits = units.filter(u => u.faction === this.faction && u.alive);
    const enemies = units.filter(u => u.faction !== this.faction && u.alive);

    for (const unit of myUnits) {
      if (unit.attackTarget && unit.attackTarget.alive) continue; // Already fighting

      // Find closest enemy in aggro range
      let closest = null;
      let closestDist = this.aggroRange;
      for (const e of enemies) {
        const d = unit.distanceTo(e);
        if (d < closestDist) {
          closestDist = d;
          closest = e;
        }
      }

      if (closest) {
        unit.attackUnit(closest);
      }
    }
  }
}
