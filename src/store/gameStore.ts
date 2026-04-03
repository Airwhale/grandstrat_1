import { create } from 'zustand';
import type {
  FactionId,
  Difficulty,
  Phase,
  Faction,
  Territory,
  DiplomacyState,
  Operative,
  FallenOperative,
  Mission,
  Tile,
  TacticalUnit,
  CombatLogEntry,
  GameEvent,
  IntelReport,
  SaveSlot,
} from '@/types';
import { TERRITORIES } from '@/data/territories';
import { createFaction, FACTION_NAMES, FACTION_COLORS } from '@/data/factions';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

export interface GameState {
  // Meta
  phase: Phase;
  turn: number;
  playerFaction: FactionId | null;
  difficulty: Difficulty;

  // Strategic layer
  factions: Record<FactionId, Faction>;
  territories: Territory[];
  diplomacy: DiplomacyState;
  operatives: Operative[];
  fallenOperatives: FallenOperative[];
  intelReports: IntelReport[];
  currentEvent: GameEvent | null;

  // Tactical layer
  mission: Mission | null;
  grid: Tile[][];
  tacticalUnits: TacticalUnit[];
  combatLog: CombatLogEntry[];

  // UI state
  selectedTerritory: string | null;

  // Save / Load
  saves: SaveSlot[];

  // Actions
  setPhase: (phase: Phase) => void;
  initGame: (faction: FactionId, difficulty: Difficulty) => void;
  selectTerritory: (id: string | null) => void;
  getSaves: () => SaveSlot[];
  saveGame: (slotId: number) => void;
  loadGame: (slotId: number) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FACTION_IDS: FactionId[] = ['atlantic', 'eastern', 'jade', 'solar', 'southern', 'freecities'];

function buildInitialFactions(territories: Territory[]): Record<FactionId, Faction> {
  const factionTerritories: Record<FactionId, string[]> = {
    atlantic: [],
    eastern: [],
    jade: [],
    solar: [],
    southern: [],
    freecities: [],
  };

  for (const t of territories) {
    if (t.controller && factionTerritories[t.controller]) {
      factionTerritories[t.controller].push(t.id);
    }
  }

  const factions = {} as Record<FactionId, Faction>;
  for (const id of FACTION_IDS) {
    factions[id] = createFaction(id, factionTerritories[id]);
  }
  return factions;
}

function loadSaves(): SaveSlot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('shadowaccord_saves');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  phase: 'menu',
  turn: 1,
  playerFaction: null,
  difficulty: 'normal',
  factions: {} as Record<FactionId, Faction>,
  territories: [],
  diplomacy: { relations: {}, treaties: [], pendingProposals: [], wars: [] },
  operatives: [],
  fallenOperatives: [],
  intelReports: [],
  currentEvent: null,
  mission: null,
  grid: [],
  tacticalUnits: [],
  combatLog: [],
  selectedTerritory: null,
  saves: loadSaves(),

  // ------ Actions ------

  setPhase: (phase) => set({ phase }),

  initGame: (faction, difficulty) => {
    const territories = TERRITORIES.map((t) => ({ ...t }));
    const factions = buildInitialFactions(territories);

    set({
      phase: 'strategic',
      turn: 1,
      playerFaction: faction,
      difficulty,
      factions,
      territories,
      diplomacy: { relations: {}, treaties: [], pendingProposals: [], wars: [] },
      operatives: [],
      fallenOperatives: [],
      intelReports: [],
      currentEvent: null,
      mission: null,
      grid: [],
      tacticalUnits: [],
      combatLog: [],
      selectedTerritory: null,
    });
  },

  selectTerritory: (id) => set({ selectedTerritory: id }),

  getSaves: () => {
    const saves = loadSaves();
    set({ saves });
    return saves;
  },

  saveGame: (slotId) => {
    const state = get();
    const slot: SaveSlot = {
      id: slotId,
      name: `Turn ${state.turn} - ${state.playerFaction ? FACTION_NAMES[state.playerFaction] : 'Unknown'}`,
      turn: state.turn,
      faction: state.playerFaction ?? 'atlantic',
      timestamp: Date.now(),
      data: JSON.stringify({
        turn: state.turn,
        playerFaction: state.playerFaction,
        difficulty: state.difficulty,
        factions: state.factions,
        territories: state.territories,
        diplomacy: state.diplomacy,
        operatives: state.operatives,
        fallenOperatives: state.fallenOperatives,
        intelReports: state.intelReports,
      }),
    };

    const saves = loadSaves().filter((s) => s.id !== slotId);
    saves.push(slot);
    if (typeof window !== 'undefined') {
      localStorage.setItem('shadowaccord_saves', JSON.stringify(saves));
    }
    set({ saves });
  },

  loadGame: (slotId) => {
    const saves = loadSaves();
    const slot = saves.find((s) => s.id === slotId);
    if (!slot) return;
    try {
      const data = JSON.parse(slot.data);
      set({
        phase: 'strategic',
        ...data,
      });
    } catch {
      // corrupt save
    }
  },
}));
