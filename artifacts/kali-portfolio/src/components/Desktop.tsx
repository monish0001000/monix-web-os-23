import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import TopPanel from "./TopPanel";
import DesktopIcons from "./DesktopIcons";
import Terminal from "./Terminal";
import FileExplorer from "./FileExplorer";
import Trash from "./Trash";
import GitHubApp from "./GitHubApp";
import PortfolioApp from "./PortfolioApp";
import BrowserApp from "./BrowserApp";
import WallpaperPicker from "./WallpaperPicker";
import SentinelApp from "./SentinelApp";
import AuraApp from "./AuraApp";
import CyberChefApp from "./CyberChefApp";
import CodeStudioApp from "./CodeStudioApp";
import ThreatModelerApp from "./ThreatModelerApp";
import ChessApp from "./ChessApp";
import CykryptApp from "./CykryptApp";
import TaskManagerApp from "./TaskManagerApp";
import SettingsApp from "./SettingsApp";
import RightClickMenu from "./RightClickMenu";
import { useOSStore } from "@/lib/store";

export interface WindowEntry {
  id: string;
  minimized: boolean;
  zIndex: number;
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
};

interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  isVisible: boolean;
}

export default function Desktop() {
  const [windows, setWindows] = useState<WindowEntry[]>([]);
  const [activeWindow, setActiveWindow] = useState<string>("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectionBox, setSelectionBox] = useState<SelectionBox>({
    startX: 0, startY: 0, endX: 0, endY: 0, isVisible: false,
  });

  const nextZ = useRef(20);
  const desktopRef = useRef<HTMLDivElement>(null);
  const isDraggingSelection = useRef(false);

  const currentWallpaper = useOSStore((s) => s.currentWallpaper);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const bringToFront = (id: string) => {
    const z = nextZ.current++;
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, zIndex: z, minimized: false } : w)));
    setActiveWindow(id);
  };

  const handleOpenWindow = (id: string) => {
    setWindows((prev) => {
      const existing = prev.find((w) => w.id === id);
      const z = nextZ.current++;
      if (existing) return prev.map((w) => (w.id === id ? { ...w, minimized: false, zIndex: z } : w));
      return [...prev, { id, minimized: false, zIndex: z }];
    });
    setActiveWindow(id);
    setContextMenu(null);
  };

  const handleCloseWindow = (id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    setActiveWindow((prev) => {
      if (prev !== id) return prev;
      const remaining = windows.filter((w) => w.id !== id && !w.minimized);
      return remaining.length > 0 ? remaining[remaining.length - 1].id : "";
    });
  };

  const handleMinimizeWindow = (id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, minimized: true } : w)));
    if (activeWindow === id) {
      const visible = windows.filter((w) => w.id !== id && !w.minimized);
      setActiveWindow(visible.length > 0 ? visible[visible.length - 1].id : "");
    }
  };

  const handleTaskbarClick = (id: string) => {
    const win = windows.find((w) => w.id === id);
    if (!win) return;
    if (win.minimized) bringToFront(id);
    else if (activeWindow === id) handleMinimizeWindow(id);
    else bringToFront(id);
  };

  const handleDesktopClick = () => {
    if (!isDraggingSelection.current) {
      setContextMenu(null);
      setSelectedIcon(null);
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
    setSelectedIcon(null);
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 350);
  }, []);

  // ── Selection Box handlers ──
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only on left click directly on the desktop background
    if (e.button !== 0) return;
    if (e.target !== e.currentTarget) return;

    isDraggingSelection.current = false;
    const rect = desktopRef.current?.getBoundingClientRect();
    if (!rect) return;

    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    setSelectionBox({ startX, startY, endX: startX, endY: startY, isVisible: false });

    const onMouseMove = (me: MouseEvent) => {
      const endX = me.clientX - rect.left;
      const endY = me.clientY - rect.top;
      const moved = Math.abs(endX - startX) > 4 || Math.abs(endY - startY) > 4;
      if (moved) isDraggingSelection.current = true;
      setSelectionBox({ startX, startY, endX, endY, isVisible: moved });
    };

    const onMouseUp = () => {
      setSelectionBox((prev) => ({ ...prev, isVisible: false }));
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      // Small delay so the click handler can check the flag
      setTimeout(() => { isDraggingSelection.current = false; }, 50);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const getInitialPosition = (type: string) => {
    if (typeof window === "undefined") return { x: 100, y: 100 };
    const offsets: Record<string, { x: number; y: number }> = {
      terminal:        { x: window.innerWidth / 2 - 350, y: window.innerHeight / 2 - 240 },
      files:           { x: window.innerWidth / 2 - 300, y: window.innerHeight / 2 - 210 },
      trash:           { x: window.innerWidth / 2 - 250, y: window.innerHeight / 2 - 175 },
      github:          { x: window.innerWidth / 2 - 340, y: window.innerHeight / 2 - 280 },
      portfolio:       { x: window.innerWidth / 2 - 450, y: window.innerHeight / 2 - 290 },
      browser:         { x: window.innerWidth / 2 - 480, y: window.innerHeight / 2 - 310 },
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
    };
    return offsets[type] ?? { x: 120, y: 60 };
  };

  const openWindowList = windows.map((w) => ({
    id: w.id,
    label: WINDOW_LABELS[w.id] ?? w.id,
    minimized: w.minimized,
  }));

  const getWin = (id: string) => windows.find((w) => w.id === id);

  // Compute selection rect
  const selLeft   = Math.min(selectionBox.startX, selectionBox.endX);
  const selTop    = Math.min(selectionBox.startY, selectionBox.endY);
  const selWidth  = Math.abs(selectionBox.endX - selectionBox.startX);
  const selHeight = Math.abs(selectionBox.endY - selectionBox.startY);

  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6 text-center z-[100] font-sans">
        <h2 className="text-2xl font-bold text-white mb-4">Best Viewed on Desktop</h2>
        <p className="text-gray-400 mb-8 max-w-sm">
          This portfolio is a full OS simulation designed for desktop screens (1366×768+).
        </p>
        <div className="flex flex-col gap-2 text-sm text-gray-500">
          <p>Monish</p>
          <a href="https://github.com/monishpkp" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
            github.com/monishpkp
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={desktopRef}
      className="w-full h-full relative overflow-hidden select-none"
      style={{
        backgroundImage: `url(${currentWallpaper})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        transition: "background-image 0.4s ease",
      }}
      onClick={handleDesktopClick}
      onContextMenu={handleRightClick}
      onMouseDown={handleMouseDown}
    >
      {/* Desktop icons wrapper with refresh animation */}
      <div
        className={isRefreshing ? "cyber-glitch-refresh" : undefined}
        style={{
          transformOrigin: "center center",
          width: "100%",
          height: "100%",
          position: "absolute",
          inset: 0,
          pointerEvents: isRefreshing ? "none" : "auto",
        }}
      >
        <DesktopIcons
          onOpenWindow={handleOpenWindow}
          selectedIcon={selectedIcon}
          onSelectIcon={setSelectedIcon}
          dragConstraintsRef={desktopRef}
        />
      </div>

      {/* Selection box */}
      {selectionBox.isVisible && (
        <div
          style={{
            position: "absolute",
            left: selLeft,
            top: selTop,
            width: selWidth,
            height: selHeight,
            background: "rgba(54,123,240,0.15)",
            border: "1px solid rgba(54,123,240,0.7)",
            pointerEvents: "none",
            zIndex: 40,
            borderRadius: 2,
          }}
        />
      )}

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
          />
        )}
      </AnimatePresence>

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

      <TopPanel
        openWindows={openWindowList}
        onOpenWindow={handleOpenWindow}
        onTaskbarClick={handleTaskbarClick}
        activeWindowId={activeWindow}
      />
    </div>
  );
}
