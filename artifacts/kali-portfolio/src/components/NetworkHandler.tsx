import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function NetworkHandler() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          key="network-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => window.location.reload()}
          className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center cursor-pointer"
          style={{
            zIndex: 99999,
            background: "rgba(0,0,0,0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <img
            src="/internet_handler.webp"
            alt="Connection Lost"
            className="w-1/2 max-w-md object-contain animate-pulse"
            draggable={false}
          />
          <p
            style={{
              marginTop: 24,
              fontFamily: "monospace",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.2em",
              color: "#ff2244",
              textShadow: "0 0 12px rgba(255,34,68,0.8), 0 0 24px rgba(255,34,68,0.4)",
              textAlign: "center",
            }}
          >
            CONNECTION SEVERED. CLICK TO RECONNECT.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
