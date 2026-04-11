import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, Phone, Video } from 'lucide-react';
import { Message, Peer } from '../types';

interface ChatProps {
  localPeer: Peer;
  activeChat: Peer | null;
  messages: Message[];
  fileProgress: Record<string, number>;
  onSendMessage: (content: string, imageBase64?: string, fileName?: string) => void;
  onSendFile: (file: File) => void;
  onStartCall: (peerId: string, isVideo: boolean) => void;
}

export default function Chat({ localPeer, activeChat, messages, fileProgress, onSendMessage, onSendFile, onStartCall }: ChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onSendFile(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = (base64: string, fileName: string) => {
    const a = document.createElement('a');
    a.href = base64;
    a.download = fileName || 'monix_intercept.png';
    a.click();
  };

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-monix-bg opacity-50">
        <Terminal size={48} className="mb-4 text-monix-cyan" />
        <p className="uppercase tracking-widest">Select a node to establish connection</p>
      </div>
    );
  }

  // Filter messages for the active chat
  const chatMessages = messages.filter(m => 
    (m.from === localPeer.id && m.to === activeChat.id) ||
    (m.from === activeChat.id && m.to === localPeer.id)
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-monix-bg relative">
      {/* Header */}
      <div className="p-4 border-b border-monix-border bg-monix-panel flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal className="text-monix-cyan" size={20} />
          <div>
            <h2 className="uppercase tracking-widest font-bold text-monix-cyan">{activeChat.alias}</h2>
            <div className="text-[10px] opacity-50">SECURE_LINK_ESTABLISHED</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onStartCall(activeChat.id, false)}
            className="p-2 border border-monix-border text-monix-cyan hover:bg-monix-cyan hover:text-monix-bg transition-colors"
            title="Initiate Audio Link"
          >
            <Phone size={16} />
          </button>
          <button 
            onClick={() => onStartCall(activeChat.id, true)}
            className="p-2 border border-monix-border text-monix-cyan hover:bg-monix-cyan hover:text-monix-bg transition-colors"
            title="Initiate Video Link"
          >
            <Video size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center opacity-50 italic">
            Awaiting transmissions...
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isMe = msg.from === localPeer.id;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="text-[10px] opacity-50 mb-1 flex items-center gap-2">
                  <span>{isMe ? 'ME' : activeChat.alias}</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div 
                  className={`max-w-[70%] p-3 border ${
                    isMe 
                      ? 'bg-monix-cyan/10 border-monix-cyan text-monix-cyan' 
                      : 'bg-monix-panel border-monix-border text-gray-300'
                  }`}
                >
                  <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                  {msg.imageBase64 && (
                    <div className="mt-3">
                      {msg.imageBase64.startsWith('data:video/') ? (
                        <video src={msg.imageBase64} controls className="max-w-full rounded border border-monix-cyan/30 mb-2" />
                      ) : msg.imageBase64.startsWith('data:audio/') ? (
                        <audio src={msg.imageBase64} controls className="w-full mb-2" />
                      ) : msg.imageBase64.startsWith('data:image/') ? (
                        <img src={msg.imageBase64} alt="intercepted payload" className="max-w-full rounded border border-monix-cyan/30 mb-2" />
                      ) : (
                        <div className="p-2 border border-monix-cyan/30 mb-2 flex items-center gap-2">
                          <Terminal size={16} />
                          <span className="text-sm truncate">{msg.fileName || 'Unknown File'}</span>
                        </div>
                      )}
                      <button
                        onClick={() => handleDownload(msg.imageBase64!, msg.fileName || 'monix_intercept.bin')}
                        className="text-[10px] bg-monix-cyan/20 text-monix-cyan px-2 py-1 border border-monix-cyan hover:bg-monix-cyan hover:text-black transition-colors flex items-center gap-1 uppercase font-bold"
                      >
                        ⬇️ DOWNLOAD INTERCEPT
                      </button>
                    </div>
                  )}
                </div>
                {isMe && (
                  <div className="text-[8px] opacity-50 mt-1 uppercase">
                    {msg.status === 'read' ? 'READ' : msg.status === 'delivered' ? 'DELIVERED' : 'SENT'}
                  </div>
                )}
              </div>
            );
          })
        )}
        
        {/* File Progress Indicators */}
        {Object.entries(fileProgress).map(([fileId, progress]) => (
          <div key={fileId} className="flex flex-col items-end">
            <div className="text-[10px] opacity-50 mb-1">UPLOADING...</div>
            <div className="w-48 p-2 border bg-monix-cyan/10 border-monix-cyan text-monix-cyan">
              <div className="flex justify-between text-xs mb-1">
                <span>TRANSMITTING</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-monix-bg h-1">
                <div className="bg-monix-cyan h-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-monix-border bg-monix-panel">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-monix-panel border border-monix-border text-monix-cyan font-bold hover:bg-monix-cyan hover:text-monix-bg transition-colors"
            title="Attach File"
          >
            +
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />
          <div className="flex-1 relative">
            <span className="absolute left-3 top-3 opacity-50 text-monix-cyan">{'>'}</span>
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Enter transmission..."
              className="w-full bg-monix-bg border border-monix-border p-3 pl-8 text-monix-cyan focus:outline-none focus:border-monix-cyan transition-colors"
              autoComplete="off"
            />
          </div>
          
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-3 bg-monix-cyan/20 border border-monix-cyan text-monix-cyan font-bold hover:bg-monix-cyan hover:text-monix-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}

