# SHADOW ACCORD - Development Notes

## Branch: `claude/shadow-accord-rpg-kkEVH`

## Project Status: Phase 1-3 COMPLETE, Phase 4 Remaining

### What's Been Built
- **Next.js 14 project** scaffolded with TypeScript, Tailwind, App Router
- **Dependencies**: zustand, framer-motion installed
- **Types** (`src/types/index.ts`): Complete type definitions for all game systems
- **Data files** (all in `src/data/`):
  - `factions.ts` - All 6 factions with colors, descriptions, personalities, starting resources
  - `territories.ts` - ~46 territories with positions, adjacency, terrain. Exports `createTerritories()` (returns Record<string,Territory>) and `TERRITORIES` (raw defs array)
  - `technologies.ts` - 21 techs across 3 branches (military/economic/intelligence), 4 tiers each
  - `operatives.ts` - Name generation, class stats, abilities for all 12 classes (6 base + 6 faction unique)
  - `events.ts` - 16 event templates with choices and effects
  - `combatMaps.ts` - Tile templates for 6 terrain types (urban, jungle, desert, arctic, mountain, coastal)

### Components Built
- `MainMenu.tsx` - Full cinematic title screen with scanlines, particles, save/load
- `FactionSelect.tsx` - 3x2 grid of faction cards, detail panel, difficulty selector
- `GameLayout.tsx` - Main router component using AnimatePresence, switches on `phase`
- `WorldMap.tsx` - SVG-based map with territory nodes, adjacency lines, supply routes, tooltips, zoom
- `TopBar.tsx` - Turn counter, resource display, save/load menu
- `ActionPanel.tsx` - Left sidebar with 10 strategic actions and sub-panels (move/attack/build/research/recruit/espionage/trade/rest)
- `DiplomacyScreen.tsx` - Relationship web (SVG hexagonal layout), faction dossiers, diplomatic actions

### COMPLETED
- Store fully rewritten (556 lines) with all game logic
- Territories stored as `Record<string, Territory>` 
- All strategic actions: moveForces, attackTerritory, buildStructure, startResearch, recruitOperative, handleDiplomacy, restRefit
- Full endTurn: income, AI turns, research, events, treaty timers, healing, autosave
- Tactical combat: startTacticalCombat, moveUnit, attackUnit, endPlayerTurn (with enemy AI), endCombat
- All components built: TacticalGrid, MissionBriefing, TechTreeScreen, RosterScreen, EventModal, GameOverScreen, IntelPanel, BottomBar
- page.tsx renders GameLayout, layout.tsx has dark theme
- Build succeeds with zero errors

### What Could Still Be Improved (Phase 4 Polish)
- Operative abilities in tactical combat (currently only basic move/attack)
- Espionage system (spy deployment/actions screen)
- More sophisticated AI (currently random; should use personality traits)
- Sound effects and music
- Tutorial/first-turn guidance
- Operative bond system
- Mission type variety (currently only 'assault')
- More map templates for tactical combat
- Trade route system
- Ironman mode enforcement
- Victory condition checks beyond territory count

### Architecture Notes
- **State**: All game state in Zustand store with localStorage persistence
- **Territories**: Should be `Record<string, Territory>` in store (not array)
- **Phases**: `'menu' | 'faction_select' | 'strategic' | 'tactical' | 'event' | 'diplomacy_screen' | 'tech_screen' | 'roster_screen' | 'gameover' | 'victory'`
- **Combat flow**: Strategic attack → MissionBriefing → TacticalGrid → back to strategic
- **AI turns**: Process after player ends turn, show results in BottomBar news ticker
- **Hit chance**: Base 65% + aim + range + cover + flanking + high ground + abilities

### Key Design Decisions
- Top-down grid combat (not isometric) - 12x16 standard, 16x20 large
- 5 strategic actions per turn
- Permadeath is real - operatives at 0 HP have 2 turns to stabilize
- AI coalition mechanic - if player is winning, AI factions gang up
- Save: 3 manual slots + 1 autosave in localStorage

### Build Order Priority
1. Get the store working with basic turn loop (move/attack/build/end turn)
2. Create simple versions of missing components (can be stubs initially)
3. Get the strategic layer playable (turns cycling, AI doing basic moves)
4. Build tactical combat grid
5. Polish and depth
