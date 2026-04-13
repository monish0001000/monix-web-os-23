// ─── AuraService — Upgraded v2 ────────────────────────────────────────────────
// 5-feature upgrade:
//  1. Two-stage wake word detection (sleep → armed → active)
//  2. Multi-language continuous listening (en-IN / Tamil / Tanglish)
//  3. Gemini LLM brain with structured JSON OS commands
//  4. Dynamic expressive TTS (macha = deep male, machi = female)
//  5. Immersive glow feedback (handled in App.tsx / CSS)

export interface AuraMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export interface AuraServiceCallbacks {
  isArmed:            () => boolean;
  isWakeActive:       () => boolean;
  isMuted:            () => boolean;
  getVoicePreference: () => 'female' | 'male';
  setArmed:           (v: boolean) => void;
  setWakeActive:      (v: boolean) => void;
  setHearingSound:    (v: boolean) => void;
  setVoicePreference: (v: 'female' | 'male') => void;
  addMessage:         (msg: AuraMessage) => void;
  clearMessages:      () => void;
  openWindow:         (id: string) => void;
}

export interface AuraServiceHandle {
  start:      () => void;
  stop:       () => void;
  manualWake: () => void;
}

// ─── Wake word ────────────────────────────────────────────────────────────────
const WAKE_WORD_RE = /hey\s+buddy/i;

// ─── API base path ────────────────────────────────────────────────────────────
function getApiBase(): string {
  const base = import.meta.env.BASE_URL ?? '/';
  return base.replace(/\/$/, '') + '/api';
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
  threatmap: 'threatmap', 'threat map': 'threatmap',
  codepad: 'codepad', notepad: 'codepad',
};

// ─── Voice pickers ────────────────────────────────────────────────────────────
function pickFemaleVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const priority = [
    'Google US English',
    'Microsoft Jenny Online (Natural) - English (United States)',
    'Microsoft Ana Online (Natural) - English (United States)',
    'Microsoft Zira - English (United States)',
    'Samantha', 'Karen', 'Moira', 'Tessa', 'Fiona',
  ];
  for (const name of priority) {
    const v = voices.find(v => v.name === name);
    if (v) return v;
  }
  const en = voices.filter(v => v.lang.startsWith('en'));
  return (
    en.find(v => /female|woman|zira|jenny|ana|samantha|karen|moira|tessa|fiona/i.test(v.name)) ||
    en[0] || voices[0] || null
  );
}

function pickMaleVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const priority = [
    'Google UK English Male',
    'Microsoft James Online (Natural) - English (United Kingdom)',
    'Microsoft David - English (United States)',
    'Microsoft Mark - English (United States)',
    'Daniel', 'Alex', 'Fred',
  ];
  for (const name of priority) {
    const v = voices.find(v => v.name === name);
    if (v) return v;
  }
  const en = voices.filter(v => v.lang.startsWith('en'));
  return (
    en.find(v => /male|man|david|daniel|alex|fred|james|mark/i.test(v.name)) ||
    en[en.length - 1] || voices[0] || null
  );
}

// ─── speak() ─────────────────────────────────────────────────────────────────
export function speak(text: string, preference: 'female' | 'male' = 'female') {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  function doSpeak() {
    const u     = new SpeechSynthesisUtterance(text);
    const voice = preference === 'male' ? pickMaleVoice() : pickFemaleVoice();
    if (voice) u.voice = voice;

    if (preference === 'male') {
      u.rate   = 0.92;
      u.pitch  = 0.65;
      u.volume = 1.0;
    } else {
      u.rate   = 1.05;
      u.pitch  = 1.25;
      u.volume = 1.0;
    }
    u.lang = 'en-IN';
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

// ─── Wake chime (dual-tone) ───────────────────────────────────────────────────
export function playWakeSound() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    [[880, 0, 0.18], [1100, 0.14, 0.18], [1320, 0.28, 0.14]].forEach(([freq, delay, vol]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.35);
    });
  } catch (_) {}
}

// ─── Sliding-window wake-word check ──────────────────────────────────────────
function slidingWindowCheck(transcript: string): string | null {
  const lower   = transcript.toLowerCase().trim();
  const words   = lower.split(/\s+/);
  const window5 = words.slice(-5).join(' ');

  if (WAKE_WORD_RE.test(window5) || WAKE_WORD_RE.test(lower)) {
    const match = lower.match(/hey\s+buddy\s*(.*)/i);
    return match ? match[1].trim() : '';
  }
  return null;
}

// ─── Gemini Brain: structured JSON command via API server ─────────────────────
interface GeminiCommand {
  action: string;
  target: string;
  reply:  string;
  query:  string;
}

async function queryGeminiBrain(text: string, history: AuraMessage[]): Promise<GeminiCommand> {
  const fallback: GeminiCommand = {
    action: 'answer', target: '', query: '',
    reply: 'Neural link degraded. Command received but mainframe unreachable.',
  };

  try {
    const res = await fetch(`${getApiBase()}/aura/chat`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history: history.slice(-6).map(m => ({ role: m.role, text: m.text })),
      }),
    });

    if (!res.ok) {
      // Fallback to Pollinations if API server down
      return pollinationsFallback(text);
    }

    const data = await res.json() as GeminiCommand;
    return data;
  } catch {
    return pollinationsFallback(text);
  }
}

async function pollinationsFallback(text: string): Promise<GeminiCommand> {
  try {
    const prompt =
      'You are AURA, the AI of MONIX Web OS. Reply in max 2 sentences, no markdown. Query: ' + text;
    const res = await fetch('https://text.pollinations.ai/' + encodeURIComponent(prompt));
    if (!res.ok) throw new Error('Pollinations fail');
    const reply = (await res.text()).slice(0, 300);
    return { action: 'answer', target: '', query: '', reply };
  } catch {
    return {
      action: 'answer', target: '', query: '',
      reply: 'Mainframe connection failed. Standing by.',
    };
  }
}

// ─── Local fast-path command parsing (runs before hitting the LLM) ───────────
function fastParseCommand(lower: string): GeminiCommand | null {
  // Voice switching
  if (/change\s+voice\s+(into|to)\s+macha/i.test(lower))
    return { action: 'voice_male', target: '', reply: 'Done macha, deep mode activated.', query: '' };
  if (/change\s+voice\s+(into|to)\s+machi/i.test(lower))
    return { action: 'voice_female', target: '', reply: 'Sure machi, I am here for you.', query: '' };

  // Clear chat
  if (/^clear\s*(chat|aura|history)?$/.test(lower))
    return { action: 'clear_chat', target: '', reply: 'Chat cleared.', query: '' };

  // Close all
  if (/close\s*all/.test(lower))
    return { action: 'close_all', target: '', reply: 'All windows closed.', query: '' };

  // Open app — direct match
  const openMatch = lower.match(/^(?:please\s+)?open\s+(.+)/);
  if (openMatch) {
    const key = openMatch[1].trim();
    const id  = VOICE_APP_MAP[key];
    if (id) return { action: 'open', target: id, reply: 'Launching ' + key + '.', query: '' };
  }

  // Search
  const searchMatch =
    lower.match(/^search\s+(.+?)\s+on\s+google$/) ||
    lower.match(/^google\s+(.+)/)                  ||
    lower.match(/^search\s+(.+)/);
  if (searchMatch)
    return { action: 'search', target: 'browser', reply: 'Searching now.', query: searchMatch[1].trim() };

  // Type
  const typeMatch = lower.match(/^type\s+(.+)/);
  if (typeMatch)
    return { action: 'type', target: typeMatch[1].trim(), reply: 'Typing now.', query: '' };

  return null;
}

// ─── Execute a structured command from Gemini or fast-path ───────────────────
function executeCommand(
  cmd: GeminiCommand,
  cb: AuraServiceCallbacks,
  say: (t: string) => void,
  setWakeActive: (v: boolean) => void,
  sendToAI: (text: string) => void,
) {
  switch (cmd.action) {
    case 'open':
      if (VOICE_APP_MAP[cmd.target] || Object.values(VOICE_APP_MAP).includes(cmd.target)) {
        say(cmd.reply);
        cb.openWindow(VOICE_APP_MAP[cmd.target] ?? cmd.target);
      } else {
        say('App not found: ' + cmd.target);
      }
      break;

    case 'search':
      say(cmd.reply);
      cb.openWindow('browser');
      setTimeout(() => window.dispatchEvent(
        new CustomEvent('aura-browser-search', { detail: { query: cmd.query } })
      ), 900);
      break;

    case 'type':
      say(cmd.reply);
      window.dispatchEvent(new CustomEvent('aura-type-text', { detail: { text: cmd.target } }));
      break;

    case 'close_all':
      say(cmd.reply);
      window.dispatchEvent(new CustomEvent('aura-close-all'));
      break;

    case 'voice_male':
      cb.setVoicePreference('male');
      setTimeout(() => speak(cmd.reply, 'male'), 100);
      break;

    case 'voice_female':
      cb.setVoicePreference('female');
      setTimeout(() => speak(cmd.reply, 'female'), 100);
      break;

    case 'clear_chat':
      cb.clearMessages();
      say(cmd.reply);
      break;

    case 'answer':
    default:
      say(cmd.reply);
      cb.addMessage({ id: (Date.now() + 1).toString(), role: 'assistant', text: cmd.reply });
      cb.openWindow('aura');
      break;
  }
  setWakeActive(false);
}

// ─── Service Factory ──────────────────────────────────────────────────────────
export function createAuraService(cb: AuraServiceCallbacks): AuraServiceHandle {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recognition: any = null;
  let running          = false;
  let wakeTimer:    ReturnType<typeof setTimeout> | null = null;
  let aiDebounce:   ReturnType<typeof setTimeout> | null = null;
  let commandBuffer = '';
  let pauseTimer:   ReturnType<typeof setTimeout> | null = null;

  let wakeFiredAt        = 0;
  const WAKE_COOLDOWN_MS = 3000;

  // Local conversation history for context
  const localHistory: AuraMessage[] = [];

  function say(text: string) {
    speak(text, cb.getVoicePreference());
  }

  // ── Wake-active management ─────────────────────────────────────────────────
  function setWakeActiveLocal(active: boolean) {
    cb.setWakeActive(active);
    if (wakeTimer) { clearTimeout(wakeTimer); wakeTimer = null; }
    if (active) {
      wakeTimer = setTimeout(() => {
        cb.setWakeActive(false);
        cb.setHearingSound(false);
        commandBuffer = '';
        say('Standing by.');
      }, 20000);
    }
  }

  // ── Process a complete utterance (called after pause or final result) ───────
  async function processUtterance(transcript: string) {
    if (pauseTimer) { clearTimeout(pauseTimer); pauseTimer = null; }
    const clean = transcript.replace(WAKE_WORD_RE, '').trim();
    const lower = clean.toLowerCase();

    if (!lower || lower.length < 2) return;

    cb.addMessage({ id: Date.now().toString(), role: 'user', text: clean });
    localHistory.push({ id: Date.now().toString(), role: 'user', text: clean });

    // Fast-path local commands (no LLM needed)
    const fastCmd = fastParseCommand(lower);
    if (fastCmd) {
      executeCommand(fastCmd, cb, say, setWakeActiveLocal, () => {});
      return;
    }

    // LLM brain: call Gemini via API server
    say('On it.');
    if (aiDebounce) clearTimeout(aiDebounce);
    aiDebounce = setTimeout(async () => {
      const cmd = await queryGeminiBrain(clean, localHistory);
      localHistory.push({ id: (Date.now() + 1).toString(), role: 'assistant', text: cmd.reply });
      executeCommand(cmd, cb, say, setWakeActiveLocal, () => {});
    }, 350);
  }

  // ── Wake trigger ───────────────────────────────────────────────────────────
  function triggerWake(afterText: string) {
    const now = Date.now();
    if (now - wakeFiredAt < WAKE_COOLDOWN_MS) return;
    wakeFiredAt = now;

    playWakeSound();
    setWakeActiveLocal(true);
    commandBuffer = '';

    if (afterText.length > 2) {
      say('Yes, I am listening.');
      setTimeout(() => processUtterance(afterText), 1200);
    } else {
      say('Yes, I am here. Ready for your command.');
    }
  }

  // ── Recognition lifecycle ──────────────────────────────────────────────────
  function startRecognition() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const API = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!API || recognition) return;

    const rec = new API();
    rec.continuous      = true;
    rec.interimResults  = true;
    rec.lang            = 'en-IN';
    rec.maxAlternatives = 3;

    rec.onstart = () => { cb.setArmed(true); };

    rec.onsoundstart = () => {
      if (cb.isWakeActive()) cb.setHearingSound(true);
    };
    rec.onsoundend = () => { cb.setHearingSound(false); };
    rec.onspeechend = () => {
      cb.setHearingSound(false);
      // If we were collecting a command, flush it after speech ends
      if (cb.isWakeActive() && commandBuffer.length > 2) {
        if (pauseTimer) clearTimeout(pauseTimer);
        pauseTimer = setTimeout(() => {
          processUtterance(commandBuffer);
          commandBuffer = '';
        }, 600);
      }
    };

    rec.onresult = (event: SpeechRecognitionEvent) => {
      if (cb.isMuted()) return;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result     = event.results[i];
        const transcript = result[0].transcript;
        const lower      = transcript.toLowerCase().trim();
        const isFinal    = result.isFinal;

        // ── Sleep mode: check INTERIM results for wake word ──────────────────
        if (!cb.isWakeActive()) {
          const afterText = slidingWindowCheck(lower);
          if (afterText !== null) {
            triggerWake(afterText);
            return;
          }
        }

        // ── Command mode: accumulate speech until pause ───────────────────────
        if (cb.isWakeActive()) {
          const cleaned = transcript.replace(WAKE_WORD_RE, '').trim();
          if (!cleaned) continue;

          if (isFinal) {
            // Final result — flush immediately
            const full = (commandBuffer + ' ' + cleaned).trim();
            commandBuffer = '';
            if (pauseTimer) { clearTimeout(pauseTimer); pauseTimer = null; }
            if (full.length > 1) processUtterance(full);
          } else {
            // Interim — accumulate and reset pause timer
            commandBuffer = cleaned;
            cb.setHearingSound(true);
            if (pauseTimer) clearTimeout(pauseTimer);
            // Auto-flush after 2.5 s silence (user stopped speaking mid-interim)
            pauseTimer = setTimeout(() => {
              if (commandBuffer.length > 2) {
                processUtterance(commandBuffer);
                commandBuffer = '';
              }
            }, 2500);
          }
        }
      }
    };

    rec.onend = () => {
      recognition = null;
      cb.setHearingSound(false);
      if (running && !cb.isMuted()) {
        setTimeout(startRecognition, 300);
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
      commandBuffer = '';
      cb.setArmed(false);
      cb.setWakeActive(false);
      cb.setHearingSound(false);
      if (wakeTimer)  { clearTimeout(wakeTimer);  wakeTimer  = null; }
      if (aiDebounce) { clearTimeout(aiDebounce); aiDebounce = null; }
      if (pauseTimer) { clearTimeout(pauseTimer); pauseTimer = null; }
    },
    manualWake() {
      triggerWake('');
    },
  };
}
