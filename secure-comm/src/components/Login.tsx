import React, { useState } from 'react';
import { Terminal } from 'lucide-react';

interface LoginProps {
  onLogin: (alias: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [alias, setAlias] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (alias.trim()) {
      onLogin(alias.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-monix-bg crt-scanlines p-4">
      <div className="max-w-md w-full glass-panel p-8 shadow-[0_0_20px_rgba(0,255,255,0.15)]">
        <div className="flex items-center gap-3 mb-8 border-b border-monix-border pb-4">
          <Terminal className="text-monix-cyan animate-pulse-fast" size={32} />
          <h1 className="text-2xl font-bold tracking-widest uppercase text-monix-cyan">MONIX_COMM</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="alias" className="block text-sm mb-2 opacity-80 uppercase tracking-wider text-monix-cyan">
              [ ACCESS TERMINAL ]
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-monix-cyan opacity-50 font-mono">{'>'}</span>
              <input
                type="text"
                id="alias"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                className="w-full bg-monix-panel border border-monix-border p-3 pl-8 text-monix-cyan focus:outline-none focus:border-monix-cyan focus:shadow-[0_0_10px_rgba(0,255,255,0.2)] transition-all font-mono"
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
            className="w-full bg-monix-cyan/10 border border-monix-cyan text-monix-cyan font-bold py-3 uppercase tracking-widest hover:bg-monix-cyan hover:text-monix-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            INITIALIZE_UPLINK
          </button>
        </form>
        
        <div className="mt-8 text-xs opacity-40 text-center text-monix-cyan">
          <p>WARNING: UNAUTHORIZED ACCESS IS STRICTLY PROHIBITED</p>
          <p className="mt-1">CONNECTION IS END-TO-END ENCRYPTED</p>
        </div>
      </div>
    </div>
  );
}
