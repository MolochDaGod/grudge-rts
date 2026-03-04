#!/usr/bin/env node
/**
 * Generate a minimal Stratagus test map for Grudge RTS sprite testing.
 * Creates a 32x32 grass map with Grudge Knight units.
 */

const fs = require('fs');
const path = require('path');

const MAP_SIZE = 32;
const GRASS_TILE = 0; // First tile in our grass tileset
const OUTPUT = path.resolve(__dirname, '../grudge-rts/maps/test.sms');
// Only output to Grudge RTS directory

const lines = [];

lines.push('-- Grudge RTS Test Map - Knight Sprite Test');
lines.push('-- Auto-generated test map');
lines.push('');

// Player setup
lines.push('-- Player 0 = Human player (red), Player 1 = AI enemy (blue)');
lines.push('SetStartView(0, 5, 5)');
lines.push('SetPlayerData(0, "Resources", "gold", 10000)');
lines.push('SetPlayerData(0, "Resources", "wood", 5000)');
lines.push('SetPlayerData(0, "Resources", "oil", 1000)');
lines.push('SetPlayerData(0, "RaceName", "human")');
lines.push('SetAiType(0, "wc2-passive")');
lines.push('');
lines.push('SetStartView(1, 25, 25)');
lines.push('SetPlayerData(1, "Resources", "gold", 10000)');
lines.push('SetPlayerData(1, "Resources", "wood", 5000)');
lines.push('SetPlayerData(1, "Resources", "oil", 1000)');
lines.push('SetPlayerData(1, "RaceName", "orc")');
lines.push('SetAiType(1, "wc2-passive")');
lines.push('');

// Load tileset
lines.push('LoadTileModels("scripts/tilesets/grass.lua")');
lines.push('');

// Set all tiles to grass
lines.push('-- Tile map (32x32 grass)');
for (let y = 0; y < MAP_SIZE; y++) {
  for (let x = 0; x < MAP_SIZE; x++) {
    lines.push(`SetTile(${GRASS_TILE}, ${x}, ${y}, 0)`);
  }
}
lines.push('');

// Grudge units already loaded by stratagus.lua
lines.push('');

// Place units
lines.push('-- Place Grudge Knights for player 0');
lines.push('CreateUnit("unit-grudge-knight", 0, {5, 10})');
lines.push('CreateUnit("unit-grudge-knight", 0, {7, 10})');
lines.push('CreateUnit("unit-grudge-knight", 0, {9, 10})');
lines.push('CreateUnit("unit-grudge-knight", 0, {5, 12})');
lines.push('CreateUnit("unit-grudge-knight", 0, {7, 12})');
lines.push('');

// Place enemy knights for player 1
lines.push('-- Place Grudge Knights for player 1 (enemy)');
lines.push('CreateUnit("unit-grudge-knight", 1, {25, 20})');
lines.push('CreateUnit("unit-grudge-knight", 1, {27, 20})');
lines.push('CreateUnit("unit-grudge-knight", 1, {25, 22})');
lines.push('');

// All units are Grudge units
lines.push('');

// Fog of war off for testing
lines.push('SetFogOfWar(false)');
lines.push('');

// Victory/defeat conditions
lines.push('AddTrigger(');
lines.push('  function() return (GetNumOpponents(GetThisPlayer()) == 0) end,');
lines.push('  function() ActionVictory() return false end');
lines.push(')');

const content = lines.join('\n') + '\n';

// Write map file
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, content);
console.log(`Wrote: ${OUTPUT}`);

console.log(`\nMap: ${MAP_SIZE}x${MAP_SIZE} grass, 5 player knights + 3 enemy knights + Wargus footmen/grunts`);
