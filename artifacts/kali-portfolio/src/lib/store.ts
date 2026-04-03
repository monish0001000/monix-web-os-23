import { create } from "zustand";

export const WALLPAPERS: string[] = [
  "/wallpaper_1.png",
  "/wallpaper_2.png",
  "/wallpaper_3.png",
  "/wallpaper_4.png",
  "/wallpaper_5.png",
];

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
}

export const useOSStore = create<OSState>((set) => ({
  isLocked: false,
  taskbarPosition: "bottom",
  currentWallpaper: "/wallpaper_1.png",
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
}));
