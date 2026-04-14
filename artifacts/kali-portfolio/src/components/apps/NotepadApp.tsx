import { useState, useRef, useEffect, useCallback } from "react";
import { marked } from "marked";
import WindowChrome from "../WindowChrome";

// ── Types ─────────────────────────────────────────────────────────────────────
interface NotepadFile {
  id: string;
  name: string;
  content: string;
  created: number;
  modified: number;
}

interface NotepadPrefs {
  fontSize: number;
  wordWrap: boolean;
  tabSize: 2 | 4;
  showLineNumbers: boolean;
}

interface NotepadSession {
  lastOpenedId: string | null;
}

// ── LocalStorage helpers ──────────────────────────────────────────────────────
const LS_FILES   = "webos_notepad_files";
const LS_PREFS   = "webos_notepad_prefs";
const LS_SESSION = "webos_notepad_session";
const QUOTA_LIMIT = 4.5 * 1024 * 1024; // 4.5 MB

function loadFiles(): Record<string, NotepadFile> {
  try {
    return JSON.parse(localStorage.getItem(LS_FILES) ?? "{}");
  } catch { return {}; }
}

function saveFiles(files: Record<string, NotepadFile>): boolean {
  try {
    const str = JSON.stringify(files);
    if (new Blob([str]).size > QUOTA_LIMIT) return false;
    localStorage.setItem(LS_FILES, str);
    return true;
  } catch { return false; }
}

function loadPrefs(): NotepadPrefs {
  try {
    return { fontSize: 13, wordWrap: true, tabSize: 2, showLineNumbers: true,
      ...JSON.parse(localStorage.getItem(LS_PREFS) ?? "{}") };
  } catch { return { fontSize: 13, wordWrap: true, tabSize: 2, showLineNumbers: true }; }
}

function savePrefs(prefs: NotepadPrefs) {
  localStorage.setItem(LS_PREFS, JSON.stringify(prefs));
}

function loadSession(): NotepadSession {
  try {
    return { lastOpenedId: null, ...JSON.parse(localStorage.getItem(LS_SESSION) ?? "{}") };
  } catch { return { lastOpenedId: null }; }
}

function saveSession(s: NotepadSession) {
  localStorage.setItem(LS_SESSION, JSON.stringify(s));
}

function genId(): string {
  return "np_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
}

function getExt(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "txt";
}

function isMarkdown(name: string): boolean {
  return getExt(name) === "md";
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface NotepadAppProps {
  onClose: () => void;
  onMinimize: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────
interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  onSave?: () => void;
}

function ConfirmDialog({ message, onConfirm, onCancel, onSave }: ConfirmDialogProps) {
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.75)", display: "flex",
      alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#111318", border: "1px solid rgba(0,196,255,0.3)",
        borderRadius: 8, padding: "20px 24px", minWidth: 300, maxWidth: 380,
        boxShadow: "0 0 30px rgba(0,196,255,0.15)",
      }}>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginBottom: 18, lineHeight: 1.6 }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          {onSave && (
            <button onClick={onSave} style={{
              padding: "5px 14px", background: "rgba(0,196,255,0.15)",
              border: "1px solid rgba(0,196,255,0.4)", borderRadius: 4,
              color: "#00c4ff", cursor: "pointer", fontSize: 12, fontFamily: "monospace",
            }}>Save</button>
          )}
          <button onClick={onCancel} style={{
            padding: "5px 14px", background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)", borderRadius: 4,
            color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 12, fontFamily: "monospace",
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            padding: "5px 14px", background: "rgba(255,68,68,0.15)",
            border: "1px solid rgba(255,68,68,0.35)", borderRadius: 4,
            color: "#ff6464", cursor: "pointer", fontSize: 12, fontFamily: "monospace",
          }}>Don't Save</button>
        </div>
      </div>
    </div>
  );
}

// ── Save As Modal ─────────────────────────────────────────────────────────────
interface SaveAsModalProps {
  fileName: string;
  content: string;
  onSaveLocalStorage: (name: string) => void;
  onClose: () => void;
}

function SaveAsModal({ fileName, content, onSaveLocalStorage, onClose }: SaveAsModalProps) {
  const [name, setName] = useState(fileName);

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = name || "untitled.txt";
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.8)", display: "flex",
      alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#0e1015", border: "1px solid rgba(0,196,255,0.3)",
        borderRadius: 8, padding: "22px 26px", minWidth: 360,
        boxShadow: "0 0 40px rgba(0,196,255,0.1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ color: "#00c4ff", fontSize: 12, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.08em" }}>
            SAVE AS
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 16 }}>×</button>
        </div>

        <label style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: 11, fontFamily: "monospace", marginBottom: 6 }}>
          FILE NAME
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: "100%", background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(0,196,255,0.25)", borderRadius: 4,
            color: "#fff", fontSize: 12, padding: "7px 10px",
            fontFamily: "monospace", outline: "none", marginBottom: 18,
            boxSizing: "border-box",
          }}
          onKeyDown={(e) => e.key === "Enter" && onSaveLocalStorage(name)}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={() => onSaveLocalStorage(name)}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
              background: "rgba(0,196,255,0.08)", border: "1px solid rgba(0,196,255,0.25)",
              borderRadius: 6, cursor: "pointer", color: "rgba(255,255,255,0.85)",
              fontSize: 12, fontFamily: "monospace", textAlign: "left",
            }}
          >
            <span style={{ fontSize: 18 }}>💾</span>
            <div>
              <div style={{ fontWeight: 700, color: "#00c4ff" }}>Save to LocalStorage</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Keep in MONIX OS file system</div>
            </div>
          </button>

          <button
            onClick={handleDownload}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
              background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.2)",
              borderRadius: 6, cursor: "pointer", color: "rgba(255,255,255,0.85)",
              fontSize: 12, fontFamily: "monospace", textAlign: "left",
            }}
          >
            <span style={{ fontSize: 18 }}>⬇️</span>
            <div>
              <div style={{ fontWeight: 700, color: "#00ff88" }}>Download to Device</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Save as local file on your system</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Find/Replace Bar ──────────────────────────────────────────────────────────
interface FindBarProps {
  onFind: (term: string) => void;
  onReplace: (find: string, replace: string) => void;
  onClose: () => void;
}

function FindBar({ onFind, onReplace, onClose }: FindBarProps) {
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [showReplace, setShowReplace] = useState(false);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6, padding: "4px 10px",
      background: "rgba(0,0,0,0.6)", borderBottom: "1px solid rgba(0,196,255,0.15)",
      flexShrink: 0,
    }}>
      <span style={{ color: "rgba(0,196,255,0.7)", fontSize: 10, fontFamily: "monospace", marginRight: 4 }}>FIND</span>
      <input
        autoFocus
        value={find}
        onChange={(e) => { setFind(e.target.value); onFind(e.target.value); }}
        placeholder="Search…"
        style={{
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 3, color: "#fff", fontSize: 11, padding: "3px 8px",
          fontFamily: "monospace", outline: "none", width: 140,
        }}
        onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
      />
      <button
        onClick={() => setShowReplace((v) => !v)}
        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 11 }}
      >
        {showReplace ? "▲ Replace" : "▼ Replace"}
      </button>
      {showReplace && (
        <>
          <input
            value={replace}
            onChange={(e) => setReplace(e.target.value)}
            placeholder="Replace with…"
            style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 3, color: "#fff", fontSize: 11, padding: "3px 8px",
              fontFamily: "monospace", outline: "none", width: 140,
            }}
          />
          <button
            onClick={() => onReplace(find, replace)}
            style={{
              background: "rgba(0,196,255,0.1)", border: "1px solid rgba(0,196,255,0.25)",
              borderRadius: 3, color: "#00c4ff", cursor: "pointer", fontSize: 10,
              padding: "3px 8px", fontFamily: "monospace",
            }}
          >Replace All</button>
        </>
      )}
      <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", marginLeft: "auto", fontSize: 14 }}>×</button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function NotepadApp({
  onClose, onMinimize, isActive, onFocus, initialX, initialY, zIndex,
}: NotepadAppProps) {
  const [files, setFiles] = useState<Record<string, NotepadFile>>(loadFiles);
  const [prefs, setPrefs] = useState<NotepadPrefs>(loadPrefs);

  // current file state
  const [currentId, setCurrentId] = useState<string | null>(() => {
    const session = loadSession();
    const allFiles = loadFiles();
    if (session.lastOpenedId && allFiles[session.lastOpenedId]) return session.lastOpenedId;
    const ids = Object.keys(allFiles);
    return ids.length > 0 ? ids[0] : null;
  });
  const [content, setContent] = useState<string>(() => {
    const allFiles = loadFiles();
    const session  = loadSession();
    const id       = session.lastOpenedId ?? Object.keys(allFiles)[0] ?? null;
    return id ? (allFiles[id]?.content ?? "") : "";
  });
  const [isDirty, setIsDirty] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  // UI states
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showSaveAs, setShowSaveAs] = useState(false);
  const [showFindBar, setShowFindBar] = useState(false);
  const [mdPreview, setMdPreview] = useState(false);
  const [confirmClose, setConfirmClose] = useState<{ action: () => void } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // cursor tracking for status bar
  const [cursor, setCursor] = useState({ line: 1, col: 1 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentFile = currentId ? files[currentId] : null;
  const currentName = currentFile?.name ?? "untitled.txt";
  const isMd        = isMarkdown(currentName);

  // ── Toast helper ────────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  // ── New file ────────────────────────────────────────────────────────────────
  const handleNew = useCallback((ext = "txt") => {
    const name    = `untitled_${Date.now().toString(36)}.${ext}`;
    const id      = genId();
    const newFile: NotepadFile = { id, name, content: "", created: Date.now(), modified: Date.now() };
    const updated = { ...loadFiles(), [id]: newFile };
    saveFiles(updated);
    setFiles(updated);
    setCurrentId(id);
    setContent("");
    setIsDirty(false);
    saveSession({ lastOpenedId: id });
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  // ── Open file ────────────────────────────────────────────────────────────────
  const handleOpen = useCallback((id: string) => {
    const doOpen = () => {
      const allFiles = loadFiles();
      const f        = allFiles[id];
      if (!f) return;
      setCurrentId(id);
      setContent(f.content);
      setIsDirty(false);
      saveSession({ lastOpenedId: id });
      setFiles(allFiles);
      setTimeout(() => textareaRef.current?.focus(), 50);
    };

    if (isDirty) {
      setConfirmClose({ action: doOpen });
    } else {
      doOpen();
    }
  }, [isDirty]);

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = useCallback((contentOverride?: string) => {
    const c = contentOverride ?? content;
    if (!currentId) { handleNew(); return; }
    const allFiles = loadFiles();
    const existing = allFiles[currentId];
    if (!existing) return;
    const updated = {
      ...allFiles,
      [currentId]: { ...existing, content: c, modified: Date.now() },
    };
    const ok = saveFiles(updated);
    if (!ok) { showToast("⚠ Storage quota exceeded (4.5 MB limit)"); return; }
    setFiles(updated);
    setIsDirty(false);
    showToast("Saved ✓");
  }, [currentId, content, handleNew, showToast]);

  // ── Save As ─────────────────────────────────────────────────────────────────
  const handleSaveAsLocalStorage = useCallback((newName: string) => {
    const name  = newName.trim() || "untitled.txt";
    const id    = currentId ?? genId();
    const allFiles = loadFiles();
    const existing = allFiles[id];
    const updated = {
      ...allFiles,
      [id]: {
        id, name, content,
        created: existing?.created ?? Date.now(),
        modified: Date.now(),
      },
    };
    const ok = saveFiles(updated);
    if (!ok) { showToast("⚠ Storage quota exceeded"); setShowSaveAs(false); return; }
    setFiles(updated);
    setCurrentId(id);
    setIsDirty(false);
    setShowSaveAs(false);
    saveSession({ lastOpenedId: id });
    showToast("Saved As: " + name);
  }, [currentId, content, showToast]);

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = useCallback((id: string) => {
    const allFiles = loadFiles();
    const updated  = { ...allFiles };
    delete updated[id];
    saveFiles(updated);
    setFiles(updated);
    if (currentId === id) {
      const ids = Object.keys(updated);
      if (ids.length > 0) {
        const nextId = ids[0];
        setCurrentId(nextId);
        setContent(updated[nextId].content);
        setIsDirty(false);
        saveSession({ lastOpenedId: nextId });
      } else {
        setCurrentId(null);
        setContent("");
        setIsDirty(false);
        saveSession({ lastOpenedId: null });
      }
    }
    showToast("Deleted");
  }, [currentId, showToast]);

  // ── Rename ──────────────────────────────────────────────────────────────────
  const handleRename = useCallback((id: string) => {
    const allFiles = loadFiles();
    const f        = allFiles[id];
    if (!f) return;
    const newName  = window.prompt("Rename file:", f.name);
    if (!newName || !newName.trim()) return;
    const updated  = { ...allFiles, [id]: { ...f, name: newName.trim(), modified: Date.now() } };
    saveFiles(updated);
    setFiles(updated);
    showToast("Renamed ✓");
  }, [showToast]);

  // ── Close with dirty check ───────────────────────────────────────────────────
  const handleRequestClose = () => {
    if (isDirty) {
      setConfirmClose({ action: onClose });
    } else {
      onClose();
    }
  };

  // ── Content change ────────────────────────────────────────────────────────────
  const handleContentChange = (val: string) => {
    setContent(val);
    setIsDirty(true);
  };

  // ── Tab key ─────────────────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta    = e.currentTarget;
      const start = ta.selectionStart;
      const end   = ta.selectionEnd;
      const tabs  = " ".repeat(prefs.tabSize);
      const newVal = content.slice(0, start) + tabs + content.slice(end);
      setContent(newVal);
      setIsDirty(true);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + prefs.tabSize;
      });
    }
    if (e.ctrlKey && e.key === "s") { e.preventDefault(); handleSave(); }
    if (e.ctrlKey && e.key === "f") { e.preventDefault(); setShowFindBar((v) => !v); }
    if (e.ctrlKey && e.key === "n") { e.preventDefault(); handleNew(); }
  };

  // ── Cursor position ──────────────────────────────────────────────────────────
  const updateCursor = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const ta    = e.currentTarget;
    const pos   = ta.selectionStart;
    const lines = content.slice(0, pos).split("\n");
    setCursor({ line: lines.length, col: lines[lines.length - 1].length + 1 });
  };

  // ── Find ────────────────────────────────────────────────────────────────────
  const handleFind = (term: string) => {
    if (!term || !textareaRef.current) return;
    const idx = content.toLowerCase().indexOf(term.toLowerCase());
    if (idx < 0) return;
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(idx, idx + term.length);
  };

  const handleReplaceAll = (find: string, replace: string) => {
    if (!find) return;
    const newContent = content.split(find).join(replace);
    handleContentChange(newContent);
    showToast("Replaced all occurrences");
  };

  // ── Auto-save every 30s ─────────────────────────────────────────────────────
  useEffect(() => {
    autoSaveTimerRef.current = setInterval(() => {
      if (isDirty && currentId) handleSave();
    }, 30000);
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [isDirty, currentId, handleSave]);

  // ── Save prefs on change ─────────────────────────────────────────────────────
  useEffect(() => { savePrefs(prefs); }, [prefs]);

  // ── Close menu on outside click ──────────────────────────────────────────────
  useEffect(() => {
    if (!activeMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [activeMenu]);

  // ── MD preview render ────────────────────────────────────────────────────────
  const mdHtml = isMd && mdPreview
    ? (marked.parse(content) as string)
    : "";

  // ── Stats ────────────────────────────────────────────────────────────────────
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const lineCount = content.split("\n").length;
  const fileList  = Object.values(files).sort((a, b) => b.modified - a.modified);

  // ── Menu actions ─────────────────────────────────────────────────────────────
  const menuActions: Record<string, { label: string; action: () => void; shortcut?: string }[]> = {
    File: [
      { label: "New (.txt)", action: () => handleNew("txt"), shortcut: "Ctrl+N" },
      { label: "New (.md)", action: () => handleNew("md") },
      { label: "Save", action: () => handleSave(), shortcut: "Ctrl+S" },
      { label: "Save As…", action: () => setShowSaveAs(true) },
    ],
    Edit: [
      { label: "Find / Replace", action: () => setShowFindBar((v) => !v), shortcut: "Ctrl+F" },
      { label: "Select All", action: () => { textareaRef.current?.select(); } },
      { label: "Clear", action: () => { handleContentChange(""); } },
    ],
    View: [
      { label: showSidebar ? "Hide Sidebar" : "Show Sidebar", action: () => setShowSidebar((v) => !v) },
      { label: isMd && mdPreview ? "Hide MD Preview" : "Show MD Preview", action: () => setMdPreview((v) => !v) },
    ],
    Format: [
      { label: "Font Size ↑", action: () => setPrefs((p) => ({ ...p, fontSize: Math.min(22, p.fontSize + 1) })) },
      { label: "Font Size ↓", action: () => setPrefs((p) => ({ ...p, fontSize: Math.max(9, p.fontSize - 1) })) },
      { label: prefs.wordWrap ? "Disable Word Wrap" : "Enable Word Wrap", action: () => setPrefs((p) => ({ ...p, wordWrap: !p.wordWrap })) },
      { label: `Tab Size: ${prefs.tabSize} → ${prefs.tabSize === 2 ? 4 : 2}`, action: () => setPrefs((p) => ({ ...p, tabSize: p.tabSize === 2 ? 4 : 2 })) },
    ],
    Help: [
      { label: "Keyboard Shortcuts", action: () => showToast("Ctrl+S: Save  |  Ctrl+F: Find  |  Ctrl+N: New  |  Tab: Indent") },
      { label: "About Notepad", action: () => showToast("MONIX Notepad v2.0 — Native OS Text Editor") },
    ],
  };

  return (
    <WindowChrome
      title={`${currentName}${isDirty ? " •" : ""} — Notepad`}
      onClose={handleRequestClose}
      onMinimize={onMinimize}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX}
      initialY={initialY}
      width={900}
      height={580}
      zIndex={zIndex}
    >
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#0a0a0e", overflow: "hidden", position: "relative", fontFamily: "monospace" }}>

        {/* ── Modals ── */}
        {confirmClose && (
          <ConfirmDialog
            message={`"${currentName}" has unsaved changes. Save before continuing?`}
            onSave={() => { handleSave(); setConfirmClose(null); confirmClose.action(); }}
            onConfirm={() => { setConfirmClose(null); confirmClose.action(); }}
            onCancel={() => setConfirmClose(null)}
          />
        )}
        {showSaveAs && (
          <SaveAsModal
            fileName={currentName}
            content={content}
            onSaveLocalStorage={handleSaveAsLocalStorage}
            onClose={() => setShowSaveAs(false)}
          />
        )}

        {/* ── Toast ── */}
        {toast && (
          <div style={{
            position: "absolute", bottom: 30, left: "50%", transform: "translateX(-50%)",
            background: "rgba(0,196,255,0.15)", border: "1px solid rgba(0,196,255,0.35)",
            borderRadius: 6, padding: "6px 16px", fontSize: 11, color: "#00c4ff",
            zIndex: 300, pointerEvents: "none", whiteSpace: "nowrap",
          }}>
            {toast}
          </div>
        )}

        {/* ── Menu Bar ── */}
        <div
          ref={menuRef}
          style={{
            display: "flex", alignItems: "center", gap: 0, flexShrink: 0,
            height: 28, background: "rgba(0,0,0,0.6)",
            borderBottom: "1px solid rgba(255,255,255,0.06)", paddingLeft: 4,
          }}
        >
          {Object.entries(menuActions).map(([menu, items]) => (
            <div key={menu} style={{ position: "relative" }}>
              <button
                onClick={() => setActiveMenu((v) => v === menu ? null : menu)}
                style={{
                  background: activeMenu === menu ? "rgba(0,196,255,0.12)" : "transparent",
                  border: "none", color: activeMenu === menu ? "#00c4ff" : "rgba(255,255,255,0.7)",
                  fontSize: 11, padding: "0 10px", height: 28, cursor: "pointer",
                  fontFamily: "monospace",
                }}
              >
                {menu}
              </button>
              {activeMenu === menu && (
                <div style={{
                  position: "absolute", top: 28, left: 0, zIndex: 500,
                  background: "#111318", border: "1px solid rgba(0,196,255,0.2)",
                  borderRadius: 4, minWidth: 200, boxShadow: "0 8px 24px rgba(0,0,0,0.8)",
                  padding: "4px 0",
                }}>
                  {items.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => { item.action(); setActiveMenu(null); }}
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        width: "100%", background: "none", border: "none",
                        color: "rgba(255,255,255,0.8)", fontSize: 11, padding: "6px 14px",
                        cursor: "pointer", fontFamily: "monospace", textAlign: "left",
                        gap: 20,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,196,255,0.1)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{item.shortcut}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div style={{ flex: 1 }} />

          {/* MD toggle */}
          {isMd && (
            <button
              onClick={() => setMdPreview((v) => !v)}
              style={{
                background: mdPreview ? "rgba(0,196,255,0.12)" : "rgba(255,255,255,0.04)",
                border: "1px solid " + (mdPreview ? "rgba(0,196,255,0.3)" : "rgba(255,255,255,0.1)"),
                borderRadius: 3, color: mdPreview ? "#00c4ff" : "rgba(255,255,255,0.4)",
                fontSize: 10, padding: "2px 8px", cursor: "pointer",
                fontFamily: "monospace", marginRight: 8,
              }}
            >
              MD {mdPreview ? "▼" : "▶"}
            </button>
          )}
        </div>

        {/* ── Toolbar ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
          height: 30, background: "rgba(0,0,0,0.45)",
          borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "0 8px",
        }}>
          {[
            { label: "New", action: () => handleNew("txt"), title: "New File (Ctrl+N)" },
            { label: "Save", action: () => handleSave(), title: "Save (Ctrl+S)", accent: isDirty },
            { label: "Save As", action: () => setShowSaveAs(true), title: "Save As" },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={btn.action}
              title={btn.title}
              style={{
                background: btn.accent ? "rgba(0,196,255,0.12)" : "rgba(255,255,255,0.05)",
                border: "1px solid " + (btn.accent ? "rgba(0,196,255,0.3)" : "rgba(255,255,255,0.08)"),
                borderRadius: 3, color: btn.accent ? "#00c4ff" : "rgba(255,255,255,0.55)",
                fontSize: 10, padding: "2px 9px", cursor: "pointer", fontFamily: "monospace",
              }}
            >
              {btn.label}
            </button>
          ))}

          <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />

          <button
            onClick={() => setShowFindBar((v) => !v)}
            title="Find / Replace (Ctrl+F)"
            style={{
              background: showFindBar ? "rgba(0,196,255,0.1)" : "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3,
              color: "rgba(255,255,255,0.55)", fontSize: 10, padding: "2px 9px",
              cursor: "pointer", fontFamily: "monospace",
            }}
          >
            Find
          </button>

          <div style={{ flex: 1 }} />

          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
            {currentName}{isDirty ? " *" : ""}
          </span>
        </div>

        {/* ── Find Bar ── */}
        {showFindBar && (
          <FindBar onFind={handleFind} onReplace={handleReplaceAll} onClose={() => setShowFindBar(false)} />
        )}

        {/* ── Main body: sidebar + editor ── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* Sidebar */}
          {showSidebar && (
            <div style={{
              width: 160, flexShrink: 0, display: "flex", flexDirection: "column",
              borderRight: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(0,0,0,0.35)",
            }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "6px 10px", borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}>
                <span style={{ fontSize: 9, color: "rgba(0,196,255,0.7)", fontFamily: "monospace", letterSpacing: "0.06em" }}>
                  FILES ({fileList.length})
                </span>
                <button
                  onClick={() => handleNew("txt")}
                  title="New file"
                  style={{
                    background: "none", border: "none", color: "rgba(0,196,255,0.6)",
                    cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0,
                  }}
                >
                  +
                </button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
                {fileList.length === 0 ? (
                  <div style={{ padding: "12px 10px", fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
                    No files yet
                  </div>
                ) : fileList.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => handleOpen(f.id)}
                    style={{
                      padding: "5px 10px", cursor: "pointer",
                      background: currentId === f.id ? "rgba(0,196,255,0.1)" : "transparent",
                      borderLeft: currentId === f.id ? "2px solid #00c4ff" : "2px solid transparent",
                      display: "flex", alignItems: "center", gap: 6,
                    }}
                    onMouseEnter={(e) => { if (currentId !== f.id) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                    onMouseLeave={(e) => { if (currentId !== f.id) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{ fontSize: 11 }}>{isMarkdown(f.name) ? "📝" : "📄"}</span>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{
                        fontSize: 10, color: currentId === f.id ? "#00c4ff" : "rgba(255,255,255,0.7)",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        fontFamily: "monospace",
                      }}>
                        {f.name}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(f.id); }}
                      style={{
                        background: "none", border: "none", color: "rgba(255,68,68,0.5)",
                        cursor: "pointer", fontSize: 12, padding: 0, flexShrink: 0,
                        opacity: 0, transition: "opacity 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                      title="Delete file"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Editor area */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {currentId === null ? (
              <div style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 12,
              }}>
                <div style={{ fontSize: 32 }}>📝</div>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, fontFamily: "monospace" }}>
                  No file open
                </div>
                <button
                  onClick={() => handleNew("txt")}
                  style={{
                    background: "rgba(0,196,255,0.1)", border: "1px solid rgba(0,196,255,0.3)",
                    borderRadius: 5, color: "#00c4ff", padding: "7px 18px",
                    cursor: "pointer", fontSize: 12, fontFamily: "monospace",
                  }}
                >
                  + New File
                </button>
              </div>
            ) : isMd && mdPreview ? (
              /* Markdown split-pane */
              <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onSelect={updateCursor}
                  onClick={updateCursor}
                  spellCheck={false}
                  style={{
                    flex: "0 0 50%", background: "#090c10", color: "#c9d1d9",
                    border: "none", borderRight: "1px solid rgba(255,255,255,0.07)",
                    outline: "none", resize: "none", fontFamily: "monospace",
                    fontSize: prefs.fontSize, lineHeight: "1.65",
                    padding: "14px", whiteSpace: prefs.wordWrap ? "pre-wrap" : "pre",
                    overflowY: "auto", tabSize: prefs.tabSize,
                  }}
                />
                <div
                  className="md-preview"
                  dangerouslySetInnerHTML={{ __html: mdHtml }}
                  style={{
                    flex: "0 0 50%", background: "#0c0f14", color: "rgba(255,255,255,0.82)",
                    padding: "14px 18px", overflowY: "auto", fontSize: prefs.fontSize,
                    lineHeight: 1.7,
                  }}
                />
              </div>
            ) : (
              /* Plain text editor */
              <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                {prefs.showLineNumbers && (
                  <div style={{
                    width: 40, flexShrink: 0, background: "rgba(0,0,0,0.3)",
                    borderRight: "1px solid rgba(255,255,255,0.05)",
                    padding: "14px 0", overflowY: "hidden", userSelect: "none",
                    pointerEvents: "none",
                  }}>
                    {Array.from({ length: lineCount }, (_, i) => (
                      <div key={i} style={{
                        textAlign: "right", paddingRight: 8, fontSize: prefs.fontSize - 2,
                        lineHeight: "1.65", color: cursor.line === i + 1
                          ? "rgba(0,196,255,0.5)"
                          : "rgba(255,255,255,0.15)",
                        fontFamily: "monospace",
                      }}>
                        {i + 1}
                      </div>
                    ))}
                  </div>
                )}
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onSelect={updateCursor}
                  onClick={updateCursor}
                  spellCheck={false}
                  style={{
                    flex: 1, background: "transparent", color: "#d4d4d8",
                    border: "none", outline: "none", resize: "none",
                    fontFamily: "monospace", fontSize: prefs.fontSize,
                    lineHeight: "1.65", padding: "14px 14px",
                    whiteSpace: prefs.wordWrap ? "pre-wrap" : "pre",
                    overflowY: "auto", tabSize: prefs.tabSize,
                    caretColor: "#00c4ff",
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Status Bar ── */}
        <div style={{
          height: 22, flexShrink: 0, display: "flex", alignItems: "center",
          gap: 16, padding: "0 12px",
          background: isDirty ? "rgba(0,196,255,0.07)" : "rgba(0,0,0,0.4)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}>
          <span style={{ fontSize: 9, color: isDirty ? "#00c4ff" : "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
            {isDirty ? "● UNSAVED" : "○ SAVED"}
          </span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
            Ln {cursor.line}, Col {cursor.col}
          </span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
            Words: {wordCount}
          </span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
            {content.length} chars
          </span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
            {getExt(currentName).toUpperCase()} · UTF-8 · Tab:{prefs.tabSize}
          </span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.15)", fontFamily: "monospace" }}>
            {prefs.fontSize}px
          </span>
        </div>

        {/* MD preview styles */}
        <style>{`
          .md-preview h1,.md-preview h2,.md-preview h3 { color: #00c4ff; border-bottom: 1px solid rgba(0,196,255,0.15); padding-bottom: 4px; margin-top: 16px; }
          .md-preview code { background: rgba(0,196,255,0.08); padding: 1px 5px; border-radius: 3px; font-size: 0.9em; color: #7ec8e3; font-family: monospace; }
          .md-preview pre { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.08); border-radius: 5px; padding: 10px 14px; overflow-x: auto; }
          .md-preview pre code { background: none; padding: 0; }
          .md-preview blockquote { border-left: 3px solid rgba(0,196,255,0.4); padding-left: 12px; color: rgba(255,255,255,0.5); margin: 0; }
          .md-preview a { color: #00c4ff; }
          .md-preview table { border-collapse: collapse; width: 100%; }
          .md-preview th,.md-preview td { border: 1px solid rgba(255,255,255,0.1); padding: 5px 10px; font-size: 12px; }
          .md-preview th { background: rgba(0,196,255,0.08); color: #00c4ff; }
          .md-preview ul,.md-preview ol { padding-left: 20px; }
          .md-preview li { margin: 2px 0; }
          .md-preview p { margin: 6px 0; }
          .md-preview hr { border-color: rgba(255,255,255,0.1); margin: 12px 0; }
        `}</style>
      </div>
    </WindowChrome>
  );
}
