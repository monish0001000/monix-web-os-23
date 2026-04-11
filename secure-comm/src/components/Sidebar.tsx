import React, { useState } from 'react';
import { Users, Phone, Video, Clock, ArrowDownLeft, ArrowUpRight, XCircle } from 'lucide-react';
import { Peer, CallHistoryEntry } from '../types';

interface SidebarProps {
  localPeer: Peer;
  peers: Peer[];
  activeChat: Peer | null;
  callHistory: CallHistoryEntry[];
  unreadMessages?: Record<string, number>;
  onSelectChat: (peer: Peer) => void;
  onStartCall: (peerId: string, isVideo: boolean) => void;
}

export default function Sidebar({ localPeer, peers, activeChat, callHistory, unreadMessages = {}, onSelectChat, onStartCall }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'peers' | 'history'>('peers');

  return (
    <div className="w-80 bg-monix-panel border-r border-monix-border flex flex-col h-full">
      <div className="p-4 border-b border-monix-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-monix-cyan/20 border border-monix-cyan flex items-center justify-center text-monix-cyan font-bold uppercase overflow-hidden">
            {localPeer.alias.substring(0, 2)}
          </div>
          <div>
            <h2 className="text-sm uppercase tracking-widest font-bold text-monix-cyan">{localPeer.alias}</h2>
            <div className="text-xs opacity-70 text-monix-emerald flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-monix-emerald animate-pulse-fast"></div>
              SYS.ONLINE
            </div>
          </div>
        </div>
        <div className="flex border border-monix-border rounded overflow-hidden">
          <button 
            onClick={() => setActiveTab('peers')}
            className={`flex-1 py-1 text-xs uppercase tracking-widest font-bold transition-colors ${activeTab === 'peers' ? 'bg-monix-cyan text-monix-bg' : 'bg-transparent text-monix-cyan hover:bg-monix-cyan/10'}`}
          >
            Peers
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1 text-xs uppercase tracking-widest font-bold transition-colors ${activeTab === 'history' ? 'bg-monix-cyan text-monix-bg' : 'bg-transparent text-monix-cyan hover:bg-monix-cyan/10'}`}
          >
            History
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {activeTab === 'peers' ? (
          <div className="p-2">
            <div className="text-xs opacity-50 uppercase mb-2 flex items-center gap-2">
              <Users size={14} />
              Connected_Peers
            </div>
            {peers.length === 0 ? (
              <div className="text-xs opacity-50 italic">No other nodes detected.</div>
            ) : (
              peers.map(peer => {
                const isActive = activeChat?.id === peer.id;
                
                return (
                  <div
                    key={peer.id}
                    className={`w-full flex items-center justify-between p-2 border transition-colors group ${
                      isActive 
                        ? 'bg-monix-cyan/10 border-monix-cyan' 
                        : 'bg-transparent border-transparent hover:bg-monix-bg hover:border-monix-border'
                    }`}
                  >
                    <button
                      onClick={() => onSelectChat(peer)}
                      className="flex-1 flex items-center gap-3 text-left"
                    >
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-monix-bg border border-monix-border flex items-center justify-center overflow-hidden text-monix-cyan text-xs font-bold">
                          {peer.alias.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-monix-emerald border-2 border-monix-panel animate-pulse-fast shadow-[0_0_5px_rgba(0,255,128,0.8)]"></div>
                      </div>
                      <div className="flex-1 overflow-hidden flex flex-col">
                        <div className="truncate text-sm font-bold flex items-center gap-2">
                          {peer.alias}
                          {unreadMessages[peer.id] > 0 && (
                            <span className="bg-monix-emerald text-black text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                              {unreadMessages[peer.id]}
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-monix-emerald uppercase tracking-widest font-bold">Online</div>
                      </div>
                    </button>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onStartCall(peer.id, false)}
                        className="p-2 text-monix-cyan hover:bg-monix-cyan hover:text-monix-bg transition-colors rounded"
                        title="Initiate Audio Link"
                      >
                        <Phone size={14} />
                      </button>
                      <button 
                        onClick={() => onStartCall(peer.id, true)}
                        className="p-2 text-monix-cyan hover:bg-monix-cyan hover:text-monix-bg transition-colors rounded"
                        title="Initiate Video Link"
                      >
                        <Video size={14} />
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
              <Clock size={14} />
              Call_Logs
            </div>
            {callHistory.length === 0 ? (
              <div className="text-xs opacity-50 italic">No transmission history.</div>
            ) : (
              callHistory.map(log => (
                <div key={log.id} className="flex items-center justify-between p-2 border border-monix-border mb-1 bg-monix-bg">
                  <div className="flex items-center gap-3">
                    {log.type === 'incoming' && <ArrowDownLeft size={16} className="text-monix-emerald" />}
                    {log.type === 'outgoing' && <ArrowUpRight size={16} className="text-monix-cyan" />}
                    {log.type === 'missed' && <XCircle size={16} className="text-monix-red" />}
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
      
      <div className="p-3 border-t border-monix-border text-[10px] opacity-40 font-mono flex justify-between">
        <span>MONIX-OS v.1</span>
        <span>P2P_ACTIVE</span>
      </div>
    </div>
  );
}

