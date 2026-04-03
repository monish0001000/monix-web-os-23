import { motion } from "framer-motion";
import { toast } from "sonner";

interface RightClickMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onOpenWindow: (id: string) => void;
}

export default function RightClickMenu({ x, y, onClose, onOpenWindow }: RightClickMenuProps) {
  
  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      className="absolute bg-[#1e1e1e] border border-white/10 rounded-md shadow-2xl py-1 min-w-[180px] z-[100] font-sans"
      style={{ left: x, top: y }}
    >
      <div 
        className="px-3 py-1.5 text-sm text-gray-200 hover:bg-blue-600/30 hover:text-white cursor-pointer transition-colors"
        onClick={() => handleAction(() => onOpenWindow('terminal'))}
      >
        Open Terminal
      </div>
      
      <div 
        className="px-3 py-1.5 text-sm text-gray-200 hover:bg-blue-600/30 hover:text-white cursor-pointer transition-colors"
        onClick={() => handleAction(() => toast("New folder created on desktop."))}
      >
        New Folder
      </div>
      
      <div className="border-t border-white/10 my-1"></div>
      
      <div 
        className="px-3 py-1.5 text-sm text-gray-200 hover:bg-blue-600/30 hover:text-white cursor-pointer transition-colors"
        onClick={() => handleAction(() => toast("Wallpaper settings are disabled in this demo."))}
      >
        Change Wallpaper
      </div>
      
      <div 
        className="px-3 py-1.5 text-sm text-gray-200 hover:bg-blue-600/30 hover:text-white cursor-pointer transition-colors"
        onClick={() => handleAction(() => toast("Display settings are optimized for your current view."))}
      >
        Display Settings
      </div>
      
      <div className="border-t border-white/10 my-1"></div>
      
      <div 
        className="px-3 py-1.5 text-sm text-gray-200 hover:bg-blue-600/30 hover:text-white cursor-pointer transition-colors"
        onClick={() => handleAction(() => toast("Kali Linux OS Simulation v1.0 by Monish."))}
      >
        About This System
      </div>
    </motion.div>
  );
}
