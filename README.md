# Grudge RTS

A browser-based real-time strategy game set in the Grudge Warlords universe. Play instantly at the deployed URL — no downloads required.

## Play Now

The game is deployed on Vercel and runs entirely in the browser using HTML5 Canvas.

## Controls

- **WASD / Arrow keys** — Scroll the map
- **Left click** — Select unit | **Drag** — Box select
- **Right click** — Move selected units / Attack enemies
- **T** — Train a new Knight (costs 80 gold)
- **Ctrl+A** — Select all your units
- **R** — Restart (after win/lose)

## Project Structure

```
web/                 # Playable web game (deployed to Vercel)
  index.html         # Game entry point with Canvas
  js/
    config.js        # Unit stats, map size, UI constants
    game.js          # Main loop, camera, HUD, training, win/lose
    units.js         # Unit class, animations, combat, AI controller
    input.js         # Mouse/keyboard handling, selection, commands
    map.js           # Tile map generation and rendering
  assets/
    knight.png       # 25-frame spritesheet (100×100px per frame)

grudge-rts/          # Stratagus engine game data (desktop reference)
  scripts/           # Lua game scripts
  graphics/          # Sprite source assets
  maps/              # Map files

tools/               # Sprite conversion tools
```

## Features

- **Tile-based map** — Procedural 48×48 grid with grass, water, trees, dirt
- **Animated sprites** — Knight unit with idle, walk, attack, death animations
- **Unit selection** — Click, box-select, Ctrl+A
- **Combat** — Melee attacks with floating damage numbers
- **AI opponent** — Enemy faction with aggro, patrol, and reinforcement spawning
- **Economy** — Gold income, knight training queue
- **HUD** — Minimap, resource bar, unit stats panel
- **Win/Lose** — Game detects when either side is eliminated

## Current Units

**Knight** — 60 HP, 12 ATK (9 basic + 3 piercing), 2 Armor, melee range

## Roadmap

- [ ] Add more unit types from Grudge Warlords sprite library (65+ characters)
- [ ] Building construction and resource gathering
- [ ] Faction-based AI with crew mechanics
- [ ] Multiplayer via Colyseus lobby integration

## License

Game data and sprites are proprietary to Grudge Studio.
