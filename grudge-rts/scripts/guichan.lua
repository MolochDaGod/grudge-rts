--  Grudge RTS - Minimal Guichan Script
--  Skip menus, go straight to test map

DebugPrint("Grudge RTS: Launching test map...\n")

-- Initialize game variables
InitGameVariables()
SetFogOfWar(false)

-- Start the test map directly
StartMap("maps/test.smp")
