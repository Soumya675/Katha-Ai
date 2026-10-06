import React, { useState } from 'react';
import {
  ConversationMessage,
  ToolCallProposal,
  ToolExecutionResult,
} from '../types/index.ts';
import {
  Volume2,
  VolumeX,
  CheckCircle2,
  XCircle,
  Edit3,
  Send,
  Layers,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Mail,
  Calendar,
  CloudSun,
  Bell,
  CheckSquare,
  Search,
  ExternalLink,
} from 'lucide-react';

interface ConversationViewProps {
  messages: ConversationMessage[];
  onConfirmTool: (proposalId: string, updatedArgs?: Record<string, unknown>) => void;
  onRejectTool: (proposalId: string) => void;
  onSendFeedback: (messageId: string, feedbackType: 'positive' | 'negative', correction?: string) => void;
  onPlayAudioUrl: (audioUrl: string) => void;
  currentlyPlayingAudioUrl?: string;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  messages,
  onConfirmTool,
  onRejectTool,
  onSendFeedback,
  onPlayAudioUrl,
  currentlyPlayingAudioUrl,
}) => {
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);
  const [editedParams, setEditedParams] = useState<Record<string, string>>({});
  const [selectedPipelineMessage, setSelectedPipelineMessage] = useState<ConversationMessage | null>(null);

  const handleStartEdit = (proposal: ToolCallProposal) => {
    setEditingProposalId(proposal.id);
    const initial: Record<string, string> = {};
    Object.entries(proposal.arguments).forEach(([k, v]) => {
      initial[k] = String(v ?? '');
    });
    setEditedParams(initial);
  };

  const handleSaveAndConfirm = (proposalId: string) => {
    onConfirmTool(proposalId, editedParams);
    setEditingProposalId(null);
  };

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
        <p className="text-sm font-medium text-slate-300">
          No active voice conversation yet
        </p>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Tap the voice sphere or select a quick action above to trigger Katha AI's multilingual voice-to-action engine.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {messages.map((msg) => {
        const isUser = msg.role === 'user';
        const isPlayingThis = currentlyPlayingAudioUrl === msg.audio_url;

        return (
          <div
            key={msg.id}
            className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} w-full animate-fade-in`}
          >
            {/* User Speech Message */}
            {isUser ? (
              <div className="max-w-2xl rounded-2xl rounded-tr-none bg-slate-800/90 border border-slate-700/80 px-4 py-3 text-slate-100 shadow-md">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-semibold text-amber-400">Soumya</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            ) : (
              /* Katha AI Assistant Message */
              <div className="w-full max-w-3xl rounded-2xl rounded-tl-none border border-slate-800 bg-[#0e1422] p-5 text-slate-100 shadow-lg">
                {/* Assistant header & language/intent tags */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500 text-slate-950 font-bold text-xs">
                      क
                    </div>
                    <span className="text-xs font-bold text-white">Katha AI</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Clean unboxed metadata tags */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-mono">
                    {msg.detected_language && (
                      <>
                        <span className="text-amber-400">
                          Lang: {msg.detected_language.toUpperCase()}
                        </span>
                        <span aria-hidden="true">·</span>
                      </>
                    )}
                    {msg.detected_intent && (
                      <>
                        <span className="text-cyan-400">
                          Intent: {msg.detected_intent.intent} ({Math.round(msg.detected_intent.confidence * 100)}%)
                        </span>
                        <span aria-hidden="true">·</span>
                      </>
                    )}
                    {msg.pipeline_stages && (
                      <button
                        onClick={() => setSelectedPipelineMessage(msg)}
                        className="flex items-center gap-1 text-slate-300 hover:text-amber-400 underline decoration-slate-600 underline-offset-2 transition-colors"
                      >
                        <Layers className="h-3 w-3" />
                        <span>13 Pipeline Stages</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Assistant spoken content */}
                <p className="text-sm sm:text-base leading-relaxed text-slate-200">
                  {msg.content}
                </p>

                {/* Audio playback CTA */}
                {msg.audio_url && (
                  <div className="mt-3 flex items-center gap-3 pt-2">
                    <button
                      onClick={() => onPlayAudioUrl(msg.audio_url!)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isPlayingThis
                          ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-400/40'
                          : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      {isPlayingThis ? (
                        <>
                          <VolumeX className="h-3.5 w-3.5" />
                          <span>Stop Voice</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-3.5 w-3.5" />
                          <span>Hear Katha Voice</span>
                        </>
                      )}
                    </button>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Natural Speech Synthesis
                    </span>
                  </div>
                )}

                {/* SENSITIVE TOOL PERMISSION CONFIRMATION CARD */}
                {msg.tool_proposal && (
                  <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                          Action Authorization Required
                        </h4>
                      </div>
                      <span className="text-[11px] text-amber-400/80 font-mono">
                        Tool: {msg.tool_proposal.tool_name}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 whitespace-pre-line mb-3">
                      {msg.tool_proposal.preview_text}
                    </p>

                    {/* Inline edit mode if clicked */}
                    {editingProposalId === msg.tool_proposal.id ? (
                      <div className="space-y-2 mb-3 bg-slate-900/90 p-3 rounded-lg border border-slate-700">
                        <p className="text-xs font-semibold text-slate-200">Edit Action Parameters:</p>
                        {Object.entries(editedParams).map(([key, val]) => (
                          <div key={key} className="flex flex-col text-xs">
                            <label className="text-[10px] text-slate-400 uppercase font-mono">{key}</label>
                            <input
                              type="text"
                              value={val}
                              onChange={(e) => setEditedParams({ ...editedParams, [key]: e.target.value })}
                              className="rounded border border-slate-600 bg-slate-800 px-2 py-1 text-slate-100 text-xs focus:outline-none focus:border-amber-400"
                            />
                          </div>
                        ))}
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleSaveAndConfirm(msg.tool_proposal!.id)}
                            className="px-3 py-1 rounded bg-amber-500 text-slate-950 font-semibold text-xs hover:bg-amber-400"
                          >
                            Save & Execute
                          </button>
                          <button
                            onClick={() => setEditingProposalId(null)}
                            className="px-2.5 py-1 rounded bg-slate-700 text-slate-300 text-xs hover:bg-slate-600"
                          >
                            Cancel Edit
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Permission action buttons */
                      msg.tool_proposal.permission_status === 'pending' && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            onClick={() => onConfirmTool(msg.tool_proposal!.id)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-colors shadow-sm"
                          >
                            <Send className="h-3 w-3" />
                            <span>Confirm & Send</span>
                          </button>

                          <button
                            onClick={() => handleStartEdit(msg.tool_proposal!)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-medium hover:bg-slate-700 transition-colors"
                          >
                            <Edit3 className="h-3 w-3" />
                            <span>Edit Parameters</span>
                          </button>

                          <button
                            onClick={() => onRejectTool(msg.tool_proposal!.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 text-rose-300 text-xs font-medium hover:bg-rose-950/40 hover:text-rose-200 transition-colors"
                          >
                            <XCircle className="h-3 w-3" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      )
                    )}

                    {/* Executed status receipt badge */}
                    {msg.tool_proposal.permission_status === 'executed' && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Action successfully approved and executed.</span>
                      </div>
                    )}
                    {msg.tool_proposal.permission_status === 'rejected' && (
                      <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
                        <XCircle className="h-4 w-4" />
                        <span>Action cancelled by user.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* EXECUTED TOOL RESULT RECEIPT */}
                {msg.tool_result && (
                  <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/80 p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-slate-200">
                        Execution Receipt ({msg.tool_result.tool_name})
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono ml-auto">
                        {new Date(msg.tool_result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mb-2">
                      {msg.tool_result.message}
                    </p>

                    <div className="rounded-lg bg-slate-950/60 p-2 font-mono text-[11px] text-slate-400 overflow-x-auto">
                      <pre>{JSON.stringify(msg.tool_result.output, null, 2)}</pre>
                    </div>
                  </div>
                )}

                {/* GROUNDED RAG CITATIONS */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-slate-800/80 pt-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                      <FileText className="h-3.5 w-3.5 text-amber-400" />
                      <span>Knowledge Base Sources & Citations</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {msg.citations.map((cite, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-slate-800 bg-slate-900/50 p-2.5 text-xs text-slate-300"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-amber-300 truncate max-w-sm">
                              {cite.document_title}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Match: {Math.round(cite.similarity_score * 100)}%
                            </span>
                          </div>
                          <p className="italic text-slate-400 line-clamp-2">
                            "{cite.snippet}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Data flywheel feedback footer */}
                <div className="mt-4 flex items-center justify-between border-t border-slate-800/60 pt-2 text-[11px] text-slate-500">
                  <span>Was this response helpful for Indian voice training?</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSendFeedback(msg.id, 'positive')}
                      className="p-1 hover:text-emerald-400 transition-colors"
                      title="Good response"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onSendFeedback(msg.id, 'negative')}
                      className="p-1 hover:text-rose-400 transition-colors"
                      title="Report issue"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Pipeline Stage Inspector Modal */}
      {selectedPipelineMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-[#0e1422] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-amber-400" />
                  Katha Voice-to-Action 13-Stage Pipeline
                </h3>
                <p className="text-xs text-slate-400">
                  Execution telemetry and stage latencies
                </p>
              </div>
              <button
                onClick={() => setSelectedPipelineMessage(null)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] space-y-2.5 overflow-y-auto pr-1">
              {selectedPipelineMessage.pipeline_stages?.map((stage, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500">{String(idx + 1).padStart(2, '0')}.</span>
                      <span className="font-semibold text-slate-200 uppercase tracking-wide">
                        {stage.stage.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {stage.status}
                      </span>
                    </div>
                    {stage.details && (
                      <p className="text-slate-400 pl-6 text-[11px]">{stage.details}</p>
                    )}
                  </div>
                  <span className="font-mono text-amber-400 text-xs shrink-0">
                    {stage.duration_ms}ms
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
              <span className="text-xs text-slate-400 font-mono">
                Total Pipeline Duration:{' '}
                {selectedPipelineMessage.pipeline_stages?.reduce((acc, s) => acc + s.duration_ms, 0)}ms
              </span>
              <button
                onClick={() => setSelectedPipelineMessage(null)}
                className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-semibold text-xs hover:bg-amber-400"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
