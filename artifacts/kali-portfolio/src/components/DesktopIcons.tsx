import { useRef } from "react";
import { motion } from "framer-motion";

interface DesktopIconsProps {
  onOpenWindow: (id: string) => void;
  selectedIcon: string | null;
  onSelectIcon: (id: string | null) => void;
  dragConstraintsRef: React.RefObject<HTMLDivElement>;
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
      <defs>
        <linearGradient id="trashBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6a6a82" />
          <stop offset="100%" stopColor="#3a3a50" />
        </linearGradient>
        <linearGradient id="trashLid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7a7a96" />
          <stop offset="100%" stopColor="#5a5a72" />
        </linearGradient>
      </defs>
      <rect x="7" y="11" width="22" height="20" rx="2.5" fill="url(#trashBody)" stroke="#8080a0" strokeWidth="0.8"/>
      <rect x="10" y="14.5" width="16" height="13" rx="1.5" fill="#252538" opacity="0.6"/>
      <rect x="6.5" y="8" width="23" height="4" rx="2" fill="url(#trashLid)" stroke="#9090b0" strokeWidth="0.7"/>
      <rect x="13.5" y="5.5" width="9" height="3" rx="1.5" fill="#6a6a88" stroke="#9090b4" strokeWidth="0.6"/>
      <line x1="13" y1="16" x2="13" y2="28" stroke="#a0a0c0" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="18" y1="16" x2="18" y2="28" stroke="#a0a0c0" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="23" y1="16" x2="23" y2="28" stroke="#a0a0c0" strokeWidth="1.8" strokeLinecap="round"/>
      <rect x="15" y="8" width="6" height="4" rx="1" fill="#5a5a78" opacity="0.5"/>
    </svg>
  );
}

function FileSystemIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
      <defs>
        <linearGradient id="diskGrad" x1="0.3" y1="0.1" x2="0.7" y2="0.9">
          <stop offset="0%" stopColor="#2a4a8c" />
          <stop offset="100%" stopColor="#0f1f4a" />
        </linearGradient>
        <radialGradient id="diskShine" cx="40%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#4a7ee0" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0a1a44" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="18" cy="18" r="15" fill="url(#diskGrad)" stroke="#2a5ab8" strokeWidth="1.2"/>
      <circle cx="18" cy="18" r="15" fill="url(#diskShine)"/>
      <circle cx="18" cy="18" r="11" fill="none" stroke="#3a6ad0" strokeWidth="0.8" strokeDasharray="2 3"/>
      <circle cx="18" cy="18" r="7.5" fill="none" stroke="#2a50a8" strokeWidth="0.8"/>
      <circle cx="18" cy="18" r="4" fill="#1a3a7a" stroke="#4a80e0" strokeWidth="1"/>
      <circle cx="18" cy="18" r="2" fill="#5090f0"/>
      <circle cx="18" cy="18" r="0.8" fill="#90c0ff"/>
      <line x1="18" y1="3.5" x2="18" y2="7" stroke="#5080d0" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="18" y1="29" x2="18" y2="32.5" stroke="#5080d0" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="3.5" y1="18" x2="7" y2="18" stroke="#5080d0" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="29" y1="18" x2="32.5" y2="18" stroke="#5080d0" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="7.8" y1="7.8" x2="10.3" y2="10.3" stroke="#3a60c0" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="25.7" y1="25.7" x2="28.2" y2="28.2" stroke="#3a60c0" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="28.2" y1="7.8" x2="25.7" y2="10.3" stroke="#3a60c0" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="10.3" y1="25.7" x2="7.8" y2="28.2" stroke="#3a60c0" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
      <defs>
        <linearGradient id="houseWall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2060c8" />
          <stop offset="100%" stopColor="#0d3a80" />
        </linearGradient>
        <linearGradient id="houseRoof" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#2a74e0" />
          <stop offset="100%" stopColor="#1250aa" />
        </linearGradient>
        <linearGradient id="houseDoor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d2a60" />
          <stop offset="100%" stopColor="#071a40" />
        </linearGradient>
      </defs>
      <path d="M3 16.5L18 4.5l15 12V32H3V16.5z" fill="url(#houseWall)" stroke="#3a80e8" strokeWidth="0.8" strokeLinejoin="round"/>
      <path d="M2 17L18 4l16 13" fill="url(#houseRoof)" stroke="#5090f0" strokeWidth="1.2" strokeLinejoin="round"/>
      <rect x="13.5" y="21.5" width="9" height="10.5" rx="1.2" fill="url(#houseDoor)" stroke="#2460b0" strokeWidth="0.8"/>
      <rect x="7" y="18" width="6.5" height="7" rx="1.2" fill="#1a50a8" stroke="#3a70d0" strokeWidth="0.7"/>
      <rect x="22.5" y="18" width="6.5" height="7" rx="1.2" fill="#1a50a8" stroke="#3a70d0" strokeWidth="0.7"/>
      <line x1="10.25" y1="18" x2="10.25" y2="25" stroke="#4a80d8" strokeWidth="0.6" strokeLinecap="round"/>
      <line x1="7" y1="21.5" x2="13.5" y2="21.5" stroke="#4a80d8" strokeWidth="0.6" strokeLinecap="round"/>
      <line x1="25.75" y1="18" x2="25.75" y2="25" stroke="#4a80d8" strokeWidth="0.6" strokeLinecap="round"/>
      <line x1="22.5" y1="21.5" x2="29" y2="21.5" stroke="#4a80d8" strokeWidth="0.6" strokeLinecap="round"/>
      <circle cx="21.5" cy="27" r="0.8" fill="#4a80e8"/>
      <path d="M15.5 7L18 5l2.5 2v4h-5V7z" fill="#70a8f8" opacity="0.7"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
      <rect width="36" height="36" rx="6" fill="#161b22"/>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18 5C11.373 5 6 10.373 6 17c0 5.302 3.438 9.8 8.207 11.387.6.111.793-.261.793-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.386-1.332-1.756-1.332-1.756-1.09-.745.082-.73.082-.73 1.205.085 1.838 1.237 1.838 1.237 1.07 1.835 2.807 1.305 3.492.998.109-.776.42-1.305.762-1.605-2.665-.303-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.235-3.22-.124-.304-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23A11.51 11.51 0 0118 10.8c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.652.242 2.872.118 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.805 5.624-5.475 5.922.43.37.814 1.102.814 2.222 0 1.606-.015 2.898-.015 3.293 0 .319.192.694.801.576C26.565 26.796 30 22.3 30 17c0-6.627-5.373-12-12-12z"
        fill="white"
      />
    </svg>
  );
}

function BrowserIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
      <defs>
        <linearGradient id="browserBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a3a7a" />
          <stop offset="100%" stopColor="#0d1f4a" />
        </linearGradient>
        <linearGradient id="browserBar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e4490" />
          <stop offset="100%" stopColor="#162e68" />
        </linearGradient>
      </defs>
      <rect x="2" y="5" width="32" height="26" rx="3" fill="url(#browserBg)" stroke="#2a5ad8" strokeWidth="1"/>
      <rect x="2" y="5" width="32" height="8" rx="3" fill="url(#browserBar)"/>
      <rect x="2" y="9" width="32" height="4" fill="url(#browserBar)"/>
      <circle cx="7" cy="9" r="1.3" fill="#e05555"/>
      <circle cx="11.5" cy="9" r="1.3" fill="#e0a020"/>
      <circle cx="16" cy="9" r="1.3" fill="#30c030"/>
      <rect x="20" y="6.5" width="11" height="5" rx="2.5" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6"/>
      <circle cx="18" cy="23" r="7.5" fill="none" stroke="#3a6ad0" strokeWidth="1.2"/>
      <ellipse cx="18" cy="23" rx="3.5" ry="7.5" fill="none" stroke="#5090e0" strokeWidth="0.8"/>
      <line x1="10.5" y1="23" x2="25.5" y2="23" stroke="#4a80d8" strokeWidth="0.8"/>
      <line x1="11.5" y1="19.5" x2="24.5" y2="19.5" stroke="#3a60c0" strokeWidth="0.6" strokeDasharray="1.5 1"/>
      <line x1="11.5" y1="26.5" x2="24.5" y2="26.5" stroke="#3a60c0" strokeWidth="0.6" strokeDasharray="1.5 1"/>
    </svg>
  );
}

function PortfolioIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
      <defs>
        <linearGradient id="monitorBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e3a1e" />
          <stop offset="100%" stopColor="#0d1f0d" />
        </linearGradient>
        <linearGradient id="monitorScreen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a1a0a" />
          <stop offset="100%" stopColor="#030f03" />
        </linearGradient>
      </defs>
      <rect x="2" y="4" width="32" height="22" rx="2.5" fill="url(#monitorBody)" stroke="#2a7a2a" strokeWidth="1.2"/>
      <rect x="4" y="6" width="28" height="18" rx="1.5" fill="url(#monitorScreen)"/>
      <rect x="4" y="6" width="28" height="3" rx="1.5" fill="#1a4a1a"/>
      <circle cx="8" cy="7.5" r="1" fill="#e05555"/>
      <circle cx="12" cy="7.5" r="1" fill="#e0a020"/>
      <circle cx="16" cy="7.5" r="1" fill="#30c030"/>
      <path d="M6 13.5h8" stroke="#00ff00" strokeWidth="1.2" strokeLinecap="round" opacity="0.9"/>
      <path d="M6 16.5h14" stroke="#00cc00" strokeWidth="1" strokeLinecap="round" opacity="0.8"/>
      <path d="M6 19.5h10" stroke="#00aa00" strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
      <text x="21" y="20" fontSize="6" fill="#00ff00" fontFamily="monospace" opacity="0.8">_</text>
      <rect x="13" y="26" width="10" height="2.5" rx="1" fill="#1a4a1a" stroke="#2a7a2a" strokeWidth="0.8"/>
      <rect x="9" y="28.5" width="18" height="2" rx="1" fill="#1a3a1a" stroke="#2a6a2a" strokeWidth="0.7"/>
    </svg>
  );
}

const ICONS = [
  { id: "trash",      label: "Trash",       icon: <TrashIcon />,      window: "trash"     },
  { id: "filesystem", label: "File System", icon: <FileSystemIcon />, window: "files"     },
  { id: "home",       label: "Home",        icon: <HomeIcon />,       window: "files"     },
  { id: "github",     label: "GitHub",      icon: <GitHubIcon />,     window: "github"    },
  { id: "portfolio",  label: "Portfolio",   icon: <PortfolioIcon />,  window: "portfolio" },
  { id: "browser",    label: "Browser",     icon: <BrowserIcon />,    window: "browser"   },
];

export default function DesktopIcons({
  onOpenWindow,
  selectedIcon,
  onSelectIcon,
  dragConstraintsRef,
}: DesktopIconsProps) {
  return (
    <div
      className="absolute flex flex-col z-10 font-sans"
      style={{ top: 40, left: 10, gap: 2 }}
    >
      {ICONS.map((item) => {
        const isSelected = selectedIcon === item.id;
        return (
          <motion.div
            key={item.id}
            drag
            dragMomentum={false}
            dragConstraints={dragConstraintsRef}
            dragElastic={0}
            whileDrag={{ scale: 1.06, zIndex: 50, cursor: "grabbing" }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              cursor: "grab",
              padding: "5px 7px 4px",
              userSelect: "none",
              width: 66,
              background: isSelected ? "rgba(54,123,240,0.28)" : "transparent",
              border: isSelected
                ? "1px solid rgba(54,123,240,0.55)"
                : "1px solid transparent",
              outline: isSelected ? "1px solid rgba(54,123,240,0.15)" : "none",
              transition: "background 0.1s, border-color 0.1s",
              position: "relative",
              borderRadius: 3,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectIcon(item.id);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onOpenWindow(item.window);
            }}
          >
            {item.icon}
            <span
              style={{
                fontSize: 11,
                color: "#ffffff",
                textAlign: "center",
                lineHeight: 1.2,
                textShadow:
                  "1px 1px 3px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,1), -1px -1px 3px rgba(0,0,0,0.9)",
                wordBreak: "break-word",
                maxWidth: 60,
                fontWeight: 500,
                pointerEvents: "none",
              }}
            >
              {item.label}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
