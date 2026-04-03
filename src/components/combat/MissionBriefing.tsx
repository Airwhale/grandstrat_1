'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { FACTION_COLORS } from '@/data/factions';
import type { MissionObjective } from '@/types';

const TERRAIN_LABELS: Record<string, string> = {
  urban: 'URBAN ENVIRONMENT',
  jungle: 'JUNGLE CANOPY',
  desert: 'DESERT WASTELAND',
  arctic: 'ARCTIC TUNDRA',
  mountain: 'MOUNTAIN RANGE',
  coastal: 'COASTAL ZONE',
};

const MISSION_TYPE_LABELS: Record<string, string> = {
  assault: 'ASSAULT OPERATION',
  defense: 'DEFENSE OPERATION',
  extraction: 'EXTRACTION OPERATION',
  sabotage: 'SABOTAGE OPERATION',
  rescue: 'RESCUE OPERATION',
  assassination: 'ASSASSINATION OPERATION',
  intelRaid: 'INTEL RAID',
};

const OBJECTIVE_ICONS: Record<string, string> = {
  capture: '\u2691',
  eliminate: '\u2620',
  survive: '\u26A0',
  destroy: '\u2622',
  reach: '\u2192',
  hack: '\u2318',
  escort: '\u2694',
};

export default function MissionBriefing() {
  const mission = useGameStore((s) => s.mission);
  const tacticalUnits = useGameStore((s) => s.tacticalUnits);
  const playerFaction = useGameStore((s) => s.playerFaction);
  const setPhase = useGameStore((s) => s.setPhase);

  if (!mission) return null;

  const factionColor = playerFaction ? FACTION_COLORS[playerFaction] : '#3B82F6';
  const playerUnits = tacticalUnits?.filter((u) => u.isPlayer) ?? [];
  const enemyCount = mission.enemyCount;

  const handleDeploy = () => {
    setPhase('tactical');
  };

  const handleAutoResolve = () => {
    const store = useGameStore.getState() as any;
    // Simple auto-resolve: player wins if they have more or equal units
    const result = playerUnits.length >= enemyCount ? 'victory' : 'defeat';
    if (store.endCombat) {
      store.endCombat(result);
    }
    setPhase('strategic');
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Scanline overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
        }}
      />

      <motion.div
        className="relative z-20 w-full max-w-3xl mx-4"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        {/* CLASSIFIED header stripe */}
        <div
          className="flex items-center justify-between px-6 py-3"
          style={{ backgroundColor: 'rgba(220, 38, 38, 0.25)', borderBottom: '1px solid #991b1b' }}
        >
          <span className="text-xs font-mono tracking-[0.3em] text-red-400 uppercase">
{`// CLASSIFIED // EYES ONLY //`}
          </span>
          <span className="text-xs font-mono text-red-400/60">
            DOC-{Math.floor(Math.random() * 9000 + 1000)}
          </span>
        </div>

        {/* Main briefing body */}
        <div
          className="p-8"
          style={{
            backgroundColor: '#0d0d14',
            border: '1px solid #2a2a3a',
            borderTop: 'none',
          }}
        >
          {/* Title */}
          <motion.h1
            className="text-3xl font-bold font-mono tracking-wider mb-1"
            style={{ color: factionColor }}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            MISSION BRIEFING
          </motion.h1>
          <div className="h-px w-full mb-6" style={{ backgroundColor: factionColor, opacity: 0.3 }} />

          {/* Mission type and terrain */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                Operation Type
              </span>
              <p className="text-lg font-mono font-semibold text-white mt-1">
                {MISSION_TYPE_LABELS[mission.type] || mission.type.toUpperCase()}
              </p>
            </div>
            <div>
              <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                Theater
              </span>
              <p className="text-lg font-mono font-semibold text-white mt-1">
                {TERRAIN_LABELS[mission.terrain] || mission.terrain.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Grid size and turn limit */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div
              className="p-3 text-center"
              style={{ backgroundColor: '#111118', border: '1px solid #1f1f2e' }}
            >
              <span className="text-xs font-mono text-gray-500 block">GRID</span>
              <span className="text-white font-mono font-bold">
                {mission.gridWidth}x{mission.gridHeight}
              </span>
            </div>
            <div
              className="p-3 text-center"
              style={{ backgroundColor: '#111118', border: '1px solid #1f1f2e' }}
            >
              <span className="text-xs font-mono text-gray-500 block">HOSTILES</span>
              <span className="text-red-400 font-mono font-bold">{enemyCount}</span>
            </div>
            <div
              className="p-3 text-center"
              style={{ backgroundColor: '#111118', border: '1px solid #1f1f2e' }}
            >
              <span className="text-xs font-mono text-gray-500 block">TURN LIMIT</span>
              <span className="text-yellow-400 font-mono font-bold">
                {mission.turnLimit ?? 'NONE'}
              </span>
            </div>
          </div>

          {/* Objectives */}
          <div className="mb-6">
            <h2 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-3">
              Objectives
            </h2>
            <div className="space-y-2">
              {mission.objectives.map((obj: MissionObjective, i: number) => (
                <motion.div
                  key={obj.id}
                  className="flex items-center gap-3 p-3"
                  style={{ backgroundColor: '#111118', border: '1px solid #1f1f2e' }}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <div
                    className="w-6 h-6 flex items-center justify-center text-xs font-mono"
                    style={{
                      border: `1px solid ${obj.isComplete ? '#22c55e' : '#4a4a5a'}`,
                      color: obj.isComplete ? '#22c55e' : '#6b7280',
                      backgroundColor: obj.isComplete ? 'rgba(34,197,94,0.1)' : 'transparent',
                    }}
                  >
                    {obj.isComplete ? '\u2713' : OBJECTIVE_ICONS[obj.type] || '\u25CB'}
                  </div>
                  <span className="text-gray-200 font-mono text-sm flex-1">
                    {obj.description}
                  </span>
                  <span className="text-xs font-mono text-gray-500 uppercase">
                    [{obj.type}]
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Deployed operatives */}
          {playerUnits.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-mono text-gray-400 uppercase tracking-wider mb-3">
                Deployed Operatives ({playerUnits.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {playerUnits.map((unit) => (
                  <div
                    key={unit.id}
                    className="flex items-center gap-2 px-3 py-2"
                    style={{ backgroundColor: '#111118', border: '1px solid #1f1f2e' }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: factionColor }}
                    />
                    <span className="text-gray-200 font-mono text-xs">{unit.name}</span>
                    <span className="text-gray-500 font-mono text-xs uppercase">
                      {unit.class}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-4">
            <motion.button
              className="flex-1 py-3 px-6 font-mono font-bold text-sm uppercase tracking-wider transition-all"
              style={{
                backgroundColor: factionColor,
                color: '#000',
                border: 'none',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDeploy}
            >
              DEPLOY TEAM
            </motion.button>
            <motion.button
              className="py-3 px-6 font-mono text-sm uppercase tracking-wider transition-all"
              style={{
                backgroundColor: 'transparent',
                color: '#9ca3af',
                border: '1px solid #3a3a4a',
              }}
              whileHover={{ backgroundColor: '#1a1a2a', color: '#d1d5db' }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAutoResolve}
            >
              AUTO-RESOLVE
            </motion.button>
          </div>
        </div>

        {/* Bottom stripe */}
        <div
          className="px-6 py-2 flex justify-between"
          style={{ backgroundColor: '#0a0a10', borderTop: '1px solid #1a1a2a' }}
        >
          <span className="text-xs font-mono text-gray-600">SHADOW ACCORD COMMAND</span>
          <span className="text-xs font-mono text-gray-600">
            PRIORITY: ALPHA
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
