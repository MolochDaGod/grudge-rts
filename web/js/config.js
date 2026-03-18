// ─── Grudge RTS — Game Configuration ───
// Unit stats ported from grudge-rts/scripts/units.lua & stratagus.lua

export const TILE_SIZE = 32;
export const MAP_WIDTH = 48;
export const MAP_HEIGHT = 48;

export const PLAYER_COLORS = {
  red:    '#a40000',
  blue:   '#0000fc',
  green:  '#2cb494',
  orange: '#f88c14',
};

export const FACTIONS = {
  PLAYER: 'player',
  ENEMY:  'enemy',
  NEUTRAL:'neutral',
};

// Knight unit definition (from units.lua)
export const UNIT_DEFS = {
  knight: {
    name:           'Knight',
    spriteFile:     'assets/knight.png',
    frameW:         100,
    frameH:         100,
    drawSize:       48,           // rendered size on map
    speed:          1.8,          // px per frame
    hp:             60,
    maxHp:          60,
    armor:          2,
    basicDamage:    9,
    piercingDamage: 3,
    attackRange:    48,           // melee range in px
    sightRange:     5 * TILE_SIZE,
    attackCooldown: 40,           // frames between attacks
    anims: {
      idle:   { frames: [0,1,2,3,4,5],             speed: 12 },
      walk:   { frames: [6,7,8,9,10,11,12,13],     speed: 6  },
      attack: { frames: [14,15,16,17,18,19,20],    speed: 5  },
      death:  { frames: [21,22,23,24],              speed: 8  },
    },
  },
};

// Resources
export const STARTING_GOLD = 500;
export const KNIGHT_COST = 80;

// UI
export const HUD_HEIGHT = 160;
export const MINIMAP_SIZE = 140;
