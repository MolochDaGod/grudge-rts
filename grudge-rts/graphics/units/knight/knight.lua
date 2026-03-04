local KnightStill = {"frame 0", "wait 6", "frame 1", "wait 6", "frame 2", "wait 6", "frame 3", "wait 6", "frame 4", "wait 6", "frame 5", "wait 6", "goto 0"}
local KnightMove = {"unbreakable begin", "frame 6", "move 4", "wait 2", "frame 7", "move 4", "wait 2", "frame 8", "move 4", "wait 2", "frame 9", "move 4", "wait 2", "frame 10", "move 4", "wait 2", "frame 11", "move 4", "wait 2", "frame 12", "move 4", "wait 2", "frame 13", "move 4", "wait 2", "unbreakable end", "wait 1"}
local KnightAttack = {"unbreakable begin", "frame 14", "wait 3", "frame 15", "wait 3", "frame 16", "wait 3", "frame 17", "wait 3", "frame 18", "attack", "wait 3", "frame 19", "wait 3", "frame 20", "wait 3", "frame 0", "unbreakable end", "wait 1"}
local KnightDeath = {"unbreakable begin", "frame 21", "wait 3", "frame 22", "wait 3", "frame 23", "wait 3", "frame 24", "wait 100", "unbreakable end", "wait 1"}

DefineAnimations("animations-grudge-knight", {
  Still = KnightStill,
  Move = KnightMove,
  Attack = KnightAttack,
  Death = KnightDeath,
})

DefineUnitType("unit-grudge-knight", {
  Name = "Knight",
  Image = {"file", "graphics/units/knight/knight.png", "size", {100, 100}},
  Animations = "animations-grudge-knight",
  Icon = "icon-knight",
  NumDirections = 1,
  Speed = 10,
  HitPoints = 60,
  DrawLevel = 40,
  TileSize = {1, 1}, BoxSize = {92, 92},
  SightRange = 5,
  Armor = 2, BasicDamage = 9, PiercingDamage = 3,
  Missile = "missile-none",
  MaxAttackRange = 1,
  Priority = 60,
  Points = 50,
  Demand = 1,
  Type = "land",
  RightMouseAction = "attack",
  CanAttack = true,
  CanTargetLand = true,
  SelectableByRectangle = true,
  Sounds = {}
})
