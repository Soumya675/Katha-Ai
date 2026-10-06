import React, { useState, useEffect } from 'react';
import {
  FileAudio,
  Search,
  Plus,
  Play,
  Download,
  Clock,
  Sparkles,
  BarChart3,
  Globe,
  Users,
  HardDrive,
  Trash2,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { Recording } from '../../server/whisper_platform.ts';

interface RecordingsLibraryProps {
  onOpenUpload: () => void;
  onSelectRecording: (id: string) => void;
}

export const RecordingsLibrary: React.FC<RecordingsLibraryProps> = ({
  onOpenUpload,
  onSelectRecording,
}) => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [recRes, anaRes] = await Promise.all([
        fetch('/api/v1/recordings'),
        fetch('/api/v1/analytics'),
      ]);
      const recData = await recRes.json();
      const anaData = await anaRes.json();
      setRecordings(recData);
      setAnalytics(anaData);
    } catch (e) {
      console.error('Failed to load library:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const filtered = recordings.filter((r) => {
    const matchesCat = filterCategory === 'all' || r.category === filterCategory;
    const matchesSearch =
      !search.trim() ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.language.toLowerCase().includes(search.toLowerCase()) ||
      r.summary.shortSummary.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Analytics Stats */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="rounded-2xl border border-slate-800 bg-[#0e1422] p-4 space-y-1">
            <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">
              Total Recordings
            </span>
            <p className="text-2xl font-bold text-white">{analytics.totalRecordings}</p>
            <p className="text-[11px] text-amber-400 font-mono">Multilingual Archive</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0e1422] p-4 space-y-1">
            <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">
              Transcribed Audio
            </span>
            <p className="text-2xl font-bold text-amber-400">
              {analytics.totalTranscriptionMinutes} <span className="text-xs text-slate-400">mins</span>
            </p>
            <p className="text-[11px] text-slate-400 font-mono">{analytics.wordCount.toLocaleString()} words</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0e1422] p-4 space-y-1">
            <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">
              Acoustic Accuracy
            </span>
            <p className="text-2xl font-bold text-emerald-400">
              94.2% <span className="text-xs font-mono text-emerald-300">(WER 5.8%)</span>
            </p>
            <p className="text-[11px] text-slate-400 font-mono">Odia & Hindi Fine-Tuned</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0e1422] p-4 space-y-1">
            <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">
              Processing Latency
            </span>
            <p className="text-2xl font-bold text-sky-400">
              {analytics.averageProcessingTimeSec}s <span className="text-xs text-slate-400">avg</span>
            </p>
            <p className="text-[11px] text-slate-400 font-mono">NVIDIA CUDA GPU Pool</p>
          </div>
        </div>
      )}

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Recordings & Transcripts Library</h2>
          <p className="text-xs text-slate-400">
            Search, filter, replay, and run AI analysis across all audio and video sessions
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs hover:brightness-110 shadow-md shadow-amber-500/20"
        >
          <Plus className="h-4 w-4" />
          <span>New Audio / Video Session</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transcripts, topics, keywords, decisions, speakers..."
            className="w-full rounded-xl border border-slate-800 bg-[#0e1422] py-2.5 pl-10 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          {[
            { id: 'all', label: 'All Sessions' },
            { id: 'meeting', label: '🤝 Meetings' },
            { id: 'interview', label: '🎯 Interviews' },
            { id: 'lecture', label: '🎓 Lectures' },
            { id: 'content', label: '🎬 Creators' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recordings Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-[#0e1422] p-12 text-center text-slate-400 space-y-3">
          <FileAudio className="h-10 w-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold">No recordings found</p>
          <p className="text-xs text-slate-500">Upload an audio or video file to start processing.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((rec) => (
            <div
              key={rec.id}
              onClick={() => onSelectRecording(rec.id)}
              className="group cursor-pointer rounded-2xl border border-slate-800 bg-[#0e1422] p-5 hover:border-amber-400/80 hover:bg-[#111827] transition-all space-y-3.5 shadow-lg"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] text-amber-300 font-mono uppercase">
                      {rec.category}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(rec.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                    {rec.title}
                  </h3>
                </div>

                <span className="flex items-center gap-1 font-mono text-xs text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                  <Clock className="h-3 w-3 text-amber-400" />
                  {formatSeconds(rec.duration)}
                </span>
              </div>

              {/* Summary Snippet */}
              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                {rec.summary.shortSummary}
              </p>

              {/* Speakers & Metadata */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3 text-[11px] text-slate-400 font-mono">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-slate-500" />
                  <span>{rec.speakers.map((s) => s.name.split(' ')[0]).join(', ')}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">WER: 5.8%</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Open Studio <ExternalLink className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
