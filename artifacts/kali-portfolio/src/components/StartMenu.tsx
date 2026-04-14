import { motion, AnimatePresence } from "framer-motion";
import {
  TerminalSquare, FolderOpen, Monitor, Github, Trash2,
  Lock, Settings, Power, Search, Globe, Shield, Sparkles,
  FlaskConical, Code2, PenTool, Crown, Activity, Cpu, Map, FileCode, Phone, FileWarning
} from "lucide-react";
import { useOSStore } from "@/lib/store";

interface StartMenuProps {
  open: boolean;
  onClose: () => void;
  onOpenWindow: (id: string) => void;
}

const SYSTEM_TOOLS = [
  {
    id: "settings",
    label: "Settings",
    icon: <Settings size={22} strokeWidth={1.6} />,
    color: "#00d4ff",
    bg: "rgba(0,212,255,0.08)",
  },
];

const GAMES = [
  {
    id: "chess",
    label: "Grandmaster",
    icon: <Crown size={22} strokeWidth={1.6} />,
    color: "#ffd700",
    bg: "rgba(255,215,0,0.1)",
  },
];

const APPS = [
  {
    id: "terminal",
    label: "Terminal",
    icon: <TerminalSquare size={22} strokeWidth={1.6} />,
    color: "#c8e6c9",
    bg: "rgba(200,230,201,0.1)",
  },
  {
    id: "files",
    label: "Files",
    icon: <FolderOpen size={22} strokeWidth={1.6} />,
    color: "#90bfff",
    bg: "rgba(144,191,255,0.1)",
  },
  {
    id: "github",
    label: "GitHub",
    icon: <Github size={22} strokeWidth={1.6} />,
    color: "#e0e0e0",
    bg: "rgba(224,224,224,0.1)",
  },
  {
    id: "portfolio",
    label: "Portfolio",
    icon: <Monitor size={22} strokeWidth={1.6} />,
    color: "#90d090",
    bg: "rgba(144,208,144,0.1)",
  },
  {
    id: "trash",
    label: "Trash",
    icon: <Trash2 size={22} strokeWidth={1.6} />,
    color: "#aaaacc",
    bg: "rgba(170,170,204,0.1)",
  },
  {
    id: "browser",
    label: "Browser",
    icon: <Globe size={22} strokeWidth={1.6} />,
    color: "#7ec8e3",
    bg: "rgba(126,200,227,0.1)",
  },
  {
    id: "sentinel",
    label: "Sentinel SOC",
    icon: <Shield size={22} strokeWidth={1.6} />,
    color: "#00c4ff",
    bg: "rgba(0,163,255,0.1)",
  },
  {
    id: "aura",
    label: "AURA AI",
    icon: <Sparkles size={22} strokeWidth={1.6} />,
    color: "#c084fc",
    bg: "rgba(168,85,247,0.1)",
  },
  {
    id: "threatmap",
    label: "Threat Map",
    icon: <Map size={22} strokeWidth={1.6} />,
    color: "#ff6060",
    bg: "rgba(255,96,96,0.1)",
  },
  {
    id: "codepad",
    label: "CodePad",
    icon: <FileCode size={22} strokeWidth={1.6} />,
    color: "#00c4ff",
    bg: "rgba(0,196,255,0.1)",
  },
  {
    id: "notepad",
    label: "Notepad",
    icon: <PenTool size={22} strokeWidth={1.6} />,
    color: "#7ecfff",
    bg: "rgba(126,207,255,0.08)",
  },
  {
    id: "securecomm",
    label: "MONIX-COMM",
    icon: <Phone size={22} strokeWidth={1.6} />,
    color: "#00ffff",
    bg: "rgba(0,255,255,0.08)",
  },
  {
    id: "dossier",
    label: "Classified Dossier",
    icon: <FileWarning size={22} strokeWidth={1.6} />,
    color: "#ff4444",
    bg: "rgba(255,68,68,0.08)",
  },
];

export default function StartMenu({ open, onClose, onOpenWindow }: StartMenuProps) {
  const setLocked = useOSStore((s) => s.setLocked);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 490 }}
            onClick={onClose}
          />

          {/* Menu panel */}
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed font-sans"
            style={{
              bottom: 52,
              left: 8,
              width: 320,
              zIndex: 500,
              background: "rgba(10, 10, 18, 0.92)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              boxShadow: "0 -12px 48px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "14px 16px 10px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {/* User row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div
                  style={{
                    width: 34, height: 34, borderRadius: "50%",
                    background: "linear-gradient(135deg, #1e3a6e 0%, #367BF0 100%)",
                    border: "2px solid rgba(255,255,255,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg viewBox="0 0 48 48" width="20" height="20" fill="none">
                    <circle cx="24" cy="18" r="9" fill="rgba(255,255,255,0.9)" />
                    <path d="M6 42c0-9.94 8.06-18 18-18s18 8.06 18 18" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.95)" }}>monish</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>MONIX OS · Rolling</div>
                </div>
              </div>

              {/* Search */}
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 6, padding: "6px 10px",
                }}
              >
                <Search size={13} color="rgba(255,255,255,0.4)" />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
                  Search applications…
                </span>
              </div>
            </div>

            {/* Apps grid */}
            <div style={{ padding: "12px 12px 4px", flex: 1, overflowY: "auto" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8, paddingLeft: 4 }}>
                Applications
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 6,
                }}
              >
                {APPS.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => { onOpenWindow(app.id); onClose(); }}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center",
                      gap: 6, padding: "12px 4px 10px",
                      background: app.bg,
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 8, cursor: "pointer",
                      transition: "background 0.15s, border-color 0.15s, transform 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = app.bg.replace("0.1)", "0.18)");
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.14)";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = app.bg;
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    }}
                  >
                    <div style={{ color: app.color }}>{app.icon}</div>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                      {app.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Games section */}
              <div style={{ fontSize: 10, color: "rgba(255,215,0,0.5)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "12px 0 8px", paddingLeft: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <Crown size={10} color="rgba(255,215,0,0.5)" />
                Games
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                {GAMES.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => { onOpenWindow(app.id); onClose(); }}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center",
                      gap: 6, padding: "12px 4px 10px",
                      background: app.bg,
                      border: "1px solid rgba(255,215,0,0.15)",
                      borderRadius: 8, cursor: "pointer",
                      transition: "background 0.15s, border-color 0.15s, transform 0.1s",
                      boxShadow: "0 0 12px rgba(255,215,0,0.06)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,215,0,0.18)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,215,0,0.35)";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 0 16px rgba(255,215,0,0.2)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = app.bg;
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,215,0,0.15)";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 0 12px rgba(255,215,0,0.06)";
                    }}
                  >
                    <div style={{ color: app.color, filter: "drop-shadow(0 0 6px rgba(255,215,0,0.5))" }}>{app.icon}</div>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                      {app.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* System Tools section */}
              <div style={{ fontSize: 10, color: "rgba(0,255,136,0.5)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "12px 0 8px", paddingLeft: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <Activity size={10} color="rgba(0,255,136,0.5)" />
                System Tools
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, paddingBottom: 8 }}>
                {SYSTEM_TOOLS.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => { onOpenWindow(app.id); onClose(); }}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center",
                      gap: 6, padding: "12px 4px 10px",
                      background: app.bg,
                      border: "1px solid rgba(0,255,136,0.12)",
                      borderRadius: 8, cursor: "pointer",
                      transition: "background 0.15s, border-color 0.15s, transform 0.1s",
                      boxShadow: "0 0 10px rgba(0,255,136,0.04)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(0,255,136,0.16)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,255,136,0.3)";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = app.bg;
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,255,136,0.12)";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    }}
                  >
                    <div style={{ color: app.color, filter: "drop-shadow(0 0 5px rgba(0,255,136,0.4))" }}>{app.icon}</div>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                      {app.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer actions */}
            <div
              style={{
                padding: "8px 12px 12px",
                borderTop: "1px solid rgba(255,255,255,0.07)",
                display: "flex", gap: 6,
              }}
            >
              <button
                onClick={() => { setLocked(true); onClose(); }}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 7, padding: "8px 0",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 6, cursor: "pointer",
                  fontSize: 12, color: "rgba(255,255,255,0.7)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
              >
                <Lock size={13} />
                Lock Screen
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 7, padding: "8px 0",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 6, cursor: "pointer",
                  fontSize: 12, color: "rgba(239,100,100,0.9)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.16)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)"; }}
              >
                <Power size={13} />
                Restart
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
