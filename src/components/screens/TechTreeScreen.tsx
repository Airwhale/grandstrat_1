'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { TECHNOLOGIES } from '@/data/technologies';
import { FACTION_COLORS } from '@/data/factions';
import type { Technology, TechBranch, TechId } from '@/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BRANCH_COLORS: Record<TechBranch, string> = {
  military: '#EF4444',
  economic: '#F59E0B',
  intelligence: '#3B82F6',
};

const BRANCH_LABELS: Record<TechBranch, string> = {
  military: 'MILITARY',
  economic: 'ECONOMIC',
  intelligence: 'INTELLIGENCE',
};

const BRANCH_ICONS: Record<TechBranch, string> = {
  military: '\u2694',
  economic: '\u2692',
  intelligence: '\u{1F441}',
};

const BRANCHES: TechBranch[] = ['military', 'economic', 'intelligence'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type TechStatus = 'researched' | 'active' | 'available' | 'locked';

function getTechStatus(
  tech: Technology,
  researched: TechId[],
  currentResearchId: TechId | null,
): TechStatus {
  if (researched.includes(tech.id)) return 'researched';
  if (currentResearchId === tech.id) return 'active';
  if (tech.prerequisites.every((p) => researched.includes(p))) return 'available';
  return 'locked';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TechTreeScreen() {
  const setPhase = useGameStore((s) => s.setPhase);
  const factions = useGameStore((s) => s.factions);
  const playerFaction = useGameStore((s) => s.playerFaction);

  const [selectedTech, setSelectedTech] = useState<Technology | null>(null);

  const playerData = playerFaction ? factions[playerFaction] : null;
  const researched = playerData?.researchedTechs ?? [];
  const currentResearch = playerData?.currentResearch ?? null;
  const techPoints = playerData?.resources.techPoints ?? 0;
  const accentColor = playerFaction ? FACTION_COLORS[playerFaction] : '#3B82F6';

  // Group by branch
  const techsByBranch = useMemo(() => {
    const grouped: Record<TechBranch, Technology[]> = {
      military: [],
      economic: [],
      intelligence: [],
    };
    for (const t of TECHNOLOGIES) {
      grouped[t.branch].push(t);
    }
    // Sort each branch by tier
    for (const branch of BRANCHES) {
      grouped[branch].sort((a, b) => a.tier - b.tier);
    }
    return grouped;
  }, []);

  // Tech positions for drawing lines (by id)
  const techIndexInBranch = useMemo(() => {
    const map: Record<string, { branch: TechBranch; tierIndex: number }> = {};
    for (const branch of BRANCHES) {
      const techs = techsByBranch[branch];
      techs.forEach((t, i) => {
        map[t.id] = { branch, tierIndex: i };
      });
    }
    return map;
  }, [techsByBranch]);

  function handleResearch(tech: Technology) {
    const status = getTechStatus(tech, researched, currentResearch?.techId ?? null);
    if (status !== 'available') return;
    // Try to call startResearch on the store
    const store = useGameStore.getState() as any;
    if (typeof store.startResearch === 'function') {
      store.startResearch(tech.id);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col overflow-hidden"
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
          Research
        </h1>
        <div className="text-xs text-slate-600 tracking-wider">
          TECH POINTS:{' '}
          <span className="text-cyan-400 font-bold">{techPoints}</span>
          {currentResearch && (
            <span className="ml-4 text-amber-400">
              RESEARCHING: {TECHNOLOGIES.find((t) => t.id === currentResearch.techId)?.name ?? '???'}{' '}
              ({currentResearch.turnsRemaining}t)
            </span>
          )}
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="flex gap-6 justify-center min-w-[900px]">
          {BRANCHES.map((branch) => {
            const techs = techsByBranch[branch];
            const color = BRANCH_COLORS[branch];

            // Group by tier
            const tiers: Record<number, Technology[]> = {};
            for (const t of techs) {
              if (!tiers[t.tier]) tiers[t.tier] = [];
              tiers[t.tier].push(t);
            }

            return (
              <motion.div
                key={branch}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: BRANCHES.indexOf(branch) * 0.1 }}
                className="flex-1 max-w-[380px]"
              >
                {/* Branch Header */}
                <div
                  className="text-center mb-6 pb-3 border-b"
                  style={{ borderColor: `${color}44` }}
                >
                  <div className="text-2xl mb-1">{BRANCH_ICONS[branch]}</div>
                  <h2
                    className="text-sm font-bold tracking-[0.25em]"
                    style={{ color }}
                  >
                    {BRANCH_LABELS[branch]}
                  </h2>
                </div>

                {/* Tiers */}
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((tier) => {
                    const tierTechs = tiers[tier] ?? [];
                    return (
                      <div key={tier}>
                        <div className="text-[10px] text-slate-600 tracking-[0.2em] uppercase mb-2 pl-1">
                          Tier {tier}
                        </div>
                        <div className="space-y-2">
                          {tierTechs.map((tech) => {
                            const status = getTechStatus(tech, researched, currentResearch?.techId ?? null);
                            const isResearched = status === 'researched';
                            const isActive = status === 'active';
                            const isAvailable = status === 'available';
                            const isLocked = status === 'locked';

                            return (
                              <motion.button
                                key={tech.id}
                                onClick={() => {
                                  setSelectedTech(tech);
                                  if (isAvailable) handleResearch(tech);
                                }}
                                whileHover={isAvailable ? { scale: 1.02 } : {}}
                                whileTap={isAvailable ? { scale: 0.98 } : {}}
                                className={`w-full text-left rounded-lg border p-3 transition-all relative ${
                                  isAvailable
                                    ? 'cursor-pointer hover:bg-opacity-20'
                                    : isLocked
                                      ? 'cursor-not-allowed'
                                      : 'cursor-default'
                                }`}
                                style={{
                                  borderColor: isResearched
                                    ? color
                                    : isActive
                                      ? `${color}cc`
                                      : isAvailable
                                        ? `${color}66`
                                        : '#1e293b',
                                  backgroundColor: isResearched
                                    ? `${color}18`
                                    : isActive
                                      ? `${color}12`
                                      : isAvailable
                                        ? `${color}08`
                                        : '#0f131d',
                                  opacity: isLocked ? 0.4 : 1,
                                }}
                              >
                                {/* Active research indicator */}
                                {isActive && (
                                  <div
                                    className="absolute top-0 left-0 right-0 h-0.5 rounded-t-lg animate-pulse"
                                    style={{ backgroundColor: color }}
                                  />
                                )}

                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      {isLocked && (
                                        <span className="text-slate-600 text-xs">&#x1F512;</span>
                                      )}
                                      {isResearched && (
                                        <span style={{ color }} className="text-xs">&#x2713;</span>
                                      )}
                                      <h3
                                        className="text-sm font-semibold truncate"
                                        style={{
                                          color: isResearched
                                            ? color
                                            : isActive
                                              ? '#e2e8f0'
                                              : isAvailable
                                                ? '#cbd5e1'
                                                : '#475569',
                                        }}
                                      >
                                        {tech.name}
                                      </h3>
                                    </div>
                                    <p
                                      className="text-xs mt-1 leading-relaxed"
                                      style={{
                                        color: isResearched || isActive || isAvailable
                                          ? '#94a3b8'
                                          : '#334155',
                                      }}
                                    >
                                      {tech.description}
                                    </p>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <div
                                      className="text-xs font-mono"
                                      style={{
                                        color: isResearched
                                          ? '#475569'
                                          : isAvailable
                                            ? '#67e8f9'
                                            : '#334155',
                                      }}
                                    >
                                      {isResearched ? 'DONE' : `${tech.cost}TP`}
                                    </div>
                                    {!isResearched && (
                                      <div
                                        className="text-[10px] font-mono mt-0.5"
                                        style={{ color: '#475569' }}
                                      >
                                        {tech.turnsToResearch}t
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Prerequisites display for locked techs */}
                                {isLocked && tech.prerequisites.length > 0 && (
                                  <div className="mt-2 text-[10px] text-slate-600">
                                    Requires:{' '}
                                    {tech.prerequisites
                                      .map(
                                        (pid) =>
                                          TECHNOLOGIES.find((t) => t.id === pid)?.name ?? pid,
                                      )
                                      .join(', ')}
                                  </div>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="border-t border-slate-800 px-8 py-3">
        <div className="flex items-center gap-6 text-xs text-slate-500">
          <span>
            Researched:{' '}
            <span className="text-slate-300 font-bold">
              {researched.length}/{TECHNOLOGIES.length}
            </span>
          </span>
          {currentResearch && (
            <span>
              In progress:{' '}
              <span className="text-amber-400">
                {TECHNOLOGIES.find((t) => t.id === currentResearch.techId)?.name} -{' '}
                {currentResearch.turnsRemaining} turn(s) remaining
              </span>
            </span>
          )}
          <span className="ml-auto text-slate-600 tracking-wider">
            Click an available tech to begin research
          </span>
        </div>
      </div>
    </motion.div>
  );
}
