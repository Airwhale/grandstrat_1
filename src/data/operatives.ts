import { Operative, OperativeClass, FactionId, Ability } from '@/types';

const FIRST_NAMES_BY_FACTION: Record<FactionId, string[]> = {
  atlantic: ['James', 'Sarah', 'Michael', 'Emily', 'Robert', 'Catherine', 'William', 'Alexandra', 'Thomas', 'Victoria', 'Daniel', 'Rachel'],
  eastern: ['Dmitri', 'Natasha', 'Viktor', 'Yelena', 'Sergei', 'Katya', 'Andrei', 'Olga', 'Ivan', 'Svetlana', 'Boris', 'Marina'],
  jade: ['Wei', 'Mei', 'Chen', 'Lihua', 'Zhang', 'Yuki', 'Hiro', 'Min-Jun', 'Suki', 'Ryu', 'Kai', 'Lan'],
  solar: ['Arjun', 'Priya', 'Rashid', 'Fatima', 'Vikram', 'Zara', 'Omar', 'Leila', 'Ravi', 'Amara', 'Khalid', 'Noor'],
  southern: ['Kwame', 'Amara', 'Tendai', 'Ngozi', 'Kofi', 'Zinhle', 'Emeka', 'Nia', 'Chidi', 'Thandiwe', 'Rafael', 'Isabela'],
  freecities: ['Marcus', 'Elena', 'Sebastian', 'Yara', 'Felix', 'Astrid', 'Nikolai', 'Camille', 'Lukas', 'Sarina', 'Dante', 'Freya'],
};

const LAST_NAMES_BY_FACTION: Record<FactionId, string[]> = {
  atlantic: ['Anderson', 'Brooks', 'Clarke', 'Davis', 'Foster', 'Hayes', 'Mitchell', 'Parker', 'Reynolds', 'Shaw', 'Turner', 'Walsh'],
  eastern: ['Volkov', 'Petrov', 'Kozlov', 'Sokolov', 'Morozov', 'Federov', 'Kuznetsov', 'Ivanov', 'Popov', 'Smirnov', 'Lebedev', 'Orlov'],
  jade: ['Wang', 'Li', 'Zhang', 'Chen', 'Liu', 'Tanaka', 'Yamamoto', 'Kim', 'Park', 'Nguyen', 'Huang', 'Lin'],
  solar: ['Patel', 'Singh', 'Al-Rashid', 'Khan', 'Sharma', 'Al-Farsi', 'Kapoor', 'Hassan', 'Nair', 'Qureshi', 'Chopra', 'Malik'],
  southern: ['Okafor', 'Mensah', 'Moyo', 'Nkosi', 'Adeyemi', 'Dlamini', 'Osei', 'Khumalo', 'Silva', 'Santos', 'Costa', 'Oliveira'],
  freecities: ['Richter', 'Voss', 'Laurent', 'Sterling', 'Crane', 'Delacroix', 'Bergmann', 'Castellani', 'Lindqvist', 'Ashworth', 'Moreau', 'Harding'],
};

const CALLSIGNS = [
  'Specter', 'Viper', 'Phoenix', 'Shadow', 'Hawk', 'Frost', 'Thunder', 'Ghost',
  'Raven', 'Storm', 'Blade', 'Wraith', 'Cobra', 'Reaper', 'Wolf', 'Eclipse',
  'Titan', 'Cipher', 'Nomad', 'Oracle', 'Scarab', 'Tempest', 'Valkyrie', 'Zenith',
  'Apex', 'Basilisk', 'Corsair', 'Dagger', 'Ember', 'Fury', 'Granite', 'Hydra',
];

let operativeIdCounter = 0;
let usedCallsigns = new Set<string>();

export function resetOperativeGenerator() {
  operativeIdCounter = 0;
  usedCallsigns = new Set();
}

const CLASS_STATS: Record<OperativeClass, { hp: number; armor: number; aim: number; mobility: number; will: number; weaponDamage: number }> = {
  assault: { hp: 8, armor: 0, aim: 5, mobility: 6, will: 50, weaponDamage: 4 },
  sharpshooter: { hp: 6, armor: 0, aim: 15, mobility: 4, will: 55, weaponDamage: 5 },
  heavy: { hp: 10, armor: 1, aim: 0, mobility: 4, will: 60, weaponDamage: 4 },
  medic: { hp: 7, armor: 0, aim: 5, mobility: 5, will: 65, weaponDamage: 3 },
  infiltrator: { hp: 6, armor: 0, aim: 10, mobility: 6, will: 45, weaponDamage: 4 },
  specialist: { hp: 7, armor: 0, aim: 5, mobility: 5, will: 55, weaponDamage: 3 },
  cyberGhost: { hp: 6, armor: 0, aim: 10, mobility: 5, will: 50, weaponDamage: 3 },
  spetsnazVanguard: { hp: 11, armor: 2, aim: 5, mobility: 4, will: 70, weaponDamage: 5 },
  silkAgent: { hp: 6, armor: 0, aim: 5, mobility: 5, will: 60, weaponDamage: 3 },
  sufiPhantom: { hp: 7, armor: 0, aim: 10, mobility: 6, will: 55, weaponDamage: 4 },
  bushveldRanger: { hp: 7, armor: 0, aim: 15, mobility: 5, will: 50, weaponDamage: 5 },
  ghostBroker: { hp: 6, armor: 0, aim: 10, mobility: 5, will: 55, weaponDamage: 3 },
};

const CLASS_ABILITIES: Record<OperativeClass, string[]> = {
  assault: ['runAndGun', 'shotgunBlast'],
  sharpshooter: ['squadsight', 'headshot', 'overwatch'],
  heavy: ['suppress', 'rocketLauncher', 'hunkerDown'],
  medic: ['heal', 'combatStim', 'revive'],
  infiltrator: ['cloak', 'sabotage', 'ambush'],
  specialist: ['deployDrone', 'hack', 'empGrenade'],
  cyberGhost: ['hackDefenses', 'cloak', 'empGrenade'],
  spetsnazVanguard: ['explosiveBreach', 'suppress', 'hunkerDown'],
  silkAgent: ['convertUnit', 'cloak', 'sabotage'],
  sufiPhantom: ['smokeBomb', 'hitAndRun', 'cloak'],
  bushveldRanger: ['setTrap', 'concealedShot', 'overwatch'],
  ghostBroker: ['bribe', 'concealedPistol', 'cloak'],
};

export const UNIQUE_UNIT_FOR_FACTION: Record<FactionId, OperativeClass> = {
  atlantic: 'cyberGhost',
  eastern: 'spetsnazVanguard',
  jade: 'silkAgent',
  solar: 'sufiPhantom',
  southern: 'bushveldRanger',
  freecities: 'ghostBroker',
};

export const ABILITIES: Record<string, Ability> = {
  runAndGun: { id: 'runAndGun', name: 'Run & Gun', description: 'Move full distance and still attack this turn', apCost: 0, cooldown: 3, effectType: 'movement' },
  shotgunBlast: { id: 'shotgunBlast', name: 'Shotgun Blast', description: 'Cone attack dealing damage to all enemies in a 2-tile cone', apCost: 1, cooldown: 2, damage: 5, range: 3, effectType: 'damage' },
  squadsight: { id: 'squadsight', name: 'Squadsight', description: 'Shoot any enemy any ally can see', apCost: 1, cooldown: 0, effectType: 'special' },
  headshot: { id: 'headshot', name: 'Headshot', description: '+40% crit chance, costs both actions', apCost: 2, cooldown: 2, effectType: 'damage' },
  overwatch: { id: 'overwatch', name: 'Overwatch', description: 'Reaction shot at the first enemy that moves in sight', apCost: 2, cooldown: 0, effectType: 'special' },
  suppress: { id: 'suppress', name: 'Suppress', description: 'Pin enemy: -50 aim for them until next turn', apCost: 2, cooldown: 0, effectType: 'debuff' },
  rocketLauncher: { id: 'rocketLauncher', name: 'Rocket Launcher', description: '3x3 area damage, 1 use per mission', apCost: 1, cooldown: 99, damage: 6, range: 8, aoeRadius: 1, effectType: 'damage' },
  hunkerDown: { id: 'hunkerDown', name: 'Hunker Down', description: 'Double cover bonus, cannot act', apCost: 2, cooldown: 0, effectType: 'buff' },
  heal: { id: 'heal', name: 'Heal', description: 'Restore 4 HP to adjacent ally (2 uses per mission)', apCost: 1, cooldown: 0, effectType: 'heal', range: 1 },
  combatStim: { id: 'combatStim', name: 'Combat Stim', description: '+20 aim and +2 mobility to an ally for 2 turns', apCost: 1, cooldown: 3, range: 1, effectType: 'buff' },
  revive: { id: 'revive', name: 'Revive', description: 'Stabilize a downed operative', apCost: 1, cooldown: 0, range: 1, effectType: 'heal' },
  cloak: { id: 'cloak', name: 'Cloak', description: 'Become invisible for 2 turns. Breaks on attack.', apCost: 1, cooldown: 4, effectType: 'buff' },
  sabotage: { id: 'sabotage', name: 'Sabotage', description: 'Disable a mechanical enemy for 1 turn', apCost: 1, cooldown: 2, range: 3, effectType: 'debuff' },
  ambush: { id: 'ambush', name: 'Ambush', description: 'Attack from cloak = guaranteed crit', apCost: 1, cooldown: 0, effectType: 'damage' },
  deployDrone: { id: 'deployDrone', name: 'Deploy Drone', description: 'Mobile camera that reveals tiles', apCost: 1, cooldown: 4, effectType: 'special' },
  hack: { id: 'hack', name: 'Hack', description: 'Disable electronic cover/turrets (60% success)', apCost: 1, cooldown: 2, range: 5, effectType: 'special' },
  empGrenade: { id: 'empGrenade', name: 'EMP Grenade', description: 'Area disable + damage to mechs', apCost: 1, cooldown: 3, range: 5, aoeRadius: 1, damage: 3, effectType: 'damage' },
  hackDefenses: { id: 'hackDefenses', name: 'Hack Defenses', description: 'Disable enemy turrets/cover/overwatch for 2 turns', apCost: 1, cooldown: 3, range: 6, effectType: 'special' },
  explosiveBreach: { id: 'explosiveBreach', name: 'Explosive Breach', description: 'Destroy cover in a 2-tile radius', apCost: 1, cooldown: 3, range: 4, aoeRadius: 2, damage: 4, effectType: 'damage' },
  convertUnit: { id: 'convertUnit', name: 'Convert Unit', description: 'Convert one enemy to fight for you for 3 turns', apCost: 2, cooldown: 5, range: 4, effectType: 'special' },
  smokeBomb: { id: 'smokeBomb', name: 'Smoke Bomb', description: '3-tile smoke cloud providing concealment', apCost: 1, cooldown: 3, range: 5, aoeRadius: 1, effectType: 'buff' },
  hitAndRun: { id: 'hitAndRun', name: 'Hit & Run', description: 'Move after attacking', apCost: 0, cooldown: 2, effectType: 'movement' },
  setTrap: { id: 'setTrap', name: 'Set Trap', description: 'Place a proximity mine on a tile', apCost: 1, cooldown: 2, range: 1, damage: 5, effectType: 'damage' },
  concealedShot: { id: 'concealedShot', name: 'Concealed Shot', description: '+50% damage when firing from concealment', apCost: 1, cooldown: 0, effectType: 'damage' },
  bribe: { id: 'bribe', name: 'Bribe', description: 'Chance to convert enemy unit based on charisma vs loyalty', apCost: 2, cooldown: 4, range: 4, effectType: 'special' },
  concealedPistol: { id: 'concealedPistol', name: 'Concealed Pistol', description: 'Quick shot that ignores 1 armor', apCost: 1, cooldown: 0, damage: 3, range: 4, effectType: 'damage' },
};

export function generateOperative(faction: FactionId, opClass: OperativeClass, level: number = 1): Operative {
  const firstNames = FIRST_NAMES_BY_FACTION[faction];
  const lastNames = LAST_NAMES_BY_FACTION[faction];
  const stats = CLASS_STATS[opClass];

  const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;

  let callsign: string | null = null;
  if (level >= 3) {
    const available = CALLSIGNS.filter(c => !usedCallsigns.has(c));
    if (available.length > 0) {
      callsign = available[Math.floor(Math.random() * available.length)];
      usedCallsigns.add(callsign);
    }
  }

  const id = `op_${operativeIdCounter++}`;

  return {
    id,
    name,
    callsign,
    faction,
    class: opClass,
    level,
    xp: 0,
    xpToNext: 100 * level,
    hp: stats.hp + (level - 1),
    maxHp: stats.hp + (level - 1),
    armor: stats.armor,
    aim: stats.aim + (level - 1) * 2,
    mobility: stats.mobility,
    will: stats.will + (level - 1) * 3,
    actions: 2,
    status: 'active',
    woundedTurns: 0,
    missionsCompleted: 0,
    kills: 0,
    traits: [],
    bondedWith: null,
    bondLevel: 0,
    abilities: CLASS_ABILITIES[opClass],
  };
}

export function generateStartingRoster(faction: FactionId): Operative[] {
  const uniqueClass = UNIQUE_UNIT_FOR_FACTION[faction];
  const classes: OperativeClass[] = ['assault', 'sharpshooter', 'heavy', 'medic', 'infiltrator', 'specialist'];
  const roster: Operative[] = [];

  // 1 unique unit at level 2
  roster.push(generateOperative(faction, uniqueClass, 2));

  // 1 of each base class
  for (const cls of classes) {
    roster.push(generateOperative(faction, cls, 1));
  }

  // 2 random additional
  for (let i = 0; i < 2; i++) {
    const cls = classes[Math.floor(Math.random() * classes.length)];
    roster.push(generateOperative(faction, cls, 1));
  }

  return roster;
}
