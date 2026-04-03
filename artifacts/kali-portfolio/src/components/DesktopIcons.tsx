interface DesktopIconsProps {
  onOpenWindow: (id: string) => void;
  selectedIcon: string | null;
  onSelectIcon: (id: string | null) => void;
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
      <rect x="5" y="9" width="26" height="23" rx="2.5" fill="#4a4a5a" stroke="#6e6e8a" strokeWidth="1.2"/>
      <rect x="9" y="13" width="18" height="16" rx="1.5" fill="#303040"/>
      <rect x="8" y="7" width="20" height="3.5" rx="1.5" fill="#5a5a6e" stroke="#7a7a8e" strokeWidth="0.8"/>
      <rect x="14" y="4.5" width="8" height="3" rx="1.2" fill="#6e6e82" stroke="#8888a0" strokeWidth="0.7"/>
      <line x1="13" y1="15" x2="13" y2="27" stroke="#8888aa" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="18" y1="15" x2="18" y2="27" stroke="#8888aa" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="23" y1="15" x2="23" y2="27" stroke="#8888aa" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function FileSystemIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
      <ellipse cx="18" cy="18" rx="14" ry="14" fill="#1e3a5f" stroke="#2a5ba8" strokeWidth="1.2"/>
      <ellipse cx="18" cy="18" rx="10" ry="10" fill="#163055" stroke="#3a7ad4" strokeWidth="1"/>
      <ellipse cx="18" cy="18" rx="5.5" ry="5.5" fill="#0f2040" stroke="#5090e0" strokeWidth="1"/>
      <circle cx="18" cy="18" r="2" fill="#70b0ff"/>
      <line x1="18" y1="4" x2="18" y2="7.5" stroke="#4080cc" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="18" y1="28.5" x2="18" y2="32" stroke="#4080cc" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="4" y1="18" x2="7.5" y2="18" stroke="#4080cc" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="28.5" y1="18" x2="32" y2="18" stroke="#4080cc" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="8.3" y1="8.3" x2="10.8" y2="10.8" stroke="#3070bb" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="25.2" y1="25.2" x2="27.7" y2="27.7" stroke="#3070bb" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="27.7" y1="8.3" x2="25.2" y2="10.8" stroke="#3070bb" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="10.8" y1="25.2" x2="8.3" y2="27.7" stroke="#3070bb" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
      <rect x="3" y="13" width="30" height="20" rx="2.5" fill="#1a4a8c" stroke="#2a6acc" strokeWidth="1"/>
      <path d="M2 16L18 4l16 12" fill="#1e5cb0" stroke="#3a7ae0" strokeWidth="1.2" strokeLinejoin="round"/>
      <rect x="13" y="21" width="10" height="12" rx="1.5" fill="#0f2d5e" stroke="#2a5aa8" strokeWidth="0.8"/>
      <rect x="7" y="17" width="7" height="7" rx="1.2" fill="#2060c0" stroke="#3a80e0" strokeWidth="0.8"/>
      <rect x="22" y="17" width="7" height="7" rx="1.2" fill="#2060c0" stroke="#3a80e0" strokeWidth="0.8"/>
      <rect x="16.5" y="21" width="3" height="5" rx="0.8" fill="#1a4a90"/>
      <path d="M16 9.5L18 8l2 1.5v4H16V9.5z" fill="#4a90e8" opacity="0.8"/>
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

function PortfolioIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
      <rect x="2" y="5" width="32" height="22" rx="3" fill="#1a2a1a" stroke="#2a6a2a" strokeWidth="1.2"/>
      <rect x="4" y="7" width="28" height="18" rx="2" fill="#0a1a0a"/>
      <rect x="4" y="7" width="28" height="3" rx="2" fill="#1e4a1e"/>
      <circle cx="8" cy="8.5" r="1" fill="#e05555"/>
      <circle cx="12" cy="8.5" r="1" fill="#e0a020"/>
      <circle cx="16" cy="8.5" r="1" fill="#30a030"/>
      <path d="M6 14h10" stroke="#2a8a2a" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M6 17h16" stroke="#248024" strokeWidth="1" strokeLinecap="round"/>
      <path d="M6 20h12" stroke="#208020" strokeWidth="1" strokeLinecap="round"/>
      <rect x="10" y="27" width="16" height="2.5" rx="1" fill="#1e4a1e" stroke="#2a6a2a" strokeWidth="0.8"/>
      <rect x="7" y="29.5" width="22" height="1.5" rx="0.8" fill="#2a5a2a"/>
    </svg>
  );
}

const ICONS = [
  { id: "trash",      label: "Trash",      icon: <TrashIcon />,     window: "trash"     },
  { id: "filesystem", label: "File System",icon: <FileSystemIcon />,window: "files"     },
  { id: "home",       label: "Home",       icon: <HomeIcon />,      window: "files"     },
  { id: "github",     label: "GitHub",     icon: <GitHubIcon />,    window: "github"    },
  { id: "portfolio",  label: "Portfolio",  icon: <PortfolioIcon />, window: "portfolio" },
];

export default function DesktopIcons({
  onOpenWindow,
  selectedIcon,
  onSelectIcon,
}: DesktopIconsProps) {
  return (
    <div
      className="absolute flex flex-col z-10 font-sans"
      style={{ top: 40, left: 10, gap: 2 }}
    >
      {ICONS.map((item) => {
        const isSelected = selectedIcon === item.id;
        return (
          <div
            key={item.id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              cursor: "pointer",
              padding: "5px 7px 4px",
              userSelect: "none",
              width: 66,
              background: isSelected ? "rgba(54,123,240,0.28)" : "transparent",
              border: isSelected
                ? "1px solid rgba(54,123,240,0.55)"
                : "1px solid transparent",
              outline: isSelected ? "1px solid rgba(54,123,240,0.15)" : "none",
              transition: "background 0.1s, border-color 0.1s",
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
                textShadow: "1px 1px 2px rgba(0,0,0,0.8), 0 0 6px rgba(0,0,0,0.9)",
                wordBreak: "break-word",
                maxWidth: 60,
              }}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
