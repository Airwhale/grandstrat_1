// ===== SHADOW ACCORD - Core Type Definitions =====

export type FactionId = 'atlantic' | 'eastern' | 'jade' | 'solar' | 'southern' | 'freecities';

export type Phase = 'menu' | 'faction_select' | 'strategic' | 'tactical' | 'event' | 'diplomacy_screen' | 'tech_screen' | 'roster_screen' | 'gameover' | 'victory';

export type Difficulty = 'normal' | 'hard' | 'ironman';

export type TerrainType = 'urban' | 'jungle' | 'desert' | 'arctic' | 'mountain' | 'coastal';

export type ResourceType = 'credits' | 'techPoints' | 'influence' | 'rareMaterials' | 'manpower';

export interface Resources {
  credits: number;
  techPoints: number;
  influence: number;
  rareMaterials: number;
  manpower: number;
}

// ===== FACTIONS =====

export interface FactionPersonality {
  aggression: number;    // 0-10
  loyalty: number;       // 0-10
  greed: number;         // 0-10
  paranoia: number;      // 0-10
  ambition: number;      // 0-10
  memory: number;        // turns before grudges decay
}

export interface Faction {
  id: FactionId;
  name: string;
  color: string;
  territories: string[];
  resources: Resources;
  personality: FactionPersonality;
  researchedTechs: TechId[];
  currentResearch: { techId: TechId; turnsRemaining: number } | null;
  spyCount: number;
  isDefeated: boolean;
}

// ===== TERRITORIES =====

export type TerritoryId = string;

export type BuildingType = 'base' | 'lab' | 'factory' | 'hospital' | 'spyNetwork' | 'bank' | 'mediaCenter' | 'fortress' | 'recruitCenter';

export interface Building {
  type: BuildingType;
  level: number;
}

export interface Territory {
  id: TerritoryId;
  name: string;
  controller: FactionId | null;
  troops: number;
  buildings: Building[];
  resources: Partial<Resources>;
  unrest: number;          // 0-100
  fortification: number;   // 0-3
  adjacency: TerritoryId[];
  terrain: TerrainType;
  position: { x: number; y: number }; // map position (% based)
  region: string;
  hasRareMaterials: boolean;
}

// ===== DIPLOMACY =====

export type TreatyType = 'trade' | 'nonAggression' | 'defensiveAlliance' | 'fullAlliance';

export interface Treaty {
  id: string;
  type: TreatyType;
  factions: [FactionId, FactionId];
  turnsRemaining: number | null; // null = permanent until broken
  turnEstablished: number;
}

export type DiplomaticAction = 'proposeTrade' | 'nonAggressionPact' | 'defensiveAlliance' | 'fullAlliance' | 'demandTribute' | 'threaten' | 'denounce' | 'proposeUNResolution' | 'betrayAlliance' | 'offerPeace';

export interface DiplomacyState {
  relations: Record<string, number>; // key: "faction1-faction2", value: -100 to 100
  treaties: Treaty[];
  pendingProposals: DiplomaticProposal[];
  wars: Array<{ attacker: FactionId; defender: FactionId; turnStarted: number }>;
}

export interface DiplomaticProposal {
  id: string;
  from: FactionId;
  to: FactionId;
  action: DiplomaticAction;
  turn: number;
}

// ===== OPERATIVES =====

export type OperativeClass = 'assault' | 'sharpshooter' | 'heavy' | 'medic' | 'infiltrator' | 'specialist' | 'cyberGhost' | 'spetsnazVanguard' | 'silkAgent' | 'sufiPhantom' | 'bushveldRanger' | 'ghostBroker';

export type OperativeStatus = 'active' | 'wounded' | 'deployed' | 'kia';

export interface OperativeTrait {
  id: string;
  name: string;
  description: string;
  effect: Record<string, number>;
}

export interface Operative {
  id: string;
  name: string;
  callsign: string | null;
  faction: FactionId;
  class: OperativeClass;
  level: number;
  xp: number;
  xpToNext: number;
  hp: number;
  maxHp: number;
  armor: number;
  aim: number;
  mobility: number;
  will: number;
  actions: number;
  status: OperativeStatus;
  woundedTurns: number;
  missionsCompleted: number;
  kills: number;
  traits: OperativeTrait[];
  bondedWith: string | null; // operative id
  bondLevel: number;
  abilities: AbilityId[];
}

export interface FallenOperative {
  name: string;
  callsign: string | null;
  class: OperativeClass;
  level: number;
  missionsCompleted: number;
  kills: number;
  causeOfDeath: string;
  turnKilled: number;
}

// ===== ABILITIES =====

export type AbilityId = string;

export interface Ability {
  id: AbilityId;
  name: string;
  description: string;
  apCost: number;
  cooldown: number;
  range?: number;
  aoeRadius?: number;
  damage?: number;
  effectType: 'damage' | 'heal' | 'buff' | 'debuff' | 'movement' | 'special';
}

// ===== TACTICAL COMBAT =====

export type TileType = 'floor' | 'wall' | 'halfCover' | 'fullCover' | 'highGround' | 'water' | 'hazard' | 'objective';

export interface Tile {
  x: number;
  y: number;
  type: TileType;
  elevation: number; // 0-2
  isVisible: boolean;
  isInRange: boolean;
  isMoveable: boolean;
  occupant: TacticalUnit | null;
  destructible: boolean;
  onFire: boolean;
}

export interface TacticalUnit {
  id: string;
  operativeId?: string; // links to Operative for player units
  name: string;
  isPlayer: boolean;
  class: OperativeClass | 'militia' | 'turret' | 'drone';
  hp: number;
  maxHp: number;
  armor: number;
  aim: number;
  mobility: number;
  position: { x: number; y: number };
  actionsRemaining: number;
  maxActions: number;
  isInOverwatch: boolean;
  isHunkered: boolean;
  isCloaked: boolean;
  statusEffects: StatusEffect[];
  behaviorProfile: 'aggressive' | 'defensive' | 'support' | 'boss';
  abilities: AbilityId[];
  weaponDamage: number;
  kills?: number; // kills scored this mission (player units)
  abilityCooldowns?: Record<string, number>; // turns until each ability is usable again
  abilityUses?: Record<string, number>; // remaining uses for limited abilities
  bondedWith?: string; // operativeId of battle-bonded partner (+5 aim when adjacent)
}

export interface StatusEffect {
  type: string;
  turnsRemaining: number;
  value: number;
}

export type MissionType = 'assault' | 'defense' | 'extraction' | 'sabotage' | 'rescue' | 'assassination' | 'intelRaid';

export interface Mission {
  type: MissionType;
  territoryId: TerritoryId;
  terrain: TerrainType;
  gridWidth: number;
  gridHeight: number;
  objectives: MissionObjective[];
  enemyCount: number;
  turnLimit: number | null;
  currentTurn: number;
  playerTurn: boolean;
  isComplete: boolean;
  result: 'victory' | 'defeat' | 'retreat' | null;
  deployed?: boolean; // false until player confirms deployment from briefing
}

export interface MissionObjective {
  id: string;
  description: string;
  type: 'capture' | 'eliminate' | 'survive' | 'destroy' | 'reach' | 'hack' | 'escort';
  targetPosition?: { x: number; y: number };
  isComplete: boolean;
  turnsRequired?: number;
  turnsHeld?: number;
}

export interface CombatLogEntry {
  turn: number;
  message: string;
  type: 'hit' | 'miss' | 'crit' | 'graze' | 'kill' | 'ability' | 'movement' | 'system';
}

// ===== TECHNOLOGY =====

export type TechBranch = 'military' | 'economic' | 'intelligence';

export type TechId = string;

export interface Technology {
  id: TechId;
  name: string;
  description: string;
  branch: TechBranch;
  tier: number; // 1-4
  cost: number; // tech points
  turnsToResearch: number;
  prerequisites: TechId[];
  effects: Record<string, number>;
}

// ===== ESPIONAGE =====

export interface Spy {
  id: string;
  name: string;
  faction: FactionId;
  skillLevel: number; // 1-5
  location: TerritoryId | null;
  currentAction: SpyAction | null;
  turnsRemaining: number;
  isCompromised: boolean;
}

export type SpyAction = 'gatherIntel' | 'sabotage' | 'stealTech' | 'inciteUnrest' | 'assassination' | 'counterIntelligence';

export interface IntelReport {
  id: string;
  turn: number;
  source: string;
  content: string;
  faction: FactionId;
  type: 'troops' | 'diplomacy' | 'economy' | 'espionage' | 'event';
}

// ===== EVENTS =====

export interface GameEvent {
  id: string;
  name: string;
  description: string;
  turn: number;
  type: 'global' | 'faction' | 'territory';
  choices: EventChoice[];
  resolved: boolean;
  affectedFactions?: FactionId[];
  affectedTerritories?: TerritoryId[];
}

export interface EventChoice {
  id: string;
  label: string;
  description: string;
  effects: EventEffect[];
}

export interface EventEffect {
  type: 'resources' | 'relations' | 'unrest' | 'troops' | 'tech' | 'spy' | 'territory';
  target?: FactionId | TerritoryId;
  value: number;
  field?: string;
}

// ===== STRATEGIC ACTIONS =====

export type StrategicActionType = 'moveForces' | 'attackTerritory' | 'diplomacy' | 'espionage' | 'build' | 'research' | 'recruit' | 'covertOp' | 'trade' | 'restRefit';

export interface StrategicAction {
  type: StrategicActionType;
  label: string;
  description: string;
  cost?: Partial<Resources>;
}

// ===== ECONOMY =====

export interface IncomeBreakdown {
  territories: number;
  buildings: number;
  unrestPenalty: number;
  techPoints: number;
  total: number;
}

// ===== SAVE/LOAD =====

export interface SaveSlot {
  id: number;
  name: string;
  turn: number;
  faction: FactionId;
  timestamp: number;
  data: string; // JSON serialized game state
}
