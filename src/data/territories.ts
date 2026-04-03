import { Territory, FactionId, TerrainType } from '@/types';

interface TerritoryDef {
  id: string;
  name: string;
  controller: FactionId | null;
  troops: number;
  terrain: TerrainType;
  position: { x: number; y: number };
  region: string;
  adjacency: string[];
  baseIncome: number;
  hasRareMaterials: boolean;
}

const TERRITORY_DEFS: TerritoryDef[] = [
  // North America
  { id: 'eastern_us', name: 'Eastern United States', controller: 'atlantic', troops: 25, terrain: 'urban', position: { x: 22, y: 35 }, region: 'North America', adjacency: ['western_us', 'canada', 'mexico', 'caribbean'], baseIncome: 40, hasRareMaterials: false },
  { id: 'western_us', name: 'Western United States', controller: 'atlantic', troops: 20, terrain: 'mountain', position: { x: 14, y: 33 }, region: 'North America', adjacency: ['eastern_us', 'canada', 'mexico'], baseIncome: 35, hasRareMaterials: false },
  { id: 'canada', name: 'Canada', controller: 'atlantic', troops: 15, terrain: 'arctic', position: { x: 18, y: 22 }, region: 'North America', adjacency: ['eastern_us', 'western_us'], baseIncome: 25, hasRareMaterials: true },
  { id: 'mexico', name: 'Mexico & Central America', controller: null, troops: 10, terrain: 'jungle', position: { x: 16, y: 43 }, region: 'North America', adjacency: ['eastern_us', 'western_us', 'caribbean', 'colombia'], baseIncome: 15, hasRareMaterials: false },
  { id: 'caribbean', name: 'Caribbean', controller: 'atlantic', troops: 8, terrain: 'coastal', position: { x: 24, y: 44 }, region: 'North America', adjacency: ['eastern_us', 'mexico', 'colombia', 'brazil'], baseIncome: 10, hasRareMaterials: false },

  // South America
  { id: 'colombia', name: 'Colombia & Venezuela', controller: null, troops: 10, terrain: 'jungle', position: { x: 25, y: 52 }, region: 'South America', adjacency: ['caribbean', 'mexico', 'brazil', 'andes'], baseIncome: 15, hasRareMaterials: false },
  { id: 'brazil', name: 'Brazil', controller: 'southern', troops: 18, terrain: 'jungle', position: { x: 30, y: 60 }, region: 'South America', adjacency: ['caribbean', 'colombia', 'andes', 'southern_cone'], baseIncome: 25, hasRareMaterials: true },
  { id: 'andes', name: 'Andes Region', controller: 'southern', troops: 12, terrain: 'mountain', position: { x: 24, y: 63 }, region: 'South America', adjacency: ['colombia', 'brazil', 'southern_cone'], baseIncome: 15, hasRareMaterials: true },
  { id: 'southern_cone', name: 'Southern Cone', controller: null, troops: 8, terrain: 'coastal', position: { x: 28, y: 72 }, region: 'South America', adjacency: ['brazil', 'andes'], baseIncome: 15, hasRareMaterials: false },

  // Western Europe
  { id: 'uk_ireland', name: 'United Kingdom & Ireland', controller: 'atlantic', troops: 18, terrain: 'urban', position: { x: 46, y: 27 }, region: 'Western Europe', adjacency: ['france', 'scandinavia', 'eastern_us'], baseIncome: 30, hasRareMaterials: false },
  { id: 'france', name: 'France & Benelux', controller: 'atlantic', troops: 15, terrain: 'urban', position: { x: 48, y: 33 }, region: 'Western Europe', adjacency: ['uk_ireland', 'iberia', 'germany', 'italy'], baseIncome: 30, hasRareMaterials: false },
  { id: 'iberia', name: 'Iberia', controller: null, troops: 10, terrain: 'coastal', position: { x: 45, y: 38 }, region: 'Western Europe', adjacency: ['france', 'maghreb'], baseIncome: 20, hasRareMaterials: false },
  { id: 'germany', name: 'Germany & Alps', controller: null, troops: 12, terrain: 'urban', position: { x: 51, y: 31 }, region: 'Western Europe', adjacency: ['france', 'scandinavia', 'poland', 'italy', 'balkans'], baseIncome: 30, hasRareMaterials: false },
  { id: 'italy', name: 'Italy', controller: null, troops: 10, terrain: 'coastal', position: { x: 52, y: 37 }, region: 'Western Europe', adjacency: ['france', 'germany', 'balkans', 'maghreb'], baseIncome: 22, hasRareMaterials: false },
  { id: 'scandinavia', name: 'Scandinavia', controller: null, troops: 10, terrain: 'arctic', position: { x: 52, y: 22 }, region: 'Western Europe', adjacency: ['uk_ireland', 'germany', 'poland', 'western_russia'], baseIncome: 22, hasRareMaterials: false },

  // Eastern Europe
  { id: 'poland', name: 'Poland & Baltics', controller: null, troops: 12, terrain: 'urban', position: { x: 55, y: 28 }, region: 'Eastern Europe', adjacency: ['germany', 'scandinavia', 'ukraine', 'western_russia', 'balkans'], baseIncome: 18, hasRareMaterials: false },
  { id: 'balkans', name: 'Balkans', controller: null, troops: 10, terrain: 'mountain', position: { x: 55, y: 36 }, region: 'Eastern Europe', adjacency: ['germany', 'italy', 'poland', 'ukraine', 'turkey'], baseIncome: 15, hasRareMaterials: false },
  { id: 'ukraine', name: 'Ukraine', controller: 'eastern', troops: 20, terrain: 'urban', position: { x: 58, y: 30 }, region: 'Eastern Europe', adjacency: ['poland', 'balkans', 'western_russia', 'caucasus', 'turkey'], baseIncome: 18, hasRareMaterials: false },
  { id: 'turkey', name: 'Turkey', controller: null, troops: 14, terrain: 'mountain', position: { x: 58, y: 38 }, region: 'Eastern Europe', adjacency: ['balkans', 'ukraine', 'caucasus', 'fertile_crescent'], baseIncome: 20, hasRareMaterials: false },

  // Russia & Central Asia
  { id: 'western_russia', name: 'Western Russia', controller: 'eastern', troops: 30, terrain: 'urban', position: { x: 62, y: 24 }, region: 'Russia', adjacency: ['scandinavia', 'poland', 'ukraine', 'caucasus', 'central_asia', 'siberia'], baseIncome: 28, hasRareMaterials: false },
  { id: 'siberia', name: 'Siberia', controller: 'eastern', troops: 15, terrain: 'arctic', position: { x: 75, y: 18 }, region: 'Russia', adjacency: ['western_russia', 'central_asia', 'china_interior', 'korea'], baseIncome: 12, hasRareMaterials: true },
  { id: 'central_asia', name: 'Central Asia', controller: 'eastern', troops: 12, terrain: 'desert', position: { x: 68, y: 32 }, region: 'Russia', adjacency: ['western_russia', 'siberia', 'caucasus', 'iran', 'pakistan', 'china_interior'], baseIncome: 12, hasRareMaterials: true },
  { id: 'caucasus', name: 'Caucasus', controller: 'eastern', troops: 15, terrain: 'mountain', position: { x: 62, y: 33 }, region: 'Russia', adjacency: ['ukraine', 'western_russia', 'central_asia', 'turkey', 'iran'], baseIncome: 14, hasRareMaterials: false },

  // Middle East
  { id: 'arabian', name: 'Arabian Peninsula', controller: 'solar', troops: 15, terrain: 'desert', position: { x: 62, y: 44 }, region: 'Middle East', adjacency: ['fertile_crescent', 'iran', 'egypt', 'east_africa'], baseIncome: 30, hasRareMaterials: false },
  { id: 'fertile_crescent', name: 'Fertile Crescent', controller: 'solar', troops: 14, terrain: 'desert', position: { x: 59, y: 40 }, region: 'Middle East', adjacency: ['turkey', 'arabian', 'iran', 'egypt'], baseIncome: 18, hasRareMaterials: false },
  { id: 'iran', name: 'Iran', controller: 'solar', troops: 18, terrain: 'mountain', position: { x: 65, y: 37 }, region: 'Middle East', adjacency: ['caucasus', 'central_asia', 'fertile_crescent', 'arabian', 'pakistan'], baseIncome: 22, hasRareMaterials: false },

  // North Africa
  { id: 'maghreb', name: 'Maghreb', controller: null, troops: 10, terrain: 'desert', position: { x: 48, y: 42 }, region: 'North Africa', adjacency: ['iberia', 'italy', 'egypt', 'west_africa'], baseIncome: 14, hasRareMaterials: false },
  { id: 'egypt', name: 'Egypt & Libya', controller: 'solar', troops: 14, terrain: 'desert', position: { x: 55, y: 43 }, region: 'North Africa', adjacency: ['maghreb', 'fertile_crescent', 'arabian', 'east_africa', 'central_africa'], baseIncome: 18, hasRareMaterials: false },

  // Sub-Saharan Africa
  { id: 'west_africa', name: 'West Africa', controller: 'southern', troops: 14, terrain: 'jungle', position: { x: 46, y: 52 }, region: 'Sub-Saharan Africa', adjacency: ['maghreb', 'central_africa'], baseIncome: 15, hasRareMaterials: true },
  { id: 'east_africa', name: 'East Africa', controller: 'southern', troops: 12, terrain: 'jungle', position: { x: 58, y: 55 }, region: 'Sub-Saharan Africa', adjacency: ['egypt', 'arabian', 'central_africa', 'southern_africa'], baseIncome: 14, hasRareMaterials: false },
  { id: 'central_africa', name: 'Central Africa', controller: 'southern', troops: 10, terrain: 'jungle', position: { x: 53, y: 56 }, region: 'Sub-Saharan Africa', adjacency: ['west_africa', 'east_africa', 'egypt', 'southern_africa'], baseIncome: 12, hasRareMaterials: true },
  { id: 'southern_africa', name: 'Southern Africa', controller: 'southern', troops: 14, terrain: 'coastal', position: { x: 55, y: 66 }, region: 'Sub-Saharan Africa', adjacency: ['central_africa', 'east_africa'], baseIncome: 18, hasRareMaterials: true },

  // South Asia
  { id: 'india', name: 'India', controller: 'solar', troops: 25, terrain: 'jungle', position: { x: 70, y: 44 }, region: 'South Asia', adjacency: ['pakistan', 'bangladesh', 'iran', 'china_interior'], baseIncome: 28, hasRareMaterials: false },
  { id: 'pakistan', name: 'Pakistan & Afghanistan', controller: 'solar', troops: 15, terrain: 'mountain', position: { x: 68, y: 38 }, region: 'South Asia', adjacency: ['iran', 'central_asia', 'india', 'china_interior'], baseIncome: 14, hasRareMaterials: false },
  { id: 'bangladesh', name: 'Bangladesh & Myanmar', controller: null, troops: 8, terrain: 'jungle', position: { x: 74, y: 44 }, region: 'South Asia', adjacency: ['india', 'indochina', 'china_interior'], baseIncome: 12, hasRareMaterials: false },

  // East Asia
  { id: 'china_coast', name: 'China Coast', controller: 'jade', troops: 25, terrain: 'urban', position: { x: 80, y: 36 }, region: 'East Asia', adjacency: ['china_interior', 'korea', 'indochina', 'philippines', 'hong_kong'], baseIncome: 40, hasRareMaterials: false },
  { id: 'china_interior', name: 'China Interior', controller: 'jade', troops: 20, terrain: 'mountain', position: { x: 76, y: 34 }, region: 'East Asia', adjacency: ['china_coast', 'central_asia', 'siberia', 'india', 'pakistan', 'bangladesh', 'korea'], baseIncome: 22, hasRareMaterials: true },
  { id: 'korea', name: 'Korea', controller: 'jade', troops: 15, terrain: 'urban', position: { x: 84, y: 32 }, region: 'East Asia', adjacency: ['china_coast', 'china_interior', 'siberia', 'japan'], baseIncome: 25, hasRareMaterials: false },
  { id: 'japan', name: 'Japan', controller: null, troops: 12, terrain: 'coastal', position: { x: 88, y: 32 }, region: 'East Asia', adjacency: ['korea'], baseIncome: 30, hasRareMaterials: false },

  // Southeast Asia
  { id: 'indochina', name: 'Indochina', controller: 'jade', troops: 12, terrain: 'jungle', position: { x: 78, y: 46 }, region: 'Southeast Asia', adjacency: ['china_coast', 'bangladesh', 'indonesia', 'singapore'], baseIncome: 16, hasRareMaterials: false },
  { id: 'indonesia', name: 'Indonesia & Malaysia', controller: null, troops: 10, terrain: 'jungle', position: { x: 80, y: 56 }, region: 'Southeast Asia', adjacency: ['indochina', 'singapore', 'philippines', 'australia'], baseIncome: 18, hasRareMaterials: true },
  { id: 'philippines', name: 'Philippines', controller: null, troops: 8, terrain: 'coastal', position: { x: 85, y: 48 }, region: 'Southeast Asia', adjacency: ['china_coast', 'indonesia', 'pacific'], baseIncome: 12, hasRareMaterials: false },

  // Oceania
  { id: 'australia', name: 'Australia', controller: null, troops: 12, terrain: 'desert', position: { x: 85, y: 68 }, region: 'Oceania', adjacency: ['indonesia', 'new_zealand', 'pacific'], baseIncome: 22, hasRareMaterials: true },
  { id: 'new_zealand', name: 'New Zealand', controller: null, troops: 6, terrain: 'coastal', position: { x: 92, y: 74 }, region: 'Oceania', adjacency: ['australia', 'pacific'], baseIncome: 12, hasRareMaterials: false },
  { id: 'pacific', name: 'Pacific Islands', controller: null, troops: 4, terrain: 'coastal', position: { x: 92, y: 55 }, region: 'Oceania', adjacency: ['philippines', 'australia', 'new_zealand'], baseIncome: 6, hasRareMaterials: false },

  // City-States
  { id: 'singapore', name: 'Singapore', controller: 'freecities', troops: 5, terrain: 'urban', position: { x: 79, y: 53 }, region: 'City-States', adjacency: ['indochina', 'indonesia'], baseIncome: 45, hasRareMaterials: false },
  { id: 'dubai', name: 'Dubai', controller: 'freecities', troops: 5, terrain: 'desert', position: { x: 64, y: 41 }, region: 'City-States', adjacency: ['arabian', 'iran'], baseIncome: 45, hasRareMaterials: false },
  { id: 'geneva', name: 'Geneva', controller: 'freecities', troops: 5, terrain: 'urban', position: { x: 50, y: 33 }, region: 'City-States', adjacency: ['france', 'germany', 'italy'], baseIncome: 45, hasRareMaterials: false },
  { id: 'hong_kong', name: 'Hong Kong', controller: 'freecities', troops: 5, terrain: 'urban', position: { x: 82, y: 42 }, region: 'City-States', adjacency: ['china_coast', 'indochina'], baseIncome: 45, hasRareMaterials: false },
  { id: 'zurich', name: 'Zurich', controller: 'freecities', troops: 5, terrain: 'urban', position: { x: 51, y: 32 }, region: 'City-States', adjacency: ['germany', 'france', 'italy'], baseIncome: 45, hasRareMaterials: false },
  { id: 'monaco', name: 'Monaco', controller: 'freecities', troops: 5, terrain: 'coastal', position: { x: 49, y: 36 }, region: 'City-States', adjacency: ['france', 'italy'], baseIncome: 45, hasRareMaterials: false },
];

export function createTerritories(): Record<string, Territory> {
  const territories: Record<string, Territory> = {};
  for (const def of TERRITORY_DEFS) {
    territories[def.id] = {
      id: def.id,
      name: def.name,
      controller: def.controller,
      troops: def.troops,
      buildings: [],
      resources: { credits: def.baseIncome },
      unrest: def.controller ? Math.floor(Math.random() * 15) : Math.floor(Math.random() * 30 + 10),
      fortification: def.controller ? 1 : 0,
      adjacency: def.adjacency,
      terrain: def.terrain,
      position: def.position,
      region: def.region,
      hasRareMaterials: def.hasRareMaterials,
    };
  }
  return territories;
}

// Pre-built constant for store import — generates fresh each call (randomized unrest)
export const TERRITORIES = TERRITORY_DEFS;

export function getFactionsFromTerritories(territories: Record<string, Territory>): Record<FactionId, string[]> {
  const result: Record<FactionId, string[]> = {
    atlantic: [], eastern: [], jade: [], solar: [], southern: [], freecities: [],
  };
  for (const t of Object.values(territories)) {
    if (t.controller) {
      result[t.controller].push(t.id);
    }
  }
  return result;
}
