/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { VoiceSphere, VoiceState } from './components/VoiceSphere.tsx';
import { QuickActions } from './components/QuickActions.tsx';
import { ConversationView } from './components/ConversationView.tsx';
import { WorkflowsView } from './components/WorkflowsView.tsx';
import { DocumentRAGView } from './components/DocumentRAGView.tsx';
import { MemoryView } from './components/MemoryView.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { ArchitectureView } from './components/ArchitectureView.tsx';
import { WisprFlowWorkspace } from './components/WisprFlowWorkspace.tsx';
import { WisprFlowFloatingBar } from './components/WisprFlowFloatingBar.tsx';
import { WhisperStudio } from './components/WhisperStudio.tsx';
import { RecordingsLibrary } from './components/RecordingsLibrary.tsx';
import { UploadModal } from './components/UploadModal.tsx';
import { ConversationMessage, SupportedLanguage } from './types/index.ts';

// Live conversation messages (starts clean, populated as user speaks)
const INITIAL_CONVERSATION: ConversationMessage[] = [];

export default function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'recordings' | 'voice' | 'flow' | 'workflows' | 'rag' | 'memory' | 'admin' | 'architecture'>('studio');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedRecordingId, setSelectedRecordingId] = useState<string>('');
  const [voiceState, setVoiceState] = useState<VoiceState>('inactive');
  const [partialTranscript, setPartialTranscript] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState<SupportedLanguage | undefined>(undefined);
  const [currentResponseAudioUrl, setCurrentResponseAudioUrl] = useState<string | undefined>(undefined);
  const [activeIntentTitle, setActiveIntentTitle] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ConversationMessage[]>(INITIAL_CONVERSATION);
  const [currentlyPlayingAudioUrl, setCurrentlyPlayingAudioUrl] = useState<string | undefined>(undefined);
  
  // Real human voice audio capture states
  const [audioInputMode, setAudioInputMode] = useState<'speech-recognition' | 'gemini-3.5-transcribe'>('speech-recognition');
  const [speechLang, setSpeechLang] = useState('en-IN');
  const [isMicActive, setIsMicActive] = useState(false);
  const [micVolume, setMicVolume] = useState(0);

  // References for live human speech recording
  const isMicActiveRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup audio tracks on unmount
  useEffect(() => {
    return () => {
      isMicActiveRef.current = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Initialize SpeechRecognition helper
  const startSpeechRecognition = (lang = speechLang) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang || 'en-IN';

      recognition.onresult = (event: any) => {
        let accumulated = '';
        for (let i = 0; i < event.results.length; i++) {
          accumulated += event.results[i][0].transcript + ' ';
        }
        const text = accumulated.trim();
        if (text) {
          setPartialTranscript(text);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
      };

      recognition.onend = () => {
        if (isMicActiveRef.current) {
          try {
            recognition.start();
          } catch (e) {}
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      return recognition;
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      return null;
    }
  };

  // Global Wispr Flow shortcut: Ctrl + Space / Cmd + Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is actively typing in an input or textarea
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
        e.preventDefault();
        if (voiceState === 'listening') {
          handleStopListening();
        } else {
          handleStartListening();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [voiceState]);

  // Monitor human audio volume levels from mic stream
  const setupAudioMeter = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setMicVolume(Math.min(1, avg / 80));
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (err) {
      console.warn('Audio meter init note:', err);
    }
  };

  const handleStartListening = async () => {
    setPartialTranscript('');
    setVoiceState('listening');
    setIsMicActive(true);
    isMicActiveRef.current = true;

    try {
      // 1. Start browser speech recognition immediately with selected language
      startSpeechRecognition(speechLang);

      // 2. Request microphone stream for volume visualizer and raw recording
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      micStreamRef.current = stream;
      setupAudioMeter(stream);

      // Start MediaRecorder for capturing human speech audio
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(250); // Slice audio chunks every 250ms
    } catch (err) {
      console.warn('Microphone permission or access error:', err);
      // Attempt browser speech recognition even if raw stream had device conflict
      startSpeechRecognition(speechLang);
    }
  };

  const handleStopListening = () => {
    isMicActiveRef.current = false;
    setIsMicActive(false);
    setVoiceState('processing');

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setMicVolume(0);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('Recognition stop:', err);
      }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = async () => {
        const stream = micStreamRef.current;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          micStreamRef.current = null;
        }

        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        if (partialTranscript.trim()) {
          // If the mic fetched the user's spoken words in real time, process them directly!
          await handleProcessUtterance(partialTranscript.trim());
        } else if (audioBlob.size > 1000) {
          // Convert audio blob to base64 to send to server transcribe
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64DataUrl = reader.result as string;
            const base64Audio = base64DataUrl.split(',')[1];
            await handleProcessAudioPayload(base64Audio, mimeType, partialTranscript);
          };
          reader.readAsDataURL(audioBlob);
        } else {
          setVoiceState('inactive');
        }
      };

      mediaRecorderRef.current.stop();
    } else {
      if (partialTranscript.trim()) {
        handleProcessUtterance(partialTranscript.trim());
      } else {
        setVoiceState('inactive');
      }
    }
  };

  // Process recorded human audio through the backend pipeline (gemini-3.5-transcribe)
  const handleProcessAudioPayload = async (audioBase64: string, mimeType: string, interimText?: string) => {
    setVoiceState('processing');
    try {
      const res = await fetch('/api/voice/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          audioMimeType: mimeType,
          text: interimText?.trim() || undefined,
          sessionId: 'soumya_session_1',
        }),
      });

      const assistantMsg: ConversationMessage = await res.json();

      // Also append the user speech turn if not already appended
      const transcribedSpeech = assistantMsg.original_speech || interimText || 'Voice Command';
      const userMsg: ConversationMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: transcribedSpeech,
        timestamp: new Date().toISOString(),
        original_speech: transcribedSpeech,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setDetectedLanguage(assistantMsg.detected_language);
      if (assistantMsg.detected_intent) {
        setActiveIntentTitle(assistantMsg.detected_intent.intent);
      }

      if (assistantMsg.tool_proposal && !assistantMsg.tool_proposal.is_sensitive) {
        setVoiceState('executing');
        setTimeout(() => {
          if (assistantMsg.audio_url) {
            setVoiceState('responding');
            setCurrentResponseAudioUrl(assistantMsg.audio_url);
            setCurrentlyPlayingAudioUrl(assistantMsg.audio_url);
          } else {
            setVoiceState('inactive');
          }
        }, 800);
      } else if (assistantMsg.audio_url) {
        setVoiceState('responding');
        setCurrentResponseAudioUrl(assistantMsg.audio_url);
        setCurrentlyPlayingAudioUrl(assistantMsg.audio_url);
        setTimeout(() => {
          setVoiceState('inactive');
        }, 3500);
      } else {
        setVoiceState('inactive');
      }
    } catch (err) {
      console.error('Audio pipeline processing error:', err);
      setVoiceState('inactive');
    } finally {
      setPartialTranscript('');
    }
  };

  const handleProcessUtterance = async (text: string) => {
    setVoiceState('processing');
    const userMsgId = `user_${Date.now()}`;
    const userMsg: ConversationMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      original_speech: text,
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/voice/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          sessionId: 'soumya_session_1',
        }),
      });

      const assistantMsg: ConversationMessage = await res.json();
      setMessages((prev) => [...prev, assistantMsg]);

      setDetectedLanguage(assistantMsg.detected_language);
      if (assistantMsg.detected_intent) {
        setActiveIntentTitle(assistantMsg.detected_intent.intent);
      }

      if (assistantMsg.tool_proposal && !assistantMsg.tool_proposal.is_sensitive) {
        setVoiceState('executing');
        setTimeout(() => {
          if (assistantMsg.audio_url) {
            setVoiceState('responding');
            setCurrentResponseAudioUrl(assistantMsg.audio_url);
            setCurrentlyPlayingAudioUrl(assistantMsg.audio_url);
          } else {
            setVoiceState('inactive');
          }
        }, 800);
      } else if (assistantMsg.audio_url) {
        setVoiceState('responding');
        setCurrentResponseAudioUrl(assistantMsg.audio_url);
        setCurrentlyPlayingAudioUrl(assistantMsg.audio_url);
        setTimeout(() => {
          setVoiceState('inactive');
        }, 3500);
      } else {
        setVoiceState('inactive');
      }
    } catch (err) {
      console.error('Pipeline execution error:', err);
      setVoiceState('inactive');
    } finally {
      setPartialTranscript('');
    }
  };

  const handleConfirmTool = async (proposalId: string, updatedArgs?: Record<string, unknown>) => {
    try {
      const res = await fetch('/api/tools/proposal/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId,
          status: 'approved',
          updatedArguments: updatedArgs,
        }),
      });

      const data = await res.json();

      setMessages((prev) =>
        prev.map((m) => {
          if (m.tool_proposal?.id === proposalId) {
            return {
              ...m,
              tool_proposal: {
                ...m.tool_proposal,
                permission_status: 'executed',
                arguments: updatedArgs ? { ...m.tool_proposal.arguments, ...updatedArgs } : m.tool_proposal.arguments,
              },
              tool_result: data.executionResult,
            };
          }
          return m;
        })
      );
    } catch (err) {
      console.error('Tool approval error:', err);
    }
  };

  const handleRejectTool = async (proposalId: string) => {
    try {
      await fetch('/api/tools/proposal/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId,
          status: 'rejected',
        }),
      });

      setMessages((prev) =>
        prev.map((m) => {
          if (m.tool_proposal?.id === proposalId) {
            return {
              ...m,
              tool_proposal: {
                ...m.tool_proposal,
                permission_status: 'rejected',
              },
            };
          }
          return m;
        })
      );
    } catch (err) {
      console.error('Tool rejection error:', err);
    }
  };

  const handleSendFeedback = async (
    messageId: string,
    feedbackType: 'positive' | 'negative',
    correction?: string
  ) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: msg.original_speech || '',
          detectedLanguage: msg.detected_language || 'en',
          detectedIntent: msg.detected_intent?.intent || 'GENERAL_CONVERSATION',
          generatedResponse: msg.content,
          feedbackType,
          correction,
        }),
      });

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, feedback: feedbackType === 'positive' ? 'thumbs_up' : 'thumbs_down' } : m))
      );
    } catch (err) {
      console.error('Feedback submission error:', err);
    }
  };

  const handlePlayAudio = (url: string) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    if (currentlyPlayingAudioUrl === url) {
      setCurrentlyPlayingAudioUrl(undefined);
      return;
    }
    const audio = new Audio(url);
    currentAudioRef.current = audio;
    setCurrentlyPlayingAudioUrl(url);
    audio.play().catch((e) => console.warn('Audio play error:', e));
    audio.onended = () => {
      setCurrentlyPlayingAudioUrl(undefined);
    };
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickVoice={() => {
          setActiveTab('voice');
          handleStartListening();
        }}
        onOpenUpload={() => setIsUploadModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'studio' && (
          <WhisperStudio
            onOpenUpload={() => setIsUploadModalOpen(true)}
            initialRecordingId={selectedRecordingId}
          />
        )}

        {activeTab === 'recordings' && (
          <RecordingsLibrary
            onOpenUpload={() => setIsUploadModalOpen(true)}
            onSelectRecording={(id) => {
              setSelectedRecordingId(id);
              setActiveTab('studio');
            }}
          />
        )}

        {activeTab === 'voice' && (
          <div className="space-y-8">
            {/* Hero Voice Hub */}
            <VoiceSphere
              voiceState={voiceState}
              onStartListening={handleStartListening}
              onStopListening={handleStopListening}
              partialTranscript={partialTranscript}
              detectedLanguage={detectedLanguage}
              currentResponseAudioUrl={currentResponseAudioUrl}
              activeIntentTitle={activeIntentTitle}
              onSubmitText={(text) => handleProcessUtterance(text)}
              isMicActive={isMicActive}
              audioInputMode={audioInputMode}
              setAudioInputMode={setAudioInputMode}
              micVolume={micVolume}
              speechLang={speechLang}
              setSpeechLang={setSpeechLang}
            />

            {/* Quick Actions & Multilingual Triggers */}
            <QuickActions onSelectAction={(prompt) => handleProcessUtterance(prompt)} />

            {/* Conversation Timeline */}
            <div className="border-t border-slate-800/80 pt-6">
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Real-Time Voice-to-Action Conversation Stream
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  {messages.length} Interaction Turn{messages.length === 1 ? '' : 's'}
                </span>
              </div>

              <ConversationView
                messages={messages}
                onConfirmTool={handleConfirmTool}
                onRejectTool={handleRejectTool}
                onSendFeedback={handleSendFeedback}
                onPlayAudioUrl={handlePlayAudio}
                currentlyPlayingAudioUrl={currentlyPlayingAudioUrl}
              />
            </div>
          </div>
        )}

        {activeTab === 'flow' && (
          <WisprFlowWorkspace
            onInsertToChat={(text) => {
              setActiveTab('voice');
              handleProcessUtterance(text);
            }}
          />
        )}
        {activeTab === 'workflows' && <WorkflowsView />}
        {activeTab === 'rag' && <DocumentRAGView />}
        {activeTab === 'memory' && <MemoryView />}
        {activeTab === 'admin' && <AdminDashboard />}
        {activeTab === 'architecture' && <ArchitectureView />}
      </main>

      {/* Upload & Transcribe Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onRecordingCreated={(newRec) => {
          setSelectedRecordingId(newRec.id);
          setActiveTab('studio');
        }}
      />

      {/* Floating Wispr Flow HUD Bar (Available across all workspaces) */}
      <WisprFlowFloatingBar
        onInsertToInput={(text) => {
          setActiveTab('voice');
          handleProcessUtterance(text);
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#080c13] py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Katha AI</span>
            <span aria-hidden="true">·</span>
            <span>India's Multilingual Voice-to-Action Assistant</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px] text-slate-400">
            <span>Whisper / Katha ASR</span>
            <span aria-hidden="true">·</span>
            <span>Silero VAD</span>
            <span aria-hidden="true">·</span>
            <span>PostgreSQL & pgvector</span>
            <span aria-hidden="true">·</span>
            <span>Gemini 3.8 Intelligence</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
