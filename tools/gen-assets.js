#!/usr/bin/env node
/**
 * Generate minimal assets for standalone Grudge RTS testing.
 * Creates: tileset image, placeholder icon, and cursor graphics.
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BASE = 'E:\\GrudgeRTS\\grudge-rts';

async function main() {
  // --- Tileset: 32x32 grass tile (simple green) ---
  const tilesetDir = path.join(BASE, 'graphics', 'tilesets');
  fs.mkdirSync(tilesetDir, { recursive: true });

  // Create a 2x1 tileset image (2 tiles: grass dark, grass light) — each 32x32
  const tileBuf = await sharp({
    create: { width: 64, height: 32, channels: 4, background: { r: 40, g: 120, b: 40, alpha: 255 } }
  })
    .composite([
      // Right tile slightly lighter
      {
        input: await sharp({
          create: { width: 32, height: 32, channels: 4, background: { r: 50, g: 140, b: 50, alpha: 255 } }
        }).png().toBuffer(),
        left: 32, top: 0,
      }
    ])
    .png().toBuffer();
  fs.writeFileSync(path.join(tilesetDir, 'grass.png'), tileBuf);
  console.log('Created: grass tileset (64x32, 2 tiles)');

  // --- Unit icon: 46x38 placeholder (matches Stratagus default icon size) ---
  const iconDir = path.join(BASE, 'graphics', 'icons');
  fs.mkdirSync(iconDir, { recursive: true });

  // Extract first idle frame from knight sprite as icon
  const knightSprite = path.join(BASE, 'graphics', 'units', 'knight', 'knight.png');
  if (fs.existsSync(knightSprite)) {
    const iconBuf = await sharp(knightSprite)
      .extract({ left: 0, top: 0, width: 100, height: 100 })
      .resize(46, 38, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png().toBuffer();
    fs.writeFileSync(path.join(iconDir, 'knight-icon.png'), iconBuf);
    console.log('Created: knight icon (46x38)');
  }

  // --- Cursor: simple 16x16 white arrow ---
  const cursorDir = path.join(BASE, 'graphics', 'ui');
  fs.mkdirSync(cursorDir, { recursive: true });

  // 16x16 white pixel as minimal cursor
  const cursorBuf = await sharp({
    create: { width: 32, height: 32, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 255 } }
  }).png().toBuffer();
  fs.writeFileSync(path.join(cursorDir, 'cursor.png'), cursorBuf);
  console.log('Created: cursor placeholder (32x32)');

  // --- Font placeholder: 1x1 ---
  const fontDir = path.join(BASE, 'graphics', 'fonts');
  fs.mkdirSync(fontDir, { recursive: true });

  console.log('\nAll minimal assets generated in:', BASE);
}

main().catch(console.error);
