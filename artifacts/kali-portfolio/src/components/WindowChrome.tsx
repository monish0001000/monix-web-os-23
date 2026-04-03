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
  const [hoverBtn, setHoverBtn] = useState<"min" | "max" | "close" | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const preMaxPos = useRef(pos);

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (maximized) return;
      let newX = e.clientX - dragOffset.current.x;
      let newY = e.clientY - dragOffset.current.y;
      newX = Math.max(0, Math.min(newX, window.innerWidth - width));
      newY = Math.max(6, Math.min(newY, window.innerHeight - height - 36));
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
        top: 0,
        width: "100vw",
        height: "calc(100vh - 36px)",
        zIndex,
        display: "flex",
        flexDirection: "column",
        userSelect: "none",
        border: "none",
        boxShadow: "none",
        borderRadius: 0,
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
        borderRadius: 7,
        overflow: "hidden",
        border: isActive
          ? "1px solid rgba(0,163,255,0.35)"
          : "1px solid rgba(255,255,255,0.08)",
        boxShadow: isActive
          ? "0 24px 60px rgba(0,0,0,0.9), 0 0 0 1px rgba(0,163,255,0.1), inset 0 1px 0 rgba(255,255,255,0.06)"
          : "0 12px 40px rgba(0,0,0,0.75)",
      };

  const titleBarBg = isActive
    ? "linear-gradient(180deg, rgba(60,60,70,0.92) 0%, rgba(38,38,48,0.96) 100%)"
    : "linear-gradient(180deg, rgba(38,38,45,0.92) 0%, rgba(26,26,32,0.96) 100%)";

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0, filter: "blur(4px)" }}
      animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
      exit={{ scale: 0.82, opacity: 0, filter: "blur(6px)" }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      style={windowStyle}
      onMouseDown={onFocus}
    >
      {/* Title bar */}
      <div
        onMouseDown={handleTitleBarMouseDown}
        onDoubleClick={handleMaximize}
        style={{
          height: 28,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          background: titleBarBg,
          borderBottom: "1px solid rgba(0,0,0,0.6)",
          backdropFilter: "blur(12px)",
          cursor: maximized ? "default" : "move",
          WebkitAppRegion: "drag",
        } as React.CSSProperties}
      >
        {/* Icon + Title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            paddingLeft: 10,
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: 13,
              height: 13,
              flexShrink: 0,
              background: isActive ? "#00a3ff" : "#555",
              clipPath: "polygon(0 0, 100% 0, 100% 70%, 70% 100%, 0 100%)",
              transition: "background 0.2s",
            }}
          />
          <span
            style={{
              color: isActive ? "#ffffff" : "#888888",
              fontSize: 11,
              fontWeight: 400,
              letterSpacing: "0.01em",
              lineHeight: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: "'Ubuntu', sans-serif",
              transition: "color 0.2s",
            }}
          >
            {title}
          </span>
        </div>

        {/* Window control buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            paddingRight: 5,
            gap: 2,
            flexShrink: 0,
          }}
        >
          {/* Minimize */}
          <button
            title="Minimize"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
            onMouseEnter={() => setHoverBtn("min")}
            onMouseLeave={() => setHoverBtn(null)}
            style={{
              width: 20,
              height: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                hoverBtn === "min"
                  ? "linear-gradient(180deg, #7a7a5a 0%, #5a5a3a 100%)"
                  : "linear-gradient(180deg, #5c5c5c 0%, #464646 100%)",
              border: "1px solid rgba(0,0,0,0.5)",
              borderTop: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 3,
              cursor: "pointer",
              padding: 0,
              transition: "background 0.12s",
            }}
          >
            <Minus size={9} color={hoverBtn === "min" ? "#ffd080" : "#d0d0d0"} strokeWidth={2.5} />
          </button>

          {/* Maximize */}
          <button
            title={maximized ? "Restore" : "Maximize"}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleMaximize}
            onMouseEnter={() => setHoverBtn("max")}
            onMouseLeave={() => setHoverBtn(null)}
            style={{
              width: 20,
              height: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                hoverBtn === "max"
                  ? "linear-gradient(180deg, #5a7a5a 0%, #3a5a3a 100%)"
                  : "linear-gradient(180deg, #5c5c5c 0%, #464646 100%)",
              border: "1px solid rgba(0,0,0,0.5)",
              borderTop: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 3,
              cursor: "pointer",
              padding: 0,
              transition: "background 0.12s",
            }}
          >
            <Square size={8} color={hoverBtn === "max" ? "#80e080" : "#d0d0d0"} strokeWidth={2} />
          </button>

          {/* Close */}
          <button
            title="Close"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            onMouseEnter={() => setHoverBtn("close")}
            onMouseLeave={() => setHoverBtn(null)}
            style={{
              width: 20,
              height: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                hoverBtn === "close"
                  ? "linear-gradient(180deg, #e03b2b 0%, #b02010 100%)"
                  : "linear-gradient(180deg, #c0392b 0%, #96281b 100%)",
              border: "1px solid #6e1a12",
              borderTop: "1px solid rgba(255,130,120,0.25)",
              borderRadius: 3,
              cursor: "pointer",
              padding: 0,
              transition: "background 0.12s",
              boxShadow: hoverBtn === "close" ? "0 0 8px rgba(220,40,40,0.5)" : "none",
            }}
          >
            <X size={9} color="#ffffff" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Content with glassmorphism */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          position: "relative",
          cursor: "auto",
          background: "rgba(12,12,16,0.88)",
          backdropFilter: "blur(8px)",
        }}
      >
        {children}
      </div>
    </motion.div>
  );
}
