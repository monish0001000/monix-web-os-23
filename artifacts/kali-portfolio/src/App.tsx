import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import BootScreen from "./components/BootScreen";
import Desktop from "./components/Desktop";

const queryClient = new QueryClient();

function App() {
  const [bootComplete, setBootComplete] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="w-full h-[100dvh] overflow-hidden bg-black text-foreground font-sans">
          <AnimatePresence mode="wait">
            {!bootComplete ? (
              <BootScreen key="boot" onComplete={() => setBootComplete(true)} />
            ) : (
              <motion.div
                key="desktop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
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
