#!/usr/bin/env node
/**
 * Convert RGBA sprite to 8-bit paletted PNG for Stratagus engine.
 * 
 * Stratagus requires unit sprites to be 8-bit paletted PNGs.
 * Palette indices 208-211 are reserved for player colors.
 * Index 0 is typically the transparent color key.
 */

const sharp = require('sharp');
const fs = require('fs');
const { PNG } = require('pngjs');

async function convertToPaletted(inputPath, outputPath) {
  // Read the RGBA image
  const metadata = await sharp(inputPath).metadata();
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;

  console.log(`Input: ${width}x${height}, ${info.channels} channels`);

  // Step 1: Collect unique colors (ignoring alpha < 128 as transparent)
  const TRANSPARENT_COLOR = { r: 255, g: 0, b: 255 }; // Magenta = transparent key
  const colorMap = new Map(); // "r,g,b" -> count
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
    if (a < 128) continue; // transparent pixel
    const key = `${r},${g},${b}`;
    colorMap.set(key, (colorMap.get(key) || 0) + 1);
  }

  console.log(`Unique opaque colors: ${colorMap.size}`);

  // Step 2: Build palette - we need 256 entries
  // Index 0 = transparent key (magenta)
  // Indices 1-207 = sprite colors (up to 207 unique colors)
  // Indices 208-211 = player color slots (red by default)
  // Indices 212-255 = remaining colors or padding
  
  const palette = new Array(256).fill(null).map(() => ({ r: 0, g: 0, b: 0 }));
  
  // Index 0: transparent key
  palette[0] = { ...TRANSPARENT_COLOR };
  
  // Player colors at 208-211 (default red team)
  const playerColors = [
    { r: 164, g: 0, b: 0 },
    { r: 124, g: 0, b: 0 },
    { r: 92,  g: 4, b: 0 },
    { r: 68,  g: 4, b: 0 },
  ];
  for (let i = 0; i < 4; i++) {
    palette[208 + i] = playerColors[i];
  }

  // Sort colors by frequency (most common first)
  const sortedColors = [...colorMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => {
      const [r, g, b] = key.split(',').map(Number);
      return { r, g, b };
    });

  // Fill palette indices 1-207 with sprite colors
  const colorToIndex = new Map();
  colorToIndex.set(`${TRANSPARENT_COLOR.r},${TRANSPARENT_COLOR.g},${TRANSPARENT_COLOR.b}`, 0);
  
  let paletteIdx = 1;
  for (const color of sortedColors) {
    if (paletteIdx >= 208) break; // Reserve 208+ for player colors
    const key = `${color.r},${color.g},${color.b}`;
    // Skip if this color is the transparent key
    if (color.r === TRANSPARENT_COLOR.r && color.g === TRANSPARENT_COLOR.g && color.b === TRANSPARENT_COLOR.b) continue;
    palette[paletteIdx] = color;
    colorToIndex.set(key, paletteIdx);
    paletteIdx++;
  }

  // If we have more than 207 colors, we need to quantize (find nearest)
  const needsQuantize = sortedColors.length > 207;
  if (needsQuantize) {
    console.log(`Warning: ${sortedColors.length} colors > 207 available slots, using nearest-color matching`);
  }

  console.log(`Palette: ${paletteIdx} sprite colors + 4 player colors`);

  // Step 3: Create indexed pixel data
  const indexedData = Buffer.alloc(width * height);
  
  function findNearestIndex(r, g, b) {
    let bestIdx = 1;
    let bestDist = Infinity;
    // Only search sprite colors (1 through paletteIdx-1)
    for (let i = 1; i < paletteIdx; i++) {
      const p = palette[i];
      const dr = r - p.r, dg = g - p.g, db = b - p.b;
      const dist = dr*dr + dg*dg + db*db;
      if (dist === 0) return i;
      if (dist < bestDist) { bestDist = dist; bestIdx = i; }
    }
    return bestIdx;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const r = data[srcIdx], g = data[srcIdx+1], b = data[srcIdx+2], a = data[srcIdx+3];
      
      if (a < 128) {
        // Transparent pixel → index 0
        indexedData[y * width + x] = 0;
      } else {
        const key = `${r},${g},${b}`;
        let idx = colorToIndex.get(key);
        if (idx === undefined) {
          idx = findNearestIndex(r, g, b);
        }
        indexedData[y * width + x] = idx;
      }
    }
  }

  // Step 4: Write paletted PNG using pngjs
  const png = new PNG({ 
    width, height, 
    colorType: 3, // indexed color
    inputColorType: 0, // greyscale input (we'll set palette manually)
    bitDepth: 8,
  });

  // Set palette
  png.palette = palette.map(c => [c.r, c.g, c.b, 255]);
  // Index 0 is transparent
  png.palette[0] = [TRANSPARENT_COLOR.r, TRANSPARENT_COLOR.g, TRANSPARENT_COLOR.b, 0];

  // Set pixel data
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x);
      const paletteIndex = indexedData[i];
      // pngjs indexed mode: set all RGBA channels, it uses the palette
      const idx = (y * width + x) << 2;
      const c = png.palette[paletteIndex];
      png.data[idx]     = c[0];
      png.data[idx + 1] = c[1];
      png.data[idx + 2] = c[2];
      png.data[idx + 3] = c[3];
    }
  }

  // Actually pngjs colorType 3 isn't directly supported for writing this way.
  // Let's use a different approach: write raw paletted PNG manually.
  
  // Use sharp to convert: create an RGBA image with the quantized colors,
  // then use sharp's palette mode
  const rgbaBuffer = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcI = y * width + x;
      const dstI = srcI * 4;
      const palIdx = indexedData[srcI];
      const c = palette[palIdx];
      if (palIdx === 0) {
        // Transparent
        rgbaBuffer[dstI] = TRANSPARENT_COLOR.r;
        rgbaBuffer[dstI+1] = TRANSPARENT_COLOR.g;
        rgbaBuffer[dstI+2] = TRANSPARENT_COLOR.b;
        rgbaBuffer[dstI+3] = 0;
      } else {
        rgbaBuffer[dstI] = c.r;
        rgbaBuffer[dstI+1] = c.g;
        rgbaBuffer[dstI+2] = c.b;
        rgbaBuffer[dstI+3] = 255;
      }
    }
  }

  // Use sharp to write as paletted PNG
  await sharp(rgbaBuffer, { raw: { width, height, channels: 4 } })
    .png({ palette: true, colours: 256 })
    .toFile(outputPath);

  // Verify
  const outMeta = await sharp(outputPath).metadata();
  console.log(`Output: ${outMeta.width}x${outMeta.height}, palette: ${outMeta.paletteBitDepth ? 'yes' : outMeta.isOpaque ? 'no-alpha' : 'rgba'}`);
  console.log(`Done: ${outputPath}`);
}

const input = process.argv[2] || 'E:/GrudgeRTS/grudge-rts/graphics/units/knight/knight.png';
const output = process.argv[3] || input; // overwrite by default

convertToPaletted(input, output).catch(console.error);
