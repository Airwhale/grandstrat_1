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
  Spy,
  SpyAction,
  BuildingType,
  OperativeClass,
  DiplomaticAction,
  IncomeBreakdown,
} from '@/types';
import { createTerritories } from '@/data/territories';
import { createFaction, FACTION_NAMES } from '@/data/factions';
import { generateStartingRoster, generateOperative, resetOperativeGenerator } from '@/data/operatives';
import { generateEvent } from '@/data/events';
import { getTechById } from '@/data/technologies';
import {
  FACTION_IDS, relationKey, buildInitialDiplomacy,
  calculateIncome, calculateTechIncome,
  BUILDING_COSTS, DIPLOMACY_COSTS, DIPLOMACY_RELATION_CHANGES,
  autoResolveCombat, generateAINews, generateSpy,
  setupTacticalCombat, calculateHitChance, processEnemyAI, spawnEnemyWave,
} from './helpers';
import { executeAbility } from './abilities';
import { sfx } from '@/utils/sound';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

export interface GameState {
  phase: Phase;
  turn: number;
  playerFaction: FactionId | null;
  difficulty: Difficulty;
  factions: Record<FactionId, Faction>;
  territories: Record<string, Territory>;
  diplomacy: DiplomacyState;
  operatives: Operative[];
  fallenOperatives: FallenOperative[];
  intelReports: IntelReport[];
  currentEvent: GameEvent | null;
  actionsRemaining: number;
  spies: Spy[];
  newsTicker: string[];
  mission: Mission | null;
  grid: Tile[][];
  tacticalUnits: TacticalUnit[];
  combatLog: CombatLogEntry[];
  selectedTerritory: string | null;
  saves: SaveSlot[];
  tutorialStep: number | null; // null = tutorial off, 0..N = current step
  eventHistory: GameEvent[];
  incomeBreakdown: IncomeBreakdown | null;
  diplomaticStreak: number; // consecutive turns holding 3+ alliances with 15+ territories
  victoryType: 'domination' | 'economic' | 'diplomatic' | null;
  coalitionActive: boolean;
  // Actions
  setPhase: (phase: Phase) => void;
  initGame: (faction: FactionId, difficulty: Difficulty) => void;
  initDemo: () => void;
  setTutorialStep: (step: number | null) => void;
  selectTerritory: (id: string | null) => void;
  getSaves: () => SaveSlot[];
  saveGame: (slotId: number) => void;
  loadGame: (slotId: number) => void;
  endTurn: () => void;
  moveForces: (fromId: string, toId: string, count: number) => void;
  attackTerritory: (fromId: string, toId: string) => void;
  buildStructure: (territoryId: string, buildingType: BuildingType) => void;
  startResearch: (techId: string) => void;
  recruitOperative: (opClass: OperativeClass) => void;
  handleDiplomacy: (action: DiplomaticAction, targetFaction: FactionId) => void;
  restRefit: () => void;
  resolveEvent: (choiceId: string) => void;
  startTacticalCombat: (fromId: string, toId: string) => void;
  deployMission: () => void;
  autoResolveMission: () => void;
  moveUnit: (unitId: string, x: number, y: number) => void;
  attackUnit: (attackerId: string, targetId: string) => void;
  useAbility: (unitId: string, abilityId: string, targetX?: number, targetY?: number) => void;
  setUnitOverwatch: (unitId: string) => void;
  setUnitHunker: (unitId: string) => void;
  endPlayerTurn: () => void;
  endCombat: (result: string) => void;
  deploySpy: (spyId: string, territoryId: string, action: SpyAction) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadSaves(): SaveSlot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('shadowaccord_saves');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function buildFactions(territories: Record<string, Territory>): Record<FactionId, Faction> {
  const ft: Record<FactionId, string[]> = { atlantic: [], eastern: [], jade: [], solar: [], southern: [], freecities: [] };
  for (const t of Object.values(territories)) {
    if (t.controller && ft[t.controller]) ft[t.controller].push(t.id);
  }
  const factions = {} as Record<FactionId, Faction>;
  for (const id of FACTION_IDS) factions[id] = createFaction(id, ft[id]);
  return factions;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'menu', turn: 1, playerFaction: null, difficulty: 'normal',
  factions: {} as Record<FactionId, Faction>,
  territories: {} as Record<string, Territory>,
  diplomacy: { relations: {}, treaties: [], pendingProposals: [], wars: [] },
  operatives: [], fallenOperatives: [], intelReports: [],
  currentEvent: null, actionsRemaining: 5, spies: [], newsTicker: [],
  mission: null, grid: [], tacticalUnits: [], combatLog: [],
  selectedTerritory: null, saves: loadSaves(),
  tutorialStep: null,
  eventHistory: [], incomeBreakdown: null, diplomaticStreak: 0,
  victoryType: null, coalitionActive: false,

  setPhase: (phase) => set({ phase }),
  selectTerritory: (id) => set({ selectedTerritory: id }),
  setTutorialStep: (step) => {
    if (step === null && typeof window !== 'undefined') {
      localStorage.setItem('shadowaccord_tutorial_done', '1');
    }
    set({ tutorialStep: step });
  },

  initGame: (faction, difficulty) => {
    const territories = createTerritories();
    const factions = buildFactions(territories);
    resetOperativeGenerator();
    const operatives = generateStartingRoster(faction);
    const diplomacy = buildInitialDiplomacy();
    const spies = [generateSpy(faction)];
    // Show the tutorial for first-time commanders
    const tutorialDone = typeof window !== 'undefined' && localStorage.getItem('shadowaccord_tutorial_done') === '1';
    set({
      phase: 'strategic', turn: 1, playerFaction: faction, difficulty,
      factions, territories, diplomacy, operatives,
      fallenOperatives: [], intelReports: [], currentEvent: null,
      actionsRemaining: 5, spies, newsTicker: [],
      mission: null, grid: [], tacticalUnits: [], combatLog: [],
      selectedTerritory: null,
      tutorialStep: tutorialDone ? null : 0,
      eventHistory: [], incomeBreakdown: null, diplomaticStreak: 0,
      victoryType: null, coalitionActive: false,
    });
  },

  // Demo: seasoned mid-campaign state so new players see the systems alive
  initDemo: () => {
    get().initGame('atlantic', 'normal');
    const { territories, factions, operatives, diplomacy } = get();
    const t = { ...territories };
    const f = { ...factions };

    // Atlantic seizes two extra territories with garrisons and buildings
    for (const tid of ['mexico', 'iberia']) {
      if (t[tid]) {
        t[tid] = { ...t[tid], controller: 'atlantic', troops: 12, fortification: 1 };
        f.atlantic = { ...f.atlantic, territories: [...f.atlantic.territories, tid] };
      }
    }
    if (t['eastern_us']) t['eastern_us'] = { ...t['eastern_us'], buildings: [{ type: 'bank', level: 1 }, { type: 'lab', level: 1 }] };
    if (t['western_us']) t['western_us'] = { ...t['western_us'], buildings: [{ type: 'recruitCenter', level: 1 }] };

    // Resources, techs, and a research in flight
    f.atlantic = {
      ...f.atlantic,
      resources: { credits: 850, techPoints: 140, influence: 90, rareMaterials: 45, manpower: 130 },
      researchedTechs: ['mil_t1_firearms', 'eco_t1_markets'],
      currentResearch: { techId: 'int_t1_signal', turnsRemaining: 1 },
    };

    // Veteran squad: levels, callsigns, battle history, one wounded
    const ops = operatives.map((op, i) => {
      if (i === 0) return { ...op, level: 4, callsign: 'Specter', kills: 7, missionsCompleted: 5, xp: 40, xpToNext: 400, aim: op.aim + 6, maxHp: op.maxHp + 3, hp: op.maxHp + 3 };
      if (i === 1) return { ...op, level: 3, callsign: 'Viper', kills: 4, missionsCompleted: 4, xp: 10, xpToNext: 300, aim: op.aim + 4, maxHp: op.maxHp + 2, hp: op.maxHp + 2 };
      if (i === 2) return { ...op, level: 2, kills: 2, missionsCompleted: 2, aim: op.aim + 2, maxHp: op.maxHp + 1, hp: op.maxHp + 1 };
      if (i === 3) return { ...op, status: 'wounded' as const, woundedTurns: 2, hp: Math.max(1, op.maxHp - 4), missionsCompleted: 1 };
      return op;
    });

    // A live diplomatic landscape
    const relations = { ...diplomacy.relations };
    relations[relationKey('atlantic', 'eastern')] = -45;
    relations[relationKey('atlantic', 'freecities')] = 30;
    relations[relationKey('eastern', 'jade')] = 25;
    relations[relationKey('solar', 'southern')] = 15;

    set({
      turn: 6,
      territories: t,
      factions: f,
      operatives: ops,
      diplomacy: {
        ...diplomacy,
        relations,
        treaties: [{ id: 'demo_treaty', type: 'trade', factions: ['atlantic', 'freecities'], turnsRemaining: null, turnEstablished: 3 }],
      },
      newsTicker: [
        'DEMO CAMPAIGN — Turn 6 of an Atlantic Compact operation',
        'Eastern Pact denounces Atlantic "aggression" after Iberia falls',
        'Free Cities sign trade accord with Atlantic Compact',
        'Analysts warn of Jade Circle military buildup near Korea',
      ],
      intelReports: [
        { id: 'demo_intel_1', turn: 5, source: 'Agent Cobalt', content: 'Ukraine: 20 troops, fortification 1, unrest 12%. The Eastern Pact holds 6 territories.', faction: 'eastern', type: 'troops' },
        { id: 'demo_intel_2', turn: 4, source: 'SIGINT', content: 'Jade Circle industrial output up 15% this quarter. Factory construction detected in China Coast.', faction: 'jade', type: 'economy' },
      ],
      tutorialStep: 0,
    });
  },

  // ---- Save/Load ----
  getSaves: () => { const s = loadSaves(); set({ saves: s }); return s; },
  saveGame: (slotId) => {
    const st = get();
    // Ironman: one save, no take-backs — only the autosave slot is allowed
    if (st.difficulty === 'ironman' && slotId !== 0) return;
    const slot: SaveSlot = {
      id: slotId,
      name: `Turn ${st.turn} - ${st.playerFaction ? FACTION_NAMES[st.playerFaction] : 'Unknown'}`,
      turn: st.turn, faction: st.playerFaction ?? 'atlantic',
      timestamp: Date.now(),
      data: JSON.stringify({
        turn: st.turn, playerFaction: st.playerFaction, difficulty: st.difficulty,
        factions: st.factions, territories: st.territories, diplomacy: st.diplomacy,
        operatives: st.operatives, fallenOperatives: st.fallenOperatives,
        intelReports: st.intelReports, spies: st.spies, actionsRemaining: st.actionsRemaining,
        eventHistory: st.eventHistory, diplomaticStreak: st.diplomaticStreak,
        coalitionActive: st.coalitionActive,
      }),
    };
    const saves = loadSaves().filter((s) => s.id !== slotId);
    saves.push(slot);
    if (typeof window !== 'undefined') localStorage.setItem('shadowaccord_saves', JSON.stringify(saves));
    set({ saves });
  },
  loadGame: (slotId) => {
    const saves = loadSaves();
    const slot = saves.find((s) => s.id === slotId);
    if (!slot) return;
    try { const data = JSON.parse(slot.data); set({ phase: 'strategic', ...data, newsTicker: [], currentEvent: null, mission: null, grid: [], tacticalUnits: [], combatLog: [] }); }
    catch { /* corrupt */ }
  },

  // ---- Strategic Actions ----
  moveForces: (fromId, toId, count) => {
    const { territories, playerFaction, actionsRemaining } = get();
    if (actionsRemaining <= 0) return;
    const from = territories[fromId], to = territories[toId];
    if (!from || !to) return;
    if (from.controller !== playerFaction || to.controller !== playerFaction) return;
    if (!from.adjacency.includes(toId)) return;
    const moveCount = Math.min(count, from.troops - 1);
    if (moveCount <= 0) return;
    const newTerritories = { ...territories,
      [fromId]: { ...from, troops: from.troops - moveCount },
      [toId]: { ...to, troops: to.troops + moveCount },
    };
    set({ territories: newTerritories, actionsRemaining: actionsRemaining - 1 });
  },

  attackTerritory: (fromId, toId) => {
    const { territories, factions, playerFaction, actionsRemaining, newsTicker } = get();
    if (actionsRemaining <= 0 || !playerFaction) return;
    const from = territories[fromId], to = territories[toId];
    if (!from || !to || from.controller !== playerFaction) return;
    if (!from.adjacency.includes(toId)) return;
    const result = autoResolveCombat(from.troops, to.troops, to.fortification);
    const updatedTerritories = { ...territories };
    const updatedFactions = { ...factions };
    updatedTerritories[fromId] = { ...from, troops: Math.max(1, from.troops - result.attackerLosses) };
    if (result.attackerWins) {
      const oldController = to.controller;
      updatedTerritories[toId] = { ...to, controller: playerFaction, troops: Math.max(1, from.troops - result.attackerLosses - 1), fortification: 0 };
      // Update faction territory lists
      const pf = { ...updatedFactions[playerFaction], territories: [...updatedFactions[playerFaction].territories, toId] };
      updatedFactions[playerFaction] = pf;
      if (oldController) {
        updatedFactions[oldController] = { ...updatedFactions[oldController], territories: updatedFactions[oldController].territories.filter(t => t !== toId) };
        if (updatedFactions[oldController].territories.length === 0) updatedFactions[oldController] = { ...updatedFactions[oldController], isDefeated: true };
      }
      sfx.capture();
      set({ territories: updatedTerritories, factions: updatedFactions, actionsRemaining: actionsRemaining - 1,
        newsTicker: [...newsTicker, `Your forces captured ${to.name}!`],
      });
    } else {
      updatedTerritories[toId] = { ...to, troops: Math.max(1, to.troops - result.defenderLosses) };
      set({ territories: updatedTerritories, actionsRemaining: actionsRemaining - 1,
        newsTicker: [...newsTicker, `Attack on ${to.name} repelled. Lost ${result.attackerLosses} troops.`],
      });
    }
  },

  buildStructure: (territoryId, buildingType) => {
    const { territories, factions, playerFaction, actionsRemaining } = get();
    if (actionsRemaining <= 0 || !playerFaction) return;
    const t = territories[territoryId];
    if (!t || t.controller !== playerFaction) return;
    const cost = BUILDING_COSTS[buildingType] ?? 100;
    const f = factions[playerFaction];
    if (f.resources.credits < cost) return;
    const newBuildings = [...t.buildings, { type: buildingType as BuildingType, level: 1 }];
    const newFactions = { ...factions, [playerFaction]: { ...f, resources: { ...f.resources, credits: f.resources.credits - cost } } };
    const newTerritories = { ...territories, [territoryId]: { ...t, buildings: newBuildings } };
    set({ territories: newTerritories, factions: newFactions, actionsRemaining: actionsRemaining - 1 });
  },

  startResearch: (techId) => {
    const { factions, playerFaction, actionsRemaining } = get();
    if (actionsRemaining <= 0 || !playerFaction) return;
    const f = factions[playerFaction];
    if (f.currentResearch) return;
    const tech = getTechById(techId);
    if (!tech || f.researchedTechs.includes(techId)) return;
    if (f.resources.techPoints < tech.cost) return;
    const newFactions = { ...factions, [playerFaction]: {
      ...f, currentResearch: { techId, turnsRemaining: tech.turnsToResearch },
      resources: { ...f.resources, techPoints: f.resources.techPoints - tech.cost },
    }};
    set({ factions: newFactions, actionsRemaining: actionsRemaining - 1 });
  },

  recruitOperative: (opClass) => {
    const { factions, playerFaction, operatives, actionsRemaining } = get();
    if (actionsRemaining <= 0 || !playerFaction) return;
    const f = factions[playerFaction];
    if (f.resources.credits < 50 || f.resources.manpower < 10) return;
    const op = generateOperative(playerFaction, opClass as OperativeClass, 1);
    const newFactions = { ...factions, [playerFaction]: { ...f, resources: { ...f.resources, credits: f.resources.credits - 50, manpower: f.resources.manpower - 10 } } };
    set({ factions: newFactions, operatives: [...operatives, op], actionsRemaining: actionsRemaining - 1 });
  },

  handleDiplomacy: (action, targetFaction) => {
    const { factions, playerFaction, diplomacy, actionsRemaining } = get();
    if (actionsRemaining <= 0 || !playerFaction) return;
    const f = factions[playerFaction];
    const cost = DIPLOMACY_COSTS[action] ?? 0;
    if (f.resources.influence < cost) return;
    const rKey = relationKey(playerFaction, targetFaction);
    const relChange = DIPLOMACY_RELATION_CHANGES[action] ?? 0;
    const newRelations = { ...diplomacy.relations, [rKey]: Math.max(-100, Math.min(100, (diplomacy.relations[rKey] ?? 0) + relChange)) };
    let newTreaties = [...diplomacy.treaties];
    if (['proposeTrade', 'nonAggressionPact', 'defensiveAlliance', 'fullAlliance'].includes(action)) {
      const typeMap: Record<string, string> = { proposeTrade: 'trade', nonAggressionPact: 'nonAggression', defensiveAlliance: 'defensiveAlliance', fullAlliance: 'fullAlliance' };
      newTreaties.push({ id: `treaty_${Date.now()}`, type: typeMap[action] as any, factions: [playerFaction, targetFaction], turnsRemaining: action === 'nonAggressionPact' ? 6 : null, turnEstablished: get().turn });
    }
    if (action === 'betrayAlliance') {
      newTreaties = newTreaties.filter(t => !(t.factions.includes(playerFaction) && t.factions.includes(targetFaction)));
      // Betray penalty with all factions
      for (const fid of FACTION_IDS) {
        if (fid !== playerFaction) {
          const k = relationKey(playerFaction, fid);
          newRelations[k] = Math.max(-100, (newRelations[k] ?? 0) - 30);
        }
      }
    }
    const newFactions = { ...factions, [playerFaction]: { ...f, resources: { ...f.resources, influence: f.resources.influence - cost } } };
    set({ factions: newFactions, diplomacy: { ...diplomacy, relations: newRelations, treaties: newTreaties }, actionsRemaining: actionsRemaining - 1 });
  },

  restRefit: () => {
    const { operatives, playerFaction, actionsRemaining } = get();
    if (actionsRemaining <= 0 || !playerFaction) return;
    const updated = operatives.map(op => {
      if (op.faction !== playerFaction || op.status !== 'wounded') return op;
      const newWounded = op.woundedTurns - 1;
      return { ...op, woundedTurns: newWounded, status: newWounded <= 0 ? 'active' as const : 'wounded' as const, hp: newWounded <= 0 ? op.maxHp : op.hp };
    });
    set({ operatives: updated, actionsRemaining: actionsRemaining - 1 });
  },

  resolveEvent: (choiceId) => {
    const { currentEvent, factions, playerFaction, eventHistory } = get();
    if (!currentEvent || !playerFaction) return;
    sfx.confirm();
    const choice = currentEvent.choices.find(c => c.id === choiceId);
    const archived = [...eventHistory, { ...currentEvent, resolved: true }];
    if (!choice) { set({ currentEvent: null, phase: 'strategic', eventHistory: archived }); return; }
    const f = { ...factions[playerFaction] };
    const r = { ...f.resources };
    for (const effect of choice.effects) {
      if (effect.type === 'resources' && effect.field) {
        const key = effect.field as keyof typeof r;
        if (key in r) {
          if (Math.abs(effect.value) < 1) { // Percentage
            (r as any)[key] = Math.floor((r as any)[key] * (1 + effect.value));
          } else {
            (r as any)[key] = Math.max(0, (r as any)[key] + effect.value);
          }
        }
      }
    }
    f.resources = r;
    set({ currentEvent: null, phase: 'strategic', factions: { ...factions, [playerFaction]: f }, eventHistory: archived });
  },

  // ---- End Turn ----
  endTurn: () => {
    const state = get();
    if (!state.playerFaction) return;
    const territories = { ...state.territories };
    const factions = { ...state.factions };
    const ticker: string[] = [];

    // 1. Process income for all factions
    for (const fid of FACTION_IDS) {
      const f = factions[fid];
      if (f.isDefeated) continue;
      const income = calculateIncome(f, territories);
      const tp = calculateTechIncome(f, territories);
      factions[fid] = { ...f, resources: { ...f.resources, credits: f.resources.credits + income, techPoints: f.resources.techPoints + tp } };
    }

    // 2. Advance research for all factions
    for (const fid of FACTION_IDS) {
      const f = factions[fid];
      if (!f.currentResearch) continue;
      const newTurns = f.currentResearch.turnsRemaining - 1;
      if (newTurns <= 0) {
        factions[fid] = { ...f, researchedTechs: [...f.researchedTechs, f.currentResearch.techId], currentResearch: null };
        if (fid === state.playerFaction) ticker.push(`Research complete: ${getTechById(f.currentResearch.techId)?.name ?? f.currentResearch.techId}`);
      } else {
        factions[fid] = { ...f, currentResearch: { ...f.currentResearch, turnsRemaining: newTurns } };
      }
    }

    // 3. Coalition check — if the player is running away with the game,
    //    the AI factions close ranks against them.
    const relations = { ...state.diplomacy.relations };
    const playerTerritoryCount = factions[state.playerFaction].territories.length;
    const biggestAI = Math.max(...FACTION_IDS.filter(f => f !== state.playerFaction).map(f => factions[f].territories.length));
    const coalitionNow = playerTerritoryCount >= 12 && playerTerritoryCount > biggestAI;
    if (coalitionNow) {
      for (const a of FACTION_IDS) {
        if (a === state.playerFaction || factions[a].isDefeated) continue;
        // AI factions warm to each other, cool sharply toward the player
        const pk = relationKey(state.playerFaction, a);
        relations[pk] = Math.max(-100, (relations[pk] ?? 0) - 4);
        for (const b of FACTION_IDS) {
          if (b === state.playerFaction || b === a || factions[b].isDefeated) continue;
          const k = relationKey(a, b);
          relations[k] = Math.min(100, (relations[k] ?? 0) + 3);
        }
      }
      if (!state.coalitionActive) {
        ticker.push('⚠ COALITION FORMING: rival blocs are coordinating against your expansion');
      }
    }

    // 4. AI turns — driven by faction personality
    for (const fid of FACTION_IDS) {
      if (fid === state.playerFaction || factions[fid].isDefeated) continue;
      const aiFaction: Faction = factions[fid];
      const p = aiFaction.personality;
      const aiActions = 1 + Math.floor(Math.random() * 2) + (p.ambition >= 8 ? 1 : 0);

      for (let i = 0; i < aiActions; i++) {
        const attackChance = 0.15 + p.aggression * 0.04 + (coalitionNow ? 0.15 : 0);
        const buildChance = attackChance + 0.1 + p.greed * 0.03;
        const roll = Math.random();

        if (roll < attackChance && aiFaction.territories.length > 0) {
          // ATTACK: paranoid factions need bigger garrisons before committing
          const minTroops = 8 + p.paranoia;
          const candidates: Array<{ fromTid: string; toTid: string }> = [];
          for (const fromTid of aiFaction.territories) {
            const fromT: Territory | undefined = territories[fromTid];
            if (!fromT || fromT.troops < minTroops) continue;
            for (const adjId of fromT.adjacency) {
              const adj = territories[adjId];
              if (!adj || adj.controller === fid) continue;
              // Ambitious factions also grab neutrals; others hit rivals
              if (adj.controller === null && p.ambition < 5) continue;
              // Coalition: strongly prefer player territories
              if (coalitionNow && adj.controller !== state.playerFaction && Math.random() < 0.7) continue;
              // Respect treaties (mostly) — loyal factions honor pacts
              if (adj.controller) {
                const hasPact = state.diplomacy.treaties.some(t =>
                  t.factions.includes(fid) && t.factions.includes(adj.controller as FactionId));
                if (hasPact && Math.random() < p.loyalty / 10) continue;
              }
              candidates.push({ fromTid, toTid: adjId });
            }
          }
          if (candidates.length > 0) {
            const { fromTid, toTid } = candidates[Math.floor(Math.random() * candidates.length)];
            const fromT = territories[fromTid];
            const to = territories[toTid];
            const result = autoResolveCombat(fromT.troops, to.troops, to.fortification);
            territories[fromTid] = { ...fromT, troops: Math.max(1, fromT.troops - result.attackerLosses) };
            if (result.attackerWins) {
              const oldCtrl: FactionId | null = to.controller;
              territories[toTid] = { ...to, controller: fid, troops: Math.max(1, fromT.troops - result.attackerLosses - 2) };
              factions[fid] = { ...factions[fid], territories: [...factions[fid].territories, toTid] };
              if (oldCtrl) {
                factions[oldCtrl] = { ...factions[oldCtrl], territories: factions[oldCtrl].territories.filter((t: string) => t !== toTid) };
                if (factions[oldCtrl].territories.length === 0) factions[oldCtrl] = { ...factions[oldCtrl], isDefeated: true };
                const rk = relationKey(fid, oldCtrl);
                relations[rk] = Math.max(-100, (relations[rk] ?? 0) - 20);
              }
              ticker.push(`${FACTION_NAMES[fid]} captured ${to.name}${oldCtrl === state.playerFaction ? ' FROM YOU' : ''}!`);
            } else {
              territories[toTid] = { ...to, troops: Math.max(1, to.troops - result.defenderLosses) };
              ticker.push(`${FACTION_NAMES[fid]} attack on ${to.name} repelled`);
            }
          }
        } else if (roll < buildChance && aiFaction.territories.length > 0) {
          // BUILD/REINFORCE: greedy factions convert credits into strength
          const f = factions[fid];
          if (f.resources.credits >= 50) {
            const tid = aiFaction.territories[Math.floor(Math.random() * aiFaction.territories.length)];
            const t = territories[tid];
            if (t) {
              const newTroops = Math.min(10, Math.floor(f.resources.credits / 10));
              territories[tid] = { ...t, troops: t.troops + newTroops };
              factions[fid] = { ...f, resources: { ...f.resources, credits: f.resources.credits - newTroops * 10 } };
            }
          }
        } else if (aiFaction.territories.length > 0) {
          // REDEPLOY: paranoid factions mass troops on hostile borders
          const fromTid: string = aiFaction.territories[Math.floor(Math.random() * aiFaction.territories.length)];
          const fromT: Territory | undefined = territories[fromTid];
          if (fromT && fromT.troops > 5) {
            const adjOwned: string[] = fromT.adjacency.filter((a: string) => territories[a]?.controller === fid);
            // Prefer moving toward contested borders
            const border: string[] = adjOwned.filter((a: string) =>
              territories[a]?.adjacency.some((x: string): boolean => Boolean(territories[x]?.controller && territories[x]?.controller !== fid)));
            const pool: string[] = (p.paranoia >= 6 && border.length > 0) ? border : adjOwned;
            if (pool.length > 0) {
              const toTid: string = pool[Math.floor(Math.random() * pool.length)];
              const move = Math.floor(fromT.troops * 0.3);
              territories[fromTid] = { ...fromT, troops: fromT.troops - move };
              territories[toTid] = { ...territories[toTid], troops: territories[toTid].troops + move };
            }
          }
        }
      }
      ticker.push(generateAINews(FACTION_NAMES[fid], aiFaction.territories.map((t: string) => territories[t]?.name ?? t)));
    }

    // 4. Heal wounded operatives
    const operatives = state.operatives.map(op => {
      if (op.status !== 'wounded') return op;
      const w = op.woundedTurns - 1;
      return { ...op, woundedTurns: w, status: w <= 0 ? 'active' as const : 'wounded' as const, hp: w <= 0 ? op.maxHp : op.hp };
    });

    // 5. Decrement treaty timers
    const treaties = state.diplomacy.treaties.filter(t => {
      if (t.turnsRemaining === null) return true;
      return t.turnsRemaining > 1;
    }).map(t => t.turnsRemaining !== null ? { ...t, turnsRemaining: t.turnsRemaining - 1 } : t);

    // 6. Player income ledger (for the credits tooltip)
    const pf = factions[state.playerFaction];
    let ledgerTerritories = 0, ledgerBuildings = 0, ledgerUnrest = 0;
    for (const tid of pf.territories) {
      const t = territories[tid];
      if (!t) continue;
      ledgerTerritories += t.resources.credits ?? 0;
      for (const b of t.buildings) {
        if (b.type === 'bank') ledgerBuildings += 15 * b.level;
        if (b.type === 'factory') ledgerBuildings += 10 * b.level;
      }
      if (t.unrest > 50) ledgerUnrest -= Math.floor((t.unrest - 50) * 0.3);
    }
    const incomeBreakdown: IncomeBreakdown = {
      territories: ledgerTerritories,
      buildings: ledgerBuildings,
      unrestPenalty: ledgerUnrest,
      techPoints: calculateTechIncome(pf, territories),
      total: Math.max(0, ledgerTerritories + ledgerBuildings + ledgerUnrest),
    };

    // 7. Events every 3 turns — and they hit the AI factions too
    const newTurn = state.turn + 1;
    let event: GameEvent | null = null;
    let newPhase: Phase = 'strategic';
    if (newTurn % 3 === 0) {
      event = generateEvent(newTurn, state.playerFaction);
      newPhase = 'event';
      // A random AI faction feels the same shockwave
      const aiTargets = FACTION_IDS.filter(f => f !== state.playerFaction && !factions[f].isDefeated);
      if (aiTargets.length > 0) {
        const victim = aiTargets[Math.floor(Math.random() * aiTargets.length)];
        const swing = Math.random() < 0.5 ? -60 : 40;
        factions[victim] = { ...factions[victim], resources: { ...factions[victim].resources, credits: Math.max(0, factions[victim].resources.credits + swing) } };
        ticker.push(`${FACTION_NAMES[victim]} ${swing < 0 ? 'hit hard by' : 'profits from'} the crisis`);
      }
      sfx.event();
    }

    // 8. Victory / defeat checks
    const playerF = factions[state.playerFaction];
    let victoryType: GameState['victoryType'] = state.victoryType;
    let diplomaticStreak = state.diplomaticStreak;

    // Diplomatic: 3+ alliance treaties while holding 15+ territories, 12 turns straight
    const pfId: FactionId = state.playerFaction;
    const allianceCount = new Set(
      treaties
        .filter(t => (t.type === 'defensiveAlliance' || t.type === 'fullAlliance') && t.factions.includes(pfId))
        .map(t => t.factions.find(f => f !== pfId))
    ).size;
    if (allianceCount >= 3 && playerF.territories.length >= 15) {
      diplomaticStreak += 1;
    } else {
      diplomaticStreak = 0;
    }

    if (playerF.territories.length === 0 || playerF.isDefeated) {
      newPhase = 'gameover';
    } else if (operatives.filter(o => o.faction === state.playerFaction).length === 0 && playerF.resources.credits < 50) {
      // No operatives left and can't afford to recruit — the shadow war is lost
      ticker.push('Your last operative is gone and the coffers are empty. The council dissolves.');
      newPhase = 'gameover';
    } else if (playerF.territories.length >= 30) {
      newPhase = 'victory'; victoryType = 'domination';
    } else if (playerF.resources.credits >= 10000) {
      newPhase = 'victory'; victoryType = 'economic';
    } else if (diplomaticStreak >= 12) {
      newPhase = 'victory'; victoryType = 'diplomatic';
    }

    if (newPhase === 'victory') sfx.victory();
    else if (newPhase === 'gameover') sfx.defeat();
    else sfx.endTurn();

    // Diplomatic-victory progress nudge
    if (diplomaticStreak > 0 && diplomaticStreak % 4 === 0 && newPhase === 'strategic') {
      ticker.push(`Diplomatic victory progress: ${diplomaticStreak}/12 turns of sustained alliances`);
    }

    set({
      turn: newTurn, actionsRemaining: 5, territories, factions, operatives,
      diplomacy: { ...state.diplomacy, treaties, relations },
      newsTicker: ticker, currentEvent: event, phase: newPhase,
      incomeBreakdown, diplomaticStreak, victoryType,
      coalitionActive: coalitionNow,
    });

    // Autosave
    setTimeout(() => get().saveGame(0), 100);
  },

  // ---- Tactical Combat ----
  startTacticalCombat: (fromId, toId) => {
    const { territories, playerFaction, operatives, newsTicker } = get();
    if (!playerFaction) return;
    const from = territories[fromId], to = territories[toId];
    if (!from || !to) return;
    // Covert ops draw from the full mission pool
    const types = ['assault', 'extraction', 'defense'] as const;
    const missionType = types[Math.floor(Math.random() * types.length)];
    const { grid, units, mission } = setupTacticalCombat(to.terrain, playerFaction, operatives, to.troops, missionType);
    if (!units.some(u => u.isPlayer)) {
      set({ newsTicker: [...newsTicker, 'No active operatives available for deployment. Recruit or heal your roster.'] });
      return;
    }
    const m = { ...mission, territoryId: toId, deployed: false };
    set({ grid, tacticalUnits: units, mission: m, phase: 'tactical', combatLog: [] });
  },

  deployMission: () => {
    const { mission } = get();
    if (!mission) return;
    set({ mission: { ...mission, deployed: true } });
  },

  autoResolveMission: () => {
    const { mission, tacticalUnits } = get();
    if (!mission) return;
    // Strength contest with variance; manual play is better on average
    const playerStr = tacticalUnits.filter(u => u.isPlayer).reduce((s, u) => s + u.hp + u.aim / 5, 0);
    const enemyStr = tacticalUnits.filter(u => !u.isPlayer).reduce((s, u) => s + u.hp, 0) * 1.2;
    const victory = playerStr * (0.7 + Math.random() * 0.6) > enemyStr;
    // Units take random damage; defeat is bloodier
    const damaged = tacticalUnits.map(u => {
      if (!u.isPlayer) return { ...u, hp: victory ? 0 : u.hp };
      const dmgFrac = victory ? Math.random() * 0.6 : 0.3 + Math.random() * 0.7;
      return { ...u, hp: Math.max(0, Math.round(u.hp - u.maxHp * dmgFrac)) };
    });
    set({ tacticalUnits: damaged, mission: { ...mission, isComplete: true, result: victory ? 'victory' : 'defeat' } });
    get().endCombat(victory ? 'victory' : 'defeat');
  },

  moveUnit: (unitId, x, y) => {
    const { tacticalUnits, mission, combatLog } = get();
    if (!mission?.playerTurn) return;
    const units = tacticalUnits.map(u => {
      if (u.id !== unitId || u.actionsRemaining < 1) return u;
      return { ...u, position: { x, y }, actionsRemaining: u.actionsRemaining - 1 };
    });

    // Extraction: reaching the objective tile wins the mission
    let newMission = mission;
    let newLog = combatLog;
    const reachObj = mission.objectives.find(o => o.type === 'reach' && !o.isComplete);
    if (reachObj?.targetPosition && reachObj.targetPosition.x === x && reachObj.targetPosition.y === y) {
      const mover = units.find(u => u.id === unitId);
      if (mover?.isPlayer) {
        newMission = {
          ...mission,
          isComplete: true,
          result: 'victory',
          objectives: mission.objectives.map(o => o.id === reachObj.id ? { ...o, isComplete: true } : o),
        };
        newLog = [...combatLog, { turn: mission.currentTurn, message: `${mover.name} reached the extraction zone — MISSION COMPLETE`, type: 'system' }];
        sfx.capture();
      }
    }
    set({ tacticalUnits: units, mission: newMission, combatLog: newLog });
  },

  useAbility: (unitId, abilityId, targetX, targetY) => {
    const { tacticalUnits, grid, combatLog, mission } = get();
    if (!mission?.playerTurn || mission.isComplete) return;
    const target = targetX !== undefined && targetY !== undefined ? { x: targetX, y: targetY } : null;
    const result = executeAbility(tacticalUnits, grid, unitId, abilityId, target, mission.currentTurn);
    if (!result.ok) return;

    if (result.sound === 'explosion') sfx.explosion();
    else if (result.sound === 'heal') sfx.heal();
    else if (result.sound === 'cloak') sfx.cloak();
    else if (result.sound === 'shot') sfx.shot();
    else if (result.sound === 'kill') sfx.kill();
    else sfx.confirm();

    // Ability kills can complete the mission
    const enemiesAlive = result.units.filter(u => !u.isPlayer && u.hp > 0);
    let newMission = { ...mission };
    if (mission.type === 'assault' && enemiesAlive.length === 0) {
      newMission = { ...newMission, isComplete: true, result: 'victory', objectives: newMission.objectives.map(o => ({ ...o, isComplete: true })) };
      result.log.push({ turn: mission.currentTurn, message: 'MISSION COMPLETE - VICTORY', type: 'system' });
    }
    set({ tacticalUnits: result.units, grid: result.grid, combatLog: [...combatLog, ...result.log], mission: newMission });
  },

  setUnitOverwatch: (unitId) => {
    const { tacticalUnits, mission, combatLog } = get();
    if (!mission?.playerTurn) return;
    const unit = tacticalUnits.find(u => u.id === unitId);
    if (!unit || unit.actionsRemaining < 2) return;
    set({
      tacticalUnits: tacticalUnits.map(u => u.id === unitId ? { ...u, isInOverwatch: true, actionsRemaining: 0 } : u),
      combatLog: [...combatLog, { turn: mission.currentTurn, message: `${unit.name} is on overwatch`, type: 'ability' }],
    });
  },

  setUnitHunker: (unitId) => {
    const { tacticalUnits, mission, combatLog } = get();
    if (!mission?.playerTurn) return;
    const unit = tacticalUnits.find(u => u.id === unitId);
    if (!unit || unit.actionsRemaining < 2) return;
    set({
      tacticalUnits: tacticalUnits.map(u => u.id === unitId ? { ...u, isHunkered: true, actionsRemaining: 0 } : u),
      combatLog: [...combatLog, { turn: mission.currentTurn, message: `${unit.name} hunkers down`, type: 'ability' }],
    });
  },

  attackUnit: (attackerId, targetId) => {
    const { tacticalUnits, grid, combatLog, mission } = get();
    if (!mission?.playerTurn) return;
    const attacker = tacticalUnits.find(u => u.id === attackerId);
    const target = tacticalUnits.find(u => u.id === targetId);
    if (!attacker || !target || attacker.actionsRemaining < 1) return;

    // Ambush passive: attacking from cloak is a guaranteed crit (and breaks cloak)
    const fromCloak = attacker.isCloaked;
    const { hitPercent, critPercent } = calculateHitChance(attacker, target, grid, tacticalUnits);
    const roll = fromCloak ? 0 : Math.random() * 100;
    const newLog = [...combatLog];
    let updatedUnits = tacticalUnits.map(u => u.id === attackerId
      ? { ...u, actionsRemaining: u.actionsRemaining - 1, isCloaked: false, statusEffects: u.statusEffects.filter(se => se.type !== 'cloak') }
      : u);
    sfx.shot();

    if (roll < hitPercent) {
      const isCrit = fromCloak || Math.random() * 100 < critPercent;
      let dmg = Math.max(1, attacker.weaponDamage - target.armor);
      if (isCrit) dmg = Math.floor(dmg * 1.5);
      updatedUnits = updatedUnits.map(u => u.id === targetId ? { ...u, hp: Math.max(0, u.hp - dmg) } : u);
      const hitTarget = updatedUnits.find(u => u.id === targetId)!;
      if (isCrit) {
        newLog.push({ turn: mission.currentTurn, message: `${fromCloak ? 'AMBUSH! ' : 'CRIT! '}${attacker.name} hits ${target.name} for ${dmg}`, type: 'crit' });
        sfx.crit();
      } else {
        newLog.push({ turn: mission.currentTurn, message: `${attacker.name} hits ${target.name} for ${dmg}`, type: 'hit' });
        sfx.hit();
      }
      if (hitTarget.hp <= 0) {
        newLog.push({ turn: mission.currentTurn, message: `${target.name} eliminated!`, type: 'kill' });
        sfx.kill();
        if (attacker.isPlayer) {
          updatedUnits = updatedUnits.map(u => u.id === attackerId ? { ...u, kills: (u.kills ?? 0) + 1 } : u);
        }
      }
    } else {
      // Graze check (25% of misses)
      if (Math.random() < 0.25) {
        const grazeDmg = Math.max(1, Math.floor(attacker.weaponDamage * 0.5) - target.armor);
        updatedUnits = updatedUnits.map(u => u.id === targetId ? { ...u, hp: Math.max(0, u.hp - grazeDmg) } : u);
        newLog.push({ turn: mission.currentTurn, message: `${attacker.name} grazes ${target.name} for ${grazeDmg}`, type: 'graze' });
        sfx.hit();
      } else {
        newLog.push({ turn: mission.currentTurn, message: `${attacker.name} misses ${target.name}`, type: 'miss' });
        sfx.miss();
      }
    }

    // Check mission completion (kill-based only for assault; extraction/defense end elsewhere)
    const enemiesAlive = updatedUnits.filter(u => !u.isPlayer && u.hp > 0);
    const playersAlive = updatedUnits.filter(u => u.isPlayer && u.hp > 0);
    let updatedMission = { ...mission };
    if (enemiesAlive.length === 0 && mission.type === 'assault') {
      updatedMission = { ...updatedMission, isComplete: true, result: 'victory', objectives: updatedMission.objectives.map(o => ({ ...o, isComplete: true })) };
      newLog.push({ turn: mission.currentTurn, message: 'MISSION COMPLETE - VICTORY', type: 'system' });
    } else if (playersAlive.length === 0) {
      updatedMission = { ...updatedMission, isComplete: true, result: 'defeat' };
      newLog.push({ turn: mission.currentTurn, message: 'MISSION FAILED - ALL OPERATIVES DOWN', type: 'system' });
    }
    set({ tacticalUnits: updatedUnits, combatLog: newLog, mission: updatedMission });
  },

  endPlayerTurn: () => {
    const { tacticalUnits, grid, combatLog, mission } = get();
    if (!mission || !mission.playerTurn) return;
    sfx.endTurn();

    // Enemy AI
    const { units: aiUnits, log: aiLog } = processEnemyAI(tacticalUnits, grid);
    const newLog = [...combatLog, ...aiLog.map(l => ({ ...l, turn: mission.currentTurn }))];

    // Reset player actions
    let resetUnits = aiUnits.map(u => u.isPlayer ? { ...u, actionsRemaining: u.maxActions, isInOverwatch: false, isHunkered: false } : u);

    const nextTurn = mission.currentTurn + 1;
    let newMission = { ...mission, currentTurn: nextTurn, playerTurn: true };

    // Defense missions: reinforcement waves every 2 turns, survive counter
    if (mission.type === 'defense') {
      const surviveObj = newMission.objectives.find(o => o.type === 'survive');
      if (surviveObj) {
        const held = (surviveObj.turnsHeld ?? 0) + 1;
        newMission = {
          ...newMission,
          objectives: newMission.objectives.map(o => o.type === 'survive'
            ? { ...o, turnsHeld: held, description: `Survive ${o.turnsRequired} turns — held ${held}/${o.turnsRequired}` }
            : o),
        };
        if (held >= (surviveObj.turnsRequired ?? 6)) {
          newMission = { ...newMission, isComplete: true, result: 'victory', objectives: newMission.objectives.map(o => ({ ...o, isComplete: true })) };
          newLog.push({ turn: nextTurn, message: 'Reinforcement window closed — POSITION HELD', type: 'system' });
        } else if (nextTurn % 2 === 0) {
          const { units: withWave, spawned } = spawnEnemyWave(resetUnits, grid, 2 + Math.floor(Math.random() * 2));
          resetUnits = withWave;
          newLog.push({ turn: nextTurn, message: `Enemy reinforcements: ${spawned} hostiles inbound from the south`, type: 'system' });
        }
      }
    }

    // Check completion
    const enemiesAlive = resetUnits.filter(u => !u.isPlayer && u.hp > 0);
    const playersAlive = resetUnits.filter(u => u.isPlayer && u.hp > 0);
    if (!newMission.isComplete) {
      if (enemiesAlive.length === 0 && mission.type === 'assault') {
        newMission = { ...newMission, isComplete: true, result: 'victory', objectives: newMission.objectives.map(o => ({ ...o, isComplete: true })) };
      } else if (playersAlive.length === 0) {
        newMission = { ...newMission, isComplete: true, result: 'defeat' };
      } else if (newMission.turnLimit && newMission.currentTurn > newMission.turnLimit) {
        newMission = { ...newMission, isComplete: true, result: 'defeat' };
        newLog.push({ turn: nextTurn, message: mission.type === 'extraction' ? 'Extraction window closed — MISSION FAILED' : 'Out of time — MISSION FAILED', type: 'system' });
      }
    }
    set({ tacticalUnits: resetUnits, combatLog: newLog, mission: newMission });
  },

  endCombat: (result) => {
    const { mission, territories, factions, playerFaction, newsTicker, tacticalUnits, operatives, fallenOperatives, turn } = get();
    if (!mission || !playerFaction) { set({ phase: 'strategic', mission: null, grid: [], tacticalUnits: [], combatLog: [] }); return; }
    const tid = mission.territoryId;
    const updatedTerritories = { ...territories };
    const updatedFactions = { ...factions };
    const ticker = [...newsTicker];

    // ---- Apply consequences to the deployed roster: permadeath, wounds, XP ----
    const newFallen = [...fallenOperatives];
    let updatedOperatives = [...operatives];
    for (const unit of tacticalUnits) {
      if (!unit.isPlayer || !unit.operativeId) continue;
      const opIdx = updatedOperatives.findIndex(o => o.id === unit.operativeId);
      if (opIdx === -1) continue;
      const op = updatedOperatives[opIdx];

      if (unit.hp <= 0) {
        // PERMADEATH — name goes on the memorial wall
        newFallen.push({
          name: op.name,
          callsign: op.callsign,
          class: op.class,
          level: op.level,
          missionsCompleted: op.missionsCompleted,
          kills: op.kills + (unit.kills ?? 0),
          causeOfDeath: `KIA — ${mission.type} mission, ${territories[tid]?.name ?? 'unknown territory'}`,
          turnKilled: turn,
        });
        updatedOperatives = updatedOperatives.filter(o => o.id !== unit.operativeId);
        ticker.push(`${op.callsign ? `"${op.callsign}" ` : ''}${op.name} was killed in action.`);
      } else {
        // Survivor: XP, kills, mission count; wounded if hurt
        const xpGain = 30 + (unit.kills ?? 0) * 20 + (result === 'victory' ? 20 : 0);
        let { level, xp, xpToNext, maxHp, aim, will } = op;
        xp += xpGain;
        while (xp >= xpToNext && level < 10) {
          xp -= xpToNext;
          level++;
          xpToNext = 100 * level;
          maxHp++; aim += 2; will += 3;
        }
        const hpFrac = unit.hp / unit.maxHp;
        const wounded = hpFrac < 0.999;
        updatedOperatives[opIdx] = {
          ...op,
          level, xp, xpToNext, maxHp, aim, will,
          kills: op.kills + (unit.kills ?? 0),
          missionsCompleted: op.missionsCompleted + 1,
          status: wounded ? 'wounded' : 'active',
          woundedTurns: wounded ? (hpFrac < 0.34 ? 3 : hpFrac < 0.67 ? 2 : 1) : 0,
          hp: wounded ? unit.hp : maxHp,
        };
      }
    }

    // ---- Battle bonds: two most seasoned unbonded survivors pair up after a win ----
    if (result === 'victory') {
      const survivorIds = tacticalUnits
        .filter(u => u.isPlayer && u.operativeId && u.hp > 0)
        .map(u => u.operativeId as string);
      const unbonded = updatedOperatives
        .filter(o => survivorIds.includes(o.id) && !o.bondedWith)
        .sort((a, b) => b.missionsCompleted - a.missionsCompleted);
      if (unbonded.length >= 2 && Math.random() < 0.5) {
        const [a, b] = unbonded;
        updatedOperatives = updatedOperatives.map(o => {
          if (o.id === a.id) return { ...o, bondedWith: b.id, bondLevel: o.bondLevel + 1 };
          if (o.id === b.id) return { ...o, bondedWith: a.id, bondLevel: o.bondLevel + 1 };
          return o;
        });
        ticker.push(`${a.name} and ${b.name} have formed a battle bond (+5 aim when adjacent).`);
      }
    }

    if (result === 'victory' && tid && territories[tid]) {
      const oldCtrl = territories[tid].controller;
      updatedTerritories[tid] = { ...territories[tid], controller: playerFaction, troops: 5, fortification: 0 };
      updatedFactions[playerFaction] = { ...updatedFactions[playerFaction], territories: [...updatedFactions[playerFaction].territories, tid] };
      if (oldCtrl && oldCtrl !== playerFaction) {
        updatedFactions[oldCtrl] = { ...updatedFactions[oldCtrl], territories: updatedFactions[oldCtrl].territories.filter(t => t !== tid) };
      }
      ticker.push(`Mission success: captured ${territories[tid].name}`);
      sfx.capture();
    } else {
      ticker.push(`Mission ${result}: operatives returning to base`);
    }
    set({
      phase: 'strategic', mission: null, grid: [], tacticalUnits: [], combatLog: [],
      territories: updatedTerritories, factions: updatedFactions, newsTicker: ticker,
      operatives: updatedOperatives, fallenOperatives: newFallen,
    });
  },

  // ---- Espionage ----
  deploySpy: (spyId, territoryId, action) => {
    const { spies, territories, factions, playerFaction, actionsRemaining, intelReports, newsTicker, turn, diplomacy } = get();
    if (actionsRemaining <= 0 || !playerFaction) return;
    const spy = spies.find(s => s.id === spyId);
    const target = territories[territoryId];
    if (!spy || spy.isCompromised || !target || !target.controller || target.controller === playerFaction) return;

    const ticker = [...newsTicker];
    const reports = [...intelReports];
    const updatedTerritories = { ...territories };
    let updatedSpies = [...spies];
    const newDiplomacy = { ...diplomacy, relations: { ...diplomacy.relations } };

    // Detection: base risk per action, reduced by spy skill (5%/level)
    const baseRisk: Record<string, number> = { gatherIntel: 0.10, sabotage: 0.35, inciteUnrest: 0.30, stealTech: 0.50, assassination: 0.60, counterIntelligence: 0 };
    const risk = Math.max(0.02, (baseRisk[action] ?? 0.3) - spy.skillLevel * 0.05);
    const detected = Math.random() < risk;

    if (detected) {
      updatedSpies = updatedSpies.map(s => s.id === spyId ? { ...s, isCompromised: true, location: null } : s);
      const rk = relationKey(playerFaction, target.controller);
      newDiplomacy.relations[rk] = Math.max(-100, (newDiplomacy.relations[rk] ?? 0) - 15);
      ticker.push(`${spy.name} was captured in ${target.name}. ${FACTION_NAMES[target.controller]} relations damaged.`);
    } else {
      if (action === 'gatherIntel') {
        const f = factions[target.controller];
        reports.unshift({
          id: `intel_${Date.now()}`,
          turn,
          source: spy.name,
          content: `${target.name}: ${target.troops} troops, fortification ${target.fortification}, unrest ${target.unrest}%. ${FACTION_NAMES[target.controller]} holds ${f.territories.length} territories.`,
          faction: target.controller,
          type: 'troops',
        });
        ticker.push(`${spy.name} gathered intel on ${target.name}.`);
      } else if (action === 'sabotage') {
        updatedTerritories[territoryId] = { ...target, troops: Math.max(1, target.troops - Math.floor(3 + Math.random() * 5)) };
        ticker.push(`Sabotage in ${target.name}: enemy garrison weakened.`);
      } else if (action === 'inciteUnrest') {
        updatedTerritories[territoryId] = { ...target, unrest: Math.min(100, target.unrest + 15 + Math.floor(Math.random() * 16)) };
        ticker.push(`Unrest rising in ${target.name}.`);
      }
      // Successful mission trains the spy
      updatedSpies = updatedSpies.map(s => s.id === spyId ? { ...s, skillLevel: Math.min(5, s.skillLevel + (Math.random() < 0.3 ? 1 : 0)), location: territoryId } : s);
    }

    set({
      spies: updatedSpies, territories: updatedTerritories, intelReports: reports,
      newsTicker: ticker, actionsRemaining: actionsRemaining - 1, diplomacy: newDiplomacy,
    });
  },
}));
