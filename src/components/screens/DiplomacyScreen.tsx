'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { FACTION_COLORS, FACTION_NAMES } from '@/data/factions';
import type { FactionId, DiplomaticAction, Treaty } from '@/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FACTION_IDS: FactionId[] = [
  'atlantic',
  'eastern',
  'jade',
  'solar',
  'southern',
  'freecities',
];

interface DiplomaticOption {
  action: DiplomaticAction;
  label: string;
  cost: number;
}

const DIPLOMATIC_ACTIONS: DiplomaticOption[] = [
  { action: 'proposeTrade', label: 'Propose Trade', cost: 5 },
  { action: 'nonAggressionPact', label: 'Non-Aggression Pact', cost: 10 },
  { action: 'defensiveAlliance', label: 'Defensive Alliance', cost: 20 },
  { action: 'fullAlliance', label: 'Full Alliance', cost: 35 },
  { action: 'demandTribute', label: 'Demand Tribute', cost: 0 },
  { action: 'threaten', label: 'Threaten', cost: 0 },
  { action: 'denounce', label: 'Denounce', cost: 5 },
  { action: 'offerPeace', label: 'Offer Peace', cost: 10 },
];

const TREATY_LABELS: Record<string, string> = {
  trade: 'Trade Agreement',
  nonAggression: 'Non-Aggression Pact',
  defensiveAlliance: 'Defensive Alliance',
  fullAlliance: 'Full Alliance',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relationKey(a: FactionId, b: FactionId): string {
  return [a, b].sort().join('-');
}

function getRelationColor(value: number): string {
  if (value > 20) return '#22c55e';
  if (value > 0) return '#86efac';
  if (value === 0) return '#64748b';
  if (value > -20) return '#fca5a5';
  return '#ef4444';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DiplomacyScreen() {
  const setPhase = useGameStore((s) => s.setPhase);
  const factions = useGameStore((s) => s.factions);
  const diplomacy = useGameStore((s) => s.diplomacy);
  const playerFaction = useGameStore((s) => s.playerFaction);
  const handleDiplomacy = useGameStore((s) => (s as any).handleDiplomacy);
  const intelReports = useGameStore((s) => s.intelReports);

  const [selectedFaction, setSelectedFaction] = useState<FactionId | null>(null);

  const playerInfluence = playerFaction
    ? factions[playerFaction]?.resources.influence ?? 0
    : 0;

  // Hexagonal positions for the 6 faction nodes
  const hexPositions = useMemo(() => {
    const cx = 220;
    const cy = 220;
    const r = 155;
    const positions: Record<FactionId, { x: number; y: number }> = {} as any;
    FACTION_IDS.forEach((id, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      positions[id] = {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      };
    });
    return positions;
  }, []);

  // Edges between every pair of factions
  const edges = useMemo(() => {
    const result: Array<{ a: FactionId; b: FactionId; value: number }> = [];
    for (let i = 0; i < FACTION_IDS.length; i++) {
      for (let j = i + 1; j < FACTION_IDS.length; j++) {
        const a = FACTION_IDS[i];
        const b = FACTION_IDS[j];
        const key = relationKey(a, b);
        const value = diplomacy.relations[key] ?? 0;
        result.push({ a, b, value });
      }
    }
    return result;
  }, [diplomacy.relations]);

  // Treaties between player and selected faction
  const treatiesWithSelected = useMemo(() => {
    if (!playerFaction || !selectedFaction) return [];
    return diplomacy.treaties.filter(
      (t) =>
        t.factions.includes(playerFaction) &&
        t.factions.includes(selectedFaction),
    );
  }, [diplomacy.treaties, playerFaction, selectedFaction]);

  // War status with selected
  const atWarWithSelected = useMemo(() => {
    if (!playerFaction || !selectedFaction) return false;
    return diplomacy.wars.some(
      (w) =>
        (w.attacker === playerFaction && w.defender === selectedFaction) ||
        (w.attacker === selectedFaction && w.defender === playerFaction),
    );
  }, [diplomacy.wars, playerFaction, selectedFaction]);

  // Check if player has intel on the selected faction (for personality display)
  const hasIntelOnSelected = useMemo(() => {
    if (!selectedFaction) return false;
    return intelReports.some((r) => r.faction === selectedFaction);
  }, [intelReports, selectedFaction]);

  const selectedFactionData = selectedFaction ? factions[selectedFaction] : null;
  const relationWithPlayer =
    playerFaction && selectedFaction
      ? diplomacy.relations[relationKey(playerFaction, selectedFaction)] ?? 0
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: '#080c14' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-slate-800">
        <button
          onClick={() => setPhase('strategic')}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm tracking-wider uppercase"
        >
          <span className="text-lg">&larr;</span> Back
        </button>
        <h1
          className="text-2xl font-bold tracking-[0.3em] uppercase"
          style={{ color: '#e2e8f0', textShadow: '0 0 30px rgba(59,130,246,0.15)' }}
        >
          Diplomacy
        </h1>
        <div className="text-xs text-slate-600 tracking-wider">
          INFLUENCE: <span className="text-amber-400 font-bold">{playerInfluence}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Relationship Web */}
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <svg width={440} height={440} viewBox="0 0 440 440">
              {/* Edges between all pairs */}
              {edges.map(({ a, b, value }) => {
                const pa = hexPositions[a];
                const pb = hexPositions[b];
                const color = getRelationColor(value);
                const thickness = Math.max(1, Math.min(5, Math.abs(value) / 20 + 1));
                const midX = (pa.x + pb.x) / 2;
                const midY = (pa.y + pb.y) / 2;
                return (
                  <g key={`${a}-${b}`}>
                    <line
                      x1={pa.x}
                      y1={pa.y}
                      x2={pb.x}
                      y2={pb.y}
                      stroke={color}
                      strokeWidth={thickness}
                      strokeOpacity={0.45}
                    />
                    {/* Relation number label on each edge */}
                    <rect
                      x={midX - 12}
                      y={midY - 7}
                      width={24}
                      height={14}
                      rx={3}
                      fill="#0f172a"
                      fillOpacity={0.85}
                    />
                    <text
                      x={midX}
                      y={midY}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={color}
                      fontSize={9}
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {value > 0 ? `+${value}` : value}
                    </text>
                  </g>
                );
              })}

              {/* Faction Nodes */}
              {FACTION_IDS.map((id) => {
                const pos = hexPositions[id];
                const faction = factions[id];
                if (!faction) return null;
                const isPlayer = id === playerFaction;
                const isSelected = id === selectedFaction;
                const isDefeated = faction.isDefeated;
                const color = isDefeated ? '#334155' : FACTION_COLORS[id];

                return (
                  <g
                    key={id}
                    onClick={() => {
                      if (id !== playerFaction) setSelectedFaction(id);
                    }}
                    className={id !== playerFaction ? 'cursor-pointer' : ''}
                  >
                    {/* Glow for player node */}
                    {isPlayer && (
                      <>
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={42}
                          fill="none"
                          stroke={color}
                          strokeWidth={1}
                          opacity={0.2}
                        />
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r={38}
                          fill="none"
                          stroke={color}
                          strokeWidth={2}
                          opacity={0.35}
                        />
                      </>
                    )}

                    {/* Selection ring */}
                    {isSelected && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={38}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth={2}
                        strokeDasharray="5 3"
                        opacity={0.7}
                      >
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          from={`0 ${pos.x} ${pos.y}`}
                          to={`360 ${pos.x} ${pos.y}`}
                          dur="20s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}

                    {/* Main node circle */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={32}
                      fill={isDefeated ? '#1e293b' : `${color}22`}
                      stroke={color}
                      strokeWidth={isPlayer ? 3 : 2}
                      opacity={isDefeated ? 0.4 : 1}
                    />

                    {/* Faction initial */}
                    <text
                      x={pos.x}
                      y={pos.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={isDefeated ? '#475569' : color}
                      fontSize={18}
                      fontWeight="bold"
                    >
                      {FACTION_NAMES[id].split(' ').pop()?.charAt(0) ?? ''}
                    </text>

                    {/* Faction name below */}
                    <text
                      x={pos.x}
                      y={pos.y + 46}
                      textAnchor="middle"
                      fill={isDefeated ? '#475569' : '#94a3b8'}
                      fontSize={10}
                    >
                      {FACTION_NAMES[id].replace('The ', '')}
                    </text>

                    {/* Labels */}
                    {isDefeated && (
                      <text
                        x={pos.x}
                        y={pos.y + 58}
                        textAnchor="middle"
                        fill="#ef4444"
                        fontSize={8}
                        fontWeight="bold"
                      >
                        DEFEATED
                      </text>
                    )}
                    {isPlayer && (
                      <text
                        x={pos.x}
                        y={pos.y + 58}
                        textAnchor="middle"
                        fill={color}
                        fontSize={8}
                        fontWeight="bold"
                        letterSpacing={2}
                      >
                        YOU
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </motion.div>
        </div>

        {/* RIGHT: Selected Faction Dossier */}
        <div className="w-[440px] border-l border-slate-800 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {selectedFactionData && selectedFaction ? (
              <motion.div
                key={selectedFaction}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Faction header */}
                <div
                  className="rounded-lg p-4 mb-4 border"
                  style={{
                    borderColor: `${FACTION_COLORS[selectedFaction]}44`,
                    backgroundColor: `${FACTION_COLORS[selectedFaction]}11`,
                  }}
                >
                  <h2
                    className="text-xl font-bold tracking-wider"
                    style={{ color: FACTION_COLORS[selectedFaction] }}
                  >
                    {selectedFactionData.name}
                  </h2>
                  {selectedFactionData.isDefeated && (
                    <span className="text-xs text-red-500 font-bold tracking-wider">
                      DEFEATED
                    </span>
                  )}
                </div>

                {/* Relation score */}
                <div className="mb-4 p-3 rounded bg-slate-900/60 border border-slate-800">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                    Relations with You
                  </p>
                  <p
                    className="text-4xl font-bold tabular-nums"
                    style={{ color: getRelationColor(relationWithPlayer) }}
                  >
                    {relationWithPlayer > 0 ? '+' : ''}
                    {relationWithPlayer}
                  </p>
                </div>

                {/* War status */}
                {atWarWithSelected && (
                  <div className="mb-4 p-3 rounded bg-red-950/40 border border-red-900/60">
                    <p className="text-red-400 font-bold text-sm tracking-[0.2em] uppercase flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      AT WAR
                    </p>
                  </div>
                )}

                {/* Active treaties */}
                {treatiesWithSelected.length > 0 && (
                  <div className="mb-4 p-3 rounded bg-slate-900/60 border border-slate-800">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                      Active Treaties
                    </p>
                    {treatiesWithSelected.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between text-sm text-slate-300 mb-1"
                      >
                        <span>{TREATY_LABELS[t.type] ?? t.type}</span>
                        {t.turnsRemaining !== null && (
                          <span className="text-xs text-slate-500">
                            {t.turnsRemaining}t remaining
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Intel: Territory & Military */}
                <div className="mb-4 p-3 rounded bg-slate-900/60 border border-slate-800">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                    Intelligence
                  </p>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Known Territories</span>
                    <span className="text-slate-200">
                      {selectedFactionData.territories.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-slate-400">Est. Military Strength</span>
                    <span className="text-slate-200">
                      {selectedFactionData.territories.length * 30 +
                        (selectedFactionData.resources.manpower ?? 0)}
                    </span>
                  </div>

                  {/* Personality bars - only if player has intel */}
                  {hasIntelOnSelected ? (
                    <>
                      <p className="text-xs text-slate-600 uppercase tracking-wider mb-2 mt-3">
                        Personality Estimates
                      </p>
                      {(['aggression', 'loyalty', 'greed'] as const).map((trait) => {
                        const val = selectedFactionData.personality[trait];
                        const barColor =
                          trait === 'aggression'
                            ? '#ef4444'
                            : trait === 'loyalty'
                              ? '#22c55e'
                              : '#f59e0b';
                        return (
                          <div key={trait} className="mb-2">
                            <div className="flex justify-between text-xs mb-0.5">
                              <span className="text-slate-500 capitalize">{trait}</span>
                              <span className="text-slate-400">{val}/10</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-800">
                              <motion.div
                                className="h-full rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${val * 10}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                style={{ backgroundColor: barColor }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <p className="text-xs text-slate-600 italic mt-2">
                      Personality data unavailable - gather intel to reveal.
                    </p>
                  )}
                </div>

                {/* Diplomatic Actions */}
                {!selectedFactionData.isDefeated && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                      Diplomatic Actions
                    </p>
                    {DIPLOMATIC_ACTIONS.map((opt) => {
                      const canAfford = playerInfluence >= opt.cost;
                      return (
                        <button
                          key={opt.action}
                          disabled={!canAfford}
                          onClick={() => {
                            if (handleDiplomacy && selectedFaction) {
                              handleDiplomacy(opt.action, selectedFaction);
                            }
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded border text-sm transition-all ${
                            canAfford
                              ? 'border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                              : 'border-slate-800 bg-slate-900/30 text-slate-600 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span>{opt.label}</span>
                            <span
                              className={`text-xs font-mono ${
                                canAfford ? 'text-amber-400' : 'text-slate-700'
                              }`}
                            >
                              {opt.cost > 0 ? `${opt.cost} INF` : 'FREE'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center h-full"
              >
                <p className="text-slate-600 text-sm tracking-wider text-center leading-relaxed">
                  Select a faction on the relationship web
                  <br />
                  to view their dossier.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* BOTTOM: All active treaties globally */}
      <div className="border-t border-slate-800 px-8 py-3">
        <div className="flex items-center gap-6 overflow-x-auto">
          <p className="text-xs text-slate-600 uppercase tracking-wider whitespace-nowrap font-bold">
            Global Treaties
          </p>
          {diplomacy.treaties.length === 0 ? (
            <p className="text-xs text-slate-700 italic">No active treaties</p>
          ) : (
            diplomacy.treaties.map((t: Treaty) => (
              <div
                key={t.id}
                className="flex items-center gap-2 text-xs text-slate-400 whitespace-nowrap bg-slate-900/50 px-3 py-1.5 rounded border border-slate-800"
              >
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: FACTION_COLORS[t.factions[0]] }}
                />
                <span style={{ color: FACTION_COLORS[t.factions[0]] }}>
                  {FACTION_NAMES[t.factions[0]].replace('The ', '')}
                </span>
                <span className="text-slate-600">&mdash;</span>
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: FACTION_COLORS[t.factions[1]] }}
                />
                <span style={{ color: FACTION_COLORS[t.factions[1]] }}>
                  {FACTION_NAMES[t.factions[1]].replace('The ', '')}
                </span>
                <span className="text-slate-600 ml-1">
                  ({TREATY_LABELS[t.type] ?? t.type})
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
