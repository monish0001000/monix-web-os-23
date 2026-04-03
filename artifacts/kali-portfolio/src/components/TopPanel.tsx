import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Wifi, WifiOff, Volume2, Battery, BatteryFull, BatteryMedium, BatteryLow } from "lucide-react";

interface TopPanelProps {
  activeWindowName: string;
}

export default function TopPanel({ activeWindowName }: TopPanelProps) {
  const [time, setTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [batteryLevel, setBatteryLevel] = useState<number>(85);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 60000); // update every minute

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Try to get battery status if available
    const getBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          const nav = navigator as any;
          const battery = await nav.getBattery();
          setBatteryLevel(Math.round(battery.level * 100));
          
          battery.addEventListener('levelchange', () => {
            setBatteryLevel(Math.round(battery.level * 100));
          });
        } catch (e) {
          // ignore
        }
      }
    };
    
    getBattery();

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getBatteryIcon = () => {
    if (batteryLevel > 90) return <BatteryFull size={14} className="text-white" />;
    if (batteryLevel > 20) return <BatteryMedium size={14} className="text-white" />;
    return <BatteryLow size={14} className="text-red-400" />;
  };

  return (
    <div 
      className="fixed top-0 left-0 w-full h-7 flex items-center justify-between px-3 z-50 select-none font-sans"
      style={{ 
        background: 'rgba(0,0,0,0.85)', 
        backdropFilter: 'blur(10px)', 
        borderBottom: '1px solid rgba(255,255,255,0.05)' 
      }}
    >
      <div className="flex items-center gap-3 h-full">
        <div className="text-white text-xs px-2 py-0.5 hover:bg-white/10 rounded cursor-pointer transition-colors font-medium">
          Activities
        </div>
        <span className="text-gray-500 text-xs">|</span>
        <div className="text-white text-xs font-medium truncate max-w-[200px]">
          {activeWindowName || ''}
        </div>
      </div>

      <div className="flex items-center gap-4 h-full">
        <div className="flex items-center justify-center cursor-pointer hover:bg-white/10 p-1 rounded transition-colors">
          {isOnline ? (
            <Wifi size={14} className="text-green-400" />
          ) : (
            <WifiOff size={14} className="text-red-400" />
          )}
        </div>
        
        <div className="flex items-center justify-center cursor-pointer hover:bg-white/10 p-1 rounded transition-colors">
          <Volume2 size={14} className="text-white" />
        </div>
        
        <div className="flex items-center gap-1 cursor-pointer hover:bg-white/10 p-1 px-2 rounded transition-colors">
          <span className="text-[10px] text-white">{batteryLevel}%</span>
          {getBatteryIcon()}
        </div>
        
        <div className="text-white text-xs font-medium cursor-pointer hover:bg-white/10 px-2 py-0.5 rounded transition-colors">
          {format(time, 'EEE HH:mm')}
        </div>
      </div>
    </div>
  );
}
