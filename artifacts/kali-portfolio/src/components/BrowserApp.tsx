import { useState, useRef, useCallback, KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight, RotateCw, Globe, X } from "lucide-react";
import WindowChrome from "./WindowChrome";

interface BrowserAppProps {
  onClose: () => void;
  onMinimize: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
}

const HOME_URL = "https://duckduckgo.com/?kae=d&k1=-1";

function resolveUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return HOME_URL;
  const looksLikeUrl =
    /^https?:\/\//i.test(trimmed) ||
    (/\.[a-z]{2,}(\/|$)/i.test(trimmed) && !trimmed.includes(" "));
  if (looksLikeUrl) {
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  }
  return `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}&kp=-2`;
}

export default function BrowserApp({
  onClose,
  onMinimize,
  isActive,
  onFocus,
  initialX,
  initialY,
  zIndex,
}: BrowserAppProps) {
  const [currentUrl, setCurrentUrl] = useState(HOME_URL);
  const [inputValue, setInputValue] = useState(HOME_URL);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const historyRef = useRef<string[]>([HOME_URL]);
  const historyIndexRef = useRef(0);

  const navigate = useCallback((url: string) => {
    const resolved = resolveUrl(url);
    const idx = historyIndexRef.current;
    historyRef.current = [...historyRef.current.slice(0, idx + 1), resolved];
    historyIndexRef.current = historyRef.current.length - 1;
    setCurrentUrl(resolved);
    setInputValue(resolved);
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  const goBack = useCallback(() => {
    const idx = historyIndexRef.current;
    if (idx > 0) {
      historyIndexRef.current = idx - 1;
      const url = historyRef.current[historyIndexRef.current];
      setCurrentUrl(url);
      setInputValue(url);
      setLoading(true);
      setReloadKey((k) => k + 1);
    }
  }, []);

  const goForward = useCallback(() => {
    const idx = historyIndexRef.current;
    if (idx < historyRef.current.length - 1) {
      historyIndexRef.current = idx + 1;
      const url = historyRef.current[historyIndexRef.current];
      setCurrentUrl(url);
      setInputValue(url);
      setLoading(true);
      setReloadKey((k) => k + 1);
    }
  }, []);

  const reload = useCallback(() => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") navigate(inputValue);
    if (e.key === "Escape") setInputValue(currentUrl);
  };

  const canBack = historyIndexRef.current > 0;
  const canForward = historyIndexRef.current < historyRef.current.length - 1;

  const navBtnStyle = (enabled: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    borderRadius: 6,
    border: "none",
    background: "transparent",
    cursor: enabled ? "pointer" : "default",
    color: enabled ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)",
    transition: "background 0.12s",
    flexShrink: 0,
  });

  return (
    <WindowChrome
      title="Web Browser"
      onClose={onClose}
      onMinimize={onMinimize}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX}
      initialY={initialY}
      width={960}
      height={620}
      zIndex={zIndex}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "#12121a",
          overflow: "hidden",
        }}
      >
        {/* Navigation Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 10px",
            background: "#0e0e18",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            flexShrink: 0,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Back */}
          <button
            style={navBtnStyle(canBack)}
            onClick={goBack}
            title="Back"
            onMouseEnter={(e) => {
              if (canBack) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
            }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <ChevronLeft size={16} />
          </button>

          {/* Forward */}
          <button
            style={navBtnStyle(canForward)}
            onClick={goForward}
            title="Forward"
            onMouseEnter={(e) => {
              if (canForward) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
            }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <ChevronRight size={16} />
          </button>

          {/* Reload */}
          <button
            style={{ ...navBtnStyle(true), marginRight: 4 }}
            onClick={reload}
            title="Reload"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <RotateCw
              size={14}
              style={{
                transition: "transform 0.4s",
                animation: loading ? "spin 0.8s linear infinite" : "none",
              }}
            />
          </button>

          {/* URL Bar */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: "0 10px",
              height: 30,
              transition: "border-color 0.15s",
            }}
            onFocus={() => {}}
          >
            <Globe size={12} color="rgba(255,255,255,0.35)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={(e) => {
                e.currentTarget.select();
                (e.currentTarget.parentElement as HTMLElement).style.borderColor = "rgba(54,123,240,0.6)";
              }}
              onBlur={(e) => {
                (e.currentTarget.parentElement as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
                setInputValue(currentUrl);
              }}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "rgba(255,255,255,0.9)",
                fontSize: 12,
                fontFamily: "'Ubuntu Mono', 'Consolas', monospace",
                letterSpacing: "0.01em",
              }}
              placeholder="Search or enter URL…"
              spellCheck={false}
              autoComplete="off"
            />
            {inputValue && inputValue !== currentUrl && (
              <button
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 0, display: "flex" }}
                onMouseDown={() => setInputValue(currentUrl)}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Iframe viewport */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {loading && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "#0d0d18",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
                zIndex: 2,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  border: "3px solid rgba(54,123,240,0.2)",
                  borderTop: "3px solid #367BF0",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "'Ubuntu', sans-serif" }}>
                Loading…
              </span>
            </div>
          )}

          <iframe
            key={reloadKey}
            ref={iframeRef}
            src={currentUrl}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
            title="Browser"
            onLoad={() => setLoading(false)}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              display: "block",
              opacity: loading ? 0 : 1,
              transition: "opacity 0.25s",
              background: "#fff",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </WindowChrome>
  );
}
