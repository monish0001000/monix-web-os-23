import { motion } from "framer-motion";
import { toast } from "sonner";

interface RightClickMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onOpenWindow: (id: string) => void;
  onOpenWallpaperPicker: () => void;
}

export default function RightClickMenu({ x, y, onClose, onOpenWindow, onOpenWallpaperPicker }: RightClickMenuProps) {
  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -4, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.1 }}
      className="absolute font-sans"
      style={{
        left: x,
        top: y,
        background: "#18181f",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 6,
        boxShadow: "0 12px 40px rgba(0,0,0,0.85)",
        padding: "4px 0",
        minWidth: 200,
        zIndex: 200,
      }}
    >
      <div
        className="px-3 py-1.5 text-sm text-gray-200 hover:bg-blue-600/30 hover:text-white cursor-pointer transition-colors"
        onClick={() => handleAction(() => onOpenWindow("terminal"))}
      >
        Open Terminal
      </div>

      <div
        className="px-3 py-1.5 text-sm text-gray-200 hover:bg-blue-600/30 hover:text-white cursor-pointer transition-colors"
        onClick={() => handleAction(() => toast("New folder created on desktop."))}
      >
        New Folder
      </div>

      <div className="border-t border-white/10 my-1" />

      <div
        className="px-3 py-1.5 text-sm text-gray-200 hover:bg-blue-600/30 hover:text-white cursor-pointer transition-colors flex items-center justify-between"
        onClick={() => handleAction(onOpenWallpaperPicker)}
      >
        <span>Change Wallpaper…</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>▸</span>
      </div>

      <div
        className="px-3 py-1.5 text-sm text-gray-200 hover:bg-blue-600/30 hover:text-white cursor-pointer transition-colors"
        onClick={() => handleAction(() => window.location.reload())}
      >
        Refresh
      </div>

      <div className="border-t border-white/10 my-1" />

      <div
        className="px-3 py-1.5 text-sm text-gray-200 hover:bg-blue-600/30 hover:text-white cursor-pointer transition-colors"
        onClick={() => handleAction(() => toast("MONIX OS Simulation v1.0 by Monish."))}
      >
        About This System
      </div>
    </motion.div>
  );
}
