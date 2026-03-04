--  Grudge RTS - Minimal grass tileset

DefineTileset("name", "Grass",
  "image", "graphics/tilesets/grass.png",
  -- Slots descriptions
  "slots", {
    "special", {
      "top-one-tree", 0,
      "mid-one-tree", 0,
      "bot-one-tree", 0,
      "removed-tree", 0,
      "top-one-rock", 0,
      "mid-one-rock", 0,
      "bot-one-rock", 0,
      "removed-rock", 0
    },
    "solid", { "light-grass", "land",
              {0, 1, 0, 1}},                -- 000
  }
)
