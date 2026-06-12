# OPERATION: SHADOW ACCORD

A geopolitical grand strategy RPG with XCOM-style tactical combat, diplomacy, and permadeath. Set in 2034, after cascading economic collapses splintered the world into six rival power blocs waging a covert shadow war.

Built with Next.js 14, TypeScript, Tailwind CSS, Framer Motion, and Zustand. Fully client-side — saves live in your browser's localStorage.

## Running the Game

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Best on a desktop screen (1280px+).

## How to Play

### Goal

- **Win** by controlling **30 of 46 territories** (progress shown in the top bar).
- **Lose** if you run out of territories — or out of operatives.

### Pick a Faction

Each of the six factions has distinct strengths, starting resources, and a unique operative class:

| Faction | Style | Difficulty |
|---|---|---|
| Atlantic Compact | Tech & intelligence | ★★ |
| Eastern Pact | Military might | ★★★ |
| Jade Circle | Economy (everyone starts -10 relations with you) | ★★ |
| Solar League | Population & influence | ★★★ |
| Southern Axis | Rare materials & resilience | ★★★★ |
| Free Cities | Espionage & finance, tiny military | ★★★★★ |

### The Strategic Turn

Each turn is one month. You get **5 actions** per turn from the left panel:

- **Move Forces** — reposition troops between adjacent territories you own.
- **Attack** — quick auto-resolved assault on an adjacent territory. Driven by troop counts, fortification, and luck.
- **Covert Op** — deploy your named operatives into tactical grid combat. Higher reward than auto-resolve, but operatives can die. *Permanently.*
- **Build** — buildings cost 90–200 credits. Banks and factories raise income, labs raise research output, hospitals speed healing.
- **Research** — spend tech points across military / economic / intelligence branches (view the tree via **TECH** in the top bar).
- **Recruit** — a new operative costs 50 credits + 10 manpower.
- **Espionage** — send a spy to gather intel, sabotage a garrison, or incite unrest. Captured spies damage diplomatic relations.
- **Diplomacy** — propose treaties (trade 5 ⚡, non-aggression 10, alliances 20–35 influence). The relationship web shows who hates whom.
- **Rest & Refit** — accelerate healing for wounded operatives.

Press **END TURN** and the world moves: income arrives, AI factions maneuver and attack (watch the news ticker), research ticks forward, and every third turn a global event demands a decision.

### Tactical Combat

Covert Ops drop your **5 best active operatives** onto a terrain-based grid (urban, jungle, desert, arctic, mountain, coastal):

- Each unit gets **2 action points**: move, attack, **Overwatch** (reaction fire), or **Hunker** (double cover).
- Attack mode shows a **hit % badge** over each target — hover for the full breakdown (aim, range, cover, flanking, high ground).
- Half cover: -20% to be hit. Full cover: -40%. Flanking negates cover and adds crit chance.
- **Blue units are yours. Red are hostile.**
- An operative at 0 HP is **KIA — gone forever**, their name added to the memorial wall (top bar → **ROSTER**).
- Survivors earn XP, level up, and get wounded (1–3 turns out) if they took damage.

### Resources

| | Resource | Source | Spent on |
|---|---|---|---|
| 🪙 | Credits | territories, banks, factories | everything |
| 🧪 | Tech Points | labs | research |
| 🎭 | Influence | media centers | diplomacy |
| ⚙️ | Rare Materials | special territories (gold dot) | elite gear |
| 👥 | Manpower | population | recruiting |

### Saving

Three manual slots plus an autosave every turn (hamburger menu, top right). **Ironman** difficulty means one save, no take-backs.

In-game, click the **?** button in the top bar for the field manual.

## Project Structure

```
src/
├── app/            # Next.js app router pages
├── components/
│   ├── combat/     # MissionBriefing, TacticalGrid
│   ├── map/        # WorldMap (strategic layer)
│   ├── screens/    # MainMenu, FactionSelect, Diplomacy, TechTree, Roster, Events, GameOver
│   └── ui/         # TopBar, ActionPanel, IntelPanel, BottomBar, HelpModal
├── data/           # factions, territories, technologies, operatives, events, combat maps
├── store/          # Zustand game store + combat/economy/AI helpers
└── types/          # All TypeScript definitions
```

## Dev Scripts

```bash
npm run dev          # dev server
npm run build        # production build
node scripts/playtest.cjs   # automated browser playtest (needs dev server running)
```
