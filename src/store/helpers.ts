import type { FactionId, Territory, Faction, DiplomacyState, Spy, TacticalUnit, Tile, Mission, CombatLogEntry } from '@/types';
import { generateCombatMap } from '@/data/combatMaps';

// ---- Faction IDs ----
export const FACTION_IDS: FactionId[] = ['atlantic', 'eastern', 'jade', 'solar', 'southern', 'freecities'];

// ---- Relation Key ----
export function relationKey(a: FactionId, b: FactionId): string {
  return [a, b].sort().join('-');
}

// ---- Initial Diplomacy ----
export function buildInitialDiplomacy(): DiplomacyState {
  const relations: Record<string, number> = {};
  for (let i = 0; i < FACTION_IDS.length; i++) {
    for (let j = i + 1; j < FACTION_IDS.length; j++) {
      const a = FACTION_IDS[i], b = FACTION_IDS[j];
      let val = 0;
      // Jade Circle starts at -10 with everyone
      if (a === 'jade' || b === 'jade') val = -10;
      relations[relationKey(a, b)] = val;
    }
  }
  return { relations, treaties: [], pendingProposals: [], wars: [] };
}

// ---- Income Calculation ----
export function calculateIncome(faction: Faction, territories: Record<string, Territory>): number {
  let income = 0;
  for (const tid of faction.territories) {
    const t = territories[tid];
    if (!t) continue;
    income += t.resources.credits ?? 0;
    for (const b of t.buildings) {
      if (b.type === 'bank') income += 15 * b.level;
      if (b.type === 'factory') income += 10 * b.level;
    }
    // Unrest penalty
    if (t.unrest > 50) income -= Math.floor((t.unrest - 50) * 0.3);
  }
  return Math.max(0, income);
}

// ---- Tech Point Income ----
export function calculateTechIncome(faction: Faction, territories: Record<string, Territory>): number {
  let tp = 0;
  for (const tid of faction.territories) {
    const t = territories[tid];
    if (!t) continue;
    tp += t.resources.techPoints ?? 0;
    for (const b of t.buildings) {
      if (b.type === 'lab') tp += 10 * b.level;
    }
  }
  return tp;
}

// ---- Building Costs ----
export const BUILDING_COSTS: Record<string, number> = {
  base: 100, lab: 120, factory: 150, hospital: 100,
  spyNetwork: 130, bank: 140, mediaCenter: 110, fortress: 200, recruitCenter: 90,
};

// ---- Diplomatic Action Costs ----
export const DIPLOMACY_COSTS: Record<string, number> = {
  proposeTrade: 5, nonAggressionPact: 10, defensiveAlliance: 20,
  fullAlliance: 35, demandTribute: 0, threaten: 0,
  denounce: 5, proposeUNResolution: 15, betrayAlliance: 0, offerPeace: 10,
};

// ---- Diplomacy Relation Changes ----
export const DIPLOMACY_RELATION_CHANGES: Record<string, number> = {
  proposeTrade: 10, nonAggressionPact: 15, defensiveAlliance: 25,
  fullAlliance: 40, demandTribute: -5, threaten: -10,
  denounce: -15, proposeUNResolution: 0, betrayAlliance: -30, offerPeace: 5,
};

// ---- Auto-Resolve Combat ----
export function autoResolveCombat(
  attackerTroops: number,
  defenderTroops: number,
  attackerFortification: number,
): { attackerLosses: number; defenderLosses: number; attackerWins: boolean } {
  const defBonus = 1 + attackerFortification * 0.15;
  const effectiveDefender = defenderTroops * defBonus;
  const ratio = attackerTroops / Math.max(1, effectiveDefender);
  const randomFactor = 0.7 + Math.random() * 0.6; // 0.7-1.3

  const attackerWins = ratio * randomFactor > 1;
  const attackerLosses = Math.floor(defenderTroops * (0.3 + Math.random() * 0.3));
  const defenderLosses = attackerWins
    ? defenderTroops
    : Math.floor(attackerTroops * (0.2 + Math.random() * 0.3));

  return { attackerLosses: Math.min(attackerLosses, attackerTroops), defenderLosses, attackerWins };
}

// ---- News Generation ----
const AI_ACTIONS = [
  (f: string, t: string) => `${f} reinforces positions in ${t}`,
  (f: string, t: string) => `${f} begins construction project in ${t}`,
  (f: string) => `${f} advances military research programs`,
  (f: string) => `${f} recruits new operatives`,
  (f: string, _: string, t2: string) => `${f} moves forces toward ${t2}`,
  (f: string) => `${f} diplomatic envoys spotted in neutral territory`,
];

export function generateAINews(factionName: string, territories: string[]): string {
  const template = AI_ACTIONS[Math.floor(Math.random() * AI_ACTIONS.length)];
  const t1 = territories[Math.floor(Math.random() * territories.length)] ?? 'unknown region';
  const t2 = territories[Math.floor(Math.random() * territories.length)] ?? 'the border';
  return template(factionName, t1, t2);
}

// ---- Spy Name Generation ----
const SPY_NAMES = [
  'Agent Cobalt', 'Agent Crimson', 'Agent Onyx', 'Agent Sage',
  'Agent Frost', 'Agent Ember', 'Agent Cipher', 'Agent Shade',
  'Agent Veil', 'Agent Prism', 'Agent Dusk', 'Agent Apex',
];
let spyNameIdx = 0;

export function generateSpy(faction: FactionId): Spy {
  const name = SPY_NAMES[spyNameIdx % SPY_NAMES.length];
  spyNameIdx++;
  return {
    id: `spy_${faction}_${spyNameIdx}`,
    name,
    faction,
    skillLevel: 1,
    location: null,
    currentAction: null,
    turnsRemaining: 0,
    isCompromised: false,
  };
}

// ---- Tactical Combat Setup ----
export function setupTacticalCombat(
  terrain: Territory['terrain'],
  playerFaction: FactionId,
  attackerTroops: number,
  defenderTroops: number,
): { grid: Tile[][]; units: TacticalUnit[]; mission: Mission } {
  const mapData = generateCombatMap(terrain);
  const gridHeight = mapData.length;
  const gridWidth = mapData[0]?.length ?? 12;

  // Build grid
  const grid: Tile[][] = mapData.map((row, y) =>
    row.map((cell, x) => ({
      x, y,
      type: cell.type,
      elevation: cell.elevation,
      isVisible: true,
      isInRange: false,
      isMoveable: false,
      occupant: null,
      destructible: cell.type === 'halfCover' || cell.type === 'fullCover',
      onFire: false,
    }))
  );

  // Place player units (top-left area)
  const playerCount = Math.min(4, Math.max(2, Math.floor(attackerTroops / 8)));
  const playerUnits: TacticalUnit[] = [];
  const classes = ['assault', 'sharpshooter', 'heavy', 'medic'] as const;
  let placed = 0;
  for (let y = 0; y < 3 && placed < playerCount; y++) {
    for (let x = 0; x < 4 && placed < playerCount; x++) {
      if (grid[y]?.[x]?.type === 'floor' || grid[y]?.[x]?.type === 'halfCover') {
        const cls = classes[placed % classes.length];
        const unit: TacticalUnit = {
          id: `player_${placed}`,
          name: `Operative ${placed + 1}`,
          isPlayer: true,
          class: cls,
          hp: cls === 'heavy' ? 10 : cls === 'medic' ? 7 : 8,
          maxHp: cls === 'heavy' ? 10 : cls === 'medic' ? 7 : 8,
          armor: cls === 'heavy' ? 1 : 0,
          aim: cls === 'sharpshooter' ? 15 : 5,
          mobility: cls === 'heavy' ? 4 : 5,
          position: { x, y },
          actionsRemaining: 2,
          maxActions: 2,
          isInOverwatch: false,
          isHunkered: false,
          isCloaked: false,
          statusEffects: [],
          behaviorProfile: 'aggressive',
          abilities: [],
          weaponDamage: cls === 'sharpshooter' ? 5 : 4,
        };
        playerUnits.push(unit);
        placed++;
      }
    }
  }

  // Place enemy units (bottom-right area)
  const enemyCount = Math.min(6, Math.max(2, Math.floor(defenderTroops / 6)));
  const enemyUnits: TacticalUnit[] = [];
  placed = 0;
  for (let y = gridHeight - 3; y < gridHeight && placed < enemyCount; y++) {
    for (let x = gridWidth - 4; x < gridWidth && placed < enemyCount; x++) {
      if (grid[y]?.[x]?.type === 'floor' || grid[y]?.[x]?.type === 'halfCover') {
        const behaviors = ['aggressive', 'defensive', 'aggressive', 'support'] as const;
        const unit: TacticalUnit = {
          id: `enemy_${placed}`,
          name: `Hostile ${placed + 1}`,
          isPlayer: false,
          class: 'militia',
          hp: 6,
          maxHp: 6,
          armor: 0,
          aim: 3,
          mobility: 4,
          position: { x, y },
          actionsRemaining: 2,
          maxActions: 2,
          isInOverwatch: false,
          isHunkered: false,
          isCloaked: false,
          statusEffects: [],
          behaviorProfile: behaviors[placed % behaviors.length],
          abilities: [],
          weaponDamage: 3,
        };
        enemyUnits.push(unit);
        placed++;
      }
    }
  }

  const allUnits = [...playerUnits, ...enemyUnits];

  const mission: Mission = {
    type: 'assault',
    territoryId: '',
    terrain,
    gridWidth,
    gridHeight,
    objectives: [{
      id: 'obj_eliminate',
      description: 'Eliminate all hostiles',
      type: 'eliminate',
      isComplete: false,
    }],
    enemyCount,
    turnLimit: 20,
    currentTurn: 1,
    playerTurn: true,
    isComplete: false,
    result: null,
  };

  return { grid, units: allUnits, mission };
}

// ---- Hit Chance Calculation ----
export function calculateHitChance(
  attacker: TacticalUnit,
  target: TacticalUnit,
  grid: Tile[][],
): { hitPercent: number; critPercent: number; breakdown: string[] } {
  const breakdown: string[] = [];
  let hit = 65;
  breakdown.push(`Base: 65%`);

  // Aim
  hit += attacker.aim;
  if (attacker.aim !== 0) breakdown.push(`Aim: ${attacker.aim > 0 ? '+' : ''}${attacker.aim}%`);

  // Range
  const dx = Math.abs(attacker.position.x - target.position.x);
  const dy = Math.abs(attacker.position.y - target.position.y);
  const dist = Math.sqrt(dx * dx + dy * dy);
  let rangeMod = 0;
  if (dist <= 3) { rangeMod = 10; breakdown.push('Close range: +10%'); }
  else if (dist <= 8) { rangeMod = 0; }
  else if (dist <= 12) { rangeMod = -15; breakdown.push('Long range: -15%'); }
  else { rangeMod = -30; breakdown.push('Extreme range: -30%'); }
  hit += rangeMod;

  // Cover
  const targetTile = grid[target.position.y]?.[target.position.x];
  if (targetTile) {
    if (target.isHunkered) {
      if (targetTile.type === 'halfCover') { hit -= 40; breakdown.push('Half cover (hunkered): -40%'); }
      else if (targetTile.type === 'fullCover') { hit -= 80; breakdown.push('Full cover (hunkered): -80%'); }
    } else {
      if (targetTile.type === 'halfCover') { hit -= 20; breakdown.push('Half cover: -20%'); }
      else if (targetTile.type === 'fullCover') { hit -= 40; breakdown.push('Full cover: -40%'); }
    }
  }

  // High ground
  const attackerTile = grid[attacker.position.y]?.[attacker.position.x];
  if (attackerTile && targetTile) {
    if (attackerTile.elevation > targetTile.elevation) { hit += 10; breakdown.push('High ground: +10%'); }
    else if (attackerTile.elevation < targetTile.elevation) { hit -= 10; breakdown.push('Low ground: -10%'); }
  }

  // Flanking (simplified: if attacker is not in front arc)
  // For simplicity, flanking if distance is close and adjacent
  if (dist <= 2) { hit += 15; breakdown.push('Flanking: +15%'); }

  const hitPercent = Math.max(5, Math.min(95, hit));
  const critPercent = Math.max(0, 5 + (dist <= 2 ? 15 : 0));

  return { hitPercent, critPercent, breakdown };
}

// ---- Enemy AI Turn ----
export function processEnemyAI(
  units: TacticalUnit[],
  grid: Tile[][],
): { units: TacticalUnit[]; log: CombatLogEntry[]; turn: number } {
  const log: CombatLogEntry[] = [];
  const updatedUnits = units.map(u => ({ ...u }));
  const enemies = updatedUnits.filter(u => !u.isPlayer && u.hp > 0);
  const players = updatedUnits.filter(u => u.isPlayer && u.hp > 0);

  for (const enemy of enemies) {
    enemy.actionsRemaining = enemy.maxActions;

    if (players.length === 0) break;

    // Find closest player
    let closestPlayer: TacticalUnit | null = null;
    let closestDist = Infinity;
    for (const p of players) {
      const d = Math.abs(p.position.x - enemy.position.x) + Math.abs(p.position.y - enemy.position.y);
      if (d < closestDist) { closestDist = d; closestPlayer = p; }
    }
    if (!closestPlayer) continue;

    // If in range, attack
    if (closestDist <= 8 && enemy.actionsRemaining > 0) {
      const { hitPercent } = calculateHitChance(enemy, closestPlayer, grid);
      const roll = Math.random() * 100;
      if (roll < hitPercent) {
        const dmg = Math.max(1, enemy.weaponDamage - closestPlayer.armor);
        closestPlayer.hp = Math.max(0, closestPlayer.hp - dmg);
        log.push({ turn: 0, message: `${enemy.name} hits ${closestPlayer.name} for ${dmg} damage`, type: 'hit' });
        if (closestPlayer.hp <= 0) {
          log.push({ turn: 0, message: `${closestPlayer.name} is DOWN!`, type: 'kill' });
        }
      } else {
        log.push({ turn: 0, message: `${enemy.name} misses ${closestPlayer.name}`, type: 'miss' });
      }
      enemy.actionsRemaining--;
    }

    // If far, move closer
    if (closestDist > 3 && enemy.actionsRemaining > 0) {
      const dirX = Math.sign(closestPlayer.position.x - enemy.position.x);
      const dirY = Math.sign(closestPlayer.position.y - enemy.position.y);
      const newX = enemy.position.x + dirX * Math.min(enemy.mobility, 2);
      const newY = enemy.position.y + dirY * Math.min(enemy.mobility, 2);

      // Clamp and check walkability
      const clampedX = Math.max(0, Math.min((grid[0]?.length ?? 12) - 1, newX));
      const clampedY = Math.max(0, Math.min(grid.length - 1, newY));
      const tile = grid[clampedY]?.[clampedX];
      const occupied = updatedUnits.some(u => u.hp > 0 && u.position.x === clampedX && u.position.y === clampedY && u.id !== enemy.id);

      if (tile && tile.type !== 'wall' && tile.type !== 'water' && !occupied) {
        enemy.position = { x: clampedX, y: clampedY };
        log.push({ turn: 0, message: `${enemy.name} moves`, type: 'movement' });
      }
      enemy.actionsRemaining--;
    }
  }

  return { units: updatedUnits, log, turn: 0 };
}
