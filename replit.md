# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### Kali Linux Portfolio (`artifacts/kali-portfolio`)

A pixel-perfect Kali Linux OS desktop environment simulation as a portfolio web app.

**Features:**
- Boot animation with glowing KALI LINUX logo, scrolling kernel messages, and progress bar
- Full desktop environment with wallpaper gradient (Kali dark blue/black theme)
- Top panel with real-time clock, battery indicator (Battery Status API), WiFi status
- Desktop icons: Terminal, Files, Home, GitHub, Trash (double-click to open)
- Draggable windows with window chrome (close/minimize/maximize buttons)
- Fully interactive terminal with commands: help, about, portfolio, skills, github, linkedin, email, resume, ls, neofetch, whoami, pwd, clear, exit
- File Explorer with simulated directory structure and breadcrumb navigation
- Trash window
- Right-click context menu on desktop
- Mobile overlay for small screens
- Fonts: Ubuntu (sans) + Fira Code (mono)
- Color palette: Electric blue (#00a3ff) accents on deep black background, green terminal text

**Browser App (Chrome Clone):**
- Integrated from `/Chrome-browser/` into `src/components/chrome-browser/`
- Components: `Browser.tsx`, `TabBar.tsx`, `NavigationBar.tsx`, `BookmarksBar.tsx`, `BrowserContent.tsx`, `AIPanel.tsx`, `geminiService.ts`, `types.ts`
- Features: Multi-tab, incognito mode, Gemini AI side panel, download/extension/history popovers, Google-style new tab page, AI Mode (chrome://ai), voice input
- Wrapped by `src/components/BrowserApp.tsx` inside `WindowChrome` at 82% × 82% of screen
- Launched via: Start Menu → Browser, Desktop right-click → Open Browser, Desktop icon
- Registered in OS process registry (`PROCESS_INFO: browser`) for Taskbar and Task Manager

**Components:**
- `src/components/BootScreen.tsx` — Boot animation
- `src/components/Desktop.tsx` — Main desktop with window management
- `src/components/TopPanel.tsx` — System tray bar
- `src/components/DesktopIcons.tsx` — Desktop icon grid
- `src/components/Terminal.tsx` — Interactive terminal emulator
- `src/components/FileExplorer.tsx` — File manager window
- `src/components/Trash.tsx` — Trash window
- `src/components/RightClickMenu.tsx` — Desktop context menu
- `src/components/WindowChrome.tsx` — Shared draggable window frame
