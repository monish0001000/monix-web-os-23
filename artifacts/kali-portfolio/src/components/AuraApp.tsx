import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MoreVertical, Sparkles } from "lucide-react";
import WindowChrome from "./WindowChrome";
import entryImg from "@assets/entry_1775232118123.webp";

interface AuraAppProps {
  onClose: () => void;
  onMinimize: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
}

type View = "chat" | "about";

interface Message {
  role: "user" | "aura";
  text: string;
}

export default function AuraApp({
  onClose,
  onMinimize,
  isActive,
  onFocus,
  initialX,
  initialY,
  zIndex,
}: AuraAppProps) {
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [activeView, setActiveView] = useState<View>("chat");
  const [menuOpen, setMenuOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "aura", text: "Hello. I'm AURA, your next-gen system intelligence. How can I assist you today?" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Splash fade-out sequence
  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashFading(true);
      setTimeout(() => setShowSplash(false), 600);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || typing) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setTyping(true);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setTimeout(() => {
        setTyping(false);
        setMessages((prev) => [
          ...prev,
          { role: "aura", text: "⚠ No API key configured. Please set VITE_GEMINI_API_KEY to enable live responses." },
        ]);
      }, 800);
      return;
    }

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text }] }] }),
        }
      );
      const data = await res.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "I didn't receive a valid response. Please try again.";
      setMessages((prev) => [...prev, { role: "aura", text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "aura", text: "⚠ Connection error. Unable to reach the AI backend." },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <WindowChrome
      title="AURA AI — System Intelligence"
      onClose={onClose}
      onMinimize={onMinimize}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX}
      initialY={initialY}
      width={760}
      height={540}
      zIndex={zIndex}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(160deg, #0d0520 0%, #0a0318 60%, #060010 100%)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
          fontFamily: "'Ubuntu', 'Segoe UI', sans-serif",
        }}
      >
        {/* ── Ambient glow orbs ── */}
        <div style={{
          position: "absolute", top: -60, left: "30%",
          width: 300, height: 300,
          background: "radial-gradient(circle, rgba(147,51,234,0.18) 0%, transparent 70%)",
          pointerEvents: "none", zIndex: 0,
        }} />
        <div style={{
          position: "absolute", bottom: -40, right: "10%",
          width: 200, height: 200,
          background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
          pointerEvents: "none", zIndex: 0,
        }} />

        {/* ── Splash Screen ── */}
        <AnimatePresence>
          {showSplash && (
            <div
              style={{
                position: "absolute", inset: 0, zIndex: 50,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "#000",
                opacity: splashFading ? 0 : 1,
                transition: "opacity 0.6s ease",
              }}
            >
              <img
                src={entryImg}
                alt="AURA splash"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  display: "block",
                }}
                draggable={false}
              />
            </div>
          )}
        </AnimatePresence>

        {/* ── App Header ── */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            background: "rgba(88,28,135,0.15)",
            borderBottom: "1px solid rgba(147,51,234,0.25)",
            backdropFilter: "blur(10px)",
            position: "relative",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 14px rgba(168,85,247,0.6)",
              flexShrink: 0,
            }}>
              <Sparkles size={14} color="#fff" strokeWidth={2} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#e9d5ff", letterSpacing: "0.08em" }}>
              AURA AI <span style={{ fontWeight: 400, color: "rgba(216,180,254,0.6)", fontSize: 11 }}>Mode</span>
            </span>
          </div>

          {/* 3-dot menu */}
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              style={{
                width: 28, height: 28,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: menuOpen ? "rgba(147,51,234,0.25)" : "rgba(255,255,255,0.06)",
                border: "1px solid rgba(147,51,234,0.3)",
                borderRadius: 6, cursor: "pointer", color: "#d8b4fe",
                transition: "background 0.15s",
              }}
            >
              <MoreVertical size={14} strokeWidth={2} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.12 }}
                  style={{
                    position: "absolute", top: 34, right: 0,
                    background: "rgba(15,5,35,0.97)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(147,51,234,0.35)",
                    borderRadius: 8,
                    overflow: "hidden",
                    zIndex: 100,
                    minWidth: 120,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.8), 0 0 0 1px rgba(147,51,234,0.15)",
                  }}
                >
                  {(["chat", "about"] as View[]).map((v) => (
                    <button
                      key={v}
                      onClick={() => { setActiveView(v); setMenuOpen(false); }}
                      style={{
                        display: "flex", alignItems: "center", width: "100%",
                        padding: "9px 14px",
                        background: activeView === v ? "rgba(147,51,234,0.2)" : "transparent",
                        border: "none", cursor: "pointer", textAlign: "left",
                        fontSize: 12, color: activeView === v ? "#e9d5ff" : "rgba(255,255,255,0.65)",
                        fontWeight: activeView === v ? 600 : 400,
                        borderLeft: activeView === v ? "2px solid #a855f7" : "2px solid transparent",
                        letterSpacing: "0.04em",
                        transition: "background 0.1s",
                        textTransform: "capitalize",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(147,51,234,0.15)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = activeView === v ? "rgba(147,51,234,0.2)" : "transparent"; }}
                    >
                      {v === "chat" ? "💬 Chat" : "ℹ About"}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Content Area ── */}
        <div style={{ flex: 1, overflow: "hidden", position: "relative", zIndex: 5 }}>
          <AnimatePresence mode="wait">
            {activeView === "about" ? (
              <motion.div
                key="about"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                style={{
                  height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                  padding: 32,
                }}
              >
                <div
                  style={{
                    maxWidth: 480,
                    background: "rgba(88,28,135,0.15)",
                    border: "1px solid rgba(147,51,234,0.3)",
                    borderRadius: 16,
                    padding: "32px 36px",
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 0 40px rgba(147,51,234,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
                    textAlign: "center",
                  }}
                >
                  <div style={{
                    width: 56, height: 56, borderRadius: "50%",
                    background: "linear-gradient(135deg, #6d28d9, #a855f7)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 20px",
                    boxShadow: "0 0 24px rgba(168,85,247,0.5)",
                  }}>
                    <Sparkles size={24} color="#fff" />
                  </div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "#e9d5ff", marginBottom: 8, letterSpacing: "0.06em" }}>
                    AURA AI
                  </h2>
                  <p style={{ fontSize: 12, color: "rgba(216,180,254,0.6)", marginBottom: 20, letterSpacing: "0.04em" }}>
                    The Next-Gen System Intelligence
                  </p>
                  <div style={{
                    height: 1,
                    background: "linear-gradient(90deg, transparent, rgba(147,51,234,0.5), transparent)",
                    marginBottom: 20,
                  }} />
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.8 }}>
                    AURA AI: The Next-Gen System Intelligence.
                  </p>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.8, marginTop: 12 }}>
                    Developed and Engineered by{" "}
                    <span style={{ color: "#c084fc", fontWeight: 600 }}>MONISH</span>.
                  </p>
                  <div style={{
                    marginTop: 24, padding: "8px 16px",
                    background: "rgba(147,51,234,0.12)",
                    border: "1px solid rgba(147,51,234,0.25)",
                    borderRadius: 8,
                    fontSize: 11,
                    color: "rgba(216,180,254,0.5)",
                    letterSpacing: "0.06em",
                  }}>
                    MONIX OS · Core Module
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                style={{ height: "100%", display: "flex", flexDirection: "column" }}
              >
                {/* Messages */}
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "16px 16px 8px",
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(147,51,234,0.3) transparent",
                  }}
                >
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                        marginBottom: 12,
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      {msg.role === "aura" && (
                        <div style={{
                          width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                          background: "linear-gradient(135deg, #6d28d9, #a855f7)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          boxShadow: "0 0 8px rgba(168,85,247,0.5)",
                          marginTop: 2,
                        }}>
                          <Sparkles size={11} color="#fff" />
                        </div>
                      )}
                      <div
                        style={{
                          maxWidth: "72%",
                          padding: "10px 14px",
                          borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                          fontSize: 13,
                          lineHeight: 1.6,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          ...(msg.role === "user"
                            ? {
                                background: "rgba(71,85,105,0.55)",
                                border: "1px solid rgba(100,116,139,0.35)",
                                color: "rgba(255,255,255,0.85)",
                              }
                            : {
                                background: "rgba(88,28,135,0.35)",
                                border: "1px solid rgba(147,51,234,0.35)",
                                color: "#e9d5ff",
                                boxShadow: "0 0 12px rgba(147,51,234,0.12)",
                              }),
                        }}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {typing && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                        background: "linear-gradient(135deg, #6d28d9, #a855f7)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 0 8px rgba(168,85,247,0.5)",
                      }}>
                        <Sparkles size={11} color="#fff" />
                      </div>
                      <div style={{
                        padding: "10px 16px",
                        background: "rgba(88,28,135,0.35)",
                        border: "1px solid rgba(147,51,234,0.35)",
                        borderRadius: "14px 14px 14px 4px",
                        display: "flex", alignItems: "center", gap: 4,
                      }}>
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                            style={{ width: 6, height: 6, borderRadius: "50%", background: "#a855f7" }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input area */}
                <div
                  style={{
                    flexShrink: 0,
                    padding: "10px 14px 14px",
                    background: "rgba(15,5,35,0.5)",
                    borderTop: "1px solid rgba(147,51,234,0.15)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "rgba(30,10,60,0.8)",
                      border: "1px solid rgba(147,51,234,0.4)",
                      borderRadius: 24,
                      padding: "6px 8px 6px 16px",
                      boxShadow: "0 0 20px rgba(147,51,234,0.1), inset 0 1px 0 rgba(255,255,255,0.04)",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                    }}
                    onFocusCapture={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(168,85,247,0.7)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 0 24px rgba(147,51,234,0.2), inset 0 1px 0 rgba(255,255,255,0.04)";
                    }}
                    onBlurCapture={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(147,51,234,0.4)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(147,51,234,0.1), inset 0 1px 0 rgba(255,255,255,0.04)";
                    }}
                  >
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask AURA anything…"
                      disabled={typing}
                      style={{
                        flex: 1,
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        fontSize: 13,
                        color: "rgba(255,255,255,0.9)",
                        caretColor: "#a855f7",
                        fontFamily: "inherit",
                      }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || typing}
                      style={{
                        width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: input.trim() && !typing
                          ? "linear-gradient(135deg, #7c3aed, #a855f7)"
                          : "rgba(147,51,234,0.15)",
                        border: "1px solid rgba(147,51,234,0.35)",
                        cursor: input.trim() && !typing ? "pointer" : "default",
                        transition: "all 0.2s",
                        boxShadow: input.trim() && !typing ? "0 0 14px rgba(168,85,247,0.5)" : "none",
                      }}
                    >
                      <Send size={14} color={input.trim() && !typing ? "#fff" : "rgba(255,255,255,0.3)"} strokeWidth={2} />
                    </button>
                  </div>
                  <p style={{ fontSize: 9.5, color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: 7, letterSpacing: "0.04em" }}>
                    AURA · Powered by Gemini · MONIX OS
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </WindowChrome>
  );
}
