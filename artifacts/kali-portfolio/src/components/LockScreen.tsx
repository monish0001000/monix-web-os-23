import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Lock } from "lucide-react";
import { useOSStore } from "@/lib/store";

export default function LockScreen() {
  const [time, setTime] = useState(new Date());
  const [password, setPassword] = useState("");
  const [shake, setShake] = useState(false);
  const [hint, setHint] = useState("");
  const currentWallpaper = useOSStore((s) => s.currentWallpaper);
  const setLocked = useOSStore((s) => s.setLocked);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleUnlock = () => {
    if (password.length === 0) {
      setHint("Enter a password to unlock");
      return;
    }
    setLocked(false);
    setPassword("");
    setHint("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleUnlock();
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleWrongAttempt = () => {
    if (password.trim() === "") {
      setHint("Enter a password to unlock");
      return;
    }
    triggerShake();
    setHint("Incorrect password. Try again.");
    setPassword("");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 select-none"
      style={{ zIndex: 99999 }}
    >
      {/* Blurred wallpaper background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${currentWallpaper})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(20px) brightness(0.4)",
          transform: "scale(1.05)",
        }}
      />

      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 28,
        }}
      >
        {/* Time */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 200,
              color: "#ffffff",
              letterSpacing: "-2px",
              lineHeight: 1,
              fontFamily: "'Ubuntu', sans-serif",
              textShadow: "0 2px 20px rgba(0,0,0,0.8)",
            }}
          >
            {format(time, "HH:mm")}
          </div>
          <div
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.65)",
              marginTop: 8,
              fontFamily: "'Ubuntu', sans-serif",
              letterSpacing: "0.05em",
            }}
          >
            {format(time, "EEEE, MMMM d")}
          </div>
        </div>

        {/* Avatar + Unlock Form */}
        <motion.div
          animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #1a4a8c 0%, #0d2a54 100%)",
              border: "3px solid rgba(54,123,240,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(54,123,240,0.2)",
            }}
          >
            <span style={{ fontSize: 28, color: "#90bfff", fontWeight: 600, fontFamily: "'Ubuntu', sans-serif" }}>
              M
            </span>
          </div>

          {/* Username */}
          <div
            style={{
              fontSize: 15,
              color: "rgba(255,255,255,0.9)",
              fontFamily: "'Ubuntu', sans-serif",
              fontWeight: 400,
              letterSpacing: "0.02em",
            }}
          >
            monish
          </div>

          {/* Password input */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 0,
            }}
          >
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter password…"
              autoFocus
              style={{
                width: 220,
                height: 38,
                paddingLeft: 14,
                paddingRight: 44,
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 6,
                color: "#ffffff",
                fontSize: 13,
                fontFamily: "'Ubuntu', sans-serif",
                outline: "none",
                backdropFilter: "blur(8px)",
                letterSpacing: "0.1em",
              }}
            />
            <button
              onClick={handleUnlock}
              style={{
                position: "absolute",
                right: 6,
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(54,123,240,0.8)",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              <Lock size={14} color="#ffffff" />
            </button>
          </div>

          {/* Hint text */}
          {hint && (
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,160,160,0.9)",
                fontFamily: "'Ubuntu', sans-serif",
                textAlign: "center",
              }}
            >
              {hint}
            </div>
          )}

          <div
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.3)",
              fontFamily: "'Ubuntu', sans-serif",
            }}
          >
            Press Enter or click the lock icon to unlock
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
