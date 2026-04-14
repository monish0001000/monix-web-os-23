import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOSStore } from '@/lib/store';

export default function AuraListenGlow() {
  const auraWakeActive = useOSStore((s) => s.auraWakeActive);
  const frameRef = useRef<number | null>(null);
  const progressRef = useRef(0);
  const topRef    = useRef<HTMLDivElement>(null);
  const rightRef  = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const leftRef   = useRef<HTMLDivElement>(null);

  const COLORS = [
    '#00f0ff', // neon cyan
    '#7c3aed', // electric violet
    '#00ff99', // matrix green
    '#f000ff', // magenta
    '#00f0ff', // back to cyan
  ];

  function lerpColor(a: string, b: string, t: number): string {
    const parse = (hex: string) => [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
    const ca = parse(a);
    const cb = parse(b);
    const r = Math.round(ca[0] + (cb[0] - ca[0]) * t);
    const g = Math.round(ca[1] + (cb[1] - ca[1]) * t);
    const bl = Math.round(ca[2] + (cb[2] - ca[2]) * t);
    return `rgb(${r},${g},${bl})`;
  }

  function getColor(offset: number): string {
    const total = COLORS.length - 1;
    const p = ((offset % 1) + 1) % 1;
    const idx = p * total;
    const i = Math.floor(idx);
    return lerpColor(COLORS[i], COLORS[Math.min(i + 1, total)], idx - i);
  }

  useEffect(() => {
    if (!auraWakeActive) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      return;
    }

    let lastTime = 0;
    const SPEED = 0.0004; // full cycle per ms

    function animate(ts: number) {
      if (lastTime) progressRef.current = (progressRef.current + (ts - lastTime) * SPEED) % 1;
      lastTime = ts;
      const p = progressRef.current;

      if (topRef.current) {
        topRef.current.style.background =
          `linear-gradient(90deg, ${getColor(p)}, ${getColor(p + 0.25)}, ${getColor(p + 0.5)})`;
      }
      if (rightRef.current) {
        rightRef.current.style.background =
          `linear-gradient(180deg, ${getColor(p + 0.25)}, ${getColor(p + 0.5)}, ${getColor(p + 0.75)})`;
      }
      if (bottomRef.current) {
        bottomRef.current.style.background =
          `linear-gradient(270deg, ${getColor(p + 0.5)}, ${getColor(p + 0.75)}, ${getColor(p + 1.0)})`;
      }
      if (leftRef.current) {
        leftRef.current.style.background =
          `linear-gradient(0deg, ${getColor(p + 0.75)}, ${getColor(p + 1.0)}, ${getColor(p + 0.25)})`;
      }

      frameRef.current = requestAnimationFrame(animate);
    }

    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [auraWakeActive]);

  const BAR = 3;
  const GLOW = 12;

  return (
    <AnimatePresence>
      {auraWakeActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        >
          {/* Top */}
          <div
            ref={topRef}
            style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              height: BAR,
              filter: `blur(0px) drop-shadow(0 0 ${GLOW}px currentColor)`,
            }}
          />
          {/* Right */}
          <div
            ref={rightRef}
            style={{
              position: 'absolute', top: 0, right: 0, bottom: 0,
              width: BAR,
              filter: `drop-shadow(0 0 ${GLOW}px currentColor)`,
            }}
          />
          {/* Bottom */}
          <div
            ref={bottomRef}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: BAR,
              filter: `drop-shadow(0 0 ${GLOW}px currentColor)`,
            }}
          />
          {/* Left */}
          <div
            ref={leftRef}
            style={{
              position: 'absolute', top: 0, left: 0, bottom: 0,
              width: BAR,
              filter: `drop-shadow(0 0 ${GLOW}px currentColor)`,
            }}
          />

          {/* Listening label */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ delay: 0.15, duration: 0.2 }}
            style={{
              position: 'absolute',
              top: 14,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(0,240,255,0.3)',
              borderRadius: 20,
              padding: '4px 16px',
              fontSize: 11,
              fontFamily: 'monospace',
              letterSpacing: '0.12em',
              color: '#00f0ff',
              whiteSpace: 'nowrap',
              boxShadow: '0 0 16px rgba(0,240,255,0.2)',
            }}
          >
            ● AURA LISTENING
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
