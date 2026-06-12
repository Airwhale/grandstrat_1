'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { FACTION_NAMES, FACTION_COLORS } from '@/data/factions';
import type { SaveSlot } from '@/types';

// ---------------------------------------------------------------------------
// Main Menu Component
// ---------------------------------------------------------------------------

export default function MainMenu() {
  const setPhase = useGameStore((s) => s.setPhase);
  const getSaves = useGameStore((s) => s.getSaves);
  const loadGame = useGameStore((s) => s.loadGame);

  const [showSaveSlots, setShowSaveSlots] = useState(false);
  const [saves, setSaves] = useState<SaveSlot[]>([]);
  const [hasSaves, setHasSaves] = useState(false);

  useEffect(() => {
    const loaded = getSaves();
    setSaves(loaded);
    setHasSaves(loaded.length > 0);
  }, [getSaves]);

  const handleNewGame = () => {
    setPhase('faction_select');
  };

  const handleLoadGame = () => {
    const loaded = getSaves();
    setSaves(loaded);
    setShowSaveSlots(true);
  };

  const handleLoadSlot = (slotId: number) => {
    loadGame(slotId);
    setShowSaveSlots(false);
  };

  const handleContinue = () => {
    // Load the most recent save
    const loaded = getSaves();
    if (loaded.length === 0) return;
    const mostRecent = loaded.reduce((a, b) => (a.timestamp > b.timestamp ? a : b));
    loadGame(mostRecent.id);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ------ Save Slot Selector ------
  if (showSaveSlots) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center"
        style={{ backgroundColor: '#080c14' }}
      >
        {/* Scanline overlay */}
        <div
          className="pointer-events-none fixed inset-0 z-10"
          style={{
            background:
              'repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 3px)',
            animation: 'mainmenu-scanlines 8s linear infinite',
          }}
        />

        <div className="relative z-20 w-full max-w-lg px-6">
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold tracking-[0.2em] text-center mb-8"
            style={{ color: '#e2e8f0' }}
          >
            LOAD OPERATION
          </motion.h2>

          {saves.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-slate-500 text-sm tracking-wider"
            >
              No saved operations found.
            </motion.p>
          ) : (
            <div className="flex flex-col gap-3">
              {saves
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((slot, i) => {
                  const factionColor = FACTION_COLORS[slot.faction] ?? '#94a3b8';
                  const factionName = FACTION_NAMES[slot.faction] ?? 'Unknown';
                  return (
                    <motion.button
                      key={slot.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                      onClick={() => handleLoadSlot(slot.id)}
                      className="w-full text-left rounded-lg p-4 border transition-all duration-200 hover:brightness-125"
                      style={{
                        backgroundColor: '#111827',
                        borderColor: '#1e293b',
                        borderLeftWidth: '4px',
                        borderLeftColor: factionColor,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: factionColor }}>
                            {factionName}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Turn {slot.turn} &middot; {slot.name}
                          </p>
                        </div>
                        <p className="text-xs text-slate-600">{formatDate(slot.timestamp)}</p>
                      </div>
                    </motion.button>
                  );
                })}
            </div>
          )}

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            onClick={() => setShowSaveSlots(false)}
            className="mt-6 w-full py-3 rounded border border-slate-700 text-slate-400 text-sm tracking-wider uppercase hover:border-slate-500 hover:text-slate-200 transition-colors"
          >
            Back
          </motion.button>
        </div>
      </div>
    );
  }

  // ------ Main Title Screen ------
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#080c14' }}
    >
      {/* Animated background particles (CSS-only) */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Radial glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '120vw',
            height: '120vh',
            background:
              'radial-gradient(ellipse at center, rgba(59,130,246,0.04) 0%, rgba(8,12,20,0) 60%)',
          }}
        />
        {/* Floating particles via CSS animation */}
        <div className="mainmenu-particles" />
      </div>

      {/* Scanline overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-10"
        style={{
          background:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 3px)',
          animation: 'mainmenu-scanlines 8s linear infinite',
        }}
      />

      {/* Horizontal scan bar */}
      <div
        className="pointer-events-none fixed inset-0 z-10"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, transparent 45%, rgba(59,130,246,0.03) 50%, transparent 55%, transparent 100%)',
          backgroundSize: '100% 200%',
          animation: 'mainmenu-scanbar 6s ease-in-out infinite',
        }}
      />

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center px-6">
        {/* Decorative line above title */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="w-48 h-px mb-8"
          style={{
            background: 'linear-gradient(90deg, transparent, #3B82F6, transparent)',
            animation: 'mainmenu-pulse-line 4s ease-in-out infinite',
          }}
        />

        {/* Subtitle above title */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-xs tracking-[0.5em] uppercase mb-4"
          style={{ color: '#475569' }}
        >
          Operation
        </motion.p>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-5xl md:text-7xl font-bold tracking-[0.25em] mb-3 text-center select-none"
          style={{
            color: '#e2e8f0',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textShadow: '0 0 40px rgba(59,130,246,0.15)',
          }}
        >
          SHADOW ACCORD
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-sm tracking-[0.3em] uppercase mb-2"
          style={{ color: '#64748b' }}
        >
          A Geopolitical Grand Strategy RPG
        </motion.p>

        {/* Decorative line below tagline */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.6, duration: 1, ease: 'easeOut' }}
          className="w-32 h-px mt-4 mb-16"
          style={{
            background: 'linear-gradient(90deg, transparent, #334155, transparent)',
          }}
        />

        {/* Menu Buttons */}
        <div className="flex flex-col items-center gap-3 w-72">
          {/* Continue (only if saves exist) */}
          {hasSaves && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              onClick={handleContinue}
              className="w-full py-3.5 rounded text-sm font-bold tracking-[0.2em] uppercase transition-all duration-300 border"
              style={{
                backgroundColor: 'rgba(59,130,246,0.1)',
                borderColor: 'rgba(59,130,246,0.3)',
                color: '#93c5fd',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.2)';
                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)';
                e.currentTarget.style.boxShadow = '0 0 25px rgba(59,130,246,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(59,130,246,0.1)';
                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Continue
            </motion.button>
          )}

          {/* New Game */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: hasSaves ? 0.9 : 0.8, duration: 0.5 }}
            onClick={handleNewGame}
            className="w-full py-3.5 rounded text-sm font-bold tracking-[0.2em] uppercase transition-all duration-300 border"
            style={{
              backgroundColor: '#111827',
              borderColor: '#1e293b',
              color: '#e2e8f0',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1e293b';
              e.currentTarget.style.borderColor = '#334155';
              e.currentTarget.style.boxShadow = '0 0 25px rgba(59,130,246,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#111827';
              e.currentTarget.style.borderColor = '#1e293b';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            New Game
          </motion.button>

          {/* Load Game */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: hasSaves ? 1.0 : 0.9, duration: 0.5 }}
            onClick={handleLoadGame}
            className="w-full py-3.5 rounded text-sm font-bold tracking-[0.2em] uppercase transition-all duration-300 border"
            style={{
              backgroundColor: '#111827',
              borderColor: '#1e293b',
              color: '#94a3b8',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1e293b';
              e.currentTarget.style.borderColor = '#334155';
              e.currentTarget.style.color = '#e2e8f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#111827';
              e.currentTarget.style.borderColor = '#1e293b';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            Load Game
          </motion.button>
        </div>

        {/* Version / footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="mt-16 text-xs tracking-wider"
          style={{ color: '#1e293b' }}
        >
          v0.1.0 &middot; CLASSIFIED
        </motion.p>
      </div>
    </div>
  );
}
