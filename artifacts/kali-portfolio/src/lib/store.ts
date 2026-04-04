import { create } from "zustand";

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

interface OSState {
  isLocked: boolean;
  taskbarPosition: TaskbarPosition;
  currentWallpaper: string;
  wallpaperIndex: number;
  wallpapers: string[];
  defaultWallpaper: string;
  osVolume: number;

  setLocked: (locked: boolean) => void;
  setTaskbarPosition: (pos: TaskbarPosition) => void;
  setWallpaper: (path: string) => void;
  cycleWallpaper: () => void;
  resetWallpaper: () => void;
  setDefaultWallpaper: (path: string) => void;
  setOsVolume: (vol: number) => void;
}

export const useOSStore = create<OSState>((set) => ({
  isLocked: false,
  taskbarPosition: "bottom",
  currentWallpaper: DEFAULT_WALLPAPER,
  wallpaperIndex: 3,
  wallpapers: WALLPAPERS,
  defaultWallpaper: DEFAULT_WALLPAPER,
  osVolume: 75,

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
}));
