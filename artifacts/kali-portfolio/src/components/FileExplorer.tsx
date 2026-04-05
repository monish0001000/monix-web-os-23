import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder, FileText, File, Image as ImageIcon, Archive,
  ChevronRight, Cloud, Upload, CheckCircle, XCircle,
  HardDrive, Loader2, Database, AlertTriangle,
  Download, RefreshCw, ExternalLink, Mouse,
} from "lucide-react";
import WindowChrome from "./WindowChrome";
import { supabase } from "@/lib/supabaseClient";
import { useOSStore } from "@/lib/store";
import type { VFSNode } from "@/lib/vfsUtils";

interface FileExplorerProps {
  onClose: () => void;
  onMinimize?: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
  onOpenMediaViewer?: (fileName: string, fileUrl: string, fileType: string) => void;
}

// ─── Media type detection from extension ──────────────────────────────────────
type MediaKind = "image" | "video" | "audio" | "unknown";

function detectMediaType(ext: string | undefined): MediaKind {
  const e = (ext ?? "").toLowerCase();
  if (["png","jpg","jpeg","gif","webp","avif","bmp","svg","ico"].includes(e)) return "image";
  if (["mp4","webm","ogv","mov","avi","mkv","m4v"].includes(e))              return "video";
  if (["mp3","wav","ogg","flac","aac","m4a","opus"].includes(e))             return "audio";
  return "unknown";
}

// ─── VFS Icon helpers ─────────────────────────────────────────────────────────
function getVFSIcon(node: VFSNode) {
  if (node.type === "folder") return Folder;
  const e = node.ext ?? "";
  if (["png","jpg","jpeg","svg","gif","webp","avif"].includes(e)) return ImageIcon;
  if (["zip","gz","tar","iso","rar","7z"].includes(e)) return Archive;
  if (["md","txt","log","json","csv"].includes(e)) return FileText;
  return File;
}

function getVFSIconColor(node: VFSNode): string {
  if (node.type === "folder") return "#00f0ff";
  const e = node.ext ?? "";
  if (["zip","gz","tar","iso","rar","7z"].includes(e)) return "#fbbf24";
  if (["png","jpg","jpeg","svg","gif","webp","avif"].includes(e)) return "#34d399";
  if (["sh","py","js","ts","rs","go"].includes(e)) return "#a78bfa";
  if (["enc","key","pem"].includes(e)) return "#f87171";
  if (["md","txt","log"].includes(e)) return "#94a3b8";
  return "#64748b";
}

// ─── Supabase cloud registry row ──────────────────────────────────────────────
interface CloudFile {
  id: string;
  file_name: string;
  file_size: number;
  file_url: string;
  created_at: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastKind = "success" | "error" | "info";
interface Toast { id: number; kind: ToastKind; msg: string }

// ─── Context menu item ────────────────────────────────────────────────────────
interface CtxMenuItem { label: string; icon: React.ReactNode; action: () => void; danger?: boolean }

// ─── Main component ───────────────────────────────────────────────────────────
export default function FileExplorer({
  onClose, onMinimize, isActive, onFocus, initialX, initialY, zIndex,
  onOpenMediaViewer,
}: FileExplorerProps) {
  const [tab, setTab] = useState<"local" | "cloud">("local");

  // ── VFS state (reads from store — populated by Desktop on mount) ──
  const localFileSystem = useOSStore((s) => s.localFileSystem);

  // Navigation: stack of folder IDs; last entry = current folder
  const [navStack, setNavStack] = useState<string[]>(["root"]);
  const currentFolderId = navStack[navStack.length - 1];

  // Context menu
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; items: CtxMenuItem[] } | null>(null);

  // Derive children and breadcrumb from navStack + tree
  const currentChildren = localFileSystem.filter((n) => n.parentId === currentFolderId);
  const breadcrumb: VFSNode[] = navStack.map((id) =>
    localFileSystem.find((n) => n.id === id) ?? { id, name: id === "root" ? "storage" : id, type: "folder", parentId: "" }
  );

  // Reset navigation when VFS reloads (e.g., first mount)
  useEffect(() => {
    setNavStack(["root"]);
  }, [localFileSystem.length]);

  // Close ctx menu on outside click
  useEffect(() => {
    if (!ctxMenu) return;
    const handler = () => setCtxMenu(null);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [ctxMenu]);

  // ── Smart file opener: media → in-OS viewer, else → download ──────────────
  const openFile = useCallback((node: VFSNode) => {
    if (!node.url) return;
    const kind = detectMediaType(node.ext);
    if (kind !== "unknown") {
      onOpenMediaViewer?.(node.name, node.url, kind);
    } else {
      // Fallback: trigger native download — never leaves the OS tab
      const a = document.createElement("a");
      a.href = node.url;
      a.download = node.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }, [onOpenMediaViewer]);

  // ── VFS navigation ──
  const navigateInto = useCallback((node: VFSNode) => {
    if (node.type === "folder") {
      setNavStack((s) => [...s, node.id]);
    } else {
      openFile(node);
    }
  }, [openFile]);

  const navigateToBreadcrumb = useCallback((idx: number) => {
    setNavStack((s) => s.slice(0, idx + 1));
  }, []);

  const downloadFile = async (node: VFSNode) => {
    if (!node.url) return;
    try {
      const res = await fetch(node.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = node.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch { /* silent — context menu usage */ }
  };

  const openCtxMenu = (e: React.MouseEvent, node: VFSNode) => {
    e.preventDefault();
    e.stopPropagation();
    const items: CtxMenuItem[] = node.type === "folder"
      ? [{ label: "Open", icon: <Folder size={11} />, action: () => navigateInto(node) }]
      : [
          { label: "Open",     icon: <ExternalLink size={11} />, action: () => openFile(node) },
          { label: "Download", icon: <Download size={11} />,     action: () => downloadFile(node) },
        ];
    setCtxMenu({ x: e.clientX, y: e.clientY, items });
  };

  // ── Cloud state ──
  const [isDragging, setIsDragging]       = useState(false);
  const [cloudFiles, setCloudFiles]       = useState<CloudFile[]>([]);
  const [loadingFiles, setLoadingFiles]   = useState(false);
  const [uploadPhase, setUploadPhase]     = useState<"idle"|"encrypting"|"uploading"|"done"|"error">("idle");
  const [uploadStatus, setUploadStatus]   = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [toasts, setToasts]               = useState<Toast[]>([]);
  const fileInputRef                       = useRef<HTMLInputElement>(null);
  const toastCounter                       = useRef(0);

  const pushToast = useCallback((kind: ToastKind, msg: string) => {
    const id = ++toastCounter.current;
    setToasts((t) => [...t, { id, kind, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const fetchCloudFiles = useCallback(async () => {
    setLoadingFiles(true);
    try {
      const { data, error } = await supabase
        .from("cloud_registry")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCloudFiles((data as CloudFile[]) ?? []);
    } catch (err: unknown) {
      pushToast("error", `REGISTRY ERROR: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setLoadingFiles(false);
    }
  }, [pushToast]);

  useEffect(() => {
    if (tab === "cloud") fetchCloudFiles();
  }, [tab, fetchCloudFiles]);

  const doUpload = useCallback(async (file: File) => {
    setUploadPhase("encrypting");
    setUploadStatus("Encrypting payload...");
    await new Promise((r) => setTimeout(r, 1000));

    setUploadPhase("uploading");
    setUploadStatus("Uploading to secure server...");
    try {
      const storagePath = `${Date.now()}_${file.name}`;
      const { error: storageError } = await supabase.storage
        .from("monix-drive")
        .upload(storagePath, file, { upsert: true });
      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage.from("monix-drive").getPublicUrl(storagePath);
      const { error: insertError } = await supabase
        .from("cloud_registry")
        .insert([{ file_name: file.name, file_size: file.size, file_url: urlData.publicUrl }]);
      if (insertError) throw insertError;

      setUploadPhase("done");
      setUploadStatus("Secure upload verified ✓");
      pushToast("success", `${file.name} secured to cloud`);
      await fetchCloudFiles();
      setTimeout(() => { setUploadPhase("idle"); setUploadStatus(null); }, 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setUploadPhase("error");
      setUploadStatus(`ERROR: ${msg}`);
      pushToast("error", `Upload failed — ${msg}`);
      setTimeout(() => { setUploadPhase("idle"); setUploadStatus(null); }, 4000);
    }
  }, [pushToast, fetchCloudFiles]);

  const doCloudDownload = useCallback(async (file: CloudFile) => {
    setDownloadingId(file.id);
    pushToast("info", `Fetching ${file.file_name}...`);
    try {
      const res = await fetch(file.file_url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl; a.download = file.file_name;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(blobUrl);
      pushToast("success", `${file.file_name} downloaded`);
    } catch (err: unknown) {
      pushToast("error", `Download failed — ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setDownloadingId(null);
    }
  }, [pushToast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) doUpload(file);
    e.target.value = "";
  };

  const toastColors: Record<ToastKind, { bg: string; border: string; color: string; shadow: string }> = {
    success: { bg:"rgba(0,255,136,0.1)",   border:"rgba(0,255,136,0.35)",   color:"#00ff88", shadow:"0 0 20px rgba(0,255,136,0.2)"   },
    error:   { bg:"rgba(248,113,113,0.1)", border:"rgba(248,113,113,0.35)", color:"#f87171", shadow:"0 0 20px rgba(248,113,113,0.2)" },
    info:    { bg:"rgba(0,240,255,0.08)",  border:"rgba(0,240,255,0.3)",    color:"#00f0ff", shadow:"0 0 20px rgba(0,240,255,0.15)"  },
  };

  return (
    <WindowChrome
      title="MONIX Files — Secure File Manager"
      onClose={onClose}
      onMinimize={onMinimize}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX}
      initialY={initialY}
      width={760}
      height={520}
      zIndex={zIndex}
    >
      <div className="flex flex-col h-full bg-[#050505] font-mono overflow-hidden">

        {/* ── Tab Bar ── */}
        <div className="flex items-center border-b border-white/[0.06] bg-[#080808] px-3 pt-2 gap-1 shrink-0">
          {[
            { id: "local" as const, label: "LOCAL SYSTEM", icon: <HardDrive size={12} /> },
            { id: "cloud" as const, label: "CLOUD DRIVE",  icon: <Cloud size={12} /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] tracking-widest transition-all duration-200 rounded-t"
              style={{
                color:        tab === t.id ? "#00f0ff" : "rgba(255,255,255,0.3)",
                borderBottom: tab === t.id ? "2px solid #00f0ff" : "2px solid transparent",
                background:   tab === t.id ? "rgba(0,240,255,0.05)" : "transparent",
                textShadow:   tab === t.id ? "0 0 10px rgba(0,240,255,0.7)" : "none",
                fontWeight:   tab === t.id ? 700 : 400,
              }}
            >
              {t.icon}<span className="ml-1">{t.label}</span>
            </button>
          ))}
          <div className="ml-auto text-[9px] text-white/20 tracking-widest pb-1.5 flex items-center gap-2">
            {tab === "local" && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" style={{ boxShadow:"0 0 6px #22d3ee" }} />
                VFS READY · {localFileSystem.filter(n=>n.type==="file").length} FILES
              </span>
            )}
            {tab === "cloud" && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" style={{ boxShadow:"0 0 6px #4ade80" }} />
                SUPABASE CONNECTED
              </span>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">

            {/* ══ TAB 1: LOCAL VFS (real glob-backed) ══ */}
            {tab === "local" && (
              <motion.div
                key="local"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col h-full"
                onContextMenu={(e) => e.preventDefault()}
              >
                {/* Breadcrumb bar */}
                <div className="flex items-center gap-1 px-4 py-2 border-b border-white/[0.04] bg-[#060606] shrink-0">
                  <Database size={10} className="text-white/20 mr-1 shrink-0" />
                  {breadcrumb.map((node, i) => (
                    <span key={node.id} className="flex items-center gap-1">
                      {i > 0 && <ChevronRight size={10} className="text-white/15" />}
                      <button
                        onClick={() => navigateToBreadcrumb(i)}
                        className="text-[10px] tracking-wider transition-all hover:underline shrink-0"
                        style={{
                          color:      i === breadcrumb.length - 1 ? "#00f0ff" : "rgba(255,255,255,0.35)",
                          textShadow: i === breadcrumb.length - 1 ? "0 0 8px rgba(0,240,255,0.6)" : "none",
                        }}
                      >
                        {node.name}
                      </button>
                    </span>
                  ))}
                  <span className="ml-auto text-[9px] text-white/15 tracking-widest shrink-0">
                    {currentChildren.length} ITEMS
                  </span>
                </div>

                {/* Files grid */}
                <div className="flex-1 overflow-y-auto p-4">
                  {localFileSystem.length === 0 ? (
                    // VFS not yet loaded (shouldn't happen after Desktop mounts)
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-white/15">
                      <Loader2 size={28} className="animate-spin" style={{ color:"#00f0ff" }} />
                      <span className="text-[10px] tracking-widest">INITIALIZING VFS...</span>
                    </div>
                  ) : currentChildren.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-white/15">
                      <AlertTriangle size={28} />
                      <span className="text-[11px] tracking-widest">EMPTY DIRECTORY</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-5 gap-3">
                      {currentChildren.map((node) => {
                        const Icon  = getVFSIcon(node);
                        const color = getVFSIconColor(node);
                        return (
                          <motion.div
                            key={node.id}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            onDoubleClick={() => navigateInto(node)}
                            onContextMenu={(e) => openCtxMenu(e, node)}
                            className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg cursor-pointer text-center select-none"
                            style={{
                              background:  "rgba(255,255,255,0.02)",
                              border:      "1px solid rgba(255,255,255,0.04)",
                              transition:  "background 0.15s, border-color 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              const el = e.currentTarget as HTMLDivElement;
                              el.style.background   = "rgba(0,240,255,0.05)";
                              el.style.borderColor  = "rgba(0,240,255,0.15)";
                            }}
                            onMouseLeave={(e) => {
                              const el = e.currentTarget as HTMLDivElement;
                              el.style.background   = "rgba(255,255,255,0.02)";
                              el.style.borderColor  = "rgba(255,255,255,0.04)";
                            }}
                          >
                            <Icon size={30} style={{ color, filter:`drop-shadow(0 0 6px ${color}88)` }} />
                            <span className="text-[10px] text-white/70 truncate w-full leading-tight" title={node.name}>
                              {node.name}
                            </span>
                            {node.type === "file" && node.ext && (
                              <span className="text-[8px] px-1.5 py-0.5 rounded uppercase tracking-widest"
                                style={{ background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.25)" }}>
                                .{node.ext}
                              </span>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Help hint */}
                <div className="shrink-0 px-4 py-1.5 border-t border-white/[0.04] flex items-center gap-3"
                  style={{ background:"rgba(0,0,0,0.3)" }}>
                  <Mouse size={9} className="text-white/15" />
                  <span className="text-[9px] text-white/15 tracking-wider">
                    DOUBLE-CLICK to open · RIGHT-CLICK for options
                  </span>
                </div>
              </motion.div>
            )}

            {/* ══ TAB 2: CLOUD DRIVE (Supabase) ══ */}
            {tab === "cloud" && (
              <motion.div
                key="cloud"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col h-full overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">

                  {/* Upload Zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f=e.dataTransfer.files[0]; if(f) doUpload(f); }}
                    onClick={() => uploadPhase==="idle" && fileInputRef.current?.click()}
                    className="relative rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300"
                    style={{
                      minHeight:  170,
                      background: isDragging ? "rgba(0,240,255,0.08)" : "rgba(0,240,255,0.025)",
                      border:     isDragging ? "2px dashed rgba(0,240,255,0.7)" : "2px dashed rgba(0,240,255,0.2)",
                      boxShadow:  isDragging ? "0 0 24px rgba(0,240,255,0.25)" : "none",
                    }}
                  >
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

                    {uploadPhase === "idle" && (<>
                      <div className="flex items-center justify-center w-14 h-14 rounded-full"
                        style={{ background:"rgba(0,240,255,0.08)", border:"1px solid rgba(0,240,255,0.2)", boxShadow:"0 0 20px rgba(0,240,255,0.12)" }}>
                        <Upload size={22} style={{ color:"#00f0ff" }} />
                      </div>
                      <div className="text-[11px] tracking-[0.22em] font-bold"
                        style={{ color:"#00f0ff", textShadow:"0 0 12px rgba(0,240,255,0.7)" }}>
                        DECRYPT & UPLOAD TO SECURE CLOUD
                      </div>
                      <div className="text-[10px] text-white/25 tracking-wider">DRAG & DROP OR CLICK TO SELECT</div>
                      <motion.button
                        whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        className="flex items-center gap-2 px-6 py-2 rounded-lg text-[11px] tracking-widest font-bold mt-1"
                        style={{ background:"linear-gradient(135deg,rgba(0,240,255,0.18),rgba(0,255,136,0.08))", border:"1px solid rgba(0,240,255,0.35)", color:"#00f0ff" }}
                      >
                        <Upload size={13} /> INITIATE UPLOAD
                      </motion.button>
                    </>)}

                    {(uploadPhase==="encrypting"||uploadPhase==="uploading") && (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 size={32} className="animate-spin" style={{ color:"#00f0ff" }} />
                        <div className="text-[12px] tracking-widest font-bold" style={{ color:"#00f0ff", textShadow:"0 0 10px rgba(0,240,255,0.8)" }}>
                          {uploadStatus}
                        </div>
                        <div className="flex gap-1">
                          {[0,1,2,3,4].map((i)=>(
                            <motion.div key={i} animate={{ opacity:[0.2,1,0.2] }} transition={{ duration:1,repeat:Infinity,delay:i*0.15 }}
                              className="w-1.5 h-1.5 rounded-full" style={{ background:"#00f0ff" }} />
                          ))}
                        </div>
                      </div>
                    )}

                    {uploadPhase==="done" && (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle size={36} style={{ color:"#00ff88" }} />
                        <div className="text-[12px] tracking-widest font-bold" style={{ color:"#00ff88", textShadow:"0 0 10px rgba(0,255,136,0.8)" }}>{uploadStatus}</div>
                      </div>
                    )}

                    {uploadPhase==="error" && (
                      <div className="flex flex-col items-center gap-2 px-8 text-center">
                        <XCircle size={36} style={{ color:"#f87171" }} />
                        <div className="text-[11px] tracking-widest font-bold" style={{ color:"#f87171" }}>{uploadStatus}</div>
                      </div>
                    )}
                  </div>

                  {/* Cloud Registry */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Database size={11} style={{ color:"#00f0ff" }} />
                      <span className="text-[10px] tracking-[0.2em] font-bold" style={{ color:"#00f0ff",opacity:0.7 }}>CLOUD REGISTRY</span>
                      <span className="text-[9px] text-white/20 tracking-widest ml-1">— SUPABASE / cloud_registry</span>
                      <button onClick={fetchCloudFiles} disabled={loadingFiles}
                        className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded text-[9px] tracking-widest transition-all"
                        style={{ color:"rgba(0,240,255,0.5)", border:"1px solid rgba(0,240,255,0.15)", background:"rgba(0,240,255,0.03)" }}>
                        <RefreshCw size={9} className={loadingFiles ? "animate-spin" : ""} /> REFRESH
                      </button>
                      <span className="text-[9px] text-white/20 tracking-widest">{cloudFiles.length} FILES</span>
                    </div>

                    {loadingFiles ? (
                      <div className="flex items-center justify-center py-10 gap-2 rounded-lg"
                        style={{ background:"rgba(255,255,255,0.015)", border:"1px solid rgba(255,255,255,0.04)" }}>
                        <Loader2 size={16} className="animate-spin" style={{ color:"#00f0ff" }} />
                        <span className="text-[10px] text-white/30 tracking-widest">QUERYING REGISTRY...</span>
                      </div>
                    ) : cloudFiles.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-2 rounded-lg"
                        style={{ background:"rgba(255,255,255,0.015)", border:"1px solid rgba(255,255,255,0.04)" }}>
                        <AlertTriangle size={20} className="text-white/15" />
                        <span className="text-[10px] text-white/15 tracking-widest">NO FILES IN REGISTRY</span>
                        <span className="text-[9px] text-white/10 tracking-widest">Upload a file to get started</span>
                      </div>
                    ) : (
                      <div className="rounded-lg overflow-hidden" style={{ border:"1px solid rgba(0,240,255,0.1)", background:"rgba(0,0,0,0.35)" }}>
                        <table className="w-full text-[10px]">
                          <thead>
                            <tr style={{ background:"rgba(0,240,255,0.05)", borderBottom:"1px solid rgba(0,240,255,0.1)" }}>
                              <th className="text-left px-3 py-2 tracking-widest text-white/30 font-normal">FILENAME</th>
                              <th className="text-left px-3 py-2 tracking-widest text-white/30 font-normal">SIZE</th>
                              <th className="text-left px-3 py-2 tracking-widest text-white/30 font-normal">UPLOADED</th>
                              <th className="text-center px-3 py-2 tracking-widest text-white/30 font-normal">STATUS</th>
                              <th className="text-right px-3 py-2 tracking-widest text-white/30 font-normal">ACTION</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cloudFiles.map((f, i) => (
                              <motion.tr key={f.id}
                                initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.03 }}
                                style={{ borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
                                <td className="px-3 py-2 text-white/70 max-w-[180px]">
                                  <span className="truncate block" title={f.file_name}>{f.file_name}</span>
                                </td>
                                <td className="px-3 py-2 text-white/35 whitespace-nowrap">{formatBytes(f.file_size)}</td>
                                <td className="px-3 py-2 text-white/30 whitespace-nowrap">
                                  {new Date(f.created_at).toLocaleString(undefined,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] tracking-widest font-bold whitespace-nowrap"
                                    style={{ background:"rgba(0,255,136,0.08)", border:"1px solid rgba(0,255,136,0.25)", color:"#00ff88" }}>
                                    <CheckCircle size={8} /> CLOUD SYNC VERIFIED
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <motion.button whileHover={{ scale:1.07 }} whileTap={{ scale:0.95 }}
                                    onClick={() => doCloudDownload(f)} disabled={downloadingId===f.id}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[9px] tracking-wider font-bold"
                                    style={{
                                      background: downloadingId===f.id ? "rgba(0,240,255,0.04)" : "rgba(0,240,255,0.07)",
                                      border:     "1px solid rgba(0,240,255,0.2)",
                                      color:      downloadingId===f.id ? "rgba(0,240,255,0.4)" : "#00f0ff",
                                      cursor:     downloadingId===f.id ? "not-allowed" : "pointer",
                                    }}>
                                    {downloadingId===f.id ? <Loader2 size={9} className="animate-spin"/> : <Download size={9}/>}
                                    {downloadingId===f.id ? "..." : "DOWNLOAD"}
                                  </motion.button>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── In-explorer context menu ── */}
        <AnimatePresence>
          {ctxMenu && (
            <motion.div
              initial={{ opacity:0, scale:0.93 }}
              animate={{ opacity:1, scale:1 }}
              exit={{ opacity:0, scale:0.93 }}
              transition={{ duration:0.12 }}
              className="fixed flex flex-col py-1 rounded-lg overflow-hidden"
              style={{
                left:    ctxMenu.x,
                top:     ctxMenu.y,
                zIndex:  (zIndex ?? 100) + 60,
                background:    "rgba(8,8,8,0.96)",
                border:        "1px solid rgba(0,240,255,0.18)",
                backdropFilter:"blur(16px)",
                boxShadow:     "0 8px 40px rgba(0,0,0,0.7), 0 0 20px rgba(0,240,255,0.08)",
                minWidth:      150,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {ctxMenu.items.map((item) => (
                <button
                  key={item.label}
                  onClick={() => { item.action(); setCtxMenu(null); }}
                  className="flex items-center gap-2.5 px-3 py-2 text-[11px] tracking-wider text-left transition-all"
                  style={{ color: item.danger ? "#f87171" : "rgba(255,255,255,0.75)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,240,255,0.07)"; (e.currentTarget as HTMLButtonElement).style.color = item.danger ? "#f87171" : "#00f0ff"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = item.danger ? "#f87171" : "rgba(255,255,255,0.75)"; }}
                >
                  <span style={{ color: item.danger ? "#f87171" : "rgba(0,240,255,0.7)" }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Toast Layer ── */}
        <div className="fixed bottom-14 right-4 flex flex-col gap-2 pointer-events-none"
          style={{ zIndex:(zIndex ?? 100) + 50 }}>
          <AnimatePresence>
            {toasts.map((t) => {
              const c = toastColors[t.kind];
              return (
                <motion.div key={t.id}
                  initial={{ opacity:0, x:40, scale:0.9 }}
                  animate={{ opacity:1, x:0,  scale:1   }}
                  exit={{ opacity:0, x:40, scale:0.9 }}
                  transition={{ duration:0.22 }}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-[11px] tracking-wider font-bold shadow-2xl"
                  style={{ background:c.bg, border:`1px solid ${c.border}`, color:c.color, boxShadow:`${c.shadow},0 8px 32px rgba(0,0,0,0.6)`, backdropFilter:"blur(12px)", minWidth:220, pointerEvents:"auto" }}>
                  {t.kind==="success" && <CheckCircle size={14}/>}
                  {t.kind==="error"   && <XCircle size={14}/>}
                  {t.kind==="info"    && <Cloud size={14}/>}
                  {t.msg}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </WindowChrome>
  );
}
