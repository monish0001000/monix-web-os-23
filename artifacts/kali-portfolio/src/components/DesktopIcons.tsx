import { Home } from "lucide-react";

interface DesktopIconsProps {
  onOpenWindow: (id: string) => void;
  selectedIcon: string | null;
  onSelectIcon: (id: string | null) => void;
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 48 48" width="36" height="36" fill="none">
      <rect x="12" y="14" width="24" height="28" rx="2" stroke="white" strokeWidth="2" fill="rgba(255,255,255,0.07)" />
      <path d="M18 14V11a2 2 0 012-2h8a2 2 0 012 2v3" stroke="white" strokeWidth="2" />
      <line x1="8" y1="14" x2="40" y2="14" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="20" y1="20" x2="20" y2="36" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="24" y1="20" x2="24" y2="36" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="28" y1="20" x2="28" y2="36" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function FileSystemIcon() {
  return (
    <svg viewBox="0 0 48 48" width="36" height="36" fill="none">
      <circle cx="24" cy="24" r="16" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" fill="rgba(255,255,255,0.05)" />
      <circle cx="24" cy="24" r="6" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" fill="rgba(255,255,255,0.12)" />
      <circle cx="24" cy="24" r="2" fill="white" opacity="0.9" />
      <line x1="24" y1="8" x2="24" y2="11" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="24" y1="37" x2="24" y2="40" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="24" x2="11" y2="24" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="37" y1="24" x2="40" y2="24" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        background: "linear-gradient(135deg, #367BF0 0%, #1a5bc4 100%)",
        borderRadius: 4,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 8px rgba(54,123,240,0.4)",
      }}
    >
      <Home size={19} color="white" strokeWidth={1.8} />
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 36 36" width="36" height="36" fill="none">
      <rect width="36" height="36" rx="6" fill="#161b22" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18 5C11.373 5 6 10.373 6 17c0 5.302 3.438 9.8 8.207 11.387.6.111.793-.261.793-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.386-1.332-1.756-1.332-1.756-1.09-.745.082-.73.082-.73 1.205.085 1.838 1.237 1.838 1.237 1.07 1.835 2.807 1.305 3.492.998.109-.776.42-1.305.762-1.605-2.665-.303-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.235-3.22-.124-.304-.535-1.524.117-3.176 0 0 1.008-.322 3.3 1.23A11.51 11.51 0 0118 10.8c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.652.242 2.872.118 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.805 5.624-5.475 5.922.43.37.814 1.102.814 2.222 0 1.606-.015 2.898-.015 3.293 0 .319.192.694.801.576C26.565 26.796 30 22.3 30 17c0-6.627-5.373-12-12-12z"
        fill="white"
      />
    </svg>
  );
}

const ICONS = [
  { id: "trash",      label: "Trash",       icon: <TrashIcon />,      window: "trash"  },
  { id: "filesystem", label: "File System", icon: <FileSystemIcon />, window: "files"  },
  { id: "home",       label: "Home",        icon: <HomeIcon />,       window: "files"  },
  { id: "github",     label: "GitHub",      icon: <GitHubIcon />,     window: "github" },
];

export default function DesktopIcons({
  onOpenWindow,
  selectedIcon,
  onSelectIcon,
}: DesktopIconsProps) {
  return (
    <div
      className="absolute flex flex-col z-10 font-sans"
      style={{ top: 38, left: 10, gap: 2 }}
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
                textShadow:
                  "1px 1px 2px rgba(0,0,0,0.8), 0 0 6px rgba(0,0,0,0.9)",
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
