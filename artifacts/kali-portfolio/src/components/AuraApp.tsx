import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, ThinkingLevel, Modality } from "@google/genai";
import type { LiveServerMessage } from "@google/genai";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown';
import {
  Send, Image as ImageIcon, X, Loader2,
  Sparkles, User, Bot, Paperclip,
  Github, Twitter, Search, MapPin,
  Brain, MicOff, Zap, ArrowRight,
  Maximize2, History, Settings, ChevronDown,
  Home, Sun, Moon
} from 'lucide-react';
import { cn } from '../lib/utils';
import WindowChrome from './WindowChrome';

// ── Types ──────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  isStreaming?: boolean;
  isThinking?: boolean;
  type?: 'text' | 'image' | 'voice';
}

type AppView = 'landing' | 'conversation' | 'live';

interface VoiceOption {
  id: string;
  name: string;
  gender: 'male' | 'female';
}

const VOICES: VoiceOption[] = [
  { id: 'Puck',   name: 'Puck (Male)',      gender: 'male'   },
  { id: 'Charon', name: 'Charon (Male)',     gender: 'male'   },
  { id: 'Kore',   name: 'Kore (Female)',     gender: 'female' },
  { id: 'Fenrir', name: 'Fenrir (Male)',     gender: 'male'   },
  { id: 'Zephyr', name: 'Zephyr (Neutral)',  gender: 'male'   },
];

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

// ── Window Props ────────────────────────────────────────────────────────────

interface AuraAppProps {
  onClose: () => void;
  onMinimize: () => void;
  isActive: boolean;
  onFocus: () => void;
  initialX?: number;
  initialY?: number;
  zIndex?: number;
}

// ── Sub-components ──────────────────────────────────────────────────────────

const IntroAnimation = ({ onComplete }: { onComplete: () => void }) => (
  <motion.div
    initial={{ opacity: 1 }}
    animate={{ opacity: 0 }}
    transition={{ duration: 1, delay: 2.5 }}
    onAnimationComplete={onComplete}
    className="absolute inset-0 z-[200] bg-black flex items-center justify-center"
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      className="relative flex flex-col items-center"
    >
      <div className="relative w-48 h-48 flex items-center justify-center">
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-2 border-purple-500/30 rounded-full shadow-[0_0_50px_rgba(168,85,247,0.4)]"
        />
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-4 border border-blue-500/20 rounded-full"
        />
        <h1 className="text-5xl font-black tracking-widest text-white aura-text-glow z-10">AURA</h1>
      </div>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="mt-6 text-zinc-500 tracking-[0.3em] text-xs uppercase font-medium"
      >
        Intelligence Redefined
      </motion.p>
    </motion.div>
  </motion.div>
);

const HistoryModal = ({
  isOpen, onClose, history
}: { isOpen: boolean; onClose: () => void; history: Message[] }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="absolute inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl aura-glow-border"
        >
          <div className="p-8 space-y-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tighter">History</h2>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Previous Sessions</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-3 pr-1 scrollbar-hide">
              {history.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <History className="w-10 h-10 text-zinc-700 mx-auto" />
                  <p className="text-zinc-600 font-bold text-sm">No history yet.</p>
                </div>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">
                        {item.type === 'voice' ? 'Voice Session' : 'Chat Session'}
                      </span>
                      <span className="text-[9px] font-black text-zinc-600">
                        {new Date(parseInt(item.id)).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{item.content}</p>
                  </div>
                ))
              )}
            </div>
            <div className="pt-4 border-t border-white/5">
              <p className="text-[9px] text-zinc-600 text-center font-black uppercase tracking-[0.5em]">AURA v1.0 • History</p>
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const SettingsModal = ({
  isOpen, onClose, selectedVoice, onVoiceChange, speechSpeed, onSpeedChange
}: {
  isOpen: boolean; onClose: () => void;
  selectedVoice: string; onVoiceChange: (id: string) => void;
  speechSpeed: number; onSpeedChange: (s: number) => void;
}) => (
  <AnimatePresence>
    {isOpen && (
      <div className="absolute inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          className="relative w-full max-w-sm bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl aura-glow-border"
        >
          <div className="p-8 space-y-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tighter">Settings</h2>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Configure AURA</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Voice</label>
                <div className="space-y-1.5">
                  {VOICES.map(v => (
                    <button
                      key={v.id}
                      onClick={() => onVoiceChange(v.id)}
                      className={cn(
                        "flex items-center justify-between w-full p-3 rounded-xl border transition-all text-sm",
                        selectedVoice === v.id
                          ? "bg-blue-500/10 border-blue-500/30 text-white"
                          : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10"
                      )}
                    >
                      <span className="font-medium">{v.name}</span>
                      {selectedVoice === v.id && <Sparkles className="w-3.5 h-3.5 text-blue-400" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Speech Speed</label>
                  <span className="text-xs font-black text-blue-400">{speechSpeed}x</span>
                </div>
                <input
                  type="range" min="0.5" max="2" step="0.1" value={speechSpeed}
                  onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>
            <div className="pt-4 border-t border-white/5">
              <p className="text-[9px] text-zinc-600 text-center font-black uppercase tracking-[0.5em]">AURA v1.0 • Settings</p>
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const AboutModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="absolute inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl aura-glow-border"
        >
          <div className="p-8 space-y-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tighter">The Architect</h2>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Engineering the Future</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-40" />
                <div className="relative w-20 h-20 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-3xl font-black text-white shadow-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 opacity-20" />
                  M
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white">Monish</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Visionary full-stack developer and AI engineer crafting next-gen digital experiences.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <a href="#" className="flex items-center justify-center gap-2 p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all group">
                <Github className="w-4 h-4 text-zinc-500 group-hover:text-white" />
                <span className="text-xs font-black uppercase tracking-widest text-zinc-500 group-hover:text-white">GitHub</span>
              </a>
              <a href="#" className="flex items-center justify-center gap-2 p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all group">
                <Twitter className="w-4 h-4 text-zinc-500 group-hover:text-white" />
                <span className="text-xs font-black uppercase tracking-widest text-zinc-500 group-hover:text-white">Twitter</span>
              </a>
            </div>
            <div className="pt-4 border-t border-white/5">
              <p className="text-[9px] text-zinc-600 text-center font-black uppercase tracking-[0.3em] italic">
                "Intelligence is the ultimate frontier."
              </p>
            </div>
          </div>
          <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute -top-16 -left-16 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl" />
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const LiveVisualizer = ({
  isActive, volume, status
}: { isActive: boolean; volume: number; status: 'listening' | 'thinking' | 'speaking' }) => {
  const gradMap = {
    listening: 'from-blue-500 via-cyan-500 to-blue-600',
    thinking:  'from-purple-500 via-pink-500 to-purple-600',
    speaking:  'from-emerald-500 via-teal-500 to-emerald-600',
  };
  const colorMap = {
    listening: 'rgba(59, 130, 246,',
    thinking:  'rgba(168, 85, 247,',
    speaking:  'rgba(16, 185, 129,',
  };
  return (
    <div className="relative w-full h-48 flex items-center justify-center">
      <AnimatePresence>
        {isActive && (
          <>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1 + volume * 2, opacity: 0.1 + volume * 0.5, rotate: 360 }}
              transition={{
                scale: { type: "spring", stiffness: 300, damping: 20 },
                rotate: { duration: 20, repeat: Infinity, ease: "linear" }
              }}
              className={cn("absolute w-48 h-48 rounded-full blur-3xl opacity-20 bg-gradient-to-r", gradMap[status])}
            />
            <div className="flex items-center gap-1 h-24">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: isActive ? `${20 + Math.random() * 80 * volume}%` : "4px",
                    backgroundColor: isActive ? `${colorMap[status]} ${0.3 + volume})` : "rgba(255,255,255,0.1)"
                  }}
                  className="w-1 rounded-full"
                />
              ))}
            </div>
          </>
        )}
      </AnimatePresence>
      {!isActive && (
        <div className="text-zinc-500 font-black uppercase tracking-[0.5em] text-xs animate-pulse">
          Connecting to AURA...
        </div>
      )}
    </div>
  );
};

// ── Main App ────────────────────────────────────────────────────────────────

export default function AuraApp({
  onClose, onMinimize, isActive, onFocus, initialX, initialY, zIndex
}: AuraAppProps) {
  const [showIntro, setShowIntro]             = useState(true);
  const [view, setView]                       = useState<AppView>('landing');
  const [showAbout, setShowAbout]             = useState(false);
  const [showSettings, setShowSettings]       = useState(false);
  const [showHistory, setShowHistory]         = useState(false);
  const [selectedVoice, setSelectedVoice]     = useState('Zephyr');
  const [messages, setMessages]               = useState<Message[]>([]);
  const [input, setInput]                     = useState('');
  const [isTyping, setIsTyping]               = useState(false);
  const [selectedImages, setSelectedImages]   = useState<string[]>([]);
  const [isThinkingMode, setIsThinkingMode]   = useState(false);
  const [isLiveMode, setIsLiveMode]           = useState(false);
  const [useSearch, setUseSearch]             = useState(false);
  const [useMaps, setUseMaps]                 = useState(false);
  const [imageSize, setImageSize]             = useState<'1K'|'2K'|'4K'>('1K');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [micVolume, setMicVolume]             = useState(0);
  const [liveTranscription, setLiveTranscription] = useState('');
  const [aiTranscription, setAiTranscription] = useState('');
  const [liveStatus, setLiveStatus]           = useState<'listening'|'thinking'|'speaking'>('listening');
  const [speechSpeed, setSpeechSpeed]         = useState(1);
  const [history, setHistory]                 = useState<Message[]>([]);
  const [isDark, setIsDark]                   = useState(true);

  const messagesEndRef  = useRef<HTMLDivElement>(null);
  const fileInputRef    = useRef<HTMLInputElement>(null);
  const liveSessionRef  = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef       = useRef<MediaStream | null>(null);
  const processorRef    = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef   = useRef<Int16Array[]>([]);
  const isPlayingRef    = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // ── Audio helpers ──────────────────────────────────────────────────────

  const queueAudio = (base64Data: string) => {
    const binary = atob(base64Data);
    const bytes  = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    audioQueueRef.current.push(new Int16Array(bytes.buffer));
    if (!isPlayingRef.current) processAudioQueue();
  };

  const processAudioQueue = async () => {
    if (!audioQueueRef.current.length) { isPlayingRef.current = false; return; }
    isPlayingRef.current = true;
    const pcm16 = audioQueueRef.current.shift()!;
    if (!audioContextRef.current)
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') await ctx.resume();
    const f32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) f32[i] = pcm16[i] / 0x7FFF;
    const buf = ctx.createBuffer(1, f32.length, 24000);
    buf.getChannelData(0).set(f32);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.onended = () => processAudioQueue();
    src.start();
  };

  // ── Live mode ──────────────────────────────────────────────────────────

  const startAudioStreaming = (stream: MediaStream, sessionPromise: Promise<any>) => {
    if (!audioContextRef.current)
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const ctx = audioContextRef.current;
    const source = ctx.createMediaStreamSource(stream);
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;
    processor.onaudioprocess = (e) => {
      const data = e.inputBuffer.getChannelData(0);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
      setMicVolume(Math.sqrt(sum / data.length));
      const pcm16 = new Int16Array(data.length);
      for (let i = 0; i < data.length; i++)
        pcm16[i] = Math.max(-1, Math.min(1, data[i])) * 0x7FFF;
      const b64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
      sessionPromise.then(session => {
        session.sendRealtimeInput({ audio: { data: b64, mimeType: 'audio/pcm;rate=16000' } });
      });
    };
    source.connect(processor);
    processor.connect(ctx.destination);
  };

  const startLiveMode = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const sessionPromise = ai.live.connect({
        model: "gemini-2.0-flash-live-001",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } },
          systemInstruction: "You are AURA, a helpful and ultra-fast AI assistant in a real-time voice conversation. Keep responses natural, concise, and engaging.",
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsLiveMode(true);
            setLiveStatus('listening');
            startAudioStreaming(stream, sessionPromise);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                  setLiveStatus('speaking');
                  queueAudio(part.inlineData.data);
                }
              }
            }
            if (message.serverContent?.interrupted) {
              audioQueueRef.current = [];
              isPlayingRef.current = false;
              setLiveStatus('listening');
              setAiTranscription('');
            }
            if (message.serverContent?.turnComplete) setLiveStatus('listening');
            const modelTurn = message.serverContent?.modelTurn;
            if (modelTurn?.parts) {
              const textPart = modelTurn.parts.find((p: any) => p.text);
              if (textPart?.text) setAiTranscription(prev => prev + textPart.text);
            }
            if ((message as any).serverContent?.inputAudioTranscription?.text) {
              setLiveTranscription((message as any).serverContent.inputAudioTranscription.text);
              setLiveStatus('thinking');
            }
          },
          onclose: () => stopLiveMode(),
          onerror: (err: any) => { console.error("Live Error:", err); stopLiveMode(); },
        }
      });
      liveSessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Failed to start Live Mode:", err);
      setIsLiveMode(false);
    }
  };

  const saveToHistory = () => {
    if (liveTranscription || aiTranscription) {
      setHistory(prev => [{
        id: Date.now().toString(),
        role: 'assistant',
        content: `Live Session: ${aiTranscription || "Voice interaction"}`,
        type: 'voice'
      }, ...prev]);
    }
  };

  const stopLiveMode = () => {
    saveToHistory();
    liveSessionRef.current?.close();
    liveSessionRef.current = null;
    processorRef.current?.disconnect();
    processorRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setIsLiveMode(false);
    setMicVolume(0);
    setLiveTranscription('');
    setAiTranscription('');
    setLiveStatus('listening');
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    if (view === 'live') setView('landing');
  };

  // ── Content generation ─────────────────────────────────────────────────

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImages(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const generateImage = async (prompt: string) => {
    setIsGeneratingImage(true);
    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "1:1", imageSize: imageSize } } as any,
      });
      let imageUrl = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if ((part as any).inlineData) {
          imageUrl = `data:image/png;base64,${(part as any).inlineData.data}`;
          break;
        }
      }
      if (imageUrl) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(), role: 'assistant',
          content: `Generated image for: "${prompt}"`, images: [imageUrl], type: 'image'
        }]);
      }
    } catch (err) {
      console.error("Image Gen Error:", err);
      setMessages(prev => [...prev, {
        id: Date.now().toString(), role: 'assistant',
        content: "⚠ Image generation failed — the model may not be available on this API key.", type: 'text'
      }]);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const speak = async (text: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } },
        } as any,
      });
      const b64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (b64) queueAudio(b64 as string);
    } catch (err) {
      console.error("TTS Error:", err);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() && selectedImages.length === 0) return;
    if (isTyping) return;

    if (input.toLowerCase().startsWith('/image ')) {
      const prompt = input.slice(7);
      setInput('');
      await generateImage(prompt);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(), role: 'user', content: input,
      images: selectedImages.length > 0 ? [...selectedImages] : undefined,
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedImages([]);
    setIsTyping(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: assistantId, role: 'assistant', content: '', isStreaming: true, isThinking: isThinkingMode
    }]);

    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const modelName = isThinkingMode ? "gemini-2.5-pro" : "gemini-2.0-flash";
      const tools: any[] = [];
      if (useSearch) tools.push({ googleSearch: {} });
      if (useMaps)   tools.push({ googleMaps: {} });

      const parts: any[] = [{ text: input || "Analyze this image" }];
      if (userMessage.images) {
        userMessage.images.forEach(img => {
          parts.push({ inlineData: { data: img.split(',')[1], mimeType: img.split(';')[0].split(':')[1] } });
        });
      }

      const streamResponse = await ai.models.generateContentStream({
        model: modelName,
        contents: { parts },
        config: {
          tools: tools.length > 0 ? tools : undefined,
          thinkingConfig: isThinkingMode ? { thinkingBudget: 8096 } : undefined,
        } as any,
      });

      let fullText = '';
      for await (const chunk of streamResponse) {
        const textChunk = (chunk as any).text;
        if (textChunk) {
          fullText += textChunk;
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: fullText } : m));
        }
      }
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, isStreaming: false } : m));
      if (fullText) await speak(fullText);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: "⚠ Error processing request. Please check your API key and try again.", isStreaming: false }
          : m
      ));
    } finally {
      setIsTyping(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <WindowChrome
      title="AURA AI — Intelligence System"
      onClose={onClose}
      onMinimize={onMinimize}
      isActive={isActive}
      onFocus={onFocus}
      initialX={initialX}
      initialY={initialY}
      width={920}
      height={660}
      zIndex={zIndex}
    >
      {/* Root container — dark + relative for absolute-positioned modals & background */}
      <div
        className={cn("relative w-full h-full overflow-hidden font-sans", isDark ? "dark" : "")}
        style={{ background: isDark ? '#000' : '#fff', color: isDark ? '#f4f4f5' : '#18181b' }}
      >
        {/* Animated background waves */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" style={{ background: isDark ? '#000' : '#fff' }}>
          <div className="aura-bg-wave" />
          <div className="aura-bg-wave" />
          <div className="aura-bg-wave" />
        </div>

        {/* Modals (absolute within window) */}
        <AboutModal   isOpen={showAbout}    onClose={() => setShowAbout(false)} />
        <HistoryModal isOpen={showHistory}  onClose={() => setShowHistory(false)} history={history} />
        <SettingsModal
          isOpen={showSettings} onClose={() => setShowSettings(false)}
          selectedVoice={selectedVoice} onVoiceChange={setSelectedVoice}
          speechSpeed={speechSpeed} onSpeedChange={setSpeechSpeed}
        />

        {/* Intro animation (absolute so it stays inside the window) */}
        <AnimatePresence>
          {showIntro && <IntroAnimation onComplete={() => setShowIntro(false)} />}
        </AnimatePresence>

        {/* ── LANDING VIEW ── */}
        {!showIntro && view === 'landing' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="max-w-xl w-full space-y-8"
            >
              <motion.div
                initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl mb-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                <span className="text-[9px] font-black tracking-[0.3em] uppercase text-zinc-400">Intelligence Redefined</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-6xl font-black tracking-tighter text-white leading-none"
              >
                AURA <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-zinc-400 to-zinc-600">AI</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed font-medium"
              >
                Experience the next evolution of human-AI interaction. Fast, beautiful, and profoundly capable.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
              >
                <button
                  onClick={() => setView('conversation')}
                  className="group relative px-8 py-4 bg-white text-black font-black rounded-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative z-10">Start Conversation</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
                </button>
                <button
                  onClick={() => setShowAbout(true)}
                  className="px-8 py-4 bg-white/5 border border-white/10 text-white font-black rounded-2xl hover:bg-white/10 transition-all backdrop-blur-xl"
                >
                  About Developer
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="grid grid-cols-4 gap-4 pt-6 max-w-sm mx-auto"
              >
                {[
                  { label: "Ultra Fast", icon: Zap,       color: "text-blue-400"    },
                  { label: "Deep Logic", icon: Brain,     color: "text-purple-400"  },
                  { label: "Visual Art", icon: ImageIcon, color: "text-pink-400"    },
                  { label: "Real-time",  icon: Search,    color: "text-emerald-400" },
                ].map(({ label, icon: Icon, color }) => (
                  <div key={label} className="flex flex-col items-center gap-2 group cursor-default">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                      <Icon className={cn("w-4 h-4", color)} />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300 transition-colors">{label}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        )}

        {/* ── CONVERSATION VIEW ── */}
        {!showIntro && view === 'conversation' && (
          <div className="absolute inset-0 z-10 flex flex-col">
            {/* Header */}
            <header className="px-4 py-3 flex items-center justify-between border-b border-white/5 backdrop-blur-xl flex-shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setView('landing')}
                  className="p-2 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10"
                >
                  <Home className="w-4 h-4 text-zinc-500 hover:text-zinc-300" />
                </button>
                <button
                  onClick={() => setShowHistory(true)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10"
                >
                  <History className="w-4 h-4 text-zinc-500" />
                </button>
                <button
                  onClick={() => setIsDark(d => !d)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10"
                >
                  {isDark ? <Sun className="w-4 h-4 text-zinc-500" /> : <Moon className="w-4 h-4 text-zinc-500" />}
                </button>
                <div>
                  <h2 className="text-sm font-black tracking-tighter text-white aura-text-glow">AURA</h2>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(59,130,246,0.5)]" />
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Neural Link Active</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1 p-1 bg-white/5 border border-white/5 rounded-xl">
                  <button
                    onClick={() => setIsThinkingMode(t => !t)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 border",
                      isThinkingMode
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-white/5"
                    )}
                  >
                    <Brain className="w-3 h-3" />
                    Think
                  </button>
                  <button
                    onClick={() => { setView('live'); startLiveMode(); }}
                    className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 border border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                  >
                    <Zap className="w-3 h-3" />
                    Live
                  </button>
                </div>
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 text-zinc-500 hover:text-white transition-all hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Chat area */}
            <main className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-hide">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
                  <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl">
                    <Bot className="w-10 h-10 text-zinc-400" />
                  </div>
                  <div className="space-y-4 max-w-sm">
                    <h3 className="text-2xl font-black tracking-tight text-white">How can I assist?</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                      {[
                        { text: "Create a futuristic city", icon: ImageIcon },
                        { text: "Explain quantum physics",  icon: Brain      },
                        { text: "Write a landing page",    icon: Sparkles   },
                        { text: "Latest AI breakthroughs", icon: Search     },
                      ].map(s => (
                        <button
                          key={s.text}
                          onClick={() => setInput(s.text)}
                          className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-zinc-400 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
                        >
                          <s.icon className="w-3.5 h-3.5" />
                          {s.text}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 max-w-3xl mx-auto">
                  {messages.map(message => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn("flex gap-4", message.role === 'user' ? "flex-row-reverse" : "flex-row")}
                    >
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",
                        message.role === 'user'
                          ? "bg-zinc-900 border-zinc-800 text-zinc-400"
                          : "bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white border-white/20 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                      )}>
                        {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={cn("flex flex-col space-y-3 max-w-[82%]", message.role === 'user' ? "items-end" : "items-start")}>
                        {message.images && (
                          <div className="flex flex-wrap gap-2">
                            {message.images.map((img, i) => (
                              <div key={i} className="relative group rounded-2xl overflow-hidden shadow-xl border border-white/10">
                                <img src={img} alt="Content" className="max-w-48 object-cover" />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Maximize2 className="w-5 h-5 text-white" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className={cn(
                          "px-5 py-4 rounded-3xl text-sm leading-relaxed shadow-xl border relative",
                          message.role === 'user'
                            ? "bg-white/5 border-white/10"
                            : "bg-black/40 border-white/5 backdrop-blur-xl"
                        )}>
                          {message.isThinking && message.role === 'assistant' && (
                            <div className="flex items-center gap-2 mb-3 text-[9px] font-black uppercase tracking-widest text-purple-400">
                              <div className="w-1 h-1 bg-purple-500 rounded-full animate-ping" />
                              Deep Reasoning Active
                            </div>
                          )}
                          <div className="aura-markdown">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                            {message.isStreaming && (
                              <motion.span
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="inline-block w-2 h-4 ml-1 bg-blue-500 align-middle rounded-full"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </main>

            {/* Input area */}
            <footer className="p-4 flex-shrink-0">
              <div className="max-w-3xl mx-auto space-y-3">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setUseSearch(s => !s)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest border",
                        useSearch ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-white/5"
                      )}
                    >
                      <Search className="w-3 h-3" />
                      <span className="hidden sm:inline">Search</span>
                    </button>
                    <button
                      onClick={() => setUseMaps(m => !m)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest border",
                        useMaps ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-white/5"
                      )}
                    >
                      <MapPin className="w-3 h-3" />
                      <span className="hidden sm:inline">Maps</span>
                    </button>
                    <div className="w-px h-4 bg-white/10 mx-1" />
                    <div className="relative group">
                      <button className="px-3 py-1.5 text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-all hover:bg-white/5 rounded-xl">
                        <ImageIcon className="w-3 h-3" />
                        <span className="hidden sm:inline">{imageSize}</span>
                        <ChevronDown className="w-2.5 h-2.5" />
                      </button>
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl min-w-[100px] z-50">
                        {(['1K','2K','4K'] as const).map(size => (
                          <button
                            key={size}
                            onClick={() => setImageSize(size)}
                            className={cn(
                              "w-full px-4 py-2 text-left text-[9px] font-black uppercase tracking-widest transition-colors",
                              imageSize === size ? "bg-blue-500/10 text-blue-400" : "text-zinc-500 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            {size} Resolution
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest hidden sm:block">
                    /image [prompt] to generate
                  </p>
                </div>

                {/* Image previews */}
                <AnimatePresence>
                  {selectedImages.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                      className="flex flex-wrap gap-2 p-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl"
                    >
                      {selectedImages.map((img, i) => (
                        <div key={i} className="relative group">
                          <img src={img} alt="Preview" className="w-14 h-14 object-cover rounded-xl border border-white/5" />
                          <button
                            onClick={() => setSelectedImages(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Input box */}
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl opacity-20 group-focus-within:opacity-60 blur transition duration-500" />
                  <form
                    onSubmit={handleSubmit}
                    className="relative flex items-end gap-2 p-2 bg-zinc-950/90 backdrop-blur-3xl rounded-[1.75rem] shadow-2xl"
                  >
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 text-zinc-500 hover:text-white transition-all rounded-2xl hover:bg-white/5"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                      placeholder="Ask AURA anything..."
                      rows={1}
                      className="flex-1 bg-transparent border-0 outline-none ring-0 text-white py-3 px-2 resize-none max-h-40 text-sm font-medium placeholder:text-zinc-600"
                      style={{ height: 'auto' }}
                      onInput={(e) => {
                        const t = e.target as HTMLTextAreaElement;
                        t.style.height = 'auto';
                        t.style.height = `${t.scrollHeight}px`;
                      }}
                    />
                    <button
                      type="submit"
                      disabled={isTyping || isGeneratingImage || (!input.trim() && selectedImages.length === 0)}
                      className={cn(
                        "p-3 rounded-2xl transition-all flex items-center justify-center shadow-xl",
                        isTyping || isGeneratingImage || (!input.trim() && selectedImages.length === 0)
                          ? "bg-zinc-900 text-zinc-700"
                          : "bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                      )}
                    >
                      {isTyping || isGeneratingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </form>
                </div>
                <p className="text-[8px] text-center text-zinc-700 font-black uppercase tracking-widest">
                  AURA Intelligence • Developed by Monish • MONIX OS
                </p>
              </div>
            </footer>
          </div>
        )}

        {/* ── LIVE VOICE VIEW ── */}
        {!showIntro && view === 'live' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
            <header className="absolute top-0 left-0 right-0 px-4 py-3 flex items-center justify-between border-b border-white/5 backdrop-blur-xl z-50">
              <div className="flex items-center gap-3">
                <button
                  onClick={stopLiveMode}
                  className="p-2 hover:bg-white/5 rounded-xl transition-all"
                >
                  <X className="w-4 h-4 text-zinc-500 hover:text-white" />
                </button>
                <div>
                  <h2 className="text-sm font-black tracking-tighter text-white aura-text-glow">AURA LIVE</h2>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Voice Link Active</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsDark(d => !d)} className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <button onClick={() => setShowSettings(true)} className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </header>

            <main className="flex-1 w-full flex flex-col items-center justify-center p-6 space-y-6 pt-16">
              <div className="relative w-full max-w-lg flex flex-col items-center">
                <LiveVisualizer isActive={isLiveMode} volume={micVolume} status={liveStatus} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <AnimatePresence mode="wait">
                    {liveTranscription && (
                      <motion.div
                        key="user-tx"
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        className="bg-black/60 backdrop-blur-2xl px-6 py-3 rounded-2xl border border-white/10 text-white text-sm font-bold max-w-xs text-center"
                      >
                        {liveTranscription}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="text-center space-y-4 max-w-sm w-full">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-tight text-white aura-text-glow">
                    {liveStatus === 'listening' && "Listening..."}
                    {liveStatus === 'thinking' && "Thinking..."}
                    {liveStatus === 'speaking' && "AURA is speaking"}
                    {!isLiveMode && "Connecting..."}
                  </h3>
                  <div className="flex justify-center gap-1">
                    {(['listening','thinking','speaking'] as const).map((s, i) => (
                      <motion.div
                        key={s}
                        animate={{ scale: liveStatus === s ? [1, 1.5, 1] : 1 }}
                        transition={{ repeat: Infinity, duration: 1.5 + i * 0.5 }}
                        className={cn("w-1 h-1 rounded-full", {
                          'listening': liveStatus === s ? "bg-blue-500" : "bg-zinc-700",
                          'thinking':  liveStatus === s ? "bg-purple-500" : "bg-zinc-700",
                          'speaking':  liveStatus === s ? "bg-emerald-500" : "bg-zinc-700",
                        }[s])}
                      />
                    ))}
                  </div>
                </div>

                <AnimatePresence>
                  {aiTranscription && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      className="p-5 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl"
                    >
                      <p className="text-sm text-zinc-300 leading-relaxed italic">"{aiTranscription}"</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!aiTranscription && (
                  <p className="text-zinc-500 text-xs font-medium">
                    Speak naturally. AURA will respond with its voice and transcription.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                {liveStatus === 'speaking' && (
                  <button
                    onClick={() => { audioQueueRef.current = []; isPlayingRef.current = false; setLiveStatus('listening'); }}
                    className="px-6 py-3 bg-white/5 border border-white/10 text-white font-black rounded-2xl hover:bg-white/10 transition-all uppercase tracking-widest text-xs flex items-center gap-2"
                  >
                    <MicOff className="w-4 h-4" />
                    Interrupt
                  </button>
                )}
                <button
                  onClick={stopLiveMode}
                  className="px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-400 font-black rounded-2xl hover:bg-red-500/20 transition-all uppercase tracking-widest text-xs flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  End Session
                </button>
              </div>
            </main>
          </div>
        )}
      </div>
    </WindowChrome>
  );
}
