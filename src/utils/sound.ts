// Procedural SFX via Web Audio — no audio files needed.
// All calls are safe no-ops on the server or if audio is unavailable.

let ctx: AudioContext | null = null;
let muted = false;

if (typeof window !== 'undefined') {
  muted = localStorage.getItem('shadowaccord_muted') === '1';
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(m: boolean) {
  muted = m;
  if (typeof window !== 'undefined') {
    localStorage.setItem('shadowaccord_muted', m ? '1' : '0');
  }
}

function tone(freq: number, duration: number, opts: { type?: OscillatorType; gain?: number; sweep?: number; delay?: number } = {}) {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  try {
    const t0 = ac.currentTime + (opts.delay ?? 0);
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = opts.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (opts.sweep) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + opts.sweep), t0 + duration);
    g.gain.setValueAtTime(opts.gain ?? 0.08, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(g).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  } catch { /* audio unavailable */ }
}

function noise(duration: number, opts: { gain?: number; lowpass?: number; delay?: number } = {}) {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  try {
    const t0 = ac.currentTime + (opts.delay ?? 0);
    const len = Math.floor(ac.sampleRate * duration);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const g = ac.createGain();
    g.gain.setValueAtTime(opts.gain ?? 0.1, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = opts.lowpass ?? 2000;
    src.connect(filter).connect(g).connect(ac.destination);
    src.start(t0);
  } catch { /* audio unavailable */ }
}

// ---- Game SFX ----

export const sfx = {
  /** soft UI click */
  click() { tone(660, 0.05, { type: 'square', gain: 0.03 }); },
  /** action confirmed */
  confirm() { tone(520, 0.08, { gain: 0.05 }); tone(780, 0.1, { gain: 0.05, delay: 0.07 }); },
  /** gunshot */
  shot() { noise(0.12, { gain: 0.14, lowpass: 3000 }); tone(180, 0.08, { type: 'triangle', gain: 0.08, sweep: -120 }); },
  /** bullet hits flesh */
  hit() { noise(0.08, { gain: 0.1, lowpass: 900 }); tone(120, 0.1, { type: 'sawtooth', gain: 0.06, sweep: -60 }); },
  /** shot missed */
  miss() { noise(0.15, { gain: 0.04, lowpass: 6000 }); },
  /** critical hit */
  crit() { noise(0.1, { gain: 0.16, lowpass: 1200 }); tone(90, 0.18, { type: 'sawtooth', gain: 0.1, sweep: -50 }); },
  /** unit dies */
  kill() { tone(220, 0.35, { type: 'sawtooth', gain: 0.06, sweep: -160 }); noise(0.25, { gain: 0.08, lowpass: 500, delay: 0.05 }); },
  /** explosion / rocket */
  explosion() { noise(0.5, { gain: 0.2, lowpass: 400 }); tone(60, 0.4, { type: 'sawtooth', gain: 0.12, sweep: -30 }); },
  /** heal / buff */
  heal() { tone(440, 0.1, { gain: 0.05 }); tone(550, 0.1, { gain: 0.05, delay: 0.08 }); tone(660, 0.15, { gain: 0.05, delay: 0.16 }); },
  /** cloak / stealth */
  cloak() { tone(800, 0.3, { type: 'sine', gain: 0.04, sweep: -500 }); },
  /** end turn sting */
  endTurn() { tone(392, 0.12, { type: 'triangle', gain: 0.06 }); tone(523, 0.18, { type: 'triangle', gain: 0.06, delay: 0.1 }); },
  /** ominous event alarm */
  event() { tone(233, 0.4, { type: 'triangle', gain: 0.07 }); tone(220, 0.5, { type: 'triangle', gain: 0.07, delay: 0.25 }); },
  /** territory captured */
  capture() { tone(392, 0.1, { gain: 0.06 }); tone(494, 0.1, { gain: 0.06, delay: 0.09 }); tone(587, 0.2, { gain: 0.07, delay: 0.18 }); },
  /** victory fanfare */
  victory() { [392, 494, 587, 784].forEach((f, i) => tone(f, 0.3, { type: 'triangle', gain: 0.08, delay: i * 0.15 })); },
  /** defeat drone */
  defeat() { tone(196, 0.8, { type: 'sawtooth', gain: 0.05, sweep: -80 }); tone(131, 1.0, { type: 'sawtooth', gain: 0.05, delay: 0.3, sweep: -40 }); },
};
