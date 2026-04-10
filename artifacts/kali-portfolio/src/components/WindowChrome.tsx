import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X, Minus, Square } from "lucide-react";
import { Rnd } from "react-rnd";

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
  defaultMaximized?: boolean;
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
  defaultMaximized = false,
}: WindowChromeProps) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth < 768
  );

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const defaultX =
    initialX ??
    (typeof window !== "undefined"
      ? Math.max(0, window.innerWidth / 2 - width / 2)
      : 100);
  const defaultY =
    initialY ??
    (typeof window !== "undefined"
      ? Math.max(0, window.innerHeight / 2 - height / 2)
      : 100);

  const [bounds, setBounds] = useState({
    x: defaultX,
    y: defaultY,
    w: width,
    h: height,
  });
  const [maximized, setMaximized] = useState(defaultMaximized || isMobile);
  const [hoverBtn, setHoverBtn] = useState<"min" | "max" | "close" | null>(null);
  const preMaxBounds = useRef(bounds);

  useEffect(() => {
    if (isMobile) setMaximized(true);
  }, [isMobile]);

  const shouldMaximize = maximized || isMobile;

  const handleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMobile) return;
    if (!maximized) {
      preMaxBounds.current = bounds;
      setMaximized(true);
    } else {
      setBounds(preMaxBounds.current);
      setMaximized(false);
    }
  };

  const titleBarBg = isActive
    ? "linear-gradient(180deg, rgba(60,60,70,0.92) 0%, rgba(38,38,48,0.96) 100%)"
    : "linear-gradient(180deg, rgba(38,38,45,0.92) 0%, rgba(26,26,32,0.96) 100%)";

  const windowBorder = isActive
    ? "1px solid rgba(0,163,255,0.35)"
    : "1px solid rgba(255,255,255,0.08)";

  const windowShadow = isActive
    ? "0 24px 60px rgba(0,0,0,0.9), 0 0 0 1px rgba(0,163,255,0.1), inset 0 1px 0 rgba(255,255,255,0.06)"
    : "0 12px 40px rgba(0,0,0,0.75)";

  const titleBar = (
    <div
      className="window-title-bar"
      onDoubleClick={handleMaximize}
      style={{
        height: 28,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        background: titleBarBg,
        borderBottom: "1px solid rgba(0,0,0,0.6)",
        backdropFilter: "blur(12px)",
        cursor: shouldMaximize ? "default" : "move",
        WebkitAppRegion: "drag",
      } as React.CSSProperties}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 10, flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: 13, height: 13, flexShrink: 0,
            background: isActive ? "#00a3ff" : "#555",
            clipPath: "polygon(0 0, 100% 0, 100% 70%, 70% 100%, 0 100%)",
            transition: "background 0.2s",
          }}
        />
        <span
          style={{
            color: isActive ? "#ffffff" : "#888888",
            fontSize: 11, fontWeight: 400, letterSpacing: "0.01em",
            lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis",
            whiteSpace: "nowrap", fontFamily: "'Ubuntu', sans-serif",
            transition: "color 0.2s",
          }}
        >
          {title}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", paddingRight: 5, gap: 2, flexShrink: 0 }}>
        {!isMobile && (
          <button
            title="Minimize"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
            onMouseEnter={() => setHoverBtn("min")}
            onMouseLeave={() => setHoverBtn(null)}
            style={{
              width: 20, height: 18, display: "flex", alignItems: "center", justifyContent: "center",
              background: hoverBtn === "min"
                ? "linear-gradient(180deg, #7a7a5a 0%, #5a5a3a 100%)"
                : "linear-gradient(180deg, #5c5c5c 0%, #464646 100%)",
              border: "1px solid rgba(0,0,0,0.5)", borderTop: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 3, cursor: "pointer", padding: 0, transition: "background 0.12s",
            }}
          >
            <Minus size={9} color={hoverBtn === "min" ? "#ffd080" : "#d0d0d0"} strokeWidth={2.5} />
          </button>
        )}

        {!isMobile && (
          <button
            title={maximized ? "Restore" : "Maximize"}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleMaximize}
            onMouseEnter={() => setHoverBtn("max")}
            onMouseLeave={() => setHoverBtn(null)}
            style={{
              width: 20, height: 18, display: "flex", alignItems: "center", justifyContent: "center",
              background: hoverBtn === "max"
                ? "linear-gradient(180deg, #5a7a5a 0%, #3a5a3a 100%)"
                : "linear-gradient(180deg, #5c5c5c 0%, #464646 100%)",
              border: "1px solid rgba(0,0,0,0.5)", borderTop: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 3, cursor: "pointer", padding: 0, transition: "background 0.12s",
            }}
          >
            <Square size={8} color={hoverBtn === "max" ? "#80e080" : "#d0d0d0"} strokeWidth={2} />
          </button>
        )}

        <button
          title="Close"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          onMouseEnter={() => setHoverBtn("close")}
          onMouseLeave={() => setHoverBtn(null)}
          style={{
            width: isMobile ? 28 : 20, height: isMobile ? 22 : 18,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: hoverBtn === "close"
              ? "linear-gradient(180deg, #e03b2b 0%, #b02010 100%)"
              : "linear-gradient(180deg, #c0392b 0%, #96281b 100%)",
            border: "1px solid #6e1a12", borderTop: "1px solid rgba(255,130,120,0.25)",
            borderRadius: 3, cursor: "pointer", padding: 0, transition: "background 0.12s",
            boxShadow: hoverBtn === "close" ? "0 0 8px rgba(220,40,40,0.5)" : "none",
          }}
        >
          <X size={isMobile ? 11 : 9} color="#ffffff" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );

  const contentArea = (
    <div className="w-full h-full flex flex-col flex-1 overflow-hidden">
      {children}
    </div>
  );

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0, filter: "blur(4px)" }}
      animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
      exit={{ scale: 0.82, opacity: 0, filter: "blur(6px)" }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex }}
    >
      {shouldMaximize ? (
        /* ── MAXIMIZED: bypass Rnd entirely, lock to all 4 corners ── */
        <div
          className="absolute inset-0 w-full h-full flex flex-col overflow-hidden"
          style={{
            border: windowBorder,
            pointerEvents: "auto",
          }}
          onMouseDown={onFocus}
          onTouchStart={onFocus}
        >
          {titleBar}
          {contentArea}
        </div>
      ) : (
        /* ── FREE FLOAT: use Rnd for drag/resize ── */
        <Rnd
          size={{ width: bounds.w, height: bounds.h }}
          position={{ x: bounds.x, y: bounds.y }}
          onDragStop={(_, d) => setBounds((prev) => ({ ...prev, x: d.x, y: d.y }))}
          onResizeStop={(_, __, ref, ___, pos) => {
            setBounds({ x: pos.x, y: pos.y, w: ref.offsetWidth, h: ref.offsetHeight });
          }}
          dragHandleClassName="window-title-bar"
          disableDragging={false}
          enableResizing={true}
          cancel="button,a,input,select,textarea"
          bounds="parent"
          minWidth={300}
          minHeight={200}
          style={{
            display: "flex", flexDirection: "column",
            borderRadius: 7, overflow: "hidden",
            border: windowBorder, boxShadow: windowShadow,
            pointerEvents: "auto",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
          onMouseDown={onFocus}
          onTouchStart={onFocus}
        >
          {titleBar}
          {contentArea}
        </Rnd>
      )}
    </motion.div>
  );
}
