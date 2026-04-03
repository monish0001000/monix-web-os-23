import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X, Minus, Square } from "lucide-react";

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
  zIndex?: number;
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
  onFocus,
  zIndex = 20,
}: WindowChromeProps) {
  const [pos, setPos] = useState({
    x: initialX ?? (typeof window !== "undefined" ? window.innerWidth / 2 - width / 2 : 100),
    y: initialY ?? (typeof window !== "undefined" ? window.innerHeight / 2 - height / 2 : 100),
  });
  const [maximized, setMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const preMaxPos = useRef(pos);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (maximized) return;
      let newX = e.clientX - dragOffset.current.x;
      let newY = e.clientY - dragOffset.current.y;
      newX = Math.max(0, Math.min(newX, window.innerWidth - width));
      newY = Math.max(28, Math.min(newY, window.innerHeight - height));
      setPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, width, height, maximized]);

  const handleTitleBarMouseDown = (e: React.MouseEvent) => {
    if (maximized) return;
    setIsDragging(true);
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    onFocus();
  };

  const handleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!maximized) {
      preMaxPos.current = pos;
      setMaximized(true);
    } else {
      setPos(preMaxPos.current);
      setMaximized(false);
    }
  };

  const windowStyle: React.CSSProperties = maximized
    ? {
        position: "fixed",
        left: 0,
        top: 28,
        width: "100vw",
        height: "calc(100vh - 28px)",
        zIndex,
        display: "flex",
        flexDirection: "column",
        userSelect: "none",
        border: "none",
        boxShadow: "none",
      }
    : {
        position: "absolute",
        left: pos.x,
        top: pos.y,
        width,
        height,
        zIndex,
        display: "flex",
        flexDirection: "column",
        userSelect: "none",
        border: isActive
          ? "1px solid rgba(0,163,255,0.4)"
          : "1px solid rgba(255,255,255,0.10)",
        boxShadow: isActive
          ? "0 8px 40px rgba(0,0,0,0.85), 0 0 0 1px rgba(0,163,255,0.12)"
          : "0 8px 32px rgba(0,0,0,0.7)",
      };

  return (
    <motion.div
      initial={{ scale: 0.97, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.97, opacity: 0 }}
      transition={{ duration: 0.12 }}
      style={windowStyle}
      onMouseDown={onFocus}
    >
      {/* XFCE Kali title bar */}
      <div
        onMouseDown={handleTitleBarMouseDown}
        onDoubleClick={handleMaximize}
        style={{
          height: 26,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          background: isActive
            ? "linear-gradient(180deg, #3e3e3e 0%, #2c2c2c 100%)"
            : "linear-gradient(180deg, #2e2e2e 0%, #222222 100%)",
          borderBottom: "1px solid rgba(0,0,0,0.7)",
          cursor: maximized ? "default" : "move",
        }}
      >
        {/* Icon + Title on LEFT */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            paddingLeft: 8,
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: 13,
              height: 13,
              flexShrink: 0,
              background: "#00a3ff",
              clipPath: "polygon(0 0, 100% 0, 100% 70%, 70% 100%, 0 100%)",
            }}
          />
          <span
            style={{
              color: isActive ? "#ffffff" : "#999999",
              fontSize: 11,
              fontWeight: 400,
              letterSpacing: "0.01em",
              lineHeight: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: "'Ubuntu', sans-serif",
            }}
          >
            {title}
          </span>
        </div>

        {/* XFCE window buttons RIGHT: minimize | maximize | close */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            paddingRight: 4,
            gap: 1,
            flexShrink: 0,
          }}
        >
          {/* Minimize */}
          <button
            title="Minimize"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
            style={{
              width: 19,
              height: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(180deg, #5c5c5c 0%, #464646 100%)",
              border: "1px solid #222",
              borderTop: "1px solid rgba(255,255,255,0.18)",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <Minus size={9} color="#d0d0d0" strokeWidth={2.5} />
          </button>

          {/* Maximize */}
          <button
            title={maximized ? "Restore" : "Maximize"}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleMaximize}
            style={{
              width: 19,
              height: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(180deg, #5c5c5c 0%, #464646 100%)",
              border: "1px solid #222",
              borderTop: "1px solid rgba(255,255,255,0.18)",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <Square size={8} color="#d0d0d0" strokeWidth={2} />
          </button>

          {/* Close */}
          <button
            title="Close"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            style={{
              width: 19,
              height: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(180deg, #c0392b 0%, #96281b 100%)",
              border: "1px solid #6e1a12",
              borderTop: "1px solid rgba(255,130,120,0.3)",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <X size={9} color="#ffffff" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        style={{ flex: 1, overflow: "auto", position: "relative", cursor: "auto" }}
      >
        {children}
      </div>
    </motion.div>
  );
}
