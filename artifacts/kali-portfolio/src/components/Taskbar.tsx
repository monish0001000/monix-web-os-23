import { useState, useRef, useEffect } from "react";
import {
  FolderOpen, TerminalSquare, Monitor, Github, Trash2, Power,
  PanelBottom, PanelTop, PanelLeft, PanelRight
} from "lucide-react";
import { useOSStore, TaskbarPosition } from "@/lib/store";

interface OpenWindowInfo {
  id: string;
  label: string;
  minimized: boolean;
}

interface TaskbarProps {
  openWindows: OpenWindowInfo[];
  onTaskbarClick: (id: string) => void;
  activeWindowId: string;
  onOpenWindow: (id: string) => void;
}

const TASKBAR_ICON: Record<string, React.ReactNode> = {
  terminal: <TerminalSquare size={16} color="#c8e6c9" />,
  files:    <FolderOpen size={16} color="#a8c4f5" />,
  trash:    <Trash2 size={16} color="#aaaacc" />,
  github:   <Github size={16} color="#e0e0e0" />,
  portfolio:<Monitor size={16} color="#90d090" />,
};

const POSITION_OPTIONS: { pos: TaskbarPosition; label: string; Icon: typeof PanelBottom }[] = [
  { pos: "bottom", label: "Bottom", Icon: PanelBottom },
  { pos: "top",    label: "Top",    Icon: PanelTop    },
  { pos: "left",   label: "Left",   Icon: PanelLeft   },
  { pos: "right",  label: "Right",  Icon: PanelRight  },
];

function MonixLogo() {
  return (
    <svg viewBox="0 0 28 28" width="22" height="22" fill="none">
      <rect x="3" y="3" width="22" height="22" rx="3" fill="#0a1a2e" stroke="#00a3ff" strokeWidth="1"/>
      <path d="M7 20V9l7 6 7-6v11" stroke="#00a3ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <line x1="11" y1="15" x2="17" y2="15" stroke="#367BF0" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

export default function Taskbar({ openWindows, onTaskbarClick, activeWindowId }: TaskbarProps) {
  const { taskbarPosition, setTaskbarPosition, setLocked } = useOSStore();
  const [showSettings, setShowSettings] = useState(false);
  const [settingsPos, setSettingsPos] = useState({ x: 0, y: 0 });
  const settingsRef = useRef<HTMLDivElement>(null);
  const isVertical = taskbarPosition === "left" || taskbarPosition === "right";

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    if (showSettings) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showSettings]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSettingsPos({ x: e.clientX, y: e.clientY });
    setShowSettings(true);
  };

  const barStyle: React.CSSProperties = (() => {
    const base: React.CSSProperties = {
      position: "fixed",
      zIndex: 49,
      background: "rgba(8,8,14,0.97)",
      backdropFilter: "blur(12px)",
      display: "flex",
      alignItems: "center",
      gap: 4,
    };
    switch (taskbarPosition) {
      case "bottom":
        return { ...base, bottom: 0, left: 0, right: 0, height: 38, flexDirection: "row", borderTop: "1px solid rgba(255,255,255,0.07)", padding: "0 8px" };
      case "top":
        return { ...base, top: 32, left: 0, right: 0, height: 38, flexDirection: "row", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 8px" };
      case "left":
        return { ...base, top: 32, bottom: 0, left: 0, width: 48, flexDirection: "column", borderRight: "1px solid rgba(255,255,255,0.07)", padding: "8px 0" };
      case "right":
        return { ...base, top: 32, bottom: 0, right: 0, width: 48, flexDirection: "column", borderLeft: "1px solid rgba(255,255,255,0.07)", padding: "8px 0" };
    }
  })();

  const btnClass: React.CSSProperties = {
    width: isVertical ? 36 : 36,
    height: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    borderRadius: 4,
    border: "1px solid transparent",
    transition: "all 0.1s",
    flexShrink: 0,
    background: "transparent",
  };

  return (
    <>
      <div style={barStyle} onContextMenu={handleContextMenu}>
        {/* Logo / Start */}
        <div
          style={{ ...btnClass, paddingLeft: isVertical ? 0 : 4, paddingRight: isVertical ? 0 : 4 }}
          title="MONIX"
        >
          <MonixLogo />
        </div>

        {/* Separator */}
        <div
          style={
            isVertical
              ? { width: 28, height: 1, background: "rgba(255,255,255,0.1)", margin: "2px auto" }
              : { width: 1, height: 20, background: "rgba(255,255,255,0.1)", margin: "0 4px" }
          }
        />

        {/* Open Window Buttons */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: isVertical ? "column" : "row",
            alignItems: "center",
            gap: 3,
            overflow: "hidden",
          }}
        >
          {openWindows.map((win) => {
            const isActive = activeWindowId === win.id;
            const icon = TASKBAR_ICON[win.id] ?? <Monitor size={16} color="rgba(255,255,255,0.7)" />;
            return (
              <button
                key={win.id}
                onClick={() => onTaskbarClick(win.id)}
                title={win.label}
                style={{
                  ...btnClass,
                  background: isActive
                    ? "rgba(54,123,240,0.3)"
                    : win.minimized
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(255,255,255,0.09)",
                  border: isActive
                    ? "1px solid rgba(54,123,240,0.55)"
                    : "1px solid rgba(255,255,255,0.08)",
                  position: "relative",
                }}
              >
                {icon}
                {isActive && (
                  <div
                    style={
                      isVertical
                        ? {
                            position: "absolute",
                            right: -1,
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: 2,
                            height: 16,
                            borderRadius: 1,
                            background: "#367BF0",
                          }
                        : {
                            position: "absolute",
                            bottom: -1,
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: 16,
                            height: 2,
                            borderRadius: 1,
                            background: "#367BF0",
                          }
                    }
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Lock / Power button */}
        <button
          onClick={() => setLocked(true)}
          title="Lock Screen"
          style={{
            ...btnClass,
            marginLeft: isVertical ? 0 : 4,
          }}
        >
          <Power size={14} color="rgba(255,255,255,0.6)" />
        </button>
      </div>

      {/* Taskbar Settings Popover */}
      {showSettings && (
        <div
          ref={settingsRef}
          style={{
            position: "fixed",
            left: settingsPos.x,
            top: settingsPos.y,
            transform: "translate(-50%, -110%)",
            background: "#18181f",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 6,
            padding: "6px 0",
            zIndex: 9999,
            minWidth: 160,
            boxShadow: "0 8px 30px rgba(0,0,0,0.85)",
            fontFamily: "'Ubuntu', sans-serif",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.35)",
              padding: "3px 12px 6px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Taskbar Position
          </div>
          {POSITION_OPTIONS.map(({ pos, label, Icon }) => (
            <div
              key={pos}
              onClick={() => { setTaskbarPosition(pos); setShowSettings(false); }}
              style={{
                padding: "7px 12px",
                fontSize: 12,
                color: taskbarPosition === pos ? "#90bfff" : "rgba(255,255,255,0.8)",
                background: taskbarPosition === pos ? "rgba(54,123,240,0.2)" : "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "background 0.1s",
              }}
            >
              <Icon size={13} />
              {label}
              {taskbarPosition === pos && (
                <span style={{ marginLeft: "auto", fontSize: 10, color: "#367BF0" }}>✓</span>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
