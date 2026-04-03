import { useState, useRef, useCallback, KeyboardEvent, useEffect } from "react";
import {
  ChevronLeft, ChevronRight, RotateCw, Lock, Star,
  Puzzle, Plus, X, Search
} from "lucide-react";
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

interface Tab {
  id: string;
  title: string;
  url: string;
  loading: boolean;
  reloadKey: number;
}

const NEW_TAB_URL = "monix://newtab";
const DDG = (q: string) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}&kp=-2`;

const BOOKMARKS = [
  { label: "GitHub", url: "https://github.com/monishpkp" },
  { label: "Portfolio", url: "https://monishsrmportfolio.netlify.app" },
  { label: "YouTube", url: "https://youtube.com" },
  { label: "DuckDuckGo", url: "https://duckduckgo.com" },
  { label: "HackerNews", url: "https://news.ycombinator.com" },
];

function resolveUrl(input: string): string {
  const t = input.trim();
  if (!t || t === NEW_TAB_URL) return NEW_TAB_URL;
  if (/^https?:\/\//i.test(t)) return t;
  if (/^[a-z0-9-]+:\/\//i.test(t)) return NEW_TAB_URL;
  const looksLikeUrl = /\.[a-z]{2,}(\/|$)/i.test(t) && !t.includes(" ");
  return looksLikeUrl ? `https://${t}` : DDG(t);
}

let tabCounter = 1;
function makeTab(url: string = NEW_TAB_URL): Tab {
  return {
    id: `tab-${++tabCounter}`,
    title: url === NEW_TAB_URL ? "New Tab" : url,
    url,
    loading: url !== NEW_TAB_URL,
    reloadKey: 0,
  };
}

function NewTabPage({ onSearch }: { onSearch: (query: string) => void }) {
  const [q, setQ] = useState("");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleSearch = () => {
    if (q.trim()) onSearch(q.trim());
  };

  const hour = time.getHours().toString().padStart(2, "0");
  const min = time.getMinutes().toString().padStart(2, "0");
  const dateStr = time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(160deg, #0a0a14 0%, #0d1a2e 50%, #080810 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        fontFamily: "'Ubuntu', sans-serif",
        userSelect: "none",
      }}
    >
      {/* Clock */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 64, fontWeight: 200, color: "rgba(255,255,255,0.92)", letterSpacing: "-3px", lineHeight: 1 }}>
          {hour}:{min}
        </div>
        <div style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
          {dateStr}
        </div>
      </div>

      {/* MONIX logo */}
      <div style={{ margin: "28px 0 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
          <svg viewBox="0 0 48 48" width="40" height="40" fill="none">
            <rect width="48" height="48" rx="10" fill="rgba(54,123,240,0.15)" stroke="rgba(54,123,240,0.4)" strokeWidth="1"/>
            <text x="24" y="33" textAnchor="middle" fontSize="24" fontWeight="700" fill="#367BF0" fontFamily="monospace">M</text>
          </svg>
          <span style={{ fontSize: 28, fontWeight: 700, color: "rgba(255,255,255,0.9)", letterSpacing: "-0.5px" }}>
            MONIX<span style={{ color: "#367BF0" }}>OS</span>
          </span>
        </div>
      </div>

      {/* Search bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 28,
          padding: "10px 20px",
          width: 560,
          maxWidth: "80%",
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
          transition: "border-color 0.15s",
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(54,123,240,0.5)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
      >
        <Search size={16} color="rgba(255,255,255,0.4)" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search with DuckDuckGo or enter a URL…"
          autoFocus
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: 14,
            color: "rgba(255,255,255,0.85)",
            fontFamily: "'Ubuntu', sans-serif",
          }}
        />
        {q && (
          <button
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", padding: 0 }}
            onClick={() => setQ("")}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Quick links */}
      <div style={{ display: "flex", gap: 16, marginTop: 40 }}>
        {BOOKMARKS.map((b) => (
          <button
            key={b.label}
            onClick={() => onSearch(b.url)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              padding: "10px 12px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 10,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "rgba(54,123,240,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                color: "#90bfff",
                fontWeight: 700,
              }}
            >
              {b.label[0]}
            </div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", whiteSpace: "nowrap" }}>
              {b.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function BrowserApp({
  onClose, onMinimize, isActive, onFocus, initialX, initialY, zIndex,
}: BrowserAppProps) {
  const [tabs, setTabs] = useState<Tab[]>([makeTab(NEW_TAB_URL)]);
  const [activeTabId, setActiveTabId] = useState(() => tabs[0].id);
  const [urlInput, setUrlInput] = useState(NEW_TAB_URL);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  useEffect(() => {
    setUrlInput(activeTab.url === NEW_TAB_URL ? "" : activeTab.url);
  }, [activeTabId, activeTab.url]);

  const updateTab = useCallback((id: string, patch: Partial<Tab>) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const navigateTo = useCallback((rawUrl: string, tabId?: string) => {
    const id = tabId ?? activeTabId;
    const url = resolveUrl(rawUrl);
    setTabs((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, url, title: url === NEW_TAB_URL ? "New Tab" : rawUrl, loading: url !== NEW_TAB_URL, reloadKey: t.reloadKey + 1 }
          : t
      )
    );
    setUrlInput(url === NEW_TAB_URL ? "" : url);
  }, [activeTabId]);

  const addTab = useCallback(() => {
    const tab = makeTab(NEW_TAB_URL);
    setTabs((prev) => [...prev, tab]);
    setActiveTabId(tab.id);
    setUrlInput("");
  }, []);

  const closeTab = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTabs((prev) => {
      if (prev.length === 1) return [makeTab(NEW_TAB_URL)];
      const next = prev.filter((t) => t.id !== id);
      if (id === activeTabId) {
        const idx = prev.findIndex((t) => t.id === id);
        const newActive = next[Math.min(idx, next.length - 1)];
        setActiveTabId(newActive.id);
        setUrlInput(newActive.url === NEW_TAB_URL ? "" : newActive.url);
      }
      return next;
    });
  }, [activeTabId]);

  const handleUrlKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") navigateTo(urlInput);
    if (e.key === "Escape") setUrlInput(activeTab.url === NEW_TAB_URL ? "" : activeTab.url);
  };

  const reload = () => {
    if (activeTab.url !== NEW_TAB_URL) {
      updateTab(activeTab.id, { loading: true, reloadKey: activeTab.reloadKey + 1 });
    }
  };

  const isNewTab = activeTab.url === NEW_TAB_URL;

  const chromeBtn = (enabled = true): React.CSSProperties => ({
    width: 30,
    height: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    border: "none",
    background: "transparent",
    cursor: enabled ? "pointer" : "default",
    color: enabled ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.22)",
    transition: "background 0.12s",
    flexShrink: 0,
  });

  const isHttps = activeTab.url.startsWith("https://");
  const isHttp = activeTab.url.startsWith("http://");

  return (
    <WindowChrome
      title={activeTab.title}
      onClose={onClose}
      onMinimize={onMinimize}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX}
      initialY={initialY}
      width={1000}
      height={660}
      zIndex={zIndex}
    >
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#202124", overflow: "hidden" }}>

        {/* ── ROW 1: Tab Bar ── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            background: "#1a1a1f",
            height: 36,
            flexShrink: 0,
            paddingLeft: 4,
            paddingRight: 4,
            gap: 1,
            borderBottom: "1px solid rgba(0,0,0,0.4)",
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => { setActiveTabId(tab.id); setUrlInput(tab.url === NEW_TAB_URL ? "" : tab.url); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  height: 30,
                  minWidth: 140,
                  maxWidth: 220,
                  flex: "0 1 200px",
                  padding: "0 8px 0 10px",
                  borderRadius: "6px 6px 0 0",
                  cursor: "pointer",
                  background: isActive ? "#202124" : "transparent",
                  borderTop: isActive ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
                  borderLeft: isActive ? "1px solid rgba(255,255,255,0.07)" : "1px solid transparent",
                  borderRight: isActive ? "1px solid rgba(255,255,255,0.07)" : "1px solid transparent",
                  transition: "background 0.1s",
                  position: "relative",
                  alignSelf: "flex-end",
                  marginBottom: -1,
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                {/* Tab loading indicator or favicon */}
                <div style={{ width: 14, height: 14, flexShrink: 0 }}>
                  {tab.loading ? (
                    <div style={{
                      width: 12, height: 12, border: "2px solid rgba(255,255,255,0.2)",
                      borderTop: "2px solid #90bfff", borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }} />
                  ) : (
                    <svg viewBox="0 0 14 14" width="14" height="14" fill="none">
                      <circle cx="7" cy="7" r="6" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
                      <ellipse cx="7" cy="7" rx="3" ry="6" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8"/>
                      <line x1="1" y1="7" x2="13" y2="7" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8"/>
                    </svg>
                  )}
                </div>

                {/* Title */}
                <span style={{
                  flex: 1,
                  fontSize: 11,
                  color: isActive ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.5)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontFamily: "'Ubuntu', sans-serif",
                }}>
                  {tab.url === NEW_TAB_URL ? "New Tab" : tab.title.replace(/^https?:\/\//, "").split("/")[0]}
                </span>

                {/* Close button */}
                <button
                  onClick={(e) => closeTab(tab.id, e)}
                  style={{
                    width: 16, height: 16, borderRadius: "50%", border: "none",
                    background: "transparent", cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    color: "rgba(255,255,255,0.5)", flexShrink: 0, padding: 0,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.15)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <X size={10} />
                </button>
              </div>
            );
          })}

          {/* New Tab button */}
          <button
            onClick={addTab}
            style={{
              width: 28, height: 28, borderRadius: "50%", border: "none",
              background: "transparent", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
              color: "rgba(255,255,255,0.45)", flexShrink: 0, alignSelf: "center",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            title="New tab"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* ── ROW 2: Toolbar ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            height: 44,
            padding: "0 8px",
            background: "#202124",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            flexShrink: 0,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Back */}
          <button
            style={chromeBtn(true)}
            title="Back"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <ChevronLeft size={18} />
          </button>

          {/* Forward */}
          <button
            style={chromeBtn(false)}
            title="Forward"
          >
            <ChevronRight size={18} />
          </button>

          {/* Reload */}
          <button
            style={chromeBtn(!isNewTab)}
            onClick={reload}
            title="Reload"
            onMouseEnter={(e) => { if (!isNewTab) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <RotateCw
              size={16}
              style={{ animation: activeTab.loading ? "spin 0.8s linear infinite" : "none" }}
            />
          </button>

          {/* URL Bar */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
              height: 32,
              background: "#303134",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 20,
              padding: "0 12px",
              transition: "border-color 0.15s, background 0.15s",
              cursor: "text",
            }}
            onFocus={(e) => {
              e.currentTarget.style.background = "#3c4043";
              e.currentTarget.style.borderColor = "rgba(138,180,248,0.4)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.background = "#303134";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
            }}
          >
            {/* Lock / security icon */}
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
              {isHttps ? (
                <Lock size={12} color="#8ab4f8" />
              ) : isHttp ? (
                <svg viewBox="0 0 14 14" width="12" height="12" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="#f28b82" strokeWidth="1.5"/>
                  <line x1="7" y1="4" x2="7" y2="8" stroke="#f28b82" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="7" cy="10" r="0.8" fill="#f28b82"/>
                </svg>
              ) : (
                <svg viewBox="0 0 14 14" width="12" height="12" fill="none">
                  <circle cx="7" cy="7" r="5.5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                  <ellipse cx="7" cy="7" rx="2.5" ry="5.5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
                  <line x1="1.5" y1="7" x2="12.5" y2="7" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
                </svg>
              )}
            </div>

            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={handleUrlKeyDown}
              onFocus={(e) => {
                e.currentTarget.select();
                (e.currentTarget.closest("div") as HTMLElement)?.dispatchEvent(new Event("focus", { bubbles: true }));
              }}
              onBlur={() => setUrlInput(activeTab.url === NEW_TAB_URL ? "" : activeTab.url)}
              placeholder="Search or enter URL"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 13,
                color: "rgba(255,255,255,0.88)",
                fontFamily: "'Ubuntu', sans-serif",
                letterSpacing: "0.01em",
              }}
              spellCheck={false}
              autoComplete="off"
            />
          </div>

          {/* Right icons */}
          <div style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: 4 }}>
            {/* Star / Bookmark */}
            <button
              style={chromeBtn()}
              title="Bookmark this page"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Star size={16} />
            </button>

            {/* Extensions */}
            <button
              style={chromeBtn()}
              title="Extensions"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Puzzle size={16} />
            </button>

            {/* Profile avatar */}
            <button
              style={{ ...chromeBtn(), borderRadius: "50%", overflow: "hidden", width: 28, height: 28 }}
              title="Profile"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: "linear-gradient(135deg, #1e3a6e, #367BF0)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 700, color: "white",
              }}>
                M
              </div>
            </button>
          </div>
        </div>

        {/* ── ROW 3: Bookmarks Bar ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            height: 28,
            padding: "0 10px",
            background: "#202124",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            flexShrink: 0,
            overflowX: "auto",
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {BOOKMARKS.map((bm) => (
            <button
              key={bm.label}
              onClick={() => navigateTo(bm.url)}
              style={{
                height: 22,
                padding: "0 10px",
                borderRadius: 4,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: 11,
                color: "rgba(255,255,255,0.6)",
                fontFamily: "'Ubuntu', sans-serif",
                whiteSpace: "nowrap",
                transition: "background 0.12s, color 0.12s",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.09)";
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.9)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)";
              }}
            >
              <span style={{ fontSize: 10, opacity: 0.6 }}>⭐</span>
              {bm.label}
            </button>
          ))}
        </div>

        {/* ── Content Area ── */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {isNewTab ? (
            <NewTabPage onSearch={(q) => navigateTo(q)} />
          ) : (
            <>
              {activeTab.loading && (
                <div style={{
                  position: "absolute", inset: 0,
                  background: "#202124",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  gap: 14, zIndex: 2,
                }}>
                  <div style={{
                    width: 32, height: 32,
                    border: "3px solid rgba(54,123,240,0.2)",
                    borderTop: "3px solid #8ab4f8",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }} />
                  <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, fontFamily: "'Ubuntu', sans-serif" }}>
                    Loading…
                  </span>
                </div>
              )}
              <iframe
                key={`${activeTab.id}-${activeTab.reloadKey}`}
                ref={iframeRef}
                src={activeTab.url}
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                title="Browser"
                onLoad={() => {
                  updateTab(activeTab.id, {
                    loading: false,
                    title: activeTab.url,
                  });
                }}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  display: "block",
                  opacity: activeTab.loading ? 0 : 1,
                  transition: "opacity 0.2s",
                  background: "#fff",
                }}
              />
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </WindowChrome>
  );
}
