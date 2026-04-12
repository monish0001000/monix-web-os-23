import { useState, useEffect, useRef, useCallback } from "react";
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
  color?: string;
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

function fakeHex(len: number, seed?: string): string {
  const chars = "0123456789abcdef";
  let result = "";
  let n = seed ? seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0) : 0;
  for (let i = 0; i < len; i++) {
    n = (n * 1103515245 + 12345) & 0x7fffffff;
    result += chars[n % 16];
  }
  return result;
}

function fakeIp(base = 168): string {
  return `192.${base}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`;
}

function fakeMs(): string {
  return (Math.random() * 80 + 5).toFixed(1);
}

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [hackMode, setHackMode] = useState(false);

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

  const push = useCallback((...newLines: TerminalLine[]) => {
    setLines((prev) => [...prev, ...newLines]);
  }, []);

  const scheduleLines = useCallback(
    (entries: Array<{ delay: number; line: TerminalLine }>, onDone?: () => void) => {
      setIsProcessing(true);
      const timers: ReturnType<typeof setTimeout>[] = [];
      entries.forEach(({ delay, line }) => {
        timers.push(
          setTimeout(() => {
            setLines((prev) => [...prev, line]);
          }, delay)
        );
      });
      const maxDelay = entries.reduce((m, e) => Math.max(m, e.delay), 0);
      timers.push(
        setTimeout(() => {
          setIsProcessing(false);
          onDone?.();
        }, maxDelay + 50)
      );
    },
    []
  );

  const handleCommand = useCallback(
    (rawInput: string) => {
      const trimmed = rawInput.trim();
      if (!trimmed) return;

      const parts = trimmed.split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);
      const fullCmd = parts.join(" ").toLowerCase();

      push({ type: isRoot ? "root-input" : "input", content: trimmed });

      if (hackMode) {
        if (trimmed === 'flag{m0n1x_r00t}') {
          push(
            { type: "output", content: "" },
            { type: "output", content: "  ██████████████████████████████████████████████", color: "green" },
            { type: "output", content: "  ██  [ACCESS GRANTED] — Welcome back, Admin.  ██", color: "green" },
            { type: "output", content: "  ██████████████████████████████████████████████", color: "green" },
            { type: "output", content: "" },
            { type: "output", content: "  Root override accepted. System lockdown aborted.", color: "green" },
            { type: "output", content: "  All security protocols suspended for 60 seconds.", color: "green" },
            { type: "output", content: "" },
          );
        } else {
          push(
            { type: "output", content: "" },
            { type: "output", content: "  ██████████████████████████", color: "red" },
            { type: "output", content: "  ██  [ACCESS DENIED]      ██", color: "red" },
            { type: "output", content: "  ██████████████████████████", color: "red" },
            { type: "output", content: "" },
            { type: "output", content: "  Invalid flag. Intrusion logged. IP blacklisted.", color: "red" },
            { type: "output", content: "" },
          );
        }
        setHackMode(false);
        return;
      }

      switch (cmd) {
        case "help": {
          push(
            { type: "output", content: "" },
            { type: "output", content: "  ┌──────────────────────┬────────────────────────────────────────┐", color: "cyan" },
            { type: "output", content: "  │     MONIX OS — Commands               (v1.0.0)          │", color: "cyan" },
            { type: "output", content: "  ├──────────────────────┼────────────────────────────────────────┤", color: "cyan" },
            { type: "output", content: "  │ help                 │ Show this table                        │", color: "cyan" },
            { type: "output", content: "  │ about                │ About Monish                           │", color: "cyan" },
            { type: "output", content: "  │ portfolio            │ View projects                          │", color: "cyan" },
            { type: "output", content: "  │ skills               │ Technical skills                       │", color: "cyan" },
            { type: "output", content: "  │ github               │ Open GitHub profile                    │", color: "cyan" },
            { type: "output", content: "  │ linkedin             │ Open LinkedIn                          │", color: "cyan" },
            { type: "output", content: "  │ email                │ Contact email                          │", color: "cyan" },
            { type: "output", content: "  │ whoami               │ Current user                           │", color: "cyan" },
            { type: "output", content: "  │ date                 │ System date & time                     │", color: "cyan" },
            { type: "output", content: "  │ ls                   │ List directory                         │", color: "cyan" },
            { type: "output", content: "  │ pwd                  │ Working directory                      │", color: "cyan" },
            { type: "output", content: "  │ history              │ Command history                        │", color: "cyan" },
            { type: "output", content: "  │ neofetch / sysinfo   │ ASCII art + system info                │", color: "cyan" },
            { type: "output", content: "  │ matrix               │ Toggle neon hacker mode                │", color: "cyan" },
            { type: "output", content: "  │ open [app]           │ Launch an app window                   │", color: "cyan" },
            { type: "output", content: "  ├──────────────────────┼────────────────────────────────────────┤", color: "cyan" },
            { type: "output", content: "  │ ── CRYPTO ──         │                                        │", color: "yellow" },
            { type: "output", content: "  │ base64 encode [text] │ Base64-encode text (btoa)              │", color: "cyan" },
            { type: "output", content: "  │ base64 decode [text] │ Base64-decode text (atob)              │", color: "cyan" },
            { type: "output", content: "  │ hash [text]          │ Simulate SHA-256 hash                  │", color: "cyan" },
            { type: "output", content: "  ├──────────────────────┼────────────────────────────────────────┤", color: "cyan" },
            { type: "output", content: "  │ ── NETWORK ──        │                                        │", color: "yellow" },
            { type: "output", content: "  │ ping [host]          │ Simulate ICMP ping                     │", color: "cyan" },
            { type: "output", content: "  │ nmap [host]          │ Simulate port scan                     │", color: "cyan" },
            { type: "output", content: "  │ traceroute [host]    │ Simulate route tracing                 │", color: "cyan" },
            { type: "output", content: "  │ ifconfig / ipconfig  │ Network interface config               │", color: "cyan" },
            { type: "output", content: "  ├──────────────────────┼────────────────────────────────────────┤", color: "cyan" },
            { type: "output", content: "  │ sudo su              │ Escalate to root                       │", color: "cyan" },
            { type: "output", content: "  │ exit                 │ Drop root / close terminal             │", color: "cyan" },
            { type: "output", content: "  │ clear                │ Clear screen                           │", color: "cyan" },
            { type: "output", content: "  ├──────────────────────┼────────────────────────────────────────┤", color: "cyan" },
            { type: "output", content: "  │ ── MINI CTF ──       │                                        │", color: "red" },
            { type: "output", content: "  │ hack --start         │ Initiate CTF breach sequence           │", color: "red" },
            { type: "output", content: "  └──────────────────────┴────────────────────────────────────────┘", color: "cyan" },
            { type: "output", content: "" }
          );
          break;
        }

        case "about": {
          push(
            { type: "output", content: "" },
            { type: "output", content: "  Hi, I'm Monish." },
            { type: "output", content: "  I'm a cybersecurity student and full-stack developer." },
            { type: "output", content: "  Passionate about Linux, systems programming, and building" },
            { type: "output", content: "  secure, elegant user experiences." },
            { type: "output", content: "" }
          );
          break;
        }

        case "portfolio": {
          push(
            { type: "output", content: "" },
            { type: "output", content: "  Projects:" },
            { type: "output", content: "  ├─ Kali Portfolio    – Full OS simulation in the browser (you're in it)" },
            { type: "output", content: "  ├─ SecureChat        – End-to-end encrypted messaging" },
            { type: "output", content: "  └─ AutoDeploy        – CI/CD pipeline automation tool" },
            { type: "output", content: "" }
          );
          break;
        }

        case "skills": {
          push(
            { type: "output", content: "" },
            { type: "output", content: "  Skills:" },
            { type: "output", content: "  ├─ Languages  : TypeScript, Python, Bash, C++" },
            { type: "output", content: "  ├─ Frontend   : React, Next.js, Tailwind CSS" },
            { type: "output", content: "  ├─ Backend    : Node.js, Express, PostgreSQL" },
            { type: "output", content: "  └─ Tools      : Git, Docker, Linux, AWS" },
            { type: "output", content: "" }
          );
          break;
        }

        case "github": {
          window.open("https://github.com/monish0001000", "_blank");
          push({ type: "output", content: "  Redirecting to GitHub...", color: "cyan" });
          break;
        }

        case "linkedin": {
          window.open("https://linkedin.com", "_blank");
          push({ type: "output", content: "  Redirecting to LinkedIn...", color: "cyan" });
          break;
        }

        case "email": {
          push({ type: "output", content: "  Email: monish@example.com", color: "cyan" });
          break;
        }

        case "resume": {
          push({ type: "output", content: "  Resume: /documents/resume.pdf" });
          break;
        }

        case "whoami": {
          push({ type: "output", content: isRoot ? "  root" : "  monix" });
          break;
        }

        case "date": {
          push({ type: "output", content: `  ${new Date().toString()}`, color: "cyan" });
          break;
        }

        case "ls": {
          push({ type: "output", content: "  Desktop/  Documents/  Downloads/  Pictures/  Projects/" });
          break;
        }

        case "pwd": {
          push({ type: "output", content: isRoot ? "  /root" : "  /home/monix" });
          break;
        }

        case "history": {
          if (commandHistory.length === 0) {
            push({ type: "output", content: "  (no history)" });
          } else {
            commandHistory.forEach((c, idx) => {
              push({ type: "output", content: `  ${String(idx + 1).padStart(4)}  ${c}` });
            });
          }
          break;
        }

        case "clear": {
          setLines([]);
          break;
        }

        case "matrix": {
          const next = !matrixMode;
          setMatrixMode(next);
          push({
            type: "output",
            content: next ? "  [MATRIX MODE ON]  Wake up, Neo..." : "  [MATRIX MODE OFF]  You took the blue pill.",
            color: next ? "green" : undefined,
          });
          break;
        }

        case "open": {
          const appArg = args[0]?.toLowerCase() ?? "";
          const appId = VALID_APP_IDS[appArg];
          if (!appId) {
            push(
              { type: "error", content: `  open: unknown app '${args[0] ?? ""}'` },
              { type: "output", content: "  Available: browser, files, github, portfolio, settings, aura, sentinel, cyberchef, codestudio, chess, cykrypt, taskmanager, trash" }
            );
          } else {
            onOpenWindow?.(appId);
            push({ type: "output", content: `  Launching ${appArg}...`, color: "cyan" });
          }
          break;
        }

        case "sudo": {
          if (args[0]?.toLowerCase() === "su") {
            setIsRoot(true);
            push(
              { type: "output", content: "  [sudo] password for monix: ••••••••" },
              { type: "output", content: "  Authentication successful. Root privileges granted.", color: "green" }
            );
          } else {
            push({ type: "error", content: `  sudo: command '${args.join(" ")}' not found` });
          }
          break;
        }

        case "exit": {
          if (isRoot) {
            setIsRoot(false);
            push({ type: "output", content: "  Dropping root privileges..." });
          } else {
            push({ type: "output", content: "  logout" });
            setTimeout(onClose, 400);
          }
          break;
        }

        case "neofetch":
        case "sysinfo": {
          const stats = [
            `monix@monix-os`,
            `──────────────`,
            `OS        : MONIX WEB OS`,
            `Kernel    : React / Vite`,
            `Uptime    : ${getUptime()}`,
            `Shell     : ZSH 5.9`,
            `Terminal  : xterm-web`,
            `Resolution: ${window.innerWidth} x ${window.innerHeight}`,
            `CPU       : WebAssembly Virtual CPU`,
            `Memory    : 1024 MiB / 4096 MiB`,
            `Packages  : 1337 (npm)`,
          ];
          const rows = Math.max(NEOFETCH_ART.length, stats.length);
          const resultLines: TerminalLine[] = [{ type: "output", content: "" }];
          for (let i = 0; i < rows; i++) {
            const artPart = NEOFETCH_ART[i] ?? "".padEnd(46);
            const statPart = stats[i] ?? "";
            resultLines.push({ type: "output", content: `__NEOFETCH__${artPart}|||${statPart}` });
          }
          resultLines.push({ type: "output", content: "" });
          push(...resultLines);
          break;
        }

        // ── CRYPTO COMMANDS ─────────────────────────────────────────────────────

        case "base64": {
          const subCmd = args[0]?.toLowerCase();
          const text = args.slice(1).join(" ");
          if (!subCmd || (subCmd !== "encode" && subCmd !== "decode")) {
            push({ type: "error", content: "  Usage: base64 encode [text]  |  base64 decode [text]" });
            break;
          }
          if (!text) {
            push({ type: "error", content: `  base64 ${subCmd}: no text provided` });
            break;
          }
          if (subCmd === "encode") {
            try {
              const result = btoa(unescape(encodeURIComponent(text)));
              push(
                { type: "output", content: `  [+] Encoding: "${text}"`, color: "cyan" },
                { type: "output", content: `  Encoded: ${result}`, color: "cyan" }
              );
            } catch {
              push({ type: "error", content: "  base64: encode failed" });
            }
          } else {
            try {
              const result = decodeURIComponent(escape(atob(text)));
              push(
                { type: "output", content: `  [+] Decoding: "${text}"`, color: "cyan" },
                { type: "output", content: `  Decoded: ${result}`, color: "cyan" }
              );
            } catch {
              push({ type: "error", content: "  base64: invalid base64 string" });
            }
          }
          break;
        }

        case "hash": {
          const text = args.join(" ");
          if (!text) {
            push({ type: "error", content: "  Usage: hash [text]" });
            break;
          }
          push({ type: "output", content: "  [+] Generating SHA-256 hash...", color: "yellow" });
          const hashVal = fakeHex(64, text);
          setTimeout(() => {
            push({ type: "output", content: `  SHA-256: ${hashVal}`, color: "cyan" });
          }, 600);
          break;
        }

        // ── NETWORK COMMANDS ─────────────────────────────────────────────────────

        case "ping": {
          const host = args[0] ?? "8.8.8.8";
          const fakeAddr = fakeIp();
          push(
            { type: "output", content: "" },
            { type: "output", content: `  PING ${host} (${fakeAddr}) 56(84) bytes of data.`, color: "cyan" }
          );
          const entries = [1, 2, 3, 4].map((seq) => ({
            delay: seq * 800,
            line: {
              type: "output" as LineType,
              content: `  64 bytes from ${host} (${fakeAddr}): icmp_seq=${seq} ttl=117 time=${fakeMs()} ms`,
              color: "green",
            },
          }));
          entries.push({
            delay: 5 * 800,
            line: {
              type: "output" as LineType,
              content: `  --- ${host} ping statistics ---`,
              color: "cyan",
            },
          });
          entries.push({
            delay: 5 * 800 + 10,
            line: {
              type: "output" as LineType,
              content: `  4 packets transmitted, 4 received, 0% packet loss, time 3200ms`,
              color: "green",
            },
          });
          entries.push({
            delay: 5 * 800 + 20,
            line: { type: "output" as LineType, content: "" },
          });
          scheduleLines(entries);
          break;
        }

        case "nmap": {
          const host = args[0] ?? "localhost";
          const now = new Date().toLocaleString();
          push(
            { type: "output", content: "" },
            { type: "output", content: `  Starting Nmap 7.93 at ${now}`, color: "cyan" },
            { type: "output", content: `  Nmap scan report for ${host}` }
          );
          const entries: Array<{ delay: number; line: TerminalLine }> = [
            { delay: 1000, line: { type: "output", content: `  Host is up (0.012s latency).`, color: "green" } },
            { delay: 1200, line: { type: "output", content: "" } },
            { delay: 1400, line: { type: "output", content: "  PORT      STATE  SERVICE", color: "cyan" } },
            { delay: 1600, line: { type: "output", content: "  22/tcp    open   ssh", color: "green" } },
            { delay: 1800, line: { type: "output", content: "  80/tcp    open   http", color: "green" } },
            { delay: 2000, line: { type: "output", content: "  443/tcp   open   https", color: "green" } },
            { delay: 2200, line: { type: "output", content: "  3306/tcp  closed mysql", color: "red" } },
            { delay: 2400, line: { type: "output", content: "  8080/tcp  open   http-proxy", color: "green" } },
            { delay: 2800, line: { type: "output", content: "" } },
            { delay: 2850, line: { type: "output", content: `  Nmap done: 1 IP address (1 host up) scanned in 2.31 seconds`, color: "cyan" } },
            { delay: 2900, line: { type: "output", content: "" } },
          ];
          scheduleLines(entries);
          break;
        }

        case "traceroute": {
          const host = args[0] ?? "google.com";
          push(
            { type: "output", content: "" },
            { type: "output", content: `  traceroute to ${host}, 30 hops max, 60 byte packets`, color: "cyan" }
          );
          const hops = [
            { ip: "192.168.1.1",   name: "_gateway" },
            { ip: "10.0.0.1",      name: "isp-router.net" },
            { ip: "72.14.194.1",   name: "edge-node-1.backbone.net" },
            { ip: "142.250.0.1",   name: `${host}` },
          ];
          const entries: Array<{ delay: number; line: TerminalLine }> = hops.map((hop, i) => ({
            delay: (i + 1) * 700,
            line: {
              type: "output" as LineType,
              content: `  ${String(i + 1).padStart(2)}  ${hop.name} (${hop.ip})  ${fakeMs()} ms  ${fakeMs()} ms  ${fakeMs()} ms`,
              color: "green",
            },
          }));
          entries.push({ delay: hops.length * 700 + 100, line: { type: "output", content: "" } });
          scheduleLines(entries);
          break;
        }

        case "ifconfig":
        case "ipconfig": {
          const localIp = fakeIp(168);
          push(
            { type: "output", content: "" },
            { type: "output", content: "  eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500", color: "cyan" },
            { type: "output", content: `          inet ${localIp}  netmask 255.255.255.0  broadcast 192.168.168.255` },
            { type: "output", content: "          inet6 fe80::a00:27ff:fe4e:66a1  prefixlen 64  scopeid 0x20<link>" },
            { type: "output", content: "          ether 00:1B:44:11:3A:B7  txqueuelen 1000  (Ethernet)" },
            { type: "output", content: "          RX packets 84231  bytes 112380441 (107.1 MiB)" },
            { type: "output", content: "          TX packets 61029  bytes 9182773 (8.7 MiB)" },
            { type: "output", content: "" },
            { type: "output", content: "  lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536", color: "cyan" },
            { type: "output", content: "          inet 127.0.0.1  netmask 255.0.0.0" },
            { type: "output", content: "          inet6 ::1  prefixlen 128  scopeid 0x10<host>" },
            { type: "output", content: "" }
          );
          break;
        }

        case "hack": {
          if (args[0] === "--start") {
            scheduleLines([
              { delay: 100,  line: { type: "output", content: "" } },
              { delay: 200,  line: { type: "output", content: "  ╔══════════════════════════════════════════╗", color: "red" } },
              { delay: 300,  line: { type: "output", content: "  ║   ██████╗██╗   ██╗██████╗ ███████╗██████╗  ║", color: "red" } },
              { delay: 400,  line: { type: "output", content: "  ║  ██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗ ║", color: "red" } },
              { delay: 500,  line: { type: "output", content: "  ║  ██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝ ║", color: "red" } },
              { delay: 600,  line: { type: "output", content: "  ╚══════════════════════════════════════════╝", color: "red" } },
              { delay: 700,  line: { type: "output", content: "" } },
              { delay: 800,  line: { type: "output", content: "  [SYSTEM COMPROMISED] — Kernel integrity: FAILED", color: "red" } },
              { delay: 950,  line: { type: "output", content: "  [WARNING] Root filesystem encrypted. Countdown: 60s", color: "red" } },
              { delay: 1100, line: { type: "output", content: "  [MONIX-SEC] Enter root override flag to abort:", color: "red" } },
              { delay: 1200, line: { type: "output", content: "" } },
            ], () => setHackMode(true));
          } else {
            push({ type: "error", content: "  Usage: hack --start" });
          }
          break;
        }

        default: {
          if (fullCmd === "sudo su") {
            setIsRoot(true);
            push(
              { type: "output", content: "  [sudo] password for monix: ••••••••" },
              { type: "output", content: "  Authentication successful. Root privileges granted.", color: "green" }
            );
          } else {
            push({ type: "error", content: `  bash: ${cmd}: command not found` });
          }
          break;
        }
      }
    },
    [isRoot, matrixMode, hackMode, commandHistory, push, scheduleLines, onClose, onOpenWindow, getUptime]
  );

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
        const newIdx = historyIndex < hist.length - 1 ? historyIndex + 1 : historyIndex;
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

  const colorClass = (color?: string) => {
    if (matrixMode) return "text-green-400";
    switch (color) {
      case "cyan":   return "text-cyan-400";
      case "green":  return "text-green-400";
      case "red":    return "text-red-400";
      case "yellow": return "text-yellow-400";
      default:       return "text-green-300";
    }
  };

  const renderLine = (line: TerminalLine, i: number) => {
    if (line.content.startsWith("__NEOFETCH__")) {
      const rest = line.content.slice("__NEOFETCH__".length);
      const [artPart, statPart] = rest.split("|||");
      return (
        <div key={i} className="flex leading-snug mb-[1px]">
          <span className="text-cyan-400 whitespace-pre font-mono" style={{ minWidth: "47ch" }}>
            {artPart}
          </span>
          <span className="text-green-300 whitespace-pre font-mono ml-4">{statPart}</span>
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
      <div key={i} className={`whitespace-pre-wrap break-all leading-snug mb-[1px] ${colorClass(line.color)}`}>
        {line.content}
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
      width={780}
      height={500}
      zIndex={zIndex}
    >
      <div
        className={`w-full h-full ${matrixMode ? "bg-black" : "bg-[#0d0d0d]"} p-3 font-mono text-sm text-green-400 overflow-y-auto`}
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
              disabled={isProcessing}
              className={`bg-transparent border-none outline-none flex-1 font-mono text-sm ml-1 caret-green-400 transition-opacity ${
                isProcessing ? "text-gray-500 opacity-50 cursor-not-allowed" : "text-white"
              }`}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              placeholder={isProcessing ? "processing..." : ""}
            />
          </div>
          <div ref={bottomRef} />
        </div>
      </div>
    </WindowChrome>
  );
}
