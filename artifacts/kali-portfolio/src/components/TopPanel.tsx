import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Volume2, VolumeX, Bell, BatteryCharging, Battery,
  Wifi, WifiOff, FolderOpen, TerminalSquare, Monitor,
  Github, Trash2, Power, Globe, Sparkles
} from "lucide-react";
import { SiFirefox } from "react-icons/si";
import { useOSStore } from "@/lib/store";
import StartMenu from "./StartMenu";

interface OpenWindowInfo {
  id: string;
  label: string;
  minimized: boolean;
}

interface TopPanelProps {
  openWindows: OpenWindowInfo[];
  onOpenWindow: (id: string) => void;
  onTaskbarClick: (id: string) => void;
  activeWindowId: string;
}

const BAR_COUNT = 14;
function generateBars() {
  return Array.from({ length: BAR_COUNT }, () => Math.random());
}

function Spectrogram() {
  const [bars, setBars] = useState<number[]>(generateBars);

  useEffect(() => {
    const id = setInterval(() => setBars(generateBars()), 200);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="flex items-end gap-px"
      style={{ height: 16, width: BAR_COUNT * 3 }}
      title="System Activity"
    >
      {bars.map((v, i) => {
        const h = Math.max(2, Math.round(v * 14));
        const isHigh = v > 0.75;
        const color = isHigh
          ? "#00ff88"
          : v > 0.4
          ? "#00c4ff"
          : "rgba(0,196,255,0.45)";
        return (
          <div
            key={i}
            style={{
              width: 2,
              height: h,
              background: color,
              borderRadius: 1,
              boxShadow: isHigh ? `0 0 4px ${color}` : "none",
              transition: "height 0.15s ease, background 0.15s ease",
            }}
          />
        );
      })}
    </div>
  );
}

const TASKBAR_ICON: Record<string, React.ReactNode> = {
  terminal:  <TerminalSquare size={17} color="#c8e6c9" />,
  files:     <FolderOpen size={17} color="#a8c4f5" />,
  trash:     <Trash2 size={17} color="#aaaacc" />,
  github:    <Github size={17} color="#e0e0e0" />,
  portfolio: <Monitor size={17} color="#90d090" />,
  browser:   <Globe size={17} color="#7ec8e3" />,
  sentinel:  <Monitor size={17} color="#00c4ff" />,
  aura:      <Sparkles size={17} color="#c084fc" />,
};

type TrayPopover = "battery" | "network" | "sound" | "notifications" | null;

export default function TopPanel({ openWindows = [], onOpenWindow, onTaskbarClick, activeWindowId }: TopPanelProps) {
  const [time, setTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeWorkspace, setActiveWorkspace] = useState(1);
  const [showCalendar, setShowCalendar] = useState(false);
  const [trayPopover, setTrayPopover] = useState<TrayPopover>(null);
  const [showStartMenu, setShowStartMenu] = useState(false);

  // Battery state
  const [batteryLevel, setBatteryLevel] = useState<number>(100);
  const [isCharging, setIsCharging] = useState<boolean>(true);

  // IP address state
  const [publicIp, setPublicIp] = useState<string | null>(null);

  const calRef = useRef<HTMLDivElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);

  const setLocked = useOSStore((s) => s.setLocked);
  const osVolume = useOSStore((s) => s.osVolume);
  const setOsVolume = useOSStore((s) => s.setOsVolume);

  // Clock + network
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Real battery API
  useEffect(() => {
    let battery: any = null;
    const update = (b: any) => {
      setBatteryLevel(Math.round(b.level * 100));
      setIsCharging(b.charging);
    };
    if ("getBattery" in navigator) {
      (navigator as any).getBattery().then((b: any) => {
        battery = b;
        update(b);
        b.addEventListener("levelchange", () => update(b));
        b.addEventListener("chargingchange", () => update(b));
      }).catch(() => {});
    }
    return () => {
      if (battery) {
        battery.removeEventListener("levelchange", () => {});
        battery.removeEventListener("chargingchange", () => {});
      }
    };
  }, []);

  // Real public IP
  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then((r) => r.json())
      .then((d) => setPublicIp(d.ip))
      .catch(() => setPublicIp(null));
  }, []);

  // Close popovers on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setShowCalendar(false);
      if (trayRef.current && !trayRef.current.contains(e.target as Node)) setTrayPopover(null);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const btnClass = "flex items-center justify-center cursor-pointer transition-colors hover:bg-white/10 h-full px-2.5";

  const appLaunchers = [
    { id: "files",   icon: <FolderOpen size={16} color="#a8c4f5" />, title: "File Manager" },
    { id: "firefox", icon: <SiFirefox size={15} color="#ff6611" />, title: "Firefox", action: () => window.open("https://mozilla.org", "_blank") },
    { id: "terminal",icon: <TerminalSquare size={16} color="#c8e6c9" />, title: "Terminal" },
    {
      id: "aura",
      icon: (
        <div style={{
          width: 20, height: 20, borderRadius: "50%",
          background: "linear-gradient(135deg, #7c3aed, #c084fc)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 8px rgba(192,132,252,0.7)",
        }}>
          <Sparkles size={11} color="#fff" strokeWidth={2} />
        </div>
      ),
      title: "AURA AI",
    },
  ];

  const now = time;
  const monthName = format(now, "MMMM yyyy");
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const today = now.getDate();

  const toggleTray = (key: TrayPopover) => {
    setShowCalendar(false);
    setShowStartMenu(false);
    setTrayPopover((prev) => (prev === key ? null : key));
  };

  const handleLogoClick = () => {
    setTrayPopover(null);
    setShowCalendar(false);
    setShowStartMenu((v) => !v);
  };

  const popoverBase: React.CSSProperties = {
    position: "fixed",
    bottom: 38,
    background: "rgba(18, 18, 26, 0.97)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(255,255,255,0.12)",
    padding: "10px 14px",
    zIndex: 400,
    minWidth: 200,
    boxShadow: "0 -8px 32px rgba(0,0,0,0.9)",
    borderRadius: 8,
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "'Ubuntu', sans-serif",
  };

  // Battery color
  const battColor = batteryLevel > 40 ? "#6ee7a0" : batteryLevel > 20 ? "#f4c066" : "#f87171";

  return (
    <>
      <StartMenu
        open={showStartMenu}
        onClose={() => setShowStartMenu(false)}
        onOpenWindow={(id) => { onOpenWindow(id); setShowStartMenu(false); }}
      />

      <div
        className="fixed bottom-0 left-0 w-full z-50 select-none font-sans flex items-stretch justify-between"
        style={{
          height: 38,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(18px) saturate(160%)",
          WebkitBackdropFilter: "blur(18px) saturate(160%)",
          borderTop: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 -2px 20px rgba(0,0,0,0.4)",
        }}
      >
        {/* ── LEFT ── */}
        <div className="flex items-center h-full gap-0">

          {/* Logo — MONIX "M" */}
          <div
            className="flex items-center justify-center cursor-pointer h-full transition-colors"
            style={{
              paddingLeft: 10, paddingRight: 10,
              background: showStartMenu ? "rgba(0,212,255,0.15)" : "transparent",
              borderRight: showStartMenu ? "1px solid rgba(0,212,255,0.3)" : "1px solid transparent",
            }}
            title="Applications"
            onClick={handleLogoClick}
          >
            <span
              style={{
                fontFamily: "'Ubuntu', 'Inter', sans-serif",
                fontSize: 17,
                fontWeight: 900,
                letterSpacing: "-0.02em",
                background: showStartMenu
                  ? "linear-gradient(135deg, #00f0ff 0%, #00ff88 100%)"
                  : "linear-gradient(135deg, #00c4ff 0%, #0080ff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                textShadow: "none",
                filter: showStartMenu
                  ? "drop-shadow(0 0 6px rgba(0,240,255,0.8))"
                  : "drop-shadow(0 0 4px rgba(0,196,255,0.5))",
                lineHeight: 1,
                userSelect: "none",
              }}
            >
              M
            </span>
          </div>

          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.1)" }} />

          {/* App launchers */}
          {appLaunchers.map((launcher) => (
            <div
              key={launcher.id}
              className={btnClass}
              title={launcher.title}
              onClick={() => {
                setShowStartMenu(false);
                launcher.action ? launcher.action() : onOpenWindow(launcher.id);
              }}
            >
              {launcher.icon}
            </div>
          ))}

          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.1)", marginLeft: 2 }} />

          {/* Workspace switcher */}
          <div className="flex items-center h-full px-1.5 gap-0.5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                onClick={() => setActiveWorkspace(n)}
                style={{
                  width: 22, height: 20, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 500, cursor: "pointer",
                  border: activeWorkspace === n ? "1px solid #367BF0" : "1px solid rgba(255,255,255,0.15)",
                  background: activeWorkspace === n ? "rgba(54,123,240,0.35)" : "rgba(255,255,255,0.04)",
                  color: activeWorkspace === n ? "#90bfff" : "rgba(255,255,255,0.55)",
                  transition: "all 0.1s",
                }}
              >
                {n}
              </div>
            ))}
          </div>

          {/* Open windows taskbar */}
          {openWindows.length > 0 && (
            <>
              <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.1)", marginLeft: 4 }} />
              <div className="flex items-center h-full gap-1 px-1">
                {openWindows.map((win) => {
                  const isActive = activeWindowId === win.id;
                  const icon = TASKBAR_ICON[win.id] ?? <Monitor size={17} color="rgba(255,255,255,0.7)" />;
                  return (
                    <button
                      key={win.id}
                      onClick={() => onTaskbarClick(win.id)}
                      title={win.label}
                      style={{
                        width: 34, height: 28,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", borderRadius: 5,
                        background: isActive ? "rgba(54,123,240,0.3)" : win.minimized ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.09)",
                        border: isActive ? "1px solid rgba(54,123,240,0.55)" : "1px solid rgba(255,255,255,0.08)",
                        position: "relative", transition: "all 0.1s", flexShrink: 0,
                      }}
                    >
                      {icon}
                      {isActive && (
                        <div style={{
                          position: "absolute", bottom: -1, left: "50%", transform: "translateX(-50%)",
                          width: 16, height: 2, borderRadius: 1, background: "#367BF0",
                        }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ── RIGHT: System Tray ── */}
        <div className="flex items-center h-full" ref={trayRef}>
          <div className={btnClass} title="System Activity Monitor">
            <Spectrogram />
          </div>

          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.1)" }} />

          {/* Network / IP */}
          <div
            className={btnClass}
            style={{ position: "relative", background: trayPopover === "network" ? "rgba(255,255,255,0.12)" : undefined }}
            title="Network"
            onClick={() => toggleTray("network")}
          >
            {isOnline ? <Wifi size={15} color="#7ec8e3" /> : <WifiOff size={15} color="#f87171" />}
            {trayPopover === "network" && (
              <div style={{ ...popoverBase, right: 130 }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: "#7ec8e3", fontSize: 13 }}>Network</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  {isOnline ? <Wifi size={14} color="#7ec8e3" /> : <WifiOff size={14} color="#f87171" />}
                  <span style={{ fontWeight: 500, color: isOnline ? "#7ec8e3" : "#f87171" }}>
                    {isOnline ? "Connected" : "No connection"}
                  </span>
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>
                  {isOnline ? "Ethernet — 1000 Mbps" : "Cable unplugged"}
                </div>
                {publicIp && (
                  <div style={{ marginTop: 8, padding: "5px 8px", background: "rgba(126,200,227,0.08)", borderRadius: 5, fontSize: 11 }}>
                    <span style={{ color: "rgba(255,255,255,0.4)" }}>IP: </span>
                    <span style={{ color: "#7ec8e3", fontFamily: "monospace" }}>{publicIp}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sound / Volume */}
          <div
            className={btnClass}
            style={{ position: "relative", background: trayPopover === "sound" ? "rgba(255,255,255,0.12)" : undefined }}
            title={`Volume: ${osVolume}%`}
            onClick={() => toggleTray("sound")}
          >
            {osVolume === 0 ? <VolumeX size={15} color="rgba(255,255,255,0.5)" /> : <Volume2 size={15} color="rgba(255,255,255,0.8)" />}
            {trayPopover === "sound" && (
              <div style={{ ...popoverBase, right: 90 }} onClick={(e) => e.stopPropagation()}>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>
                  Sound — <span style={{ color: "#90bfff" }}>{osVolume}%</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <VolumeX size={13} color="rgba(255,255,255,0.4)" />
                  <input
                    type="range" min={0} max={100} value={osVolume}
                    onChange={(e) => setOsVolume(Number(e.target.value))}
                    style={{ flex: 1, accentColor: "#367BF0", cursor: "pointer" }}
                  />
                  <Volume2 size={13} color="rgba(255,255,255,0.4)" />
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  {[0, 25, 50, 75, 100].map((v) => (
                    <button
                      key={v}
                      onClick={() => setOsVolume(v)}
                      style={{
                        flex: 1, padding: "3px 0", fontSize: 10,
                        background: osVolume === v ? "rgba(54,123,240,0.3)" : "rgba(255,255,255,0.06)",
                        border: osVolume === v ? "1px solid rgba(54,123,240,0.5)" : "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 4, cursor: "pointer", color: osVolume === v ? "#90bfff" : "rgba(255,255,255,0.5)",
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div
            className={btnClass}
            style={{ position: "relative", background: trayPopover === "notifications" ? "rgba(255,255,255,0.12)" : undefined }}
            title="Notifications"
            onClick={() => toggleTray("notifications")}
          >
            <Bell size={15} color="rgba(255,255,255,0.8)" />
            {trayPopover === "notifications" && (
              <div style={{ ...popoverBase, right: 55 }}>
                <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 13 }}>Notifications</div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textAlign: "center", padding: "8px 0" }}>
                  No new notifications
                </div>
              </div>
            )}
          </div>

          {/* Battery */}
          <div
            className={btnClass}
            style={{ position: "relative", background: trayPopover === "battery" ? "rgba(255,255,255,0.12)" : undefined }}
            title={`Battery: ${batteryLevel}%${isCharging ? " (Charging)" : ""}`}
            onClick={() => toggleTray("battery")}
          >
            {isCharging
              ? <BatteryCharging size={15} color={battColor} />
              : <Battery size={15} color={battColor} />
            }
            {trayPopover === "battery" && (
              <div style={{ ...popoverBase, right: 22 }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: battColor, fontSize: 13 }}>Battery</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  {isCharging
                    ? <BatteryCharging size={14} color={battColor} />
                    : <Battery size={14} color={battColor} />
                  }
                  <span style={{ color: battColor, fontWeight: 600 }}>
                    {batteryLevel}% — {isCharging ? "Charging ⚡" : "On battery"}
                  </span>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${batteryLevel}%`,
                    background: battColor,
                    borderRadius: 3,
                    transition: "width 0.4s",
                  }} />
                </div>
                <div style={{ marginTop: 6, fontSize: 10, color: "rgba(255,255,255,0.35)", textAlign: "right" }}>
                  {batteryLevel}% remaining
                </div>
              </div>
            )}
          </div>

          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.1)" }} />

          {/* Clock / Calendar */}
          <div
            className={btnClass}
            style={{
              position: "relative", paddingLeft: 12, paddingRight: 12,
              background: showCalendar ? "rgba(255,255,255,0.1)" : undefined,
            }}
            title="Calendar"
            onClick={() => { setTrayPopover(null); setShowStartMenu(false); setShowCalendar((v) => !v); }}
            ref={calRef}
          >
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: 400, letterSpacing: "0.02em" }}>
              {format(time, "EEE HH:mm")}
            </span>

            {showCalendar && (
              <div
                style={{
                  position: "fixed", bottom: 44, right: 62,
                  background: "rgba(14,14,22,0.96)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  padding: 14, zIndex: 400, minWidth: 210,
                  boxShadow: "0 -12px 40px rgba(0,0,0,0.9)", borderRadius: 8,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ fontSize: 28, fontWeight: 200, color: "rgba(255,255,255,0.95)", lineHeight: 1, letterSpacing: "-1px" }}>
                    {format(now, "HH:mm")}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                    {format(now, "EEEE, MMMM d, yyyy")}
                  </div>
                </div>
                <div style={{ textAlign: "center", fontSize: 12, color: "#90bfff", marginBottom: 10, fontWeight: 600 }}>
                  {monthName}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 2 }}>
                  {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
                    <div key={d} style={{ textAlign: "center", fontSize: 9, color: "rgba(255,255,255,0.35)", paddingBottom: 4, fontWeight: 600 }}>{d}</div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                  {Array.from({ length: firstDay }).map((_, i) => <div key={"e"+i} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isToday = day === today;
                    return (
                      <div key={day} style={{
                        textAlign: "center", fontSize: 11, padding: "3px 0", borderRadius: 4,
                        background: isToday ? "#367BF0" : "transparent",
                        color: isToday ? "#fff" : "rgba(255,255,255,0.7)",
                        fontWeight: isToday ? 700 : 400,
                        boxShadow: isToday ? "0 2px 8px rgba(54,123,240,0.4)" : "none",
                      }}>
                        {day}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.1)" }} />

          {/* Lock / Power */}
          <div
            className={btnClass}
            style={{ paddingLeft: 8, paddingRight: 10 }}
            title="Lock Screen"
            onClick={() => { setShowStartMenu(false); setLocked(true); }}
          >
            <Power size={15} color="rgba(255,255,255,0.7)" />
          </div>
        </div>
      </div>
    </>
  );
}
