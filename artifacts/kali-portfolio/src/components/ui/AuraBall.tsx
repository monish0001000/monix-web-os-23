import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOSStore } from '@/lib/store';

// ─── AuraBall ─────────────────────────────────────────────────────────────────
// Three visual states:
//  • unarmed  — mic not started (dim)
//  • armed    — listening for "Hey Buddy" (subtle cyan)
//  • active   — wake word heard, command mode (bright emerald + audio pulse)

export default function AuraBall() {
  const auraArmed       = useOSStore((s) => s.auraArmed);
  const auraWakeActive  = useOSStore((s) => s.auraWakeActive);
  const auraHearingSound = useOSStore((s) => s.auraHearingSound);
  const auraMuted       = useOSStore((s) => s.auraMuted);
  const startAuraListening = useOSStore((s) => s.startAuraListening);
  const stopAuraListening  = useOSStore((s) => s.stopAuraListening);

  const [tooltip, setTooltip] = useState(false);

  // Web Audio API analyser for volume-driven animation
  const analyserRef   = useRef<AnalyserNode | null>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const rafRef        = useRef<number | null>(null);
  const [volume, setVolume] = useState(0); // 0–1

  const state: 'active' | 'armed' | 'unarmed' =
    auraWakeActive          ? 'active' :
    auraArmed && !auraMuted ? 'armed'  :
    'unarmed';

  // ── Audio analyser — active only when in command mode ─────────────────────
  useEffect(() => {
    if (state !== 'active') {
      stopAnalyser();
      setVolume(0);
      return;
    }
    startAnalyser();
    return stopAnalyser;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function startAnalyser() {
    if (analyserRef.current) return;
    navigator.mediaDevices?.getUserMedia({ audio: true, video: false })
      .then((stream) => {
        streamRef.current = stream;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx      = new AudioCtx();
        const source   = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
        tick(analyser);
      })
      .catch(() => {/* mic already in use by recognition — fallback to sound flag */});
  }

  function stopAnalyser() {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    analyserRef.current = null;
  }

  function tick(analyser: AnalyserNode) {
    const data = new Uint8Array(analyser.frequencyBinCount);
    function loop() {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length / 255;
      setVolume(avg);
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
  }

  function handleClick() {
    if (state === 'unarmed') startAuraListening();
    else                     stopAuraListening();
  }

  // ── Volume-driven scale — fallback to hearing-sound flag ─────────────────
  const hasVolumeData = analyserRef.current !== null;
  const activeScale   = hasVolumeData
    ? 1 + volume * 0.55          // Web Audio: smooth volume tracking
    : auraHearingSound ? 1.35 : 1; // Fallback: snap between "hearing" states

  // ── Colors per state ──────────────────────────────────────────────────────
  const bgColor =
    state === 'active'  ? 'rgba(16,185,129,0.22)'  :
    state === 'armed'   ? 'rgba(0,180,220,0.10)'   :
                          'rgba(30,30,40,0.75)';

  const borderColor =
    state === 'active'  ? 'rgba(52,211,153,0.90)'  :
    state === 'armed'   ? 'rgba(0,200,240,0.40)'   :
                          'rgba(80,90,110,0.45)';

  const glowColor =
    state === 'active'
      ? `0 0 0 ${4 + volume * 10}px rgba(16,185,129,0.22), 0 0 ${28 + volume * 24}px ${8 + volume * 12}px rgba(52,211,153,${0.40 + volume * 0.35})`
      : state === 'armed'
        ? '0 0 0 2px rgba(0,200,240,0.10), 0 0 14px 4px rgba(0,180,220,0.22)'
        : '0 0 0 1px rgba(60,70,90,0.3)';

  const innerColor =
    state === 'active'  ? 'rgba(52,211,153,0.98)'  :
    state === 'armed'   ? 'rgba(0,200,240,0.65)'   :
                          'rgba(100,120,140,0.50)';

  const tooltipText =
    state === 'unarmed' ? 'Click to arm AURA — say "Hey Buddy"'           :
    state === 'armed'   ? 'AURA Armed — say "Hey Buddy"  |  double-click to wake' :
                          'AURA Listening for your command…';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 64,
        right: 20,
        zIndex: 8000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 6,
        pointerEvents: 'none',
      }}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              pointerEvents: 'none',
              background: 'rgba(10,12,20,0.92)',
              border: `1px solid ${state === 'active' ? 'rgba(52,211,153,0.35)' : 'rgba(0,200,240,0.25)'}`,
              borderRadius: 8,
              padding: '5px 10px',
              fontSize: 11,
              fontFamily: 'monospace',
              color: state === 'active' ? 'rgba(52,211,153,0.95)' :
                     state === 'armed'  ? 'rgba(0,220,255,0.9)'  :
                                          'rgba(180,190,200,0.85)',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
              letterSpacing: '0.03em',
            }}
          >
            {tooltipText}
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Ball */}
      <motion.button
        onClick={handleClick}
        onMouseEnter={() => setTooltip(true)}
        onMouseLeave={() => setTooltip(false)}
        title={tooltipText}
        style={{
          pointerEvents: 'auto',
          width: 46,
          height: 46,
          borderRadius: '50%',
          background: bgColor,
          border: `1.5px solid ${borderColor}`,
          boxShadow: glowColor,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          transition: 'background 0.3s, border-color 0.3s',
          position: 'relative',
          overflow: 'hidden',
        }}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.92 }}
      >
        {/* Inner orb — volume-driven when active */}
        <motion.div
          animate={
            state === 'active' ? {
              scale:   activeScale,
              opacity: [0.85, 1, 0.85],
            } : state === 'armed' ? {
              scale:   [1, 1.10, 1],
              opacity: [0.55, 0.72, 0.55],
            } : {
              scale:   1,
              opacity: 0.35,
            }
          }
          transition={
            state === 'active' && hasVolumeData
              ? { duration: 0.05, ease: 'linear' }       // fast for real volume
              : { duration: state === 'active' ? 0.85 : 2.4, repeat: Infinity, ease: 'easeInOut' }
          }
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: innerColor,
            boxShadow: state !== 'unarmed'
              ? `0 0 ${12 + volume * 18}px ${4 + volume * 8}px ${innerColor}`
              : 'none',
          }}
        />

        {/* Outer ripple — armed & active */}
        {state !== 'unarmed' && (
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `1.5px solid ${state === 'active' ? 'rgba(52,211,153,0.65)' : 'rgba(0,240,255,0.35)'}`,
              pointerEvents: 'none',
            }}
            animate={{ scale: [1, 1.8], opacity: [0.65, 0] }}
            transition={{
              duration: state === 'active' ? 0.9 : 2.4,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        )}

        {/* Second ripple — active only */}
        {state === 'active' && (
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '1px solid rgba(52,211,153,0.4)',
              pointerEvents: 'none',
            }}
            animate={{ scale: [1, 2.2], opacity: [0.45, 0] }}
            transition={{ duration: 1.35, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
          />
        )}
      </motion.button>
    </div>
  );
}
