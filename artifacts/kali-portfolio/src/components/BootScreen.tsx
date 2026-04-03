import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface BootScreenProps {
  onComplete: () => void;
}

const BOOT_MESSAGES = [
  "[  0.000000] Booting Linux kernel 6.5.0-kali3-amd64 #1 SMP PREEMPT_DYNAMIC",
  "[  0.234156] ACPI: Core revision 20221020",
  "[  0.891234] PCI: Using configuration type 1 for base access",
  "[  1.234567] Initializing cgroup subsys cpuset",
  "[  1.456789] Mount namespace created",
  "[  1.789012] systemd[1]: Starting Kali Linux",
  "[  2.012345] Started Network Manager Service",
  "[  2.345678] Started Display Manager Service",
  "[  2.678901] Starting kali-desktop.service",
  "[  3.012345] Welcome to Kali Linux - by Monish"
];

export default function BootScreen({ onComplete }: BootScreenProps) {
  const [visibleMessages, setVisibleMessages] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      if (messageIndex < BOOT_MESSAGES.length) {
        setVisibleMessages(prev => [...prev, BOOT_MESSAGES[messageIndex]]);
        messageIndex++;
      } else {
        clearInterval(messageInterval);
      }
    }, 200);

    const startTime = Date.now();
    const duration = 3000;
    
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress === 100) {
        clearInterval(progressInterval);
      }
    }, 50);

    const finishTimeout = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
      clearTimeout(finishTimeout);
    };
  }, [onComplete]);

  return (
    <motion.div 
      className="absolute inset-0 bg-black flex flex-col items-center justify-center overflow-hidden z-50 select-none"
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col items-center max-w-2xl w-full px-6">
        <h1 
          className="text-6xl font-bold font-mono tracking-wider mb-2"
          style={{ 
            color: '#00a3ff',
            textShadow: '0 0 20px #00a3ff, 0 0 40px #00a3ff, 0 0 60px #0050ff'
          }}
        >
          KALI LINUX
        </h1>
        
        <p className="text-sm text-gray-400 mb-12 font-mono">Portfolio v1.0 - by Monish</p>
        
        <div className="w-full h-48 mb-8 flex flex-col justify-end">
          {visibleMessages.map((msg, i) => (
            <div key={i} className="font-mono text-xs text-green-400 text-left w-full mb-1">
              {msg}
            </div>
          ))}
        </div>
        
        <div className="w-80 h-1.5 bg-gray-800 rounded overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      <button 
        onClick={onComplete}
        className="absolute bottom-4 right-4 text-xs text-gray-500 hover:text-gray-300 font-mono focus:outline-none"
      >
        Skip
      </button>
    </motion.div>
  );
}
