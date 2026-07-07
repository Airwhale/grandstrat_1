'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { FACTION_COLORS } from '@/data/factions';

interface TutorialStep {
  title: string;
  text: string;
  /** where the card sits so it points at the relevant UI */
  position: 'center' | 'top' | 'left' | 'right' | 'bottom-left' | 'bottom';
}

const STEPS: TutorialStep[] = [
  {
    title: 'Welcome, Commander',
    text: 'The world of 2034 is fractured into six power blocs waging a covert shadow war. Your objective: control 30 of 46 territories. You will get there through conquest, diplomacy, espionage — and the operatives willing to die for you.',
    position: 'center',
  },
  {
    title: 'The Command Bar',
    text: 'Your resources live up here: 🪙 Credits fund everything, 🧪 Tech Points fuel research, 🎭 Influence buys diplomacy, ⚙️ Rare Materials gear elites, 👥 Manpower fills your ranks. Watch the Territories counter — that is your victory progress. ROSTER and TECH open your operatives and research tree; ? opens the field manual.',
    position: 'top',
  },
  {
    title: 'The World Map',
    text: 'Each circle is a territory — the number is its garrison, the color its owner. Gray means neutral and weakly defended: easy pickings. A gold dot marks rare materials. Hover any territory for full intel; supply lines animate between your holdings.',
    position: 'center',
  },
  {
    title: 'Strategic Actions',
    text: 'You get 5 actions per turn, spent from this panel. Move Forces repositions troops, Attack auto-resolves an assault, Build and Research grow your economy, Recruit expands your roster. Hover any action for its cost and effect.',
    position: 'left',
  },
  {
    title: 'Covert Ops & Permadeath',
    text: 'Covert Op deploys your named operatives into tactical grid combat — XCOM style. Manual play beats auto-resolve, but operatives at 0 HP die permanently. Their names go on the memorial wall. Choose your fights carefully.',
    position: 'left',
  },
  {
    title: 'Intelligence',
    text: 'The Intel Feed on the right collects spy reports. The news ticker at the bottom tells you what the five AI factions did on their turn — read it, they are plotting. Espionage lets your agents gather intel, sabotage garrisons, or incite unrest.',
    position: 'right',
  },
  {
    title: 'End Turn',
    text: 'When your actions are spent, press END TURN. Income arrives, the AI factions move, research ticks, and every third turn a global event demands a decision. That is the whole loop. Good hunting, Commander.',
    position: 'bottom-left',
  },
];

const POSITION_CLASSES: Record<TutorialStep['position'], string> = {
  center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  top: 'top-16 left-1/2 -translate-x-1/2',
  left: 'top-1/3 left-72',
  right: 'top-1/3 right-72',
  'bottom-left': 'bottom-24 left-72',
  bottom: 'bottom-16 left-1/2 -translate-x-1/2',
};

export default function TutorialOverlay() {
  const tutorialStep = useGameStore((s) => s.tutorialStep);
  const setTutorialStep = useGameStore((s) => s.setTutorialStep);
  const playerFaction = useGameStore((s) => s.playerFaction);

  if (tutorialStep === null || tutorialStep >= STEPS.length) return null;

  const step = STEPS[tutorialStep];
  const accentColor = playerFaction ? FACTION_COLORS[playerFaction] : '#3B82F6';
  const isLast = tutorialStep === STEPS.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        key={tutorialStep}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[85] pointer-events-none"
        style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.25 }}
          className={`absolute pointer-events-auto w-96 max-w-[90vw] rounded-lg border shadow-2xl ${POSITION_CLASSES[step.position]}`}
          style={{
            backgroundColor: '#0d1220',
            borderColor: `${accentColor}55`,
            boxShadow: `0 0 40px ${accentColor}22`,
          }}
        >
          {/* Header */}
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{ borderBottom: `1px solid ${accentColor}33`, backgroundColor: `${accentColor}0d` }}
          >
            <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: accentColor }}>
              {step.title}
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {tutorialStep + 1}/{STEPS.length}
            </span>
          </div>

          {/* Body */}
          <p className="px-5 py-4 text-sm leading-relaxed text-slate-300">
            {step.text}
          </p>

          {/* Footer */}
          <div className="px-5 pb-4 flex items-center justify-between">
            <button
              onClick={() => setTutorialStep(null)}
              className="text-[11px] uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors"
            >
              Skip tutorial
            </button>
            <div className="flex items-center gap-2">
              {tutorialStep > 0 && (
                <button
                  onClick={() => setTutorialStep(tutorialStep - 1)}
                  className="px-3 py-1.5 rounded text-[11px] uppercase tracking-wider border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={() => setTutorialStep(isLast ? null : tutorialStep + 1)}
                className="px-4 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-colors"
                style={{ backgroundColor: accentColor, color: '#000' }}
              >
                {isLast ? 'Begin' : 'Next'}
              </button>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 pb-3">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-colors"
                style={{ backgroundColor: i === tutorialStep ? accentColor : '#1e293b' }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
