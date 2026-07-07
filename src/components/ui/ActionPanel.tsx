'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { FACTION_COLORS } from '@/data/factions';
import { getAvailableTechs } from '@/data/technologies';
import Tooltip, { CostLine } from '@/components/ui/Tooltip';
import type {
  StrategicActionType,
  Territory,
  OperativeClass,
  BuildingType,
  SpyAction,
} from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SubMode =
  | null
  | 'moveForces'
  | 'attack'
  | 'build'
  | 'research'
  | 'recruit'
  | 'espionage'
  | 'trade'
  | 'restRefit'
  | 'covertOp';

type SelectionStep =
  | 'pickSource'
  | 'pickTarget'
  | 'pickTroops'
  | 'pickBuilding'
  | 'pickTech'
  | 'pickClass'
  | 'pickSpy'
  | 'pickSpyAction'
  | 'confirm';

interface ActionDef {
  type: StrategicActionType;
  icon: string;
  label: string;
  description: string;
  subMode: SubMode;
  cost?: string;
  hint?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTIONS: ActionDef[] = [
  { type: 'moveForces', icon: '\u{1F6E1}\uFE0F', label: 'Move Forces', description: 'Relocate troops between adjacent territories you control.', subMode: 'moveForces', cost: '1 action', hint: 'Mass troops on a border before attacking. Always leave at least 1 defender behind.' },
  { type: 'attackTerritory', icon: '\u2694\uFE0F', label: 'Attack', description: 'Quick auto-resolved assault on an adjacent enemy or neutral territory.', subMode: 'attack', cost: '1 action', hint: 'Outcome depends on troop counts, fortification, and luck. Neutral gray territories are the softest targets.' },
  { type: 'diplomacy', icon: '\u{1F91D}', label: 'Diplomacy', description: 'Open the relationship web to propose treaties, alliances, or threats.', subMode: null, cost: '5-35 influence', hint: 'Trade deals boost income and relations. Betrayal is remembered.' },
  { type: 'espionage', icon: '\u{1F575}\uFE0F', label: 'Espionage', description: 'Send an agent to gather intel, sabotage a garrison, or incite unrest.', subMode: 'espionage', cost: '1 action', hint: 'Riskier missions have higher detection chance. Captured spies damage relations.' },
  { type: 'build', icon: '\u{1F3D7}\uFE0F', label: 'Build', description: 'Construct a building in a territory you control.', subMode: 'build', cost: '90-200 credits', hint: 'Banks and factories raise income. Labs raise research. Hospitals heal wounded faster.' },
  { type: 'research', icon: '\u{1F52C}', label: 'Research', description: 'Start researching a technology (military, economic, or intelligence).', subMode: 'research', cost: '40-300 tech pts', hint: 'One tech at a time, 1-3 turns each. View the full tree via TECH in the top bar.' },
  { type: 'recruit', icon: '\u{1F4E2}', label: 'Recruit', description: 'Train a new operative for your tactical squad.', subMode: 'recruit', cost: '50\uD83D\uDCB0 + 10\uD83D\uDC65', hint: 'Rookies start at level 1. Veterans are earned, not bought.' },
  { type: 'covertOp', icon: '\u{1F5E1}\uFE0F', label: 'Covert Op', description: 'Deploy your named operatives into XCOM-style tactical combat.', subMode: 'covertOp', cost: '1 action', hint: 'Better results than auto-resolve \u2014 but operatives at 0 HP die PERMANENTLY.' },
  { type: 'trade', icon: '\u{1F4B1}', label: 'Trade', description: 'Establish a trade route between two of your territories.', subMode: 'trade', cost: '1 action', hint: 'Passive income each turn while the route holds.' },
  { type: 'restRefit', icon: '\u{1FA79}', label: 'Rest & Refit', description: 'Accelerate recovery for all wounded operatives by 1 turn.', subMode: 'restRefit', cost: '1 action', hint: 'Wounded operatives cannot deploy until healed.' },
];

const BUILDING_OPTIONS: { type: BuildingType; label: string; icon: string; cost: number }[] = [
  { type: 'base', label: 'Command Base', icon: '\u{1F3F0}', cost: 100 },
  { type: 'lab', label: 'Research Lab', icon: '\u{1F9EA}', cost: 120 },
  { type: 'factory', label: 'Factory', icon: '\u{1F3ED}', cost: 150 },
  { type: 'hospital', label: 'Hospital', icon: '\u{1F3E5}', cost: 100 },
  { type: 'spyNetwork', label: 'Spy Network', icon: '\u{1F441}\uFE0F', cost: 130 },
  { type: 'bank', label: 'Bank', icon: '\u{1F3E6}', cost: 140 },
  { type: 'mediaCenter', label: 'Media Center', icon: '\u{1F4F0}', cost: 110 },
  { type: 'fortress', label: 'Fortress', icon: '\u{1F6E1}\uFE0F', cost: 200 },
  { type: 'recruitCenter', label: 'Recruit Center', icon: '\u{1F396}\uFE0F', cost: 90 },
];

const SPY_MISSIONS: { action: SpyAction; label: string; icon: string; description: string; risk: string; riskColor: string }[] = [
  { action: 'gatherIntel', label: 'Gather Intel', icon: '\u{1F4E1}', description: 'Reveal enemy troops, fortification, and unrest', risk: 'LOW RISK', riskColor: 'text-green-400' },
  { action: 'sabotage', label: 'Sabotage', icon: '\u{1F4A3}', description: 'Weaken enemy garrison by 3-8 troops', risk: 'MED RISK', riskColor: 'text-yellow-400' },
  { action: 'inciteUnrest', label: 'Incite Unrest', icon: '\u{1F525}', description: 'Raise unrest by 15-30 in target territory', risk: 'MED RISK', riskColor: 'text-yellow-400' },
];

const RECRUIT_CLASSES: { cls: OperativeClass; label: string; icon: string }[] = [
  { cls: 'assault', label: 'Assault', icon: '\u{1F4A5}' },
  { cls: 'sharpshooter', label: 'Sharpshooter', icon: '\u{1F3AF}' },
  { cls: 'heavy', label: 'Heavy', icon: '\u{1F6E1}\uFE0F' },
  { cls: 'medic', label: 'Medic', icon: '\u{1FA7A}' },
  { cls: 'infiltrator', label: 'Infiltrator', icon: '\u{1F977}' },
  { cls: 'specialist', label: 'Specialist', icon: '\u{1F4BB}' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ActionPanel() {
  const {
    playerFaction,
    factions,
    territories,
    operatives,
    setPhase,
    selectTerritory,
    selectedTerritory,
  } = useGameStore();

  const actionsRemaining = useGameStore((s) => s.actionsRemaining) ?? 5;
  const researchedTechs = playerFaction ? factions[playerFaction]?.researchedTechs ?? [] : [];

  const accentColor = playerFaction ? FACTION_COLORS[playerFaction] : '#6B7280';

  // Sub-mode state
  const [activeMode, setActiveMode] = useState<SubMode>(null);
  const [step, setStep] = useState<SelectionStep>('pickSource');
  const [sourceTerritory, setSourceTerritory] = useState<string | null>(null);
  const [troopCount, setTroopCount] = useState(1);
  const [endTurnConfirm, setEndTurnConfirm] = useState(false);
  const [selectedSpyId, setSelectedSpyId] = useState<string | null>(null);

  const spies = useGameStore((s) => s.spies);

  // Derived data - territories is Record<string, Territory>
  const territoryList = useMemo(() => Object.values(territories), [territories]);

  const ownedTerritories = useMemo(
    () => territoryList.filter((t) => t.controller === playerFaction),
    [territoryList, playerFaction],
  );

  const woundedOperatives = useMemo(
    () => operatives.filter((o) => o.faction === playerFaction && o.status === 'wounded'),
    [operatives, playerFaction],
  );

  const availableTechs = useMemo(
    () => getAvailableTechs(researchedTechs),
    [researchedTechs],
  );

  const sourceTerritoryData = useMemo(
    () => (sourceTerritory ? territories[sourceTerritory] ?? null : null),
    [sourceTerritory, territories],
  );

  const adjacentTargets = useMemo(() => {
    if (!sourceTerritoryData) return [];
    return sourceTerritoryData.adjacency.map((id) => territories[id]).filter(Boolean) as Territory[];
  }, [sourceTerritoryData, territories]);

  const availableSpies = useMemo(
    () => spies.filter((s) => s.faction === playerFaction && !s.isCompromised),
    [spies, playerFaction],
  );

  const enemyTerritories = useMemo(
    () => territoryList.filter((t) => t.controller !== null && t.controller !== playerFaction),
    [territoryList, playerFaction],
  );

  // Handlers
  const resetMode = useCallback(() => {
    setActiveMode(null);
    setStep('pickSource');
    setSourceTerritory(null);
    setTroopCount(1);
    setSelectedSpyId(null);
  }, []);

  function handleActionClick(action: ActionDef) {
    if (actionsRemaining <= 0) return;

    // Diplomacy navigates directly
    if (action.type === 'diplomacy') {
      setPhase('diplomacy_screen');
      return;
    }

    if (action.subMode) {
      setActiveMode(action.subMode);
      // Set initial step based on mode
      if (['moveForces', 'attack', 'build', 'trade', 'covertOp'].includes(action.subMode)) {
        setStep('pickSource');
      } else if (action.subMode === 'research') {
        setStep('pickTech');
      } else if (action.subMode === 'recruit') {
        setStep('pickClass');
      } else if (action.subMode === 'espionage') {
        setStep('pickSpy');
      } else if (action.subMode === 'restRefit') {
        setStep('confirm');
      }
    }
  }

  function handleSourceSelect(territory: Territory) {
    setSourceTerritory(territory.id);
    selectTerritory(territory.id);
    setStep('pickTarget');
  }

  function handleTargetSelect(territory: Territory) {
    selectTerritory(territory.id);
    if (activeMode === 'moveForces') {
      setStep('pickTroops');
    } else {
      // Attack, covertOp, trade - confirm
      setStep('confirm');
    }
  }

  // ---------------------------------------------------------------------------
  // Sub-panels
  // ---------------------------------------------------------------------------

  function renderSubPanel() {
    if (!activeMode) return null;

    return (
      <motion.div
        key={activeMode}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="mt-2 rounded-lg p-3"
        style={{ backgroundColor: '#0D1117', border: `1px solid ${accentColor}33` }}
      >
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accentColor }}>
            {ACTIONS.find((a) => a.subMode === activeMode)?.label ?? activeMode}
          </span>
          <button
            onClick={resetMode}
            className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
          >
            &#x2715; Cancel
          </button>
        </div>

        {/* Territory picker steps */}
        {(activeMode === 'moveForces' || activeMode === 'attack' || activeMode === 'build' || activeMode === 'trade' || activeMode === 'covertOp') && step === 'pickSource' && (
          <div>
            <p className="text-[11px] text-gray-400 mb-2">Select source territory:</p>
            <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
              {ownedTerritories
                .filter((t) => activeMode !== 'attack' && activeMode !== 'covertOp' ? true : t.troops > 0)
                .map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSourceSelect(t)}
                    className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-gray-800 transition-colors text-gray-300 flex justify-between items-center"
                  >
                    <span>{t.name}</span>
                    <span className="text-gray-500 font-mono">{t.troops} troops</span>
                  </button>
                ))}
              {ownedTerritories.length === 0 && (
                <p className="text-[10px] text-gray-600 italic">No territories available</p>
              )}
            </div>
          </div>
        )}

        {(activeMode === 'moveForces' || activeMode === 'attack' || activeMode === 'trade' || activeMode === 'covertOp') && step === 'pickTarget' && (
          <div>
            <p className="text-[11px] text-gray-400 mb-2">
              {activeMode === 'moveForces' ? 'Select destination (adjacent, owned):' :
               activeMode === 'trade' ? 'Select trade partner territory:' :
               'Select target territory:'}
            </p>
            <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
              {adjacentTargets
                .filter((t) => {
                  if (activeMode === 'moveForces') return t.controller === playerFaction;
                  if (activeMode === 'trade') return t.controller === playerFaction && t.id !== sourceTerritory;
                  return t.controller !== playerFaction; // attack, covertOp
                })
                .map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleTargetSelect(t)}
                    className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-gray-800 transition-colors text-gray-300 flex justify-between items-center"
                  >
                    <span>{t.name}</span>
                    <span className="text-gray-500 font-mono">
                      {t.controller ? t.controller : 'neutral'} &middot; {t.troops}
                    </span>
                  </button>
                ))}
              {adjacentTargets.length === 0 && (
                <p className="text-[10px] text-gray-600 italic">No valid targets</p>
              )}
            </div>
          </div>
        )}

        {activeMode === 'moveForces' && step === 'pickTroops' && sourceTerritoryData && (
          <div>
            <p className="text-[11px] text-gray-400 mb-2">Select troops to move:</p>
            <div className="flex items-center gap-3 mb-3">
              <input
                type="range"
                min={1}
                max={Math.max(1, sourceTerritoryData.troops - 1)}
                value={troopCount}
                onChange={(e) => setTroopCount(Number(e.target.value))}
                className="flex-1 accent-blue-500"
                style={{ accentColor }}
              />
              <span className="font-mono text-white text-sm w-10 text-center">{troopCount}</span>
            </div>
            <button
              onClick={() => {
                const s = useGameStore.getState() as any;
                if (s.moveForces && sourceTerritory && selectedTerritory) {
                  s.moveForces(sourceTerritory, selectedTerritory, troopCount);
                }
                resetMode();
              }}
              className="w-full text-xs py-1.5 rounded font-semibold transition-colors"
              style={{ backgroundColor: accentColor, color: '#000' }}
            >
              Confirm Move
            </button>
          </div>
        )}

        {/* Build sub-panel */}
        {activeMode === 'build' && step === 'pickTarget' && (
          <div>
            <p className="text-[11px] text-gray-400 mb-2">Select building to construct:</p>
            <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
              {BUILDING_OPTIONS.map((b) => (
                <button
                  key={b.type}
                  onClick={() => {
                    const s = useGameStore.getState() as any;
                    if (s.buildStructure && sourceTerritory) {
                      s.buildStructure(sourceTerritory, b.type);
                    }
                    resetMode();
                  }}
                  className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-gray-800 transition-colors text-gray-300 flex justify-between items-center"
                >
                  <span>
                    {b.icon} {b.label}
                  </span>
                  <span className="text-yellow-400 font-mono">{b.cost}c</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Research sub-panel */}
        {activeMode === 'research' && step === 'pickTech' && (
          <div>
            <p className="text-[11px] text-gray-400 mb-2">Available technologies:</p>
            <div className="max-h-52 overflow-y-auto space-y-1 custom-scrollbar">
              {availableTechs.length > 0 ? availableTechs.map((tech) => (
                <button
                  key={tech.id}
                  onClick={() => {
                    const s = useGameStore.getState() as any;
                    if (s.startResearch) s.startResearch(tech.id);
                    resetMode();
                  }}
                  className="w-full text-left text-xs px-2 py-2 rounded hover:bg-gray-800 transition-colors text-gray-300"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-semibold">{tech.name}</span>
                    <span
                      className="text-[10px] px-1 py-0.5 rounded uppercase font-bold"
                      style={{
                        color: tech.branch === 'military' ? '#EF4444' : tech.branch === 'economic' ? '#F59E0B' : '#3B82F6',
                        backgroundColor: tech.branch === 'military' ? '#EF444422' : tech.branch === 'economic' ? '#F59E0B22' : '#3B82F622',
                      }}
                    >
                      {tech.branch}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">{tech.description}</p>
                  <div className="flex gap-3 mt-1 text-[10px] text-gray-500 font-mono">
                    <span>Cost: {tech.cost} TP</span>
                    <span>Turns: {tech.turnsToResearch}</span>
                  </div>
                </button>
              )) : (
                <p className="text-[10px] text-gray-600 italic">No technologies available</p>
              )}
            </div>
          </div>
        )}

        {/* Recruit sub-panel */}
        {activeMode === 'recruit' && step === 'pickClass' && (
          <div>
            <p className="text-[11px] text-gray-400 mb-1">
              Select operative class
              <span className="text-gray-600 ml-1">(50c, 10 manpower)</span>
            </p>
            <div className="space-y-1 mt-2">
              {RECRUIT_CLASSES.map((rc) => (
                <button
                  key={rc.cls}
                  onClick={() => {
                    const s = useGameStore.getState() as any;
                    if (s.recruitOperative) s.recruitOperative(rc.cls);
                    resetMode();
                  }}
                  className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-gray-800 transition-colors text-gray-300 flex items-center gap-2"
                >
                  <span className="text-sm">{rc.icon}</span>
                  <span>{rc.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Espionage: pick spy */}
        {activeMode === 'espionage' && step === 'pickSpy' && (
          <div>
            <p className="text-[11px] text-gray-400 mb-2">Select agent:</p>
            <div className="space-y-1">
              {availableSpies.length === 0 ? (
                <p className="text-[10px] text-gray-600 italic">No agents available. They may be compromised.</p>
              ) : (
                availableSpies.map((spy) => (
                  <button
                    key={spy.id}
                    onClick={() => {
                      setSelectedSpyId(spy.id);
                      setStep('pickTarget');
                    }}
                    className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-gray-800 transition-colors text-gray-300 flex justify-between"
                  >
                    <span>{spy.name}</span>
                    <span className="text-[10px] text-green-400 font-mono">SKILL {spy.skillLevel}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Espionage: pick target territory */}
        {activeMode === 'espionage' && step === 'pickTarget' && (
          <div>
            <p className="text-[11px] text-gray-400 mb-2">Select target territory:</p>
            <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
              {enemyTerritories.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    selectTerritory(t.id);
                    setStep('pickSpyAction');
                  }}
                  className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-gray-800 transition-colors text-gray-300 flex justify-between items-center"
                >
                  <span>{t.name}</span>
                  <span className="text-gray-500 font-mono">{t.controller}</span>
                </button>
              ))}
              {enemyTerritories.length === 0 && (
                <p className="text-[10px] text-gray-600 italic">No enemy territories known</p>
              )}
            </div>
          </div>
        )}

        {/* Espionage: pick action */}
        {activeMode === 'espionage' && step === 'pickSpyAction' && (
          <div>
            <p className="text-[11px] text-gray-400 mb-2">Mission type:</p>
            <div className="space-y-1">
              {SPY_MISSIONS.map((m) => (
                <button
                  key={m.action}
                  onClick={() => {
                    const s = useGameStore.getState();
                    if (selectedSpyId && selectedTerritory) {
                      s.deploySpy(selectedSpyId, selectedTerritory, m.action);
                    }
                    resetMode();
                  }}
                  className="w-full text-left text-xs px-2 py-2 rounded hover:bg-gray-800 transition-colors text-gray-300"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{m.icon} {m.label}</span>
                    <span className={`text-[10px] font-mono ${m.riskColor}`}>{m.risk}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">{m.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Rest & Refit sub-panel */}
        {activeMode === 'restRefit' && step === 'confirm' && (
          <div>
            <p className="text-[11px] text-gray-400 mb-2">Wounded operatives:</p>
            {woundedOperatives.length > 0 ? (
              <div className="space-y-1 mb-3">
                {woundedOperatives.map((op) => (
                  <div key={op.id} className="text-xs text-yellow-300 flex justify-between px-2 py-1">
                    <span>{op.name}</span>
                    <span className="font-mono text-gray-500">{op.hp}/{op.maxHp} HP</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-gray-600 italic mb-3">No wounded operatives</p>
            )}
            <button
              onClick={() => {
                const s = useGameStore.getState() as any;
                if (s.restRefit) s.restRefit();
                resetMode();
              }}
              disabled={woundedOperatives.length === 0}
              className="w-full text-xs py-1.5 rounded font-semibold transition-colors disabled:opacity-30"
              style={{ backgroundColor: accentColor, color: '#000' }}
            >
              Heal All Wounded
            </button>
          </div>
        )}

        {/* Generic confirm for attack/covertOp/trade */}
        {(activeMode === 'attack' || activeMode === 'covertOp' || activeMode === 'trade') && step === 'confirm' && (
          <div>
            <p className="text-[11px] text-gray-300 mb-3">
              {activeMode === 'attack' && 'Launch assault on this territory?'}
              {activeMode === 'covertOp' && 'Initiate covert operation?'}
              {activeMode === 'trade' && 'Establish trade route?'}
            </p>
            <button
              onClick={() => {
                const s = useGameStore.getState() as any;
                if (activeMode === 'attack' && s.attackTerritory && sourceTerritory && selectedTerritory) {
                  s.attackTerritory(sourceTerritory, selectedTerritory);
                } else if (activeMode === 'covertOp' && s.startTacticalCombat && sourceTerritory && selectedTerritory) {
                  s.startTacticalCombat(sourceTerritory, selectedTerritory);
                }
                resetMode();
              }}
              className="w-full text-xs py-1.5 rounded font-semibold transition-colors"
              style={{ backgroundColor: activeMode === 'attack' || activeMode === 'covertOp' ? '#EF4444' : accentColor, color: '#FFF' }}
            >
              {activeMode === 'attack' ? 'Attack!' : activeMode === 'covertOp' ? 'Deploy Team' : 'Confirm Trade'}
            </button>
          </div>
        )}
      </motion.div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      className="w-64 h-full flex flex-col p-3 select-none overflow-y-auto shrink-0 custom-scrollbar"
      style={{ backgroundColor: '#111827', borderRight: '1px solid #1F293744' }}
    >
      {/* Title */}
      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
        Strategic Actions
      </div>

      {/* Action buttons */}
      <div className="space-y-1 flex-1">
        {ACTIONS.map((action) => {
          const isActive = activeMode === action.subMode && action.subMode !== null;
          const disabled = actionsRemaining <= 0;

          return (
            <Tooltip
              key={action.type}
              side="right"
              className="block w-full"
              content={
                <>
                  <span className="block text-xs font-bold text-slate-200 mb-1">{action.label}</span>
                  <span className="block text-[11px] text-slate-400 leading-snug">{action.description}</span>
                  {action.cost && <CostLine label="Cost" value={action.cost} />}
                  {action.hint && (
                    <span className="block text-[10px] text-slate-500 italic mt-1.5 pt-1.5 border-t border-slate-800">
                      {action.hint}
                    </span>
                  )}
                </>
              }
            >
              <button
                onClick={() => handleActionClick(action)}
                disabled={disabled}
                className={`
                  w-full text-left text-xs px-3 py-2 rounded flex items-center gap-2
                  transition-all duration-150
                  ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-800 cursor-pointer'}
                `}
                style={
                  isActive
                    ? { backgroundColor: `${accentColor}22`, color: accentColor, border: `1px solid ${accentColor}44` }
                    : { color: '#D1D5DB', border: '1px solid transparent' }
                }
              >
                <span className="text-sm w-5 text-center shrink-0">{action.icon}</span>
                <span className="font-medium">{action.label}</span>
                {action.cost && (
                  <span className="ml-auto text-[9px] font-mono text-gray-600">{action.cost.replace(' action', 'a').replace('actions', 'a')}</span>
                )}
              </button>
            </Tooltip>
          );
        })}
      </div>

      {/* Sub-panel */}
      <AnimatePresence mode="wait">
        {activeMode && renderSubPanel()}
      </AnimatePresence>

      {/* END TURN button */}
      <div className="mt-4 pt-3 border-t border-gray-800">
        {!endTurnConfirm ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setEndTurnConfirm(true)}
            className="w-full py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors"
            style={{
              backgroundColor: accentColor,
              color: '#000',
              boxShadow: `0 0 20px ${accentColor}33`,
            }}
          >
            End Turn
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <p className="text-xs text-center text-yellow-400">End your turn?</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const s = useGameStore.getState() as any;
                  if (s.endTurn) s.endTurn();
                  setEndTurnConfirm(false);
                }}
                className="flex-1 py-2 rounded text-xs font-bold uppercase bg-red-600 text-white hover:bg-red-500 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setEndTurnConfirm(false)}
                className="flex-1 py-2 rounded text-xs font-bold uppercase bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
