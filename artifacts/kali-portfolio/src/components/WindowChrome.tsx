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
    x: initialX ?? (typeof window !== "undefined" ? window.innerWidth / 2 - width / 2 : 100),
    y: initialY ?? (typeof window !== "undefined" ? window.innerHeight / 2 - height / 2 : 100),
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      let newX = e.clientX - dragOffset.current.x;
      let newY = e.clientY - dragOffset.current.y;

      const maxX = window.innerWidth - width;
      const maxY = window.innerHeight - height;

      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(30, Math.min(newY, maxY));

      setPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, width, height]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
    onFocus();
  };

  const windowStyle: React.CSSProperties = {
    position: "absolute",
    left: pos.x,
    top: pos.y,
    width,
    height,
    zIndex: isActive ? 50 : 40,
    display: "flex",
    flexDirection: "column",
    userSelect: "none",
    border: isActive ? "1px solid rgba(0,163,255,0.35)" : "1px solid rgba(255,255,255,0.10)",
    boxShadow: isActive
      ? "0 8px 40px rgba(0,0,0,0.85), 0 0 0 1px rgba(0,163,255,0.1)"
      : "0 8px 32px rgba(0,0,0,0.7)",
  };

  return (
    <motion.div
      initial={{ scale: 0.97, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.97, opacity: 0 }}
      transition={{ duration: 0.12 }}
      style={windowStyle}
      onClick={onFocus}
    >
      {/* XFCE Kali title bar */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          height: 26,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          background: isActive
            ? "linear-gradient(180deg, #3e3e3e 0%, #2c2c2c 100%)"
            : "linear-gradient(180deg, #2e2e2e 0%, #222222 100%)",
          borderBottom: "1px solid rgba(0,0,0,0.7)",
          cursor: "move",
        }}
      >
        {/* Window icon + Title on LEFT */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 8, flex: 1, minWidth: 0 }}>
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

        {/* XFCE-style window buttons on RIGHT: minimize | maximize | close */}
        <div style={{ display: "flex", alignItems: "center", paddingRight: 4, gap: 1, flexShrink: 0 }}>
          {/* Minimize */}
          <button
            title="Minimize"
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
            title="Maximize"
            onClick={(e) => { e.stopPropagation(); }}
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

          {/* Close — red tinted like Kali XFCE */}
          <button
            title="Close"
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

      {/* Content area */}
      <div style={{ flex: 1, overflow: "auto", position: "relative", cursor: "auto" }}>
        {children}
      </div>
    </motion.div>
  );
}
