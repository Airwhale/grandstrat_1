'use client';

import { useState, ReactNode } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** extra classes for the wrapper */
  className?: string;
}

const SIDE_CLASSES: Record<string, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

/** Hover tooltip with the game's dark-intel styling. Wraps its children inline. */
export default function Tooltip({ content, children, side = 'right', className = '' }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          className={`absolute z-[80] w-56 pointer-events-none ${SIDE_CLASSES[side]}`}
        >
          <span
            className="block rounded-md border px-3 py-2 text-left shadow-2xl"
            style={{
              backgroundColor: 'rgba(8,12,20,0.97)',
              borderColor: '#334155',
              backdropFilter: 'blur(8px)',
            }}
          >
            {content}
          </span>
        </span>
      )}
    </span>
  );
}

/** Small helper for a cost line inside tooltips */
export function CostLine({ label, value, color = '#eab308' }: { label: string; value: string; color?: string }) {
  return (
    <span className="flex justify-between text-[10px] font-mono mt-0.5">
      <span className="text-slate-500">{label}</span>
      <span style={{ color }}>{value}</span>
    </span>
  );
}
