import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import TopPanel from "./TopPanel";
import DesktopIcons from "./DesktopIcons";
import Terminal from "./Terminal";
import FileExplorer from "./FileExplorer";
import Trash from "./Trash";
import RightClickMenu from "./RightClickMenu";
import wallpaperImg from "@assets/kali-ferrofluid_1775178957082.jpg";

export default function Desktop() {
  const [openWindows, setOpenWindows] = useState<string[]>([]);
  const [activeWindow, setActiveWindow] = useState<string>('');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleOpenWindow = (id: string) => {
    if (!openWindows.includes(id)) {
      setOpenWindows([...openWindows, id]);
    }
    setActiveWindow(id);
    setContextMenu(null);
  };

  const handleCloseWindow = (id: string) => {
    setOpenWindows(openWindows.filter(w => w !== id));
    if (activeWindow === id) {
      setActiveWindow(openWindows.length > 1 ? openWindows[openWindows.length - 2] : '');
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

  const getActiveWindowName = () => {
    switch(activeWindow) {
      case 'terminal': return 'Terminal - monish@kali';
      case 'files': return 'Files - File Manager';
      case 'trash': return 'Trash';
      default: return '';
    }
  };

  const getInitialPosition = (type: string) => {
    if (typeof window === 'undefined') return { x: 100, y: 100 };
    switch(type) {
      case 'terminal': return { x: window.innerWidth / 2 - 350, y: window.innerHeight / 2 - 225 };
      case 'files': return { x: window.innerWidth / 2 - 300, y: window.innerHeight / 2 - 200 };
      case 'trash': return { x: window.innerWidth / 2 - 250, y: window.innerHeight / 2 - 175 };
      default: return { x: 100, y: 100 };
    }
  };

  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6 text-center z-[100] font-sans">
        <h2 className="text-2xl font-bold text-white mb-4">Best Viewed on Desktop</h2>
        <p className="text-gray-400 mb-8 max-w-sm">
          This portfolio is a full Kali Linux OS simulation designed for desktop screens (1366x768+).
        </p>
        <div className="flex flex-col gap-2 text-sm text-gray-500">
          <p>Monish</p>
          <a href="https://github.com/monishpkp" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
            github.com/monishpkp
          </a>
          <p>monish@example.com</p>
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
      <TopPanel activeWindowName={getActiveWindowName()} onOpenWindow={handleOpenWindow} />
      
      <DesktopIcons 
        onOpenWindow={handleOpenWindow}
        selectedIcon={selectedIcon}
        onSelectIcon={setSelectedIcon}
      />

      <AnimatePresence>
        {openWindows.includes('terminal') && (
          <Terminal 
            key="terminal"
            onClose={() => handleCloseWindow('terminal')}
            isActive={activeWindow === 'terminal'}
            onFocus={() => setActiveWindow('terminal')}
            initialX={getInitialPosition('terminal').x}
            initialY={getInitialPosition('terminal').y}
          />
        )}
        
        {openWindows.includes('files') && (
          <FileExplorer 
            key="files"
            onClose={() => handleCloseWindow('files')}
            isActive={activeWindow === 'files'}
            onFocus={() => setActiveWindow('files')}
            initialX={getInitialPosition('files').x}
            initialY={getInitialPosition('files').y}
          />
        )}
        
        {openWindows.includes('trash') && (
          <Trash 
            key="trash"
            onClose={() => handleCloseWindow('trash')}
            isActive={activeWindow === 'trash'}
            onFocus={() => setActiveWindow('trash')}
            initialX={getInitialPosition('trash').x}
            initialY={getInitialPosition('trash').y}
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
