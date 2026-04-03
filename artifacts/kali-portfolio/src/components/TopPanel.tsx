import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import {
  Volume2, Bell, Battery, BatteryCharging, Wifi, WifiOff,
  FolderOpen, TerminalSquare
} from "lucide-react";
import { SiFirefox } from "react-icons/si";

interface TopPanelProps {
  onOpenWindow: (id: string) => void;
}

function KaliDragonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
      <path d="M12 2C7.5 2 4 5 4 9c0 2 .8 3.8 2 5l-1 2 2-1c1 .7 2.2 1 3 1 4.5 0 8-3 8-7S16.5 2 12 2z" fill="#367BF0" opacity="0.9"/>
      <path d="M10 8c.5-1 1.5-1.5 2.5-1 1 .5 1.5 1.5 1 2.5-.3.7-1 1.2-1.7 1.3L10 12l1-2.5C10.4 9.2 9.8 8.7 10 8z" fill="white" opacity="0.9"/>
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

type TrayPopover = "battery" | "network" | "sound" | "notifications" | null;

export default function TopPanel({ onOpenWindow }: TopPanelProps) {
  const [time, setTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [activeWorkspace, setActiveWorkspace] = useState(1);
  const [showCalendar, setShowCalendar] = useState(false);
  const [trayPopover, setTrayPopover] = useState<TrayPopover>(null);
  const calRef = useRef<HTMLDivElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
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

  const panelBtnClass = "flex items-center justify-center cursor-pointer px-1.5 transition-colors hover:bg-white/10 h-full";

  const appLaunchers = [
    { id: "files",    icon: <FolderOpen size={15} color="#a8c4f5" />, title: "Thunar File Manager" },
    { id: "firefox",  icon: <SiFirefox size={14} color="#ff6611" />,  title: "Firefox",
      action: () => window.open("https://mozilla.org", "_blank") },
    { id: "terminal", icon: <TerminalSquare size={14} color="#c8e6c9" />, title: "Terminal" },
  ];

  const now = time;
  const monthName = format(now, "MMMM yyyy");
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const today = now.getDate();

  const toggleTray = (key: TrayPopover) => {
    setShowCalendar(false);
    setTrayPopover((prev) => (prev === key ? null : key));
  };

  const popoverBase: React.CSSProperties = {
    position: "fixed",
    top: 34,
    background: "#1a1a1f",
    border: "1px solid rgba(255,255,255,0.12)",
    padding: "10px 14px",
    zIndex: 300,
    minWidth: 180,
    boxShadow: "0 8px 24px rgba(0,0,0,0.85)",
    borderRadius: 4,
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "'Ubuntu', sans-serif",
  };

  return (
    <div
      className="fixed top-0 left-0 w-full z-50 select-none font-sans flex items-stretch"
      style={{
        height: 32,
        background: "rgba(10,10,10,0.97)",
        backdropFilter: "blur(4px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* LEFT */}
      <div className="flex items-center h-full">
        <div className={panelBtnClass} style={{ paddingLeft: 10, paddingRight: 10 }} title="Applications">
          <KaliDragonIcon />
        </div>

        <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.12)" }} />

        {appLaunchers.map((launcher) => (
          <div
            key={launcher.id}
            className={panelBtnClass}
            style={{ paddingLeft: 7, paddingRight: 7 }}
            title={launcher.title}
            onClick={() => launcher.action ? launcher.action() : onOpenWindow(launcher.id)}
          >
            {launcher.icon}
          </div>
        ))}

        <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.12)", marginLeft: 4 }} />

        {/* Workspace switcher */}
        <div className="flex items-center h-full px-1 gap-0.5">
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
      </div>

      {/* SPACER */}
      <div style={{ flex: 1 }} />

      {/* RIGHT */}
      <div className="flex items-center h-full" ref={trayRef}>
        <div className={panelBtnClass} title="System Monitor">
          <SystemBars />
        </div>

        <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.12)" }} />

        {/* Network */}
        <div
          className={panelBtnClass}
          style={{ position: "relative", background: trayPopover === "network" ? "rgba(255,255,255,0.12)" : undefined }}
          title="Network"
          onClick={() => toggleTray("network")}
        >
          {isOnline ? <Wifi size={14} color="#7ec8e3" /> : <WifiOff size={14} color="#f87171" />}
          {trayPopover === "network" && (
            <div style={{ ...popoverBase, right: 0 }}>
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
          className={panelBtnClass}
          style={{ position: "relative", background: trayPopover === "sound" ? "rgba(255,255,255,0.12)" : undefined }}
          title="Volume"
          onClick={() => toggleTray("sound")}
        >
          <Volume2 size={14} color="rgba(255,255,255,0.8)" />
          {trayPopover === "sound" && (
            <div style={{ ...popoverBase, right: 0 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Sound</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Volume2 size={13} color="rgba(255,255,255,0.7)" />
                <span>Output Volume</span>
              </div>
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
          className={panelBtnClass}
          style={{ position: "relative", background: trayPopover === "notifications" ? "rgba(255,255,255,0.12)" : undefined }}
          title="Notifications"
          onClick={() => toggleTray("notifications")}
        >
          <Bell size={14} color="rgba(255,255,255,0.8)" />
          {trayPopover === "notifications" && (
            <div style={{ ...popoverBase, right: 0 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Notifications</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textAlign: "center", padding: "8px 0" }}>
                No new notifications
              </div>
            </div>
          )}
        </div>

        {/* Battery */}
        <div
          className={panelBtnClass}
          style={{ position: "relative", background: trayPopover === "battery" ? "rgba(255,255,255,0.12)" : undefined }}
          title="Battery"
          onClick={() => toggleTray("battery")}
        >
          <BatteryCharging size={14} color="#6ee7a0" />
          {trayPopover === "battery" && (
            <div style={{ ...popoverBase, right: 0 }}>
              <div style={{ fontWeight: 600, marginBottom: 6, color: "#6ee7a0" }}>Battery</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <BatteryCharging size={14} color="#6ee7a0" />
                <span style={{ color: "#6ee7a0", fontWeight: 600 }}>100% — Charging</span>
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Fully charged</div>
              <div style={{ marginTop: 8, height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: "100%", background: "#6ee7a0", borderRadius: 3 }} />
              </div>
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.12)" }} />

        {/* Clock */}
        <div
          className={panelBtnClass + " relative"}
          style={{ paddingLeft: 10, paddingRight: 10, position: "relative" }}
          title="Calendar"
          onClick={() => { setTrayPopover(null); setShowCalendar((v) => !v); }}
          ref={calRef}
        >
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: 400, letterSpacing: "0.02em" }}>
            {format(time, "EEE HH:mm")}
          </span>

          {showCalendar && (
            <div
              style={{
                position: "fixed", top: 34, right: 60,
                background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.12)",
                padding: 12, zIndex: 300, minWidth: 180,
                boxShadow: "0 8px 24px rgba(0,0,0,0.8)", borderRadius: 4,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ textAlign: "center", fontSize: 11, color: "#90bfff", marginBottom: 8, fontWeight: 500 }}>
                {monthName}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <div key={d} style={{ textAlign: "center", fontSize: 9, color: "rgba(255,255,255,0.4)", paddingBottom: 4 }}>{d}</div>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => <div key={"e" + i} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const isToday = day === today;
                  return (
                    <div key={day} style={{
                      textAlign: "center", fontSize: 10, padding: "2px 0", borderRadius: 2,
                      background: isToday ? "#367BF0" : "transparent",
                      color: isToday ? "#fff" : "rgba(255,255,255,0.7)",
                      fontWeight: isToday ? 600 : 400, cursor: "default",
                    }}>{day}</div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
