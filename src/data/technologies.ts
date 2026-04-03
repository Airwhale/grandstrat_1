import { Technology } from '@/types';

export const TECHNOLOGIES: Technology[] = [
  // MILITARY BRANCH
  { id: 'mil_t1_firearms', name: 'Improved Firearms', description: '+10% squad damage in tactical combat', branch: 'military', tier: 1, cost: 40, turnsToResearch: 1, prerequisites: [], effects: { damageBonus: 0.1 } },
  { id: 'mil_t1_armor', name: 'Body Armor', description: '+1 HP to all operatives', branch: 'military', tier: 1, cost: 40, turnsToResearch: 1, prerequisites: [], effects: { hpBonus: 1 } },
  { id: 'mil_t2_drones', name: 'Drone Recon', description: 'Reveals 3 extra tiles in tactical combat', branch: 'military', tier: 2, cost: 80, turnsToResearch: 2, prerequisites: ['mil_t1_firearms'], effects: { visionBonus: 3 } },
  { id: 'mil_t2_exo', name: 'Exo-Suits', description: '+1 movement to heavy units', branch: 'military', tier: 2, cost: 80, turnsToResearch: 2, prerequisites: ['mil_t1_armor'], effects: { mobilityBonusHeavy: 1 } },
  { id: 'mil_t3_railgun', name: 'Railgun Weapons', description: '+20% damage, ignores 1 armor', branch: 'military', tier: 3, cost: 150, turnsToResearch: 2, prerequisites: ['mil_t2_drones'], effects: { damageBonus: 0.2, armorPierce: 1 } },
  { id: 'mil_t3_stealth', name: 'Stealth Field', description: 'First attack from concealment is guaranteed crit', branch: 'military', tier: 3, cost: 150, turnsToResearch: 2, prerequisites: ['mil_t2_exo'], effects: { stealthCrit: 1 } },
  { id: 'mil_t4_orbital', name: 'Orbital Strike', description: 'Once per tactical mission, devastate a 3x3 area', branch: 'military', tier: 4, cost: 300, turnsToResearch: 3, prerequisites: ['mil_t3_railgun', 'mil_t3_stealth'], effects: { orbitalStrike: 1 } },

  // ECONOMIC BRANCH
  { id: 'eco_t1_markets', name: 'Efficient Markets', description: '+15% credit income', branch: 'economic', tier: 1, cost: 40, turnsToResearch: 1, prerequisites: [], effects: { incomeBonus: 0.15 } },
  { id: 'eco_t1_logistics', name: 'Logistics Network', description: 'Troops move +1 territory per turn', branch: 'economic', tier: 1, cost: 40, turnsToResearch: 1, prerequisites: [], effects: { movementBonus: 1 } },
  { id: 'eco_t2_rareearth', name: 'Rare Earth Processing', description: '+25% rare materials output', branch: 'economic', tier: 2, cost: 80, turnsToResearch: 2, prerequisites: ['eco_t1_markets'], effects: { rareMaterialsBonus: 0.25 } },
  { id: 'eco_t2_factories', name: 'Automated Factories', description: 'Buildings cost -20%', branch: 'economic', tier: 2, cost: 80, turnsToResearch: 2, prerequisites: ['eco_t1_logistics'], effects: { buildCostReduction: 0.2 } },
  { id: 'eco_t3_quantum', name: 'Quantum Trading', description: '+30% trade route income', branch: 'economic', tier: 3, cost: 150, turnsToResearch: 2, prerequisites: ['eco_t2_rareearth'], effects: { tradeBonus: 0.3 } },
  { id: 'eco_t3_mega', name: 'Megastructures', description: 'Unlock Tier 3 buildings', branch: 'economic', tier: 3, cost: 150, turnsToResearch: 2, prerequisites: ['eco_t2_factories'], effects: { tier3Buildings: 1 } },
  { id: 'eco_t4_hegemony', name: 'Economic Hegemony', description: 'Crash one enemy economy — halves income for 3 turns', branch: 'economic', tier: 4, cost: 300, turnsToResearch: 3, prerequisites: ['eco_t3_quantum', 'eco_t3_mega'], effects: { economicCrash: 1 } },

  // INTELLIGENCE BRANCH
  { id: 'int_t1_signal', name: 'Signal Intercept', description: 'See enemy army sizes', branch: 'intelligence', tier: 1, cost: 40, turnsToResearch: 1, prerequisites: [], effects: { seeArmySizes: 1 } },
  { id: 'int_t1_training', name: 'Enhanced Training', description: 'Operatives gain XP 20% faster', branch: 'intelligence', tier: 1, cost: 40, turnsToResearch: 1, prerequisites: [], effects: { xpBonus: 0.2 } },
  { id: 'int_t2_deepcover', name: 'Deep Cover', description: 'Spy detection chance -15%', branch: 'intelligence', tier: 2, cost: 80, turnsToResearch: 2, prerequisites: ['int_t1_signal'], effects: { spyDetectionReduction: 0.15 } },
  { id: 'int_t2_predictive', name: 'Predictive Analysis', description: 'See AI faction intended actions 1 turn ahead', branch: 'intelligence', tier: 2, cost: 80, turnsToResearch: 2, prerequisites: ['int_t1_training'], effects: { predictiveAnalysis: 1 } },
  { id: 'int_t3_cyber', name: 'Cyber Warfare', description: 'Disable enemy buildings for 2 turns remotely', branch: 'intelligence', tier: 3, cost: 150, turnsToResearch: 2, prerequisites: ['int_t2_deepcover'], effects: { cyberWarfare: 1 } },
  { id: 'int_t3_neural', name: 'Neural Uplink', description: '+1 action point per operative in tactical combat', branch: 'intelligence', tier: 3, cost: 150, turnsToResearch: 2, prerequisites: ['int_t2_predictive'], effects: { bonusActions: 1 } },
  { id: 'int_t4_shadow', name: 'Shadow Network', description: 'All spy actions -25% detection. 2 actions per spy per turn.', branch: 'intelligence', tier: 4, cost: 300, turnsToResearch: 3, prerequisites: ['int_t3_cyber', 'int_t3_neural'], effects: { shadowNetwork: 1 } },
];

export function getTechById(id: string): Technology | undefined {
  return TECHNOLOGIES.find(t => t.id === id);
}

export function getAvailableTechs(researched: string[]): Technology[] {
  return TECHNOLOGIES.filter(t =>
    !researched.includes(t.id) &&
    t.prerequisites.every(p => researched.includes(p))
  );
}
