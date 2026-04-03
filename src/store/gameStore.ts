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
  BuildingType,
  OperativeClass,
  DiplomaticAction,
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
  setupTacticalCombat, calculateHitChance, processEnemyAI,
} from './helpers';

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
  // Actions
  setPhase: (phase: Phase) => void;
  initGame: (faction: FactionId, difficulty: Difficulty) => void;
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
  moveUnit: (unitId: string, x: number, y: number) => void;
  attackUnit: (attackerId: string, targetId: string) => void;
  endPlayerTurn: () => void;
  endCombat: (result: string) => void;
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

  setPhase: (phase) => set({ phase }),
  selectTerritory: (id) => set({ selectedTerritory: id }),

  initGame: (faction, difficulty) => {
    const territories = createTerritories();
    const factions = buildFactions(territories);
    resetOperativeGenerator();
    const operatives = generateStartingRoster(faction);
    const diplomacy = buildInitialDiplomacy();
    const spies = [generateSpy(faction)];
    set({
      phase: 'strategic', turn: 1, playerFaction: faction, difficulty,
      factions, territories, diplomacy, operatives,
      fallenOperatives: [], intelReports: [], currentEvent: null,
      actionsRemaining: 5, spies, newsTicker: [],
      mission: null, grid: [], tacticalUnits: [], combatLog: [],
      selectedTerritory: null,
    });
  },

  // ---- Save/Load ----
  getSaves: () => { const s = loadSaves(); set({ saves: s }); return s; },
  saveGame: (slotId) => {
    const st = get();
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
    const { currentEvent, factions, playerFaction } = get();
    if (!currentEvent || !playerFaction) return;
    const choice = currentEvent.choices.find(c => c.id === choiceId);
    if (!choice) { set({ currentEvent: null, phase: 'strategic' }); return; }
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
    set({ currentEvent: null, phase: 'strategic', factions: { ...factions, [playerFaction]: f } });
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

    // 3. AI turns
    for (const fid of FACTION_IDS) {
      if (fid === state.playerFaction || factions[fid].isDefeated) continue;
      const aiFaction: Faction = factions[fid];
      const aiActions = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < aiActions; i++) {
        const roll = Math.random();
        if (roll < 0.3 && aiFaction.territories.length > 0) {
          const fromTid: string = aiFaction.territories[Math.floor(Math.random() * aiFaction.territories.length)];
          const fromT: Territory | undefined = territories[fromTid];
          if (fromT && fromT.troops > 5) {
            const adjOwned: string[] = fromT.adjacency.filter((a: string) => territories[a]?.controller === fid);
            if (adjOwned.length > 0) {
              const toTid: string = adjOwned[Math.floor(Math.random() * adjOwned.length)];
              const move = Math.floor(fromT.troops * 0.3);
              territories[fromTid] = { ...fromT, troops: fromT.troops - move };
              territories[toTid] = { ...territories[toTid], troops: territories[toTid].troops + move };
            }
          }
        } else if (roll < 0.5 && aiFaction.territories.length > 0) {
          const fromTid: string = aiFaction.territories[Math.floor(Math.random() * aiFaction.territories.length)];
          const fromT: Territory | undefined = territories[fromTid];
          if (fromT && fromT.troops > 10) {
            const targets: string[] = fromT.adjacency.filter((a: string) => territories[a]?.controller !== fid && territories[a]?.controller !== null);
            if (targets.length > 0) {
              const toTid: string = targets[Math.floor(Math.random() * targets.length)];
              const to: Territory | undefined = territories[toTid];
              if (to) {
                const result = autoResolveCombat(fromT.troops, to.troops, to.fortification);
                territories[fromTid] = { ...fromT, troops: Math.max(1, fromT.troops - result.attackerLosses) };
                if (result.attackerWins) {
                  const oldCtrl: FactionId | null = to.controller;
                  territories[toTid] = { ...to, controller: fid, troops: Math.max(1, fromT.troops - result.attackerLosses - 2) };
                  factions[fid] = { ...factions[fid], territories: [...factions[fid].territories, toTid] };
                  if (oldCtrl) {
                    factions[oldCtrl] = { ...factions[oldCtrl], territories: factions[oldCtrl].territories.filter((t: string) => t !== toTid) };
                    if (factions[oldCtrl].territories.length === 0) factions[oldCtrl] = { ...factions[oldCtrl], isDefeated: true };
                  }
                  ticker.push(`${FACTION_NAMES[fid]} captured ${to.name}!`);
                } else {
                  territories[toTid] = { ...to, troops: Math.max(1, to.troops - result.defenderLosses) };
                  ticker.push(`${FACTION_NAMES[fid]} attack on ${to.name} repelled`);
                }
              }
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

    // 6. Events every 3 turns
    const newTurn = state.turn + 1;
    let event: GameEvent | null = null;
    let newPhase: Phase = 'strategic';
    if (newTurn % 3 === 0) {
      event = generateEvent(newTurn, state.playerFaction);
      newPhase = 'event';
    }

    // 7. Check victory/defeat
    const playerF = factions[state.playerFaction];
    if (playerF.territories.length === 0 || playerF.isDefeated) newPhase = 'gameover';
    if (playerF.territories.length >= 30) newPhase = 'victory';

    set({
      turn: newTurn, actionsRemaining: 5, territories, factions, operatives,
      diplomacy: { ...state.diplomacy, treaties },
      newsTicker: ticker, currentEvent: event, phase: newPhase,
    });

    // Autosave
    setTimeout(() => get().saveGame(0), 100);
  },

  // ---- Tactical Combat ----
  startTacticalCombat: (fromId, toId) => {
    const { territories, playerFaction } = get();
    if (!playerFaction) return;
    const from = territories[fromId], to = territories[toId];
    if (!from || !to) return;
    const { grid, units, mission } = setupTacticalCombat(to.terrain, playerFaction, from.troops, to.troops);
    const m = { ...mission, territoryId: toId };
    set({ grid, tacticalUnits: units, mission: m, phase: 'tactical', combatLog: [] });
  },

  moveUnit: (unitId, x, y) => {
    const { tacticalUnits, mission } = get();
    if (!mission?.playerTurn) return;
    const units = tacticalUnits.map(u => {
      if (u.id !== unitId || u.actionsRemaining < 1) return u;
      return { ...u, position: { x, y }, actionsRemaining: u.actionsRemaining - 1 };
    });
    set({ tacticalUnits: units });
  },

  attackUnit: (attackerId, targetId) => {
    const { tacticalUnits, grid, combatLog, mission } = get();
    if (!mission?.playerTurn) return;
    const attacker = tacticalUnits.find(u => u.id === attackerId);
    const target = tacticalUnits.find(u => u.id === targetId);
    if (!attacker || !target || attacker.actionsRemaining < 1) return;

    const { hitPercent, critPercent } = calculateHitChance(attacker, target, grid);
    const roll = Math.random() * 100;
    const newLog = [...combatLog];
    let updatedUnits = tacticalUnits.map(u => u.id === attackerId ? { ...u, actionsRemaining: u.actionsRemaining - 1 } : u);

    if (roll < hitPercent) {
      const isCrit = Math.random() * 100 < critPercent;
      let dmg = Math.max(1, attacker.weaponDamage - target.armor);
      if (isCrit) dmg = Math.floor(dmg * 1.5);
      updatedUnits = updatedUnits.map(u => u.id === targetId ? { ...u, hp: Math.max(0, u.hp - dmg) } : u);
      const hitTarget = updatedUnits.find(u => u.id === targetId)!;
      if (isCrit) {
        newLog.push({ turn: mission.currentTurn, message: `CRIT! ${attacker.name} hits ${target.name} for ${dmg}`, type: 'crit' });
      } else {
        newLog.push({ turn: mission.currentTurn, message: `${attacker.name} hits ${target.name} for ${dmg}`, type: 'hit' });
      }
      if (hitTarget.hp <= 0) {
        newLog.push({ turn: mission.currentTurn, message: `${target.name} eliminated!`, type: 'kill' });
      }
    } else {
      // Graze check (25% of misses)
      if (Math.random() < 0.25) {
        const grazeDmg = Math.max(1, Math.floor(attacker.weaponDamage * 0.5) - target.armor);
        updatedUnits = updatedUnits.map(u => u.id === targetId ? { ...u, hp: Math.max(0, u.hp - grazeDmg) } : u);
        newLog.push({ turn: mission.currentTurn, message: `${attacker.name} grazes ${target.name} for ${grazeDmg}`, type: 'graze' });
      } else {
        newLog.push({ turn: mission.currentTurn, message: `${attacker.name} misses ${target.name}`, type: 'miss' });
      }
    }

    // Check mission completion
    const enemiesAlive = updatedUnits.filter(u => !u.isPlayer && u.hp > 0);
    const playersAlive = updatedUnits.filter(u => u.isPlayer && u.hp > 0);
    let updatedMission = { ...mission };
    if (enemiesAlive.length === 0) {
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

    // Enemy AI
    const { units: aiUnits, log: aiLog } = processEnemyAI(tacticalUnits, grid);
    const newLog = [...combatLog, ...aiLog.map(l => ({ ...l, turn: mission.currentTurn }))];

    // Reset player actions
    const resetUnits = aiUnits.map(u => u.isPlayer ? { ...u, actionsRemaining: u.maxActions, isInOverwatch: false, isHunkered: false } : u);

    // Check completion
    const enemiesAlive = resetUnits.filter(u => !u.isPlayer && u.hp > 0);
    const playersAlive = resetUnits.filter(u => u.isPlayer && u.hp > 0);
    let newMission = { ...mission, currentTurn: mission.currentTurn + 1, playerTurn: true };
    if (enemiesAlive.length === 0) {
      newMission = { ...newMission, isComplete: true, result: 'victory', objectives: newMission.objectives.map(o => ({ ...o, isComplete: true })) };
    } else if (playersAlive.length === 0) {
      newMission = { ...newMission, isComplete: true, result: 'defeat' };
    } else if (newMission.turnLimit && newMission.currentTurn > newMission.turnLimit) {
      newMission = { ...newMission, isComplete: true, result: 'defeat' };
    }
    set({ tacticalUnits: resetUnits, combatLog: newLog, mission: newMission });
  },

  endCombat: (result) => {
    const { mission, territories, factions, playerFaction, newsTicker } = get();
    if (!mission || !playerFaction) { set({ phase: 'strategic', mission: null, grid: [], tacticalUnits: [], combatLog: [] }); return; }
    const tid = mission.territoryId;
    const updatedTerritories = { ...territories };
    const updatedFactions = { ...factions };
    const ticker = [...newsTicker];

    if (result === 'victory' && tid && territories[tid]) {
      const oldCtrl = territories[tid].controller;
      updatedTerritories[tid] = { ...territories[tid], controller: playerFaction, troops: 5, fortification: 0 };
      updatedFactions[playerFaction] = { ...updatedFactions[playerFaction], territories: [...updatedFactions[playerFaction].territories, tid] };
      if (oldCtrl && oldCtrl !== playerFaction) {
        updatedFactions[oldCtrl] = { ...updatedFactions[oldCtrl], territories: updatedFactions[oldCtrl].territories.filter(t => t !== tid) };
      }
      ticker.push(`Mission success: captured ${territories[tid].name}`);
    } else {
      ticker.push(`Mission ${result}: operatives returning to base`);
    }
    set({ phase: 'strategic', mission: null, grid: [], tacticalUnits: [], combatLog: [], territories: updatedTerritories, factions: updatedFactions, newsTicker: ticker });
  },
}));
