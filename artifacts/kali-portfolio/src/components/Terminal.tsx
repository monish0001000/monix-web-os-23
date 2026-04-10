import { useState, useEffect, useRef } from "react";
import WindowChrome from "./WindowChrome";

interface TerminalProps {
  onClose: () => void;
  onMinimize?: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
  onOpenWindow?: (id: string) => void;
}

type LineType = "output" | "input" | "welcome" | "error" | "root-input";

interface TerminalLine {
  type: LineType;
  content: string;
  isHtml?: boolean;
}

const WELCOME_LINES: TerminalLine[] = [
  { type: "welcome", content: "  ███╗   ███╗ ██████╗ ███╗   ██╗██╗██╗  ██╗" },
  { type: "welcome", content: "  ████╗ ████║██╔═══██╗████╗  ██║██║╚██╗██╔╝" },
  { type: "welcome", content: "  ██╔████╔██║██║   ██║██╔██╗ ██║██║ ╚███╔╝ " },
  { type: "welcome", content: "  ██║╚██╔╝██║██║   ██║██║╚██╗██║██║ ██╔██╗ " },
  { type: "welcome", content: "  ██║ ╚═╝ ██║╚██████╔╝██║ ╚████║██║██╔╝ ██╗" },
  { type: "welcome", content: "  ╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝╚═╝  ╚═╝" },
  { type: "welcome", content: "" },
  { type: "welcome", content: "  MONIX OS v1.0.0  ──  cybersecurity student & developer" },
  { type: "welcome", content: "  Type 'help' for available commands." },
  { type: "welcome", content: "" },
];

const NEOFETCH_ART = [
  "  ███╗   ███╗ ██████╗ ███╗   ██╗██╗██╗  ██╗",
  "  ████╗ ████║██╔═══██╗████╗  ██║██║╚██╗██╔╝",
  "  ██╔████╔██║██║   ██║██╔██╗ ██║██║ ╚███╔╝ ",
  "  ██║╚██╔╝██║██║   ██║██║╚██╗██║██║ ██╔██╗ ",
  "  ██║ ╚═╝ ██║╚██████╔╝██║ ╚████║██║██╔╝ ██╗",
  "  ╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝╚═╝  ╚═╝",
];

const VALID_APP_IDS: Record<string, string> = {
  browser: "browser",
  files: "files",
  filemanager: "files",
  github: "github",
  portfolio: "portfolio",
  settings: "settings",
  aura: "aura",
  sentinel: "sentinel",
  cyberchef: "cyberchef",
  codestudio: "codestudio",
  chess: "chess",
  cykrypt: "cykrypt",
  taskmanager: "taskmanager",
  "task-manager": "taskmanager",
  trash: "trash",
};

export default function Terminal({
  onClose,
  onMinimize,
  isActive,
  onFocus,
  initialX,
  initialY,
  zIndex,
  onOpenWindow,
}: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>(WELCOME_LINES);
  const [input, setInput] = useState("");
  const [isRoot, setIsRoot] = useState(false);
  const [matrixMode, setMatrixMode] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (isActive && inputRef.current) inputRef.current.focus();
  }, [isActive]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const getUptime = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    return `${mins}m ${secs}s`;
  };

  const addLines = (newLines: TerminalLine[]) => {
    setLines((prev) => [...prev, ...newLines]);
  };

  const handleCommand = (rawInput: string) => {
    const trimmed = rawInput.trim();
    if (!trimmed) return;

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);
    const fullCmd = parts.join(" ").toLowerCase();

    const inputLine: TerminalLine = {
      type: isRoot ? "root-input" : "input",
      content: trimmed,
    };
    addLines([inputLine]);

    switch (cmd) {
      case "help": {
        addLines([
          { type: "output", content: "" },
          { type: "output", content: "  ┌─────────────────────────────────────────────────────┐" },
          { type: "output", content: "  │              MONIX OS — Available Commands          │" },
          { type: "output", content: "  ├─────────────────┬───────────────────────────────────┤" },
          { type: "output", content: "  │ Command         │ Description                       │" },
          { type: "output", content: "  ├─────────────────┼───────────────────────────────────┤" },
          { type: "output", content: "  │ help            │ Show this help table               │" },
          { type: "output", content: "  │ about           │ About Monish                       │" },
          { type: "output", content: "  │ portfolio       │ View projects                      │" },
          { type: "output", content: "  │ skills          │ List technical skills              │" },
          { type: "output", content: "  │ github          │ Open GitHub profile                │" },
          { type: "output", content: "  │ linkedin        │ Open LinkedIn                      │" },
          { type: "output", content: "  │ email           │ Show contact email                 │" },
          { type: "output", content: "  │ whoami          │ Print current user                 │" },
          { type: "output", content: "  │ date            │ Print current date & time          │" },
          { type: "output", content: "  │ ls              │ List directory contents            │" },
          { type: "output", content: "  │ pwd             │ Print working directory            │" },
          { type: "output", content: "  │ neofetch        │ System info with ASCII art         │" },
          { type: "output", content: "  │ sysinfo         │ Alias for neofetch                 │" },
          { type: "output", content: "  │ matrix          │ Toggle matrix mode (neon green)    │" },
          { type: "output", content: "  │ open [app]      │ Open an app (browser, files, …)    │" },
          { type: "output", content: "  │ sudo su         │ Escalate to root                   │" },
          { type: "output", content: "  │ exit            │ Exit root / close terminal         │" },
          { type: "output", content: "  │ clear           │ Clear terminal screen              │" },
          { type: "output", content: "  └─────────────────┴───────────────────────────────────┘" },
          { type: "output", content: "" },
        ]);
        break;
      }

      case "about": {
        addLines([
          { type: "output", content: "" },
          { type: "output", content: "  Hi, I'm Monish." },
          { type: "output", content: "  I'm a cybersecurity student and full-stack developer." },
          { type: "output", content: "  Passionate about Linux, systems programming, and building" },
          { type: "output", content: "  secure, elegant user experiences." },
          { type: "output", content: "" },
        ]);
        break;
      }

      case "portfolio": {
        addLines([
          { type: "output", content: "" },
          { type: "output", content: "  Projects:" },
          { type: "output", content: "  ├─ Kali Portfolio    – Full OS simulation in the browser (you're in it)" },
          { type: "output", content: "  ├─ SecureChat        – End-to-end encrypted messaging" },
          { type: "output", content: "  └─ AutoDeploy        – CI/CD pipeline automation tool" },
          { type: "output", content: "" },
        ]);
        break;
      }

      case "skills": {
        addLines([
          { type: "output", content: "" },
          { type: "output", content: "  Skills:" },
          { type: "output", content: "  ├─ Languages  : TypeScript, Python, Bash, C++" },
          { type: "output", content: "  ├─ Frontend   : React, Next.js, Tailwind CSS" },
          { type: "output", content: "  ├─ Backend    : Node.js, Express, PostgreSQL" },
          { type: "output", content: "  └─ Tools      : Git, Docker, Linux, AWS" },
          { type: "output", content: "" },
        ]);
        break;
      }

      case "github": {
        window.open("https://github.com/monish0001000", "_blank");
        addLines([{ type: "output", content: "  Redirecting to GitHub..." }]);
        break;
      }

      case "linkedin": {
        window.open("https://linkedin.com", "_blank");
        addLines([{ type: "output", content: "  Redirecting to LinkedIn..." }]);
        break;
      }

      case "email": {
        addLines([{ type: "output", content: "  Email: monish@example.com" }]);
        break;
      }

      case "resume": {
        addLines([{ type: "output", content: "  Resume: /documents/resume.pdf" }]);
        break;
      }

      case "whoami": {
        addLines([{ type: "output", content: isRoot ? "  root" : "  monix" }]);
        break;
      }

      case "date": {
        addLines([{ type: "output", content: `  ${new Date().toString()}` }]);
        break;
      }

      case "ls": {
        addLines([
          { type: "output", content: "  Desktop/  Documents/  Downloads/  Pictures/  Projects/" },
        ]);
        break;
      }

      case "pwd": {
        addLines([{ type: "output", content: isRoot ? "  /root" : "  /home/monix" }]);
        break;
      }

      case "clear": {
        setLines([]);
        break;
      }

      case "matrix": {
        const next = !matrixMode;
        setMatrixMode(next);
        addLines([
          {
            type: "output",
            content: next
              ? "  [MATRIX MODE ON]  Wake up, Neo..."
              : "  [MATRIX MODE OFF]  You took the blue pill.",
          },
        ]);
        break;
      }

      case "open": {
        const appArg = args[0]?.toLowerCase() ?? "";
        const appId = VALID_APP_IDS[appArg];
        if (!appId) {
          addLines([
            { type: "error", content: `  open: unknown app '${args[0] ?? ""}'` },
            {
              type: "output",
              content:
                "  Available: browser, files, github, portfolio, settings, aura, sentinel, cyberchef, codestudio, chess, cykrypt, taskmanager, trash",
            },
          ]);
        } else {
          onOpenWindow?.(appId);
          addLines([{ type: "output", content: `  Launching ${appArg}...` }]);
        }
        break;
      }

      case "sudo": {
        if (args[0]?.toLowerCase() === "su") {
          setIsRoot(true);
          addLines([
            { type: "output", content: "  [sudo] password for monix: ••••••••" },
            { type: "output", content: "  Authentication successful. Root privileges granted." },
          ]);
        } else {
          addLines([{ type: "error", content: `  sudo: command '${args.join(" ")}' not found` }]);
        }
        break;
      }

      case "exit": {
        if (isRoot) {
          setIsRoot(false);
          addLines([{ type: "output", content: "  Dropping root privileges..." }]);
        } else {
          addLines([{ type: "output", content: "  logout" }]);
          setTimeout(onClose, 400);
        }
        break;
      }

      case "neofetch":
      case "sysinfo": {
        const stats = [
          `monix@monix-os`,
          `──────────────`,
          `OS       : MONIX WEB OS`,
          `Kernel   : React / Vite`,
          `Uptime   : ${getUptime()}`,
          `Shell    : ZSH 5.9`,
          `Terminal : xterm-web`,
          `Resolution: ${window.innerWidth} x ${window.innerHeight}`,
          `CPU      : WebAssembly Virtual CPU`,
          `Memory   : 1024 MiB / 4096 MiB`,
          `Packages : 1337 (npm)`,
        ];

        const maxArt = NEOFETCH_ART.length;
        const maxStats = stats.length;
        const rows = Math.max(maxArt, maxStats);

        const resultLines: TerminalLine[] = [{ type: "output", content: "" }];
        for (let i = 0; i < rows; i++) {
          const artPart = NEOFETCH_ART[i] ?? "".padEnd(46);
          const statPart = stats[i] ?? "";
          resultLines.push({
            type: "output",
            content: `\u001b[0m`,
            isHtml: true,
          });
          resultLines.push({
            type: "output",
            content: `__NEOFETCH__${artPart}|||${statPart}`,
          });
        }
        resultLines.push({ type: "output", content: "" });
        addLines(resultLines);
        break;
      }

      default: {
        if (fullCmd === "sudo su") {
          setIsRoot(true);
          addLines([
            { type: "output", content: "  [sudo] password for monix: ••••••••" },
            { type: "output", content: "  Authentication successful. Root privileges granted." },
          ]);
        } else {
          addLines([
            { type: "error", content: `  bash: ${cmd}: command not found` },
          ]);
        }
        break;
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const val = input;
      if (val.trim()) {
        setCommandHistory((prev) => [...prev, val]);
        setHistoryIndex(-1);
      }
      setInput("");
      handleCommand(val);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCommandHistory((hist) => {
        if (hist.length === 0) return hist;
        const newIdx =
          historyIndex < hist.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIdx);
        setInput(hist[hist.length - 1 - newIdx]);
        return hist;
      });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIdx = historyIndex - 1;
        setHistoryIndex(newIdx);
        setInput(commandHistory[commandHistory.length - 1 - newIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput("");
      }
    }
  };

  const bgColor = matrixMode ? "bg-black" : "bg-[#0d0d0d]";
  const defaultTextColor = matrixMode ? "text-green-400" : "text-green-400";

  const renderLine = (line: TerminalLine, i: number) => {
    if (line.content.startsWith("__NEOFETCH__")) {
      const rest = line.content.slice("__NEOFETCH__".length);
      const [artPart, statPart] = rest.split("|||");
      return (
        <div key={i} className="flex leading-snug mb-[1px]">
          <span className="text-cyan-400 whitespace-pre font-mono" style={{ minWidth: "47ch" }}>
            {artPart}
          </span>
          <span className="text-green-300 whitespace-pre font-mono ml-4">
            {statPart}
          </span>
        </div>
      );
    }

    if (line.type === "input") {
      return (
        <div key={i} className="whitespace-pre-wrap break-all leading-snug mb-[1px]">
          <span className="text-green-400 select-none">monix@system:~$ </span>
          <span className="text-white">{line.content}</span>
        </div>
      );
    }

    if (line.type === "root-input") {
      return (
        <div key={i} className="whitespace-pre-wrap break-all leading-snug mb-[1px]">
          <span className="text-red-500 select-none">root@system:~# </span>
          <span className="text-white">{line.content}</span>
        </div>
      );
    }

    if (line.type === "error") {
      return (
        <div key={i} className="whitespace-pre-wrap break-all leading-snug mb-[1px]">
          <span className="text-red-400">{line.content}</span>
        </div>
      );
    }

    if (line.type === "welcome") {
      return (
        <div key={i} className="whitespace-pre-wrap break-all leading-snug mb-[1px]">
          <span className={matrixMode ? "text-green-400" : "text-cyan-400"}>{line.content}</span>
        </div>
      );
    }

    return (
      <div key={i} className="whitespace-pre-wrap break-all leading-snug mb-[1px]">
        <span className={matrixMode ? "text-green-400" : "text-green-300"}>{line.content}</span>
      </div>
    );
  };

  return (
    <WindowChrome
      title={isRoot ? "root@system: ~" : "monix@system: ~"}
      onClose={onClose}
      onMinimize={onMinimize}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX}
      initialY={initialY}
      width={760}
      height={480}
      zIndex={zIndex}
    >
      <div
        className={`w-full h-full ${bgColor} p-3 font-mono text-sm ${defaultTextColor} overflow-y-auto`}
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex flex-col">
          {lines.map((line, i) => renderLine(line, i))}

          <div className="flex items-center whitespace-pre mt-1">
            {isRoot ? (
              <span className="text-red-500 shrink-0 select-none">root@system:~# </span>
            ) : (
              <span className="text-green-400 shrink-0 select-none">monix@system:~$ </span>
            )}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-none outline-none text-white flex-1 font-mono text-sm ml-1 caret-green-400"
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
            />
          </div>
          <div ref={bottomRef} />
        </div>
      </div>
    </WindowChrome>
  );
}
