import { create } from "zustand";
import wp1 from "@assets/wallpaper_(1)_1775219672789.webp";
import wp2 from "@assets/wallpaper_(2)_1775219672790.webp";
import wp3 from "@assets/wallpaper_(3)_1775219672791.webp";
import wp4 from "@assets/wallpaper_(4)_1775219672791.webp";
import wp5 from "@assets/wallpaper_(5)_1775219718823.webp";
import wp6 from "@assets/wallpaper_(6)_1775219718824.webp";
import wp7 from "@assets/wallpaper_(7)_1775219718825.webp";

export const WALLPAPERS: string[] = [wp1, wp2, wp3, wp4, wp5, wp6, wp7];
export const DEFAULT_WALLPAPER: string = wp1;

export type TaskbarPosition = "top" | "bottom" | "left" | "right";

interface OSState {
  isLocked: boolean;
  taskbarPosition: TaskbarPosition;
  currentWallpaper: string;
  wallpaperIndex: number;
  wallpapers: string[];

  setLocked: (locked: boolean) => void;
  setTaskbarPosition: (pos: TaskbarPosition) => void;
  setWallpaper: (path: string) => void;
  cycleWallpaper: () => void;
  resetWallpaper: () => void;
}

export const useOSStore = create<OSState>((set) => ({
  isLocked: false,
  taskbarPosition: "bottom",
  currentWallpaper: DEFAULT_WALLPAPER,
  wallpaperIndex: 0,
  wallpapers: WALLPAPERS,

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
    set({ currentWallpaper: DEFAULT_WALLPAPER, wallpaperIndex: 0 }),
}));
