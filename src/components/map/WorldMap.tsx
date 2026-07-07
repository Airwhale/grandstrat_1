'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { FACTION_COLORS, FACTION_NAMES } from '@/data/factions';
import type { FactionId, Territory, Building } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function factionColor(controller: FactionId | null): string {
  return controller ? FACTION_COLORS[controller] : '#555';
}

function factionFill(controller: FactionId | null): string {
  if (!controller) return '#333';
  const hex = FACTION_COLORS[controller];
  // Return the colour at 30 % opacity via rgba
  return hexToRgba(hex, 0.3);
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function unrestColor(unrest: number): string {
  if (unrest < 30) return '#22c55e';
  if (unrest <= 60) return '#eab308';
  return '#ef4444';
}

function buildingLabel(b: Building): string {
  const labels: Record<string, string> = {
    base: 'Base',
    lab: 'Research Lab',
    factory: 'Factory',
    hospital: 'Hospital',
    spyNetwork: 'Spy Network',
    bank: 'Bank',
    mediaCenter: 'Media Center',
    fortress: 'Fortress',
    recruitCenter: 'Recruit Center',
  };
  return `${labels[b.type] ?? b.type} Lv${b.level}`;
}

const FORTIFICATION_LABELS = ['None', 'Light', 'Medium', 'Heavy'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WorldMap() {
  // --- Store ---
  const territories = useGameStore((s) => s.territories);
  const playerFaction = useGameStore((s) => s.playerFaction);
  const selectedTerritory = useGameStore((s) => s.selectedTerritory);
  const selectTerritory = useGameStore((s) => s.selectTerritory);
  const factions = useGameStore((s) => s.factions);

  // --- Local state ---
  const [zoom, setZoom] = useState(1);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Derived data ---
  const territoryList = useMemo(() => Object.values(territories), [territories]);

  /** Set of territory ids the player controls */
  const playerTerritoryIds = useMemo(() => {
    const set = new Set<string>();
    for (const t of territoryList) {
      if (t.controller === playerFaction) set.add(t.id);
    }
    return set;
  }, [territoryList, playerFaction]);

  /** Set of territory ids adjacent to any player-owned territory (visible) */
  const visibleTerritoryIds = useMemo(() => {
    const set = new Set<string>();
    for (const t of territoryList) {
      if (t.controller === playerFaction) {
        set.add(t.id);
        for (const adj of t.adjacency) set.add(adj);
      }
    }
    return set;
  }, [territoryList, playerFaction]);

  /** Set of territory ids that are contested (player-owned & adjacent to enemy) */
  const contestedIds = useMemo(() => {
    const set = new Set<string>();
    for (const t of territoryList) {
      if (t.controller !== playerFaction) continue;
      for (const adjId of t.adjacency) {
        const adj = territories[adjId];
        if (adj && adj.controller !== null && adj.controller !== playerFaction) {
          set.add(t.id);
          break;
        }
      }
    }
    return set;
  }, [territoryList, territories, playerFaction]);

  /** Soft region blobs suggesting continents behind the node graph */
  const regionBlobs = useMemo(() => {
    const byRegion = new Map<string, { x: number; y: number }[]>();
    for (const t of territoryList) {
      if (t.region === 'City-States') continue;
      const arr = byRegion.get(t.region) ?? [];
      arr.push(t.position);
      byRegion.set(t.region, arr);
    }
    return Array.from(byRegion.entries()).map(([region, pts]) => {
      const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
      const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
      const rx = Math.max(5, Math.max(...pts.map(p => Math.abs(p.x - cx))) + 4);
      const ry = Math.max(4, Math.max(...pts.map(p => Math.abs(p.y - cy))) + 4);
      return { region, cx, cy, rx, ry };
    });
  }, [territoryList]);

  /** Adjacency edges (deduplicated) */
  const edges = useMemo(() => {
    const seen = new Set<string>();
    const result: { from: Territory; to: Territory; isSupply: boolean }[] = [];
    for (const t of territoryList) {
      for (const adjId of t.adjacency) {
        const key = [t.id, adjId].sort().join('--');
        if (seen.has(key)) continue;
        seen.add(key);
        const adj = territories[adjId];
        if (!adj) continue;
        const isSupply =
          t.controller === playerFaction &&
          adj.controller === playerFaction;
        result.push({ from: t, to: adj, isSupply });
      }
    }
    return result;
  }, [territoryList, territories, playerFaction]);

  // --- Handlers ---
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      setZoom((z) => Math.min(3, Math.max(0.5, z - e.deltaY * 0.001)));
    },
    [],
  );

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(3, z + 0.2)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(0.5, z - 0.2)), []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleTerritoryClick = useCallback(
    (id: string) => {
      selectTerritory(selectedTerritory === id ? null : id);
    },
    [selectTerritory, selectedTerritory],
  );

  // Prevent default scroll on the container so wheel zoom works
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const prevent = (e: WheelEvent) => e.preventDefault();
    el.addEventListener('wheel', prevent, { passive: false });
    return () => el.removeEventListener('wheel', prevent);
  }, []);

  // --- Hovered territory data ---
  const hoveredTerritory = hoveredId ? territories[hoveredId] : null;

  // --- Render ---
  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerMove={handlePointerMove}
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        background:
          'radial-gradient(ellipse at 50% 40%, #0f1729 0%, #080c14 70%)',
        backgroundSize: '100% 100%',
      }}
    >
      {/* Subtle grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Scalable layer */}
      <div
        className="relative w-full h-full origin-center transition-transform duration-200 ease-out"
        style={{ transform: `scale(${zoom})` }}
      >
        {/* Soft landmass blobs + region labels for geographic readability */}
        {regionBlobs.map((b) => (
          <div key={b.region} className="absolute pointer-events-none" style={{ left: 0, top: 0, width: '100%', height: '100%' }}>
            <div
              className="absolute rounded-[50%]"
              style={{
                left: `${b.cx - b.rx}%`,
                top: `${b.cy - b.ry}%`,
                width: `${b.rx * 2}%`,
                height: `${b.ry * 2}%`,
                background: 'radial-gradient(ellipse at center, rgba(148,163,184,0.08) 0%, rgba(148,163,184,0.035) 55%, transparent 78%)',
              }}
            />
            <span
              className="absolute text-[9px] uppercase tracking-[0.35em] font-semibold whitespace-nowrap -translate-x-1/2"
              style={{ left: `${b.cx}%`, top: `${b.cy - b.ry - 1.5}%`, color: 'rgba(148,163,184,0.22)' }}
            >
              {b.region}
            </span>
          </div>
        ))}

        {/* SVG lines layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            {/* Animated dash pattern for supply routes */}
            <style>{`
              @keyframes dash-scroll {
                to { stroke-dashoffset: -24; }
              }
              .supply-line {
                animation: dash-scroll 1.2s linear infinite;
              }
              @keyframes pulse-ring {
                0%, 100% { opacity: 0.6; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.15); }
              }
            `}</style>
          </defs>

          {/* Connection lines */}
          {edges.map(({ from, to, isSupply }) => {
            const playerColor = playerFaction
              ? FACTION_COLORS[playerFaction]
              : '#3B82F6';

            return (
              <g key={`${from.id}--${to.id}`}>
                {/* Base thin line */}
                <line
                  x1={`${from.position.x}%`}
                  y1={`${from.position.y}%`}
                  x2={`${to.position.x}%`}
                  y2={`${to.position.y}%`}
                  stroke="#1e293b"
                  strokeWidth={1}
                />
                {/* Supply route overlay */}
                {isSupply && (
                  <line
                    x1={`${from.position.x}%`}
                    y1={`${from.position.y}%`}
                    x2={`${to.position.x}%`}
                    y2={`${to.position.y}%`}
                    stroke={hexToRgba(playerColor, 0.4)}
                    strokeWidth={2}
                    strokeDasharray="6 6"
                    className="supply-line"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Territory nodes */}
        {territoryList.map((t) => {
          const isCityState = t.region === 'City-States';
          const radius = isCityState ? 16 : 24;
          const color = factionColor(t.controller);
          const fill = factionFill(t.controller);
          const isSelected = selectedTerritory === t.id;
          const isContested = contestedIds.has(t.id);
          const isVisible = visibleTerritoryIds.has(t.id);
          const isHovered = hoveredId === t.id;

          return (
            <motion.div
              key={t.id}
              className="absolute flex items-center justify-center cursor-pointer"
              style={{
                left: `${t.position.x}%`,
                top: `${t.position.y}%`,
                width: radius * 2,
                height: radius * 2,
                marginLeft: -radius,
                marginTop: -radius,
                zIndex: isSelected ? 30 : isHovered ? 20 : 10,
                opacity: isVisible ? 1 : 0.35,
                filter: isVisible ? 'none' : 'blur(1px)',
                transition: 'opacity 0.3s, filter 0.3s',
              }}
              whileHover={{ scale: 1.15 }}
              animate={
                isContested
                  ? {
                      scale: [1, 1.08, 1],
                      transition: { repeat: Infinity, duration: 1.6, ease: 'easeInOut' },
                    }
                  : isSelected
                    ? { scale: 1.2 }
                    : { scale: 1 }
              }
              onClick={() => handleTerritoryClick(t.id)}
              onPointerEnter={() => setHoveredId(t.id)}
              onPointerLeave={() => setHoveredId(null)}
            >
              {/* Glow */}
              {t.controller && (
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    boxShadow: `0 0 ${isSelected ? 18 : 10}px ${hexToRgba(color, isSelected ? 0.7 : 0.45)}`,
                  }}
                />
              )}

              {/* Selected ring */}
              {isSelected && (
                <motion.div
                  className="absolute rounded-full"
                  style={{
                    inset: -4,
                    border: `2px solid ${color}`,
                    opacity: 0.9,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              )}

              {/* Node circle */}
              <svg
                width={radius * 2}
                height={radius * 2}
                viewBox={`0 0 ${radius * 2} ${radius * 2}`}
                className="absolute inset-0"
              >
                <circle
                  cx={radius}
                  cy={radius}
                  r={radius - 2}
                  fill={fill}
                  stroke={color}
                  strokeWidth={2}
                />
                {/* Inner icon: troop count text */}
                <text
                  x={radius}
                  y={radius}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="rgba(255,255,255,0.85)"
                  fontSize={isCityState ? 9 : 11}
                  fontWeight={600}
                  fontFamily="monospace"
                >
                  {t.troops}
                </text>
              </svg>

              {/* Rare materials indicator */}
              {t.hasRareMaterials && (
                <div
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-yellow-500/60"
                  style={{ background: '#f59e0b' }}
                  title="Rare Materials"
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredTerritory && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 pointer-events-none rounded-lg border border-white/10 shadow-2xl"
            style={{
              left: tooltipPos.x + 16,
              top: tooltipPos.y + 16,
              background: 'rgba(8,12,20,0.95)',
              backdropFilter: 'blur(12px)',
              maxWidth: 280,
            }}
          >
            <div className="px-4 py-3 space-y-2 text-sm text-gray-200">
              {/* Name */}
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ background: factionColor(hoveredTerritory.controller) }}
                />
                <span className="font-semibold text-white tracking-wide">
                  {hoveredTerritory.name}
                </span>
              </div>

              {/* Controller */}
              <div className="text-xs text-gray-400">
                {hoveredTerritory.controller
                  ? FACTION_NAMES[hoveredTerritory.controller]
                  : 'Neutral'}
              </div>

              <div className="h-px bg-white/5" />

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                <div className="text-gray-500">Troops</div>
                <div className="text-right font-mono text-gray-200">
                  {hoveredTerritory.troops}
                </div>

                <div className="text-gray-500">Terrain</div>
                <div className="text-right capitalize text-gray-200">
                  {hoveredTerritory.terrain}
                </div>

                <div className="text-gray-500">Unrest</div>
                <div
                  className="text-right font-mono"
                  style={{ color: unrestColor(hoveredTerritory.unrest) }}
                >
                  {hoveredTerritory.unrest}%
                </div>

                <div className="text-gray-500">Fortification</div>
                <div className="text-right text-gray-200">
                  {FORTIFICATION_LABELS[hoveredTerritory.fortification] ?? hoveredTerritory.fortification}
                </div>
              </div>

              {/* Buildings */}
              {hoveredTerritory.buildings.length > 0 && (
                <>
                  <div className="h-px bg-white/5" />
                  <div className="text-xs text-gray-400">Buildings</div>
                  <div className="flex flex-wrap gap-1">
                    {hoveredTerritory.buildings.map((b, i) => (
                      <span
                        key={i}
                        className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-gray-300"
                      >
                        {buildingLabel(b)}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {/* Rare Materials badge */}
              {hoveredTerritory.hasRareMaterials && (
                <div className="inline-flex items-center gap-1 rounded bg-yellow-500/15 px-2 py-0.5 text-[10px] font-semibold text-yellow-400 tracking-wider uppercase">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400" />
                  Rare Materials
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zoom controls */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-40">
        <button
          onClick={handleZoomIn}
          className="w-9 h-9 flex items-center justify-center rounded-md border border-white/10 bg-black/60 text-white/80 hover:bg-white/10 hover:text-white transition-colors text-lg font-mono backdrop-blur-md"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="w-9 h-9 flex items-center justify-center rounded-md border border-white/10 bg-black/60 text-white/80 hover:bg-white/10 hover:text-white transition-colors text-lg font-mono backdrop-blur-md"
          aria-label="Zoom out"
        >
          &minus;
        </button>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-6 left-6 text-[10px] font-mono text-white/30 z-40">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
