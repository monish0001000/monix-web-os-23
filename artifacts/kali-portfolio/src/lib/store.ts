import { create } from "zustand";

import wallpaper1 from "@assets/wallpaper_(1)_1775198057507.png";
import wallpaper2 from "@assets/wallpaper_(2)_1775198057508.png";
import wallpaper3 from "@assets/wallpaper_(3)_1775198057510.png";
import wallpaper4 from "@assets/wallpaper_(4)_1775198057511.png";
import wallpaper5 from "@assets/wallpaper_(5)_1775198057511.png";

export const WALLPAPERS: string[] = [
  wallpaper1,
  wallpaper2,
  wallpaper3,
  wallpaper4,
  wallpaper5,
];

export type TaskbarPosition = "top" | "bottom" | "left" | "right";

interface OSState {
  isLocked: boolean;
  taskbarPosition: TaskbarPosition;
  currentWallpaper: string;
  wallpaperIndex: number;

  setLocked: (locked: boolean) => void;
  setTaskbarPosition: (pos: TaskbarPosition) => void;
  cycleWallpaper: () => void;
}

export const useOSStore = create<OSState>((set) => ({
  isLocked: false,
  taskbarPosition: "bottom",
  currentWallpaper: WALLPAPERS[0],
  wallpaperIndex: 0,

  setLocked: (locked) => set({ isLocked: locked }),

  setTaskbarPosition: (pos) => set({ taskbarPosition: pos }),

  cycleWallpaper: () =>
    set((state) => {
      const nextIndex = (state.wallpaperIndex + 1) % WALLPAPERS.length;
      return { wallpaperIndex: nextIndex, currentWallpaper: WALLPAPERS[nextIndex] };
    }),
}));
