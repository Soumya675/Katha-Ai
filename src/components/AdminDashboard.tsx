import React, { useState, useEffect } from 'react';
import {
  Activity,
  Layers,
  Cpu,
  BarChart2,
  Users,
  Clock,
  CheckCircle2,
  FileCheck,
  TrendingUp,
  Award,
  Zap,
} from 'lucide-react';
import { ModelBenchmark, PlanConfig } from '../types/index.ts';

interface AdminData {
  benchmarks: ModelBenchmark[];
  plans: PlanConfig[];
  flywheel: any[];
  stats: {
    totalUsers: number;
    activeUsersToday: number;
    voiceMinutesProcessed: number;
    messagesProcessed: number;
    averageLatencyMs: number;
    asrAccuracy: number;
    toolSuccessRate: number;
    gpuUtilization: string;
    languageDistribution: { name: string; percentage: number }[];
    systemHealth: string;
  };
}

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<AdminData | null>(null);
  const [activeTab, setActiveTab] = useState<'benchmarks' | 'flywheel' | 'pricing'>('benchmarks');

  useEffect(() => {
    fetch('/api/admin/metrics')
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((err) => console.error('Failed to load admin metrics:', err));
  }, []);

  if (!data) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 font-mono">
        Loading Katha evaluation telemetry and system health...
      </div>
    );
  }

  const { stats, benchmarks, plans, flywheel } = data;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-amber-400" />
            Katha AI Model Evaluation & Administration Console
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time inference telemetry, ASR/Intent/RAG benchmarks, proprietary model roadmap, and data flywheel curation.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono self-start sm:self-auto">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{stats.systemHealth}</span>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#0e1422] p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Voice Minutes Today</span>
            <Clock className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono tabular-nums">
            {stats.voiceMinutesProcessed.toLocaleString()}
          </p>
          <span className="text-[10px] text-emerald-400 font-mono mt-1 block">
            +18.4% WoW speech traffic
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0e1422] p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Active Users</span>
            <Users className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono tabular-nums">
            {stats.activeUsersToday.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
            {stats.totalUsers.toLocaleString()} Total registered
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0e1422] p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Mean Response Latency</span>
            <Zap className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono tabular-nums">
            {stats.averageLatencyMs}ms
          </p>
          <span className="text-[10px] text-emerald-400 font-mono mt-1 block">
            VAD to First Audio Byte
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0e1422] p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Tool Success Rate</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono tabular-nums">
            {stats.toolSuccessRate}%
          </p>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">
            GPU Utilization: {stats.gpuUtilization}
          </span>
        </div>
      </div>

      {/* Language Breakdown Bar */}
      <div className="rounded-2xl border border-slate-800 bg-[#0e1422] p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Multilingual Indian Speech Traffic Distribution
        </h3>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-800">
          <div style={{ width: '38%' }} className="bg-amber-500" title="Hindi (38%)" />
          <div style={{ width: '26%' }} className="bg-blue-500" title="English (26%)" />
          <div style={{ width: '18%' }} className="bg-emerald-500" title="Hinglish (18%)" />
          <div style={{ width: '12%' }} className="bg-orange-500" title="Odia & Odianglish (12%)" />
          <div style={{ width: '6%' }} className="bg-purple-500" title="Marathi & Gujarati (6%)" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
          {stats.languageDistribution.map((l, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  idx === 0
                    ? 'bg-amber-500'
                    : idx === 1
                    ? 'bg-blue-500'
                    : idx === 2
                    ? 'bg-emerald-500'
                    : idx === 3
                    ? 'bg-orange-500'
                    : 'bg-purple-500'
                }`}
              />
              <span>
                {l.name}: <strong className="text-slate-200">{l.percentage}%</strong>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex border-b border-slate-800 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('benchmarks')}
          className={`pb-2 border-b-2 transition-colors ${
            activeTab === 'benchmarks'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Model Stack & Benchmarks
        </button>
        <button
          onClick={() => setActiveTab('flywheel')}
          className={`pb-2 border-b-2 transition-colors ${
            activeTab === 'flywheel'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Data Flywheel Curation ({flywheel.length})
        </button>
        <button
          onClick={() => setActiveTab('pricing')}
          className={`pb-2 border-b-2 transition-colors ${
            activeTab === 'pricing'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Plan Tiers & Monetization
        </button>
      </div>

      {/* Tab 1: Model Benchmarks Table */}
      {activeTab === 'benchmarks' && (
        <div className="space-y-4 animate-fade-in">
          <div className="rounded-2xl border border-slate-800 bg-[#0e1422] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-mono">
                  <tr>
                    <th className="py-3 px-4">Model & Architecture</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Status & Origin</th>
                    <th className="py-3 px-4">Key Metrics</th>
                    <th className="py-3 px-4 text-right">Inference Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {benchmarks.map((bm, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-100">{bm.model_name}</div>
                        <div className="text-[11px] text-slate-400 max-w-sm mt-0.5">{bm.notes}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-amber-400">{bm.category}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              bm.status === 'Training'
                                ? 'bg-amber-400 animate-pulse'
                                : bm.status === 'Production Ready'
                                ? 'bg-emerald-400'
                                : bm.status === 'Research Prototype'
                                ? 'bg-purple-400'
                                : 'bg-blue-400'
                            }`}
                          />
                          <span className="text-slate-300 font-medium">{bm.status}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {bm.is_proprietary ? 'Proprietary Katha Model' : 'Open / External Base'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <div className="space-y-0.5">
                          {Object.entries(bm.metrics).map(([k, v]) => (
                            <div key={k} className="text-slate-300">
                              <span className="text-slate-500">{k}:</span> <strong>{String(v)}</strong>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300 tabular-nums">
                        {bm.latency_ms}ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Data Flywheel Curation */}
      {activeTab === 'flywheel' && (
        <div className="space-y-4 animate-fade-in">
          <div className="rounded-xl border border-slate-800 bg-[#0e1422] p-4 text-xs text-slate-300">
            <h4 className="text-sm font-semibold text-white mb-1">
              Katha Multilingual Data Flywheel Pipeline
            </h4>
            <p>
              User interaction → Explicit user feedback → Human review → Anonymization & PII scrubbing → Model evaluation → Indic fine-tuning dataset generation.
            </p>
          </div>

          <div className="space-y-3">
            {flywheel.map((item: any) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-800 bg-[#0e1422] p-4 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-amber-400 uppercase font-semibold">
                      {item.detected_language}
                    </span>
                    <span className="text-slate-500">·</span>
                    <span className="font-mono text-cyan-400">
                      {item.detected_intent}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <FileCheck className="h-3 w-3" />
                    Anonymized & Curated for Training
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Input:</span>
                  <p className="text-slate-200 font-medium italic">"{item.user_input}"</p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Response:</span>
                  <p className="text-slate-400">{item.generated_response}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Plans & Pricing */}
      {activeTab === 'pricing' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
          {plans.map((p) => (
            <div
              key={p.tier}
              className={`rounded-2xl border p-5 flex flex-col justify-between ${
                p.tier === 'PRO'
                  ? 'border-amber-500 bg-[#0f1728] shadow-lg shadow-amber-500/5'
                  : 'border-slate-800 bg-[#0e1422]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-400 font-mono">{p.tier}</span>
                  {p.tier === 'PRO' && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                      Popular
                    </span>
                  )}
                </div>

                <h4 className="text-base font-bold text-white">{p.name}</h4>
                <div className="mt-2 mb-4">
                  <span className="text-2xl font-bold text-white font-mono">
                    ₹{p.price_inr.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400"> / {p.billing_cycle}</span>
                </div>

                <p className="text-xs text-slate-400 mb-3 font-mono">
                  {p.voice_minutes_limit.toLocaleString()} Voice Mins · {p.document_storage_mb}MB RAG
                </p>

                <ul className="space-y-2 border-t border-slate-800/80 pt-3 text-xs text-slate-300">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                className={`mt-6 w-full py-2 rounded-xl text-xs font-bold transition-colors ${
                  p.tier === 'PRO'
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {p.tier === 'PRO' ? 'Current Active Tier' : 'Configure Tier'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
