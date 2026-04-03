import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import {
  Volume2, Bell, Lock, Power, Wifi, WifiOff,
  Monitor, ChevronDown, BarChart2
} from "lucide-react";
import { SiFirefox } from "react-icons/si";
import { FolderOpen, TerminalSquare } from "lucide-react";

interface TopPanelProps {
  activeWindowName: string;
  onOpenWindow: (id: string) => void;
}

function KaliDragonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
      <path
        d="M12 2C7.5 2 4 5 4 9c0 2 .8 3.8 2 5l-1 2 2-1c1 .7 2.2 1 3 1 4.5 0 8-3 8-7S16.5 2 12 2z"
        fill="#367BF0"
        opacity="0.9"
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
        <div
          key={i}
          style={{
            width: 2,
            height: h,
            background: i > 4 ? "#00a3ff" : "rgba(255,255,255,0.5)",
          }}
        />
      ))}
    </div>
  );
}

export default function TopPanel({ activeWindowName, onOpenWindow }: TopPanelProps) {
  const [time, setTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [batteryLevel, setBatteryLevel] = useState<number>(85);
  const [activeWorkspace, setActiveWorkspace] = useState(1);
  const [showCalendar, setShowCalendar] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const getBattery = async () => {
      if ("getBattery" in navigator) {
        try {
          const nav = navigator as any;
          const battery = await nav.getBattery();
          setBatteryLevel(Math.round(battery.level * 100));
          battery.addEventListener("levelchange", () => {
            setBatteryLevel(Math.round(battery.level * 100));
          });
        } catch (e) {}
      }
    };
    getBattery();

    return () => {
      clearInterval(timer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    };
    if (showCalendar) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showCalendar]);

  const panelBtnClass =
    "flex items-center justify-center cursor-pointer px-1 transition-colors hover:bg-white/10 h-full";

  const appLaunchers = [
    {
      id: "files",
      icon: <FolderOpen size={15} color="#a8c4f5" />,
      title: "Thunar File Manager",
    },
    {
      id: "firefox",
      icon: <SiFirefox size={14} color="#ff6611" />,
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

  return (
    <div
      className="fixed top-0 left-0 w-full z-50 select-none font-sans flex items-stretch"
      style={{
        height: 28,
        background: "rgba(10,10,10,0.96)",
        backdropFilter: "blur(4px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* ── LEFT SECTION ── */}
      <div className="flex items-center h-full">
        {/* Kali App Menu */}
        <div
          className={panelBtnClass}
          style={{ paddingLeft: 8, paddingRight: 8 }}
          title="Applications"
        >
          <KaliDragonIcon />
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.12)" }} />

        {/* App launchers */}
        {appLaunchers.map((launcher) => (
          <div
            key={launcher.id}
            className={panelBtnClass}
            style={{ paddingLeft: 6, paddingRight: 6 }}
            title={launcher.title}
            onClick={() => {
              if (launcher.action) launcher.action();
              else onOpenWindow(launcher.id);
            }}
          >
            {launcher.icon}
          </div>
        ))}

        {/* Separator */}
        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.12)", marginLeft: 4 }} />

        {/* Active window name or display dropdown */}
        <div
          className={panelBtnClass + " gap-1"}
          style={{ paddingLeft: 8, paddingRight: 6, maxWidth: 140 }}
          title="Window selector"
        >
          <Monitor size={11} color="rgba(255,255,255,0.6)" />
          <span
            style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.75)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 90,
            }}
          >
            {activeWindowName || "Desktop"}
          </span>
          <ChevronDown size={9} color="rgba(255,255,255,0.4)" />
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.12)" }} />

        {/* Workspace switcher: 1 2 3 4 */}
        <div className="flex items-center h-full px-1 gap-0.5">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              onClick={() => setActiveWorkspace(n)}
              style={{
                width: 22,
                height: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 500,
                cursor: "pointer",
                border:
                  activeWorkspace === n
                    ? "1px solid #367BF0"
                    : "1px solid rgba(255,255,255,0.15)",
                background:
                  activeWorkspace === n
                    ? "rgba(54,123,240,0.35)"
                    : "rgba(255,255,255,0.04)",
                color: activeWorkspace === n ? "#90bfff" : "rgba(255,255,255,0.55)",
                transition: "all 0.1s",
              }}
            >
              {n}
            </div>
          ))}
        </div>
      </div>

      {/* ── SPACER ── */}
      <div style={{ flex: 1 }} />

      {/* ── RIGHT SECTION ── */}
      <div className="flex items-center h-full">
        {/* System load bars */}
        <div className={panelBtnClass} style={{ paddingLeft: 6, paddingRight: 6 }} title="System Monitor">
          <SystemBars />
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.12)" }} />

        {/* Network */}
        <div className={panelBtnClass} style={{ paddingLeft: 6, paddingRight: 6 }} title={isOnline ? "Connected" : "Disconnected"}>
          {isOnline ? (
            <Wifi size={13} color="#7ec8e3" />
          ) : (
            <WifiOff size={13} color="#f87171" />
          )}
        </div>

        {/* Volume */}
        <div className={panelBtnClass} style={{ paddingLeft: 5, paddingRight: 5 }} title={`Volume`}>
          <Volume2 size={13} color="rgba(255,255,255,0.8)" />
        </div>

        {/* Notification bell */}
        <div className={panelBtnClass} style={{ paddingLeft: 5, paddingRight: 5 }} title="Notifications">
          <Bell size={13} color="rgba(255,255,255,0.8)" />
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.12)" }} />

        {/* Clock + Time — clickable for calendar */}
        <div
          className={panelBtnClass + " gap-1.5 relative"}
          style={{ paddingLeft: 10, paddingRight: 10, position: "relative" }}
          title="Calendar"
          onClick={() => setShowCalendar((v) => !v)}
          ref={calRef}
        >
          <span
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.9)",
              fontWeight: 400,
              letterSpacing: "0.02em",
            }}
          >
            {format(time, "EEE HH:mm")}
          </span>

          {showCalendar && (
            <div
              style={{
                position: "fixed",
                top: 30,
                right: 60,
                background: "#1e1e1e",
                border: "1px solid rgba(255,255,255,0.12)",
                padding: 12,
                zIndex: 200,
                minWidth: 180,
                boxShadow: "0 8px 24px rgba(0,0,0,0.8)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  textAlign: "center",
                  fontSize: 11,
                  color: "#90bfff",
                  marginBottom: 8,
                  fontWeight: 500,
                }}
              >
                {monthName}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: 2,
                }}
              >
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <div
                    key={d}
                    style={{
                      textAlign: "center",
                      fontSize: 9,
                      color: "rgba(255,255,255,0.4)",
                      paddingBottom: 4,
                    }}
                  >
                    {d}
                  </div>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={"e" + i} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const isToday = day === today;
                  return (
                    <div
                      key={day}
                      style={{
                        textAlign: "center",
                        fontSize: 10,
                        padding: "2px 0",
                        borderRadius: 2,
                        background: isToday ? "#367BF0" : "transparent",
                        color: isToday ? "#fff" : "rgba(255,255,255,0.7)",
                        fontWeight: isToday ? 600 : 400,
                        cursor: "default",
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

        {/* Separator */}
        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.12)" }} />

        {/* Lock screen */}
        <div className={panelBtnClass} style={{ paddingLeft: 6, paddingRight: 6 }} title="Lock Screen">
          <Lock size={13} color="rgba(255,255,255,0.75)" />
        </div>

        {/* Power / logout */}
        <div
          className={panelBtnClass}
          style={{ paddingLeft: 6, paddingRight: 8 }}
          title="Logout / Shutdown"
        >
          <Power size={13} color="rgba(255,255,255,0.75)" />
        </div>
      </div>
    </div>
  );
}
