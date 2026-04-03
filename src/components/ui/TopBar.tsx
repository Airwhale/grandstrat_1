'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { FACTION_COLORS } from '@/data/factions';

export default function TopBar() {
  const {
    turn,
    phase,
    playerFaction,
    factions,
    saves,
    saveGame,
    loadGame,
    getSaves,
    setPhase,
  } = useGameStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const playerData = playerFaction ? factions[playerFaction] : null;
  const resources = playerData?.resources;
  const accentColor = playerFaction ? FACTION_COLORS[playerFaction] : '#6B7280';

  const actionsRemaining = useGameStore((s) => s.actionsRemaining) ?? 5;

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function formatTimestamp(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const phaseLabels: Record<string, string> = {
    menu: 'Main Menu',
    faction_select: 'Faction Select',
    strategic: 'Strategic Phase',
    tactical: 'Tactical Combat',
    event: 'Event',
    diplomacy_screen: 'Diplomacy',
    tech_screen: 'Research',
    roster_screen: 'Roster',
    gameover: 'Game Over',
    victory: 'Victory',
  };

  const resourceItems = [
    { key: 'credits', icon: '\u{1FA99}', label: 'Credits' },
    { key: 'techPoints', icon: '\u{1F9EA}', label: 'Tech Points' },
    { key: 'influence', icon: '\u{1F3AD}', label: 'Influence' },
    { key: 'rareMaterials', icon: '\u2699\uFE0F', label: 'Rare Materials' },
    { key: 'manpower', icon: '\u{1F465}', label: 'Manpower' },
  ] as const;

  return (
    <div
      className="w-full h-12 flex items-center justify-between px-4 select-none shrink-0"
      style={{
        backgroundColor: '#111827',
        borderBottom: `1px solid ${accentColor}33`,
      }}
    >
      {/* Left: Turn & Phase */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: accentColor }}
          >
            Turn
          </span>
          <span className="font-mono text-white text-lg font-bold">
            {turn}
          </span>
        </div>
        <div
          className="text-xs uppercase tracking-wider px-2 py-0.5 rounded"
          style={{
            backgroundColor: `${accentColor}22`,
            color: accentColor,
            border: `1px solid ${accentColor}44`,
          }}
        >
          {phaseLabels[phase] ?? phase}
        </div>
      </div>

      {/* Center: Resources */}
      <div className="flex items-center gap-5">
        {resources &&
          resourceItems.map(({ key, icon, label }) => (
            <div
              key={key}
              className="flex items-center gap-1 group relative"
              title={label}
            >
              <span className="text-sm">{icon}</span>
              <span className="font-mono text-white text-sm font-semibold">
                {resources[key as keyof typeof resources]}
              </span>
              {/* Tooltip */}
              <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-gray-900 text-gray-300 text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-700 z-50">
                {label}
              </span>
            </div>
          ))}
      </div>

      {/* Right: Actions + Menu */}
      <div className="flex items-center gap-4">
        {/* Actions Remaining */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400 uppercase tracking-wider">
            Actions
          </span>
          <span
            className="font-mono text-sm font-bold px-1.5 py-0.5 rounded"
            style={{
              color: actionsRemaining > 0 ? accentColor : '#EF4444',
              backgroundColor:
                actionsRemaining > 0 ? `${accentColor}22` : '#EF444422',
            }}
          >
            {actionsRemaining}/5
          </span>
        </div>

        {/* Menu Button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => {
              getSaves();
              setMenuOpen((o) => !o);
            }}
            className="flex flex-col gap-[3px] p-2 rounded hover:bg-gray-800 transition-colors"
            aria-label="Menu"
          >
            <span className="block w-4 h-[2px] bg-gray-300" />
            <span className="block w-4 h-[2px] bg-gray-300" />
            <span className="block w-4 h-[2px] bg-gray-300" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-10 w-72 rounded-lg shadow-2xl z-50 overflow-hidden"
                style={{
                  backgroundColor: '#1F2937',
                  border: `1px solid ${accentColor}44`,
                }}
              >
                {/* Header */}
                <div
                  className="px-4 py-2 text-xs font-bold uppercase tracking-widest"
                  style={{
                    backgroundColor: `${accentColor}22`,
                    color: accentColor,
                    borderBottom: `1px solid ${accentColor}33`,
                  }}
                >
                  Save / Load
                </div>

                {/* Autosave */}
                <div className="px-4 py-2 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 uppercase">
                      Autosave
                    </span>
                    {(() => {
                      const autoSlot = saves.find((s) => s.id === 0);
                      return autoSlot ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500 font-mono">
                            {formatTimestamp(autoSlot.timestamp)}
                          </span>
                          <button
                            onClick={() => {
                              loadGame(0);
                              setMenuOpen(false);
                            }}
                            className="text-[10px] px-2 py-0.5 rounded hover:bg-gray-700 transition-colors"
                            style={{ color: accentColor }}
                          >
                            Load
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-600 italic">
                          Empty
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Save Slots 1-3 */}
                {[1, 2, 3].map((slotId) => {
                  const slot = saves.find((s) => s.id === slotId);
                  return (
                    <div
                      key={slotId}
                      className="px-4 py-2 border-b border-gray-700/50 hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-gray-300 font-semibold">
                            Slot {slotId}
                          </span>
                          {slot && (
                            <span className="text-[10px] text-gray-500 font-mono ml-2">
                              T{slot.turn} &mdash;{' '}
                              {formatTimestamp(slot.timestamp)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              saveGame(slotId);
                              getSaves();
                            }}
                            className="text-[10px] px-2 py-0.5 rounded hover:bg-gray-700 transition-colors text-blue-400"
                          >
                            Save
                          </button>
                          {slot && (
                            <button
                              onClick={() => {
                                loadGame(slotId);
                                setMenuOpen(false);
                              }}
                              className="text-[10px] px-2 py-0.5 rounded hover:bg-gray-700 transition-colors"
                              style={{ color: accentColor }}
                            >
                              Load
                            </button>
                          )}
                        </div>
                      </div>
                      {!slot && (
                        <span className="text-[10px] text-gray-600 italic">
                          Empty
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* Settings */}
                <div className="px-4 py-2 border-b border-gray-700/50">
                  <button className="text-xs text-gray-400 hover:text-gray-200 transition-colors flex items-center gap-2 w-full">
                    <span>&#9881;</span> Settings
                  </button>
                </div>

                {/* Back to Menu */}
                <div className="px-4 py-2">
                  <button
                    onClick={() => {
                      setPhase('menu');
                      setMenuOpen(false);
                    }}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-2 w-full"
                  >
                    <span>&#x2716;</span> Quit to Menu
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
