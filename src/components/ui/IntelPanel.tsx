'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { FACTION_COLORS, FACTION_NAMES } from '@/data/factions';
import type { FactionId } from '@/types';

const BUILDING_LABELS: Record<string, string> = {
  base: 'Command Base', lab: 'Research Lab', factory: 'Factory', hospital: 'Hospital',
  spyNetwork: 'Spy Network', bank: 'Bank', mediaCenter: 'Media Center', fortress: 'Fortress', recruitCenter: 'Recruit Center',
};

export default function IntelPanel() {
  const { intelReports, playerFaction, selectedTerritory, territories, selectTerritory } = useGameStore();

  const accentColor = playerFaction ? FACTION_COLORS[playerFaction] : '#6B7280';

  const sortedReports = [...intelReports].sort((a, b) => b.turn - a.turn);
  const selected = selectedTerritory ? territories[selectedTerritory] : null;

  return (
    <motion.div
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-64 h-full flex flex-col shrink-0 select-none"
      style={{
        backgroundColor: '#111827',
        borderLeft: `1px solid ${accentColor}33`,
      }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 flex items-center gap-2 shrink-0"
        style={{
          borderBottom: `1px solid ${accentColor}33`,
          backgroundColor: `${accentColor}0A`,
        }}
      >
        <div
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ backgroundColor: accentColor }}
        />
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: accentColor }}
        >
          Intel Feed
        </span>
        <span className="text-[10px] text-gray-600 font-mono ml-auto">
          [{sortedReports.length}]
        </span>
      </div>

      {/* Selected territory dossier */}
      {selected && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="shrink-0 border-b"
          style={{ borderColor: `${accentColor}33`, backgroundColor: '#0d1220' }}
        >
          <div className="px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: selected.controller ? FACTION_COLORS[selected.controller] : '#555' }}
              />
              <span className="text-xs font-semibold text-white truncate">{selected.name}</span>
            </div>
            <button
              onClick={() => selectTerritory(null)}
              className="text-slate-600 hover:text-slate-300 text-xs px-1"
              aria-label="Close territory info"
            >
              ✕
            </button>
          </div>
          <div className="px-3 pb-2 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px]">
            <span className="text-slate-500">Controller</span>
            <span className="text-right" style={{ color: selected.controller ? FACTION_COLORS[selected.controller] : '#94a3b8' }}>
              {selected.controller ? FACTION_NAMES[selected.controller].replace('The ', '') : 'Neutral'}
            </span>
            <span className="text-slate-500">Garrison</span>
            <span className="text-right font-mono text-slate-300">{selected.troops} troops</span>
            <span className="text-slate-500">Terrain</span>
            <span className="text-right capitalize text-slate-300">{selected.terrain}</span>
            <span className="text-slate-500">Income</span>
            <span className="text-right font-mono text-yellow-400">+{selected.resources.credits ?? 0}💰/turn</span>
            <span className="text-slate-500">Unrest</span>
            <span className="text-right font-mono" style={{ color: selected.unrest > 60 ? '#ef4444' : selected.unrest > 30 ? '#eab308' : '#22c55e' }}>
              {selected.unrest}%
            </span>
            <span className="text-slate-500">Fortification</span>
            <span className="text-right font-mono text-slate-300">{'▮'.repeat(selected.fortification) || '—'}</span>
          </div>
          {selected.buildings.length > 0 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1">
              {selected.buildings.map((b, i) => (
                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {BUILDING_LABELS[b.type] ?? b.type}
                </span>
              ))}
            </div>
          )}
          {selected.hasRareMaterials && (
            <div className="px-3 pb-2">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-400 uppercase tracking-wider">
                ⚙ Rare Materials
              </span>
            </div>
          )}
        </motion.div>
      )}

      {/* Reports list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {sortedReports.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <span className="text-xs text-gray-600 italic">
              No intelligence available
            </span>
          </div>
        ) : (
          sortedReports.map((report, idx) => {
            const dotColor = FACTION_COLORS[report.faction as FactionId] ?? '#6B7280';

            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                className="px-3 py-2 border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors"
              >
                {/* Top line: faction dot + turn */}
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: dotColor }}
                  />
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                    T{report.turn}
                  </span>
                  <span className="text-[10px] text-gray-600 ml-auto uppercase">
                    {report.type}
                  </span>
                </div>

                {/* Content */}
                <p className="text-[11px] text-gray-400 leading-tight pl-3.5">
                  {report.content}
                </p>

                {/* Source */}
                <span className="text-[9px] font-mono text-gray-600 pl-3.5 mt-0.5 block">
                  src: {report.source}
                </span>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Footer classification bar */}
      <div
        className="px-3 py-1 shrink-0 text-center"
        style={{
          borderTop: `1px solid ${accentColor}33`,
          backgroundColor: `${accentColor}08`,
        }}
      >
        <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-gray-600">
          classified // eyes only
        </span>
      </div>
    </motion.div>
  );
}
