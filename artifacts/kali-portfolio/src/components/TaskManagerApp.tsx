import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Cpu, MemoryStick, Activity, X } from "lucide-react";
import WindowChrome from "./WindowChrome";

interface TaskManagerAppProps {
  onClose: () => void;
  onMinimize: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
}

const PROCESSES = [
  { name: "Kernel_System",       base: { cpu: 2,  ram: 512  } },
  { name: "Aura_AI_Core.exe",    base: { cpu: 18, ram: 2048 } },
  { name: "Sentinel_WFP.sys",    base: { cpu: 8,  ram: 768  } },
  { name: "Window_Manager",      base: { cpu: 5,  ram: 340  } },
  { name: "Cykrypt_Engine",      base: { cpu: 12, ram: 1024 } },
  { name: "monix-compositor",    base: { cpu: 3,  ram: 256  } },
  { name: "net_monitor.daemon",  base: { cpu: 1,  ram: 128  } },
];

const TOTAL_RAM_GB = 16;

function randomize(base: number, spread: number) {
  return Math.max(0, base + (Math.random() - 0.5) * spread * 2);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function GaugeBar({
  value,
  max,
  color,
  glowColor,
}: {
  value: number;
  max: number;
  color: string;
  glowColor: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div
      style={{
        width: "100%",
        height: 10,
        background: "rgba(255,255,255,0.05)",
        borderRadius: 6,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <motion.div
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          height: "100%",
          background: `linear-gradient(90deg, ${color}99, ${color})`,
          borderRadius: 6,
          boxShadow: `0 0 8px ${glowColor}`,
        }}
      />
    </div>
  );
}

export default function TaskManagerApp({
  onClose,
  onMinimize,
  isActive,
  onFocus,
  initialX,
  initialY,
  zIndex,
}: TaskManagerAppProps) {
  const [cpu, setCpu] = useState(22);
  const [ram, setRam] = useState(4.6);
  const [processes, setProcesses] = useState(
    PROCESSES.map((p, i) => ({
      ...p,
      pid: 1000 + i * 137,
      cpu: p.base.cpu,
      ram: p.base.ram,
    }))
  );
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const targetCpu = useRef(22);
  const targetRam = useRef(4.6);

  useEffect(() => {
    const interval = setInterval(() => {
      targetCpu.current = randomize(35, 30);
      targetRam.current = randomize(5.5, 2.5);

      setCpu((prev) => Math.round(lerp(prev, targetCpu.current, 0.4) * 10) / 10);
      setRam((prev) => Math.round(lerp(prev, targetRam.current, 0.35) * 100) / 100);

      setProcesses((prev) =>
        prev.map((p) => ({
          ...p,
          cpu: Math.round(randomize(p.base.cpu, p.base.cpu * 0.6) * 10) / 10,
          ram: Math.round(randomize(p.base.ram, p.base.ram * 0.15)),
        }))
      );
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const cpuColor = cpu > 70 ? "#ff4444" : cpu > 40 ? "#ffaa00" : "#00ff88";
  const ramPct = (ram / TOTAL_RAM_GB) * 100;
  const ramColor = ramPct > 70 ? "#ff4444" : ramPct > 40 ? "#ffaa00" : "#00f0ff";

  return (
    <WindowChrome
      title="System Monitor"
      onClose={onClose}
      onMinimize={onMinimize}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
      width={660}
      height={520}
    >
      <style>{`
        .tm-scroll::-webkit-scrollbar { width: 5px; }
        .tm-scroll::-webkit-scrollbar-track { background: transparent; }
        .tm-scroll::-webkit-scrollbar-thumb { background: rgba(0,240,255,0.3); border-radius: 3px; }
        @keyframes tmPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          display: "flex",
          flexDirection: "column",
          fontFamily: "monospace",
          overflow: "hidden",
        }}
      >
        {/* Top header bar */}
        <div
          style={{
            padding: "10px 16px 8px",
            borderBottom: "1px solid rgba(0,240,255,0.1)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Activity size={13} color="#00f0ff" />
          <span style={{ fontSize: 11, color: "rgba(0,240,255,0.7)", letterSpacing: "0.15em" }}>
            MONIX SYSTEM MONITOR
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 10,
              color: "rgba(0,240,255,0.3)",
              letterSpacing: "0.1em",
              animation: "tmPulse 2s ease-in-out infinite",
            }}
          >
            ● LIVE
          </span>
        </div>

        {/* Gauges section */}
        <div
          style={{
            padding: "16px 16px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
          }}
        >
          {/* CPU */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Cpu size={13} color={cpuColor} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em" }}>
                  CPU
                </span>
              </div>
              <motion.span
                key={Math.round(cpu)}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: 1 }}
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: cpuColor,
                  textShadow: `0 0 10px ${cpuColor}88`,
                  letterSpacing: "0.02em",
                }}
              >
                {Math.round(cpu)}%
              </motion.span>
            </div>
            <GaugeBar value={cpu} max={100} color={cpuColor} glowColor={`${cpuColor}66`} />
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>
              8-CORE · MONIX ARCH X86_64
            </div>
          </div>

          {/* RAM */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <MemoryStick size={13} color={ramColor} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em" }}>
                  RAM
                </span>
              </div>
              <motion.span
                key={ram.toFixed(1)}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: 1 }}
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: ramColor,
                  textShadow: `0 0 10px ${ramColor}88`,
                  letterSpacing: "0.02em",
                }}
              >
                {ram.toFixed(1)} GB
              </motion.span>
            </div>
            <GaugeBar value={ram} max={TOTAL_RAM_GB} color={ramColor} glowColor={`${ramColor}66`} />
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>
              {ram.toFixed(1)} / {TOTAL_RAM_GB} GB USED · DDR5
            </div>
          </div>
        </div>

        {/* Process table */}
        <div className="tm-scroll" style={{ flex: 1, overflowY: "auto" }}>
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "60px 1fr 80px 90px",
              padding: "8px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              position: "sticky",
              top: 0,
              background: "#0a0a0a",
              zIndex: 1,
            }}
          >
            {["PID", "PROCESS", "CPU %", "RAM (MB)"].map((h) => (
              <span
                key={h}
                style={{
                  fontSize: 9,
                  color: "rgba(0,240,255,0.4)",
                  letterSpacing: "0.12em",
                  fontWeight: 700,
                }}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {processes
            .slice()
            .sort((a, b) => b.cpu - a.cpu)
            .map((proc, i) => {
              const isHovered = hoveredRow === i;
              const rowCpuColor =
                proc.cpu > 15 ? "#ff6644" : proc.cpu > 8 ? "#ffaa00" : "#00ff88";
              return (
                <motion.div
                  key={proc.name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onMouseEnter={() => setHoveredRow(i)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "60px 1fr 80px 90px",
                    padding: "9px 16px",
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    background: isHovered
                      ? "rgba(0,240,255,0.04)"
                      : "transparent",
                    cursor: "default",
                    transition: "background 0.15s",
                  }}
                >
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                    {proc.pid}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: isHovered ? "#ffffff" : "rgba(255,255,255,0.75)",
                      transition: "color 0.15s",
                    }}
                  >
                    {proc.name}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: rowCpuColor,
                      textShadow: isHovered ? `0 0 8px ${rowCpuColor}` : "none",
                      transition: "text-shadow 0.15s",
                    }}
                  >
                    {proc.cpu.toFixed(1)}%
                  </span>
                  <span style={{ fontSize: 11, color: "rgba(0,240,255,0.6)" }}>
                    {proc.ram} MB
                  </span>
                </motion.div>
              );
            })}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "8px 16px",
            borderTop: "1px solid rgba(255,255,255,0.04)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>
            {processes.length} PROCESSES · REFRESHING EVERY 1.5s
          </span>
          <span style={{ fontSize: 9, color: "rgba(0,240,255,0.25)", letterSpacing: "0.1em" }}>
            MONIX OS · KERNEL 6.7
          </span>
        </div>
      </div>
    </WindowChrome>
  );
}
