import { FactionId, Faction, Resources } from '@/types';

export const FACTION_COLORS: Record<FactionId, string> = {
  atlantic: '#3B82F6',
  eastern: '#EF4444',
  jade: '#10B981',
  solar: '#F59E0B',
  southern: '#F97316',
  freecities: '#8B5CF6',
};

export const FACTION_NAMES: Record<FactionId, string> = {
  atlantic: 'The Atlantic Compact',
  eastern: 'The Eastern Pact',
  jade: 'The Jade Circle',
  solar: 'The Solar League',
  southern: 'The Southern Axis',
  freecities: 'The Free Cities',
};

export const FACTION_DESCRIPTIONS: Record<FactionId, { tagline: string; strength: string; weakness: string; ability: string; abilityDesc: string; uniqueUnit: string; uniqueUnitDesc: string; lore: string; difficulty: number }> = {
  atlantic: {
    tagline: 'Technology & Intelligence',
    strength: 'Advanced cyber capabilities and superior reconnaissance',
    weakness: 'Political fragility — democracies have higher unrest from aggressive actions',
    ability: 'Five Eyes',
    abilityDesc: 'See enemy movements in adjacent territories. Intel actions cost 20% less.',
    uniqueUnit: 'Cyber Ghost',
    uniqueUnitDesc: 'Specialist who can hack enemy defenses during tactical combat, disabling turrets/cover/overwatch for 2 turns.',
    lore: 'The remnants of NATO, bound together by shared intelligence networks and a desperate faith in democratic institutions that grow more brittle by the day.',
    difficulty: 2,
  },
  eastern: {
    tagline: 'Military Might',
    strength: 'Cheaper, stronger conventional forces; starts with more troops',
    weakness: 'Lower base income, expensive tech research',
    ability: 'Deep Winter',
    abilityDesc: 'Defensive combat in home territories grants +25% damage and +1 armor. Can conscript emergency militia once per game.',
    uniqueUnit: 'Spetsnaz Vanguard',
    uniqueUnitDesc: 'Heavy assault operative with explosive breach that destroys cover in a 2-tile radius.',
    lore: 'A military-industrial colossus stretching from Moscow to Vladivostok, the Pact trades economic finesse for raw, armored power.',
    difficulty: 3,
  },
  jade: {
    tagline: 'Economy & Manufacturing',
    strength: 'Highest base income, cheapest infrastructure, fastest production',
    weakness: 'Other factions start with -10 relations; alliances cost more influence',
    ability: 'Belt & Road',
    abilityDesc: 'Build infrastructure in neutral territories for half cost, converting them without combat. Trade routes generate +50% income.',
    uniqueUnit: 'Silk Agent',
    uniqueUnitDesc: 'Diplomatic operative who can convert one enemy unit to fight for you for 3 turns.',
    lore: 'Patient, wealthy, and expansionist without ever firing a shot. The Jade Circle builds roads where others build walls.',
    difficulty: 2,
  },
  solar: {
    tagline: 'Population & Influence',
    strength: 'Largest manpower pool, strongest diplomatic weight, cheapest influence generation',
    weakness: 'Starts one tech tier behind, research costs +25%',
    ability: 'Non-Aligned Movement',
    abilityDesc: 'Maintain positive relations with multiple warring factions. Defensive pacts don\'t auto-trigger war.',
    uniqueUnit: 'Sufi Phantom',
    uniqueUnitDesc: 'Stealth operative with smoke bomb and hit-and-run capability.',
    lore: 'A billion voices united by ancient trade routes and modern ambition. The League does not take sides — it takes everything.',
    difficulty: 3,
  },
  southern: {
    tagline: 'Resources & Resilience',
    strength: 'Critical rare minerals; units have +1 HP; territories harder to destabilize',
    weakness: 'Fewer developed territories, slower initial expansion',
    ability: 'Resource Leverage',
    abilityDesc: 'Embargo resources to damage enemy economies. Controlling 3+ resource territories grants global income bonus.',
    uniqueUnit: 'Bushveld Ranger',
    uniqueUnitDesc: 'Recon operative with extreme vision range, trap-setting, and +50% concealment damage.',
    lore: 'Forged in exploitation, risen in defiance. The Axis controls what the world needs and finally sets the price.',
    difficulty: 4,
  },
  freecities: {
    tagline: 'Espionage & Finance',
    strength: 'Best spy network, market manipulation, highest per-territory income',
    weakness: 'No contiguous territory; smallest military; no heavy units',
    ability: 'Shadow Market',
    abilityDesc: 'Buy/sell intelligence on any faction. Short enemy economies during crises. Spies have +1 action.',
    uniqueUnit: 'Ghost Broker',
    uniqueUnitDesc: 'Can bribe enemy units mid-combat and carries a concealed pistol that ignores 1 armor.',
    lore: 'Six city-states, six vaults, one network. The Free Cities own no armies, only debts — and everyone owes.',
    difficulty: 5,
  },
};

export const FACTION_STARTING_RESOURCES: Record<FactionId, Resources> = {
  atlantic: { credits: 500, techPoints: 80, influence: 60, rareMaterials: 20, manpower: 100 },
  eastern: { credits: 350, techPoints: 40, influence: 40, rareMaterials: 30, manpower: 150 },
  jade: { credits: 700, techPoints: 60, influence: 30, rareMaterials: 25, manpower: 120 },
  solar: { credits: 400, techPoints: 30, influence: 80, rareMaterials: 15, manpower: 180 },
  southern: { credits: 350, techPoints: 35, influence: 40, rareMaterials: 50, manpower: 100 },
  freecities: { credits: 800, techPoints: 50, influence: 50, rareMaterials: 10, manpower: 50 },
};

export const FACTION_PERSONALITY_RANGES: Record<FactionId, { [K in keyof import('@/types').FactionPersonality]: [number, number] }> = {
  atlantic: { aggression: [3, 6], loyalty: [6, 9], greed: [4, 7], paranoia: [5, 8], ambition: [4, 7], memory: [4, 7] },
  eastern: { aggression: [6, 9], loyalty: [3, 6], greed: [4, 7], paranoia: [6, 9], ambition: [6, 9], memory: [7, 10] },
  jade: { aggression: [2, 5], loyalty: [5, 8], greed: [7, 10], paranoia: [4, 7], ambition: [7, 10], memory: [5, 8] },
  solar: { aggression: [3, 6], loyalty: [5, 8], greed: [4, 7], paranoia: [3, 6], ambition: [5, 8], memory: [4, 7] },
  southern: { aggression: [4, 7], loyalty: [5, 8], greed: [5, 8], paranoia: [5, 8], ambition: [5, 8], memory: [6, 9] },
  freecities: { aggression: [1, 4], loyalty: [3, 6], greed: [7, 10], paranoia: [5, 8], ambition: [4, 7], memory: [3, 6] },
};

export function randomPersonality(factionId: FactionId): import('@/types').FactionPersonality {
  const ranges = FACTION_PERSONALITY_RANGES[factionId];
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  return {
    aggression: rand(...ranges.aggression),
    loyalty: rand(...ranges.loyalty),
    greed: rand(...ranges.greed),
    paranoia: rand(...ranges.paranoia),
    ambition: rand(...ranges.ambition),
    memory: rand(...ranges.memory),
  };
}

export function createFaction(id: FactionId, territoryIds: string[]): Faction {
  return {
    id,
    name: FACTION_NAMES[id],
    color: FACTION_COLORS[id],
    territories: territoryIds,
    resources: { ...FACTION_STARTING_RESOURCES[id] },
    personality: randomPersonality(id),
    researchedTechs: [],
    currentResearch: null,
    spyCount: id === 'freecities' ? 3 : 1,
    isDefeated: false,
  };
}
