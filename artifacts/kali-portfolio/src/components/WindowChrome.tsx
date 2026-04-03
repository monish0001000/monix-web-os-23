import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface WindowChromeProps {
  title: string;
  onClose: () => void;
  onMinimize?: () => void;
  children: React.ReactNode;
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  isActive: boolean;
  onFocus: () => void;
}

export default function WindowChrome({
  title,
  onClose,
  onMinimize = () => {},
  children,
  initialX,
  initialY,
  width = 700,
  height = 450,
  isActive,
  onFocus
}: WindowChromeProps) {
  const [pos, setPos] = useState({ 
    x: initialX ?? (typeof window !== 'undefined' ? window.innerWidth / 2 - width / 2 : 100), 
    y: initialY ?? (typeof window !== 'undefined' ? window.innerHeight / 2 - height / 2 : 100)
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      let newX = e.clientX - dragOffset.current.x;
      let newY = e.clientY - dragOffset.current.y;
      
      // Clamp to viewport
      const maxX = window.innerWidth - width;
      const maxY = window.innerHeight - height;
      
      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(28, Math.min(newY, maxY)); // 28 is TopPanel height
      
      setPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, width, height]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    };
    onFocus();
  };

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{ left: pos.x, top: pos.y, width, height, zIndex: isActive ? 50 : 40 }}
      className="absolute border border-white/10 rounded-lg overflow-hidden shadow-2xl flex flex-col bg-card select-none"
      onClick={onFocus}
    >
      {/* Title bar */}
      <div 
        className="h-8 bg-[#2d2d2d] flex items-center px-3 cursor-move shrink-0"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 cursor-pointer flex-shrink-0" 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
          />
          <div 
            className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 cursor-pointer flex-shrink-0"
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
          />
          <div 
            className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 cursor-pointer flex-shrink-0"
            onClick={(e) => { e.stopPropagation(); }}
          />
        </div>
        <div className="absolute left-1/2 transform -translate-x-1/2 text-xs text-gray-300 pointer-events-none font-sans">
          {title}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto bg-transparent relative" style={{ cursor: 'auto' }}>
        {children}
      </div>
    </motion.div>
  );
}
