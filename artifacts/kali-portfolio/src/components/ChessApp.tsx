import WindowChrome from "./WindowChrome";
import ChessGame from "./ChessGame";

interface ChessAppProps {
  onClose: () => void;
  onMinimize: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
}

export default function ChessApp({
  onClose, onMinimize, isActive, onFocus, initialX, initialY, zIndex,
}: ChessAppProps) {
  return (
    <WindowChrome
      title="Monix Grandmaster Chess"
      onClose={onClose}
      onMinimize={onMinimize}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX}
      initialY={initialY}
      width={780}
      height={530}
      zIndex={zIndex}
    >
      <div className="w-full h-full overflow-hidden">
        <ChessGame />
      </div>
    </WindowChrome>
  );
}
