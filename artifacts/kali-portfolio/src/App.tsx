import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import BootScreen from "./components/BootScreen";
import LoginScreen from "./components/LoginScreen";
import Desktop from "./components/Desktop";

const queryClient = new QueryClient();

type Phase = "boot" | "login" | "desktop";

function App() {
  const [phase, setPhase] = useState<Phase>("boot");

  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.body.style.background = "#000000";
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div
          className="w-full h-[100dvh] overflow-hidden font-sans"
          style={{ background: "#000000" }}
        >
          <AnimatePresence mode="wait">
            {phase === "boot" && (
              <BootScreen
                key="boot"
                onComplete={() => setPhase("login")}
              />
            )}

            {phase === "login" && (
              <LoginScreen
                key="login"
                onLogin={() => setPhase("desktop")}
              />
            )}

            {phase === "desktop" && (
              <motion.div
                key="desktop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full h-full"
              >
                <Desktop />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
