'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { FACTION_COLORS } from '@/data/factions';

export default function BottomBar() {
  const playerFaction = useGameStore((s) => s.playerFaction);

  const newsTicker = useGameStore((s) => s.newsTicker) ?? [];

  const accentColor = playerFaction ? FACTION_COLORS[playerFaction] : '#6B7280';

  const hasNews = newsTicker.length > 0;
  const tickerText = hasNews
    ? newsTicker.join('  \u2022  ')
    : '';

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full h-10 flex items-center overflow-hidden select-none shrink-0 relative"
      style={{
        backgroundColor: '#111827',
        borderTop: `1px solid ${accentColor}33`,
      }}
    >
      {/* Label */}
      <div
        className="px-3 h-full flex items-center shrink-0 z-10"
        style={{
          backgroundColor: '#111827',
          borderRight: `1px solid ${accentColor}33`,
        }}
      >
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: accentColor }}
        >
          Sitrep
        </span>
      </div>

      {/* Ticker area */}
      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        {!hasNews ? (
          <span className="text-[11px] text-gray-600 uppercase tracking-wider px-4 font-mono">
            Awaiting intelligence...
          </span>
        ) : (
          <div className="ticker-scroll flex items-center whitespace-nowrap">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-mono px-4">
              {tickerText}
            </span>
            {/* Duplicate for seamless loop */}
            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-mono px-4">
              {tickerText}
            </span>
          </div>
        )}
      </div>

      {/* Inline keyframes for ticker animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        .ticker-scroll {
          animation: ticker-slide ${Math.max(newsTicker.length * 4, 12)}s linear infinite;
        }
        @keyframes ticker-slide {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}} />
    </motion.div>
  );
}
