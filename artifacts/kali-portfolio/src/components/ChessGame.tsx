import { useState, useEffect, useCallback } from "react";
import { Chess, Square, Piece } from "chess.js";

const PIECE_UNICODE: Record<string, string> = {
  wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
};

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

function squareFromCoords(file: number, rank: number): Square {
  return `${FILES[file]}${rank}` as Square;
}

function pieceValue(piece: Piece): number {
  const vals: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  return vals[piece.type] ?? 0;
}

function evaluateBoard(chess: Chess): number {
  let score = 0;
  const board = chess.board();
  const centerBonus: number[][] = [
    [0,0,0,0,0,0,0,0],
    [0,1,1,1,1,1,1,0],
    [0,1,2,2,2,2,1,0],
    [0,1,2,3,3,2,1,0],
    [0,1,2,3,3,2,1,0],
    [0,1,2,2,2,2,1,0],
    [0,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0],
  ];
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const piece = board[r][f];
      if (!piece) continue;
      const val = pieceValue(piece) * 10 + centerBonus[r][f];
      score += piece.color === "b" ? val : -val;
    }
  }
  return score;
}

function minimax(chess: Chess, depth: number, alpha: number, beta: number, maximizing: boolean): number {
  if (depth === 0 || chess.isGameOver()) return evaluateBoard(chess);
  const moves = chess.moves();
  if (maximizing) {
    let best = -Infinity;
    for (const move of moves) {
      chess.move(move);
      best = Math.max(best, minimax(chess, depth - 1, alpha, beta, false));
      chess.undo();
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      chess.move(move);
      best = Math.min(best, minimax(chess, depth - 1, alpha, beta, true));
      chess.undo();
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

function getBestMove(chess: Chess): string | null {
  const moves = chess.moves();
  if (moves.length === 0) return null;
  let bestMove = moves[0];
  let bestScore = -Infinity;
  for (const move of moves) {
    chess.move(move);
    const score = minimax(chess, 2, -Infinity, Infinity, false);
    chess.undo();
    if (score > bestScore) { bestScore = score; bestMove = move; }
  }
  return bestMove;
}

export default function ChessGame() {
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("Your turn (White)");
  const [thinking, setThinking] = useState(false);
  const [capturedWhite, setCapturedWhite] = useState<string[]>([]);
  const [capturedBlack, setCapturedBlack] = useState<string[]>([]);
  const [promotionPending, setPromotionPending] = useState<{ from: Square; to: Square } | null>(null);

  const updateStatus = useCallback((g: Chess) => {
    if (g.isCheckmate()) setStatus(g.turn() === "w" ? "Checkmate! AI wins." : "Checkmate! You win! 🎉");
    else if (g.isDraw()) setStatus("Draw!");
    else if (g.isCheck()) setStatus(g.turn() === "w" ? "Check! Your move." : "Check!");
    else setStatus(g.turn() === "w" ? "Your turn (White)" : "AI is thinking…");
  }, []);

  const computeCaptures = useCallback((g: Chess) => {
    const hist = g.history({ verbose: true });
    const wb: string[] = [], bb: string[] = [];
    for (const h of hist) {
      if (h.captured) {
        const sym = PIECE_UNICODE[(h.color === "w" ? "b" : "w") + h.captured.toUpperCase()];
        if (h.color === "w") wb.push(sym ?? "");
        else bb.push(sym ?? "");
      }
    }
    setCapturedWhite(wb);
    setCapturedBlack(bb);
  }, []);

  const doAIMove = useCallback((g: Chess) => {
    setThinking(true);
    setTimeout(() => {
      const fresh = new Chess(g.fen());
      const best = getBestMove(fresh);
      if (best) {
        const result = fresh.move(best);
        if (result) {
          setLastMove({ from: result.from as Square, to: result.to as Square });
          setHistory(fresh.history());
          computeCaptures(fresh);
          updateStatus(fresh);
        }
        setGame(fresh);
      }
      setThinking(false);
    }, 300);
  }, [computeCaptures, updateStatus]);

  useEffect(() => {
    if (game.turn() === "b" && !game.isGameOver() && !thinking) {
      doAIMove(game);
    }
  }, [game, thinking, doAIMove]);

  const handleSquareClick = (sq: Square) => {
    if (game.turn() !== "w" || game.isGameOver() || thinking) return;

    if (promotionPending) return;

    if (selected) {
      if (legalMoves.includes(sq)) {
        const piece = game.get(selected);
        const isPromotion = piece?.type === "p" && piece.color === "w" && sq[1] === "8";
        if (isPromotion) {
          setPromotionPending({ from: selected, to: sq });
          setSelected(null);
          setLegalMoves([]);
          return;
        }
        const fresh = new Chess(game.fen());
        const result = fresh.move({ from: selected, to: sq });
        if (result) {
          setLastMove({ from: result.from as Square, to: result.to as Square });
          setHistory(fresh.history());
          computeCaptures(fresh);
          updateStatus(fresh);
          setGame(fresh);
        }
        setSelected(null);
        setLegalMoves([]);
      } else {
        const piece = game.get(sq);
        if (piece && piece.color === "w") {
          setSelected(sq);
          setLegalMoves(game.moves({ square: sq, verbose: true }).map((m) => m.to as Square));
        } else {
          setSelected(null);
          setLegalMoves([]);
        }
      }
    } else {
      const piece = game.get(sq);
      if (piece && piece.color === "w") {
        setSelected(sq);
        setLegalMoves(game.moves({ square: sq, verbose: true }).map((m) => m.to as Square));
      }
    }
  };

  const handlePromotion = (piece: "q" | "r" | "b" | "n") => {
    if (!promotionPending) return;
    const fresh = new Chess(game.fen());
    const result = fresh.move({ from: promotionPending.from, to: promotionPending.to, promotion: piece });
    if (result) {
      setLastMove({ from: result.from as Square, to: result.to as Square });
      setHistory(fresh.history());
      computeCaptures(fresh);
      updateStatus(fresh);
      setGame(fresh);
    }
    setPromotionPending(null);
  };

  const resetGame = () => {
    const fresh = new Chess();
    setGame(fresh);
    setSelected(null);
    setLegalMoves([]);
    setLastMove(null);
    setHistory([]);
    setStatus("Your turn (White)");
    setCapturedWhite([]);
    setCapturedBlack([]);
    setPromotionPending(null);
    setThinking(false);
  };

  const board = game.board();
  const isGameOver = game.isGameOver();

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "linear-gradient(135deg, #0a0a12 0%, #0d1a0d 100%)",
        fontFamily: "'Ubuntu Mono', 'Courier New', monospace",
        overflow: "hidden",
      }}
    >
      {/* Board area */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: "0 0 auto", padding: "16px 8px 16px 16px" }}>
        {/* Captured by white */}
        <div style={{ height: 22, display: "flex", alignItems: "center", gap: 2, marginBottom: 4, fontSize: 15 }}>
          {capturedWhite.map((p, i) => <span key={i} style={{ opacity: 0.8 }}>{p}</span>)}
        </div>

        {/* Board */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(8, 52px)",
            gridTemplateRows: "repeat(8, 52px)",
            border: "2px solid rgba(0,255,136,0.35)",
            boxShadow: "0 0 30px rgba(0,255,136,0.15), 0 0 60px rgba(0,0,0,0.8)",
            position: "relative",
          }}
        >
          {RANKS.map((rank, ri) =>
            FILES.map((_, fi) => {
              const sq = squareFromCoords(fi, rank);
              const piece = board[ri][fi];
              const isLight = (ri + fi) % 2 === 0;
              const isSelected = selected === sq;
              const isLegal = legalMoves.includes(sq);
              const isLastFrom = lastMove?.from === sq;
              const isLastTo = lastMove?.to === sq;
              const isCheck = game.isCheck() && piece?.type === "k" && piece.color === game.turn();

              let bg = isLight ? "#1e3a1e" : "#0d1f0d";
              if (isLastFrom || isLastTo) bg = isLight ? "#3a5c1a" : "#2a4a0a";
              if (isSelected) bg = "#1a4a3a";
              if (isCheck) bg = "#5a1010";

              return (
                <div
                  key={sq}
                  onClick={() => handleSquareClick(sq)}
                  style={{
                    width: 52,
                    height: 52,
                    background: bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: piece?.color === "w" && game.turn() === "w" && !isGameOver ? "pointer" : isLegal ? "pointer" : "default",
                    position: "relative",
                    transition: "background 0.1s",
                    userSelect: "none",
                  }}
                >
                  {/* Rank labels */}
                  {fi === 0 && (
                    <span style={{ position: "absolute", top: 2, left: 2, fontSize: 9, color: isLight ? "#4a8a4a" : "#2a6a2a", fontWeight: 600 }}>
                      {rank}
                    </span>
                  )}
                  {/* File labels */}
                  {ri === 7 && (
                    <span style={{ position: "absolute", bottom: 2, right: 2, fontSize: 9, color: isLight ? "#4a8a4a" : "#2a6a2a", fontWeight: 600 }}>
                      {FILES[fi]}
                    </span>
                  )}

                  {/* Legal move dot */}
                  {isLegal && !piece && (
                    <div style={{
                      width: 14, height: 14, borderRadius: "50%",
                      background: "rgba(0,255,136,0.45)",
                      boxShadow: "0 0 8px rgba(0,255,136,0.6)",
                    }} />
                  )}
                  {isLegal && piece && (
                    <div style={{
                      position: "absolute", inset: 0, borderRadius: 0,
                      border: "2px solid rgba(0,255,136,0.6)",
                      boxShadow: "inset 0 0 8px rgba(0,255,136,0.2)",
                      pointerEvents: "none",
                    }} />
                  )}

                  {/* Piece */}
                  {piece && (
                    <span
                      style={{
                        fontSize: 34,
                        lineHeight: 1,
                        color: piece.color === "w" ? "#e8ffe8" : "#1a1a1a",
                        textShadow: piece.color === "w"
                          ? "0 0 8px rgba(0,255,136,0.5), 1px 1px 0 rgba(0,80,40,0.8)"
                          : "0 1px 0 rgba(255,255,255,0.1), 0 0 6px rgba(0,0,0,0.9)",
                        filter: isSelected ? "drop-shadow(0 0 6px rgba(0,255,200,0.9))" : undefined,
                        transition: "filter 0.1s",
                        zIndex: 1,
                        position: "relative",
                      }}
                    >
                      {PIECE_UNICODE[piece.color + piece.type.toUpperCase()] ?? ""}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Captured by black */}
        <div style={{ height: 22, display: "flex", alignItems: "center", gap: 2, marginTop: 4, fontSize: 15 }}>
          {capturedBlack.map((p, i) => <span key={i} style={{ opacity: 0.8 }}>{p}</span>)}
        </div>
      </div>

      {/* Side panel */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "16px 16px 16px 8px",
          gap: 10,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {/* Title */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#00ff88", letterSpacing: "0.1em", textTransform: "uppercase", textShadow: "0 0 10px rgba(0,255,136,0.5)" }}>
            Monix Grandmaster
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>Chess Engine · Depth 2</div>
        </div>

        {/* Status */}
        <div
          style={{
            padding: "8px 10px",
            background: isGameOver ? "rgba(255,80,80,0.12)" : thinking ? "rgba(0,196,255,0.1)" : "rgba(0,255,136,0.08)",
            border: `1px solid ${isGameOver ? "rgba(255,80,80,0.3)" : thinking ? "rgba(0,196,255,0.3)" : "rgba(0,255,136,0.25)"}`,
            borderRadius: 6,
            fontSize: 12,
            color: isGameOver ? "#ff8080" : thinking ? "#00c4ff" : "#00ff88",
            fontWeight: 600,
            textShadow: `0 0 8px ${isGameOver ? "rgba(255,80,80,0.4)" : thinking ? "rgba(0,196,255,0.4)" : "rgba(0,255,136,0.4)"}`,
          }}
        >
          {thinking ? "⚙ AI thinking…" : status}
        </div>

        {/* Players */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 5, border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#1a1a1a", border: "2px solid rgba(0,255,136,0.4)", flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", flex: 1 }}>AI (Black)</span>
            <span style={{ fontSize: 10, color: "#00c4ff" }}>{capturedBlack.join("")}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "rgba(0,255,136,0.05)", borderRadius: 5, border: `1px solid ${game.turn() === "w" ? "rgba(0,255,136,0.3)" : "rgba(255,255,255,0.07)"}` }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#e8ffe8", border: "2px solid rgba(0,255,136,0.6)", flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", flex: 1 }}>You (White)</span>
            <span style={{ fontSize: 10, color: "#00ff88" }}>{capturedWhite.join("")}</span>
          </div>
        </div>

        {/* Move history */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Move History</div>
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 5,
              padding: "6px 8px",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            {history.length === 0 ? (
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>No moves yet…</span>
            ) : (
              Array.from({ length: Math.ceil(history.length / 2) }, (_, i) => (
                <div key={i} style={{ display: "flex", gap: 4, fontSize: 11 }}>
                  <span style={{ color: "rgba(255,255,255,0.25)", minWidth: 18 }}>{i + 1}.</span>
                  <span style={{ color: "#90d090", minWidth: 40 }}>{history[i * 2]}</span>
                  {history[i * 2 + 1] && <span style={{ color: "rgba(255,255,255,0.55)" }}>{history[i * 2 + 1]}</span>}
                </div>
              ))
            )}
          </div>
        </div>

        {/* New Game button */}
        <button
          onClick={resetGame}
          style={{
            padding: "9px 0",
            background: "rgba(0,255,136,0.1)",
            border: "1px solid rgba(0,255,136,0.4)",
            borderRadius: 6,
            color: "#00ff88",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            transition: "all 0.15s",
            textShadow: "0 0 8px rgba(0,255,136,0.5)",
            boxShadow: "0 0 12px rgba(0,255,136,0.08)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(0,255,136,0.2)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(0,255,136,0.2)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(0,255,136,0.1)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 12px rgba(0,255,136,0.08)";
          }}
        >
          ⟳ New Game
        </button>
      </div>

      {/* Promotion modal */}
      {promotionPending && (
        <div
          style={{
            position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 100, backdropFilter: "blur(4px)",
          }}
        >
          <div style={{
            background: "rgba(10,20,10,0.98)", border: "1px solid rgba(0,255,136,0.4)",
            borderRadius: 10, padding: "20px 24px", textAlign: "center",
            boxShadow: "0 0 40px rgba(0,255,136,0.2)",
          }}>
            <div style={{ fontSize: 13, color: "#00ff88", marginBottom: 14, fontWeight: 700, letterSpacing: "0.08em" }}>PROMOTE PAWN</div>
            <div style={{ display: "flex", gap: 10 }}>
              {(["q", "r", "b", "n"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePromotion(p)}
                  style={{
                    width: 52, height: 52, fontSize: 32, background: "rgba(0,255,136,0.1)",
                    border: "1px solid rgba(0,255,136,0.35)", borderRadius: 6, cursor: "pointer",
                    color: "#e8ffe8", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {PIECE_UNICODE["w" + p.toUpperCase()]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
