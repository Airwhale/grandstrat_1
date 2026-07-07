'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { FACTION_COLORS } from '@/data/factions';
import { calculateHitChance } from '@/store/helpers';
import Tooltip from '@/components/ui/Tooltip';
import type { TileType } from '@/types';

const TILE_SIZE = 40;
const TILE_GAP = 1;

// Fixed unit colors for readability regardless of player faction
const FRIENDLY_COLOR = '#3B82F6';
const ENEMY_COLOR = '#EF4444';

const TILE_COLORS: Record<TileType, string> = {
  floor: '#1a1a2e',
  wall: '#0a0a0f',
  halfCover: '#2a2a3e',
  fullCover: '#1e3a1e',
  highGround: '#2e2e1e',
  water: '#1a2a3e',
  hazard: '#3e1a1a',
  objective: '#3e3a1a',
};

const COVER_ICONS: Partial<Record<TileType, string>> = {
  halfCover: '◧',
  fullCover: '◼',
  highGround: '▲',
  water: '~',
  hazard: '⚠',
  objective: '★',
};

function getClassInitial(cls: string): string {
  const map: Record<string, string> = {
    assault: 'A', sharpshooter: 'S', heavy: 'H', medic: 'M',
    infiltrator: 'I', specialist: 'T', cyberGhost: 'C', spetsnazVanguard: 'V',
    silkAgent: 'K', sufiPhantom: 'P', bushveldRanger: 'R', ghostBroker: 'G',
    militia: 'm', turret: 't', drone: 'd',
  };
  return map[cls] || '?';
}

export default function TacticalGrid() {
  const grid = useGameStore((s) => s.grid);
  const tacticalUnits = useGameStore((s) => s.tacticalUnits);
  const mission = useGameStore((s) => s.mission);
  const combatLog = useGameStore((s) => s.combatLog);
  const playerFaction = useGameStore((s) => s.playerFaction);
  const setPhase = useGameStore((s) => s.setPhase);

  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<'move' | 'attack' | null>(null);
  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);

  const accentColor = playerFaction ? FACTION_COLORS[playerFaction] : '#3B82F6';

  const selectedUnit = useMemo(
    () => tacticalUnits.find((u) => u.id === selectedUnitId) ?? null,
    [tacticalUnits, selectedUnitId],
  );

  const playerUnits = useMemo(
    () => tacticalUnits.filter((u) => u.isPlayer),
    [tacticalUnits],
  );

  const enemyUnits = useMemo(
    () => tacticalUnits.filter((u) => !u.isPlayer),
    [tacticalUnits],
  );

  // Calculate movement range for selected unit
  const moveRange = useMemo(() => {
    if (!selectedUnit || actionMode !== 'move') return new Set<string>();
    const range = new Set<string>();
    const mob = selectedUnit.mobility;
    for (let dy = -mob; dy <= mob; dy++) {
      for (let dx = -mob; dx <= mob; dx++) {
        if (Math.abs(dx) + Math.abs(dy) > mob) continue;
        const nx = selectedUnit.position.x + dx;
        const ny = selectedUnit.position.y + dy;
        if (ny >= 0 && ny < grid.length && nx >= 0 && nx < (grid[0]?.length ?? 0)) {
          const tile = grid[ny]?.[nx];
          const occupied = tacticalUnits.some(u => u.hp > 0 && u.position.x === nx && u.position.y === ny);
          if (tile && tile.type !== 'wall' && tile.type !== 'water' && !occupied) {
            range.add(`${nx},${ny}`);
          }
        }
      }
    }
    return range;
  }, [selectedUnit, actionMode, grid, tacticalUnits]);

  // Attack range
  const attackRange = useMemo(() => {
    if (!selectedUnit || actionMode !== 'attack') return new Set<string>();
    const range = new Set<string>();
    const maxRange = 8;
    for (const enemy of enemyUnits) {
      if (enemy.hp <= 0) continue;
      const dx = Math.abs(enemy.position.x - selectedUnit.position.x);
      const dy = Math.abs(enemy.position.y - selectedUnit.position.y);
      if (dx + dy <= maxRange) {
        range.add(`${enemy.position.x},${enemy.position.y}`);
      }
    }
    return range;
  }, [selectedUnit, actionMode, enemyUnits]);

  // Hit chance per targetable enemy (shown as badges in attack mode)
  const targetHitChances = useMemo(() => {
    const map = new Map<string, number>();
    if (!selectedUnit || actionMode !== 'attack') return map;
    for (const enemy of enemyUnits) {
      if (enemy.hp <= 0) continue;
      if (attackRange.has(`${enemy.position.x},${enemy.position.y}`)) {
        map.set(enemy.id, calculateHitChance(selectedUnit, enemy, grid).hitPercent);
      }
    }
    return map;
  }, [selectedUnit, actionMode, enemyUnits, attackRange, grid]);

  // Full shot breakdown for the hovered target (transparency: why this %)
  const hoveredBreakdown = useMemo(() => {
    if (!selectedUnit || !hoveredTargetId || actionMode !== 'attack') return null;
    const target = tacticalUnits.find((u) => u.id === hoveredTargetId && u.hp > 0);
    if (!target || target.isPlayer) return null;
    return { targetName: target.name, ...calculateHitChance(selectedUnit, target, grid) };
  }, [selectedUnit, hoveredTargetId, actionMode, tacticalUnits, grid]);

  const handleTileClick = useCallback((x: number, y: number) => {
    const store = useGameStore.getState() as any;

    if (actionMode === 'move' && selectedUnit && moveRange.has(`${x},${y}`)) {
      if (store.moveUnit) store.moveUnit(selectedUnitId, x, y);
      setActionMode(null);
      return;
    }

    if (actionMode === 'attack' && selectedUnit) {
      const target = tacticalUnits.find((u) => u.hp > 0 && u.position.x === x && u.position.y === y && !u.isPlayer);
      if (target && store.attackUnit) {
        store.attackUnit(selectedUnitId, target.id);
        setActionMode(null);
        setHoveredTargetId(null);
        return;
      }
    }

    // Select unit on tile
    const unitOnTile = tacticalUnits.find((u) => u.hp > 0 && u.position.x === x && u.position.y === y && u.isPlayer);
    if (unitOnTile) {
      setSelectedUnitId(unitOnTile.id);
      setActionMode(null);
    }
  }, [actionMode, selectedUnit, selectedUnitId, moveRange, tacticalUnits]);

  const handleEndTurn = useCallback(() => {
    const store = useGameStore.getState() as any;
    if (store.endPlayerTurn) store.endPlayerTurn();
    setSelectedUnitId(null);
    setActionMode(null);
  }, []);

  const handleEndCombat = useCallback(() => {
    const store = useGameStore.getState() as any;
    if (store.endCombat) store.endCombat(mission?.result ?? 'retreat');
  }, [mission]);

  if (!grid.length || !mission) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#080c14]">
        <p className="text-slate-500">No active mission</p>
        <button onClick={() => setPhase('strategic')} className="ml-4 text-blue-400 text-sm underline">
          Return to Map
        </button>
      </div>
    );
  }

  const gridWidth = grid[0]?.length ?? 12;
  const gridHeight = grid.length;

  return (
    <div className="w-full h-full flex flex-col bg-[#080c14]">
      {/* Top bar */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-slate-800 bg-[#111827] shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accentColor }}>
            {mission.type} Mission
          </span>
          <span className="text-xs text-slate-500">Turn {mission.currentTurn}</span>
          <span className={`text-xs font-bold ${mission.playerTurn ? 'text-green-400' : 'text-red-400'}`}>
            {mission.playerTurn ? 'YOUR TURN' : 'ENEMY TURN'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {mission.objectives.map((obj) => (
            <span key={obj.id} className={`text-xs ${obj.isComplete ? 'text-green-400 line-through' : 'text-slate-400'}`}>
              {obj.isComplete ? '✓' : '○'} {obj.description}
            </span>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Grid area */}
        <div className="flex-1 flex items-center justify-center overflow-auto p-4">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${gridWidth}, ${TILE_SIZE}px)`,
              gridTemplateRows: `repeat(${gridHeight}, ${TILE_SIZE}px)`,
              gap: `${TILE_GAP}px`,
            }}
          >
            {grid.map((row, y) =>
              row.map((tile, x) => {
                const key = `${x},${y}`;
                const unitHere = tacticalUnits.find((u) => u.hp > 0 && u.position.x === x && u.position.y === y);
                const isInMoveRange = moveRange.has(key);
                const isInAttackRange = attackRange.has(key);
                const isSelected = unitHere?.id === selectedUnitId;
                const isObjective = tile.type === 'objective';
                const hitChance = unitHere && !unitHere.isPlayer ? targetHitChances.get(unitHere.id) : undefined;

                return (
                  <div
                    key={key}
                    onClick={() => handleTileClick(x, y)}
                    className="relative cursor-pointer transition-all duration-100"
                    style={{
                      width: TILE_SIZE,
                      height: TILE_SIZE,
                      backgroundColor: isInMoveRange
                        ? '#1a2a4e'
                        : isInAttackRange
                          ? '#3e1a1a'
                          : TILE_COLORS[tile.type],
                      border: isSelected
                        ? `2px solid ${accentColor}`
                        : isObjective
                          ? '1px solid #F59E0B44'
                          : '1px solid #ffffff08',
                      borderRadius: 2,
                    }}
                  >
                    {/* Cover/terrain icon */}
                    {COVER_ICONS[tile.type] && !unitHere && (
                      <span className="absolute inset-0 flex items-center justify-center text-xs opacity-30 text-slate-400 pointer-events-none">
                        {COVER_ICONS[tile.type]}
                      </span>
                    )}

                    {/* Objective pulse */}
                    {isObjective && (
                      <motion.div
                        className="absolute inset-0 rounded-sm"
                        animate={{ boxShadow: ['0 0 4px #F59E0B33', '0 0 12px #F59E0B66', '0 0 4px #F59E0B33'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}

                    {/* Unit */}
                    {unitHere && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        onMouseEnter={() => { if (!unitHere.isPlayer) setHoveredTargetId(unitHere.id); }}
                        onMouseLeave={() => { if (!unitHere.isPlayer) setHoveredTargetId(null); }}
                        className="absolute inset-1 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{
                          backgroundColor: unitHere.isPlayer
                            ? `${FRIENDLY_COLOR}cc`
                            : `${ENEMY_COLOR}cc`,
                          color: '#fff',
                          border: isSelected ? '2px solid #fff' : unitHere.isPlayer ? '1px solid #93c5fd88' : '1px solid #fca5a588',
                          boxShadow: unitHere.isInOverwatch
                            ? '0 0 8px #3B82F6'
                            : unitHere.isCloaked
                              ? '0 0 8px #8B5CF6'
                              : 'none',
                        }}
                      >
                        {/* Hit chance badge in attack mode */}
                        {hitChance !== undefined && (
                          <div
                            className="absolute -top-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold pointer-events-none z-10"
                            style={{
                              backgroundColor: '#080c14ee',
                              color: hitChance >= 65 ? '#22c55e' : hitChance >= 40 ? '#eab308' : '#ef4444',
                              border: '1px solid #334155',
                            }}
                          >
                            {hitChance}%
                          </div>
                        )}
                        {getClassInitial(unitHere.class)}
                        {/* HP indicator */}
                        <div
                          className="absolute -bottom-0.5 left-1 right-1 h-[2px] rounded-full bg-gray-800"
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(unitHere.hp / unitHere.maxHp) * 100}%`,
                              backgroundColor: unitHere.hp > unitHere.maxHp * 0.5 ? '#22c55e' : unitHere.hp > unitHere.maxHp * 0.25 ? '#eab308' : '#ef4444',
                            }}
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Fire overlay */}
                    {tile.onFire && (
                      <div className="absolute inset-0 bg-orange-500/20 rounded-sm pointer-events-none" />
                    )}
                  </div>
                );
              }),
            )}
          </div>
        </div>

        {/* Right panel: unit info + combat log */}
        <div className="w-64 border-l border-slate-800 bg-[#111827] flex flex-col shrink-0 overflow-hidden">
          {/* Selected unit info */}
          <div className="p-3 border-b border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              Selected Unit
            </p>
            {selectedUnit ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold" style={{ color: selectedUnit.isPlayer ? accentColor : '#EF4444' }}>
                  {selectedUnit.name}
                </p>
                <p className="text-[10px] text-slate-500 uppercase">{selectedUnit.class}</p>
                {/* HP bar */}
                <div>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-slate-500">HP</span>
                    <span className="text-slate-300 font-mono">{selectedUnit.hp}/{selectedUnit.maxHp}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(selectedUnit.hp / selectedUnit.maxHp) * 100}%`,
                        backgroundColor: selectedUnit.hp > selectedUnit.maxHp * 0.5 ? '#22c55e' : '#eab308',
                      }}
                    />
                  </div>
                </div>
                {/* Stats */}
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <span className="text-slate-500">Aim</span>
                  <span className="text-slate-300 font-mono text-right">+{selectedUnit.aim}</span>
                  <span className="text-slate-500">Mobility</span>
                  <span className="text-slate-300 font-mono text-right">{selectedUnit.mobility}</span>
                  <span className="text-slate-500">Armor</span>
                  <span className="text-slate-300 font-mono text-right">{selectedUnit.armor}</span>
                  <span className="text-slate-500">Actions</span>
                  <span className="text-slate-300 font-mono text-right">{selectedUnit.actionsRemaining}/{selectedUnit.maxActions}</span>
                </div>
                {/* Status */}
                <div className="flex flex-wrap gap-1">
                  {selectedUnit.isInOverwatch && (
                    <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">OVERWATCH</span>
                  )}
                  {selectedUnit.isHunkered && (
                    <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">HUNKERED</span>
                  )}
                  {selectedUnit.isCloaked && (
                    <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">CLOAKED</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-slate-600 italic">Click a unit to select</p>
            )}
          </div>

          {/* Shot breakdown (attack mode, hovering a target) */}
          {hoveredBreakdown && (
            <div className="p-3 border-b border-slate-800 bg-red-950/20">
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-2">
                Shot: {hoveredBreakdown.targetName}
              </p>
              <div className="space-y-0.5">
                {hoveredBreakdown.breakdown.map((line, i) => (
                  <p key={i} className="text-[10px] font-mono text-slate-400">{line}</p>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between">
                <span className="text-[10px] uppercase text-slate-500">To Hit</span>
                <span
                  className="text-sm font-mono font-bold"
                  style={{ color: hoveredBreakdown.hitPercent >= 65 ? '#22c55e' : hoveredBreakdown.hitPercent >= 40 ? '#eab308' : '#ef4444' }}
                >
                  {hoveredBreakdown.hitPercent}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] uppercase text-slate-500">Crit</span>
                <span className="text-sm font-mono font-bold text-yellow-400">{hoveredBreakdown.critPercent}%</span>
              </div>
            </div>
          )}

          {/* Squad list */}
          <div className="p-3 border-b border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Squad</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {playerUnits.map((u) => (
                <button
                  key={u.id}
                  onClick={() => { setSelectedUnitId(u.id); setActionMode(null); }}
                  className={`w-full text-left text-[10px] px-2 py-1 rounded flex justify-between items-center transition-colors ${
                    u.id === selectedUnitId ? 'bg-slate-700' : 'hover:bg-slate-800'
                  }`}
                >
                  <span className={u.hp > 0 ? 'text-slate-300' : 'text-red-500 line-through'}>
                    {getClassInitial(u.class)} {u.name.split(' ')[0]}
                  </span>
                  <span className="font-mono text-slate-500">{u.hp}/{u.maxHp}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Combat log */}
          <div className="flex-1 p-3 overflow-hidden">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Combat Log</p>
            <div className="space-y-0.5 overflow-y-auto max-h-48">
              {combatLog.slice(-20).reverse().map((entry, i) => (
                <p
                  key={i}
                  className={`text-[10px] font-mono ${
                    entry.type === 'hit' ? 'text-green-400' :
                    entry.type === 'miss' ? 'text-slate-500' :
                    entry.type === 'crit' ? 'text-yellow-400' :
                    entry.type === 'kill' ? 'text-red-400' :
                    'text-slate-400'
                  }`}
                >
                  {entry.message}
                </p>
              ))}
              {combatLog.length === 0 && (
                <p className="text-[10px] text-slate-700 italic">Awaiting combat...</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="h-14 flex items-center justify-between px-4 border-t border-slate-800 bg-[#111827] shrink-0">
        <div className="flex items-center gap-2">
          <Tooltip
            side="top"
            content={
              <>
                <span className="block text-xs font-bold text-slate-200 mb-1">Move (1 AP)</span>
                <span className="block text-[11px] text-slate-400 leading-snug">Highlighted blue tiles are in range — click one to move there. Ends near cover for protection.</span>
              </>
            }
          >
            <button
              onClick={() => setActionMode(actionMode === 'move' ? null : 'move')}
              disabled={!selectedUnit || !mission.playerTurn || (selectedUnit?.actionsRemaining ?? 0) < 1}
              className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${
                actionMode === 'move' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              Move
            </button>
          </Tooltip>
          <Tooltip
            side="top"
            content={
              <>
                <span className="block text-xs font-bold text-slate-200 mb-1">Attack (1 AP)</span>
                <span className="block text-[11px] text-slate-400 leading-snug">Targets in range show a hit % badge. Hover a target for the full shot breakdown, click to fire.</span>
              </>
            }
          >
            <button
              onClick={() => setActionMode(actionMode === 'attack' ? null : 'attack')}
              disabled={!selectedUnit || !mission.playerTurn || (selectedUnit?.actionsRemaining ?? 0) < 1}
              className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors ${
                actionMode === 'attack' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              Attack
            </button>
          </Tooltip>
          <Tooltip
            side="top"
            content={
              <>
                <span className="block text-xs font-bold text-slate-200 mb-1">Overwatch (2 AP)</span>
                <span className="block text-[11px] text-slate-400 leading-snug">Hold position and fire a reaction shot at the first enemy that moves in sight. Great for defending chokepoints.</span>
              </>
            }
          >
            <button
              onClick={() => {
                if (selectedUnitId) useGameStore.getState().setUnitOverwatch(selectedUnitId);
                setActionMode(null);
              }}
              disabled={!selectedUnit || !mission.playerTurn || (selectedUnit?.actionsRemaining ?? 0) < 2}
              className="px-4 py-2 rounded text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Overwatch
            </button>
          </Tooltip>
          <Tooltip
            side="top"
            content={
              <>
                <span className="block text-xs font-bold text-slate-200 mb-1">Hunker Down (2 AP)</span>
                <span className="block text-[11px] text-slate-400 leading-snug">Double your cover bonus until next turn. Cannot act, but very hard to hit.</span>
              </>
            }
          >
            <button
              onClick={() => {
                if (selectedUnitId) useGameStore.getState().setUnitHunker(selectedUnitId);
                setActionMode(null);
              }}
              disabled={!selectedUnit || !mission.playerTurn || (selectedUnit?.actionsRemaining ?? 0) < 2}
              className="px-4 py-2 rounded text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Hunker
            </button>
          </Tooltip>

          {/* Contextual instruction */}
          <span className="ml-3 text-[11px] text-slate-500 italic">
            {!selectedUnit
              ? 'Click one of your blue units to select it'
              : actionMode === 'move'
                ? 'Click a highlighted blue tile to move'
                : actionMode === 'attack'
                  ? 'Click a red target — the badge shows your hit chance'
                  : `${selectedUnit.name}: ${selectedUnit.actionsRemaining} AP remaining`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {mission.isComplete ? (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={handleEndCombat}
              className="px-6 py-2 rounded text-sm font-bold uppercase tracking-wider transition-colors"
              style={{
                backgroundColor: mission.result === 'victory' ? '#22c55e' : '#EF4444',
                color: '#fff',
              }}
            >
              {mission.result === 'victory' ? 'VICTORY - Continue' : 'DEFEAT - Continue'}
            </motion.button>
          ) : (
            <button
              onClick={handleEndTurn}
              disabled={!mission.playerTurn}
              className="px-6 py-2 rounded text-sm font-bold uppercase tracking-wider transition-colors disabled:opacity-30"
              style={{ backgroundColor: accentColor, color: '#000' }}
            >
              End Turn
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
