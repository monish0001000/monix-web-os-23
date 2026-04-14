import { useState, useRef, useEffect, useCallback, lazy, Suspense, memo, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import TopPanel from "./TopPanel";
import DesktopIcons from "./DesktopIcons";
import RightClickMenu from "./RightClickMenu";
import { playClickSound, playCloseSound } from "@/utils/SoundEngine";
import { useOSStore } from "@/lib/store";
import AuraListenGlow from "@/components/ui/AuraListenGlow";
import { preCacheWakeAudio } from "@/lib/AuraService";

// ── Lazy-loaded app components (loaded on first open, never at boot) ──────────
const Terminal        = lazy(() => import("./Terminal"));
const FileExplorer    = lazy(() => import("./FileExplorer"));
const Trash           = lazy(() => import("./Trash"));
const GitHubApp       = lazy(() => import("./GitHubApp"));
const PortfolioApp    = lazy(() => import("./PortfolioApp"));
const BrowserApp      = lazy(() => import("./BrowserApp"));
const WallpaperPicker = lazy(() => import("./WallpaperPicker"));
const SentinelApp     = lazy(() => import("./SentinelApp"));
const AuraApp         = lazy(() => import("./AuraApp"));
const CyberChefApp    = lazy(() => import("./CyberChefApp"));
const CodeStudioApp   = lazy(() => import("./CodeStudioApp"));
const ThreatModelerApp= lazy(() => import("./ThreatModelerApp"));
const ChessApp        = lazy(() => import("./ChessApp"));
const CykryptApp      = lazy(() => import("./CykryptApp"));
const TaskManagerApp  = lazy(() => import("./TaskManagerApp"));
const SettingsApp     = lazy(() => import("./SettingsApp"));
const ThreatMapApp    = lazy(() => import("./ThreatMapApp"));
const CodePadApp      = lazy(() => import("./CodePadApp"));
const NotepadApp      = lazy(() => import("./apps/NotepadApp"));
const SecureCommApp   = lazy(() => import("./SecureCommApp"));
const DossierApp      = lazy(() => import("./DossierApp"));
const MediaViewerApp  = lazy(() => import("./MediaViewerApp"));
import type { MediaType } from "./MediaViewerApp";

// ── Minimal Suspense fallback — invisible, zero-layout-shift ─────────────────
function AppFallback() {
  return (
    <div style={{
      position: "absolute", inset: 0, display: "flex",
      alignItems: "center", justifyContent: "center",
      background: "rgba(8,8,16,0.85)", backdropFilter: "blur(8px)",
      zIndex: 1,
    }}>
      <div style={{
        width: 28, height: 28, border: "2px solid rgba(0,229,255,0.3)",
        borderTop: "2px solid #00e5ff", borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }} />
    </div>
  );
}

// ── Process info registry ─────────────────────────────────────────────────────
const PROCESS_INFO: Record<string, { name: string; icon: string }> = {
  terminal:        { name: "Terminal",         icon: "⬛" },
  files:           { name: "File Manager",     icon: "📁" },
  trash:           { name: "Trash",            icon: "🗑️" },
  github:          { name: "GitHub",           icon: "🐙" },
  portfolio:       { name: "Portfolio",        icon: "🧑‍💻" },
  browser:         { name: "Web Browser",      icon: "⬡" },
  wallpaperpicker: { name: "Wallpaper Picker", icon: "🖼️" },
  sentinel:        { name: "Sentinel SOC",     icon: "🛡️" },
  aura:            { name: "AURA AI",          icon: "🤖" },
  cyberchef:       { name: "CyberChef",        icon: "🍳" },
  codestudio:      { name: "Code Studio",      icon: "💻" },
  threatmodeler:   { name: "Threat Modeler",   icon: "🔐" },
  chess:           { name: "Chess",            icon: "♟️" },
  cykrypt:         { name: "CYKRYPT CTF",      icon: "🎯" },
  taskmanager:     { name: "System Monitor",   icon: "📊" },
  settings:        { name: "Settings",         icon: "⚙️" },
  threatmap:       { name: "Threat Map",       icon: "🗺️" },
  codepad:         { name: "CodePad",          icon: "📝" },
  notepad:         { name: "Notepad",          icon: "🗒️" },
  securecomm:      { name: "MONIX-COMM",       icon: "📞" },
  dossier:         { name: "Classified Dossier", icon: "🗃️" },
};

function genPID(): string {
  return "0x" + Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, "0");
}

export interface WindowEntry {
  id: string;
  minimized: boolean;
  zIndex: number;
  props?: Record<string, string>;
}

const WINDOW_LABELS: Record<string, string> = {
  terminal:        "Terminal",
  files:           "Files",
  trash:           "Trash",
  github:          "GitHub",
  portfolio:       "Portfolio",
  browser:         "Web Browser",
  wallpaperpicker: "Wallpaper Picker",
  sentinel:        "Sentinel SOC",
  aura:            "AURA AI",
  cyberchef:       "CyberChef",
  codestudio:      "Code Studio",
  threatmodeler:   "Threat Modeler",
  chess:           "Monix Grandmaster Chess",
  cykrypt:         "CYKRYPT — CTF Arena",
  taskmanager:     "System Monitor",
  settings:        "Settings",
  threatmap:       "Live Cyber Threat Map",
  codepad:         "CodePad",
  notepad:         "MONIX Notepad",
  securecomm:      "MONIX-COMM — Secure Channel",
  dossier:         "Classified Dossier — MONIX Intel Bureau",
};

interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isVisible: boolean;
}

// ── Memoized GamesTip notification ──────────────────────────────────────────
const GamesTip = memo(function GamesTip({
  onOpen, onDismiss,
}: { onOpen: () => void; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onClick={onOpen}
      className="bg-black/80 backdrop-blur-md border border-[#10b981] rounded-lg p-4 text-white flex items-center gap-3"
      style={{
        position: "fixed", bottom: 62, right: 16, zIndex: 400,
        cursor: "pointer",
        boxShadow: "0 0 15px rgba(16,185,129,0.3), 0 8px 32px rgba(0,0,0,0.7)",
        minWidth: 240, maxWidth: 290,
      }}
    >
      <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>♟</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#10b981", fontFamily: "monospace", letterSpacing: "0.05em" }}>
          MONIX CHESS
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2, fontFamily: "monospace" }}>
          Play online · vs AI · local 2P
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(); }}
        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 2, flexShrink: 0 }}
      >
        ×
      </button>
    </motion.div>
  );
});

export default function Desktop() {
  const [windows, setWindows] = useState<WindowEntry[]>([]);
  const [activeWindow, setActiveWindow] = useState<string>("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showGamesTip, setShowGamesTip] = useState(false);
  const [selectionBox, setSelectionBox] = useState<SelectionBox>({
    startX: 0, startY: 0, endX: 0, endY: 0, isVisible: false,
  });
  const [refreshCount, setRefreshCount] = useState(0);

  const [, startTransition] = useTransition();

  const nextZ = useRef(20);
  const desktopRef = useRef<HTMLDivElement>(null);
  const isDraggingSelection = useRef(false);
  // RAF ref for throttling selection box updates
  const selectionRafRef = useRef<number | null>(null);
  // GamesTip hide-timer ref (prevents memory leak on early unmount)
  const gamestipHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentWallpaper = useOSStore((s) => s.currentWallpaper);
  const cursorStyle = useOSStore((s) => s.cursorStyle);
  const preloadLocalFS        = useOSStore((s) => s.preloadLocalFS);
  const setOpenWindowCallback = useOSStore((s) => s.setOpenWindowCallback);
  const registerProcess       = useOSStore((s) => s.registerProcess);
  const unregisterProcess     = useOSStore((s) => s.unregisterProcess);
  const updateProcessMinimized= useOSStore((s) => s.updateProcessMinimized);
  const focusWindow           = useOSStore((s) => s.focusWindow);
  const toggleMinimize        = useOSStore((s) => s.toggleMinimize);
  const setKillCallback       = useOSStore((s) => s.setKillCallback);
  const startAuraListening    = useOSStore((s) => s.startAuraListening);
  const isMicGranted          = useOSStore((s) => s.isMicGranted);
  const setMicGlowActive      = useOSStore((s) => s.setMicGlowActive);

  const computedCursor =
    cursorStyle === "crosshair" || cursorStyle === "target" ? "crosshair" : "default";

  // Stable refs so callbacks never close over stale state
  const handleCloseWindowRef = useRef<(id: string) => void>(() => {});
  const handleOpenWindowRef  = useRef<(id: string) => void>(() => {});
  // Keep windows ref in sync for stale-closure-safe reads
  const windowsRef = useRef<WindowEntry[]>(windows);
  useEffect(() => { windowsRef.current = windows; }, [windows]);

  useEffect(() => { preloadLocalFS(); }, [preloadLocalFS]);

  useEffect(() => {
    const t = setTimeout(() => preCacheWakeAudio(), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => startAuraListening(), 800);
    return () => clearTimeout(t);
  }, [startAuraListening]);

  useEffect(() => {
    setKillCallback((id: string) => handleCloseWindowRef.current(id));
  }, [setKillCallback]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const showT = setTimeout(() => {
      setShowGamesTip(true);
      gamestipHideRef.current = setTimeout(() => setShowGamesTip(false), 8000);
    }, 10000);
    return () => {
      clearTimeout(showT);
      if (gamestipHideRef.current) clearTimeout(gamestipHideRef.current);
    };
  }, []);

  // ── Preload all lazy chunks ~1.5 s after boot ────────────────────────────
  // Ensures first-open of every app is instant (chunks already in browser cache)
  useEffect(() => {
    const t = setTimeout(() => {
      import("./Terminal");
      import("./FileExplorer");
      import("./Trash");
      import("./GitHubApp");
      import("./PortfolioApp");
      import("./BrowserApp");
      import("./WallpaperPicker");
      import("./SentinelApp");
      import("./AuraApp");
      import("./CyberChefApp");
      import("./CodeStudioApp");
      import("./ThreatModelerApp");
      import("./ChessApp");
      import("./CykryptApp");
      import("./TaskManagerApp");
      import("./SettingsApp");
      import("./ThreatMapApp");
      import("./CodePadApp");
      import("./apps/NotepadApp");
      import("./SecureCommApp");
      import("./DossierApp");
      import("./MediaViewerApp");
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "Escape") {
        e.preventDefault();
        handleOpenWindowRef.current("taskmanager");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    setOpenWindowCallback((id: string) => handleOpenWindowRef.current(id));

    const handleCloseAll = () => {
      setWindows([]);
      setActiveWindow("");
    };
    window.addEventListener("aura-close-all", handleCloseAll);

    const handleTypeText = (e: Event) => {
      const text = (e as CustomEvent<{ text: string }>).detail?.text;
      if (!text) return;
      const el = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
        const nativeSetter = Object.getOwnPropertyDescriptor(
          el.tagName === "INPUT"
            ? HTMLInputElement.prototype
            : HTMLTextAreaElement.prototype,
          "value"
        )?.set;
        const newVal = el.value + text;
        nativeSetter?.call(el, newVal);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
    };
    window.addEventListener("aura-type-text", handleTypeText);

    return () => {
      window.removeEventListener("aura-close-all", handleCloseAll);
      window.removeEventListener("aura-type-text", handleTypeText);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bringToFront = useCallback((id: string) => {
    const z = nextZ.current++;
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, zIndex: z, minimized: false } : w)));
    setActiveWindow(id);
    updateProcessMinimized(id, false);
    focusWindow(id);
  }, [updateProcessMinimized, focusWindow]);

  const handleOpenWindow = useCallback((id: string) => {
    playClickSound();
    const isNew = !windowsRef.current.some((w) => w.id === id);
    setWindows((prev) => {
      const existing = prev.find((w) => w.id === id);
      const z = nextZ.current++;
      if (existing) return prev.map((w) => (w.id === id ? { ...w, minimized: false, zIndex: z } : w));
      return [...prev, { id, minimized: false, zIndex: z }];
    });
    const info = PROCESS_INFO[id] ?? { name: id, icon: "⬜" };
    if (isNew) {
      registerProcess({
        id, name: info.name, icon: info.icon,
        pid: genPID(), isMinimized: false, launchedAt: Date.now(),
      });
    } else {
      updateProcessMinimized(id, false);
    }
    setActiveWindow(id);
    setContextMenu(null);
  }, [registerProcess, updateProcessMinimized]);

  const handleCloseWindow = useCallback((id: string) => {
    playCloseSound();
    setWindows((prev) => prev.filter((w) => w.id !== id));
    setActiveWindow((prev) => {
      if (prev !== id) return prev;
      const remaining = windowsRef.current.filter((w) => w.id !== id && !w.minimized);
      return remaining.length > 0 ? remaining[remaining.length - 1].id : "";
    });
    unregisterProcess(id);
  }, [unregisterProcess]);

  // Keep refs in sync so callbacks are never stale
  handleCloseWindowRef.current = handleCloseWindow;
  handleOpenWindowRef.current  = handleOpenWindow;

  const handleMinimizeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, minimized: true } : w)));
    updateProcessMinimized(id, true);
    toggleMinimize(id);
    setActiveWindow((prev) => {
      if (prev !== id) return prev;
      const visible = windowsRef.current.filter((w) => w.id !== id && !w.minimized);
      return visible.length > 0 ? visible[visible.length - 1].id : "";
    });
  }, [updateProcessMinimized, toggleMinimize]);

  const handleTaskbarClick = useCallback((id: string) => {
    const win = windowsRef.current.find((w) => w.id === id);
    if (!win) return;
    if (win.minimized) bringToFront(id);
    else if (activeWindow === id) handleMinimizeWindow(id);
    else bringToFront(id);
  }, [bringToFront, handleMinimizeWindow, activeWindow]);

  const handleDesktopClick = useCallback(() => {
    if (!isDraggingSelection.current) {
      setContextMenu(null);
      setSelectedIcon(null);
    }
  }, []);

  const handleRightClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
    setSelectedIcon(null);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 350);
    if (!isMicGranted) {
      setMicGlowActive(true);
      setTimeout(() => setMicGlowActive(false), 10000);
    }
  }, [isMicGranted, setMicGlowActive]);

  const handleOpenMediaViewer = useCallback((fileName: string, fileUrl: string, fileType: string) => {
    const id = `mediaviewer-${Date.now()}`;
    const z = nextZ.current++;
    setWindows((prev) => [...prev, { id, minimized: false, zIndex: z, props: { fileName, fileUrl, fileType } }]);
    setActiveWindow(id);
    registerProcess({
      id,
      name: fileName.length > 20 ? fileName.slice(0, 18) + "…" : fileName,
      icon: fileType === "image" ? "🖼️" : fileType === "video" ? "🎬" : fileType === "audio" ? "🎵" : "📄",
      pid: genPID(), isMinimized: false, launchedAt: Date.now(),
    });
  }, [registerProcess]);

  // ── Selection Box — RAF-throttled to prevent main-thread jank ──────────────
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if (e.target !== e.currentTarget) return;

    isDraggingSelection.current = false;
    const rect = desktopRef.current?.getBoundingClientRect();
    if (!rect) return;

    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    let pendingEndX = startX;
    let pendingEndY = startY;
    let rafScheduled = false;

    setSelectionBox({ startX, startY, endX: startX, endY: startY, isVisible: false });

    const onMouseMove = (me: MouseEvent) => {
      pendingEndX = me.clientX - rect.left;
      pendingEndY = me.clientY - rect.top;
      const moved = Math.abs(pendingEndX - startX) > 4 || Math.abs(pendingEndY - startY) > 4;
      if (moved) isDraggingSelection.current = true;

      if (!rafScheduled) {
        rafScheduled = true;
        selectionRafRef.current = requestAnimationFrame(() => {
          rafScheduled = false;
          setSelectionBox({
            startX, startY,
            endX: pendingEndX, endY: pendingEndY,
            isVisible: isDraggingSelection.current,
          });
        });
      }
    };

    const onMouseUp = () => {
      if (selectionRafRef.current !== null) {
        cancelAnimationFrame(selectionRafRef.current);
        selectionRafRef.current = null;
      }
      setSelectionBox((prev) => ({ ...prev, isVisible: false }));
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      setTimeout(() => { isDraggingSelection.current = false; }, 50);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, []);

  const getInitialPosition = useCallback((type: string) => {
    if (typeof window === "undefined") return { x: 100, y: 100 };
    const offsets: Record<string, { x: number; y: number }> = {
      terminal:        { x: window.innerWidth / 2 - 350, y: window.innerHeight / 2 - 240 },
      files:           { x: window.innerWidth / 2 - 300, y: window.innerHeight / 2 - 210 },
      trash:           { x: window.innerWidth / 2 - 250, y: window.innerHeight / 2 - 175 },
      github:          { x: window.innerWidth / 2 - 340, y: window.innerHeight / 2 - 280 },
      portfolio:       { x: window.innerWidth / 2 - 450, y: window.innerHeight / 2 - 290 },
      browser:         { x: Math.round(window.innerWidth * 0.09), y: Math.round(window.innerHeight * 0.09) },
      wallpaperpicker: { x: window.innerWidth / 2 - 280, y: window.innerHeight / 2 - 230 },
      sentinel:        { x: window.innerWidth / 2 - 460, y: window.innerHeight / 2 - 300 },
      aura:            { x: window.innerWidth / 2 - 380, y: window.innerHeight / 2 - 270 },
      cyberchef:       { x: window.innerWidth / 2 - 500, y: window.innerHeight / 2 - 310 },
      codestudio:      { x: window.innerWidth / 2 - 490, y: window.innerHeight / 2 - 305 },
      threatmodeler:   { x: window.innerWidth / 2 - 480, y: window.innerHeight / 2 - 300 },
      chess:           { x: window.innerWidth / 2 - 390, y: window.innerHeight / 2 - 265 },
      cykrypt:         { x: window.innerWidth / 2 - 490, y: window.innerHeight / 2 - 320 },
      taskmanager:     { x: window.innerWidth / 2 - 330, y: window.innerHeight / 2 - 260 },
      settings:        { x: window.innerWidth / 2 - 390, y: window.innerHeight / 2 - 280 },
      mediaviewer:     { x: window.innerWidth / 2 - 410, y: window.innerHeight / 2 - 280 },
      threatmap:       { x: window.innerWidth / 2 - 450, y: window.innerHeight / 2 - 280 },
      codepad:         { x: window.innerWidth / 2 - 410, y: window.innerHeight / 2 - 270 },
      notepad:         { x: window.innerWidth / 2 - 450, y: window.innerHeight / 2 - 290 },
      securecomm:      { x: window.innerWidth / 2 - 500, y: window.innerHeight / 2 - 310 },
      dossier:         { x: window.innerWidth / 2 - 380, y: window.innerHeight / 2 - 280 },
    };
    return offsets[type] ?? { x: 120, y: 60 };
  }, []);

  // ── Long-press (touch right-click) ─────────────────────────────────────────
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    longPressFired.current = false;
    const touch = e.touches[0];
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      setContextMenu({ x: touch.clientX, y: touch.clientY });
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const handleTouchMove = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const openWindowList = windows.map((w) => ({
    id: w.id,
    label: w.id.startsWith("mediaviewer-")
      ? `Media: ${w.props?.fileName ?? "File"}`
      : (WINDOW_LABELS[w.id] ?? w.id),
    minimized: w.minimized,
  }));

  const getWin = (id: string) => windows.find((w) => w.id === id);

  const selLeft   = Math.min(selectionBox.startX, selectionBox.endX);
  const selTop    = Math.min(selectionBox.startY, selectionBox.endY);
  const selWidth  = Math.abs(selectionBox.endX - selectionBox.startX);
  const selHeight = Math.abs(selectionBox.endY - selectionBox.startY);

  // Stable icon callbacks — never recreated unless deps change
  const handleSelectIcon = useCallback((id: string | null) => setSelectedIcon(id), []);
  const handleLongPress  = useCallback((x: number, y: number) => setContextMenu({ x, y }), []);

  // Stable GamesTip callbacks
  const openChessAndDismiss = useCallback(() => { handleOpenWindow("chess"); setShowGamesTip(false); }, [handleOpenWindow]);
  const dismissTip = useCallback(() => setShowGamesTip(false), []);

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden bg-black text-white">
      <main
        ref={desktopRef}
        className="flex-1 relative overflow-hidden select-none"
        style={{
          backgroundImage: `url(${currentWallpaper})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          transition: "background-image 0.4s ease",
          cursor: computedCursor,
        }}
        onClick={handleDesktopClick}
        onContextMenu={handleRightClick}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
      >

      {/* Desktop icons — absolutely isolated layer */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div
          className={isRefreshing ? "cyber-glitch-refresh" : undefined}
          style={{
            transformOrigin: "center center",
            position: "absolute", inset: 0,
            pointerEvents: isRefreshing ? "none" : "auto",
          }}
        >
          <DesktopIcons
            onOpenWindow={handleOpenWindow}
            selectedIcon={selectedIcon}
            onSelectIcon={handleSelectIcon}
            dragConstraintsRef={desktopRef}
            onLongPress={handleLongPress}
          />
        </div>
      </div>

      {/* Selection box */}
      {selectionBox.isVisible && (
        <div
          style={{
            position: "absolute",
            left: selLeft, top: selTop,
            width: selWidth, height: selHeight,
            background: "rgba(54,123,240,0.15)",
            border: "1px solid rgba(54,123,240,0.7)",
            pointerEvents: "none", zIndex: 40, borderRadius: 2,
          }}
        />
      )}

      {/* App windows */}
      <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none" }}>
      <Suspense fallback={null}>
      <AnimatePresence>
        {getWin("terminal") && !getWin("terminal")!.minimized && (
          <Terminal
            key="terminal"
            onClose={() => handleCloseWindow("terminal")}
            onMinimize={() => handleMinimizeWindow("terminal")}
            isActive={activeWindow === "terminal"}
            onFocus={() => bringToFront("terminal")}
            initialX={getInitialPosition("terminal").x}
            initialY={getInitialPosition("terminal").y}
            zIndex={getWin("terminal")!.zIndex}
            onOpenWindow={handleOpenWindow}
          />
        )}

        {getWin("files") && !getWin("files")!.minimized && (
          <FileExplorer
            key="files"
            onClose={() => handleCloseWindow("files")}
            onMinimize={() => handleMinimizeWindow("files")}
            isActive={activeWindow === "files"}
            onFocus={() => bringToFront("files")}
            initialX={getInitialPosition("files").x}
            initialY={getInitialPosition("files").y}
            zIndex={getWin("files")!.zIndex}
            onOpenMediaViewer={handleOpenMediaViewer}
          />
        )}

        {getWin("trash") && !getWin("trash")!.minimized && (
          <Trash
            key="trash"
            onClose={() => handleCloseWindow("trash")}
            onMinimize={() => handleMinimizeWindow("trash")}
            isActive={activeWindow === "trash"}
            onFocus={() => bringToFront("trash")}
            initialX={getInitialPosition("trash").x}
            initialY={getInitialPosition("trash").y}
            zIndex={getWin("trash")!.zIndex}
          />
        )}

        {getWin("github") && !getWin("github")!.minimized && (
          <GitHubApp
            key="github"
            onClose={() => handleCloseWindow("github")}
            onMinimize={() => handleMinimizeWindow("github")}
            isActive={activeWindow === "github"}
            onFocus={() => bringToFront("github")}
            initialX={getInitialPosition("github").x}
            initialY={getInitialPosition("github").y}
            zIndex={getWin("github")!.zIndex}
          />
        )}

        {getWin("portfolio") && !getWin("portfolio")!.minimized && (
          <PortfolioApp
            key="portfolio"
            onClose={() => handleCloseWindow("portfolio")}
            onMinimize={() => handleMinimizeWindow("portfolio")}
            isActive={activeWindow === "portfolio"}
            onFocus={() => bringToFront("portfolio")}
            initialX={getInitialPosition("portfolio").x}
            initialY={getInitialPosition("portfolio").y}
            zIndex={getWin("portfolio")!.zIndex}
          />
        )}

        {getWin("browser") && !getWin("browser")!.minimized && (
          <BrowserApp
            key="browser"
            onClose={() => handleCloseWindow("browser")}
            onMinimize={() => handleMinimizeWindow("browser")}
            isActive={activeWindow === "browser"}
            onFocus={() => bringToFront("browser")}
            initialX={getInitialPosition("browser").x}
            initialY={getInitialPosition("browser").y}
            zIndex={getWin("browser")!.zIndex}
          />
        )}

        {getWin("wallpaperpicker") && !getWin("wallpaperpicker")!.minimized && (
          <WallpaperPicker
            key="wallpaperpicker"
            onClose={() => handleCloseWindow("wallpaperpicker")}
            isActive={activeWindow === "wallpaperpicker"}
            onFocus={() => bringToFront("wallpaperpicker")}
            initialX={getInitialPosition("wallpaperpicker").x}
            initialY={getInitialPosition("wallpaperpicker").y}
            zIndex={getWin("wallpaperpicker")!.zIndex}
          />
        )}

        {getWin("aura") && !getWin("aura")!.minimized && (
          <AuraApp
            key="aura"
            onClose={() => handleCloseWindow("aura")}
            onMinimize={() => handleMinimizeWindow("aura")}
            isActive={activeWindow === "aura"}
            onFocus={() => bringToFront("aura")}
            initialX={getInitialPosition("aura").x}
            initialY={getInitialPosition("aura").y}
            zIndex={getWin("aura")!.zIndex}
            onOpenWindow={handleOpenWindow}
          />
        )}

        {getWin("sentinel") && !getWin("sentinel")!.minimized && (
          <SentinelApp
            key="sentinel"
            onClose={() => handleCloseWindow("sentinel")}
            onMinimize={() => handleMinimizeWindow("sentinel")}
            isActive={activeWindow === "sentinel"}
            onFocus={() => bringToFront("sentinel")}
            initialX={getInitialPosition("sentinel").x}
            initialY={getInitialPosition("sentinel").y}
            zIndex={getWin("sentinel")!.zIndex}
          />
        )}

        {getWin("cyberchef") && !getWin("cyberchef")!.minimized && (
          <CyberChefApp
            key="cyberchef"
            onClose={() => handleCloseWindow("cyberchef")}
            onMinimize={() => handleMinimizeWindow("cyberchef")}
            isActive={activeWindow === "cyberchef"}
            onFocus={() => bringToFront("cyberchef")}
            initialX={getInitialPosition("cyberchef").x}
            initialY={getInitialPosition("cyberchef").y}
            zIndex={getWin("cyberchef")!.zIndex}
          />
        )}

        {getWin("codestudio") && !getWin("codestudio")!.minimized && (
          <CodeStudioApp
            key="codestudio"
            onClose={() => handleCloseWindow("codestudio")}
            onMinimize={() => handleMinimizeWindow("codestudio")}
            isActive={activeWindow === "codestudio"}
            onFocus={() => bringToFront("codestudio")}
            initialX={getInitialPosition("codestudio").x}
            initialY={getInitialPosition("codestudio").y}
            zIndex={getWin("codestudio")!.zIndex}
          />
        )}

        {getWin("threatmodeler") && !getWin("threatmodeler")!.minimized && (
          <ThreatModelerApp
            key="threatmodeler"
            onClose={() => handleCloseWindow("threatmodeler")}
            onMinimize={() => handleMinimizeWindow("threatmodeler")}
            isActive={activeWindow === "threatmodeler"}
            onFocus={() => bringToFront("threatmodeler")}
            initialX={getInitialPosition("threatmodeler").x}
            initialY={getInitialPosition("threatmodeler").y}
            zIndex={getWin("threatmodeler")!.zIndex}
          />
        )}

        {getWin("chess") && !getWin("chess")!.minimized && (
          <ChessApp
            key="chess"
            onClose={() => handleCloseWindow("chess")}
            onMinimize={() => handleMinimizeWindow("chess")}
            isActive={activeWindow === "chess"}
            onFocus={() => bringToFront("chess")}
            initialX={getInitialPosition("chess").x}
            initialY={getInitialPosition("chess").y}
            zIndex={getWin("chess")!.zIndex}
          />
        )}

        {getWin("cykrypt") && !getWin("cykrypt")!.minimized && (
          <CykryptApp
            key="cykrypt"
            onClose={() => handleCloseWindow("cykrypt")}
            onMinimize={() => handleMinimizeWindow("cykrypt")}
            isActive={activeWindow === "cykrypt"}
            onFocus={() => bringToFront("cykrypt")}
            initialX={getInitialPosition("cykrypt").x}
            initialY={getInitialPosition("cykrypt").y}
            zIndex={getWin("cykrypt")!.zIndex}
          />
        )}

        {getWin("taskmanager") && !getWin("taskmanager")!.minimized && (
          <TaskManagerApp
            key="taskmanager"
            onClose={() => handleCloseWindow("taskmanager")}
            onMinimize={() => handleMinimizeWindow("taskmanager")}
            isActive={activeWindow === "taskmanager"}
            onFocus={() => bringToFront("taskmanager")}
            initialX={getInitialPosition("taskmanager").x}
            initialY={getInitialPosition("taskmanager").y}
            zIndex={getWin("taskmanager")!.zIndex}
          />
        )}

        {getWin("settings") && !getWin("settings")!.minimized && (
          <SettingsApp
            key="settings"
            onClose={() => handleCloseWindow("settings")}
            onMinimize={() => handleMinimizeWindow("settings")}
            isActive={activeWindow === "settings"}
            onFocus={() => bringToFront("settings")}
            initialX={getInitialPosition("settings").x}
            initialY={getInitialPosition("settings").y}
            zIndex={getWin("settings")!.zIndex}
            onOpenTaskManager={() => handleOpenWindow("taskmanager")}
          />
        )}

        {getWin("threatmap") && !getWin("threatmap")!.minimized && (
          <ThreatMapApp
            key="threatmap"
            onClose={() => handleCloseWindow("threatmap")}
            onMinimize={() => handleMinimizeWindow("threatmap")}
            isActive={activeWindow === "threatmap"}
            onFocus={() => bringToFront("threatmap")}
            initialX={getInitialPosition("threatmap").x}
            initialY={getInitialPosition("threatmap").y}
            zIndex={getWin("threatmap")!.zIndex}
          />
        )}

        {getWin("codepad") && !getWin("codepad")!.minimized && (
          <CodePadApp
            key="codepad"
            onClose={() => handleCloseWindow("codepad")}
            onMinimize={() => handleMinimizeWindow("codepad")}
            isActive={activeWindow === "codepad"}
            onFocus={() => bringToFront("codepad")}
            initialX={getInitialPosition("codepad").x}
            initialY={getInitialPosition("codepad").y}
            zIndex={getWin("codepad")!.zIndex}
          />
        )}

        {getWin("securecomm") && !getWin("securecomm")!.minimized && (
          <SecureCommApp
            key="securecomm"
            onClose={() => handleCloseWindow("securecomm")}
            onMinimize={() => handleMinimizeWindow("securecomm")}
            isActive={activeWindow === "securecomm"}
            onFocus={() => bringToFront("securecomm")}
            initialX={getInitialPosition("securecomm").x}
            initialY={getInitialPosition("securecomm").y}
            zIndex={getWin("securecomm")!.zIndex}
          />
        )}

        {getWin("dossier") && !getWin("dossier")!.minimized && (
          <DossierApp
            key="dossier"
            onClose={() => handleCloseWindow("dossier")}
            onMinimize={() => handleMinimizeWindow("dossier")}
            isActive={activeWindow === "dossier"}
            onFocus={() => bringToFront("dossier")}
            initialX={getInitialPosition("dossier").x}
            initialY={getInitialPosition("dossier").y}
            zIndex={getWin("dossier")!.zIndex}
          />
        )}

        {getWin("notepad") && !getWin("notepad")!.minimized && (
          <NotepadApp
            key="notepad"
            onClose={() => handleCloseWindow("notepad")}
            onMinimize={() => handleMinimizeWindow("notepad")}
            isActive={activeWindow === "notepad"}
            onFocus={() => bringToFront("notepad")}
            initialX={getInitialPosition("notepad").x}
            initialY={getInitialPosition("notepad").y}
            zIndex={getWin("notepad")!.zIndex}
          />
        )}

        {windows.filter(w => w.id.startsWith("mediaviewer-") && !w.minimized).map((win) => (
          <MediaViewerApp
            key={win.id}
            onClose={() => handleCloseWindow(win.id)}
            onMinimize={() => handleMinimizeWindow(win.id)}
            isActive={activeWindow === win.id}
            onFocus={() => bringToFront(win.id)}
            initialX={getInitialPosition("mediaviewer").x}
            initialY={getInitialPosition("mediaviewer").y}
            zIndex={win.zIndex}
            fileName={win.props?.fileName ?? ""}
            fileUrl={win.props?.fileUrl ?? ""}
            fileType={(win.props?.fileType ?? "unknown") as MediaType}
          />
        ))}
      </AnimatePresence>
      </Suspense>
      </div>

      <AnimatePresence>
        {contextMenu && (
          <RightClickMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            onOpenWindow={handleOpenWindow}
            onOpenWallpaperPicker={() => handleOpenWindow("wallpaperpicker")}
            onRefresh={handleRefresh}
          />
        )}
      </AnimatePresence>

      {/* Games tip notification */}
      <AnimatePresence>
        {showGamesTip && (
          <GamesTip key="games-tip" onOpen={openChessAndDismiss} onDismiss={dismissTip} />
        )}
      </AnimatePresence>

      </main>

      {/* AURA Listening Glow */}
      <AuraListenGlow />

      <footer className="h-12 shrink-0 z-[9999]">
        <TopPanel
          openWindows={openWindowList}
          onOpenWindow={handleOpenWindow}
          onTaskbarClick={handleTaskbarClick}
          activeWindowId={activeWindow}
        />
      </footer>
    </div>
  );
}
