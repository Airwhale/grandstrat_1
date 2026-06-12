'use client';

import { motion } from 'framer-motion';

interface HelpModalProps {
  onClose: () => void;
}

const SECTIONS: { title: string; lines: string[] }[] = [
  {
    title: 'Objective',
    lines: [
      'Lead your faction to dominance in the shadow war of 2034.',
      'WIN by controlling 30 of 46 territories (counter in the top bar).',
      'LOSE if you run out of territories — or out of operatives to deploy.',
    ],
  },
  {
    title: 'The Strategic Turn',
    lines: [
      'Each turn = 1 month. You get 5 actions per turn; spend them in the left panel.',
      'After END TURN: income is collected, AI factions act (watch the news ticker), research advances, and wounded operatives heal.',
      'A global event fires every 3 turns — your choice matters.',
    ],
  },
  {
    title: 'Actions & Costs',
    lines: [
      'MOVE FORCES — shift troops between adjacent territories you own.',
      'ATTACK — quick auto-resolved assault on an adjacent territory. Outcome depends on troop counts and fortification.',
      'COVERT OP — deploy your named operatives into XCOM-style tactical combat. Better results than auto-resolve, but they can DIE. Permanently.',
      'BUILD — construct buildings (90–200 credits). Banks/factories boost income, labs boost research, hospitals heal.',
      'RESEARCH — spend tech points to start a tech (1–3 turns).',
      'RECRUIT — new operative: 50 credits + 10 manpower.',
      'ESPIONAGE — send a spy to gather intel, sabotage garrisons, or incite unrest. Risky: captured spies damage relations.',
      'DIPLOMACY — treaties cost influence (trade 5, pact 10, alliance 20–35).',
      'REST & REFIT — speed up healing for wounded operatives.',
    ],
  },
  {
    title: 'Tactical Combat',
    lines: [
      'Your squad = your 5 best active operatives. Click a unit, then MOVE or ATTACK.',
      'Each unit has 2 actions per turn. Attacking shows hit % — hover a target for the full breakdown (cover, range, flanking, high ground).',
      'Cover matters: half cover -20% to be hit, full cover -40%. Flank enemies to negate it.',
      'OVERWATCH (2 AP) fires at the first enemy that moves. HUNKER doubles your cover.',
      'Operatives at 0 HP are KIA — gone forever, name on the memorial wall. Wounded survivors need 1–3 turns to recover.',
    ],
  },
  {
    title: 'Resources',
    lines: [
      '🪙 Credits — main currency, from territories and buildings.',
      '🧪 Tech Points — fuel research, from labs.',
      '🎭 Influence — spend on diplomacy.',
      '⚙️ Rare Materials — from special territories (gold dot on map).',
      '👥 Manpower — recruiting costs it; operative deaths waste it.',
    ],
  },
];

export default function HelpModal({ onClose }: HelpModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[90] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg border mx-4"
        style={{ backgroundColor: '#0d1220', borderColor: '#1e293b' }}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-slate-800" style={{ backgroundColor: '#0d1220' }}>
          <h2 className="text-lg font-bold tracking-[0.25em] uppercase text-slate-200">
            Field Manual
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 transition-colors text-xl leading-none px-2"
            aria-label="Close help"
          >
            &times;
          </button>
        </div>

        {/* Sections */}
        <div className="px-6 py-4 space-y-6">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400/80 mb-2">
                {section.title}
              </h3>
              <ul className="space-y-1.5">
                {section.lines.map((line, i) => (
                  <li key={i} className="text-sm text-slate-300 leading-relaxed pl-3 border-l border-slate-800">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-slate-800 text-center">
          <span className="text-[10px] text-slate-600 tracking-[0.3em] uppercase">
            Good hunting, Commander
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
