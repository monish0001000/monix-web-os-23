import { TerminalSquare, FolderOpen, Home, Trash2 } from "lucide-react";
import { SiGithub } from "react-icons/si";

interface DesktopIconsProps {
  onOpenWindow: (id: string) => void;
  selectedIcon: string | null;
  onSelectIcon: (id: string | null) => void;
}

export default function DesktopIcons({ onOpenWindow, selectedIcon, onSelectIcon }: DesktopIconsProps) {
  const icons = [
    { id: 'terminal', icon: TerminalSquare, label: 'Terminal', action: () => onOpenWindow('terminal') },
    { id: 'files', icon: FolderOpen, label: 'Files', action: () => onOpenWindow('files') },
    { id: 'home', icon: Home, label: 'Home', action: () => onOpenWindow('files') },
    { 
      id: 'github', 
      icon: SiGithub, 
      label: 'GitHub', 
      action: () => window.open('https://github.com/monishpkp', '_blank'),
      isSingleClick: true
    },
    { id: 'trash', icon: Trash2, label: 'Trash', action: () => onOpenWindow('trash') },
  ];

  return (
    <div className="absolute top-10 left-4 flex flex-col gap-2 z-10 font-sans">
      {icons.map((item) => {
        const isSelected = selectedIcon === item.id;
        const Icon = item.icon;
        
        return (
          <div
            key={item.id}
            className={`flex flex-col items-center gap-1 cursor-pointer p-2 rounded w-16 select-none transition-colors
              ${isSelected ? 'bg-blue-500/20 border border-blue-400/30' : 'hover:bg-white/10 border border-transparent'}
            `}
            onClick={(e) => {
              e.stopPropagation();
              onSelectIcon(item.id);
              if (item.isSingleClick) {
                item.action();
              }
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (!item.isSingleClick) {
                item.action();
              }
            }}
          >
            <Icon className="w-8 h-8 text-white drop-shadow-md" />
            <span 
              className="text-[11px] text-white text-center leading-tight mt-0.5"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
