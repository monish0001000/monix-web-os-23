// ─── AuraService — Pure factory, no store dependency ─────────────────────────
// All store interaction is done via the callbacks injected at creation time.

export interface AuraMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export interface AuraServiceCallbacks {
  isArmed:      () => boolean;
  isWakeActive: () => boolean;
  isMuted:      () => boolean;
  setArmed:     (v: boolean) => void;
  setWakeActive:(v: boolean) => void;
  addMessage:   (msg: AuraMessage) => void;
  clearMessages:() => void;
  openWindow:   (id: string) => void;
}

export interface AuraServiceHandle {
  start: () => void;
  stop:  () => void;
}

// ─── App → Window ID map ─────────────────────────────────────────────────────

export const VOICE_APP_MAP: Record<string, string> = {
  browser: 'browser', chrome: 'browser', 'google chrome': 'browser',
  files: 'files', 'file manager': 'files', 'file explorer': 'files',
  github: 'github',
  portfolio: 'portfolio',
  settings: 'settings',
  sentinel: 'sentinel', soc: 'sentinel', 'sentinel soc': 'sentinel',
  cyberchef: 'cyberchef', 'cyber chef': 'cyberchef',
  'code studio': 'codestudio', codestudio: 'codestudio', 'code editor': 'codestudio',
  chess: 'chess',
  cykrypt: 'cykrypt',
  'task manager': 'taskmanager', taskmanager: 'taskmanager', tasks: 'taskmanager',
  terminal: 'terminal', console: 'terminal',
  dossier: 'dossier', classified: 'dossier',
  trash: 'trash',
  'secure comm': 'securecomm', securecomm: 'securecomm',
  aura: 'aura',
};

// ─── Pure utilities ───────────────────────────────────────────────────────────

export function speak(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.92;
  u.pitch = 1.0;
  u.volume = 0.85;
  window.speechSynthesis.speak(u);
}

export function playWakeSound() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    [[880, 0], [1100, 0.14]].forEach(([freq, delay]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + delay + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.22);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.25);
    });
  } catch (_) {}
}

// ─── Service Factory ──────────────────────────────────────────────────────────

export function createAuraService(cb: AuraServiceCallbacks): AuraServiceHandle {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recognition: any = null;
  let running = false;
  let wakeTimer: ReturnType<typeof setTimeout> | null = null;
  let aiDebounce: ReturnType<typeof setTimeout> | null = null;

  function setWakeActive(active: boolean) {
    cb.setWakeActive(active);
    if (wakeTimer) { clearTimeout(wakeTimer); wakeTimer = null; }
    if (active) {
      wakeTimer = setTimeout(() => cb.setWakeActive(false), 14000);
    }
  }

  async function sendToAI(text: string) {
    const systemPrompt =
      'You are AURA, an elite native AI of MONIX Web OS. Cyberpunk hacker aesthetic. Max 3 sentences. No markdown.';
    try {
      const res = await fetch('https://text.pollinations.ai/' + encodeURIComponent(systemPrompt + '\nQuery: ' + text));
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const reply = await res.text();
      cb.addMessage({ id: (Date.now() + 1).toString(), role: 'assistant', text: reply });
      speak(reply.slice(0, 220));
    } catch (_) {
      cb.addMessage({ id: (Date.now() + 1).toString(), role: 'assistant', text: '`SYSTEM ERROR` — Mainframe connection failed.' });
    }
  }

  function parseCommand(transcript: string) {
    const lower = transcript.toLowerCase().trim();

    // open [app]
    const openMatch = lower.match(/^(?:please\s+)?open\s+(.+)/);
    if (openMatch) {
      const appId = VOICE_APP_MAP[openMatch[1].replace(/\s+/g, ' ').trim()];
      if (appId) { cb.openWindow(appId); setWakeActive(false); return; }
    }

    // search [query] on google / google [query] / search [query]
    const searchMatch =
      lower.match(/^search\s+(.+?)\s+on\s+google$/) ||
      lower.match(/^google\s+(.+)/)                 ||
      lower.match(/^search\s+(.+)/);
    if (searchMatch) {
      const query = searchMatch[1].trim();
      cb.openWindow('browser');
      setTimeout(() => window.dispatchEvent(new CustomEvent('aura-browser-search', { detail: { query } })), 900);
      setWakeActive(false);
      return;
    }

    // clear chat
    if (lower === 'clear' || lower.includes('clear chat') || lower.includes('clear aura') || lower.includes('clear history')) {
      cb.clearMessages();
      speak('Chat cleared, Sir.');
      setWakeActive(false);
      return;
    }

    // close all
    if (lower.includes('close all')) {
      window.dispatchEvent(new CustomEvent('aura-close-all'));
      speak('All windows closed.');
      setWakeActive(false);
      return;
    }

    // AI query
    cb.addMessage({ id: Date.now().toString(), role: 'user', text: transcript });
    cb.openWindow('aura');
    if (aiDebounce) clearTimeout(aiDebounce);
    aiDebounce = setTimeout(() => sendToAI(transcript), 450);
    setWakeActive(false);
  }

  function processTranscript(transcript: string) {
    if (cb.isMuted()) return;
    const lower = transcript.toLowerCase().trim();

    if (!cb.isWakeActive()) {
      const idx = lower.indexOf('hey aura');
      if (idx === -1) return;
      playWakeSound();
      const after = lower.slice(idx + 'hey aura'.length).trim();
      if (after.length > 2) {
        setWakeActive(true);
        setTimeout(() => speak('Yes Sir!'), 120);
        setTimeout(() => parseCommand(after), 1300);
      } else {
        setWakeActive(true);
        setTimeout(() => speak('Yes Sir, I am listening. How can I assist you today?'), 200);
      }
      return;
    }

    parseCommand(transcript);
  }

  function startRecognition() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const API = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!API || recognition) return;

    const rec = new API();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.maxAlternatives = 1;

    rec.onstart = () => { cb.setArmed(true); };

    rec.onresult = (event: SpeechRecognitionEvent) => {
      const text = Array.from(event.results)
        .slice(event.resultIndex)
        .filter((r: SpeechRecognitionResult) => r.isFinal)
        .map((r: SpeechRecognitionResult) => r[0].transcript)
        .join('');
      if (text.trim()) processTranscript(text.trim());
    };

    rec.onend = () => {
      recognition = null;
      if (running && !cb.isMuted()) setTimeout(startRecognition, 700);
      else cb.setArmed(false);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (event: any) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        console.warn('[AURA] Mic access denied.');
        running = false;
        recognition = null;
        cb.setArmed(false);
      }
    };

    recognition = rec;
    try {
      rec.start();
    } catch (err) {
      console.warn('[AURA] Could not start recognition:', err);
      recognition = null;
    }
  }

  return {
    start() {
      if (running) return;
      running = true;
      startRecognition();
    },
    stop() {
      running = false;
      try { recognition?.abort(); } catch (_) {}
      recognition = null;
      cb.setArmed(false);
      cb.setWakeActive(false);
      if (wakeTimer)  { clearTimeout(wakeTimer);  wakeTimer  = null; }
      if (aiDebounce) { clearTimeout(aiDebounce); aiDebounce = null; }
    },
  };
}
