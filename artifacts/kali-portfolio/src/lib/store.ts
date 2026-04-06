import { create } from "zustand";
import { type VFSNode, scanStorage } from "./vfsUtils";

export const WALLPAPERS: string[] = [
  "/wallpaper_1.webp",
  "/wallpaper_2.webp",
  "/wallpaper_3.webp",
  "/wallpaper_4.webp",
  "/wallpaper_5.webp",
  "/wallpaper_6.webp",
  "/wallpaper_7.webp",
];

export const DEFAULT_WALLPAPER: string = WALLPAPERS[3];

export type TaskbarPosition = "top" | "bottom" | "left" | "right";

// ─── Process registry ─────────────────────────────────────────────────────────
export interface OSProcess {
  id: string;
  name: string;
  icon: string;
  pid: string;        // e.g. "0x4A2F"
  isMinimized: boolean;
  launchedAt: number; // timestamp for uptime display
}

// Module-level ref so the kill callback is never stale without causing re-renders
let _killCallbackRef: ((id: string) => void) | null = null;

interface OSState {
  isLocked: boolean;
  taskbarPosition: TaskbarPosition;
  currentWallpaper: string;
  wallpaperIndex: number;
  wallpapers: string[];
  defaultWallpaper: string;
  osVolume: number;
  brightness: number;
  warmth: number;
  cursorStyle: string;
  cursorColor: string;
  themeAccent: string;

  // Virtual File System
  localFileSystem: VFSNode[];
  preloadLocalFS: () => void;

  // Process management
  activeProcesses: OSProcess[];
  registerProcess: (proc: OSProcess) => void;
  unregisterProcess: (id: string) => void;
  updateProcessMinimized: (id: string, minimized: boolean) => void;
  setKillCallback: (cb: (id: string) => void) => void;
  killProcess: (id: string) => void;

  setLocked: (locked: boolean) => void;
  setTaskbarPosition: (pos: TaskbarPosition) => void;
  setWallpaper: (path: string) => void;
  cycleWallpaper: () => void;
  resetWallpaper: () => void;
  setDefaultWallpaper: (path: string) => void;
  setOsVolume: (vol: number) => void;
  setBrightness: (val: number) => void;
  setWarmth: (val: number) => void;
  setCursorStyle: (style: string) => void;
  setCursorColor: (color: string) => void;
  setThemeAccent: (color: string) => void;
}

export const useOSStore = create<OSState>((set) => ({
  isLocked: false,
  taskbarPosition: "bottom",
  currentWallpaper: DEFAULT_WALLPAPER,
  wallpaperIndex: 3,
  wallpapers: WALLPAPERS,
  defaultWallpaper: DEFAULT_WALLPAPER,
  osVolume: 75,
  brightness: 100,
  warmth: 0,
  cursorStyle: "default",
  cursorColor: "#ffffff",
  themeAccent: "#00f0ff",

  // VFS — populated synchronously at boot via scanStorage()
  localFileSystem: [],
  preloadLocalFS: () => set({ localFileSystem: scanStorage() }),

  // ── Process management ─────────────────────────────────────────────────────
  activeProcesses: [],

  registerProcess: (proc) =>
    set((state) => ({
      activeProcesses: state.activeProcesses.some((p) => p.id === proc.id)
        ? state.activeProcesses
        : [...state.activeProcesses, proc],
    })),

  unregisterProcess: (id) =>
    set((state) => ({
      activeProcesses: state.activeProcesses.filter((p) => p.id !== id),
    })),

  updateProcessMinimized: (id, minimized) =>
    set((state) => ({
      activeProcesses: state.activeProcesses.map((p) =>
        p.id === id ? { ...p, isMinimized: minimized } : p
      ),
    })),

  setKillCallback: (cb) => {
    _killCallbackRef = cb;
  },

  killProcess: (id) => {
    _killCallbackRef?.(id);
    // unregisterProcess is called by Desktop's handleCloseWindow
  },

  // ── OS settings ────────────────────────────────────────────────────────────
  setLocked: (locked) => set({ isLocked: locked }),
  setTaskbarPosition: (pos) => set({ taskbarPosition: pos }),

  setWallpaper: (path) =>
    set((state) => ({
      currentWallpaper: path,
      wallpaperIndex: state.wallpapers.indexOf(path),
    })),

  cycleWallpaper: () =>
    set((state) => {
      const nextIndex = (state.wallpaperIndex + 1) % state.wallpapers.length;
      return { wallpaperIndex: nextIndex, currentWallpaper: state.wallpapers[nextIndex] };
    }),

  resetWallpaper: () =>
    set((state) => ({
      currentWallpaper: state.defaultWallpaper,
      wallpaperIndex: state.wallpapers.indexOf(state.defaultWallpaper),
    })),

  setDefaultWallpaper: (path) =>
    set({ defaultWallpaper: path, currentWallpaper: path }),

  setOsVolume: (vol) => set({ osVolume: Math.max(0, Math.min(100, vol)) }),
  setBrightness: (val) => set({ brightness: Math.max(0, Math.min(150, val)) }),
  setWarmth: (val) => set({ warmth: Math.max(0, Math.min(50, val)) }),
  setCursorStyle: (style) => set({ cursorStyle: style }),
  setCursorColor: (color) => set({ cursorColor: color }),
  setThemeAccent: (color) => set({ themeAccent: color }),
}));
