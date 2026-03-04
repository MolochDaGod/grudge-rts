--  Grudge RTS - Standalone Stratagus Configuration
--  Minimal self-contained game for testing Grudge sprite pipeline

DebugPrint("Grudge RTS loading...\n")

-------------------------------------------------------------------------------
--  Lua 5.x compatibility
-------------------------------------------------------------------------------
if (_VERSION == "Lua 5.2" or _VERSION == "Lua 5.3") then
  function table:getn() return #self end
  function table:foreach(f)
    for key, value in pairs(self) do f(key, value) end
  end
  function table:foreachi(f)
    for k, v in ipairs(self) do f(k, v) end
  end
end

-------------------------------------------------------------------------------
--  Game info
-------------------------------------------------------------------------------
SetGameName("grudge-rts")
SetFullGameName("Grudge RTS")

-------------------------------------------------------------------------------
--  Video
-------------------------------------------------------------------------------
SetVideoResolution(800, 600)

-------------------------------------------------------------------------------
--  Game settings
-------------------------------------------------------------------------------
SetTrainingQueue(true)
SetBuildingCapture(false)
SetRevealAttacker(true)
Preference.ShowSightRange = false
Preference.ShowAttackRange = false
Preference.ShowReactionRange = false

SetGameSpeed(30)

-------------------------------------------------------------------------------
--  Resources
-------------------------------------------------------------------------------
DefineDefaultResourceNames("gold", "wood", "oil")

-------------------------------------------------------------------------------
--  Damage formula (use Stratagus default)
-------------------------------------------------------------------------------
-- SetDamageFormula not needed for testing

-------------------------------------------------------------------------------
--  Player colors
-------------------------------------------------------------------------------
DefinePlayerColorIndex(208, 4)
DefinePlayerColors({
  "red",     {{164, 0, 0}, {124, 0, 0}, {92, 4, 0}, {68, 4, 0}},
  "blue",    {{0, 0, 252}, {0, 0, 188}, {0, 0, 128}, {0, 0, 68}},
  "green",   {{44, 180, 148}, {20, 132, 92}, {4, 84, 44}, {0, 40, 12}},
  "violet",  {{152, 72, 176}, {116, 44, 132}, {80, 24, 88}, {44, 8, 44}},
  "orange",  {{248, 140, 20}, {200, 96, 16}, {152, 60, 16}, {108, 32, 12}},
  "black",   {{40, 40, 60}, {28, 28, 44}, {20, 20, 32}, {12, 12, 20}},
  "white",   {{224, 224, 224}, {152, 152, 180}, {84, 84, 128}, {36, 40, 76}},
  "yellow",  {{252, 252, 72}, {228, 204, 40}, {204, 160, 16}, {180, 116, 0}},
  "red",     {{164, 0, 0}, {124, 0, 0}, {92, 4, 0}, {68, 4, 0}},
  "blue",    {{0, 0, 252}, {0, 0, 188}, {0, 0, 128}, {0, 0, 68}},
  "green",   {{44, 180, 148}, {20, 132, 92}, {4, 84, 44}, {0, 40, 12}},
  "violet",  {{152, 72, 176}, {116, 44, 132}, {80, 24, 88}, {44, 8, 44}},
  "orange",  {{248, 140, 20}, {200, 96, 16}, {152, 60, 16}, {108, 32, 12}},
  "black",   {{40, 40, 60}, {28, 28, 44}, {20, 20, 32}, {12, 12, 20}},
  "white",   {{224, 224, 224}, {152, 152, 180}, {84, 84, 128}, {36, 40, 76}},
  "yellow",  {{252, 252, 72}, {228, 204, 40}, {204, 160, 16}, {180, 116, 0}},
})

-------------------------------------------------------------------------------
--  Race definitions
-------------------------------------------------------------------------------
DefineRaceNames(
  "race", {
    "name", "human",
    "display", "Human",
    "visible"},
  "race", {
    "name", "orc",
    "display", "Orc",
    "visible"},
  "race", {
    "name", "neutral",
    "display", "Neutral"
  })

-------------------------------------------------------------------------------
--  Variables & Bool Flags
-------------------------------------------------------------------------------
DefineVariables("Speed")

-------------------------------------------------------------------------------
--  Missile (required)
-------------------------------------------------------------------------------
DefineMissileType("missile-none", {
  File = "",
  Size = {0, 0},
  Frames = 1, NumDirections = 1,
  DrawLevel = 50,
  Class = "missile-class-none",
  Speed = 0, Range = 0, SplashFactor = 0,
})

-------------------------------------------------------------------------------
--  Cursors
-------------------------------------------------------------------------------
DefineCursor({
  Name = "cursor-point",
  Race = "any",
  File = "graphics/ui/cursor.png",
  HotSpot = {0, 0},
  Size = {32, 32},
})
DefineCursor({
  Name = "cursor-green-hair",
  Race = "any",
  File = "graphics/ui/cursor.png",
  HotSpot = {0, 0},
  Size = {32, 32},
})
DefineCursor({
  Name = "cursor-yellow-hair",
  Race = "any",
  File = "graphics/ui/cursor.png",
  HotSpot = {0, 0},
  Size = {32, 32},
})
DefineCursor({
  Name = "cursor-red-hair",
  Race = "any",
  File = "graphics/ui/cursor.png",
  HotSpot = {0, 0},
  Size = {32, 32},
})
DefineCursor({
  Name = "cursor-glass",
  Race = "any",
  File = "graphics/ui/cursor.png",
  HotSpot = {0, 0},
  Size = {32, 32},
})
DefineCursor({
  Name = "cursor-cross",
  Race = "any",
  File = "graphics/ui/cursor.png",
  HotSpot = {0, 0},
  Size = {32, 32},
})
DefineCursor({
  Name = "cursor-scroll",
  Race = "any",
  File = "graphics/ui/cursor.png",
  HotSpot = {0, 0},
  Size = {32, 32},
})
DefineCursor({
  Name = "cursor-arrow-e",
  Race = "any",
  File = "graphics/ui/cursor.png",
  HotSpot = {0, 0},
  Size = {32, 32},
})
DefineCursor({
  Name = "cursor-arrow-ne",
  Race = "any",
  File = "graphics/ui/cursor.png",
  HotSpot = {0, 0},
  Size = {32, 32},
})
DefineCursor({
  Name = "cursor-arrow-n",
  Race = "any",
  File = "graphics/ui/cursor.png",
  HotSpot = {0, 0},
  Size = {32, 32},
})
DefineCursor({
  Name = "cursor-arrow-nw",
  Race = "any",
  File = "graphics/ui/cursor.png",
  HotSpot = {0, 0},
  Size = {32, 32},
})
DefineCursor({
  Name = "cursor-arrow-w",
  Race = "any",
  File = "graphics/ui/cursor.png",
  HotSpot = {0, 0},
  Size = {32, 32},
})
DefineCursor({
  Name = "cursor-arrow-sw",
  Race = "any",
  File = "graphics/ui/cursor.png",
  HotSpot = {0, 0},
  Size = {32, 32},
})
DefineCursor({
  Name = "cursor-arrow-s",
  Race = "any",
  File = "graphics/ui/cursor.png",
  HotSpot = {0, 0},
  Size = {32, 32},
})
DefineCursor({
  Name = "cursor-arrow-se",
  Race = "any",
  File = "graphics/ui/cursor.png",
  HotSpot = {0, 0},
  Size = {32, 32},
})

-------------------------------------------------------------------------------
--  Icons (none needed for minimal testing)
-------------------------------------------------------------------------------

-------------------------------------------------------------------------------
--  Init
-------------------------------------------------------------------------------
InitFuncs = {}
function InitFuncs:add(f)
  table.insert(self, f)
end
function InitGameVariables()
  for i = 1, table.getn(InitFuncs) do
    InitFuncs[i]()
  end
end

-------------------------------------------------------------------------------
--  AI
-------------------------------------------------------------------------------
DefineAi("ai-passive", "*", "ai-passive", function()
  AiForce(0, {})
  return false
end)

DefineAi("wc2-passive", "*", "wc2-passive", function()
  AiForce(0, {})
  return false
end)

-------------------------------------------------------------------------------
--  Load UI
-------------------------------------------------------------------------------
Load("scripts/ui.lua")

-------------------------------------------------------------------------------
--  Load units
-------------------------------------------------------------------------------
Load("scripts/units.lua")

-- Map launching is handled by scripts/guichan.lua after engine initialization
