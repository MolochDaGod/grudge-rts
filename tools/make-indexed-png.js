#!/usr/bin/env node
/**
 * Convert RGBA sprite to proper 8-bit indexed PNG (color type 3) for Stratagus.
 * Uses pngjs to write a real indexed PNG with a 256-entry palette.
 * Palette index 0 = transparent, indices 208-211 = player colors.
 */
const sharp = require('sharp');
const fs = require('fs');
const zlib = require('zlib');

async function makeIndexedPng(inputPath, outputPath) {
  // Read RGBA pixels
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const W = info.width, H = info.height;
  console.log(`Input: ${W}x${H}`);

  // Collect unique opaque colors
  const colorMap = new Map(); // "r,g,b" -> count
  for (let i = 0; i < data.length; i += 4) {
    if (data[i+3] < 128) continue;
    const key = `${data[i]},${data[i+1]},${data[i+2]}`;
    colorMap.set(key, (colorMap.get(key) || 0) + 1);
  }
  console.log(`Unique opaque colors: ${colorMap.size}`);

  // Build 256-entry palette
  // Index 0 = transparent (magenta FF00FF)
  // Indices 1..207 = sprite colors
  // Indices 208..211 = player colors (red)
  // Indices 212..255 = padding (black)
  const pal = [];
  for (let i = 0; i < 256; i++) pal.push([0, 0, 0]);
  pal[0] = [255, 0, 255]; // transparent key

  // Player colors at 208-211
  pal[208] = [164, 0, 0];
  pal[209] = [124, 0, 0];
  pal[210] = [92, 4, 0];
  pal[211] = [68, 4, 0];

  // Sort by frequency, fill 1..207
  const sorted = [...colorMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k.split(',').map(Number));

  const c2i = new Map();
  c2i.set('255,0,255', 0); // magenta → transparent
  let pi = 1;
  for (const [r, g, b] of sorted) {
    if (pi >= 208) break;
    if (r === 255 && g === 0 && b === 255) continue;
    pal[pi] = [r, g, b];
    c2i.set(`${r},${g},${b}`, pi);
    pi++;
  }
  console.log(`Used ${pi - 1} palette slots for sprite colors`);
  if (sorted.length > 207) {
    console.log(`WARNING: ${sorted.length} colors > 207 slots, nearest-match used`);
  }

  // Map pixels to indices
  const pixels = Buffer.alloc(W * H);
  function nearest(r, g, b) {
    let best = 1, bestD = Infinity;
    for (let i = 1; i < pi; i++) {
      const dr = r - pal[i][0], dg = g - pal[i][1], db = b - pal[i][2];
      const d = dr*dr + dg*dg + db*db;
      if (d === 0) return i;
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const si = (y * W + x) * 4;
      if (data[si+3] < 128) {
        pixels[y * W + x] = 0;
      } else {
        const key = `${data[si]},${data[si+1]},${data[si+2]}`;
        let idx = c2i.get(key);
        if (idx === undefined) idx = nearest(data[si], data[si+1], data[si+2]);
        pixels[y * W + x] = idx;
      }
    }
  }

  // Write PNG manually (color type 3, 8-bit indexed)
  const buf = [];
  function writeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeB = Buffer.from(type, 'ascii');
    const crcData = Buffer.concat([typeB, data]);
    const crc = Buffer.alloc(4);
    crc.writeInt32BE(crc32(crcData));
    buf.push(len, typeB, data, crc);
  }

  // CRC32 table
  const crcTable = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    crcTable[n] = c;
  }
  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    return crc ^ 0xFFFFFFFF;
  }

  // PNG signature
  buf.push(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 3;  // color type: indexed
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  writeChunk('IHDR', ihdr);

  // PLTE (256 entries × 3 bytes)
  const plte = Buffer.alloc(256 * 3);
  for (let i = 0; i < 256; i++) {
    plte[i*3] = pal[i][0];
    plte[i*3+1] = pal[i][1];
    plte[i*3+2] = pal[i][2];
  }
  writeChunk('PLTE', plte);

  // tRNS (transparency: index 0 = fully transparent, rest = opaque)
  const trns = Buffer.alloc(256);
  trns[0] = 0; // index 0 = transparent
  for (let i = 1; i < 256; i++) trns[i] = 255; // rest opaque
  writeChunk('tRNS', trns);

  // IDAT (compressed pixel data with filter byte per row)
  const rawData = Buffer.alloc(H * (1 + W)); // filter byte + pixels per row
  for (let y = 0; y < H; y++) {
    rawData[y * (1 + W)] = 0; // filter: none
    pixels.copy(rawData, y * (1 + W) + 1, y * W, (y + 1) * W);
  }
  const compressed = zlib.deflateSync(rawData, { level: 9 });
  writeChunk('IDAT', compressed);

  // IEND
  writeChunk('IEND', Buffer.alloc(0));

  fs.writeFileSync(outputPath, Buffer.concat(buf));
  console.log(`Written: ${outputPath} (${fs.statSync(outputPath).size} bytes)`);

  // Verify
  const meta = await sharp(outputPath).metadata();
  console.log(`Verify: ${meta.width}x${meta.height}, paletteBitDepth: ${meta.paletteBitDepth}, channels: ${meta.channels}`);
}

const input = process.argv[2] || 'E:/GrudgeRTS/grudge-rts/graphics/units/knight/knight_rgba_backup.png';
const output = process.argv[3] || 'E:/GrudgeRTS/grudge-rts/graphics/units/knight/knight.png';
makeIndexedPng(input, output).catch(console.error);
