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
}

type LineType = 'output' | 'input' | 'welcome';

interface TerminalLine {
  type: LineType;
  content: string;
}

const WELCOME_BANNER = [
  "  _  __    _    _     ___",
  " | |/ /   / \\  | |   |_ _|",
  " | ' /   / _ \\ | |    | |",
  " | . \\  / ___ \\| |___ | |",
  " |_|\\_\\/_/   \\_\\_____|___|",
  "",
  "Welcome!! I'm Monish",
  "Type 'help' to see available commands.",
  ""
];

const HELP_TEXT = [
  "Available commands:",
  "  about     - learn more about me",
  "  portfolio - view my projects",
  "  skills    - list my technical skills",
  "  github    - open my GitHub profile",
  "  linkedin  - open my LinkedIn profile",
  "  email     - get my contact email",
  "  resume    - view my resume",
  "  ls        - list directory contents",
  "  neofetch  - system information",
  "  whoami    - print current user",
  "  pwd       - print working directory",
  "  clear     - clear terminal screen",
  "  exit      - close terminal"
];

const ABOUT_TEXT = [
  "Hi, I'm Monish.",
  "I'm a passionate developer focused on building secure, scalable applications.",
  "I love working with Linux, exploring systems, and crafting excellent user experiences."
];

const PORTFOLIO_TEXT = [
  "Projects:",
  "  1. Kali Portfolio - A full OS simulation in the browser (You are looking at it)",
  "  2. SecureChat - End-to-end encrypted messaging app",
  "  3. AutoDeploy - CI/CD pipeline automation tool"
];

const SKILLS_TEXT = [
  "Skills:",
  "  Languages: TypeScript, Python, Bash, C++",
  "  Frontend:  React, Next.js, Tailwind CSS",
  "  Backend:   Node.js, Express, PostgreSQL",
  "  Tools:     Git, Docker, Linux, AWS"
];

export default function Terminal({ onClose, onMinimize, isActive, onFocus, initialX, initialY, zIndex }: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>(
    WELCOME_BANNER.map(content => ({ type: 'welcome', content }))
  );
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  const getUptime = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    return `${mins} mins, ${secs} secs`;
  };

  const handleCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim();
    
    if (!trimmedCmd) return [];

    const lowerCmd = trimmedCmd.toLowerCase();
    
    switch (lowerCmd) {
      case 'help': return HELP_TEXT;
      case 'about': return ABOUT_TEXT;
      case 'portfolio': return PORTFOLIO_TEXT;
      case 'skills': return SKILLS_TEXT;
      case 'github':
        window.open('https://github.com/monishpkp', '_blank');
        return ["Opening GitHub profile..."];
      case 'linkedin':
        window.open('https://linkedin.com', '_blank');
        return ["Opening LinkedIn profile..."];
      case 'email':
        return ["Email: monish@example.com"];
      case 'resume':
        return ["Resume available at /documents/resume.pdf"];
      case 'ls':
        return ["Desktop  Documents  Downloads  Pictures  Projects"];
      case 'neofetch':
        return [
          "monish@kali",
          "-----------",
          "OS: Kali Linux x86_64 (Web Edition)",
          "Host: Browser",
          `Uptime: ${getUptime()}`,
          "Packages: 1337 (dpkg)",
          "Shell: bash 5.2.15",
          "Terminal: xterm-web",
          "CPU: WebAssembly Virtual CPU",
          "Memory: 1024MiB / 4096MiB"
        ];
      case 'whoami': return ["monish"];
      case 'pwd': return ["/home/monish"];
      case 'exit':
        setTimeout(onClose, 300);
        return ["logout"];
      case 'clear':
        setLines([]);
        return [];
      default:
        return [`bash: ${trimmedCmd}: command not found`];
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const currentInput = input;
      
      if (currentInput.trim()) {
        setHistory(prev => [...prev, currentInput]);
        setHistoryIndex(-1);
      }

      setLines(prev => [...prev, { type: 'input', content: currentInput }]);
      
      const output = handleCommand(currentInput);
      
      if (output.length > 0) {
        setLines(prev => [
          ...prev, 
          ...output.map(content => ({ type: 'output' as LineType, content }))
        ]);
      }
      
      setInput("");
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput("");
      }
    }
  };

  return (
    <WindowChrome
      title="monish@kali: ~"
      onClose={onClose}
      onMinimize={onMinimize}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX}
      initialY={initialY}
      width={700}
      height={450}
      zIndex={zIndex}
    >
      <div 
        ref={containerRef}
        className="w-full h-full bg-[#0d0d0d] p-3 font-mono text-sm text-green-400 overflow-y-auto"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex flex-col">
          {lines.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap break-all leading-snug mb-1">
              {line.type === 'input' && <span className="text-green-400">monish@kali:~$ </span>}
              <span className={line.type === 'input' ? 'text-white' : 'text-green-400'}>
                {line.content}
              </span>
            </div>
          ))}
          <div className="flex items-center whitespace-pre mt-1">
            <span className="text-green-400 shrink-0">monish@kali:~$ </span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-none outline-none text-white flex-1 font-mono text-sm ml-1"
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        </div>
      </div>
    </WindowChrome>
  );
}
