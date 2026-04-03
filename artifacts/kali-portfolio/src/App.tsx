import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import BootScreen from "./components/BootScreen";
import LoginScreen from "./components/LoginScreen";
import Desktop from "./components/Desktop";
import { useOSStore } from "./lib/store";

const queryClient = new QueryClient();

type Phase = "boot" | "login" | "desktop";

function AppInner() {
  const [phase, setPhase] = useState<Phase>("boot");
  const isLocked = useOSStore((s) => s.isLocked);
  const setLocked = useOSStore((s) => s.setLocked);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.body.style.background = "#000000";
  }, []);

  return (
    <div
      className="w-full h-[100dvh] overflow-hidden font-sans"
      style={{ background: "#000000" }}
    >
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
            className="w-full h-full relative"
          >
            {/* Desktop — blurred when locked */}
            <motion.div
              className="w-full h-full"
              animate={{ filter: isLocked ? "blur(8px)" : "blur(0px)" }}
              transition={{ duration: 0.3 }}
              style={{ pointerEvents: isLocked ? "none" : "auto" }}
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
