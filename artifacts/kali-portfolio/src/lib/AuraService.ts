import { useOSStore } from './store';

type OpenWindowFn = (id: string) => void;

const VOICE_APP_MAP: Record<string, string> = {
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

// ─── Module-level singleton state ────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _recognition: any = null;
let _openWindow: OpenWindowFn | null = null;
let _running = false;
let _wakeTimer: ReturnType<typeof setTimeout> | null = null;
let _aiDebounce: ReturnType<typeof setTimeout> | null = null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStore() {
  return useOSStore.getState();
}

function playWakeSound() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    [[880, 0], [1100, 0.14]].forEach(([freq, delay]) => {
      const osc = ctx.createOscillator();
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

function speak(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.92;
  u.pitch = 1.0;
  u.volume = 0.85;
  window.speechSynthesis.speak(u);
}

function setWakeActive(active: boolean) {
  getStore().setAuraWakeActive(active);
  if (_wakeTimer) { clearTimeout(_wakeTimer); _wakeTimer = null; }
  if (active) {
    _wakeTimer = setTimeout(() => {
      getStore().setAuraWakeActive(false);
    }, 14000);
  }
}

// ─── AI Query ────────────────────────────────────────────────────────────────

async function sendToAI(text: string) {
  const systemPrompt =
    'You are AURA, an elite native AI assistant of MONIX Web OS. Speak with a dark cyberpunk hacker aesthetic. Be extremely concise — max 3 sentences. No markdown.';
  try {
    const encoded = encodeURIComponent(systemPrompt + '\nQuery: ' + text);
    const res = await fetch('https://text.pollinations.ai/' + encoded);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const reply = await res.text();
    getStore().addAuraMessage({ id: (Date.now() + 1).toString(), role: 'assistant', text: reply });
    speak(reply.slice(0, 220));
  } catch (_) {
    getStore().addAuraMessage({
      id: (Date.now() + 1).toString(), role: 'assistant',
      text: '`SYSTEM ERROR` — Mainframe connection failed.',
    });
  }
}

// ─── Command Parser ───────────────────────────────────────────────────────────

function parseCommand(transcript: string) {
  const lower = transcript.toLowerCase().trim();

  // "open [app]"
  const openMatch = lower.match(/^(?:please\s+)?open\s+(.+)/);
  if (openMatch && _openWindow) {
    const appKey = openMatch[1].replace(/\s+/g, ' ').trim();
    const appId = VOICE_APP_MAP[appKey];
    if (appId) {
      _openWindow(appId);
      setWakeActive(false);
      return;
    }
  }

  // "search [query] on google" / "google [query]" / "search [query]"
  const searchMatch =
    lower.match(/^search\s+(.+?)\s+on\s+google$/) ||
    lower.match(/^google\s+(.+)/) ||
    lower.match(/^search\s+(.+)/);
  if (searchMatch && _openWindow) {
    const query = searchMatch[1].trim();
    _openWindow('browser');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('aura-browser-search', { detail: { query } }));
    }, 900);
    setWakeActive(false);
    return;
  }

  // "clear chat" / "clear aura"
  if (lower === 'clear' || lower.includes('clear chat') || lower.includes('clear aura') || lower.includes('clear history')) {
    getStore().clearAuraMessages();
    speak('Chat cleared, Sir.');
    setWakeActive(false);
    return;
  }

  // "close all"
  if (lower.includes('close all')) {
    window.dispatchEvent(new CustomEvent('aura-close-all'));
    speak('All windows closed.');
    setWakeActive(false);
    return;
  }

  // AI query
  getStore().addAuraMessage({ id: Date.now().toString(), role: 'user', text: transcript });
  _openWindow?.('aura');
  if (_aiDebounce) clearTimeout(_aiDebounce);
  _aiDebounce = setTimeout(() => sendToAI(transcript), 450);
  setWakeActive(false);
}

// ─── Transcript Processor ─────────────────────────────────────────────────────

function processTranscript(transcript: string) {
  const store = getStore();
  if (store.auraMuted) return;

  const lower = transcript.toLowerCase().trim();

  if (!store.auraWakeActive) {
    const wakeIdx = lower.indexOf('hey aura');
    if (wakeIdx === -1) return;

    playWakeSound();
    const afterWake = lower.slice(wakeIdx + 'hey aura'.length).trim();

    if (afterWake.length > 2) {
      setWakeActive(true);
      setTimeout(() => speak('Yes Sir!'), 120);
      setTimeout(() => parseCommand(afterWake), 1300);
    } else {
      setWakeActive(true);
      setTimeout(() => speak('Yes Sir, I am listening. How can I assist you today?'), 200);
    }
    return;
  }

  // Wake is active — parse the command
  parseCommand(transcript);
}

// ─── Recognition Lifecycle ────────────────────────────────────────────────────

function startRecognition() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognitionAPI || _recognition) return;

  const rec = new SpeechRecognitionAPI();
  rec.continuous = true;
  rec.interimResults = false;
  rec.lang = 'en-US';

  rec.onresult = (event: SpeechRecognitionEvent) => {
    const transcript = Array.from(event.results)
      .slice(event.resultIndex)
      .filter((r: SpeechRecognitionResult) => r.isFinal)
      .map((r: SpeechRecognitionResult) => r[0].transcript)
      .join('');
    if (transcript.trim()) processTranscript(transcript.trim());
  };

  rec.onend = () => {
    _recognition = null;
    if (_running && !getStore().auraMuted) {
      setTimeout(() => startRecognition(), 600);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rec.onerror = (event: any) => {
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      console.warn('[AURA Service] Microphone access denied — voice features unavailable.');
      _running = false;
      _recognition = null;
    }
    // 'no-speech', 'aborted', network errors → onend will restart
  };

  _recognition = rec;
  try { rec.start(); } catch (_) { _recognition = null; }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function startAuraService(openWindow: OpenWindowFn) {
  _openWindow = openWindow;
  _running = true;
  startRecognition();
}

export function stopAuraService() {
  _running = false;
  try { _recognition?.stop(); } catch (_) {}
  _recognition = null;
  if (_wakeTimer) { clearTimeout(_wakeTimer); _wakeTimer = null; }
  if (_aiDebounce) { clearTimeout(_aiDebounce); _aiDebounce = null; }
}

export function toggleAuraMute() {
  const store = getStore();
  const next = !store.auraMuted;
  store.setAuraMuted(next);
  if (next) {
    try { _recognition?.stop(); } catch (_) {}
  } else if (_running) {
    if (!_recognition) startRecognition();
  }
  return next;
}
