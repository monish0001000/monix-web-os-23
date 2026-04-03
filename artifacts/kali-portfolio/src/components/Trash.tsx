import { Trash2 } from "lucide-react";
import WindowChrome from "./WindowChrome";

interface TrashProps {
  onClose: () => void;
  onMinimize?: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
}

export default function Trash({ onClose, onMinimize, isActive, onFocus, initialX, initialY, zIndex }: TrashProps) {
  return (
    <WindowChrome
      title="Trash"
      onClose={onClose}
      onMinimize={onMinimize}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX}
      initialY={initialY}
      width={500}
      height={350}
      zIndex={zIndex}
    >
      <div className="w-full h-full bg-[#1c1c1c] flex flex-col items-center justify-center font-sans">
        <Trash2 className="w-16 h-16 text-gray-600 mb-4" />
        <p className="text-gray-400 font-medium">Trash is Empty</p>
        <p className="text-xs text-gray-600 mt-1">Items you delete will appear here</p>
      </div>
    </WindowChrome>
  );
}
