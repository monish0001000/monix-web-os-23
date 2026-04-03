import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import {
  Volume2, Bell, BatteryCharging, Wifi, WifiOff,
  FolderOpen, TerminalSquare, Monitor, Github, Trash2, Power
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

function KaliDragonIcon({ active }: { active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none">
      <path
        d="M12 2C7.5 2 4 5 4 9c0 2 .8 3.8 2 5l-1 2 2-1c1 .7 2.2 1 3 1 4.5 0 8-3 8-7S16.5 2 12 2z"
        fill={active ? "#5ea3ff" : "#367BF0"}
        opacity="0.95"
      />
      <path
        d="M10 8c.5-1 1.5-1.5 2.5-1 1 .5 1.5 1.5 1 2.5-.3.7-1 1.2-1.7 1.3L10 12l1-2.5C10.4 9.2 9.8 8.7 10 8z"
        fill="white"
        opacity="0.9"
      />
    </svg>
  );
}

function SystemBars() {
  const bars = [3, 5, 8, 6, 9, 4, 7];
  return (
    <div className="flex items-end gap-px" style={{ height: 14 }}>
      {bars.map((h, i) => (
        <div key={i} style={{ width: 2, height: h, background: i > 4 ? "#00a3ff" : "rgba(255,255,255,0.5)" }} />
      ))}
    </div>
  );
}

const TASKBAR_ICON: Record<string, React.ReactNode> = {
  terminal:  <TerminalSquare size={14} color="#c8e6c9" />,
  files:     <FolderOpen size={14} color="#a8c4f5" />,
  trash:     <Trash2 size={14} color="#aaaacc" />,
  github:    <Github size={14} color="#e0e0e0" />,
  portfolio: <Monitor size={14} color="#90d090" />,
};

type TrayPopover = "battery" | "network" | "sound" | "notifications" | null;

export default function TopPanel({ openWindows = [], onOpenWindow, onTaskbarClick, activeWindowId }: TopPanelProps) {
  const [time, setTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeWorkspace, setActiveWorkspace] = useState(1);
  const [showCalendar, setShowCalendar] = useState(false);
  const [trayPopover, setTrayPopover] = useState<TrayPopover>(null);
  const [showStartMenu, setShowStartMenu] = useState(false);

  const calRef = useRef<HTMLDivElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  const startBtnRef = useRef<HTMLDivElement>(null);

  const setLocked = useOSStore((s) => s.setLocked);

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

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setShowCalendar(false);
      if (trayRef.current && !trayRef.current.contains(e.target as Node)) setTrayPopover(null);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const btnClass = "flex items-center justify-center cursor-pointer transition-colors hover:bg-white/10 h-full px-2";

  const appLaunchers = [
    {
      id: "files",
      icon: <FolderOpen size={14} color="#a8c4f5" />,
      title: "File Manager",
    },
    {
      id: "firefox",
      icon: <SiFirefox size={13} color="#ff6611" />,
      title: "Firefox",
      action: () => window.open("https://mozilla.org", "_blank"),
    },
    {
      id: "terminal",
      icon: <TerminalSquare size={14} color="#c8e6c9" />,
      title: "Terminal",
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
    bottom: 36,
    background: "rgba(18, 18, 26, 0.97)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(255,255,255,0.12)",
    padding: "10px 14px",
    zIndex: 400,
    minWidth: 180,
    boxShadow: "0 -8px 32px rgba(0,0,0,0.9)",
    borderRadius: 6,
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "'Ubuntu', sans-serif",
  };

  return (
    <>
      {/* Start Menu rendered above the panel */}
      <StartMenu
        open={showStartMenu}
        onClose={() => setShowStartMenu(false)}
        onOpenWindow={(id) => { onOpenWindow(id); setShowStartMenu(false); }}
      />

      <div
        className="fixed bottom-0 left-0 w-full z-50 select-none font-sans flex items-stretch justify-between"
        style={{
          height: 36,
          background: "rgba(8,8,14,0.97)",
          backdropFilter: "blur(8px)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* ── LEFT: Logo + Launchers + Workspace + Open Windows ── */}
        <div className="flex items-center h-full gap-0">

          {/* Logo / Start Menu toggle */}
          <div
            ref={startBtnRef}
            className="flex items-center justify-center cursor-pointer h-full transition-colors"
            style={{
              paddingLeft: 10, paddingRight: 10,
              background: showStartMenu ? "rgba(54,123,240,0.25)" : "transparent",
              borderRight: showStartMenu ? "1px solid rgba(54,123,240,0.3)" : "1px solid transparent",
            }}
            title="Applications"
            onClick={handleLogoClick}
          >
            <KaliDragonIcon active={showStartMenu} />
          </div>

          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)" }} />

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

          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)", marginLeft: 2 }} />

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

          {/* Open Windows Taskbar */}
          {openWindows.length > 0 && (
            <>
              <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)", marginLeft: 4 }} />
              <div className="flex items-center h-full gap-1 px-1">
                {openWindows.map((win) => {
                  const isActive = activeWindowId === win.id;
                  const icon = TASKBAR_ICON[win.id] ?? <Monitor size={14} color="rgba(255,255,255,0.7)" />;
                  return (
                    <button
                      key={win.id}
                      onClick={() => onTaskbarClick(win.id)}
                      title={win.label}
                      style={{
                        width: 32, height: 26,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", borderRadius: 4,
                        background: isActive ? "rgba(54,123,240,0.3)" : win.minimized ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.09)",
                        border: isActive ? "1px solid rgba(54,123,240,0.55)" : "1px solid rgba(255,255,255,0.08)",
                        position: "relative", transition: "all 0.1s", flexShrink: 0,
                      }}
                    >
                      {icon}
                      {isActive && (
                        <div style={{
                          position: "absolute", bottom: -1, left: "50%", transform: "translateX(-50%)",
                          width: 14, height: 2, borderRadius: 1, background: "#367BF0",
                        }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ── RIGHT: System Tray + Clock + Power ── */}
        <div className="flex items-center h-full" ref={trayRef}>
          <div className={btnClass} title="System Monitor">
            <SystemBars />
          </div>

          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)" }} />

          {/* Network */}
          <div
            className={btnClass}
            style={{ position: "relative", background: trayPopover === "network" ? "rgba(255,255,255,0.12)" : undefined }}
            title="Network"
            onClick={() => toggleTray("network")}
          >
            {isOnline ? <Wifi size={14} color="#7ec8e3" /> : <WifiOff size={14} color="#f87171" />}
            {trayPopover === "network" && (
              <div style={{ ...popoverBase, right: 120 }}>
                <div style={{ fontWeight: 600, marginBottom: 6, color: "#7ec8e3" }}>Network</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Wifi size={13} color={isOnline ? "#7ec8e3" : "#f87171"} />
                  <span>{isOnline ? "Connected" : "No connection"}</span>
                </div>
                <div style={{ marginTop: 6, color: "rgba(255,255,255,0.45)", fontSize: 11 }}>
                  {isOnline ? "Ethernet — 1000 Mbps" : "Cable unplugged"}
                </div>
              </div>
            )}
          </div>

          {/* Sound */}
          <div
            className={btnClass}
            style={{ position: "relative", background: trayPopover === "sound" ? "rgba(255,255,255,0.12)" : undefined }}
            title="Volume"
            onClick={() => toggleTray("sound")}
          >
            <Volume2 size={14} color="rgba(255,255,255,0.8)" />
            {trayPopover === "sound" && (
              <div style={{ ...popoverBase, right: 80 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Sound</div>
                <input
                  type="range" min={0} max={100} defaultValue={75}
                  onClick={(e) => e.stopPropagation()}
                  style={{ width: "100%", accentColor: "#367BF0", cursor: "pointer" }}
                />
                <div style={{ textAlign: "right", fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>75%</div>
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
            <Bell size={14} color="rgba(255,255,255,0.8)" />
            {trayPopover === "notifications" && (
              <div style={{ ...popoverBase, right: 50 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Notifications</div>
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
            title="Battery"
            onClick={() => toggleTray("battery")}
          >
            <BatteryCharging size={14} color="#6ee7a0" />
            {trayPopover === "battery" && (
              <div style={{ ...popoverBase, right: 20 }}>
                <div style={{ fontWeight: 600, marginBottom: 6, color: "#6ee7a0" }}>Battery</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <BatteryCharging size={14} color="#6ee7a0" />
                  <span style={{ color: "#6ee7a0", fontWeight: 600 }}>100% — Charging</span>
                </div>
                <div style={{ marginTop: 8, height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: "100%", background: "#6ee7a0", borderRadius: 3 }} />
                </div>
              </div>
            )}
          </div>

          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)" }} />

          {/* Clock / Calendar toggle */}
          <div
            className={btnClass}
            style={{
              position: "relative", paddingLeft: 10, paddingRight: 10,
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
                  position: "fixed", bottom: 42, right: 62,
                  background: "rgba(14,14,22,0.96)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  padding: 14, zIndex: 400, minWidth: 210,
                  boxShadow: "0 -12px 40px rgba(0,0,0,0.9)", borderRadius: 8,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Full date header */}
                <div style={{ marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ fontSize: 28, fontWeight: 200, color: "rgba(255,255,255,0.95)", lineHeight: 1, letterSpacing: "-1px" }}>
                    {format(now, "HH:mm")}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                    {format(now, "EEEE, MMMM d, yyyy")}
                  </div>
                </div>

                {/* Month label */}
                <div style={{ textAlign: "center", fontSize: 12, color: "#90bfff", marginBottom: 10, fontWeight: 600, letterSpacing: "0.04em" }}>
                  {monthName}
                </div>

                {/* Day-of-week headers */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 2 }}>
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <div key={d} style={{ textAlign: "center", fontSize: 9, color: "rgba(255,255,255,0.35)", paddingBottom: 4, fontWeight: 600 }}>
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                  {Array.from({ length: firstDay }).map((_, i) => <div key={"e" + i} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const isToday = day === today;
                    return (
                      <div
                        key={day}
                        style={{
                          textAlign: "center", fontSize: 11, padding: "3px 0", borderRadius: 4,
                          background: isToday ? "#367BF0" : "transparent",
                          color: isToday ? "#fff" : "rgba(255,255,255,0.7)",
                          fontWeight: isToday ? 700 : 400, cursor: "default",
                          boxShadow: isToday ? "0 2px 8px rgba(54,123,240,0.4)" : "none",
                        }}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)" }} />

          {/* Lock / Power */}
          <div
            className={btnClass}
            style={{ paddingLeft: 8, paddingRight: 10 }}
            title="Lock Screen"
            onClick={() => { setShowStartMenu(false); setLocked(true); }}
          >
            <Power size={14} color="rgba(255,255,255,0.7)" />
          </div>
        </div>
      </div>
    </>
  );
}
