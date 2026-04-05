import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Monitor, Info, Check } from "lucide-react";
import WindowChrome from "./WindowChrome";
import { useOSStore } from "@/lib/store";

interface SettingsAppProps {
  onClose: () => void;
  onMinimize: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
}

type Tab = "personalization" | "display" | "sysinfo";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "personalization", label: "Personalization", icon: <Palette size={15} /> },
  { id: "display",         label: "Display",         icon: <Monitor size={15} /> },
  { id: "sysinfo",         label: "System Info",     icon: <Info size={15} /> },
];

function useUptime() {
  const [uptime, setUptime] = useState(0);
  useEffect(() => {
    setUptime(Math.floor(performance.now() / 1000));
    const id = setInterval(() => setUptime((u) => u + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(uptime / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  const s = uptime % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function CyberpunkSlider({
  label,
  value,
  min,
  max,
  unit,
  accentColor,
  glowColor,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  accentColor: string;
  glowColor: string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em" }}>
          {label}
        </span>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 16,
            fontWeight: 700,
            color: accentColor,
            textShadow: `0 0 10px ${glowColor}`,
            letterSpacing: "0.05em",
          }}
        >
          {value}{unit}
        </span>
      </div>

      <div style={{ position: "relative", height: 20, display: "flex", alignItems: "center" }}>
        {/* Track background */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: 4,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        />
        {/* Filled portion */}
        <div
          style={{
            position: "absolute",
            left: 0,
            width: `${pct}%`,
            height: 4,
            background: `linear-gradient(90deg, ${accentColor}66, ${accentColor})`,
            borderRadius: 4,
            boxShadow: `0 0 8px ${glowColor}`,
            transition: "width 0.05s",
          }}
        />
        {/* Native range input (invisible but functional) */}
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: "pointer",
            zIndex: 2,
          }}
        />
        {/* Thumb */}
        <div
          style={{
            position: "absolute",
            left: `calc(${pct}% - 8px)`,
            width: 16,
            height: 16,
            background: accentColor,
            borderRadius: "50%",
            boxShadow: `0 0 10px ${glowColor}, 0 0 20px ${glowColor}66`,
            border: "2px solid rgba(0,0,0,0.4)",
            transition: "left 0.05s",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      </div>
    </div>
  );
}

function PersonalizationTab() {
  const { wallpapers, currentWallpaper, setWallpaper } = useOSStore();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <p style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(0,240,255,0.5)", letterSpacing: "0.15em", marginBottom: 16 }}>
          SELECT WALLPAPER
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
          }}
        >
          {wallpapers.map((wp, i) => {
            const isSelected = currentWallpaper === wp;
            return (
              <motion.div
                key={i}
                whileHover={{ scale: 1.03, boxShadow: "0 0 18px rgba(0,240,255,0.3)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setWallpaper(wp)}
                style={{
                  position: "relative",
                  aspectRatio: "16/9",
                  borderRadius: 7,
                  overflow: "hidden",
                  cursor: "pointer",
                  border: isSelected ? "2px solid #00f0ff" : "2px solid rgba(255,255,255,0.06)",
                  boxShadow: isSelected ? "0 0 16px rgba(0,240,255,0.4)" : "none",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
              >
                <img
                  src={wp}
                  alt={`Wallpaper ${i + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  draggable={false}
                />
                {isSelected && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,240,255,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        background: "#00f0ff",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Check size={13} color="#000" />
                    </div>
                  </div>
                )}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "4px 6px",
                    background: "rgba(0,0,0,0.55)",
                    fontFamily: "monospace",
                    fontSize: 9,
                    color: "rgba(255,255,255,0.6)",
                    letterSpacing: "0.08em",
                  }}
                >
                  WP_{String(i + 1).padStart(2, "0")}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DisplayTab() {
  const brightness = useOSStore((s) => s.brightness);
  const warmth = useOSStore((s) => s.warmth);
  const setBrightness = useOSStore((s) => s.setBrightness);
  const setWarmth = useOSStore((s) => s.setWarmth);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div>
        <p style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(0,240,255,0.5)", letterSpacing: "0.15em", marginBottom: 20 }}>
          DISPLAY CONTROLS
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {/* Brightness */}
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
              padding: "18px 20px",
            }}
          >
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", marginBottom: 14 }}>
              ☀ BRIGHTNESS
            </div>
            <CyberpunkSlider
              label="Screen Brightness"
              value={brightness}
              min={10}
              max={150}
              unit="%"
              accentColor="#00f0ff"
              glowColor="rgba(0,240,255,0.6)"
              onChange={setBrightness}
            />
            <p style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 10, letterSpacing: "0.08em" }}>
              RANGE: 10% – 150% · DEFAULT: 100%
            </p>
          </div>

          {/* Warmth / Night Mode */}
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
              padding: "18px 20px",
            }}
          >
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,120,0,0.5)", letterSpacing: "0.12em", marginBottom: 14 }}>
              🌙 NIGHT MODE / WARMTH
            </div>
            <CyberpunkSlider
              label="Color Temperature"
              value={warmth}
              min={0}
              max={50}
              unit="%"
              accentColor="#ffaa00"
              glowColor="rgba(255,170,0,0.6)"
              onChange={setWarmth}
            />
            <p style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 10, letterSpacing: "0.08em" }}>
              RANGE: 0% – 50% · DEFAULT: 0% (COOL)
            </p>
          </div>
        </div>
      </div>

      {/* Preview hint */}
      <div
        style={{
          padding: "12px 16px",
          background: "rgba(0,240,255,0.04)",
          border: "1px solid rgba(0,240,255,0.12)",
          borderRadius: 8,
          fontFamily: "monospace",
          fontSize: 10,
          color: "rgba(0,240,255,0.4)",
          letterSpacing: "0.1em",
        }}
      >
        ↑ CHANGES APPLY GLOBALLY IN REAL-TIME
      </div>
    </div>
  );
}

function SystemInfoTab() {
  const uptime = useUptime();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Hero title */}
      <div style={{ textAlign: "center", padding: "20px 0 8px" }}>
        <motion.h1
          animate={{
            textShadow: [
              "0 0 10px rgba(0,240,255,0.6), 0 0 30px rgba(0,240,255,0.3)",
              "0 0 20px rgba(0,240,255,0.9), 0 0 50px rgba(0,240,255,0.5)",
              "0 0 10px rgba(0,240,255,0.6), 0 0 30px rgba(0,240,255,0.3)",
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            fontFamily: "monospace",
            fontSize: 26,
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "0.25em",
            margin: 0,
          }}
        >
          MONIX OS
        </motion.h1>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 12,
            color: "rgba(0,240,255,0.6)",
            letterSpacing: "0.2em",
            marginTop: 4,
          }}
        >
          v1.0.0 · STABLE
        </div>
      </div>

      {/* Info grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "SYSTEM TYPE",   value: "WEB-OPERATING SYSTEM" },
          { label: "ARCHITECTURE",  value: "React / TypeScript" },
          { label: "KERNEL",        value: "MONIX 6.7 LTS" },
          { label: "UPTIME",        value: uptime, live: true },
          { label: "SHELL",         value: "monix-sh 5.2.1" },
          { label: "DISPLAY",       value: "Chromium Renderer" },
          { label: "MEMORY",        value: "16 GB DDR5" },
          { label: "CPU CORES",     value: "8-Core · x86_64" },
        ].map(({ label, value, live }) => (
          <div
            key={label}
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 8,
              padding: "12px 14px",
            }}
          >
            <div style={{ fontFamily: "monospace", fontSize: 8, color: "rgba(0,240,255,0.4)", letterSpacing: "0.15em", marginBottom: 5 }}>
              {label}
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 12,
                color: live ? "#00ff88" : "rgba(255,255,255,0.8)",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textShadow: live ? "0 0 8px rgba(0,255,136,0.5)" : "none",
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Developer credit */}
      <div
        style={{
          textAlign: "center",
          padding: "16px 20px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: 10,
        }}
      >
        <div style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", marginBottom: 8 }}>
          DESIGNED & DEVELOPED BY
        </div>
        <motion.div
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          style={{
            fontFamily: "monospace",
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: "0.3em",
            background: "linear-gradient(90deg, #ffd700, #00f0ff, #ffd700, #00f0ff)",
            backgroundSize: "300% 100%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          MONISH
        </motion.div>
        <div style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", marginTop: 6 }}>
          MONIX OS SIMULATION · ALL RIGHTS RESERVED
        </div>
      </div>
    </div>
  );
}

export default function SettingsApp({
  onClose,
  onMinimize,
  isActive,
  onFocus,
  initialX,
  initialY,
  zIndex,
}: SettingsAppProps) {
  const [activeTab, setActiveTab] = useState<Tab>("personalization");

  return (
    <WindowChrome
      title="Settings"
      onClose={onClose}
      onMinimize={onMinimize}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
      width={780}
      height={560}
    >
      <style>{`
        .settings-scroll::-webkit-scrollbar { width: 5px; }
        .settings-scroll::-webkit-scrollbar-track { background: transparent; }
        .settings-scroll::-webkit-scrollbar-thumb { background: rgba(0,240,255,0.25); border-radius: 3px; }
      `}</style>

      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#050505",
          display: "flex",
          fontFamily: "sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Sidebar */}
        <div
          style={{
            width: 190,
            flexShrink: 0,
            borderRight: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(255,255,255,0.01)",
            display: "flex",
            flexDirection: "column",
            padding: "16px 10px",
            gap: 4,
          }}
        >
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 9,
              color: "rgba(255,255,255,0.25)",
              letterSpacing: "0.2em",
              padding: "0 8px 12px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              marginBottom: 8,
            }}
          >
            MONIX SETTINGS
          </div>

          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 7,
                  border: "none",
                  cursor: "pointer",
                  background: isActive
                    ? "linear-gradient(90deg, rgba(0,240,255,0.1), rgba(0,240,255,0.03))"
                    : "transparent",
                  borderLeft: isActive ? "2px solid #00f0ff" : "2px solid transparent",
                  color: isActive ? "#00f0ff" : "rgba(255,255,255,0.5)",
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 400,
                  textAlign: "left",
                  width: "100%",
                  transition: "all 0.2s",
                  boxShadow: isActive ? "inset 0 0 12px rgba(0,240,255,0.06)" : "none",
                }}
              >
                <span style={{ opacity: isActive ? 1 : 0.6 }}>{tab.icon}</span>
                {tab.label}
              </motion.button>
            );
          })}
        </div>

        {/* Content area */}
        <div
          className="settings-scroll"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 28px",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "personalization" && <PersonalizationTab />}
              {activeTab === "display" && <DisplayTab />}
              {activeTab === "sysinfo" && <SystemInfoTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </WindowChrome>
  );
}
