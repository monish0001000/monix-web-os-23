import { useState } from 'react';
import { Users, Phone, Video, Clock, ArrowDownLeft, ArrowUpRight, XCircle } from 'lucide-react';
import { Peer, CallHistoryEntry } from './CommTypes';

interface SidebarProps {
  localPeer: Peer;
  peers: Peer[];
  activeChat: Peer | null;
  callHistory: CallHistoryEntry[];
  unreadMessages?: Record<string, number>;
  onSelectChat: (peer: Peer) => void;
  onStartCall: (peerId: string, isVideo: boolean) => void;
}

export default function CommSidebar({ localPeer, peers, activeChat, callHistory, unreadMessages = {}, onSelectChat, onStartCall }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'peers' | 'history'>('peers');

  return (
    <div className="w-72 bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[rgba(0,255,255,0.2)] border border-[#00ffff] flex items-center justify-center text-[#00ffff] font-bold uppercase">
            {localPeer.alias.substring(0, 2)}
          </div>
          <div>
            <h2 className="text-sm uppercase tracking-widest font-bold text-[#00ffff]">{localPeer.alias}</h2>
            <div className="text-xs opacity-70 text-[#10b981] flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
              SYS.ONLINE
            </div>
          </div>
        </div>
        <div className="flex border border-[#1a1a1a] rounded overflow-hidden">
          {(['peers', 'history'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1 text-xs uppercase tracking-widest font-bold transition-colors ${activeTab === tab ? 'bg-[#00ffff] text-[#050505]' : 'bg-transparent text-[#00ffff] hover:bg-[rgba(0,255,255,0.1)]'}`}
            >
              {tab === 'peers' ? 'Peers' : 'History'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {activeTab === 'peers' ? (
          <div className="p-2">
            <div className="text-xs opacity-50 uppercase mb-2 flex items-center gap-2">
              <Users size={14} /> Connected_Peers
            </div>
            {peers.length === 0 ? (
              <div className="text-xs opacity-50 italic">No other nodes detected.</div>
            ) : (
              peers.map(peer => {
                const isActive = activeChat?.id === peer.id;
                return (
                  <div
                    key={peer.id}
                    className={`w-full flex items-center justify-between p-2 border transition-colors group ${isActive ? 'bg-[rgba(0,255,255,0.1)] border-[#00ffff]' : 'bg-transparent border-transparent hover:bg-[#050505] hover:border-[#1a1a1a]'}`}
                  >
                    <button onClick={() => onSelectChat(peer)} className="flex-1 flex items-center gap-3 text-left">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-[#050505] border border-[#1a1a1a] flex items-center justify-center text-[#00ffff] text-xs font-bold">
                          {peer.alias.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-[#10b981] border-2 border-[#0a0a0a] animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="truncate text-sm font-bold flex items-center gap-2">
                          {peer.alias}
                          {unreadMessages[peer.id] > 0 && (
                            <span className="bg-[#10b981] text-black text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                              {unreadMessages[peer.id]}
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-[#10b981] uppercase tracking-widest font-bold">Online</div>
                      </div>
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onStartCall(peer.id, false)} className="p-1.5 text-[#00ffff] hover:bg-[#00ffff] hover:text-[#050505] transition-colors rounded" title="Audio Call">
                        <Phone size={13} />
                      </button>
                      <button onClick={() => onStartCall(peer.id, true)} className="p-1.5 text-[#00ffff] hover:bg-[#00ffff] hover:text-[#050505] transition-colors rounded" title="Video Call">
                        <Video size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="p-2">
            <div className="text-xs opacity-50 uppercase mb-2 flex items-center gap-2">
              <Clock size={14} /> Call_Logs
            </div>
            {callHistory.length === 0 ? (
              <div className="text-xs opacity-50 italic">No transmission history.</div>
            ) : (
              callHistory.map(log => (
                <div key={log.id} className="flex items-center justify-between p-2 border border-[#1a1a1a] mb-1 bg-[#050505]">
                  <div className="flex items-center gap-3">
                    {log.type === 'incoming' && <ArrowDownLeft size={16} className="text-[#10b981]" />}
                    {log.type === 'outgoing' && <ArrowUpRight size={16} className="text-[#00ffff]" />}
                    {log.type === 'missed' && <XCircle size={16} className="text-[#ff003c]" />}
                    <div>
                      <div className="text-sm font-bold">{log.peerAlias}</div>
                      <div className="text-[10px] opacity-50">{new Date(log.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-[#1a1a1a] text-[10px] opacity-40 font-mono flex justify-between">
        <span>MONIX-OS v.1</span>
        <span>P2P_ACTIVE</span>
      </div>
    </div>
  );
}
