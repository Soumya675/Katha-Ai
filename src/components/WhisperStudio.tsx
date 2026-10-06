import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Search,
  Download,
  Share2,
  Bookmark,
  Edit2,
  Check,
  X,
  Languages,
  Sparkles,
  Send,
  MessageSquare,
  FileText,
  Users,
  GraduationCap,
  Video,
  Clock,
  CheckCircle2,
  Volume2,
  Sliders,
  ChevronRight,
  HelpCircle,
  Plus,
  RefreshCw,
  Upload,
  Mic,
  Copy,
  Radio,
  FileCheck,
  ArrowRight,
  Wand2,
  Layers,
  Split,
  BadgeAlert,
} from 'lucide-react';
import {
  Recording,
  TranscriptSegment,
  Speaker,
} from '../../server/whisper_platform.ts';

interface WhisperStudioProps {
  onOpenUpload: () => void;
  initialRecordingId?: string;
}

export const WhisperStudio: React.FC<WhisperStudioProps> = ({ onOpenUpload, initialRecordingId }) => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [currentRecordingId, setCurrentRecordingId] = useState<string>(initialRecordingId || 'rec_whisper_llm_demo');
  const [currentRecording, setCurrentRecording] = useState<Recording | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync initialRecordingId if parent changes it
  useEffect(() => {
    if (initialRecordingId && initialRecordingId !== currentRecordingId) {
      setCurrentRecordingId(initialRecordingId);
    }
  }, [initialRecordingId]);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);

  // Transcript states
  const [searchQuery, setSearchQuery] = useState('');
  const [showTranslation, setShowTranslation] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [renameSpeakerModal, setRenameSpeakerModal] = useState<{ speakerId: string; name: string } | null>(null);
  const [newSpeakerName, setNewSpeakerName] = useState('');
  const [transcriptViewMode, setTranscriptViewMode] = useState<'timestamps' | 'document'>('timestamps');
  const [copiedAll, setCopiedAll] = useState(false);

  // Two-Stage Architecture Switch: Natural Text (LLM Rewritten) vs Raw Whisper (Verbatim ASR) vs Diff
  const [rewriteMode, setRewriteMode] = useState<'natural' | 'raw' | 'diff'>('natural');

  // Live Speech to Text & Rewriting Engine states
  const [isLiveDictating, setIsLiveDictating] = useState(false);
  const [liveRawSpeech, setLiveRawSpeech] = useState('');
  const [liveRewrittenText, setLiveRewrittenText] = useState('');
  const [isRewritingLive, setIsRewritingLive] = useState(false);
  const [dictationLanguage, setDictationLanguage] = useState('en-IN');

  const isLiveDictatingRef = useRef(false);
  const dictationRecognitionRef = useRef<any>(null);
  const dictationStreamRef = useRef<MediaStream | null>(null);

  // AI Panel states
  const [aiTab, setAiTab] = useState<'ask' | 'rewriter' | 'summary' | 'meeting' | 'interview' | 'lecture' | 'creator'>('rewriter');
  const [askQuery, setAskQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [qaHistory, setQaHistory] = useState<
    { query: string; answer: string; citations: { timestamp: string; seconds: number; quote: string }[] }[]
  >([
    {
      query: 'What did they discuss about the Word Error Rate?',
      answer:
        'Priya Sharma announced at [00:23] that after fine-tuning on 4,200 hours of regional Odia and Hindi audio, the Word Error Rate dropped from 14.2% down to 5.8%.',
      citations: [
        {
          timestamp: '00:23',
          seconds: 23,
          quote: 'We evaluated the model and found a 14% error rate. However, after Priya fine-tuned it on All India Radio podcasts, the Word Error Rate dropped to 5.8%.',
        },
      ],
    },
  ]);

  // Rewriter Playground State
  const [playgroundInput, setPlaygroundInput] = useState(
    'um actually I wanted to say that tomorrow we have meeting and I think sir told me to bring the report'
  );
  const [playgroundOutput, setPlaygroundOutput] = useState(
    'We have a meeting tomorrow, and I believe sir asked me to bring the report.'
  );
  const [playgroundStyle, setPlaygroundStyle] = useState<'natural' | 'professional' | 'concise'>('natural');
  const [isPlaygroundRunning, setIsPlaygroundRunning] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptContainerRef = useRef<HTMLDivElement | null>(null);

  // Load recordings list
  const loadRecordings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/recordings');
      const data: Recording[] = await res.json();
      setRecordings(data);
      if (data.length > 0) {
        const found = data.find((r) => r.id === currentRecordingId) || data[0];
        setCurrentRecording(found);
        setCurrentRecordingId(found.id);
      }
    } catch (err) {
      console.error('Failed to load recordings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecordings();
  }, []);

  // Update current recording when selector changes
  useEffect(() => {
    if (!currentRecordingId) return;
    const found = recordings.find((r) => r.id === currentRecordingId);
    if (found) {
      setCurrentRecording(found);
      setCurrentTime(0);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.pause();
      }
    }
  }, [currentRecordingId, recordings]);

  // Audio simulation timer
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && currentRecording) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= currentRecording.duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000 / playbackRate);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playbackRate, currentRecording]);

  const handleSeek = (seconds: number) => {
    setCurrentTime(seconds);
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
    }
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSkip = (secondsDelta: number) => {
    if (!currentRecording) return;
    const target = Math.max(0, Math.min(currentRecording.duration, currentTime + secondsDelta));
    handleSeek(target);
  };

  // Click on sentence jumps playback
  const handleSegmentClick = (startSeconds: number) => {
    handleSeek(startSeconds);
    setIsPlaying(true);
  };

  // Live Speech-to-Text Dictation
  const handleStartLiveDictation = async () => {
    setIsLiveDictating(true);
    isLiveDictatingRef.current = true;
    setLiveRawSpeech('');
    setLiveRewrittenText('');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      if (dictationRecognitionRef.current) {
        try {
          dictationRecognitionRef.current.abort();
        } catch (e) {}
      }

      const r = new SpeechRecognition();
      r.continuous = true;
      r.interimResults = true;
      r.lang = dictationLanguage;

      r.onresult = (e: any) => {
        let accumulated = '';
        for (let i = 0; i < e.results.length; i++) {
          accumulated += e.results[i][0].transcript + ' ';
        }
        const text = accumulated.trim();
        if (text) {
          setLiveRawSpeech(text);
        }
      };

      r.onend = () => {
        if (isLiveDictatingRef.current) {
          try {
            r.start();
          } catch (e) {}
        }
      };

      dictationRecognitionRef.current = r;
      try {
        r.start();
      } catch (e) {
        console.warn('Live dictation start notice:', e);
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      dictationStreamRef.current = stream;
    } catch (e) {
      console.warn('Live mic permission notice:', e);
    }
  };

  const handleStopLiveDictation = async () => {
    setIsLiveDictating(false);
    isLiveDictatingRef.current = false;

    if (dictationRecognitionRef.current) {
      try {
        dictationRecognitionRef.current.stop();
      } catch (e) {}
    }

    if (dictationStreamRef.current) {
      dictationStreamRef.current.getTracks().forEach((t) => t.stop());
      dictationStreamRef.current = null;
    }

    if (liveRawSpeech.trim()) {
      await handleRunLLMRewrite(liveRawSpeech.trim());
    }
  };

  // Run LLM Rewriting Engine on text
  const handleRunLLMRewrite = async (rawInput: string) => {
    if (!rawInput.trim()) return;
    setIsRewritingLive(true);
    try {
      const res = await fetch('/api/v1/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawInput, style: 'natural' }),
      });
      const data = await res.json();
      setLiveRewrittenText(data.naturalText);
    } catch (e) {
      console.error('LLM rewrite failed:', e);
      setLiveRewrittenText(rawInput);
    } finally {
      setIsRewritingLive(false);
    }
  };

  const handleCommitLiveSegment = (useNatural = true) => {
    if (!currentRecording) return;
    const raw = liveRawSpeech.trim();
    const natural = liveRewrittenText.trim() || raw;
    if (!raw && !natural) return;

    const newSeg: TranscriptSegment = {
      id: `seg_live_${Date.now()}`,
      speakerId: 'spk_live',
      speakerName: 'You (Speaker)',
      start: currentTime,
      end: currentTime + 8,
      rawText: raw,
      naturalText: natural,
      text: useNatural ? natural : raw,
      confidence: 0.99,
    };

    const updated = {
      ...currentRecording,
      segments: [...currentRecording.segments, newSeg],
    };
    setCurrentRecording(updated);
    setRecordings((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setLiveRawSpeech('');
    setLiveRewrittenText('');
  };

  const handleRunPlaygroundRewrite = async () => {
    if (!playgroundInput.trim()) return;
    setIsPlaygroundRunning(true);
    try {
      const res = await fetch('/api/v1/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: playgroundInput.trim(), style: playgroundStyle }),
      });
      const data = await res.json();
      setPlaygroundOutput(data.naturalText);
    } catch (e) {
      console.error('Playground rewrite failed:', e);
    } finally {
      setIsPlaygroundRunning(false);
    }
  };

  const handleCopyAllTranscript = () => {
    if (!currentRecording) return;
    const fullText = currentRecording.segments
      .map((s) => {
        const displayText =
          rewriteMode === 'raw'
            ? s.rawText || s.text
            : s.naturalText || s.text;
        return `${s.speakerName} [${formatSeconds(s.start)}]:\n${displayText}`;
      })
      .join('\n\n');
    navigator.clipboard.writeText(fullText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Rename speaker
  const handleSaveSpeakerName = async () => {
    if (!renameSpeakerModal || !newSpeakerName.trim() || !currentRecording) return;
    try {
      const res = await fetch(`/api/v1/recordings/${currentRecording.id}/speaker`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speakerId: renameSpeakerModal.speakerId,
          newName: newSpeakerName.trim(),
        }),
      });
      const updated: Recording = await res.json();
      setCurrentRecording(updated);
      setRecordings((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setRenameSpeakerModal(null);
      setNewSpeakerName('');
    } catch (e) {
      console.error('Failed to rename speaker:', e);
    }
  };

  // Edit segment text
  const handleSaveSegmentText = async (segId: string) => {
    if (!currentRecording || !editingText.trim()) return;
    try {
      const res = await fetch(`/api/v1/recordings/${currentRecording.id}/segment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segmentId: segId,
          newText: editingText.trim(),
        }),
      });
      const updated: Recording = await res.json();
      setCurrentRecording(updated);
      setRecordings((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setEditingSegmentId(null);
      setEditingText('');
    } catch (e) {
      console.error('Failed to update segment:', e);
    }
  };

  // Toggle bookmark
  const handleToggleBookmark = async (segId: string) => {
    if (!currentRecording) return;
    try {
      const res = await fetch(`/api/v1/recordings/${currentRecording.id}/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segmentId: segId }),
      });
      const updated: Recording = await res.json();
      setCurrentRecording(updated);
      setRecordings((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (e) {
      console.error('Failed to bookmark segment:', e);
    }
  };

  // Translate transcript
  const handleTranslate = async (lang = 'English') => {
    if (!currentRecording) return;
    setIsTranslating(true);
    try {
      const res = await fetch(`/api/v1/recordings/${currentRecording.id}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetLanguage: lang }),
      });
      const updated: Recording = await res.json();
      setCurrentRecording(updated);
      setRecordings((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setShowTranslation(true);
    } catch (e) {
      console.error('Translation error:', e);
    } finally {
      setIsTranslating(false);
    }
  };

  // Ask AI about recording
  const handleAskAI = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!askQuery.trim() || !currentRecording || isAsking) return;

    const query = askQuery.trim();
    setAskQuery('');
    setIsAsking(true);

    try {
      const res = await fetch(`/api/v1/recordings/${currentRecording.id}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setQaHistory((prev) => [
        {
          query,
          answer: data.answer,
          citations: data.timestampCitations || [],
        },
        ...prev,
      ]);
    } catch (err) {
      console.error('Ask AI error:', err);
    } finally {
      setIsAsking(false);
    }
  };

  // Export transcript
  const handleExport = (format: 'txt' | 'srt' | 'vtt' | 'json' | 'md') => {
    if (!currentRecording) return;
    window.open(`/api/v1/recordings/${currentRecording.id}/export?format=${format}`, '_blank');
  };

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (isLoading || !currentRecording) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-400 font-mono text-xs">
        <RefreshCw className="h-5 w-5 animate-spin text-amber-400 mr-2" />
        <span>Loading KathaAI Speech Intelligence Studio...</span>
      </div>
    );
  }

  // Filter segments by search
  const filteredSegments = currentRecording.segments.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const txt = s.naturalText || s.text;
    const raw = s.rawText || '';
    return txt.toLowerCase().includes(q) || raw.toLowerCase().includes(q) || s.speakerName.toLowerCase().includes(q);
  });

  const totalWords = currentRecording.segments.reduce(
    (acc, s) => acc + (s.naturalText || s.text).split(/\s+/).filter(Boolean).length,
    0
  );

  return (
    <div className="space-y-6">
      {/* 1. ARCHITECTURE SHOWCASE BANNER: Whisper ASR -> LLM Rewriting Engine */}
      <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-[#0e1422] to-slate-900 p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-400 text-slate-950 font-bold text-xs">
                ⚡
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                Two-Tier Speech Architecture
              </span>
              <span className="rounded bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.2 text-[10px] text-emerald-300 font-mono font-bold">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Whisper handles speech-to-text token generation, while the LLM Rewriting Engine sitting directly on top polishes colloquial speech into crisp natural text.
            </p>
          </div>

          {/* Architecture Pipeline Flow Visual */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] font-mono text-slate-300 overflow-x-auto pb-1">
            <span className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 whitespace-nowrap">
              🎙️ You Speak
            </span>
            <span className="text-amber-400 font-bold">➔</span>
            <span className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-amber-300 whitespace-nowrap">
              🎧 faster-Whisper ASR
            </span>
            <span className="text-amber-400 font-bold">➔</span>
            <span className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 italic whitespace-nowrap">
              "um actually I wanted..."
            </span>
            <span className="text-amber-400 font-bold">➔</span>
            <span className="px-2 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20 whitespace-nowrap">
              🧠 LLM Rewriter
            </span>
            <span className="text-amber-400 font-bold">➔</span>
            <span className="px-2 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold whitespace-nowrap">
              💎 Natural Text
            </span>
          </div>
        </div>
      </div>

      {/* Top Speech to Text Studio Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-3xl border border-slate-800 bg-[#0e1422] p-4 sm:p-6 shadow-xl">
        <div className="flex flex-wrap items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-lg shadow-md shadow-amber-500/10">
            🎙️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono">
                Speech to Text Engine
              </span>
              <span className="text-slate-600">·</span>
              <select
                value={currentRecordingId}
                onChange={(e) => setCurrentRecordingId(e.target.value)}
                className="bg-transparent text-base sm:text-lg font-bold text-white focus:outline-none cursor-pointer border-b border-transparent hover:border-slate-600 pb-0.5"
              >
                {recordings.map((r) => (
                  <option key={r.id} value={r.id} className="bg-slate-900 text-slate-100">
                    {r.title}
                  </option>
                ))}
              </select>
              <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] text-emerald-300 font-mono">
                {currentRecording.status.toUpperCase()}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
              <span>{currentRecording.language}</span>
              <span aria-hidden="true">·</span>
              <span>{formatSeconds(currentRecording.duration)}</span>
              <span aria-hidden="true">·</span>
              <span>{totalWords} Words Transcribed</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400">WER: 5.8% (Acoustic Accuracy 94.2%)</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Mic Speech to Text Button */}
          <button
            onClick={isLiveDictating ? handleStopLiveDictation : handleStartLiveDictation}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md ${
              isLiveDictating
                ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/30'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:brightness-110 shadow-amber-500/20'
            }`}
          >
            <Mic className="h-4 w-4" />
            <span>{isLiveDictating ? 'Stop Speaking' : 'Click to Speak (Live Dictate)'}</span>
          </button>

          {/* Upload File to Transcribe */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition-colors"
          >
            <Upload className="h-3.5 w-3.5 text-amber-400" />
            <span>Upload Audio / Video</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition-colors">
              <Download className="h-3.5 w-3.5 text-amber-400" />
              <span>Export</span>
            </button>
            <div className="absolute right-0 mt-1 hidden group-hover:block w-36 rounded-xl border border-slate-700 bg-slate-900 p-1 shadow-2xl z-30 font-mono text-xs">
              <button
                onClick={() => handleExport('txt')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
              >
                Text (.txt)
              </button>
              <button
                onClick={() => handleExport('srt')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
              >
                Subtitles (.srt)
              </button>
              <button
                onClick={() => handleExport('vtt')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
              >
                WebVTT (.vtt)
              </button>
              <button
                onClick={() => handleExport('md')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
              >
                Markdown (.md)
              </button>
              <button
                onClick={() => handleExport('json')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
              >
                JSON (.json)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Column Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Media Player & Controls (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-3xl border border-slate-800 bg-[#0e1422] p-5 shadow-xl space-y-5 sticky top-20">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                Speech Waveform & Player
              </span>
              <span className="text-xs text-amber-400 font-mono">16kHz Mono VAD</span>
            </div>

            {/* Simulated Animated Waveform Visualizer */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="text-amber-300 font-semibold">{formatSeconds(currentTime)}</span>
                <span>{formatSeconds(currentRecording.duration)}</span>
              </div>

              {/* Waveform Bars */}
              <div className="flex items-center gap-1 h-14 w-full">
                {Array.from({ length: 36 }).map((_, i) => {
                  const pct = (currentTime / currentRecording.duration) * 36;
                  const isPast = i <= pct;
                  const height = 20 + Math.sin(i * 0.7) * 18 + ((i % 3) * 8);
                  return (
                    <button
                      key={i}
                      onClick={() => handleSeek((i / 36) * currentRecording.duration)}
                      className="flex-1 h-full flex items-center justify-center focus:outline-none group"
                      title={`Jump to ${formatSeconds((i / 36) * currentRecording.duration)}`}
                    >
                      <span
                        className={`w-full rounded-full transition-all duration-150 ${
                          isPast
                            ? 'bg-amber-400 group-hover:bg-amber-300'
                            : 'bg-slate-800 group-hover:bg-slate-700'
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Scrubber slider */}
              <input
                type="range"
                min={0}
                max={currentRecording.duration}
                value={currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => handleSkip(-10)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                title="Rewind 10s"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <button
                onClick={handleTogglePlay}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 font-bold shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 transition-transform"
              >
                {isPlaying ? <Pause className="h-5 w-5 fill-slate-950" /> : <Play className="h-5 w-5 fill-slate-950 ml-0.5" />}
              </button>

              <button
                onClick={() => handleSkip(10)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                title="Forward 10s"
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </div>

            {/* Speed Selector */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
              <span className="text-slate-500 font-mono">Speed:</span>
              <div className="flex items-center gap-1 font-mono">
                {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setPlaybackRate(rate)}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                      playbackRate === rate
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            {/* Speakers Legend & Renaming */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold uppercase tracking-wider font-mono">
                  Diarized Speakers ({currentRecording.speakers.length})
                </span>
                <span className="text-[10px] text-slate-500 font-mono">pyannote.audio</span>
              </div>

              <div className="space-y-1.5">
                {currentRecording.speakers.map((spk) => (
                  <div
                    key={spk.id}
                    className="flex items-center justify-between rounded-xl bg-slate-900/60 border border-slate-800 px-3 py-1.5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      <span className="text-slate-200 font-medium">{spk.name}</span>
                    </div>
                    <button
                      onClick={() => {
                        setRenameSpeakerModal({ speakerId: spk.id, name: spk.name });
                        setNewSpeakerName(spk.name);
                      }}
                      className="text-slate-500 hover:text-amber-400 text-[11px] font-mono"
                    >
                      Rename
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Speech-to-Text Interactive Transcript Studio (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl border border-slate-800 bg-[#0e1422] p-5 shadow-xl space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  Transcribed Text
                </h3>
              </div>

              {/* THREE-TIER VIEW SWITCHER: Natural Text vs Raw Whisper vs Side-by-Side Diff */}
              <div className="flex items-center gap-1.5">
                <div className="flex rounded-xl bg-slate-900 p-0.5 border border-slate-800 text-[11px] font-mono">
                  <button
                    onClick={() => setRewriteMode('natural')}
                    className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                      rewriteMode === 'natural'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Shows clean, natural sentences produced by LLM Rewriter"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Natural Text</span>
                  </button>

                  <button
                    onClick={() => setRewriteMode('raw')}
                    className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                      rewriteMode === 'raw'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Shows raw verbatim Whisper speech tokens with fillers"
                  >
                    <Mic className="h-3 w-3" />
                    <span>Raw Whisper</span>
                  </button>

                  <button
                    onClick={() => setRewriteMode('diff')}
                    className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                      rewriteMode === 'diff'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Side-by-side comparison of Raw ASR vs Natural Polish"
                  >
                    <Split className="h-3 w-3" />
                    <span>Diff</span>
                  </button>
                </div>

                <button
                  onClick={handleCopyAllTranscript}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
                  title="Copy full transcribed text"
                >
                  {copiedAll ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedAll ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* LIVE SPEECH TO TEXT & TWO-TIER REWRITING BANNER */}
            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={isLiveDictating ? handleStopLiveDictation : handleStartLiveDictation}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                      isLiveDictating
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                    }`}
                  >
                    <Mic className="h-3.5 w-3.5" />
                    <span>{isLiveDictating ? 'Stop Speaking' : '🎙️ Live Speech to Text'}</span>
                  </button>

                  <select
                    value={dictationLanguage}
                    onChange={(e) => setDictationLanguage(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none"
                  >
                    <option value="en-IN">Indian English / Hinglish</option>
                    <option value="hi-IN">Hindi (हिंदी)</option>
                    <option value="or-IN">Odia (ଓଡ଼ିଆ)</option>
                    <option value="en-US">English (US)</option>
                  </select>
                </div>

                <span className="text-[11px] text-slate-400 font-mono">
                  {isLiveDictating ? 'Whisper ASR is fetching speech...' : 'Speak into mic to test pipeline'}
                </span>
              </div>

              {/* Live Streaming Speech Words Box */}
              {(isLiveDictating || liveRawSpeech) && (
                <div className="rounded-2xl border border-slate-700 bg-slate-950 p-3.5 space-y-3 animate-fade-in">
                  {/* Stage 1: Raw Whisper Speech */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-amber-400 font-mono">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Radio className="h-3 w-3 text-rose-500 animate-ping" />
                        STAGE 1: RAW WHISPER TRANSCRIPT (VERBATIM ASR)
                      </span>
                      <span>{liveRawSpeech.split(/\s+/).filter(Boolean).length} Words</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 font-mono italic bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      "{liveRawSpeech || 'Listening... speak colloquial speech with fillers like "um", "uh", "actually"...'}"
                      {isLiveDictating && <span className="inline-block w-2 h-4 ml-1 bg-amber-400 animate-pulse" />}
                    </p>
                  </div>

                  {/* Stage 2: LLM Rewritten Natural Text */}
                  {(liveRewrittenText || isRewritingLive) && (
                    <div className="space-y-1 pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between text-[11px] text-emerald-400 font-mono font-bold">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="h-3 w-3 text-emerald-400" />
                          STAGE 2: LLM REWRITING ENGINE (NATURAL TEXT)
                        </span>
                        {isRewritingLive && <span className="animate-pulse">Polishing syntax...</span>}
                      </div>
                      <p className="text-xs sm:text-sm text-white font-sans font-medium bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30">
                        {liveRewrittenText}
                      </p>
                    </div>
                  )}

                  {/* Commit Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => handleRunLLMRewrite(liveRawSpeech)}
                      disabled={isRewritingLive || !liveRawSpeech.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold hover:bg-amber-500/30"
                    >
                      <Wand2 className="h-3 w-3" />
                      <span>Run LLM Rewriting Engine</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCommitLiveSegment(false)}
                        disabled={!liveRawSpeech.trim()}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                        title="Commit raw verbatim words"
                      >
                        Keep Raw
                      </button>
                      <button
                        onClick={() => handleCommitLiveSegment(true)}
                        disabled={!liveRawSpeech.trim()}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 shadow-sm"
                      >
                        Commit Natural Text
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Search within transcript */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search words, terms, speakers in this transcript..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2 text-xs text-slate-500 hover:text-slate-300"
                >
                  ✕
                </button>
              )}
            </div>

            {/* SEGMENTS STREAM */}
            <div
              ref={transcriptContainerRef}
              className="space-y-3.5 max-h-[560px] overflow-y-auto pr-1 text-sm font-sans"
            >
              {filteredSegments.map((seg) => {
                const isActive = currentTime >= seg.start && currentTime <= seg.end;
                const isEditing = editingSegmentId === seg.id;
                const raw = seg.rawText || seg.text;
                const natural = seg.naturalText || seg.text;

                return (
                  <div
                    key={seg.id}
                    className={`group relative rounded-2xl border p-4 transition-all ${
                      isActive
                        ? 'border-amber-400/80 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                        : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70'
                    }`}
                  >
                    {/* Segment header: Speaker & Clickable Timestamp */}
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSegmentClick(seg.start)}
                          className="font-mono text-amber-400 hover:underline font-bold text-[11px] bg-amber-400/10 px-1.5 py-0.5 rounded"
                          title="Click to jump audio here"
                        >
                          [{formatSeconds(seg.start)}]
                        </button>
                        <span className="font-semibold text-slate-200">
                          {seg.speakerName}
                        </span>

                        {rewriteMode === 'diff' && (
                          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/30">
                            LLM Rewritten
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleToggleBookmark(seg.id)}
                          className={`p-1 rounded hover:bg-slate-800 ${
                            seg.bookmarked ? 'text-amber-400' : 'text-slate-500'
                          }`}
                          title="Bookmark segment"
                        >
                          <Bookmark className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingSegmentId(seg.id);
                            setEditingText(rewriteMode === 'raw' ? raw : natural);
                          }}
                          className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-200"
                          title="Edit sentence"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* EDITING MODE */}
                    {isEditing ? (
                      <div className="space-y-2 mt-2">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                          rows={3}
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingSegmentId(null)}
                            className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveSegmentText(seg.id)}
                            className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-bold text-xs"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : rewriteMode === 'diff' ? (
                      /* SIDE-BY-SIDE DIFF MODE */
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs leading-relaxed">
                        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 space-y-1">
                          <div className="text-[10px] text-slate-400 font-mono font-bold flex items-center gap-1">
                            <span>🎙️ Raw Whisper Transcript</span>
                          </div>
                          <p className="text-slate-300 font-mono italic">
                            {raw}
                          </p>
                        </div>

                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-1">
                          <div className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            <span>Natural Text (LLM Rewritten)</span>
                          </div>
                          <p className="text-white font-medium">
                            {natural}
                          </p>
                        </div>
                      </div>
                    ) : rewriteMode === 'raw' ? (
                      /* RAW WHISPER VERBATIM MODE */
                      <div className="space-y-1">
                        <span className="text-[10px] text-amber-400/80 font-mono uppercase tracking-wider block">
                          Raw Whisper ASR Tokens (Includes colloquial fillers)
                        </span>
                        <p
                          onClick={() => handleSegmentClick(seg.start)}
                          className="text-xs sm:text-sm text-slate-300 font-mono leading-relaxed cursor-pointer hover:text-white"
                        >
                          "{raw}"
                        </p>
                      </div>
                    ) : (
                      /* NATURAL TEXT MODE (DEFAULT) */
                      <p
                        onClick={() => handleSegmentClick(seg.start)}
                        className="text-xs sm:text-sm text-slate-100 font-sans leading-relaxed cursor-pointer hover:text-amber-200"
                      >
                        {natural}
                      </p>
                    )}

                    {/* Translated text if active */}
                    {showTranslation && seg.translatedText && seg.translatedText !== seg.text && (
                      <div className="mt-2 pt-2 border-t border-slate-800/80 text-xs text-cyan-300 italic">
                        <span className="text-[10px] text-cyan-400 uppercase font-mono mr-1.5">EN:</span>
                        {seg.translatedText}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Multi-Mode AI Intelligence & "Ask AI About Audio" (3 cols on lg) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-3xl border border-slate-800 bg-[#0e1422] p-4 sm:p-5 shadow-xl space-y-4">
            {/* Mode Tabs */}
            <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <button
                onClick={() => setAiTab('rewriter')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all ${
                  aiTab === 'rewriter'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Rewriter
              </button>
              <button
                onClick={() => setAiTab('ask')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all ${
                  aiTab === 'ask'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Ask AI
              </button>
              <button
                onClick={() => setAiTab('summary')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all ${
                  aiTab === 'summary'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Summary
              </button>
              <button
                onClick={() => setAiTab('meeting')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all ${
                  aiTab === 'meeting'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Minutes
              </button>
              <button
                onClick={() => setAiTab('interview')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all ${
                  aiTab === 'interview'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Interview
              </button>
              <button
                onClick={() => setAiTab('lecture')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all ${
                  aiTab === 'lecture'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Lecture
              </button>
            </div>

            {/* TAB: LLM REWRITER PLAYGROUND (The core requested feature!) */}
            {aiTab === 'rewriter' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Wand2 className="h-3.5 w-3.5" />
                    LLM Rewriting Engine Playground
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Test the rewriting layer on top of Whisper. Converts raw spoken filler words and colloquial phrasing into natural publication text.
                  </p>
                </div>

                {/* Preset sample buttons */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-mono uppercase">Quick Presets:</span>
                  <div className="flex flex-col gap-1.5 text-[11px]">
                    <button
                      onClick={() => {
                        setPlaygroundInput('um actually I wanted to say that tomorrow we have meeting and I think sir told me to bring the report');
                        setPlaygroundOutput('We have a meeting tomorrow, and I believe sir asked me to bring the report.');
                      }}
                      className="text-left p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:border-amber-400 transition-colors"
                    >
                      💡 "um actually I wanted to say that tomorrow we have meeting and I think sir told me to bring the report"
                    </button>

                    <button
                      onClick={() => {
                        setPlaygroundInput('uh let\'s see like maybe we should meet at 2... no, sorry, 3 PM tomorrow');
                        setPlaygroundOutput('Let\'s meet at 3:00 PM tomorrow.');
                      }}
                      className="text-left p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:border-amber-400 transition-colors"
                    >
                      💡 "uh let's see like maybe we should meet at 2... no, sorry, 3 PM tomorrow"
                    </button>
                  </div>
                </div>

                {/* Style selector */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400 font-mono text-[11px]">Style:</span>
                  <div className="flex items-center gap-1 font-mono text-[11px]">
                    {(['natural', 'professional', 'concise'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => setPlaygroundStyle(st)}
                        className={`px-2 py-0.5 rounded capitalize ${
                          playgroundStyle === st
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input box */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-mono uppercase">
                    Raw Spoken Transcript (Whisper Input):
                  </label>
                  <textarea
                    value={playgroundInput}
                    onChange={(e) => setPlaygroundInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-200 font-mono focus:border-amber-400 focus:outline-none"
                    rows={3}
                  />
                </div>

                {/* Run button */}
                <button
                  onClick={handleRunPlaygroundRewrite}
                  disabled={isPlaygroundRunning || !playgroundInput.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs hover:brightness-110 shadow-md shadow-amber-500/20"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{isPlaygroundRunning ? 'Running LLM Engine...' : 'Run LLM Rewriting Engine'}</span>
                </button>

                {/* Output box */}
                {playgroundOutput && (
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 space-y-1 animate-fade-in">
                    <span className="text-[10px] text-emerald-400 font-mono uppercase font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Polished Natural Text (Output):
                    </span>
                    <p className="text-xs sm:text-sm text-white font-medium leading-relaxed">
                      "{playgroundOutput}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: ASK AI ABOUT AUDIO (RAG) */}
            {aiTab === 'ask' && (
              <div className="space-y-4">
                <div className="text-xs text-slate-400">
                  Ask any question about this audio. Katha AI answers using factual transcript citations with clickable timestamps.
                </div>

                {/* Form */}
                <form onSubmit={handleAskAI} className="relative">
                  <input
                    type="text"
                    value={askQuery}
                    onChange={(e) => setAskQuery(e.target.value)}
                    placeholder="e.g., What were the main decisions?"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-3 pr-10 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!askQuery.trim() || isAsking}
                    className="absolute right-2 top-2 p-1 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>

                {/* Suggested prompt chips */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'What did they discuss about the Word Error Rate?',
                    'Who is responsible for the Cloud Run deployment?',
                    'When is the next meeting scheduled?',
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setAskQuery(p)}
                      className="text-left text-[11px] text-slate-400 hover:text-amber-300 bg-slate-900 border border-slate-800 rounded-lg p-1.5 transition-colors"
                    >
                      💡 {p}
                    </button>
                  ))}
                </div>

                {/* Q&A Stream */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {isAsking && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 font-mono animate-pulse">
                      Analyzing transcript chunks with pgvector embeddings...
                    </div>
                  )}

                  {qaHistory.map((item, i) => (
                    <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 space-y-2 text-xs">
                      <p className="font-semibold text-slate-200">Q: {item.query}</p>
                      <p className="text-slate-300 leading-relaxed">{item.answer}</p>
                      {item.citations.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-800">
                          {item.citations.map((c, cIdx) => (
                            <button
                              key={cIdx}
                              onClick={() => handleSeek(c.seconds)}
                              className="inline-flex items-center gap-1 font-mono text-[10px] bg-amber-400/15 text-amber-300 border border-amber-400/30 px-1.5 py-0.5 rounded hover:bg-amber-400/30"
                              title={c.quote}
                            >
                              ▶ Jump to [{c.timestamp}]
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: GENERAL SUMMARY */}
            {aiTab === 'summary' && (
              <div className="space-y-4 text-xs leading-relaxed max-h-[500px] overflow-y-auto pr-1">
                <div>
                  <h4 className="font-bold text-amber-400 uppercase tracking-wider font-mono text-[11px] mb-1">
                    Short Summary
                  </h4>
                  <p className="text-slate-300">{currentRecording.summary.shortSummary}</p>
                </div>

                <div>
                  <h4 className="font-bold text-amber-400 uppercase tracking-wider font-mono text-[11px] mb-1">
                    Key Points
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {currentRecording.summary.keyPoints.map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-emerald-400 uppercase tracking-wider font-mono text-[11px] mb-1">
                    Decisions Made
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {currentRecording.summary.decisions.map((dec, i) => (
                      <li key={i}>{dec}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-amber-400 uppercase tracking-wider font-mono text-[11px] mb-1">
                    Action Items
                  </h4>
                  <div className="space-y-1.5">
                    {currentRecording.summary.actionItems.map((act, i) => (
                      <div key={i} className="rounded-lg bg-slate-900 border border-slate-800 p-2">
                        <p className="font-semibold text-white">{act.task}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Owner: <span className="text-amber-400">{act.owner}</span> · Deadline: {act.deadline}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: MEETING MODE */}
            {aiTab === 'meeting' && (
              <div className="space-y-4 text-xs leading-relaxed max-h-[500px] overflow-y-auto pr-1">
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-2">
                  <h4 className="font-bold text-white text-sm">
                    {currentRecording.meetingMinutes?.title || currentRecording.title}
                  </h4>
                  <p className="text-slate-400">Date: {currentRecording.meetingMinutes?.date || 'Sept 29, 2026'}</p>
                  <p className="text-slate-400">
                    Participants: {currentRecording.meetingMinutes?.participants.join(', ') || 'Team'}
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-amber-400 uppercase tracking-wider font-mono text-[11px] mb-1">
                    Agenda & Discussion
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {(currentRecording.meetingMinutes?.discussion || currentRecording.summary.keyPoints).map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="font-bold text-emerald-400 uppercase tracking-wider font-mono text-[11px] mb-1">
                    Next Meeting
                  </h5>
                  <p className="text-slate-300">
                    {currentRecording.meetingMinutes?.nextMeeting || 'Tomorrow at 3:00 PM IST'}
                  </p>
                </div>
              </div>
            )}

            {/* TAB: INTERVIEW INTELLIGENCE */}
            {aiTab === 'interview' && (
              <div className="space-y-4 text-xs leading-relaxed max-h-[500px] overflow-y-auto pr-1">
                {currentRecording.interviewReport ? (
                  <>
                    <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-1">
                      <p className="font-bold text-white text-sm">
                        Candidate: {currentRecording.interviewReport.candidateName}
                      </p>
                      <p className="text-emerald-400 font-semibold">
                        Rating: {currentRecording.interviewReport.communicationRating}
                      </p>
                    </div>

                    <div>
                      <h5 className="font-bold text-amber-400 uppercase tracking-wider font-mono text-[11px] mb-1.5">
                        Technical Skill Scores
                      </h5>
                      <div className="space-y-2">
                        {currentRecording.interviewReport.technicalSkills.map((sk, i) => (
                          <div key={i} className="rounded-lg bg-slate-900 border border-slate-800 p-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-semibold text-slate-200">{sk.skill}</span>
                              <span className="font-mono text-amber-400 font-bold">{sk.score}/10</span>
                            </div>
                            <p className="text-[11px] text-slate-400 italic">"{sk.evidence}"</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-bold text-slate-300 uppercase tracking-wider font-mono text-[11px] mb-1">
                        Recruiter Notes
                      </h5>
                      <p className="text-slate-400">{currentRecording.interviewReport.recruiterNotes}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-slate-400 italic">Interview analysis will generate when an interview audio is uploaded.</p>
                )}
              </div>
            )}

            {/* TAB: LECTURE AI */}
            {aiTab === 'lecture' && (
              <div className="space-y-4 text-xs leading-relaxed max-h-[500px] overflow-y-auto pr-1">
                {currentRecording.lectureNotes ? (
                  <>
                    <div>
                      <h5 className="font-bold text-amber-400 uppercase tracking-wider font-mono text-[11px] mb-1.5">
                        Chapter Divisions
                      </h5>
                      <div className="space-y-1.5">
                        {currentRecording.lectureNotes.chapterDivisions.map((ch, i) => (
                          <div
                            key={i}
                            onClick={() => {
                              const [m, s] = ch.timestamp.split(':').map(Number);
                              handleSeek(m * 60 + s);
                            }}
                            className="cursor-pointer rounded-lg bg-slate-900 border border-slate-800 p-2 hover:border-amber-400"
                          >
                            <span className="font-mono text-amber-400 font-bold mr-2">[{ch.timestamp}]</span>
                            <span className="font-semibold text-white">{ch.title}</span>
                            <p className="text-[11px] text-slate-400 mt-0.5">{ch.summary}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-bold text-cyan-400 uppercase tracking-wider font-mono text-[11px] mb-1.5">
                        Interactive Flashcards
                      </h5>
                      <div className="space-y-2">
                        {currentRecording.lectureNotes.flashcards.map((f, i) => (
                          <div key={i} className="rounded-lg bg-slate-900 border border-slate-800 p-2.5">
                            <p className="font-bold text-slate-200">Q: {f.front}</p>
                            <p className="text-slate-400 mt-1">A: {f.back}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-slate-400 italic">Lecture intelligence generates automatically for academic recordings.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rename Speaker Modal */}
      {renameSpeakerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Rename Speaker</h3>
            <p className="text-xs text-slate-400">
              Update speaker name across all segments in this transcript:
            </p>
            <input
              type="text"
              value={newSpeakerName}
              onChange={(e) => setNewSpeakerName(e.target.value)}
              placeholder="e.g., Rahul Dev, Priya, Dr. Roy..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRenameSpeakerModal(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSpeakerName}
                className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400"
              >
                Save Across Transcript
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
