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

// ─── Female voice picker ──────────────────────────────────────────────────────

function pickFemaleVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  // Priority order — highest quality first
  const priority = [
    'Google US English',
    'Microsoft Zira - English (United States)',
    'Microsoft Jenny Online (Natural) - English (United States)',
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

  // Fallback: any en-US voice that contains "female" in the name or URI
  const enUS = voices.filter(v => v.lang.startsWith('en'));
  return (
    enUS.find(v => /female|woman|girl|zira|jenny|samantha|karen|moira|tessa|fiona/i.test(v.name)) ||
    enUS[0] ||
    voices[0] ||
    null
  );
}

// ─── speak() with female voice ────────────────────────────────────────────────

export function speak(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  function doSpeak() {
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickFemaleVoice();
    if (voice) u.voice = voice;
    u.rate   = 0.94;
    u.pitch  = 1.08;
    u.volume = 0.92;
    u.lang   = 'en-US';
    window.speechSynthesis.speak(u);
  }

  // Voices may not be loaded yet — wait for them
  if (window.speechSynthesis.getVoices().length > 0) {
    doSpeak();
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      doSpeak();
    };
  }
}

// ─── Wake sound ───────────────────────────────────────────────────────────────

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

  // Prevent duplicate wake triggers from the same utterance
  let wakeFiredAt = 0;
  const WAKE_COOLDOWN_MS = 3000;

  function setWakeActive(active: boolean) {
    cb.setWakeActive(active);
    if (wakeTimer) { clearTimeout(wakeTimer); wakeTimer = null; }
    if (active) {
      // Auto-cancel wake if no command arrives in 18 s
      wakeTimer = setTimeout(() => {
        cb.setWakeActive(false);
        speak('Standing by, Sir.');
      }, 18000);
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

    // ── open [app] ──────────────────────────────────────────────────────────
    const openMatch = lower.match(/^(?:please\s+)?open\s+(.+)/);
    if (openMatch) {
      const appKey = openMatch[1].replace(/\s+/g, ' ').trim();
      const appId = VOICE_APP_MAP[appKey];
      if (appId) {
        speak('Executing now, Sir.');
        cb.openWindow(appId);
        setWakeActive(false);
        return;
      }
    }

    // ── search [query] on google / google [query] / search [query] ──────────
    const searchMatch =
      lower.match(/^search\s+(.+?)\s+on\s+google$/) ||
      lower.match(/^google\s+(.+)/)                  ||
      lower.match(/^search\s+(.+)/);
    if (searchMatch) {
      const query = searchMatch[1].trim();
      speak('Executing now, Sir.');
      cb.openWindow('browser');
      setTimeout(() => window.dispatchEvent(new CustomEvent('aura-browser-search', { detail: { query } })), 900);
      setWakeActive(false);
      return;
    }

    // ── tell me about [topic] ────────────────────────────────────────────────
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

    // ── clear chat ───────────────────────────────────────────────────────────
    if (lower === 'clear' || lower.includes('clear chat') || lower.includes('clear aura') || lower.includes('clear history')) {
      cb.clearMessages();
      speak('Chat cleared, Sir.');
      setWakeActive(false);
      return;
    }

    // ── close all ────────────────────────────────────────────────────────────
    if (lower.includes('close all')) {
      window.dispatchEvent(new CustomEvent('aura-close-all'));
      speak('All windows closed, Sir.');
      setWakeActive(false);
      return;
    }

    // ── AI query ─────────────────────────────────────────────────────────────
    cb.addMessage({ id: Date.now().toString(), role: 'user', text: transcript });
    cb.openWindow('aura');
    if (aiDebounce) clearTimeout(aiDebounce);
    aiDebounce = setTimeout(() => sendToAI(transcript), 450);
    setWakeActive(false);
  }

  function triggerWake(afterText: string) {
    const now = Date.now();
    if (now - wakeFiredAt < WAKE_COOLDOWN_MS) return; // debounce duplicate triggers
    wakeFiredAt = now;

    playWakeSound();
    setWakeActive(true);

    if (afterText.length > 2) {
      // Command was spoken right after wake word — handle it
      speak('Yes Sir, I am here. Ready for your command.');
      setTimeout(() => parseCommand(afterText), 1400);
    } else {
      speak('Yes Sir, I am here. Ready for your command.');
    }
  }

  function startRecognition() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const API = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!API || recognition) return;

    const rec = new API();
    rec.continuous      = true;
    rec.interimResults  = true;   // ← critical: fire on partial results for instant detection
    rec.lang            = 'en-US';
    rec.maxAlternatives = 1;

    rec.onstart = () => { cb.setArmed(true); };

    rec.onresult = (event: SpeechRecognitionEvent) => {
      if (cb.isMuted()) return;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result     = event.results[i];
        const transcript = result[0].transcript.toLowerCase().trim();
        const isFinal    = result.isFinal;

        // ── Wake word detection (fires on INTERIM too for instant response) ──
        if (!cb.isWakeActive() && transcript.includes('hey aura')) {
          const idx   = transcript.indexOf('hey aura');
          const after = transcript.slice(idx + 'hey aura'.length).trim();
          triggerWake(after);
          return;
        }

        // ── Command detection (only final results to avoid noise) ─────────────
        if (isFinal && cb.isWakeActive()) {
          // Strip the wake word if it's in the same utterance
          const cleaned = transcript.replace(/hey aura/gi, '').trim();
          if (cleaned.length > 1) {
            parseCommand(result[0].transcript.replace(/hey aura/gi, '').trim());
          }
        }
      }
    };

    rec.onend = () => {
      recognition = null;
      if (running && !cb.isMuted()) {
        // Always restart — keeps AURA perpetually armed
        setTimeout(startRecognition, 400);
      } else {
        cb.setArmed(false);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (event: any) => {
      const fatal = event.error === 'not-allowed' || event.error === 'service-not-allowed';
      if (fatal) {
        console.warn('[AURA] Mic access denied — cannot arm.');
        running = false;
        recognition = null;
        cb.setArmed(false);
        return;
      }
      // Non-fatal errors (no-speech, network, audio-capture, aborted)
      // → drop ref so onend restarts cleanly
      recognition = null;
    };

    recognition = rec;
    try {
      rec.start();
    } catch (err) {
      console.warn('[AURA] Could not start recognition:', err);
      recognition = null;
      // Retry after a short delay
      if (running) setTimeout(startRecognition, 1000);
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
