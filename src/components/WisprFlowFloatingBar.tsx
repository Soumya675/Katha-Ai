import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Copy,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  List,
  Mail,
  FileText,
  CornerDownLeft,
} from 'lucide-react';
import { FlowMode, FlowPolishResponse } from '../../server/flow.ts';

interface WisprFlowFloatingBarProps {
  onInsertToInput?: (text: string) => void;
}

export const WisprFlowFloatingBar: React.FC<WisprFlowFloatingBarProps> = ({ onInsertToInput }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [flowMode, setFlowMode] = useState<FlowMode>('smart_clean');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [polishedResult, setPolishedResult] = useState<FlowPolishResponse | null>(null);
  const [isPolishing, setIsPolishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [micLevel, setMicLevel] = useState(0);

  const isRecordingRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Setup Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const r = new SpeechRecognition();
      r.continuous = true;
      r.interimResults = true;
      r.lang = 'en-IN';

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
          } catch (err) {}
        }
      };

      recognitionRef.current = r;
    }
  }, []);

  const startMeter = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        setMicLevel(Math.min(1, (sum / dataArray.length) / 75));
        animFrameRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch (e) {}
  };

  const stopMeter = () => {
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

  const handleStart = async () => {
    setLiveTranscript('');
    setPolishedResult(null);
    setIsRecording(true);
    isRecordingRef.current = true;
    setIsOpen(true);

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      micStreamRef.current = stream;
      startMeter(stream);
    } catch (err) {
      console.warn('Mic note:', err);
      // Attempt browser speech recognition even if raw stream had issues
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }
    }
  };

  const handleStop = async () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    stopMeter();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    if (liveTranscript.trim()) {
      await polishText(liveTranscript.trim());
    }
  };

  const handleStopWithText = async (text: string) => {
    setIsRecording(false);
    stopMeter();
    await polishText(text);
  };

  const polishText = async (text: string) => {
    setIsPolishing(true);
    try {
      const res = await fetch('/api/flow/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: text, mode: flowMode }),
      });
      const data: FlowPolishResponse = await res.json();
      setPolishedResult(data);
    } catch (e) {
      console.error('Polish error:', e);
    } finally {
      setIsPolishing(false);
    }
  };

  const handleCopy = () => {
    const text = polishedResult?.polishedText || liveTranscript;
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    const text = polishedResult?.polishedText || liveTranscript;
    if (text && onInsertToInput) {
      onInsertToInput(text);
      setIsOpen(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[92%] sm:w-full">
      {/* Expanded Flow Card */}
      {isOpen && (
        <div className="mb-2 rounded-2xl border border-slate-700 bg-[#0e1422]/95 p-4 shadow-2xl backdrop-blur-xl animate-fade-in text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                Wispr Flow HUD
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {flowMode.replace('_', ' ')}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFlowMode('smart_clean')}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  flowMode === 'smart_clean' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
                title="Smart Polish"
              >
                Clean
              </button>
              <button
                onClick={() => setFlowMode('bullet_notes')}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  flowMode === 'bullet_notes' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
                title="Bullet Notes"
              >
                Bullets
              </button>
              <button
                onClick={() => setFlowMode('email_draft')}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  flowMode === 'email_draft' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
                title="Email Draft"
              >
                Email
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Transcript / Result Box */}
          <div className="min-h-[48px] max-h-48 overflow-y-auto rounded-xl bg-slate-950/80 p-3 text-slate-200 font-sans leading-relaxed border border-slate-800">
            {isRecording ? (
              <p className="italic text-slate-400">
                {liveTranscript || 'Listening... Speak in Hindi, Odia, or English...'}
              </p>
            ) : isPolishing ? (
              <p className="flex items-center gap-2 text-amber-300 font-mono text-[11px]">
                <Sparkles className="h-3.5 w-3.5 animate-spin" />
                <span>Wispr Flow cleaning disfluencies and formatting...</span>
              </p>
            ) : polishedResult ? (
              <div className="space-y-1">
                <p className="text-white whitespace-pre-wrap">{polishedResult.polishedText}</p>
                <span className="text-[10px] text-emerald-400 font-mono block pt-1">
                  ✓ {polishedResult.wordCount} words · {polishedResult.wpm} WPM · {polishedResult.detectedLanguage}
                </span>
              </div>
            ) : (
              <p className="text-slate-500 italic">Press the mic button to start Wispr Flow voice dictation.</p>
            )}
          </div>

          {/* Actions */}
          {(polishedResult || liveTranscript) && !isRecording && (
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                {onInsertToInput && (
                  <button
                    onClick={handleInsert}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800 text-slate-200 font-medium text-xs hover:bg-slate-700"
                  >
                    <CornerDownLeft className="h-3 w-3" />
                    <span>Insert to Katha</span>
                  </button>
                )}
              </div>

              <span className="text-[10px] text-slate-400 font-mono">
                Press Esc to close
              </span>
            </div>
          )}
        </div>
      )}

      {/* Floating Capsule Bar (Wispr Flow Signature Pill) */}
      <div className="flex items-center justify-between rounded-full border border-slate-700/80 bg-[#0e1422]/95 px-4 py-2.5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <button
            onClick={isRecording ? handleStop : handleStart}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
              isRecording
                ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
            }`}
            aria-label={isRecording ? 'Stop recording' : 'Start Flow dictation'}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>

          <div className="flex flex-col">
            <span className="text-xs font-bold text-white leading-tight flex items-center gap-1.5">
              <span>Wispr Flow</span>
              {isRecording && (
                <span className="flex items-center gap-0.5">
                  <span className="w-1 bg-amber-400 rounded-full animate-wave-bar" style={{ height: '10px' }} />
                  <span className="w-1 bg-amber-400 rounded-full animate-wave-bar" style={{ height: '14px' }} />
                  <span className="w-1 bg-amber-400 rounded-full animate-wave-bar" style={{ height: '8px' }} />
                </span>
              )}
            </span>
            <span className="text-[10px] text-slate-400 leading-tight">
              {isRecording ? 'Listening & writing...' : 'Tap mic to dictate anywhere'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {liveTranscript && !isRecording && (
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              title="Copy current transcript"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 text-[11px] font-mono text-amber-400 hover:text-amber-300 pl-2"
          >
            <span>{isOpen ? 'Hide' : 'Expand'}</span>
            {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
