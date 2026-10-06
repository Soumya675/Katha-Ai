import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Loader2, Play, Square, CheckCircle2, Globe, Radio } from 'lucide-react';
import { SupportedLanguage } from '../types/index.ts';

export type VoiceState = 'inactive' | 'listening' | 'processing' | 'executing' | 'responding';

interface VoiceSphereProps {
  voiceState: VoiceState;
  onStartListening: () => void;
  onStopListening: () => void;
  partialTranscript: string;
  detectedLanguage?: SupportedLanguage;
  currentResponseAudioUrl?: string;
  activeIntentTitle?: string;
  onSubmitText: (text: string) => void;
  isMicActive?: boolean;
  audioInputMode?: 'speech-recognition' | 'gemini-3.5-transcribe';
  setAudioInputMode?: (mode: 'speech-recognition' | 'gemini-3.5-transcribe') => void;
  micVolume?: number;
  speechLang?: string;
  setSpeechLang?: (lang: string) => void;
}

export const VoiceSphere: React.FC<VoiceSphereProps> = ({
  voiceState,
  onStartListening,
  onStopListening,
  partialTranscript,
  detectedLanguage,
  currentResponseAudioUrl,
  activeIntentTitle,
  onSubmitText,
  isMicActive = false,
  audioInputMode = 'speech-recognition',
  setAudioInputMode,
  micVolume = 0,
  speechLang = 'en-IN',
  setSpeechLang,
}) => {
  const [inputText, setInputText] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync partial transcript into the text input box in real time so the user sees Katha fetch the voice and write it
  useEffect(() => {
    if (partialTranscript) {
      setInputText(partialTranscript);
    }
  }, [partialTranscript]);

  // Play audio when response audio URL arrives
  useEffect(() => {
    if (currentResponseAudioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(currentResponseAudioUrl);
      audioRef.current = audio;
      setIsPlayingAudio(true);
      audio.play().catch((err) => {
        console.warn('Audio playback note:', err);
        setIsPlayingAudio(false);
      });
      audio.onended = () => {
        setIsPlayingAudio(false);
      };
    }
  }, [currentResponseAudioUrl]);

  const handleToggleVoice = () => {
    if (voiceState === 'listening') {
      onStopListening();
    } else {
      if (isPlayingAudio && audioRef.current) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      }
      onStartListening();
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSubmitText(inputText.trim());
    setInputText('');
  };

  // State labels and colors
  const getStateInfo = () => {
    switch (voiceState) {
      case 'listening':
        return {
          title: 'Listening to your microphone...',
          subtitle: 'Speak naturally. Katha is fetching your words and typing them in real time.',
          sphereGlow: 'from-amber-500/30 via-orange-500/20 to-transparent border-amber-400',
          ringColor: 'border-amber-400/80 shadow-amber-500/30',
          textColor: 'text-amber-300',
        };
      case 'processing':
        return {
          title: 'Understanding...',
          subtitle: 'Analyzing intent, context & Indian code-switching',
          sphereGlow: 'from-cyan-500/30 via-blue-500/20 to-transparent border-cyan-400',
          ringColor: 'border-cyan-400/80 shadow-cyan-500/30',
          textColor: 'text-cyan-300',
        };
      case 'executing':
        return {
          title: 'Executing Action...',
          subtitle: activeIntentTitle || 'Running requested workflow tools',
          sphereGlow: 'from-emerald-500/30 via-teal-500/20 to-transparent border-emerald-400',
          ringColor: 'border-emerald-400/80 shadow-emerald-500/30',
          textColor: 'text-emerald-300',
        };
      case 'responding':
        return {
          title: 'Responding...',
          subtitle: 'Speaking response via natural Indian voice synthesis',
          sphereGlow: 'from-amber-400/30 via-yellow-500/20 to-transparent border-amber-300',
          ringColor: 'border-amber-300/80 shadow-amber-400/30',
          textColor: 'text-amber-200',
        };
      case 'inactive':
      default:
        return {
          title: 'Tap to Speak',
          subtitle: 'Or press Ctrl + Space to dictate in English, Hindi, or Odia',
          sphereGlow: 'from-slate-800/40 via-slate-900/40 to-transparent border-slate-700',
          ringColor: 'border-slate-700 hover:border-amber-500/60 shadow-slate-900/50',
          textColor: 'text-slate-200',
        };
    }
  };

  const stateInfo = getStateInfo();

  const languageOptions = [
    { code: 'en-IN', label: 'Indian English / Hinglish' },
    { code: 'hi-IN', label: 'Hindi (हिंदी)' },
    { code: 'or-IN', label: 'Odia (ଓଡ଼ିଆ)' },
    { code: 'en-US', label: 'English (US)' },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center rounded-3xl border border-slate-800 bg-[#0d131f] p-8 sm:p-12 shadow-2xl overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-orange-600/10 blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-2xl">
        {/* Header context badge */}
        <div className="flex items-center gap-2 mb-3 text-xs font-mono text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <span>KATHA MULTILINGUAL VOICE AGENT</span>
          <span aria-hidden="true">·</span>
          <span>Bhubaneswar, IST</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-6">
          "What would you like to do?"
        </h2>

        {/* Central Voice Sphere Hub */}
        <div className="relative flex items-center justify-center my-3">
          {/* Outer pulsating rings */}
          {voiceState === 'listening' && (
            <div className="absolute h-48 w-48 rounded-full border border-amber-500/40 animate-ping opacity-30" />
          )}
          {voiceState === 'responding' && (
            <div className="absolute h-44 w-44 rounded-full border border-amber-400/40 animate-pulse opacity-40" />
          )}
          {voiceState === 'processing' && (
            <div className="absolute h-44 w-44 rounded-full border border-cyan-400/30 animate-spin opacity-40 border-dashed" />
          )}

          {/* Glowing central orb button */}
          <button
            onClick={handleToggleVoice}
            aria-label={voiceState === 'listening' ? 'Stop Listening' : 'Start Speaking'}
            className={`group relative flex h-32 w-32 items-center justify-center rounded-full border-2 transition-all duration-300 shadow-2xl ${stateInfo.ringColor} bg-gradient-to-b ${stateInfo.sphereGlow} hover:scale-105 active:scale-95 focus:outline-none`}
          >
            {/* Visualizer bars inside the sphere */}
            {voiceState === 'listening' || voiceState === 'responding' ? (
              <div className="flex items-center gap-1.5 h-12">
                <span className="w-1 bg-amber-400 rounded-full animate-wave-bar" style={{ animationDelay: '0ms', height: `${Math.max(30, micVolume * 120)}%` }} />
                <span className="w-1 bg-amber-400 rounded-full animate-wave-bar" style={{ animationDelay: '150ms', height: `${Math.max(40, micVolume * 150)}%` }} />
                <span className="w-1.5 bg-amber-300 rounded-full animate-wave-bar" style={{ animationDelay: '300ms', height: `${Math.max(50, micVolume * 180)}%` }} />
                <span className="w-1 bg-amber-400 rounded-full animate-wave-bar" style={{ animationDelay: '450ms', height: `${Math.max(35, micVolume * 130)}%` }} />
                <span className="w-1 bg-amber-400 rounded-full animate-wave-bar" style={{ animationDelay: '200ms', height: `${Math.max(45, micVolume * 160)}%` }} />
              </div>
            ) : voiceState === 'processing' ? (
              <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
            ) : voiceState === 'executing' ? (
              <CheckCircle2 className="h-10 w-10 text-emerald-400 animate-pulse" />
            ) : (
              <Mic className="h-10 w-10 text-slate-300 group-hover:text-amber-400 transition-colors" />
            )}
          </button>
        </div>

        {/* State label */}
        <div className="mt-4">
          <p className={`text-base font-semibold tracking-wide ${stateInfo.textColor}`}>
            {stateInfo.title}
          </p>
          <p className="text-xs text-slate-400 mt-0.5 max-w-md">
            {stateInfo.subtitle}
          </p>
        </div>

        {/* Spoken Language Selector Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
            <Globe className="h-3 w-3 text-amber-400" />
            Mic Language:
          </span>
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-900/90 border border-slate-800">
            {languageOptions.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setSpeechLang && setSpeechLang(lang.code)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  speechLang === lang.code
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Microphone Sound Visualizer & Volume Meter */}
        {voiceState === 'listening' && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3.5 py-1.5 text-xs text-amber-300 font-mono animate-fade-in">
            <span className="inline-block h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            <span>Mic Live Active: {Math.round(micVolume * 100)}%</span>
            <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-75"
                style={{ width: `${Math.min(100, Math.max(12, micVolume * 100))}%` }}
              />
            </div>
          </div>
        )}

        {/* Live Word-by-Word Writing Stream */}
        {partialTranscript && (
          <div className="mt-4 w-full max-w-xl rounded-2xl border-2 border-amber-400/80 bg-slate-950 p-4 shadow-xl animate-fade-in text-left">
            <div className="flex items-center justify-between text-[11px] text-amber-400 font-mono mb-2 border-b border-slate-800 pb-1.5">
              <span className="flex items-center gap-1.5 font-bold">
                <Radio className="h-3 w-3 text-rose-400 animate-pulse" />
                LIVE MIC WRITING STREAM
              </span>
              <span className="text-slate-400 text-[10px]">
                {partialTranscript.split(/\s+/).filter(Boolean).length} Words Fetched
              </span>
            </div>
            <p className="text-sm sm:text-base text-white font-sans leading-relaxed flex items-center flex-wrap">
              <span>{partialTranscript}</span>
              {voiceState === 'listening' && (
                <span className="inline-block w-2 h-4 ml-1 bg-amber-400 animate-pulse" />
              )}
            </p>
          </div>
        )}

        {/* Live speech transcription writing into input box */}
        <form onSubmit={handleTextSubmit} className="mt-6 w-full max-w-xl">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                voiceState === 'listening'
                  ? "Speak now... Katha is typing your words here live"
                  : "Or type in English, Hindi, or Odia (e.g. 'Rahul ku mail kari kahiba...')"
              }
              className={`w-full rounded-xl border py-3.5 pl-4 pr-24 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all ${
                voiceState === 'listening'
                  ? 'border-amber-400 bg-slate-900/95 ring-2 ring-amber-400/30'
                  : 'border-slate-700 bg-slate-900/90 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
              }`}
            />
            {voiceState === 'listening' && (
              <span className="absolute right-20 text-[11px] text-amber-400 font-mono flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                Typing...
              </span>
            )}
            <button
              type="submit"
              disabled={!inputText.trim() || voiceState === 'processing'}
              className="absolute right-2 px-3.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-semibold hover:bg-amber-400 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
