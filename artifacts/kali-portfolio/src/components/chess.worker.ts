import { Chess, PieceSymbol, Color, Square, Move } from "chess.js";

// ─── Piece values & Position tables ─────────────────────────────────────────
const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000,
};

const PST: Record<PieceSymbol, number[]> = {
  p: [0,0,0,0,0,0,0,0,50,50,50,50,50,50,50,50,10,10,20,30,30,20,10,10,5,5,10,25,25,10,5,5,0,0,0,20,20,0,0,0,5,-5,-10,0,0,-10,-5,5,5,10,10,-20,-20,10,10,5,0,0,0,0,0,0,0,0],
  n: [-50,-40,-30,-30,-30,-30,-40,-50,-40,-20,0,0,0,0,-20,-40,-30,0,10,15,15,10,0,-30,-30,5,15,20,20,15,5,-30,-30,0,15,20,20,15,0,-30,-30,5,10,15,15,10,5,-30,-40,-20,0,5,5,0,-20,-40,-50,-40,-30,-30,-30,-30,-40,-50],
  b: [-20,-10,-10,-10,-10,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,10,10,5,0,-10,-10,5,5,10,10,5,5,-10,-10,0,10,10,10,10,0,-10,-10,10,10,10,10,10,10,-10,-10,5,0,0,0,0,5,-10,-20,-10,-10,-10,-10,-10,-10,-20],
  r: [0,0,0,0,0,0,0,0,5,10,10,10,10,10,10,5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,0,0,0,5,5,0,0,0],
  q: [-20,-10,-10,-5,-5,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,5,5,5,0,-10,-5,0,5,5,5,5,0,-5,0,0,5,5,5,5,0,-5,-10,5,5,5,5,5,0,-10,-10,0,5,0,0,0,0,-10,-20,-10,-10,-5,-5,-10,-10,-20],
  k: [-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-20,-30,-30,-40,-40,-30,-30,-20,-10,-20,-20,-20,-20,-20,-20,-10,20,20,0,0,0,0,20,20,20,30,10,0,0,10,30,20],
};

// King safety table for endgame (encourages centralization)
const KING_ENDGAME_PST: number[] = [
  -50,-40,-30,-20,-20,-30,-40,-50,-30,-20,-10,  0,  0,-10,-20,-30,
  -30,-10, 20, 30, 30, 20,-10,-30,-30,-10, 30, 40, 40, 30,-10,-30,
  -30,-10, 30, 40, 40, 30,-10,-30,-30,-10, 30, 40, 40, 30,-10,-30,
  -30,-10, 20, 30, 30, 20,-10,-30,-30,-30,  0,  0,  0,  0,-30,-30,
  -50,-30,-30,-30,-30,-30,-30,-50,
];

// ─── Difficulty profile ───────────────────────────────────────────────────────
interface DifficultyProfile {
  /** 0–1: probability of playing a fully random legal move */
  randomRate: number;
  /** Centipawn noise added to root-level scores (simulates human error) */
  moveNoise: number;
  /** Whether to use piece-square tables in evaluation */
  usePST: boolean;
  /** Whether to run quiescence search at leaf nodes */
  useQuiescence: boolean;
  /** Whether to apply aggressive evaluation (bonus for queens/rooks) */
  aggressive: boolean;
  /** Time budget in ms for iterative deepening */
  timeMs: number;
}

function getPST(piece: PieceSymbol, color: Color, sq: Square, isEndgame: boolean): number {
  const col = sq.charCodeAt(0) - 97;
  const row = 8 - parseInt(sq[1]);
  const idx = color === "w" ? row * 8 + col : (7 - row) * 8 + col;
  if (piece === "k" && isEndgame) return KING_ENDGAME_PST[idx] ?? 0;
  return PST[piece][idx] ?? 0;
}

/** Heuristic: if both sides have less than ~26 points in non-pawn material, it's the endgame */
function isEndgame(game: Chess): boolean {
  let material = 0;
  const b = game.board();
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = b[r][c];
      if (p && p.type !== "p" && p.type !== "k") material += PIECE_VALUES[p.type];
    }
  return material < 2600; // both queens + two rooks ~ 2800, so below that = endgame approaching
}

function evaluate(game: Chess, profile: DifficultyProfile, ply: number = 0): number {
  if (game.isCheckmate()) return game.turn() === "w" ? -99999 + ply : 99999 - ply;
  if (game.isDraw() || game.isStalemate()) return 0;

  let score = 0;
  const b = game.board();
  const endgame = isEndgame(game);

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = b[r][c];
      if (!p) continue;
      const sq = (String.fromCharCode(97 + c) + (8 - r)) as Square;
      let v = PIECE_VALUES[p.type];
      if (profile.usePST) v += getPST(p.type, p.color, sq, endgame);
      if (profile.aggressive && (p.type === "q" || p.type === "r")) v *= 1.2;
      score += p.color === "w" ? v : -v;
    }
  }
  return score;
}

// ─── Search globals (reset per search) ───────────────────────────────────────
let searchStartTime = 0;
let MAX_TIME = 1000;
let nodesChecked = 0;

function checkTimeout() {
  if (++nodesChecked % 512 === 0) {
    if (Date.now() - searchStartTime > MAX_TIME) throw new Error("TIMEOUT");
  }
}

// ─── Quiescence search ────────────────────────────────────────────────────────
function quiescence(
  game: Chess,
  alpha: number,
  beta: number,
  max: boolean,
  profile: DifficultyProfile,
  qDepth: number = 0,
  ply: number = 0
): number {
  checkTimeout();
  const standPat = evaluate(game, profile, ply);
  if (qDepth > 5) return standPat;

  if (max) {
    if (standPat >= beta) return beta;
    if (alpha < standPat) alpha = standPat;
  } else {
    if (standPat <= alpha) return alpha;
    if (beta > standPat) beta = standPat;
  }

  if (game.isGameOver()) return standPat;

  const moves = game.moves({ verbose: true });
  const captures = moves.filter((m: Move) => m.captured);
  if (!captures.length) return standPat;

  // MVV-LVA ordering: most valuable victim, least valuable attacker
  captures.sort(
    (a, b) =>
      (PIECE_VALUES[(b.captured ?? "p") as PieceSymbol] - PIECE_VALUES[b.piece as PieceSymbol]) -
      (PIECE_VALUES[(a.captured ?? "p") as PieceSymbol] - PIECE_VALUES[a.piece as PieceSymbol])
  );

  if (max) {
    let best = standPat;
    for (const m of captures) {
      game.move(m);
      best = Math.max(best, quiescence(game, alpha, beta, false, profile, qDepth + 1, ply + 1));
      game.undo();
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = standPat;
    for (const m of captures) {
      game.move(m);
      best = Math.min(best, quiescence(game, alpha, beta, true, profile, qDepth + 1, ply + 1));
      game.undo();
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

// ─── Move ordering heuristics ─────────────────────────────────────────────────
function scoreMoveForOrdering(m: Move): number {
  let score = 0;
  // Captures: MVV-LVA
  if (m.captured) score += PIECE_VALUES[m.captured as PieceSymbol] * 10 - PIECE_VALUES[m.piece as PieceSymbol];
  // Promotions
  if (m.promotion) score += PIECE_VALUES[m.promotion as PieceSymbol];
  return score;
}

// ─── Minimax with alpha-beta pruning ─────────────────────────────────────────
function minimax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  max: boolean,
  profile: DifficultyProfile,
  ply: number = 0
): number {
  checkTimeout();
  if (game.isGameOver()) return evaluate(game, profile, ply);
  if (depth === 0) {
    return profile.useQuiescence
      ? quiescence(game, alpha, beta, max, profile, 0, ply)
      : evaluate(game, profile, ply);
  }

  const moves = game.moves({ verbose: true });

  // Move ordering: improves alpha-beta cutoffs significantly
  if (profile.usePST) {
    moves.sort((a, b) => scoreMoveForOrdering(b) - scoreMoveForOrdering(a));
  }

  if (max) {
    let best = -Infinity;
    for (const m of moves) {
      game.move(m);
      best = Math.max(best, minimax(game, depth - 1, alpha, beta, false, profile, ply + 1));
      game.undo();
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) {
      game.move(m);
      best = Math.min(best, minimax(game, depth - 1, alpha, beta, true, profile, ply + 1));
      game.undo();
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

// ─── Root search with iterative deepening ─────────────────────────────────────
function getBestMove(
  game: Chess,
  maxDepth: number,
  aiColor: Color,
  profile: DifficultyProfile
): Move {
  const moves = game.moves({ verbose: true });
  // Always guaranteed to have at least one legal move (caller checks isGameOver first)

  // ── Easy/Medium: random blunder injection ────────────────────────────────────
  // Roll dice BEFORE any search — if it lands, just play a random legal move
  if (profile.randomRate > 0 && Math.random() < profile.randomRate) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  searchStartTime = Date.now();
  nodesChecked = 0;
  MAX_TIME = profile.timeMs;

  // Seed best move with a random fallback so we always have something valid
  let overallBestMove: Move = moves[Math.floor(Math.random() * moves.length)];

  // ── Iterative deepening ──────────────────────────────────────────────────────
  for (let d = 1; d <= maxDepth; d++) {
    let bestMoveForDepth: Move | null = null;
    let bestVal = aiColor === "w" ? -Infinity : Infinity;
    let alpha = -Infinity;
    let beta = Infinity;

    try {
      // Move ordering at root: good moves first (captures, checks, etc.)
      if (profile.usePST) {
        moves.sort((a, b) => scoreMoveForOrdering(b) - scoreMoveForOrdering(a));
      }

      for (const m of moves) {
        game.move(m);
        const rawVal = minimax(game, d - 1, alpha, beta, aiColor !== "w", profile, 1);
        game.undo();

        // ── moveNoise: add centipawn noise to simulate human imprecision ────────
        // Applied at root level only so tactical accuracy inside the tree is intact
        const noisyVal = profile.moveNoise > 0
          ? rawVal + (Math.random() - 0.5) * 2 * profile.moveNoise
          : rawVal;

        const isBetter = aiColor === "w" ? noisyVal > bestVal : noisyVal < bestVal;

        if (isBetter || !bestMoveForDepth) {
          bestVal = noisyVal;
          bestMoveForDepth = m;
        }

        if (aiColor === "w") {
          alpha = Math.max(alpha, bestVal);
        } else {
          beta = Math.min(beta, bestVal);
        }
      }

      // Full depth completed — commit this depth's result
      if (bestMoveForDepth) overallBestMove = bestMoveForDepth;
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "TIMEOUT") {
        // Time expired — return the best from the last fully-searched depth
        console.log(`[AI Worker] Timeout at depth ${d}, returning depth-${d - 1} result`);
        break;
      }
      throw e;
    }
  }

  return overallBestMove;
}

// ─── Global uncaught-error handler ───────────────────────────────────────────
self.addEventListener("error", (event: ErrorEvent) => {
  console.error("[chess.worker] Uncaught error:", event.message);
  self.postMessage({ messageId: "__error__", error: event.message });
  event.preventDefault();
});

// ─── Message handler ───────────────────────────────────────────────────────────
self.onmessage = (e: MessageEvent) => {
  const {
    fen,
    depth,
    aiColor,
    messageId,
    timeMs = 600,
    randomRate = 0,
    moveNoise = 0,
    usePST = true,
    useQuiescence = false,
    aggressive = false,
  } = e.data as {
    fen: string;
    depth: number;
    aiColor: Color;
    messageId: string;
    timeMs?: number;
    randomRate?: number;
    moveNoise?: number;
    usePST?: boolean;
    useQuiescence?: boolean;
    aggressive?: boolean;
  };

  try {
    const game = new Chess(fen);

    if (game.turn() !== aiColor) {
      console.warn("[chess.worker] Not AI's turn. Skipping.");
      self.postMessage({ messageId, move: null });
      return;
    }

    if (game.isGameOver()) {
      self.postMessage({ messageId, move: null });
      return;
    }

    const profile: DifficultyProfile = {
      randomRate,
      moveNoise,
      usePST,
      useQuiescence,
      aggressive,
      timeMs,
    };

    const move = getBestMove(game, depth, aiColor, profile);
    self.postMessage({
      messageId,
      move: { from: move.from, to: move.to, promotion: move.promotion },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[chess.worker] Error computing move:", msg);
    self.postMessage({ messageId, move: null, error: msg });
  }
};
