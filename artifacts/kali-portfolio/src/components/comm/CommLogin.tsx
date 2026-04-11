import { useState } from 'react';
import { Terminal } from 'lucide-react';

interface LoginProps {
  onLogin: (alias: string) => void;
}

export default function CommLogin({ onLogin }: LoginProps) {
  const [alias, setAlias] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (alias.trim()) onLogin(alias.trim());
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#050505] p-4">
      <div className="max-w-md w-full glass-panel-comm p-8 shadow-[0_0_20px_rgba(0,255,255,0.15)]">
        <div className="flex items-center gap-3 mb-8 border-b border-[#1a1a1a] pb-4">
          <Terminal className="text-[#00ffff] animate-pulse" size={32} />
          <h1 className="text-2xl font-bold tracking-widest uppercase text-[#00ffff]">MONIX_COMM</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm mb-2 opacity-80 uppercase tracking-wider text-[#00ffff]">
              [ ACCESS TERMINAL ]
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-[#00ffff] opacity-50 font-mono">{'>'}</span>
              <input
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#1a1a1a] p-3 pl-8 text-[#00ffff] focus:outline-none focus:border-[#00ffff] focus:shadow-[0_0_10px_rgba(0,255,255,0.2)] transition-all font-mono"
                placeholder="Enter Alias..."
                autoComplete="off"
                autoFocus
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!alias.trim()}
            className="w-full bg-[rgba(0,255,255,0.1)] border border-[#00ffff] text-[#00ffff] font-bold py-3 uppercase tracking-widest hover:bg-[#00ffff] hover:text-[#050505] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            INITIALIZE_UPLINK
          </button>
        </form>

        <div className="mt-8 text-xs opacity-40 text-center text-[#00ffff]">
          <p>WARNING: UNAUTHORIZED ACCESS IS STRICTLY PROHIBITED</p>
          <p className="mt-1">CONNECTION IS END-TO-END ENCRYPTED</p>
        </div>
      </div>
    </div>
  );
}
