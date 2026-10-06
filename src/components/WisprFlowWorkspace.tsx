import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Copy,
  Check,
  Send,
  FileText,
  List,
  Mail,
  Zap,
  ArrowRight,
  Gauge,
  Sliders,
  Code,
  MessageSquare,
  FileSpreadsheet,
  CornerDownLeft,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  Laptop,
  Smartphone,
  Globe,
  Info,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import {
  FlowMode,
  AppTarget,
  FlowPolishResponse,
  DEFAULT_INDIAN_TERMINOLOGY,
} from '../../server/flow.ts';

interface WisprFlowWorkspaceProps {
  onInsertToChat?: (text: string) => void;
}

export const WisprFlowWorkspace: React.FC<WisprFlowWorkspaceProps> = ({ onInsertToChat }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [flowMode, setFlowMode] = useState<FlowMode>('smart_clean');
  const [appTarget, setAppTarget] = useState<AppTarget>('generic');
  const [whisperMode, setWhisperMode] = useState(false);
  const [customVocab, setCustomVocab] = useState<string[]>(DEFAULT_INDIAN_TERMINOLOGY);
  const [newVocabTerm, setNewVocabTerm] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [polishedResult, setPolishedResult] = useState<FlowPolishResponse | null>(null);
  const [isPolishing, setIsPolishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [injectedSuccess, setInjectedSuccess] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // App-specific injected states for the interactive simulator
  const [appInjectedText, setAppInjectedText] = useState<{ [key in AppTarget]?: string }>({
    gmail: 'Subject: Project Review Update\n\nHi Rahul,\n\nLet\'s meet at 3 PM tomorrow for the project review.\n\nBest regards,\nSoumya Parida',
    docs: '# Katha AI Technical Architecture\n\nKatha AI integrates real-time Silero VAD for sub-12ms speech boundary detection alongside pgvector semantic indexing.',
    notion: '### Weekly Sprints\n• Optimize ASR multilingual latency for Odia and Hindi\n• Deploy pgvector IVFFlat indexing in Cloud SQL',
    whatsapp: 'Kal 3 PM re review meeting achhi Rahul, please slides ready rakhibe 👍',
    cursor: '// TODO: Implement vector cosine search with pgvector extension\nconst embedding = await getGeminiEmbedding(query);',
    generic: 'Let\'s meet at 3 PM tomorrow.',
  });

  const isRecordingRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Live microphone and gain sensitivity monitoring
  const startAudioMeter = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);

      // Whisper Mode gain amplifier
      const gainNode = ctx.createGain();
      gainNode.gain.value = whisperMode ? 2.8 : 1.0;
      gainNodeRef.current = gainNode;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;

      source.connect(gainNode);
      gainNode.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        setMicLevel(Math.min(1, avg / 65));
        animFrameRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch (e) {
      console.warn('Audio meter note:', e);
    }
  };

  const stopAudioMeter = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
    setMicLevel(0);
  };

  // Browser SpeechRecognition setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const r = new SpeechRecognition();
      r.continuous = true;
      r.interimResults = true;
      r.lang = 'en-IN'; // Indian multilingual recognition

      r.onresult = (e: any) => {
        let text = '';
        for (let i = 0; i < e.results.length; i++) {
          text += e.results[i][0].transcript + ' ';
        }
        const trimmed = text.trim();
        if (trimmed) {
          setLiveTranscript(trimmed);
        }
      };

      r.onend = () => {
        if (isRecordingRef.current) {
          try {
            r.start();
          } catch (e) {}
        }
      };

      recognitionRef.current = r;
    }
  }, []);

  // Timer loop while recording
  useEffect(() => {
    if (isRecording) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const handleStartFlow = async () => {
    setLiveTranscript('');
    setPolishedResult(null);
    setIsRecording(true);
    isRecordingRef.current = true;

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;
      startAudioMeter(stream);
    } catch (err) {
      console.warn('Microphone permission blocked or unavailable:', err);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }
    }
  };

  const handleStopFlow = async () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    stopAudioMeter();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    if (liveTranscript.trim()) {
      await polishTranscript(liveTranscript.trim(), flowMode, appTarget);
    }
  };

  const handleStopFlowWithText = async (text: string) => {
    setIsRecording(false);
    stopAudioMeter();
    await polishTranscript(text, flowMode, appTarget);
  };

  const polishTranscript = async (text: string, mode: FlowMode, target: AppTarget) => {
    setIsPolishing(true);
    try {
      const res = await fetch('/api/flow/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: text,
          mode,
          appTarget: target,
          customVocabulary: customVocab,
          whisperMode,
        }),
      });
      const data: FlowPolishResponse = await res.json();
      setPolishedResult(data);

      // Auto inject into active app simulator
      setAppInjectedText((prev) => ({
        ...prev,
        [target]: data.polishedText,
      }));
    } catch (err) {
      console.error('Flow polish error:', err);
    } finally {
      setIsPolishing(false);
    }
  };

  const handleModeChange = async (newMode: FlowMode) => {
    setFlowMode(newMode);
    const sourceText = polishedResult?.rawText || liveTranscript;
    if (sourceText.trim()) {
      await polishTranscript(sourceText.trim(), newMode, appTarget);
    }
  };

  const handleAppTargetChange = async (target: AppTarget) => {
    setAppTarget(target);
    const sourceText = polishedResult?.rawText || liveTranscript;
    if (sourceText.trim()) {
      await polishTranscript(sourceText.trim(), flowMode, target);
    }
  };

  const handleCopy = () => {
    const textToCopy = polishedResult?.polishedText || liveTranscript;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInjectIntoApp = () => {
    const text = polishedResult?.polishedText || liveTranscript;
    if (!text) return;
    setAppInjectedText((prev) => ({
      ...prev,
      [appTarget]: text,
    }));
    setInjectedSuccess(true);
    setTimeout(() => setInjectedSuccess(false), 2500);
  };

  const handleAddVocabTerm = () => {
    if (!newVocabTerm.trim()) return;
    if (!customVocab.includes(newVocabTerm.trim())) {
      setCustomVocab([...customVocab, newVocabTerm.trim()]);
    }
    setNewVocabTerm('');
  };

  const handleRemoveVocabTerm = (term: string) => {
    setCustomVocab(customVocab.filter((t) => t !== term));
  };

  const modes = [
    {
      id: 'smart_clean' as FlowMode,
      name: 'Smart Polish',
      icon: Sparkles,
      desc: 'Removes "um", "uh", mid-speech corrections ("at 2... no sorry 3"), fixes grammar',
    },
    {
      id: 'numbered_list' as FlowMode,
      name: 'Numbered List',
      icon: List,
      desc: 'Auto-sequences spoken steps into formatted 1., 2., 3. procedures',
    },
    {
      id: 'paragraph_format' as FlowMode,
      name: 'Paragraphs',
      icon: FileText,
      desc: 'Structures long spoken thoughts into natural paragraphs with line breaks',
    },
    {
      id: 'bullet_notes' as FlowMode,
      name: 'Bullet Notes',
      icon: List,
      desc: 'Converts rambles into clean executive action items & takeaways',
    },
    {
      id: 'email_draft' as FlowMode,
      name: 'Email Draft',
      icon: Mail,
      desc: 'Structures into Subject line, greeting, body, and sign-off',
    },
    {
      id: 'whatsapp_chat' as FlowMode,
      name: 'WhatsApp / Chat',
      icon: MessageSquare,
      desc: 'Friendly conversational prose with natural mobile formatting',
    },
    {
      id: 'code_cursor' as FlowMode,
      name: 'Cursor / IDE',
      icon: Code,
      desc: 'Developer prompt or code comment syntax for Cursor/VS Code',
    },
    {
      id: 'verbatim' as FlowMode,
      name: 'Verbatim',
      icon: FileSpreadsheet,
      desc: 'Exact literal transcription with punctuation',
    },
  ];

  const appTargetsList = [
    { id: 'generic' as AppTarget, name: 'Any Text Field', icon: Globe },
    { id: 'gmail' as AppTarget, name: 'Gmail', icon: Mail },
    { id: 'docs' as AppTarget, name: 'Google Docs', icon: FileText },
    { id: 'notion' as AppTarget, name: 'Notion', icon: FileSpreadsheet },
    { id: 'whatsapp' as AppTarget, name: 'WhatsApp', icon: MessageSquare },
    { id: 'cursor' as AppTarget, name: 'Cursor IDE', icon: Code },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Top Banner / Feature Map Alignment */}
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-[#0e1422] via-[#0b0f17] to-[#121927] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20">
                ⚡
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Wispr Flow — Feature Map for Katha AI
              </h1>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Ultra-fast voice-to-text in any text field across web and desktop apps. Speak naturally in 100+ languages without rigid dictation commands. Katha cleans filler words, resolves mid-speech corrections, and formats text in real time.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Works in Any App (Gmail, Docs, Notion, WhatsApp, Cursor)
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1.5 text-amber-300">
                <Sparkles className="h-3.5 w-3.5" />
                Live Self-Correction Resolution
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1.5 text-sky-400">
                <Volume2 className="h-3.5 w-3.5" />
                Whisper Mode Enabled
              </span>
            </div>
          </div>

          {/* Quick Metrics & Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Whisper Mode Toggle */}
            <button
              onClick={() => setWhisperMode(!whisperMode)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
                whisperMode
                  ? 'border-sky-400 bg-sky-500/15 text-sky-300 shadow-md shadow-sky-500/20'
                  : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white'
              }`}
              title="Boosts microphone gain so you can whisper softly in quiet rooms"
            >
              <Volume2 className="h-4 w-4" />
              <span>Whisper Mode: {whisperMode ? 'ON (High Gain)' : 'OFF'}</span>
            </button>

            {/* Global Shortcut Badge */}
            <div className="flex items-center gap-2 rounded-xl bg-slate-900/90 border border-slate-800 px-3.5 py-2 text-xs text-slate-300 font-mono">
              <Laptop className="h-3.5 w-3.5 text-amber-400" />
              <span>Shortcut: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-400 font-bold">Ctrl + Space</kbd></span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature 1: Universal App Target Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono">
              Feature 1 · Core Voice-to-Text in Any App
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">— Select where your voice types</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Desktop & Mobile Compatible
          </span>
        </div>

        {/* Target App Switcher Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {appTargetsList.map((app) => {
            const Icon = app.icon;
            const isSelected = appTarget === app.id;
            return (
              <button
                key={app.id}
                onClick={() => handleAppTargetChange(app.id)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/15 text-white shadow-md shadow-amber-500/10 font-bold'
                    : 'border-slate-800 bg-[#0e1422] text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className={`h-4 w-4 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{app.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feature 2: Formatting & Clean Style Mode Pills */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono">
            Feature 2 · AI Cleanup While Speaking
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {modes.find((m) => m.id === flowMode)?.desc}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl border border-slate-800 bg-[#0e1422]/90 backdrop-blur-md">
          {modes.map((m) => {
            const Icon = m.icon;
            const isActive = flowMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => handleModeChange(m.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{m.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Central Dictation Capsule & Voice Hub */}
      <div className="rounded-3xl border border-slate-800 bg-[#0d131f] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <button
            onClick={isRecording ? handleStopFlow : handleStartFlow}
            className={`group relative flex items-center gap-3.5 px-7 py-4 rounded-full border-2 transition-all duration-300 shadow-xl ${
              isRecording
                ? 'border-amber-400 bg-amber-500/20 text-white shadow-amber-500/25 scale-105'
                : 'border-slate-700 bg-slate-900/90 text-slate-200 hover:border-amber-400 hover:scale-102'
            }`}
          >
            {isRecording ? (
              <>
                <div className="flex items-center gap-1 h-5">
                  <span
                    className="w-1 bg-amber-400 rounded-full animate-wave-bar"
                    style={{ animationDelay: '0ms', height: `${Math.max(20, micLevel * 100)}%` }}
                  />
                  <span
                    className="w-1 bg-amber-300 rounded-full animate-wave-bar"
                    style={{ animationDelay: '150ms', height: `${Math.max(30, micLevel * 120)}%` }}
                  />
                  <span
                    className="w-1.5 bg-amber-400 rounded-full animate-wave-bar"
                    style={{ animationDelay: '300ms', height: `${Math.max(40, micLevel * 150)}%` }}
                  />
                  <span
                    className="w-1 bg-amber-300 rounded-full animate-wave-bar"
                    style={{ animationDelay: '450ms', height: `${Math.max(25, micLevel * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-amber-300">
                  Listening to {appTarget.toUpperCase()}... ({elapsedSeconds}s)
                </span>
                <span className="text-[11px] text-slate-400 font-mono pl-1">
                  Tap to polish
                </span>
              </>
            ) : (
              <>
                <div className="p-1 rounded-full bg-amber-500 text-slate-950 font-bold">
                  <Mic className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-slate-100 group-hover:text-amber-300">
                  Dictate to {appTargetsList.find((a) => a.id === appTarget)?.name}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Speak naturally
                </span>
              </>
            )}
          </button>

          <p className="text-xs text-slate-400 max-w-md">
            {isRecording
              ? 'Speak freely. Even if you stutter, self-correct ("at 2... no sorry 3 PM"), or whisper, Katha polishes it clean.'
              : 'Hold Space or click above to speak naturally. Speech is captured, cleaned, and typed directly into your target.'}
          </p>
        </div>

        {/* Live Speaking Stream (Raw Voice) */}
        {liveTranscript && (
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1.5">
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                Raw Spoken Stream (What you said before AI cleanup)
              </span>
              <span>{liveTranscript.split(/\s+/).filter(Boolean).length} Words</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 italic font-mono leading-relaxed">
              "{liveTranscript}"
            </p>
          </div>
        )}

        {/* Polishing Indicator */}
        {isPolishing && (
          <div className="mt-6 flex items-center justify-center gap-2 p-6 text-xs text-amber-300 font-mono">
            <Sparkles className="h-4 w-4 animate-spin text-amber-400" />
            <span>Wispr Flow is removing vocal fillers, resolving corrections, and formatting for {appTarget}...</span>
          </div>
        )}

        {/* Polished Result Output Box */}
        {polishedResult && !isPolishing && (
          <div className="mt-6 space-y-4 rounded-2xl border border-amber-500/30 bg-[#0b0f17] p-5 animate-fade-in shadow-xl">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500 text-slate-950 font-bold text-[10px]">
                  ✨
                </span>
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Wispr Flow Polished Writing
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {polishedResult.detectedLanguage}
                </span>

                {/* Self-correction resolution badge */}
                {polishedResult.hadCorrection && (
                  <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] text-emerald-300 font-mono">
                    ✓ Self-Correction Resolved
                  </span>
                )}
              </div>

              {/* Metrics Pill */}
              <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                <span>{polishedResult.wordCount} words</span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-400 font-semibold">{polishedResult.wpm} WPM</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400">~{polishedResult.timeSavedSeconds}s saved</span>
              </div>
            </div>

            {/* Polished Content */}
            <div className="text-sm sm:text-base leading-relaxed text-slate-100 whitespace-pre-wrap font-sans">
              {polishedResult.polishedText}
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-slate-950" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleInjectIntoApp}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 font-semibold text-xs hover:bg-slate-700 transition-colors"
                >
                  {injectedSuccess ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Injected into {appTarget.toUpperCase()}</span>
                    </>
                  ) : (
                    <>
                      <CornerDownLeft className="h-3.5 w-3.5 text-amber-400" />
                      <span>Type into {appTargetsList.find((a) => a.id === appTarget)?.name}</span>
                    </>
                  )}
                </button>

                {onInsertToChat && (
                  <button
                    onClick={() => onInsertToChat(polishedResult.polishedText)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Run as Katha Action</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  setLiveTranscript('');
                  setPolishedResult(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-300 font-mono"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Interactive App Canvas Simulator (Demonstrating typing into Gmail, Docs, Notion, WhatsApp, Cursor) */}
      <div className="rounded-3xl border border-slate-800 bg-[#0e1422] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              Live App Injection Canvas: {appTargetsList.find((a) => a.id === appTarget)?.name}
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Simulating typing directly into {appTarget.toUpperCase()} active text fields
          </span>
        </div>

        {/* Realistic App Frame */}
        <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 sm:p-5 shadow-inner">
          {appTarget === 'gmail' && (
            <div className="space-y-3 font-sans">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs text-slate-400">
                <span className="font-semibold text-slate-200">New Message · Gmail</span>
                <span className="text-slate-500">Draft saved</span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2 border-b border-slate-800/80 pb-1.5">
                <span className="w-12 text-slate-500 font-mono">To:</span>
                <span className="text-amber-400 font-mono">rahul.dev@example.com</span>
              </div>
              <textarea
                value={appInjectedText.gmail || ''}
                onChange={(e) => setAppInjectedText({ ...appInjectedText, gmail: e.target.value })}
                className="w-full bg-transparent text-sm text-slate-200 font-sans leading-relaxed resize-none focus:outline-none min-h-[140px]"
                placeholder="Wispr Flow will write your clean email here..."
              />
            </div>
          )}

          {appTarget === 'docs' && (
            <div className="space-y-3 font-sans">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs text-slate-400">
                <span className="font-semibold text-slate-200">Untitled Document · Google Docs</span>
                <span className="text-slate-500 font-mono">Page 1 · 100% Zoom</span>
              </div>
              <textarea
                value={appInjectedText.docs || ''}
                onChange={(e) => setAppInjectedText({ ...appInjectedText, docs: e.target.value })}
                className="w-full bg-transparent text-sm text-slate-200 font-serif leading-relaxed resize-none focus:outline-none min-h-[140px]"
                placeholder="Google Docs text will be typed here naturally..."
              />
            </div>
          )}

          {appTarget === 'notion' && (
            <div className="space-y-3 font-sans">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs text-slate-400">
                <span className="font-semibold text-slate-200">📄 Project Sprints · Notion Workspace</span>
                <span className="text-slate-500 font-mono">Markdown Block</span>
              </div>
              <textarea
                value={appInjectedText.notion || ''}
                onChange={(e) => setAppInjectedText({ ...appInjectedText, notion: e.target.value })}
                className="w-full bg-transparent text-sm text-slate-200 font-mono leading-relaxed resize-none focus:outline-none min-h-[140px]"
                placeholder="Type '/' for commands or dictate via Wispr Flow..."
              />
            </div>
          )}

          {appTarget === 'whatsapp' && (
            <div className="space-y-3 font-sans">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs text-slate-400">
                <span className="font-semibold text-slate-200">Rahul (Team Lead) · WhatsApp Web</span>
                <span className="text-emerald-400 text-[11px]">online</span>
              </div>
              <div className="rounded-xl bg-[#0b141a] p-3 border border-slate-800 space-y-2">
                <div className="flex justify-end">
                  <div className="max-w-md rounded-2xl rounded-tr-none bg-[#005c4b] p-3 text-xs text-slate-100 leading-relaxed shadow">
                    {appInjectedText.whatsapp || 'Hey, let\'s sync at 3 PM.'}
                    <div className="flex justify-end items-center gap-1 text-[10px] text-slate-300 mt-1">
                      <span>15:02</span>
                      <span className="text-sky-300 font-bold">✓✓</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {appTarget === 'cursor' && (
            <div className="space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs text-slate-400">
                <span className="font-semibold text-slate-200">src/services/vector.ts — Cursor IDE</span>
                <span className="text-amber-400 font-mono">Ctrl+K Active</span>
              </div>
              <textarea
                value={appInjectedText.cursor || ''}
                onChange={(e) => setAppInjectedText({ ...appInjectedText, cursor: e.target.value })}
                className="w-full bg-transparent text-xs text-emerald-400 font-mono leading-relaxed resize-none focus:outline-none min-h-[140px]"
                placeholder="// Dictate code comments or prompts for Cursor AI..."
              />
            </div>
          )}

          {appTarget === 'generic' && (
            <div className="space-y-3 font-sans">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs text-slate-400">
                <span className="font-semibold text-slate-200">Universal Browser & Desktop Input</span>
                <span className="text-slate-500 font-mono">Input Focused</span>
              </div>
              <textarea
                value={appInjectedText.generic || ''}
                onChange={(e) => setAppInjectedText({ ...appInjectedText, generic: e.target.value })}
                className="w-full bg-transparent text-sm text-slate-200 font-sans leading-relaxed resize-none focus:outline-none min-h-[140px]"
                placeholder="Wispr Flow will write your clean spoken thoughts here..."
              />
            </div>
          )}
        </div>
      </div>

      {/* Feature Showcase: AI Cleanup Benchmark Test Cards (Including User's Exact Prompt) */}
      <div className="rounded-3xl border border-slate-800 bg-[#0e1422] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              AI Cleanup & Mid-Speech Correction Benchmarks
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Click any test to see instant transformation
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Exact User Prompt Benchmark */}
          <div
            onClick={() => {
              const testRaw = "Um, actually let's meet at 2... no, sorry, 3 PM tomorrow.";
              setFlowMode('smart_clean');
              setLiveTranscript(testRaw);
              polishTranscript(testRaw, 'smart_clean', appTarget);
            }}
            className="cursor-pointer group rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900/90 p-4 hover:border-amber-400 transition-all shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="rounded bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                Benchmark 1 · User's Exact Self-Correction
              </span>
              <span className="text-xs text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform">
                Run Test →
              </span>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-slate-400 font-mono">
                <span className="text-rose-400 font-bold">User says:</span> "Um, actually let's meet at 2... no, sorry, 3 PM tomorrow."
              </p>
              <p className="text-xs text-emerald-400 font-semibold">
                <span className="text-emerald-300 font-bold">AI output:</span> "Let's meet at 3 PM tomorrow."
              </p>
              <p className="text-[11px] text-slate-500 italic pt-1">
                Discards "2", removes vocal filler "Um, actually", resolves "no, sorry", produces clean text without raw messy correction.
              </p>
            </div>
          </div>

          {/* Multilingual Odia-English Code-Switching Self-Correction */}
          <div
            onClick={() => {
              const testRaw = "Kal meeting re 4 PM... nahi nahi 3 PM re Rahul ku kahideba";
              setFlowMode('smart_clean');
              setLiveTranscript(testRaw);
              polishTranscript(testRaw, 'smart_clean', appTarget);
            }}
            className="cursor-pointer group rounded-2xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 hover:bg-slate-900 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-mono uppercase">
                Benchmark 2 · Odia/Hindi Mixed Speech Backtrack
              </span>
              <span className="text-xs text-slate-400 font-medium group-hover:text-amber-400">
                Run Test →
              </span>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-slate-400 font-mono">
                <span className="text-rose-400 font-bold">User says:</span> "Kal meeting re 4 PM... nahi nahi 3 PM re Rahul ku kahideba"
              </p>
              <p className="text-xs text-emerald-400 font-semibold">
                <span className="text-emerald-300 font-bold">AI output:</span> "Kal meeting re 3 PM re Rahul ku kahideba."
              </p>
              <p className="text-[11px] text-slate-500 italic pt-1">
                Resolves "nahi nahi", strips discarded "4 PM", preserves natural Odianglish syntax.
              </p>
            </div>
          </div>

          {/* Numbered List Sequence Formatting */}
          <div
            onClick={() => {
              const testRaw = "First optimize Silero VAD latency, second configure pgvector IVFFlat indexing, and third run end to end WER benchmarks";
              setFlowMode('numbered_list');
              setLiveTranscript(testRaw);
              polishTranscript(testRaw, 'numbered_list', appTarget);
            }}
            className="cursor-pointer group rounded-2xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 hover:bg-slate-900 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-mono uppercase">
                Benchmark 3 · Spoken Procedure to Numbered List
              </span>
              <span className="text-xs text-slate-400 font-medium group-hover:text-amber-400">
                Run Test →
              </span>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-slate-400 font-mono">
                <span className="text-rose-400 font-bold">User says:</span> "First optimize Silero VAD latency, second configure pgvector..."
              </p>
              <p className="text-xs text-emerald-400 font-semibold">
                <span className="text-emerald-300 font-bold">AI output:</span> Formats into 1., 2., 3. numbered steps.
              </p>
            </div>
          </div>

          {/* Email Draft from Spoken Ramble */}
          <div
            onClick={() => {
              const testRaw = "hey Rahul regarding our discussion yesterday about Katha ASR model fine tuning please review the attached error logs and let me know if we can schedule a quick 15 minute sync tomorrow at 10 AM";
              setFlowMode('email_draft');
              setAppTarget('gmail');
              setLiveTranscript(testRaw);
              polishTranscript(testRaw, 'email_draft', 'gmail');
            }}
            className="cursor-pointer group rounded-2xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 hover:bg-slate-900 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-mono uppercase">
                Benchmark 4 · Spoken Thought to Executive Email
              </span>
              <span className="text-xs text-slate-400 font-medium group-hover:text-amber-400">
                Run Test →
              </span>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-slate-400 font-mono">
                <span className="text-rose-400 font-bold">User says:</span> "hey Rahul regarding our discussion yesterday about Katha ASR..."
              </p>
              <p className="text-xs text-emerald-400 font-semibold">
                <span className="text-emerald-300 font-bold">AI output:</span> Complete Subject, greeting, formatted paragraphs, sign-off.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature 3: Custom Vocabulary & Uncommon Names / Terminology */}
      <div className="rounded-3xl border border-slate-800 bg-[#0e1422] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-amber-400" />
              Context-Aware Custom Vocabulary & Uncommon Terminology
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ensures uncommon Indian names, regional terms, and technical jargon are transcribed with 100% precision.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {customVocab.length} Active Entities
          </span>
        </div>

        {/* Add new entity input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newVocabTerm}
            onChange={(e) => setNewVocabTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddVocabTerm()}
            placeholder="Add uncommon name or jargon (e.g. 'GIFT University', 'Priyadarshi')..."
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
          />
          <button
            onClick={handleAddVocabTerm}
            className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Term</span>
          </button>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          {customVocab.map((term) => (
            <span
              key={term}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-xs text-slate-300 font-mono"
            >
              <span>{term}</span>
              <button
                onClick={() => handleRemoveVocabTerm(term)}
                className="text-slate-500 hover:text-rose-400"
                title="Remove"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
