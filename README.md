# Grudge RTS

A real-time strategy game built on the [Stratagus engine](https://github.com/Wargus/stratagus), using sprite assets from the Grudge Warlords universe.

## Overview

Grudge RTS brings the Grudge Warlords characters into a classic RTS format. Units are rendered using the existing 2D sprite library with side-view animations, adapted for the Stratagus engine's tile-based gameplay.

## Project Structure

```
grudge-rts/          # Game data directory (point Stratagus here with -d)
  scripts/           # Lua game scripts
    stratagus.lua    # Main config (races, resources, cursors, AI)
    units.lua        # Unit type definitions and animations
    ui.lua           # UI layout, fonts, button styles
    guichan.lua      # Menu/game launcher script
    tilesets/         # Tileset definitions
  graphics/          # Sprite assets
    units/           # Unit sprites (8-bit indexed PNG, 256-color palette)
    tilesets/         # Tileset images
    ui/              # Cursor and UI graphics
    fonts/           # Bitmap fonts
  maps/              # Map files
    test.smp         # Map presentation (metadata)
    test.sms         # Map script (tiles, units, triggers)

tools/               # Development tools
  make-indexed-png.js    # Convert RGBA sprites → 8-bit indexed PNG for Stratagus
  convert-to-paletted.js # Alternative palette converter

web/                 # Landing page (deployed to Vercel)
```

## Requirements

- **Stratagus v3.3.3+** — built from [source](https://github.com/Wargus/stratagus)
- **Node.js 18+** — for sprite conversion tools

## Quick Start

```bash
# Build Stratagus engine (see Wargus/stratagus repo for build instructions)

# Run the game
stratagus.exe -d path/to/grudge-rts -p -W
```

## Sprite Pipeline

Stratagus requires unit sprites as **8-bit indexed PNGs** (color type 3) with a 256-color palette:
- Index 0 = transparent (magenta `#FF00FF`)
- Indices 208–211 = player color slots (remapped at runtime per team)

Convert RGBA sprites using:
```bash
node tools/make-indexed-png.js input.png output.png
```

## Current Units

| Unit | Frames | Animations |
|------|--------|-----------|
| Knight | 25 (100×100px) | Idle (0-5), Walk (6-13), Attack (14-20), Death (21-24) |

## Roadmap

- [ ] Add more unit types from Grudge Warlords sprite library (65+ characters)
- [ ] Custom tilesets with island/medieval themes
- [ ] Building construction and resource gathering
- [ ] Faction-based AI with crew mechanics
- [ ] Multiplayer via Colyseus lobby integration

## License

Game data and sprites are proprietary to Grudge Studio.
Engine (Stratagus) is licensed under GPL v2.
