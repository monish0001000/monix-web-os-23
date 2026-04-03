import { useState } from "react";
import { Folder, FileText, File, Image as ImageIcon, Archive } from "lucide-react";
import WindowChrome from "./WindowChrome";

interface FileExplorerProps {
  onClose: () => void;
  onMinimize?: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
}

const FILE_SYSTEM: Record<string, string[]> = {
  'Home': ['Documents/', 'Downloads/', 'Pictures/', 'Projects/', '.bashrc', '.profile'],
  'Documents': ['resume.pdf', 'notes.txt', 'portfolio-ideas.md'],
  'Downloads': ['kali-linux.iso', 'tools.zip'],
  'Pictures': ['screenshot.png', 'wallpaper.jpg', 'avatar.png'],
  'Projects': ['kali-portfolio/', 'web-app/', 'scripts/']
};

export default function FileExplorer({ onClose, onMinimize, isActive, onFocus, initialX, initialY, zIndex }: FileExplorerProps) {
  const [currentFolder, setCurrentFolder] = useState<string>('Home');
  const [path, setPath] = useState<string[]>(['Home']);

  const SIDEBAR_ITEMS = ['Home', 'Desktop', 'Documents', 'Downloads', 'Pictures', 'Projects'];

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('/')) return Folder;
    if (filename.endsWith('.txt') || filename.endsWith('.md')) return FileText;
    if (filename.endsWith('.png') || filename.endsWith('.jpg')) return ImageIcon;
    if (filename.endsWith('.zip') || filename.endsWith('.iso')) return Archive;
    return File;
  };

  const getFileIconColor = (filename: string) => {
    if (filename.endsWith('/')) return 'text-blue-400';
    if (filename.endsWith('.pdf')) return 'text-red-400';
    if (filename.endsWith('.zip') || filename.endsWith('.iso')) return 'text-yellow-400';
    if (filename.endsWith('.png') || filename.endsWith('.jpg')) return 'text-green-400';
    return 'text-gray-300';
  };

  const handleSidebarClick = (folder: string) => {
    if (folder === 'Desktop') {
      setCurrentFolder('Home');
      setPath(['Home']);
      return;
    }
    
    if (FILE_SYSTEM[folder]) {
      setCurrentFolder(folder);
      setPath(['Home', folder]);
    } else {
      setCurrentFolder(folder);
      setPath(['Home', folder]);
    }
  };

  const handleFileDoubleClick = (filename: string) => {
    if (filename.endsWith('/')) {
      const folderName = filename.replace('/', '');
      if (FILE_SYSTEM[folderName]) {
        setCurrentFolder(folderName);
        setPath([...path, folderName]);
      }
    }
  };

  const currentFiles = FILE_SYSTEM[currentFolder] || [];

  return (
    <WindowChrome
      title="Files - File Manager"
      onClose={onClose}
      onMinimize={onMinimize}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX}
      initialY={initialY}
      width={600}
      height={400}
      zIndex={zIndex}
    >
      <div className="flex h-full bg-[#1c1c1c] font-sans">
        {/* Left Sidebar */}
        <div className="w-40 bg-[#161616] border-r border-white/10 p-2 flex flex-col gap-1 overflow-y-auto">
          {SIDEBAR_ITEMS.map((item) => (
            <div
              key={item}
              onClick={() => handleSidebarClick(item)}
              className={`flex items-center gap-2 text-sm p-1.5 rounded cursor-pointer transition-colors ${
                currentFolder === item || (item === 'Home' && currentFolder === 'Home')
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              <Folder size={16} className={currentFolder === item ? 'text-blue-400' : 'text-gray-400'} />
              {item}
            </div>
          ))}
        </div>

        {/* Right Content */}
        <div className="flex-1 p-3 flex flex-col">
          {/* Breadcrumb */}
          <div className="text-xs text-gray-400 mb-4 px-1">
            {path.join(' > ')}
          </div>

          {/* Files Grid */}
          <div className="grid grid-cols-4 gap-3">
            {currentFiles.map((file, i) => {
              const Icon = getFileIcon(file);
              const isDir = file.endsWith('/');
              const displayName = isDir ? file.slice(0, -1) : file;
              
              return (
                <div
                  key={i}
                  onDoubleClick={() => handleFileDoubleClick(file)}
                  className="flex flex-col items-center gap-1 cursor-pointer p-2 rounded hover:bg-white/10 text-center transition-colors"
                >
                  <Icon size={32} className={`drop-shadow-md ${getFileIconColor(file)}`} />
                  <span className="text-xs text-gray-200 truncate max-w-[60px] mt-1" title={displayName}>
                    {displayName}
                  </span>
                </div>
              );
            })}
            
            {currentFiles.length === 0 && (
              <div className="col-span-4 text-center text-sm text-gray-500 mt-10">
                This folder is empty.
              </div>
            )}
          </div>
        </div>
      </div>
    </WindowChrome>
  );
}
