'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { FACTION_COLORS } from '@/data/factions';
import type { Operative, FallenOperative, OperativeStatus } from '@/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<OperativeStatus, { label: string; color: string; bg: string }> = {
  active: { label: 'ACTIVE', color: '#22c55e', bg: '#22c55e18' },
  wounded: { label: 'WOUNDED', color: '#f59e0b', bg: '#f59e0b18' },
  deployed: { label: 'DEPLOYED', color: '#3b82f6', bg: '#3b82f618' },
  kia: { label: 'KIA', color: '#ef4444', bg: '#ef444418' },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function HpBar({ hp, maxHp }: { hp: number; maxHp: number }) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const barColor = pct > 60 ? '#22c55e' : pct > 30 ? '#f59e0b' : '#ef4444';
  return (
    <div className="w-full h-1.5 rounded-full bg-slate-800 mt-1">
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ backgroundColor: barColor }}
      />
    </div>
  );
}

function OperativeCard({
  op,
  accentColor,
  index,
}: {
  op: Operative;
  accentColor: string;
  index: number;
}) {
  const statusCfg = STATUS_CONFIG[op.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-lg border p-4 transition-colors hover:bg-slate-900/60"
      style={{
        borderColor: `${accentColor}33`,
        backgroundColor: '#0d1220',
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-200 truncate">{op.name}</h3>
          {op.callsign && (
            <p className="text-[11px] tracking-wider" style={{ color: accentColor }}>
              &ldquo;{op.callsign}&rdquo;
            </p>
          )}
        </div>
        <span
          className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded uppercase flex-shrink-0"
          style={{ color: statusCfg.color, backgroundColor: statusCfg.bg }}
        >
          {statusCfg.label}
        </span>
      </div>

      {/* Class & Level */}
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-slate-400 capitalize">{op.class.replace(/([A-Z])/g, ' $1').trim()}</span>
        <span className="text-slate-500">
          LVL <span className="text-slate-300 font-bold">{op.level}</span>
        </span>
      </div>

      {/* HP */}
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span>HP</span>
        <span className="text-slate-400 font-mono">
          {op.hp}/{op.maxHp}
        </span>
      </div>
      <HpBar hp={op.hp} maxHp={op.maxHp} />

      {/* Stats row */}
      <div className="flex items-center justify-between mt-3 text-[10px] text-slate-500">
        <span>
          AIM <span className="text-slate-400">{op.aim}</span>
        </span>
        <span>
          MOB <span className="text-slate-400">{op.mobility}</span>
        </span>
        <span>
          ARM <span className="text-slate-400">{op.armor}</span>
        </span>
        <span>
          KILLS <span className="text-slate-300 font-bold">{op.kills}</span>
        </span>
      </div>

      {/* Wounded turns */}
      {op.status === 'wounded' && op.woundedTurns > 0 && (
        <p className="mt-2 text-[10px] text-amber-400 tracking-wider">
          Recovery: {op.woundedTurns} turn(s)
        </p>
      )}

      {/* Missions */}
      <div className="mt-2 text-[10px] text-slate-600">
        {op.missionsCompleted} mission(s) completed
      </div>
    </motion.div>
  );
}

function FallenCard({
  op,
  index,
}: {
  op: FallenOperative;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded border p-3 flex items-center justify-between gap-4"
      style={{
        borderColor: '#ef444433',
        backgroundColor: '#1a070a',
      }}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-red-300 truncate">{op.name}</h4>
          {op.callsign && (
            <span className="text-[10px] text-red-500/60">
              &ldquo;{op.callsign}&rdquo;
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5 capitalize">
          {op.class.replace(/([A-Z])/g, ' $1').trim()} &mdash; Level {op.level}
        </p>
        <p className="text-[10px] text-red-400/70 mt-1 italic">{op.causeOfDeath}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-[10px] text-slate-600">
          {op.missionsCompleted} mission(s)
        </div>
        <div className="text-[10px] text-slate-600">{op.kills} kill(s)</div>
        <div className="text-[10px] text-red-500/50 mt-1">Turn {op.turnKilled}</div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function RosterScreen() {
  const setPhase = useGameStore((s) => s.setPhase);
  const operatives = useGameStore((s) => s.operatives);
  const fallenOperatives = useGameStore((s) => s.fallenOperatives);
  const playerFaction = useGameStore((s) => s.playerFaction);

  const accentColor = playerFaction ? FACTION_COLORS[playerFaction] : '#3B82F6';

  const playerOps = useMemo(
    () => operatives.filter((op) => op.faction === playerFaction),
    [operatives, playerFaction],
  );

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
          Operative Roster
        </h1>
        <div className="text-xs text-slate-600 tracking-wider">
          ACTIVE:{' '}
          <span className="text-green-400 font-bold">
            {playerOps.filter((o) => o.status === 'active').length}
          </span>
          <span className="mx-2 text-slate-700">|</span>
          WOUNDED:{' '}
          <span className="text-amber-400 font-bold">
            {playerOps.filter((o) => o.status === 'wounded').length}
          </span>
          <span className="mx-2 text-slate-700">|</span>
          FALLEN:{' '}
          <span className="text-red-400 font-bold">{fallenOperatives.length}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Active Roster */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-5 rounded" style={{ backgroundColor: accentColor }} />
            <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-slate-300">
              Active Roster
            </h2>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {playerOps.length === 0 ? (
            <p className="text-sm text-slate-600 italic pl-4">
              No operatives recruited yet. Use the Recruit action to enlist personnel.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {playerOps.map((op, i) => (
                <OperativeCard key={op.id} op={op} accentColor={accentColor} index={i} />
              ))}
            </div>
          )}
        </section>

        {/* Memorial Wall */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-5 rounded bg-red-800" />
            <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-red-400/80">
              Memorial Wall
            </h2>
            <div className="flex-1 h-px bg-red-900/30" />
          </div>

          {fallenOperatives.length === 0 ? (
            <p className="text-sm text-slate-700 italic pl-4">
              No operatives have been lost. May it remain so.
            </p>
          ) : (
            <div className="space-y-2 max-w-2xl">
              {fallenOperatives.map((op, i) => (
                <FallenCard key={`${op.name}-${op.turnKilled}`} op={op} index={i} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800 px-8 py-3">
        <div className="flex items-center gap-6 text-xs text-slate-600 tracking-wider">
          <span>
            Total operatives fielded:{' '}
            <span className="text-slate-400">{playerOps.length + fallenOperatives.length}</span>
          </span>
          <span>
            Total kills:{' '}
            <span className="text-slate-400">
              {playerOps.reduce((s, o) => s + o.kills, 0) +
                fallenOperatives.reduce((s, o) => s + o.kills, 0)}
            </span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}
