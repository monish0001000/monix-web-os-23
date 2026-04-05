import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder, FileText, File, Image as ImageIcon, Archive,
  ChevronRight, Cloud, Upload, CheckCircle, XCircle,
  HardDrive, Loader2, Shield, Database, AlertTriangle,
} from "lucide-react";
import WindowChrome from "./WindowChrome";

interface FileExplorerProps {
  onClose: () => void;
  onMinimize?: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
}

// ─── Virtual File System ──────────────────────────────────────────────────────
interface VFSNode {
  id: string;
  name: string;
  type: "folder" | "file";
  parentId: string | null;
  ext?: string;
  size?: string;
}

const VFS_NODES: VFSNode[] = [
  { id: "root",        name: "root",        type: "folder", parentId: null },
  { id: "projects",    name: "projects",    type: "folder", parentId: "root" },
  { id: "tools",       name: "tools",       type: "folder", parentId: "root" },
  { id: "top_secret",  name: "top_secret",  type: "folder", parentId: "root" },
  { id: "readme",      name: "README.md",   type: "file",   parentId: "root",       ext: "md",  size: "4.2 KB" },
  { id: "bashrc",      name: ".bashrc",     type: "file",   parentId: "root",       ext: "sh",  size: "1.1 KB" },
  { id: "portfolio",   name: "portfolio",   type: "folder", parentId: "projects" },
  { id: "monixos",     name: "monix-os",    type: "folder", parentId: "projects" },
  { id: "ctf",         name: "ctf-scripts", type: "folder", parentId: "projects" },
  { id: "notes",       name: "notes.txt",   type: "file",   parentId: "projects",   ext: "txt", size: "8.9 KB" },
  { id: "nmap",        name: "nmap.sh",     type: "file",   parentId: "tools",      ext: "sh",  size: "2.3 KB" },
  { id: "exploit",     name: "exploit.py",  type: "file",   parentId: "tools",      ext: "py",  size: "12.7 KB" },
  { id: "wordlist",    name: "wordlist.txt", type: "file",  parentId: "tools",      ext: "txt", size: "220 KB" },
  { id: "toolszip",    name: "tools.zip",   type: "file",   parentId: "tools",      ext: "zip", size: "1.4 MB" },
  { id: "creds",       name: "credentials.enc", type: "file", parentId: "top_secret", ext: "enc", size: "0.8 KB" },
  { id: "keys",        name: "ssh_keys.tar.gz", type: "file", parentId: "top_secret", ext: "gz", size: "3.2 KB" },
  { id: "flag",        name: "flag.txt",    type: "file",   parentId: "top_secret", ext: "txt", size: "0.1 KB" },
];

function getIcon(node: VFSNode) {
  if (node.type === "folder") return Folder;
  const e = node.ext ?? "";
  if (["png","jpg","jpeg","svg","gif"].includes(e)) return ImageIcon;
  if (["zip","gz","tar","iso"].includes(e)) return Archive;
  if (["md","txt","log"].includes(e)) return FileText;
  return File;
}

function getIconColor(node: VFSNode): string {
  if (node.type === "folder") return "#00f0ff";
  const e = node.ext ?? "";
  if (["zip","gz","tar","iso"].includes(e)) return "#fbbf24";
  if (["png","jpg","jpeg","svg"].includes(e)) return "#34d399";
  if (["sh","py","js","ts"].includes(e)) return "#a78bfa";
  if (["enc","key"].includes(e)) return "#f87171";
  return "#94a3b8";
}

// ─── Cloud upload record ──────────────────────────────────────────────────────
interface CloudFile {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  status: "ok";
}

// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastKind = "success" | "error";
interface Toast { id: number; kind: ToastKind; msg: string }

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function FileExplorer({
  onClose, onMinimize, isActive, onFocus, initialX, initialY, zIndex,
}: FileExplorerProps) {
  const [tab, setTab] = useState<"local" | "cloud">("local");

  // ── VFS state ──
  const [currentId, setCurrentId] = useState<string>("root");
  const [breadcrumb, setBreadcrumb] = useState<VFSNode[]>([VFS_NODES[0]]);

  // ── Cloud state ──
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadPhase, setUploadPhase] = useState<"idle" | "encrypting" | "uploading" | "done" | "error">("idle");
  const [cloudFiles, setCloudFiles] = useState<CloudFile[]>(() => {
    try {
      const saved = localStorage.getItem("monix_cloud_files");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastCounter = useRef(0);

  const pushToast = useCallback((kind: ToastKind, msg: string) => {
    const id = ++toastCounter.current;
    setToasts((t) => [...t, { id, kind, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  // ── VFS navigation ──
  const childrenOf = (parentId: string) =>
    VFS_NODES.filter((n) => n.parentId === parentId);

  const navigateTo = (node: VFSNode) => {
    if (node.type !== "folder") return;
    const idx = breadcrumb.findIndex((b) => b.id === node.id);
    if (idx !== -1) {
      setBreadcrumb(breadcrumb.slice(0, idx + 1));
    } else {
      setBreadcrumb([...breadcrumb, node]);
    }
    setCurrentId(node.id);
  };

  const navigateBreadcrumb = (node: VFSNode) => {
    const idx = breadcrumb.findIndex((b) => b.id === node.id);
    setBreadcrumb(breadcrumb.slice(0, idx + 1));
    setCurrentId(node.id);
  };

  // ── Upload logic ──
  const doUpload = useCallback(async (file: File) => {
    const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    const CHAT_ID   = import.meta.env.VITE_TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      pushToast("error", "TELEGRAM CREDENTIALS NOT CONFIGURED");
      setUploadPhase("error");
      setUploadStatus("ERROR: Missing env variables");
      setTimeout(() => { setUploadPhase("idle"); setUploadStatus(null); }, 3000);
      return;
    }

    setUploadPhase("encrypting");
    setUploadStatus("Encrypting payload...");
    await new Promise((r) => setTimeout(r, 1200));

    setUploadPhase("uploading");
    setUploadStatus("Uploading to secure server...");

    try {
      const form = new FormData();
      form.append("chat_id", CHAT_ID);
      form.append("document", file, file.name);
      form.append("caption", `🚨 MONIX OS CLOUD UPLOAD: ${file.name}`);

      const res = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`,
        { method: "POST", body: form }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ description: res.statusText }));
        throw new Error(err?.description ?? "Upload failed");
      }

      const record: CloudFile = {
        id: crypto.randomUUID(),
        name: file.name,
        size: formatBytes(file.size),
        uploadedAt: new Date().toLocaleTimeString(),
        status: "ok",
      };

      setCloudFiles((prev) => {
        const next = [record, ...prev];
        localStorage.setItem("monix_cloud_files", JSON.stringify(next));
        return next;
      });

      setUploadPhase("done");
      setUploadStatus("Upload verified ✓");
      pushToast("success", `${file.name} secured to cloud`);
      setTimeout(() => { setUploadPhase("idle"); setUploadStatus(null); }, 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setUploadPhase("error");
      setUploadStatus(`ERROR: ${msg}`);
      pushToast("error", `Upload failed — ${msg}`);
      setTimeout(() => { setUploadPhase("idle"); setUploadStatus(null); }, 3500);
    }
  }, [pushToast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) doUpload(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) doUpload(file);
  };

  const currentNodes = childrenOf(currentId);

  // ── Accent glow helper ──
  const accentGlow = "0 0 12px rgba(0,240,255,0.35), 0 0 24px rgba(0,240,255,0.12)";

  return (
    <WindowChrome
      title="MONIX Files — Secure File Manager"
      onClose={onClose}
      onMinimize={onMinimize}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX}
      initialY={initialY}
      width={720}
      height={500}
      zIndex={zIndex}
    >
      <div className="flex flex-col h-full bg-[#050505] font-mono overflow-hidden">

        {/* ── Tab Bar ── */}
        <div className="flex items-center border-b border-white/[0.06] bg-[#080808] px-3 pt-2 gap-1 shrink-0">
          {[
            { id: "local" as const,  label: "LOCAL SYSTEM",  icon: <HardDrive size={12} /> },
            { id: "cloud" as const,  label: "CLOUD DRIVE",   icon: <Cloud size={12} /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] tracking-widest transition-all duration-200 rounded-t"
              style={{
                color: tab === t.id ? "#00f0ff" : "rgba(255,255,255,0.3)",
                borderBottom: tab === t.id ? "2px solid #00f0ff" : "2px solid transparent",
                background: tab === t.id ? "rgba(0,240,255,0.05)" : "transparent",
                textShadow: tab === t.id ? "0 0 10px rgba(0,240,255,0.7)" : "none",
                fontWeight: tab === t.id ? 700 : 400,
              }}
            >
              {t.icon}{t.label}
            </button>
          ))}
          <div className="ml-auto text-[9px] text-white/20 tracking-widest pb-1.5">
            MONIX OS · VFS v3.1
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">

            {/* ══ TAB 1: LOCAL VFS ══ */}
            {tab === "local" && (
              <motion.div
                key="local"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
                className="flex h-full"
              >
                {/* Sidebar */}
                <div className="w-36 border-r border-white/[0.05] bg-[#080808] flex flex-col gap-0.5 p-2 overflow-y-auto shrink-0">
                  <div className="text-[9px] text-white/20 tracking-[0.2em] px-2 py-1 mb-1">LOCATIONS</div>
                  {VFS_NODES.filter((n) => n.type === "folder" && n.parentId === null).map((node) => (
                    <button
                      key={node.id}
                      onClick={() => navigateTo(node)}
                      className="flex items-center gap-2 text-[11px] px-2 py-1.5 rounded transition-all w-full text-left"
                      style={{
                        color: currentId === node.id ? "#00f0ff" : "rgba(255,255,255,0.45)",
                        background: currentId === node.id ? "rgba(0,240,255,0.07)" : "transparent",
                        borderLeft: currentId === node.id ? "2px solid #00f0ff" : "2px solid transparent",
                      }}
                    >
                      <Folder size={13} style={{ color: currentId === node.id ? "#00f0ff" : "#475569", flexShrink: 0 }} />
                      <span className="truncate">{node.name}</span>
                    </button>
                  ))}
                  <div className="text-[9px] text-white/20 tracking-[0.2em] px-2 py-1 mt-3 mb-1">QUICK ACCESS</div>
                  {VFS_NODES.filter((n) => n.type === "folder" && n.parentId !== null).slice(0, 4).map((node) => (
                    <button
                      key={node.id}
                      onClick={() => {
                        const parent = VFS_NODES.find((x) => x.id === node.parentId)!;
                        setBreadcrumb([VFS_NODES[0], parent, node]);
                        setCurrentId(node.id);
                      }}
                      className="flex items-center gap-2 text-[10px] px-2 py-1 rounded transition-all w-full text-left"
                      style={{
                        color: currentId === node.id ? "#00ff88" : "rgba(255,255,255,0.3)",
                        background: currentId === node.id ? "rgba(0,255,136,0.06)" : "transparent",
                      }}
                    >
                      <Folder size={11} style={{ color: "#00ff88", opacity: 0.6, flexShrink: 0 }} />
                      <span className="truncate">{node.name}</span>
                    </button>
                  ))}
                </div>

                {/* Main area */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-1 px-4 py-2 border-b border-white/[0.04] bg-[#060606] shrink-0">
                    <Database size={10} className="text-white/20 mr-1" />
                    {breadcrumb.map((node, i) => (
                      <span key={node.id} className="flex items-center gap-1">
                        {i > 0 && <ChevronRight size={10} className="text-white/15" />}
                        <button
                          onClick={() => navigateBreadcrumb(node)}
                          className="text-[10px] tracking-wider transition-all"
                          style={{
                            color: i === breadcrumb.length - 1 ? "#00f0ff" : "rgba(255,255,255,0.35)",
                            textShadow: i === breadcrumb.length - 1 ? "0 0 8px rgba(0,240,255,0.6)" : "none",
                          }}
                        >
                          {node.name}
                        </button>
                      </span>
                    ))}
                    <span className="ml-auto text-[9px] text-white/15 tracking-widest">
                      {currentNodes.length} ITEMS
                    </span>
                  </div>

                  {/* Grid */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {currentNodes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-3 text-white/15">
                        <Shield size={32} />
                        <span className="text-[11px] tracking-widest">EMPTY DIRECTORY</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-5 gap-3">
                        {currentNodes.map((node) => {
                          const Icon = getIcon(node);
                          const color = getIconColor(node);
                          return (
                            <motion.div
                              key={node.id}
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.97 }}
                              onDoubleClick={() => navigateTo(node)}
                              className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg cursor-pointer text-center group"
                              style={{
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.04)",
                                transition: "background 0.15s, border-color 0.15s",
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLDivElement).style.background = "rgba(0,240,255,0.05)";
                                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,240,255,0.15)";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)";
                                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.04)";
                              }}
                            >
                              <Icon
                                size={30}
                                style={{ color, filter: `drop-shadow(0 0 6px ${color}88)` }}
                              />
                              <span className="text-[10px] text-white/70 truncate w-full leading-tight" title={node.name}>
                                {node.name}
                              </span>
                              {node.size && (
                                <span className="text-[9px] text-white/20">{node.size}</span>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ══ TAB 2: CLOUD DRIVE ══ */}
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
                    onDrop={handleDrop}
                    onClick={() => uploadPhase === "idle" && fileInputRef.current?.click()}
                    className="relative rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300"
                    style={{
                      minHeight: 180,
                      background: isDragging
                        ? "rgba(0,240,255,0.08)"
                        : "rgba(0,240,255,0.025)",
                      border: isDragging
                        ? "2px dashed rgba(0,240,255,0.7)"
                        : "2px dashed rgba(0,240,255,0.2)",
                      boxShadow: isDragging ? accentGlow : "none",
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                    />

                    {uploadPhase === "idle" && (
                      <>
                        <div className="flex items-center justify-center w-14 h-14 rounded-full"
                          style={{
                            background: "rgba(0,240,255,0.08)",
                            border: "1px solid rgba(0,240,255,0.2)",
                            boxShadow: "0 0 20px rgba(0,240,255,0.15)",
                          }}>
                          <Upload size={22} style={{ color: "#00f0ff" }} />
                        </div>
                        <div className="text-[11px] tracking-[0.22em] font-bold"
                          style={{ color: "#00f0ff", textShadow: "0 0 12px rgba(0,240,255,0.7)" }}>
                          DECRYPT & UPLOAD TO SECURE CLOUD
                        </div>
                        <div className="text-[10px] text-white/25 tracking-wider">
                          DRAG & DROP OR CLICK TO SELECT
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.04, boxShadow: "0 0 24px rgba(0,240,255,0.5)" }}
                          whileTap={{ scale: 0.97 }}
                          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                          className="flex items-center gap-2 px-6 py-2 rounded-lg text-[11px] tracking-widest font-bold mt-1"
                          style={{
                            background: "linear-gradient(135deg, rgba(0,240,255,0.18), rgba(0,255,136,0.08))",
                            border: "1px solid rgba(0,240,255,0.35)",
                            color: "#00f0ff",
                            boxShadow: "0 0 16px rgba(0,240,255,0.2)",
                          }}
                        >
                          <Upload size={13} />
                          INITIATE UPLOAD
                        </motion.button>
                      </>
                    )}

                    {(uploadPhase === "encrypting" || uploadPhase === "uploading") && (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 size={32} className="animate-spin" style={{ color: "#00f0ff" }} />
                        <div className="text-[12px] tracking-widest font-bold"
                          style={{ color: "#00f0ff", textShadow: "0 0 10px rgba(0,240,255,0.8)" }}>
                          {uploadStatus}
                        </div>
                        <div className="flex gap-1">
                          {[0,1,2,3,4].map((i) => (
                            <motion.div key={i}
                              animate={{ opacity: [0.2, 1, 0.2] }}
                              transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: "#00f0ff" }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {uploadPhase === "done" && (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle size={36} style={{ color: "#00ff88" }} />
                        <div className="text-[12px] tracking-widest font-bold"
                          style={{ color: "#00ff88", textShadow: "0 0 10px rgba(0,255,136,0.8)" }}>
                          {uploadStatus}
                        </div>
                      </div>
                    )}

                    {uploadPhase === "error" && (
                      <div className="flex flex-col items-center gap-2">
                        <XCircle size={36} style={{ color: "#f87171" }} />
                        <div className="text-[11px] tracking-widest font-bold text-center max-w-xs"
                          style={{ color: "#f87171", textShadow: "0 0 10px rgba(248,113,113,0.6)" }}>
                          {uploadStatus}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cloud Registry */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Database size={11} style={{ color: "#00f0ff" }} />
                      <span className="text-[10px] tracking-[0.2em] font-bold"
                        style={{ color: "#00f0ff", opacity: 0.7 }}>
                        CLOUD REGISTRY
                      </span>
                      <span className="ml-auto text-[9px] text-white/20 tracking-widest">
                        SESSION UPLOADS: {cloudFiles.length}
                      </span>
                    </div>

                    {cloudFiles.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-2 rounded-lg"
                        style={{
                          background: "rgba(255,255,255,0.015)",
                          border: "1px solid rgba(255,255,255,0.04)",
                        }}>
                        <AlertTriangle size={20} className="text-white/15" />
                        <span className="text-[10px] text-white/15 tracking-widest">NO UPLOADS THIS SESSION</span>
                      </div>
                    ) : (
                      <div className="rounded-lg overflow-hidden"
                        style={{ border: "1px solid rgba(0,240,255,0.1)", background: "rgba(0,0,0,0.3)" }}>
                        <table className="w-full text-[10px]">
                          <thead>
                            <tr style={{ background: "rgba(0,240,255,0.05)", borderBottom: "1px solid rgba(0,240,255,0.1)" }}>
                              <th className="text-left px-3 py-2 tracking-widest text-white/30 font-normal">FILENAME</th>
                              <th className="text-left px-3 py-2 tracking-widest text-white/30 font-normal">SIZE</th>
                              <th className="text-left px-3 py-2 tracking-widest text-white/30 font-normal">TIME</th>
                              <th className="text-right px-3 py-2 tracking-widest text-white/30 font-normal">STATUS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cloudFiles.map((f, i) => (
                              <motion.tr
                                key={f.id}
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                              >
                                <td className="px-3 py-2 text-white/70 truncate max-w-[200px]">
                                  <span title={f.name}>{f.name}</span>
                                </td>
                                <td className="px-3 py-2 text-white/35">{f.size}</td>
                                <td className="px-3 py-2 text-white/35">{f.uploadedAt}</td>
                                <td className="px-3 py-2 text-right">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] tracking-widest font-bold"
                                    style={{
                                      background: "rgba(0,255,136,0.08)",
                                      border: "1px solid rgba(0,255,136,0.25)",
                                      color: "#00ff88",
                                      boxShadow: "0 0 8px rgba(0,255,136,0.15)",
                                    }}>
                                    <CheckCircle size={8} />
                                    CLOUD SYNC VERIFIED
                                  </span>
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

        {/* ── Toast Layer ── */}
        <div className="fixed bottom-14 right-4 flex flex-col gap-2 pointer-events-none" style={{ zIndex: (zIndex ?? 100) + 50 }}>
          <AnimatePresence>
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 40, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.9 }}
                transition={{ duration: 0.22 }}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-[11px] tracking-wider font-bold shadow-2xl"
                style={{
                  background: t.kind === "success" ? "rgba(0,255,136,0.1)" : "rgba(248,113,113,0.1)",
                  border: t.kind === "success" ? "1px solid rgba(0,255,136,0.35)" : "1px solid rgba(248,113,113,0.35)",
                  color: t.kind === "success" ? "#00ff88" : "#f87171",
                  boxShadow: t.kind === "success"
                    ? "0 0 20px rgba(0,255,136,0.2), 0 8px 32px rgba(0,0,0,0.6)"
                    : "0 0 20px rgba(248,113,113,0.2), 0 8px 32px rgba(0,0,0,0.6)",
                  backdropFilter: "blur(12px)",
                  minWidth: 220,
                  pointerEvents: "auto",
                }}
              >
                {t.kind === "success" ? <CheckCircle size={14} /> : <XCircle size={14} />}
                {t.msg}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </WindowChrome>
  );
}
