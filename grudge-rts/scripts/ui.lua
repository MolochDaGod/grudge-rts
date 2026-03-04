--  Grudge RTS - Minimal UI Setup
--  Just enough to get the engine to render units on the map

DebugPrint("Loading Grudge UI...\n")

-------------------------------------------------------------------------------
--  Fonts (using the Wargus contrib bitmap font for all sizes)
-------------------------------------------------------------------------------
CFont:New("small", CGraphic:New("graphics/fonts/default.png", 6, 12))
CFont:New("game",  CGraphic:New("graphics/fonts/default.png", 6, 12))
CFont:New("large", CGraphic:New("graphics/fonts/default.png", 6, 12))

-------------------------------------------------------------------------------
--  Font Colors
-------------------------------------------------------------------------------
local function DefineFontColor(id, t)
  local fc = CFontColor:New(id)
  for i = 1, table.getn(t) / 3 do
    fc.Colors[i - 1] = CColor(t[(i - 1) * 3 + 1], t[(i - 1) * 3 + 2], t[(i - 1) * 3 + 3])
  end
end

DefineFontColor("white",   {255,255,255, 255,255,255, 255,255,255, 255,255,255, 255,255,255, 255,255,255, 255,255,255, 255,255,255})
DefineFontColor("yellow",  {255,255,0,   255,255,0,   255,255,0,   255,255,0,   255,255,0,   255,255,0,   255,255,0,   255,255,0})
DefineFontColor("red",     {255,0,0,     255,0,0,     255,0,0,     255,0,0,     255,0,0,     255,0,0,     255,0,0,     255,0,0})
DefineFontColor("green",   {0,255,0,     0,255,0,     0,255,0,     0,255,0,     0,255,0,     0,255,0,     0,255,0,     0,255,0})
DefineFontColor("black",   {0,0,0,       0,0,0,       0,0,0,       0,0,0,       0,0,0,       0,0,0,       0,0,0,       0,0,0})
DefineFontColor("grey",    {128,128,128, 128,128,128, 128,128,128, 128,128,128, 128,128,128, 128,128,128, 128,128,128, 128,128,128})
DefineFontColor("light-blue", {0,128,255,  0,128,255,  0,128,255,  0,128,255,  0,128,255,  0,128,255,  0,128,255,  0,128,255})
DefineFontColor("full-red",   {252,0,0, 252,0,0, 252,0,0, 252,0,0, 252,0,0, 252,0,0, 252,0,0, 252,0,0})

-------------------------------------------------------------------------------
--  Button Styles
-------------------------------------------------------------------------------
DefineButtonStyle("icon", {
  Size = {46, 38},
  Font = "game",
  TextNormalColor = "yellow",
  TextReverseColor = "white",
  TextAlign = "Right",
  TextPos = {46, 26},
  Default = {
    Border = {
      Color = {0, 0, 0}, Size = 1,
    },
  },
  Hover = {
    TextNormalColor = "white",
  },
  Clicked = {
    TextNormalColor = "white",
  },
})

DefineButtonStyle("main", {
  Size = {128, 20},
  Font = "game",
  TextNormalColor = "yellow",
  TextReverseColor = "white",
  TextAlign = "Center",
  TextPos = {64, 4},
  Default = {
    Border = { Color = {0, 0, 0}, Size = 1 },
  },
  Hover = { TextNormalColor = "white" },
  Clicked = { TextNormalColor = "white" },
})

DefineButtonStyle("network", {
  Size = {80, 20},
  Font = "game",
  TextNormalColor = "yellow",
  TextReverseColor = "white",
  TextAlign = "Center",
  TextPos = {40, 4},
  Default = {
    Border = { Color = {0, 0, 0}, Size = 1 },
  },
  Hover = { TextNormalColor = "white" },
  Clicked = { TextNormalColor = "white" },
})

-------------------------------------------------------------------------------
--  UI Layout - Full screen map viewport, minimal side panel
-------------------------------------------------------------------------------
UI.NormalFontColor = "white"
UI.ReverseFontColor = "yellow"

-- Clear fillers
UI.Fillers:clear()

-- Map viewport: almost fullscreen (800x600)
UI.MapArea.X = 0
UI.MapArea.Y = 16
UI.MapArea.EndX = Video.Width - 1
UI.MapArea.EndY = Video.Height - 17

-- Minimap (top-left corner, tiny)
UI.Minimap.X = 0
UI.Minimap.Y = 24
UI.Minimap.W = 128
UI.Minimap.H = 128

-- Info panel (hidden off-screen since we have no panel graphics)
UI.InfoPanel.X = 0
UI.InfoPanel.Y = Video.Height

-- Button panel
UI.ButtonPanel.X = 0
UI.ButtonPanel.Y = Video.Height
UI.ButtonPanel.AutoCastBorderColorRGB = CColor(0, 0, 252)
UI.ButtonPanel.Buttons:clear()

-- Status line
UI.StatusLine.TextX = 2
UI.StatusLine.TextY = Video.Height - 14
UI.StatusLine.Width = Video.Width - 4
UI.StatusLine.Font = Fonts["game"]

-- Message font
UI.MessageFont = Fonts["game"]
UI.MessageScrollSpeed = 5

-- Menu button (offscreen)
UI.MenuButton.X = 0
UI.MenuButton.Y = 0
UI.MenuButton.Text = "Menu"
UI.MenuButton.Style = FindButtonStyle("main")
UI.MenuButton:SetCallback(function() end)

-- Network buttons (offscreen)
UI.NetworkMenuButton.X = -200
UI.NetworkMenuButton.Y = -200
UI.NetworkMenuButton.Text = ""
UI.NetworkMenuButton.Style = FindButtonStyle("network")
UI.NetworkMenuButton:SetCallback(function() end)

UI.NetworkDiplomacyButton.X = -200
UI.NetworkDiplomacyButton.Y = -200
UI.NetworkDiplomacyButton.Text = ""
UI.NetworkDiplomacyButton.Style = FindButtonStyle("network")
UI.NetworkDiplomacyButton:SetCallback(function() end)

-- Single selected button (needed when clicking a unit)
b = CUIButton:new()
b.X = 0
b.Y = Video.Height
b.Style = FindButtonStyle("icon")
UI.SingleSelectedButton = b

-- Selected buttons (multi-select)
UI.SelectedButtons:clear()

-- Training button
b = CUIButton:new()
b.X = 0
b.Y = Video.Height
b.Style = FindButtonStyle("icon")
UI.SingleTrainingButton = b
UI.TrainingButtons:clear()

-- Upgrading / Researching
b = CUIButton:new()
b.X = 0
b.Y = Video.Height
b.Style = FindButtonStyle("icon")
UI.UpgradingButton = b

b = CUIButton:new()
b.X = 0
b.Y = Video.Height
b.Style = FindButtonStyle("icon")
UI.ResearchingButton = b

UI.TransportingButtons:clear()

UI.CompletedBarColorRGB = CColor(48, 100, 4)
UI.CompletedBarShadow = false

DebugPrint("Grudge UI loaded.\n")
