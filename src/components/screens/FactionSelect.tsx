'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { FACTION_COLORS, FACTION_NAMES, FACTION_DESCRIPTIONS } from '@/data/factions';
import type { FactionId, Difficulty } from '@/types';

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

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; desc: string }[] = [
  { value: 'normal', label: 'NORMAL', desc: 'Standard experience. Forgiving AI and resource pacing.' },
  { value: 'hard', label: 'HARD', desc: 'Aggressive AI, reduced income, higher unrest.' },
  { value: 'ironman', label: 'IRONMAN', desc: 'One save slot. Permadeath. No reloads. You have been warned.' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function DifficultyDots({ count, color }: { count: number; color: string }) {
  return (
    <span className="inline-flex gap-1 items-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className="inline-block w-2 h-2 rounded-full"
          style={{
            backgroundColor: i < count ? color : '#374151',
          }}
        />
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FactionSelect() {
  const initGame = useGameStore((s) => s.initGame);
  const setPhase = useGameStore((s) => s.setPhase);

  const [selected, setSelected] = useState<FactionId | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');

  const handleBegin = () => {
    if (!selected) return;
    initGame(selected, difficulty);
  };

  const handleBack = () => {
    setSelected(null);
  };

  const handleBackToMenu = () => {
    setPhase('menu');
  };

  // ------ Render selected faction detail panel ------
  const renderDetail = () => {
    if (!selected) return null;
    const info = FACTION_DESCRIPTIONS[selected];
    const color = FACTION_COLORS[selected];
    const name = FACTION_NAMES[selected];

    return (
      <motion.div
        key="detail"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-1.5 h-12 rounded-sm"
            style={{ backgroundColor: color }}
          />
          <div>
            <h2
              className="text-3xl font-bold tracking-wide"
              style={{ color }}
            >
              {name}
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">{info.tagline}</p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider">
            Difficulty <DifficultyDots count={info.difficulty} color={color} />
          </div>
        </div>

        {/* Body grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Lore */}
          <div
            className="rounded-lg p-5 border"
            style={{
              backgroundColor: '#111827',
              borderColor: hexToRgba(color, 0.2),
            }}
          >
            <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-3">
              Intelligence Briefing
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">{info.lore}</p>
          </div>

          {/* Strengths / Weaknesses */}
          <div
            className="rounded-lg p-5 border"
            style={{
              backgroundColor: '#111827',
              borderColor: hexToRgba(color, 0.2),
            }}
          >
            <div className="mb-4">
              <h3 className="text-xs uppercase tracking-widest text-emerald-500 mb-1">
                Strength
              </h3>
              <p className="text-sm text-slate-300">{info.strength}</p>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-widest text-red-400 mb-1">
                Weakness
              </h3>
              <p className="text-sm text-slate-300">{info.weakness}</p>
            </div>
          </div>

          {/* Special Ability */}
          <div
            className="rounded-lg p-5 border"
            style={{
              backgroundColor: '#111827',
              borderColor: hexToRgba(color, 0.2),
            }}
          >
            <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-1">
              Special Ability
            </h3>
            <p className="text-base font-semibold mb-1" style={{ color }}>
              {info.ability}
            </p>
            <p className="text-sm text-slate-400">{info.abilityDesc}</p>
          </div>

          {/* Unique Unit */}
          <div
            className="rounded-lg p-5 border"
            style={{
              backgroundColor: '#111827',
              borderColor: hexToRgba(color, 0.2),
            }}
          >
            <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-1">
              Unique Unit
            </h3>
            <p className="text-base font-semibold mb-1" style={{ color }}>
              {info.uniqueUnit}
            </p>
            <p className="text-sm text-slate-400">{info.uniqueUnitDesc}</p>
          </div>
        </div>

        {/* Difficulty selector */}
        <div className="mb-8">
          <h3 className="text-xs uppercase tracking-widest text-slate-500 mb-3">
            Operation Difficulty
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {DIFFICULTY_OPTIONS.map((opt) => {
              const isActive = difficulty === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setDifficulty(opt.value)}
                  className="rounded-lg p-4 border text-left transition-all duration-200"
                  style={{
                    backgroundColor: isActive ? hexToRgba(color, 0.1) : '#111827',
                    borderColor: isActive ? color : '#1e293b',
                    boxShadow: isActive ? `0 0 20px ${hexToRgba(color, 0.15)}` : 'none',
                  }}
                >
                  <p
                    className="text-sm font-bold tracking-wider mb-1"
                    style={{ color: isActive ? color : '#94a3b8' }}
                  >
                    {opt.label}
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="px-6 py-3 rounded border border-slate-700 text-slate-400 text-sm tracking-wider uppercase hover:border-slate-500 hover:text-slate-200 transition-colors"
          >
            Back
          </button>

          <motion.button
            onClick={handleBegin}
            animate={{
              boxShadow: [
                `0 0 20px ${hexToRgba(color, 0.3)}`,
                `0 0 40px ${hexToRgba(color, 0.6)}`,
                `0 0 20px ${hexToRgba(color, 0.3)}`,
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex-1 py-3.5 rounded font-bold text-sm tracking-[0.2em] uppercase transition-all duration-200 hover:brightness-110"
            style={{
              backgroundColor: color,
              color: '#080c14',
            }}
          >
            Begin Operation
          </motion.button>
        </div>
      </motion.div>
    );
  };

  // ------ Render card grid ------
  const renderGrid = () => (
    <motion.div
      key="grid"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl mx-auto"
    >
      {FACTION_IDS.map((fid, i) => {
        const info = FACTION_DESCRIPTIONS[fid];
        const color = FACTION_COLORS[fid];
        const name = FACTION_NAMES[fid];

        return (
          <motion.button
            key={fid}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4, ease: 'easeOut' }}
            whileHover={{
              scale: 1.03,
              boxShadow: `0 0 30px ${hexToRgba(color, 0.25)}`,
            }}
            onClick={() => setSelected(fid)}
            className="relative text-left rounded-lg p-5 border transition-colors duration-200 group"
            style={{
              backgroundColor: '#111827',
              borderColor: '#1e293b',
              borderLeftWidth: '4px',
              borderLeftColor: color,
            }}
          >
            {/* Name */}
            <h3
              className="text-lg font-bold tracking-wide mb-1 transition-colors"
              style={{ color }}
            >
              {name}
            </h3>

            {/* Tagline */}
            <p className="text-xs text-slate-400 mb-3">{info.tagline}</p>

            {/* Difficulty */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="uppercase tracking-wider">Difficulty</span>
              <DifficultyDots count={info.difficulty} color={color} />
            </div>

            {/* Hover detail preview */}
            <div className="mt-3 max-h-0 overflow-hidden opacity-0 group-hover:max-h-40 group-hover:opacity-100 transition-all duration-300">
              <div className="pt-3 border-t border-slate-700/50">
                <p className="text-xs text-slate-400 mb-2 leading-relaxed line-clamp-2">
                  {info.lore}
                </p>
                <p className="text-xs text-slate-500">
                  <span className="text-emerald-500">+</span> {info.strength.split(';')[0]}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  <span className="text-red-400">-</span> {info.weakness.split(';')[0]}
                </p>
              </div>
            </div>
          </motion.button>
        );
      })}
    </motion.div>
  );

  // ------ Main ------
  return (
    <div
      className="fixed inset-0 overflow-y-auto flex flex-col items-center"
      style={{ backgroundColor: '#080c14' }}
    >
      {/* Scanline overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-10"
        style={{
          background:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 3px)',
          animation: 'scanlines 8s linear infinite',
        }}
      />

      {/* Content */}
      <div className="relative z-20 w-full max-w-6xl px-6 py-10 flex flex-col items-center min-h-screen">
        {/* Back to menu */}
        {!selected && (
          <button
            onClick={handleBackToMenu}
            className="self-start mb-4 text-xs uppercase tracking-widest text-slate-600 hover:text-slate-400 transition-colors"
          >
            &larr; Main Menu
          </button>
        )}

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-bold tracking-[0.25em] mb-2 text-center"
          style={{
            color: '#e2e8f0',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          SHADOW ACCORD
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-sm tracking-[0.3em] uppercase mb-10 text-center"
          style={{ color: '#94a3b8' }}
        >
          Select Your Faction
        </motion.p>

        {/* Body — either grid or detail */}
        <AnimatePresence mode="wait">
          {selected ? renderDetail() : renderGrid()}
        </AnimatePresence>
      </div>
    </div>
  );
}
