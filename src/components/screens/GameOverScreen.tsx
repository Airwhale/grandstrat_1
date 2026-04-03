'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { FACTION_COLORS } from '@/data/factions';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GameOverScreen() {
  const phase = useGameStore((s) => s.phase);
  const setPhase = useGameStore((s) => s.setPhase);
  const turn = useGameStore((s) => s.turn);
  const factions = useGameStore((s) => s.factions);
  const playerFaction = useGameStore((s) => s.playerFaction);
  const operatives = useGameStore((s) => s.operatives);
  const fallenOperatives = useGameStore((s) => s.fallenOperatives);
  const territories = useGameStore((s) => s.territories);

  const isVictory = phase === 'victory';
  const accentColor = isVictory ? '#22c55e' : '#ef4444';
  const factionColor = playerFaction ? FACTION_COLORS[playerFaction] : accentColor;

  const stats = useMemo(() => {
    const playerTerritories = Array.isArray(territories)
      ? territories.filter((t) => t.controller === playerFaction).length
      : playerFaction && factions[playerFaction]
        ? factions[playerFaction].territories.length
        : 0;

    const playerOps = operatives.filter((o) => o.faction === playerFaction);
    const totalKills =
      playerOps.reduce((s, o) => s + o.kills, 0) +
      fallenOperatives.reduce((s, o) => s + o.kills, 0);

    return {
      turnsPlayed: turn,
      territoriesHeld: playerTerritories,
      operativesLost: fallenOperatives.length,
      operativesActive: playerOps.length,
      totalKills,
    };
  }, [turn, territories, playerFaction, factions, operatives, fallenOperatives]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: '#080c14',
        backgroundImage: isVictory
          ? 'radial-gradient(ellipse at center, rgba(34, 197, 94, 0.06) 0%, transparent 70%)'
          : 'radial-gradient(ellipse at center, rgba(239, 68, 68, 0.06) 0%, transparent 70%)',
      }}
    >
      {/* Scanline overlay */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        className="text-center max-w-lg mx-4"
      >
        {/* Result label */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h1
            className="text-6xl font-bold tracking-[0.4em] uppercase mb-2"
            style={{
              color: accentColor,
              textShadow: `0 0 40px ${accentColor}44, 0 0 80px ${accentColor}22`,
            }}
          >
            {isVictory ? 'VICTORY' : 'DEFEAT'}
          </h1>
          <p
            className="text-sm tracking-[0.3em] uppercase mb-10"
            style={{ color: '#64748b' }}
          >
            {isVictory
              ? 'The shadow war is over. You prevailed.'
              : 'Your operations have been dismantled.'}
          </p>
        </motion.div>

        {/* Stats panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="rounded-lg border p-6 mb-8"
          style={{
            borderColor: `${accentColor}33`,
            backgroundColor: '#0d1220',
          }}
        >
          <h3
            className="text-[10px] tracking-[0.3em] uppercase mb-5"
            style={{ color: '#64748b' }}
          >
            CAMPAIGN SUMMARY
          </h3>

          <div className="space-y-3">
            {[
              { label: 'Turns Played', value: stats.turnsPlayed, color: '#e2e8f0' },
              { label: 'Territories Held', value: stats.territoriesHeld, color: factionColor },
              { label: 'Operatives Active', value: stats.operativesActive, color: '#22c55e' },
              { label: 'Operatives Lost', value: stats.operativesLost, color: '#ef4444' },
              { label: 'Total Kills', value: stats.totalKills, color: '#f59e0b' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + i * 0.08 }}
                className="flex items-center justify-between py-1 border-b"
                style={{ borderColor: '#1e293b' }}
              >
                <span className="text-xs text-slate-500 tracking-wider uppercase">
                  {stat.label}
                </span>
                <span
                  className="text-lg font-bold tabular-nums"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Return to Menu button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setPhase('menu')}
          className="px-8 py-3 rounded-lg border text-sm font-bold tracking-[0.2em] uppercase transition-all"
          style={{
            borderColor: `${accentColor}55`,
            color: accentColor,
            backgroundColor: `${accentColor}11`,
          }}
        >
          Return to Menu
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
