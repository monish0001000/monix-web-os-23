import { useState, useRef, useEffect } from 'react';
import { Send, Terminal, Phone, Video } from 'lucide-react';
import { Message, Peer } from './CommTypes';

interface ChatProps {
  localPeer: Peer;
  activeChat: Peer | null;
  messages: Message[];
  fileProgress: Record<string, number>;
  onSendMessage: (content: string, imageBase64?: string, fileName?: string) => void;
  onSendFile: (file: File) => void;
  onStartCall: (peerId: string, isVideo: boolean) => void;
}

export default function CommChat({ localPeer, activeChat, messages, fileProgress, onSendMessage, onSendFile, onStartCall }: ChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) { onSendMessage(input.trim()); setInput(''); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onSendFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = (base64: string, fileName: string) => {
    const a = document.createElement('a');
    a.href = base64;
    a.download = fileName || 'monix_intercept.bin';
    a.click();
  };

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#050505] opacity-50">
        <Terminal size={48} className="mb-4 text-[#00ffff]" />
        <p className="uppercase tracking-widest text-[#00ffff]">Select a node to establish connection</p>
      </div>
    );
  }

  const chatMessages = messages.filter(m =>
    (m.from === localPeer.id && m.to === activeChat.id) ||
    (m.from === activeChat.id && m.to === localPeer.id)
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050505] relative overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#1a1a1a] bg-[#0a0a0a] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Terminal className="text-[#00ffff]" size={20} />
          <div>
            <h2 className="uppercase tracking-widest font-bold text-[#00ffff]">{activeChat.alias}</h2>
            <div className="text-[10px] opacity-50">SECURE_LINK_ESTABLISHED</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onStartCall(activeChat.id, false)} className="p-2 border border-[#1a1a1a] text-[#00ffff] hover:bg-[#00ffff] hover:text-[#050505] transition-colors" title="Audio Call">
            <Phone size={16} />
          </button>
          <button onClick={() => onStartCall(activeChat.id, true)} className="p-2 border border-[#1a1a1a] text-[#00ffff] hover:bg-[#00ffff] hover:text-[#050505] transition-colors" title="Video Call">
            <Video size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center opacity-50 italic text-[#00ffff]">
            Awaiting transmissions...
          </div>
        ) : (
          chatMessages.map(msg => {
            const isMe = msg.from === localPeer.id;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="text-[10px] opacity-50 mb-1 flex items-center gap-2 text-[#00ffff]">
                  <span>{isMe ? 'ME' : activeChat.alias}</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className={`max-w-[70%] p-3 border ${isMe ? 'bg-[rgba(0,255,255,0.1)] border-[#00ffff] text-[#00ffff]' : 'bg-[#0a0a0a] border-[#1a1a1a] text-gray-300'}`}>
                  <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                  {msg.imageBase64 && (
                    <div className="mt-3">
                      {msg.imageBase64.startsWith('data:video/') ? (
                        <video src={msg.imageBase64} controls className="max-w-full rounded border border-[rgba(0,255,255,0.3)] mb-2" />
                      ) : msg.imageBase64.startsWith('data:audio/') ? (
                        <audio src={msg.imageBase64} controls className="w-full mb-2" />
                      ) : msg.imageBase64.startsWith('data:image/') ? (
                        <img src={msg.imageBase64} alt="payload" className="max-w-full rounded border border-[rgba(0,255,255,0.3)] mb-2" />
                      ) : (
                        <div className="p-2 border border-[rgba(0,255,255,0.3)] mb-2 flex items-center gap-2">
                          <Terminal size={16} />
                          <span className="text-sm truncate">{msg.fileName || 'Unknown File'}</span>
                        </div>
                      )}
                      <button
                        onClick={() => handleDownload(msg.imageBase64!, msg.fileName || 'monix_intercept.bin')}
                        className="text-[10px] bg-[rgba(0,255,255,0.2)] text-[#00ffff] px-2 py-1 border border-[#00ffff] hover:bg-[#00ffff] hover:text-black transition-colors flex items-center gap-1 uppercase font-bold"
                      >
                        ⬇ DOWNLOAD
                      </button>
                    </div>
                  )}
                </div>
                {isMe && (
                  <div className="text-[8px] opacity-50 mt-1 uppercase text-[#00ffff]">
                    {msg.status === 'read' ? 'READ' : msg.status === 'delivered' ? 'DELIVERED' : 'SENT'}
                  </div>
                )}
              </div>
            );
          })
        )}

        {Object.entries(fileProgress).map(([fileId, progress]) => (
          <div key={fileId} className="flex flex-col items-end">
            <div className="text-[10px] opacity-50 mb-1 text-[#00ffff]">UPLOADING...</div>
            <div className="w-48 p-2 border bg-[rgba(0,255,255,0.1)] border-[#00ffff] text-[#00ffff]">
              <div className="flex justify-between text-xs mb-1">
                <span>TRANSMITTING</span><span>{progress}%</span>
              </div>
              <div className="w-full bg-[#050505] h-1">
                <div className="bg-[#00ffff] h-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#1a1a1a] bg-[#0a0a0a] shrink-0">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 bg-[#0a0a0a] border border-[#1a1a1a] text-[#00ffff] font-bold hover:bg-[#00ffff] hover:text-[#050505] transition-colors" title="Attach File">
            +
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <div className="flex-1 relative">
            <span className="absolute left-3 top-3 opacity-50 text-[#00ffff]">{'>'}</span>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Enter transmission..."
              className="w-full bg-[#050505] border border-[#1a1a1a] p-3 pl-8 text-[#00ffff] focus:outline-none focus:border-[#00ffff] transition-colors"
              autoComplete="off"
            />
          </div>
          <button type="submit" disabled={!input.trim()} className="p-3 bg-[rgba(0,255,255,0.2)] border border-[#00ffff] text-[#00ffff] font-bold hover:bg-[#00ffff] hover:text-[#050505] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
