import { GameEvent, FactionId } from '@/types';

let eventIdCounter = 0;

export interface EventTemplate {
  name: string;
  description: string;
  type: 'global' | 'faction' | 'territory';
  choices: Array<{
    label: string;
    description: string;
    effects: Array<{
      type: 'resources' | 'relations' | 'unrest' | 'troops' | 'tech' | 'spy' | 'territory';
      target?: string;
      value: number;
      field?: string;
    }>;
  }>;
}

export const EVENT_TEMPLATES: EventTemplate[] = [
  {
    name: 'Global Market Crash',
    description: 'Financial contagion spreads across global markets. Trading algorithms cascade into panic selling. All factions face severe economic disruption.',
    type: 'global',
    choices: [
      { label: 'Implement Austerity', description: 'Cut spending to weather the storm. Lose 30% income this turn but stabilize faster.', effects: [{ type: 'resources', value: -0.3, field: 'credits' }] },
      { label: 'Stimulus Spending', description: 'Spend reserves to maintain operations. Costs 100 credits but prevents unrest increase.', effects: [{ type: 'resources', value: -100, field: 'credits' }] },
    ],
  },
  {
    name: 'Pandemic Outbreak',
    description: 'A new pathogen has been detected spreading rapidly through population centers. Medical infrastructure is strained to breaking point.',
    type: 'global',
    choices: [
      { label: 'Quarantine', description: 'Lock down affected territories. -1 action this turn but contain the spread.', effects: [{ type: 'resources', value: -20, field: 'manpower' }] },
      { label: 'Maintain Operations', description: 'Keep borders open. Risk spreading but maintain productivity.', effects: [{ type: 'unrest', value: 15 }] },
    ],
  },
  {
    name: 'UN Emergency Summit',
    description: 'The remnants of the United Nations call an emergency session. A resolution is proposed that could reshape the balance of power.',
    type: 'global',
    choices: [
      { label: 'Support Resolution', description: 'Back the proposal. Gain influence with moderate factions.', effects: [{ type: 'resources', value: 20, field: 'influence' }] },
      { label: 'Block Resolution', description: 'Use your veto. Maintain freedom of action but damage reputation.', effects: [{ type: 'resources', value: -10, field: 'influence' }] },
      { label: 'Abstain', description: 'Stay neutral. No gains, no losses. The safe play.', effects: [] },
    ],
  },
  {
    name: 'Resource Discovery',
    description: 'Satellite imagery reveals a massive deposit of rare earth minerals in contested territory. Every faction is mobilizing to claim it.',
    type: 'global',
    choices: [
      { label: 'Rush to Claim', description: 'Spend resources to secure the deposit. -50 credits, +15 rare materials.', effects: [{ type: 'resources', value: -50, field: 'credits' }, { type: 'resources', value: 15, field: 'rareMaterials' }] },
      { label: 'Negotiate Access', description: 'Diplomatic approach. Costs influence but safer. +8 rare materials.', effects: [{ type: 'resources', value: -15, field: 'influence' }, { type: 'resources', value: 8, field: 'rareMaterials' }] },
    ],
  },
  {
    name: 'Whistleblower Leak',
    description: 'A deep-cover operative has been exposed by a data leak. Encrypted files are spreading across the darknet. Cover identities are compromised.',
    type: 'faction',
    choices: [
      { label: 'Damage Control', description: 'Pull the operative out. Lose 1 spy action but save the agent.', effects: [{ type: 'resources', value: -15, field: 'influence' }] },
      { label: 'Deny Everything', description: 'Risk the operative. 50% chance they survive. Relations damage either way.', effects: [{ type: 'relations', value: -10 }] },
    ],
  },
  {
    name: 'Climate Catastrophe',
    description: 'Unprecedented storms and flooding devastate a coastal region. Infrastructure collapses. Millions displaced. The world watches.',
    type: 'territory',
    choices: [
      { label: 'Send Aid', description: 'Commit resources to relief. -40 credits but +15 influence and reduced unrest.', effects: [{ type: 'resources', value: -40, field: 'credits' }, { type: 'resources', value: 15, field: 'influence' }] },
      { label: 'Focus Inward', description: 'Prioritize your own territories. Save credits but world opinion sours.', effects: [{ type: 'resources', value: -5, field: 'influence' }] },
    ],
  },
  {
    name: 'Arms Dealer',
    description: 'A neutral weapons broker surfaces with advanced military hardware. First come, first served. The asking price is steep.',
    type: 'global',
    choices: [
      { label: 'Buy the Arsenal', description: 'Pay 120 credits for advanced weapons. +10 troops in your capital.', effects: [{ type: 'resources', value: -120, field: 'credits' }, { type: 'troops', value: 10 }] },
      { label: 'Pass', description: 'Let someone else take the bait. Another faction may grow stronger.', effects: [] },
    ],
  },
  {
    name: 'Coup Attempt',
    description: 'Internal dissent boils over. Military officers within your ranks are plotting to seize power. Your intelligence services detected it just in time.',
    type: 'faction',
    choices: [
      { label: 'Purge the Plotters', description: 'Arrest conspirators. Costs 20 influence but secures stability.', effects: [{ type: 'resources', value: -20, field: 'influence' }, { type: 'unrest', value: -20 }] },
      { label: 'Negotiate', description: 'Address their grievances. Costs credits but builds loyalty.', effects: [{ type: 'resources', value: -60, field: 'credits' }, { type: 'unrest', value: -30 }] },
    ],
  },
  {
    name: 'Tech Breakthrough',
    description: 'Your research labs report a major unexpected discovery. A new technology is within reach — faster than anticipated.',
    type: 'faction',
    choices: [
      { label: 'Fast-Track Research', description: 'Invest heavily. -30 tech points but gain a free research turn.', effects: [{ type: 'resources', value: -30, field: 'techPoints' }, { type: 'tech', value: 1 }] },
      { label: 'Publish Findings', description: 'Share openly. +20 influence as the world takes notice.', effects: [{ type: 'resources', value: 20, field: 'influence' }] },
    ],
  },
  {
    name: 'Proxy War Eruption',
    description: 'Two rival factions clash through proxy forces in a strategically vital neutral territory. The conflict threatens to destabilize the entire region.',
    type: 'global',
    choices: [
      { label: 'Intervene', description: 'Send troops to stabilize. -15 troops but +10 influence and potential territory.', effects: [{ type: 'troops', value: -15 }, { type: 'resources', value: 10, field: 'influence' }] },
      { label: 'Sell Weapons', description: 'Profit from the chaos. +50 credits but -10 influence.', effects: [{ type: 'resources', value: 50, field: 'credits' }, { type: 'resources', value: -10, field: 'influence' }] },
      { label: 'Stay Out', description: 'Diplomacy is the better part of valor.', effects: [] },
    ],
  },
  {
    name: 'Cyber Attack on Infrastructure',
    description: 'A sophisticated cyber attack targets critical infrastructure. Power grids flicker. Financial systems glitch. Attribution is unclear.',
    type: 'faction',
    choices: [
      { label: 'Retaliate', description: 'Launch counter-cyber operations. -20 tech points but may deter future attacks.', effects: [{ type: 'resources', value: -20, field: 'techPoints' }] },
      { label: 'Harden Defenses', description: 'Invest in cyber security. -40 credits but prevent future incidents.', effects: [{ type: 'resources', value: -40, field: 'credits' }] },
    ],
  },
  {
    name: 'Refugee Crisis',
    description: 'Millions flee from a destabilized region. Neighboring territories are overwhelmed. The displaced masses need somewhere to go.',
    type: 'global',
    choices: [
      { label: 'Open Borders', description: 'Accept refugees. +20 manpower but +15 unrest in border territories.', effects: [{ type: 'resources', value: 20, field: 'manpower' }, { type: 'unrest', value: 15 }] },
      { label: 'Close Borders', description: 'Protect stability. -10 influence but maintain order.', effects: [{ type: 'resources', value: -10, field: 'influence' }] },
    ],
  },
  {
    name: 'Energy Crisis',
    description: 'Oil pipelines sabotaged, solar farms offline, nuclear plants on emergency protocols. The world faces an energy shock.',
    type: 'global',
    choices: [
      { label: 'Emergency Rationing', description: 'Cut consumption. -20% income this turn but stable.', effects: [{ type: 'resources', value: -0.2, field: 'credits' }] },
      { label: 'Exploit the Crisis', description: 'Price-gouge energy markets. +80 credits but -15 relations globally.', effects: [{ type: 'resources', value: 80, field: 'credits' }, { type: 'relations', value: -15 }] },
    ],
  },
  {
    name: 'Space Station Incident',
    description: 'The international orbital station suffers a critical failure. Cooperation is needed for rescue, but the station holds valuable research data.',
    type: 'global',
    choices: [
      { label: 'Cooperate on Rescue', description: 'Joint effort. +10 relations with all factions. +15 tech points.', effects: [{ type: 'relations', value: 10 }, { type: 'resources', value: 15, field: 'techPoints' }] },
      { label: 'Salvage the Data', description: 'Grab the research. +30 tech points but -10 relations.', effects: [{ type: 'resources', value: 30, field: 'techPoints' }, { type: 'relations', value: -10 }] },
    ],
  },
  {
    name: 'Underground Resistance',
    description: 'A covert resistance movement in an enemy territory reaches out to your intelligence services. They want weapons and support.',
    type: 'faction',
    choices: [
      { label: 'Arm the Resistance', description: 'Supply weapons. -30 credits but increase unrest in a target enemy territory by 25.', effects: [{ type: 'resources', value: -30, field: 'credits' }, { type: 'unrest', value: 25 }] },
      { label: 'Decline', description: 'Too risky. Maintain plausible deniability.', effects: [] },
    ],
  },
  {
    name: 'Trade Route Disruption',
    description: 'Piracy and blockades threaten critical shipping lanes. International trade slows to a crawl.',
    type: 'global',
    choices: [
      { label: 'Naval Patrol', description: 'Deploy forces to secure lanes. -20 troops but maintain trade income.', effects: [{ type: 'troops', value: -5 }] },
      { label: 'Reroute Trade', description: 'Find alternative routes. -20% trade income this turn.', effects: [{ type: 'resources', value: -30, field: 'credits' }] },
    ],
  },
];

export function generateEvent(turn: number, playerFaction: FactionId): GameEvent {
  const template = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
  return {
    id: `event_${eventIdCounter++}`,
    name: template.name,
    description: template.description,
    turn,
    type: template.type,
    choices: template.choices.map((c, i) => ({
      id: `choice_${i}`,
      label: c.label,
      description: c.description,
      effects: c.effects,
    })),
    resolved: false,
    affectedFactions: template.type === 'global' ? undefined : [playerFaction],
  };
}
