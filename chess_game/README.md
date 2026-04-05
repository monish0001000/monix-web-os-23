# MONIX Chess: Cyber Edition

MONIX Chess is a beautifully crafted, highly responsive web-based chess game built from the ground up to deliver a modern "cyber" aesthetic alongside a powerful, dedicated AI engine.

## ✨ Features
- **Striking Cyber Aesthetic**: Features a custom dark-mode interface with dynamic highlighting, fluid drag-and-drop mechanics, and custom SVG styling.
- **Dedicated Web Worker AI**: Offloads intensive move calculations (minimax with alpha-beta pruning and quiescence search) to a separate UI thread, guaranteeing zero gameplay lag even at maximum depth.
- **Dynamic Move Highlighting**: Instantly visualizes both the origin and destination squares of the latest move for maximum clarity.
- **Post-Game Analysis Mode**: Once a match concludes, enter the "Analyze" phase to seamlessly step back and forth through the entire game history. Review blunders, missed mates, and the exact flow of the board.
- **9 Scaling AI Difficulties**:
  - **Beginner to Hard**: Purposefully noisy evaluations and injected random moves to simulate real low-tier human play.
  - **Expert to Grandmaster**: Clean heuristic evaluations scaling from 3 to 4 plies deep.
  - **Monish Level (Insane)**: The ultimate chess challenge. A 6-ply search depth combined with quiescence tactic checks and an aggressive king-hunting profile.

## 🎮 How to Play
1. **Choose Your Mode**: Play against the Computer (PvE) or grab a friend for a local 2-player match (PvP).
2. **Select Difficulty**: If playing the computer, select an AI tier ranging from *Easy* (plays randomly) to *Monish* (max depth, highly aggressive).
3. **Controls**:
   - **Click / Drag**: Move pieces intuitively.
   - **Undo**: Roll back a mistake.
   - **Hint**: Ask the engine for the optimal next move.
   - **Review**: Available when the match finishes! Use the `PREV` and `NEXT` buttons below the board to walk through your timeline.

## 🚀 Deployment Guide

You can easily host MONIX Chess online for free so anyone can play. The application is built using Vite and React, making deployment a breeze.

### Vercel (Recommended, Easiest)
1. Push this repository to your GitHub account.
2. Sign in to [Vercel](https://vercel.com/) with GitHub.
3. Click **Add New Project** and select this repository.
4. Keep the framework preset to **Vite** (the build command `npm run build` and output directory `dist` will be auto-detected).
5. Click **Deploy**. Your app will be live with a unique URL in seconds!

### GitHub Pages
1. In your `vite.config.ts`, add the `base` attribute matching your repository name:
```ts
export default defineConfig({
  plugins: [react()],
  worker: { format: 'es' },
  base: '/chess/', // <-- If your repo is named 'chess'
})
```
2. Run `npm install gh-pages --save-dev`.
3. In `package.json` under `"scripts"`, add:
`"predeploy": "npm run build",`
`"deploy": "gh-pages -d dist"`
4. Run `npm run deploy` in your terminal. GitHub will automatically host the `gh-pages` branch.

## 🛠️ Technology Stack
- **React.js**: For a state-driven, component-based user interface.
- **Vite.js**: Lightning-fast compilation and HMR.
- **Chess.js**: For reliable board validation, FEN parsing, and rule generation (en passant, castling).
- **Web Workers API**: For robust, non-blocking asynchronous calculation.
- **TailwindCSS**: Used alongside inline config rendering to style the board components responsively.
