#!/usr/bin/env node
/**
 * Grudge Sprite Converter
 *
 * Reads individual Grudge animation strip PNGs (idle.png, walk.png, attack1.png, death.png)
 * and combines them into a single Stratagus-compatible sprite sheet PNG.
 * Also generates Lua animation definitions for DefineAnimations / DefineUnitType.
 *
 * Stratagus sprite layout with NumDirections=1:
 *   - All frames in a single row, left-to-right
 *   - Frame N = the Nth cell (0-indexed)
 *   - Image size = {cellWidth, cellHeight}
 *
 * Usage:
 *   node convert.js --unit knight --src <sprites-dir> --out <output-dir> [--size 100]
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// --- Animation mappings (Grudge animation name → Stratagus purpose) ---
// Order matters: determines frame layout in the combined sheet
const ANIM_ORDER = ['idle', 'walk', 'attack1', 'death'];

// Default frame counts per unit type (from spriteMap.js)
const UNIT_DEFAULTS = {
  knight: {
    folder: 'knight',
    size: 100,
    anims: { idle: 6, walk: 8, attack1: 7, death: 4 }
  },
  archer: {
    folder: 'archer',
    size: 100,
    anims: { idle: 6, walk: 8, attack1: 9, death: 4 }
  },
  priest: {
    folder: 'priest',
    size: 100,
    anims: { idle: 6, walk: 8, attack1: 9, death: 4 }
  },
  orc: {
    folder: 'orc',
    size: 100,
    anims: { idle: 6, walk: 8, attack1: 7, death: 4 }
  },
  'orc-rider': {
    folder: 'orc-rider',
    size: 100,
    anims: { idle: 6, walk: 8, attack1: 8, death: 4 }
  },
  skeleton: {
    folder: 'skeleton',
    size: 100,
    anims: { idle: 6, walk: 8, attack1: 7, death: 4 }
  },
  viking: {
    folder: 'viking',
    size: 48,
    anims: { idle: 5, walk: 6, attack1: 4, death: 3 }
  },
  'dwarf-mage': {
    folder: 'dwarf-mage',
    size: 96,
    anims: { idle: 6, walk: 8, attack1: 5, death: 4 }
  },
  'free-knight': {
    folder: 'free-knight',
    sizeW: 120, sizeH: 80,
    anims: { idle: 10, walk: 10, attack1: 4, death: 10 }
  },
};

// --- CLI parsing ---
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--unit') opts.unit = args[++i];
    else if (args[i] === '--src') opts.src = args[++i];
    else if (args[i] === '--out') opts.out = args[++i];
    else if (args[i] === '--size') opts.size = parseInt(args[++i], 10);
    else if (args[i] === '--sizeW') opts.sizeW = parseInt(args[++i], 10);
    else if (args[i] === '--sizeH') opts.sizeH = parseInt(args[++i], 10);
    else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`Usage: node convert.js --unit <name> --src <sprites-dir> --out <output-dir> [--size N]`);
      console.log(`\nKnown units: ${Object.keys(UNIT_DEFAULTS).join(', ')}`);
      process.exit(0);
    }
  }
  return opts;
}

// --- Auto-detect frame count from strip width ---
async function detectFrameCount(filePath, cellSize) {
  const meta = await sharp(filePath).metadata();
  return Math.floor(meta.width / cellSize);
}

// --- Main conversion ---
async function convert() {
  const opts = parseArgs();

  if (!opts.unit) {
    console.error('Error: --unit is required');
    process.exit(1);
  }

  const defaults = UNIT_DEFAULTS[opts.unit];
  const unitName = opts.unit;
  const folder = defaults?.folder || unitName;

  // Determine sprite source directory
  const defaultSrcBase = path.resolve(__dirname, '../../wyrmsun-ref'); // fallback
  const grudgeSpriteBase = 'C:\\Users\\nugye\\Documents\\1111111\\Warlord-Crafting-Suite\\game-modes\\GRUDA-Wars\\GRUDA-Wars\\public\\sprites';
  const srcDir = opts.src || path.join(grudgeSpriteBase, folder);

  // Output directory
  const outDir = opts.out || path.resolve(__dirname, '../../grudge-rts/graphics/units', unitName);
  fs.mkdirSync(outDir, { recursive: true });

  // Cell dimensions
  const cellW = opts.sizeW || opts.size || defaults?.sizeW || defaults?.size || 100;
  const cellH = opts.sizeH || opts.size || defaults?.sizeH || defaults?.size || 100;

  console.log(`\n=== Grudge Sprite Converter ===`);
  console.log(`Unit:   ${unitName}`);
  console.log(`Source: ${srcDir}`);
  console.log(`Output: ${outDir}`);
  console.log(`Cell:   ${cellW}x${cellH}`);

  // Gather frames from each animation strip
  const animData = []; // { name, frames, startFrame }
  let totalFrames = 0;

  for (const animName of ANIM_ORDER) {
    // Try common file name patterns
    const candidates = [
      `${animName}.png`,
      `${animName.charAt(0).toUpperCase() + animName.slice(1)}.png`,
      animName === 'walk' ? 'run.png' : null,
      animName === 'walk' ? 'Run.png' : null,
    ].filter(Boolean);

    let filePath = null;
    for (const candidate of candidates) {
      const fp = path.join(srcDir, candidate);
      if (fs.existsSync(fp)) {
        filePath = fp;
        break;
      }
    }

    if (!filePath) {
      console.warn(`  WARNING: No ${animName} sprite found in ${srcDir}, skipping`);
      continue;
    }

    // Detect or use default frame count
    let frameCount;
    if (defaults?.anims?.[animName]) {
      frameCount = defaults.anims[animName];
    } else {
      frameCount = await detectFrameCount(filePath, cellW);
    }

    animData.push({
      name: animName,
      file: filePath,
      frameCount,
      startFrame: totalFrames,
    });
    totalFrames += frameCount;
    console.log(`  ${animName}: ${frameCount} frames (start: ${animData[animData.length - 1].startFrame})`);
  }

  if (totalFrames === 0) {
    console.error('Error: No animation frames found!');
    process.exit(1);
  }

  // --- Build combined sprite sheet ---
  console.log(`\nCombining ${totalFrames} frames into single sheet...`);

  const sheetWidth = totalFrames * cellW;
  const sheetHeight = cellH;

  // Create compositing operations
  const composites = [];
  for (const anim of animData) {
    const strip = sharp(anim.file);
    const meta = await strip.metadata();

    // Extract each frame from the strip and place it in the combined sheet
    for (let f = 0; f < anim.frameCount; f++) {
      const extractLeft = f * cellW;
      const globalFrame = anim.startFrame + f;

      // Extract single frame from strip
      const frameBuffer = await sharp(anim.file)
        .extract({ left: extractLeft, top: 0, width: cellW, height: cellH })
        .toBuffer();

      composites.push({
        input: frameBuffer,
        left: globalFrame * cellW,
        top: 0,
      });
    }
  }

  // Create transparent base and composite all frames
  const combined = await sharp({
    create: {
      width: sheetWidth,
      height: sheetHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toBuffer();

  const outPng = path.join(outDir, `${unitName}.png`);
  fs.writeFileSync(outPng, combined);
  console.log(`  -> ${outPng} (${sheetWidth}x${sheetHeight})`);

  // --- Generate Lua animation definitions ---
  const luaLines = [];
  const animId = `animations-grudge-${unitName}`;
  const unitId = `unit-grudge-${unitName}`;

  // Build animation lookup
  const animLookup = {};
  for (const a of animData) {
    animLookup[a.name] = a;
  }

  // Still (idle) animation
  if (animLookup.idle) {
    const a = animLookup.idle;
    const frames = [];
    for (let f = 0; f < a.frameCount; f++) {
      frames.push(`"frame ${a.startFrame + f}", "wait 6"`);
    }
    luaLines.push(`local ${capitalize(unitName)}Still = {${frames.join(', ')}, "goto 0"}`);
  }

  // Move (walk) animation — must move 32 pixels total (1 tile)
  if (animLookup.walk) {
    const a = animLookup.walk;
    const pixelsPerTile = 32;
    const movePerFrame = Math.max(1, Math.floor(pixelsPerTile / a.frameCount));
    const remainder = pixelsPerTile - movePerFrame * a.frameCount;

    const frames = ['"unbreakable begin"'];
    for (let f = 0; f < a.frameCount; f++) {
      const extra = f === a.frameCount - 1 ? remainder : 0;
      const moveAmt = movePerFrame + extra;
      frames.push(`"frame ${a.startFrame + f}", "move ${moveAmt}", "wait 2"`);
    }
    frames.push('"unbreakable end", "wait 1"');
    luaLines.push(`local ${capitalize(unitName)}Move = {${frames.join(', ')}}`);
  }

  // Attack animation
  if (animLookup.attack1) {
    const a = animLookup.attack1;
    const frames = ['"unbreakable begin"'];
    for (let f = 0; f < a.frameCount; f++) {
      if (f === Math.floor(a.frameCount * 0.6)) {
        // Trigger attack damage at ~60% through animation
        frames.push(`"frame ${a.startFrame + f}", "attack", "wait 3"`);
      } else {
        frames.push(`"frame ${a.startFrame + f}", "wait 3"`);
      }
    }
    frames.push(`"frame ${animLookup.idle ? animLookup.idle.startFrame : 0}", "unbreakable end", "wait 1"`);
    luaLines.push(`local ${capitalize(unitName)}Attack = {${frames.join(', ')}}`);
  }

  // Death animation
  if (animLookup.death) {
    const a = animLookup.death;
    const frames = ['"unbreakable begin"'];
    for (let f = 0; f < a.frameCount; f++) {
      const waitTime = f === a.frameCount - 1 ? 100 : 3;
      frames.push(`"frame ${a.startFrame + f}", "wait ${waitTime}"`);
    }
    frames.push('"unbreakable end", "wait 1"');
    luaLines.push(`local ${capitalize(unitName)}Death = {${frames.join(', ')}}`);
  }

  // DefineAnimations
  luaLines.push('');
  luaLines.push(`DefineAnimations("${animId}", {`);
  if (animLookup.idle) luaLines.push(`  Still = ${capitalize(unitName)}Still,`);
  if (animLookup.walk) luaLines.push(`  Move = ${capitalize(unitName)}Move,`);
  if (animLookup.attack1) luaLines.push(`  Attack = ${capitalize(unitName)}Attack,`);
  if (animLookup.death) luaLines.push(`  Death = ${capitalize(unitName)}Death,`);
  luaLines.push('})');

  // DefineUnitType
  const relGraphicsPath = `graphics/units/${unitName}/${unitName}.png`;
  luaLines.push('');
  luaLines.push(`DefineUnitType("${unitId}", {`);
  luaLines.push(`  Name = "${capitalize(unitName)}",`);
  luaLines.push(`  Image = {"file", "${relGraphicsPath}", "size", {${cellW}, ${cellH}}},`);
  luaLines.push(`  Animations = "${animId}",`);
  luaLines.push(`  Icon = "icon-${unitName}",`);
  luaLines.push(`  NumDirections = 1,`);
  luaLines.push(`  Speed = 10,`);
  luaLines.push(`  HitPoints = 60,`);
  luaLines.push(`  DrawLevel = 40,`);
  luaLines.push(`  TileSize = {1, 1}, BoxSize = {${cellW - 8}, ${cellH - 8}},`);
  luaLines.push(`  SightRange = 5,`);
  luaLines.push(`  Armor = 2, BasicDamage = 9, PiercingDamage = 3,`);
  luaLines.push(`  Missile = "missile-none",`);
  luaLines.push(`  MaxAttackRange = 1,`);
  luaLines.push(`  Priority = 60,`);
  luaLines.push(`  Points = 50,`);
  luaLines.push(`  Demand = 1,`);
  luaLines.push(`  Type = "land",`);
  luaLines.push(`  RightMouseAction = "attack",`);
  luaLines.push(`  CanAttack = true,`);
  luaLines.push(`  CanTargetLand = true,`);
  luaLines.push(`  SelectableByRectangle = true,`);
  luaLines.push(`  Sounds = {}`);
  luaLines.push('})');

  const luaOut = path.join(outDir, `${unitName}.lua`);
  fs.writeFileSync(luaOut, luaLines.join('\n') + '\n');
  console.log(`  -> ${luaOut}`);

  console.log(`\nDone! Unit "${unitId}" ready for Stratagus.\n`);
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-(\w)/g, (_, c) => c.toUpperCase());
}

convert().catch(err => {
  console.error('Conversion failed:', err);
  process.exit(1);
});
