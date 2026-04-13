import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import BootScreen from "./components/BootScreen";
import LoginScreen from "./components/LoginScreen";
import Desktop from "./components/Desktop";
import NetworkHandler from "./components/NetworkHandler";
import { useOSStore } from "./lib/store";

const queryClient = new QueryClient();

type Phase = "boot" | "login" | "desktop";

function useDisplayFilter() {
  const brightness = useOSStore((s) => s.brightness);
  const warmth = useOSStore((s) => s.warmth);
  const hasFilter = brightness !== 100 || warmth !== 0;
  return hasFilter ? `brightness(${brightness / 100}) sepia(${warmth / 50})` : undefined;
}

// ── Global AURA Wake Glow — immersive pulsing screen border ──────────────────
function AuraWakeGlow() {
  const auraWakeActive  = useOSStore((s) => s.auraWakeActive);
  const auraHearingSound = useOSStore((s) => s.auraHearingSound);

  return (
    <AnimatePresence>
      {auraWakeActive && (
        <>
          {/* Outer border glow — pulses on the screen edge */}
          <motion.div
            key="aura-wake-border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              pointerEvents: 'none',
              border: auraHearingSound
                ? '2.5px solid rgba(52,211,153,0.9)'
                : '2px solid rgba(0,240,255,0.65)',
              boxShadow: auraHearingSound
                ? 'inset 0 0 60px 20px rgba(52,211,153,0.18), inset 0 0 130px 50px rgba(0,255,180,0.08), 0 0 40px 8px rgba(52,211,153,0.35)'
                : 'inset 0 0 70px 18px rgba(0,240,255,0.22), inset 0 0 150px 50px rgba(0,200,255,0.10), 0 0 30px 6px rgba(0,240,255,0.28)',
              animation: auraHearingSound
                ? 'aura-wake-pulse-active 1.0s ease-in-out infinite'
                : 'aura-wake-pulse 1.8s ease-in-out infinite',
              transition: 'box-shadow 0.2s, border-color 0.2s',
              borderRadius: 2,
            }}
          />
          {/* Corner accent lights */}
          {(['top-left','top-right','bottom-left','bottom-right'] as const).map((corner) => (
            <motion.div
              key={`aura-corner-${corner}`}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.15, 1] }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'fixed',
                zIndex: 99999,
                pointerEvents: 'none',
                width: 20,
                height: 20,
                ...(corner.includes('top')    ? { top: 0 }    : { bottom: 0 }),
                ...(corner.includes('left')   ? { left: 0 }   : { right: 0 }),
                background: auraHearingSound
                  ? 'rgba(52,211,153,0.9)'
                  : 'rgba(0,240,255,0.8)',
                clipPath: corner === 'top-left'     ? 'polygon(0 0, 100% 0, 0 100%)'   :
                          corner === 'top-right'    ? 'polygon(0 0, 100% 0, 100% 100%)' :
                          corner === 'bottom-left'  ? 'polygon(0 0, 100% 100%, 0 100%)' :
                                                      'polygon(100% 0, 100% 100%, 0 100%)',
                filter: 'blur(1px)',
              }}
            />
          ))}
        </>
      )}
    </AnimatePresence>
  );
}

function AppInner() {
  const [phase, setPhase] = useState<Phase>("boot");
  const isLocked = useOSStore((s) => s.isLocked);
  const displayFilter = useDisplayFilter();
  const setLocked = useOSStore((s) => s.setLocked);
  const themeAccent = useOSStore((s) => s.themeAccent);

  useEffect(() => {
    document.documentElement.style.setProperty("--os-accent", themeAccent);
  }, [themeAccent]);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.body.style.background = "#000000";
  }, []);

  return (
    <div
      className="w-full h-[100dvh] flex flex-col overflow-hidden bg-black text-white font-sans"
    >
      <AuraWakeGlow />
      <NetworkHandler />
      <AnimatePresence mode="wait">
        {phase === "boot" && (
          <BootScreen key="boot" onComplete={() => setPhase("login")} />
        )}

        {phase === "login" && (
          <LoginScreen key="login" onLogin={() => setPhase("desktop")} />
        )}

        {phase === "desktop" && (
          <motion.div
            key="desktop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex-1 w-full relative overflow-hidden"
          >
            {/* Desktop — blurred when locked, display-filtered by settings */}
            <motion.div
              className="w-full h-full"
              style={{
                filter: [
                  isLocked ? "blur(8px)" : "",
                  displayFilter ?? "",
                ].filter(Boolean).join(" ") || undefined,
                pointerEvents: isLocked ? "none" : "auto",
                transition: "filter 0.3s",
              }}
            >
              <Desktop />
            </motion.div>

            {/* Lock screen on top */}
            <AnimatePresence>
              {isLocked && (
                <LoginScreen
                  key="lockscreen"
                  isLockMode
                  onLogin={() => setLocked(false)}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppInner />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
