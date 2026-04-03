# SHADOW ACCORD - Development Notes

## Branch: `claude/shadow-accord-rpg-kkEVH`

## Project Status: Phase 1 In Progress

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

### CRITICAL: What Needs To Be Done

#### 1. REWRITE THE STORE (`src/store/gameStore.ts`)
The current store is only 205 lines and is a skeleton. It needs:

**Territory handling**: Store uses `territories` as an array but WorldMap accesses it as both array (`Object.values()`) and Record (`territories[adjId]`). **Decision needed**: Use `Record<string, Territory>` (more natural for lookups). Update WorldMap's `territoryList = useMemo(() => Object.values(territories))` pattern works fine with Record.

**The `TERRITORIES` import is broken**: Store imports `TERRITORIES` from territories.ts but the main export is `createTerritories()`. I added a `TERRITORIES` export of raw defs but the store needs to call `createTerritories()` to get proper Territory objects.

**Missing store actions that components already reference**:
- `actionsRemaining` (number, starts at 5 per turn) - TopBar and ActionPanel read this via `getState()`
- `handleDiplomacy(action, targetFaction)` - DiplomacyScreen calls this
- `endTurn()` - ActionPanel's End Turn button needs this
- `moveForces(from, to, count)` 
- `attackTerritory(from, to)` - should trigger tactical combat or auto-resolve
- `buildStructure(territory, buildingType)`
- `startResearch(techId)`
- `recruitOperative(class)`
- `restRefit()`
- `spies` array in state - ActionPanel reads this

**Full store needs these slices**:
- **Turn system**: `actionsRemaining`, `endTurn()` that processes AI turns, income, research progress, events, autosave
- **Combat**: `startCombat(mission)`, `startTacticalCombat()`, `moveUnit()`, `attackUnit()`, `useAbility()`, `endPlayerTurn()`, `endCombat()`
- **Diplomacy**: `handleDiplomacy()`, relation updates, treaty management
- **AI**: `processAITurns()` - each AI faction takes actions based on personality
- **Economy**: `processIncome()` at end of turn
- **Events**: `triggerEvent()`, `resolveEvent(choiceId)` 
- **Espionage**: spy deployment and resolution

#### 2. Missing Components (referenced in GameLayout.tsx)
- `src/components/ui/IntelPanel.tsx` - Right sidebar showing intel reports and event log
- `src/components/ui/BottomBar.tsx` - News ticker with AI faction action summaries
- `src/components/combat/TacticalGrid.tsx` - XCOM-style grid combat (THE BIG ONE)
- `src/components/combat/MissionBriefing.tsx` - Pre-combat briefing screen
- `src/components/screens/TechTreeScreen.tsx` - Horizontal branching tech tree
- `src/components/screens/RosterScreen.tsx` - Operative roster with stats, memorial wall
- `src/components/screens/EventModal.tsx` - Full-screen event display with choices
- `src/components/screens/GameOverScreen.tsx` - Victory/defeat screen

#### 3. Fix page.tsx
`src/app/page.tsx` still has the default Next.js template. Replace with:
```tsx
import GameLayout from '@/components/GameLayout';
export default function Home() {
  return <GameLayout />;
}
```

#### 4. Fix layout.tsx
May need to update `src/app/layout.tsx` to set dark background and import fonts.

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
