import { Trash2 } from "lucide-react";
import WindowChrome from "./WindowChrome";

interface TrashProps {
  onClose: () => void;
  isActive: boolean;
  onFocus: () => void;
}

export default function Trash({ onClose, isActive, onFocus }: TrashProps) {
  return (
    <WindowChrome
      title="Trash"
      onClose={onClose}
      isActive={isActive}
      onFocus={onFocus}
      width={500}
      height={350}
    >
      <div className="w-full h-full bg-[#1c1c1c] flex flex-col items-center justify-center font-sans">
        <Trash2 className="w-16 h-16 text-gray-600 mb-4" />
        <p className="text-gray-400 font-medium">Trash is Empty</p>
        <p className="text-xs text-gray-600 mt-1">Items you delete will appear here</p>
      </div>
    </WindowChrome>
  );
}
