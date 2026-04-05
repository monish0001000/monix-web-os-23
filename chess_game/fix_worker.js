import fs from 'fs';

let content = fs.readFileSync('src/pages/MonixChess.tsx', 'utf-8');

// 1. Add import
content = content.replace('} from "lucide-react";\n', '} from "lucide-react";\nimport AIWorker from "./chess.worker?worker";\n');

// 2. Remove AI functions
const p1 = content.indexOf('function evaluate(game: Chess');
const p2 = content.indexOf('// ─── Difficulty Config');
if (p1 !== -1 && p2 !== -1) {
  content = content.slice(0, p1) + content.slice(p2);
}

// 3. Add worker ref inside MonixChess()
const aiTimerStr = '  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);';
content = content.replace(aiTimerStr, aiTimerStr + '\n  const aiWorker = useRef<Worker | null>(null);\n\n  useEffect(() => {\n    return () => {\n      if (aiWorker.current) aiWorker.current.terminate();\n    };\n  }, []);');

// 4. Update doAiMove
const doAiMoveStr = `  const doAiMove = useCallback(() => {
    if (chess.isGameOver() || isAiThinking) return;
    setIsAiThinking(true);
    setHint(null);
    const aiColor = (gameState.playerColor === "w" ? "b" : "w") as Color;
    aiTimerRef.current = setTimeout(() => {
      const move = getBestMove(chess, diff.depth, aiColor);
      if (move) { chess.move(move); syncBoard(); checkGameOver(); }
      setIsAiThinking(false);
    }, 80);
  }, [chess, diff.depth, gameState.playerColor, isAiThinking, syncBoard, checkGameOver]);`;

const doAiMoveRepl = `  const doAiMove = useCallback(() => {
    if (chess.isGameOver() || isAiThinking) return;
    setIsAiThinking(true);
    setHint(null);
    const aiColor = (gameState.playerColor === "w" ? "b" : "w") as Color;
    
    if (!aiWorker.current) aiWorker.current = new AIWorker();
    
    aiWorker.current.onmessage = (e) => {
      if (e.data.messageId !== "doAiMove") return;
      const move = e.data.move;
      if (move) { chess.move(move); syncBoard(); checkGameOver(); }
      setIsAiThinking(false);
    };
    
    aiWorker.current.postMessage({ fen: chess.fen(), depth: diff.depth, aiColor, messageId: "doAiMove" });
  }, [chess, diff.depth, gameState.playerColor, isAiThinking, syncBoard, checkGameOver]);`;

content = content.replace(doAiMoveStr, doAiMoveRepl);

// 5. Update handleHint
const handleHintStr = `  const handleHint = useCallback(() => {
    if (!isPlayerTurn() || isAiThinking) return;
    const m = getBestMove(chess, Math.max(diff.depth, 2), chess.turn() as Color);
    if (m) setHint({ from: m.from as Square, to: m.to as Square });
  }, [chess, diff.depth, isPlayerTurn, isAiThinking]);`;

const handleHintRepl = `  const handleHint = useCallback(() => {
    if (!isPlayerTurn() || isAiThinking) return;
    
    if (!aiWorker.current) aiWorker.current = new AIWorker();
    
    aiWorker.current.onmessage = (e) => {
      if (e.data.messageId !== "handleHint") return;
      const m = e.data.move;
      if (m) setHint({ from: m.from as Square, to: m.to as Square });
    };
    
    aiWorker.current.postMessage({ fen: chess.fen(), depth: Math.max(diff.depth, 2), aiColor: chess.turn(), messageId: "handleHint" });
  }, [chess, diff.depth, isPlayerTurn, isAiThinking]);`;

content = content.replace(handleHintStr, handleHintRepl);

fs.writeFileSync('src/pages/MonixChess.tsx', content);
console.log('Fixed MonixChess.tsx successfully');
