import { Home, Trash2, HardDrive } from "lucide-react";

interface DesktopIconsProps {
  onOpenWindow: (id: string) => void;
  selectedIcon: string | null;
  onSelectIcon: (id: string | null) => void;
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 48 48" width="40" height="40" fill="none">
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
    <svg viewBox="0 0 48 48" width="40" height="40" fill="none">
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
        width: 40,
        height: 40,
        background: "linear-gradient(135deg, #367BF0 0%, #1a5bc4 100%)",
        borderRadius: 4,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 8px rgba(54,123,240,0.4)",
      }}
    >
      <Home size={22} color="white" strokeWidth={1.8} />
    </div>
  );
}

const ICONS = [
  {
    id: "trash",
    label: "Trash",
    icon: <TrashIcon />,
    action: "open" as const,
    window: "trash",
  },
  {
    id: "filesystem",
    label: "File System",
    icon: <FileSystemIcon />,
    action: "open" as const,
    window: "files",
  },
  {
    id: "home",
    label: "Home",
    icon: <HomeIcon />,
    action: "open" as const,
    window: "files",
  },
];

export default function DesktopIcons({
  onOpenWindow,
  selectedIcon,
  onSelectIcon,
}: DesktopIconsProps) {
  return (
    <div
      className="absolute flex flex-col z-10 font-sans"
      style={{ top: 38, left: 10, gap: 4 }}
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
              gap: 4,
              cursor: "pointer",
              padding: "6px 8px 5px",
              userSelect: "none",
              width: 72,
              background: isSelected
                ? "rgba(54,123,240,0.28)"
                : "transparent",
              border: isSelected
                ? "1px solid rgba(54,123,240,0.5)"
                : "1px solid transparent",
              outline: isSelected ? "1px solid rgba(54,123,240,0.2)" : "none",
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
                textShadow: "0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)",
                wordBreak: "break-word",
                maxWidth: 64,
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
