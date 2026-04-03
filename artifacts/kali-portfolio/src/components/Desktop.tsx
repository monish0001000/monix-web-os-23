import { useState, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import TopPanel from "./TopPanel";
import DesktopIcons from "./DesktopIcons";
import Terminal from "./Terminal";
import FileExplorer from "./FileExplorer";
import Trash from "./Trash";
import GitHubApp from "./GitHubApp";
import RightClickMenu from "./RightClickMenu";
import wallpaperImg from "@assets/kali-ferrofluid_1775178957082.jpg";

export interface WindowEntry {
  id: string;
  minimized: boolean;
  zIndex: number;
}

const WINDOW_LABELS: Record<string, string> = {
  terminal: "Terminal",
  files: "Files",
  trash: "Trash",
  github: "GitHub",
};

export default function Desktop() {
  const [windows, setWindows] = useState<WindowEntry[]>([]);
  const [activeWindow, setActiveWindow] = useState<string>("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const nextZ = useRef(20);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const bringToFront = (id: string) => {
    const z = nextZ.current++;
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, zIndex: z, minimized: false } : w))
    );
    setActiveWindow(id);
  };

  const handleOpenWindow = (id: string) => {
    setWindows((prev) => {
      const existing = prev.find((w) => w.id === id);
      const z = nextZ.current++;
      if (existing) {
        return prev.map((w) =>
          w.id === id ? { ...w, minimized: false, zIndex: z } : w
        );
      }
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
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, minimized: true } : w))
    );
    if (activeWindow === id) {
      const visible = windows.filter((w) => w.id !== id && !w.minimized);
      setActiveWindow(visible.length > 0 ? visible[visible.length - 1].id : "");
    }
  };

  const handleTaskbarClick = (id: string) => {
    const win = windows.find((w) => w.id === id);
    if (!win) return;
    if (win.minimized) {
      bringToFront(id);
    } else if (activeWindow === id) {
      handleMinimizeWindow(id);
    } else {
      bringToFront(id);
    }
  };

  const handleDesktopClick = () => {
    setContextMenu(null);
    setSelectedIcon(null);
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
    setSelectedIcon(null);
  };

  const getInitialPosition = (type: string) => {
    if (typeof window === "undefined") return { x: 100, y: 100 };
    const offsets: Record<string, { x: number; y: number }> = {
      terminal: { x: window.innerWidth / 2 - 350, y: window.innerHeight / 2 - 225 },
      files:    { x: window.innerWidth / 2 - 300, y: window.innerHeight / 2 - 200 },
      trash:    { x: window.innerWidth / 2 - 250, y: window.innerHeight / 2 - 175 },
      github:   { x: window.innerWidth / 2 - 340, y: window.innerHeight / 2 - 280 },
    };
    return offsets[type] ?? { x: 120, y: 120 };
  };

  const openWindowList = windows.map((w) => ({
    id: w.id,
    label: WINDOW_LABELS[w.id] ?? w.id,
    minimized: w.minimized,
  }));

  const getWin = (id: string) => windows.find((w) => w.id === id);

  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6 text-center z-[100] font-sans">
        <h2 className="text-2xl font-bold text-white mb-4">Best Viewed on Desktop</h2>
        <p className="text-gray-400 mb-8 max-w-sm">
          This portfolio is a full Kali Linux OS simulation designed for desktop screens (1366×768+).
        </p>
        <div className="flex flex-col gap-2 text-sm text-gray-500">
          <p>Monish</p>
          <a href="https://github.com/monish0001000" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
            github.com/monish0001000
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{
        backgroundImage: `url(${wallpaperImg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      onClick={handleDesktopClick}
      onContextMenu={handleRightClick}
    >
      <TopPanel
        openWindows={openWindowList}
        onOpenWindow={handleOpenWindow}
        onTaskbarClick={handleTaskbarClick}
        activeWindowId={activeWindow}
      />

      <DesktopIcons
        onOpenWindow={handleOpenWindow}
        selectedIcon={selectedIcon}
        onSelectIcon={setSelectedIcon}
      />

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
      </AnimatePresence>

      <AnimatePresence>
        {contextMenu && (
          <RightClickMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            onOpenWindow={handleOpenWindow}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
