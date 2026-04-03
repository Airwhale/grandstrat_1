'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EventModal() {
  const currentEvent = useGameStore((s) => s.currentEvent);

  if (!currentEvent) return null;

  function handleChoice(choiceId: string) {
    const store = useGameStore.getState() as any;
    if (typeof store.resolveEvent === 'function') {
      store.resolveEvent(choiceId);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Scanline overlay */}
        <div
          className="pointer-events-none fixed inset-0 z-[71]"
          style={{
            background:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
          }}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative z-[72] w-full max-w-xl mx-4 rounded-lg border overflow-hidden"
          style={{
            borderColor: '#ef444466',
            backgroundColor: '#080c14',
            boxShadow: '0 0 60px rgba(239, 68, 68, 0.12), 0 0 120px rgba(239, 68, 68, 0.06)',
          }}
        >
          {/* Top glow bar */}
          <div
            className="h-0.5 w-full"
            style={{
              background: 'linear-gradient(90deg, transparent, #ef4444, transparent)',
            }}
          />

          {/* Header */}
          <div className="px-6 pt-5 pb-3">
            {/* Classified stamp */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="px-3 py-1 rounded border text-[10px] font-bold tracking-[0.3em] uppercase"
                style={{
                  borderColor: '#ef444455',
                  color: '#ef4444',
                  backgroundColor: '#ef444412',
                }}
              >
                CLASSIFIED
              </div>
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-[10px] text-slate-600 tracking-wider uppercase">
                {currentEvent.type === 'global'
                  ? 'GLOBAL EVENT'
                  : currentEvent.type === 'faction'
                    ? 'FACTION INTEL'
                    : 'TERRITORIAL REPORT'}
              </span>
            </div>

            {/* Intel Briefing label */}
            <p
              className="text-xs tracking-[0.4em] uppercase mb-3"
              style={{
                color: '#64748b',
                textShadow: '0 0 10px rgba(100, 116, 139, 0.2)',
              }}
            >
              INTEL BRIEFING
            </p>

            {/* Event name */}
            <h2
              className="text-xl font-bold tracking-wider mb-3"
              style={{
                color: '#e2e8f0',
                textShadow: '0 0 20px rgba(226, 232, 240, 0.1)',
              }}
            >
              {currentEvent.name}
            </h2>

            {/* Description */}
            <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
              {currentEvent.description}
            </p>
          </div>

          {/* Divider */}
          <div className="mx-6 h-px bg-slate-800" />

          {/* Choices */}
          <div className="px-6 py-5 space-y-3">
            <p className="text-[10px] text-slate-600 tracking-[0.2em] uppercase mb-2">
              RESPONSE OPTIONS
            </p>
            {currentEvent.choices.map((choice, i) => (
              <motion.button
                key={choice.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                onClick={() => handleChoice(choice.id)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full text-left rounded-lg border p-4 transition-all hover:bg-slate-900/80 group"
                style={{
                  borderColor: '#1e293b',
                  backgroundColor: '#0d1220',
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Choice index marker */}
                  <div
                    className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-bold mt-0.5 group-hover:border-slate-500 transition-colors"
                    style={{
                      borderWidth: 1,
                      borderColor: '#334155',
                      color: '#94a3b8',
                      backgroundColor: '#0f172a',
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4
                      className="text-sm font-semibold group-hover:text-slate-100 transition-colors"
                      style={{ color: '#cbd5e1' }}
                    >
                      {choice.label}
                    </h4>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: '#64748b' }}>
                      {choice.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Bottom glow bar */}
          <div
            className="h-0.5 w-full"
            style={{
              background: 'linear-gradient(90deg, transparent, #ef444444, transparent)',
            }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
