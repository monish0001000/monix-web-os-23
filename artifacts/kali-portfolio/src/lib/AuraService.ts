// ─── AuraService — Pure factory, no store dependency ─────────────────────────
// All store interaction is done via the callbacks injected at creation time.

export interface AuraMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export interface AuraServiceCallbacks {
  isArmed:        () => boolean;
  isWakeActive:   () => boolean;
  isMuted:        () => boolean;
  setArmed:       (v: boolean) => void;
  setWakeActive:  (v: boolean) => void;
  setHearingSound:(v: boolean) => void;
  addMessage:     (msg: AuraMessage) => void;
  clearMessages:  () => void;
  openWindow:     (id: string) => void;
}

export interface AuraServiceHandle {
  start:       () => void;
  stop:        () => void;
  manualWake:  () => void;
}

// ─── Wake word ────────────────────────────────────────────────────────────────
const WAKE_WORD       = 'hey buddy';
const WAKE_WORD_RE    = /hey\s+buddy/i;

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

// ─── Female voice picker ──────────────────────────────────────────────────────
function pickFemaleVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const priority = [
    'Google US English',
    'Microsoft Zira - English (United States)',
    'Microsoft Jenny Online (Natural) - English (United States)',
    'Microsoft Ana Online (Natural) - English (United States)',
    'Samantha',
    'Karen',
    'Moira',
    'Tessa',
    'Fiona',
  ];

  for (const name of priority) {
    const v = voices.find(v => v.name === name);
    if (v) return v;
  }

  const enUS = voices.filter(v => v.lang.startsWith('en'));
  return (
    enUS.find(v => /female|woman|girl|zira|jenny|ana|samantha|karen|moira|tessa|fiona/i.test(v.name)) ||
    enUS[0] ||
    voices[0] ||
    null
  );
}

// ─── speak() with clear female voice ─────────────────────────────────────────
export function speak(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  function doSpeak() {
    const u   = new SpeechSynthesisUtterance(text);
    const voice = pickFemaleVoice();
    if (voice) u.voice = voice;
    u.rate   = 1.0;   // clear, natural speed
    u.pitch  = 1.2;   // distinctly female
    u.volume = 0.95;
    u.lang   = 'en-US';
    window.speechSynthesis.speak(u);
  }

  if (window.speechSynthesis.getVoices().length > 0) {
    doSpeak();
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      doSpeak();
    };
  }
}

// ─── Wake chime ───────────────────────────────────────────────────────────────
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
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + delay + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.25);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.28);
    });
  } catch (_) {}
}

// ─── Sliding-window wake-word check ──────────────────────────────────────────
// Returns the text that came AFTER the wake word, or null if no match.
function slidingWindowCheck(transcript: string): string | null {
  const lower = transcript.toLowerCase();

  // Check the last 5 words for the wake word (sliding window)
  const words    = lower.trim().split(/\s+/);
  const window5  = words.slice(-5).join(' ');

  if (WAKE_WORD_RE.test(window5) || WAKE_WORD_RE.test(lower)) {
    // Extract any command text that follows the wake word
    const match = lower.match(new RegExp(WAKE_WORD + '\\s*(.*)', 'i'));
    return match ? match[1].trim() : '';
  }
  return null;
}

// ─── Service Factory ──────────────────────────────────────────────────────────
export function createAuraService(cb: AuraServiceCallbacks): AuraServiceHandle {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recognition: any = null;
  let running          = false;
  let wakeTimer:    ReturnType<typeof setTimeout> | null = null;
  let aiDebounce:   ReturnType<typeof setTimeout> | null = null;

  // Dedup guard — prevents the same spoken phrase from double-triggering wake
  let wakeFiredAt        = 0;
  const WAKE_COOLDOWN_MS = 3000;

  // ── Wake-active management ─────────────────────────────────────────────────
  function setWakeActive(active: boolean) {
    cb.setWakeActive(active);
    if (wakeTimer) { clearTimeout(wakeTimer); wakeTimer = null; }
    if (active) {
      wakeTimer = setTimeout(() => {
        cb.setWakeActive(false);
        cb.setHearingSound(false);
        speak('Standing by, Sir.');
      }, 18000);
    }
  }

  // ── AI fallback ────────────────────────────────────────────────────────────
  async function sendToAI(text: string) {
    const systemPrompt =
      'You are AURA, an elite native AI of MONIX Web OS. Cyberpunk hacker aesthetic. Max 3 sentences. No markdown.';
    try {
      const res = await fetch(
        'https://text.pollinations.ai/' +
        encodeURIComponent(systemPrompt + '\nQuery: ' + text)
      );
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const reply = await res.text();
      cb.addMessage({ id: (Date.now() + 1).toString(), role: 'assistant', text: reply });
      speak(reply.slice(0, 220));
    } catch (_) {
      cb.addMessage({
        id: (Date.now() + 1).toString(), role: 'assistant',
        text: '`SYSTEM ERROR` — Mainframe connection failed.',
      });
    }
  }

  // ── Command parser ─────────────────────────────────────────────────────────
  function parseCommand(transcript: string) {
    // Strip any residual wake word fragments
    const clean = transcript.replace(WAKE_WORD_RE, '').trim();
    const lower = clean.toLowerCase();

    if (!lower || lower.length < 2) return;

    // open [app]
    const openMatch = lower.match(/^(?:please\s+)?open\s+(.+)/);
    if (openMatch) {
      const appKey = openMatch[1].replace(/\s+/g, ' ').trim();
      const appId  = VOICE_APP_MAP[appKey];
      if (appId) {
        speak('Executing now, Sir.');
        cb.openWindow(appId);
        setWakeActive(false);
        return;
      }
    }

    // search [query] on google / search [query] / google [query]
    const searchMatch =
      lower.match(/^search\s+(.+?)\s+on\s+google$/) ||
      lower.match(/^google\s+(.+)/)                  ||
      lower.match(/^search\s+(.+)/);
    if (searchMatch) {
      const query = searchMatch[1].trim();
      speak('Executing now, Sir.');
      cb.openWindow('browser');
      setTimeout(
        () => window.dispatchEvent(new CustomEvent('aura-browser-search', { detail: { query } })),
        900
      );
      setWakeActive(false);
      return;
    }

    // type [text] — finds the focused input and types
    const typeMatch = lower.match(/^type\s+(.+)/);
    if (typeMatch) {
      const textToType = typeMatch[1].trim();
      speak('Typing now, Sir.');
      window.dispatchEvent(new CustomEvent('aura-type-text', { detail: { text: textToType } }));
      setWakeActive(false);
      return;
    }

    // tell me about / what is / explain
    const tellMatch = lower.match(/^(?:tell me about|what is|explain)\s+(.+)/);
    if (tellMatch) {
      const topic = tellMatch[1].trim();
      cb.addMessage({ id: Date.now().toString(), role: 'user', text: `Tell me about ${topic}` });
      cb.openWindow('aura');
      speak('Executing now, Sir.');
      setWakeActive(false);
      if (aiDebounce) clearTimeout(aiDebounce);
      aiDebounce = setTimeout(() => sendToAI(`Tell me about ${topic}`), 450);
      return;
    }

    // clear chat
    if (/clear\s*(chat|aura|history)?/.test(lower)) {
      cb.clearMessages();
      speak('Chat cleared, Sir.');
      setWakeActive(false);
      return;
    }

    // close all
    if (lower.includes('close all')) {
      window.dispatchEvent(new CustomEvent('aura-close-all'));
      speak('All windows closed, Sir.');
      setWakeActive(false);
      return;
    }

    // Generic AI query
    cb.addMessage({ id: Date.now().toString(), role: 'user', text: clean || transcript });
    cb.openWindow('aura');
    speak('On it, Sir.');
    if (aiDebounce) clearTimeout(aiDebounce);
    aiDebounce = setTimeout(() => sendToAI(clean || transcript), 450);
    setWakeActive(false);
  }

  // ── Wake trigger (from voice OR manual) ───────────────────────────────────
  function triggerWake(afterText: string) {
    const now = Date.now();
    if (now - wakeFiredAt < WAKE_COOLDOWN_MS) return;
    wakeFiredAt = now;

    playWakeSound();
    setWakeActive(true);

    if (afterText.length > 2) {
      speak('Yes Sir, I am listening.');
      setTimeout(() => parseCommand(afterText), 1300);
    } else {
      speak('Yes Sir, I am here. Ready for your command.');
    }
  }

  // ── Recognition lifecycle ──────────────────────────────────────────────────
  function startRecognition() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const API = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!API || recognition) return;

    const rec = new API();
    rec.continuous     = true;
    rec.interimResults = true;   // fire on PARTIAL speech → instant wake detection
    rec.lang           = 'en-US';
    rec.maxAlternatives = 1;

    rec.onstart = () => { cb.setArmed(true); };

    // Sound-level callbacks — used to pulse AuraBall in sync
    rec.onsoundstart = () => { if (cb.isWakeActive()) cb.setHearingSound(true); };
    rec.onsoundend   = () => { cb.setHearingSound(false); };
    rec.onspeechend  = () => { cb.setHearingSound(false); };

    rec.onresult = (event: SpeechRecognitionEvent) => {
      if (cb.isMuted()) return;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result     = event.results[i];
        const transcript = result[0].transcript;
        const lower      = transcript.toLowerCase().trim();
        const isFinal    = result.isFinal;

        // ── Wake word: check every chunk (interim + final) with sliding window ──
        if (!cb.isWakeActive()) {
          const afterText = slidingWindowCheck(lower);
          if (afterText !== null) {
            triggerWake(afterText);
            return;
          }
        }

        // ── Command: only final results to avoid noise ──
        if (isFinal && cb.isWakeActive()) {
          const cleaned = lower.replace(WAKE_WORD_RE, '').trim();
          if (cleaned.length > 1) {
            parseCommand(transcript);
          }
        }
      }
    };

    rec.onend = () => {
      recognition = null;
      cb.setHearingSound(false);
      if (running && !cb.isMuted()) {
        // Immediately restart — AURA must always be listening
        setTimeout(startRecognition, 250);
      } else {
        cb.setArmed(false);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (event: any) => {
      const fatal = event.error === 'not-allowed' || event.error === 'service-not-allowed';
      if (fatal) {
        console.warn('[AURA] Mic access denied.');
        running = false;
        recognition = null;
        cb.setArmed(false);
        cb.setHearingSound(false);
        return;
      }
      // Non-fatal (no-speech, network, aborted) — clear ref, let onend restart
      recognition = null;
      cb.setHearingSound(false);
    };

    recognition = rec;
    try {
      rec.start();
    } catch (_) {
      recognition = null;
      if (running) setTimeout(startRecognition, 800);
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
      cb.setHearingSound(false);
      if (wakeTimer)  { clearTimeout(wakeTimer);  wakeTimer  = null; }
      if (aiDebounce) { clearTimeout(aiDebounce); aiDebounce = null; }
    },
    manualWake() {
      triggerWake('');
    },
  };
}
