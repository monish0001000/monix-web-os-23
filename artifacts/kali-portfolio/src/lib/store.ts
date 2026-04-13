import { create } from "zustand";
import { type VFSNode, scanStorage } from "./vfsUtils";

export interface AuraMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

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
  pid: string;
  isMinimized: boolean;
  isMaximized: boolean;
  launchedAt: number;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

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

  localFileSystem: VFSNode[];
  preloadLocalFS: () => void;

  // Window focus tracking
  focusedWindowId: string;
  highestZIndex: number;

  // Process management
  activeProcesses: OSProcess[];
  registerProcess: (proc: Pick<OSProcess, "id" | "name" | "icon" | "pid" | "isMinimized" | "launchedAt"> & Partial<Pick<OSProcess, "isMaximized" | "zIndex" | "x" | "y" | "width" | "height">>) => void;
  unregisterProcess: (id: string) => void;
  updateProcessMinimized: (id: string, minimized: boolean) => void;
  focusWindow: (id: string) => void;
  updateWindowBounds: (id: string, bounds: Partial<Pick<OSProcess, "x" | "y" | "width" | "height">>) => void;
  toggleMinimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
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

  // AURA global state
  auraMuted: boolean;
  auraWakeActive: boolean;
  auraMessages: AuraMessage[];
  setAuraMuted: (muted: boolean) => void;
  setAuraWakeActive: (active: boolean) => void;
  addAuraMessage: (msg: AuraMessage) => void;
  clearAuraMessages: () => void;
}

export const useOSStore = create<OSState>((set, get) => ({
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

  localFileSystem: [],
  preloadLocalFS: () => set({ localFileSystem: scanStorage() }),

  focusedWindowId: "",
  highestZIndex: 20,

  activeProcesses: [],

  registerProcess: (proc) =>
    set((state) => {
      if (state.activeProcesses.some((p) => p.id === proc.id)) return {};
      const zIndex = state.highestZIndex + 1;
      return {
        highestZIndex: zIndex,
        focusedWindowId: proc.id,
        activeProcesses: [
          ...state.activeProcesses,
          {
            isMaximized: false,
            zIndex,
            x: 100,
            y: 60,
            width: 700,
            height: 450,
            ...proc,
          },
        ],
      };
    }),

  unregisterProcess: (id) =>
    set((state) => ({
      activeProcesses: state.activeProcesses.filter((p) => p.id !== id),
      focusedWindowId: state.focusedWindowId === id ? "" : state.focusedWindowId,
    })),

  updateProcessMinimized: (id, minimized) =>
    set((state) => ({
      activeProcesses: state.activeProcesses.map((p) =>
        p.id === id ? { ...p, isMinimized: minimized } : p
      ),
    })),

  focusWindow: (id) =>
    set((state) => {
      const zIndex = state.highestZIndex + 1;
      return {
        highestZIndex: zIndex,
        focusedWindowId: id,
        activeProcesses: state.activeProcesses.map((p) =>
          p.id === id ? { ...p, zIndex, isMinimized: false } : p
        ),
      };
    }),

  updateWindowBounds: (id, bounds) =>
    set((state) => ({
      activeProcesses: state.activeProcesses.map((p) =>
        p.id === id ? { ...p, ...bounds } : p
      ),
    })),

  toggleMinimize: (id) =>
    set((state) => ({
      activeProcesses: state.activeProcesses.map((p) =>
        p.id === id ? { ...p, isMinimized: !p.isMinimized } : p
      ),
    })),

  toggleMaximize: (id) =>
    set((state) => ({
      activeProcesses: state.activeProcesses.map((p) =>
        p.id === id ? { ...p, isMaximized: !p.isMaximized } : p
      ),
    })),

  setKillCallback: (cb) => { _killCallbackRef = cb; },

  killProcess: (id) => { _killCallbackRef?.(id); },

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

  // AURA global state
  auraMuted: false,
  auraWakeActive: false,
  auraMessages: [],
  setAuraMuted: (muted) => set({ auraMuted: muted }),
  setAuraWakeActive: (active) => set({ auraWakeActive: active }),
  addAuraMessage: (msg) => set((state) => ({ auraMessages: [...state.auraMessages, msg] })),
  clearAuraMessages: () => set({ auraMessages: [] }),
}));
