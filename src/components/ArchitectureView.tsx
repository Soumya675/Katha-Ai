import React, { useState } from 'react';
import { Layers, Database, Cpu, Smartphone, Monitor, Server, GitBranch, Terminal, Shield, ArrowRight } from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'pipeline' | 'db' | 'backend' | 'ml' | 'platforms' | 'docker'>('pipeline');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Layers className="h-5 w-5 text-amber-400" />
          Katha AI Platform Architecture & System Specifications
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Complete engineering blueprint: End-to-end voice pipeline, PostgreSQL ER schema, ML training workflows, and multi-platform deployment.
        </p>
      </div>

      {/* Nav Tabs */}
      <div className="flex flex-wrap gap-2 text-xs font-medium">
        <button
          onClick={() => setActiveSection('pipeline')}
          className={`px-3 py-1.5 rounded-lg border transition-colors ${
            activeSection === 'pipeline'
              ? 'border-amber-400 bg-amber-500/10 text-amber-300 font-semibold'
              : 'border-slate-800 bg-[#0e1422] text-slate-400 hover:text-white'
          }`}
        >
          1. Core Voice Pipeline
        </button>
        <button
          onClick={() => setActiveSection('db')}
          className={`px-3 py-1.5 rounded-lg border transition-colors ${
            activeSection === 'db'
              ? 'border-amber-400 bg-amber-500/10 text-amber-300 font-semibold'
              : 'border-slate-800 bg-[#0e1422] text-slate-400 hover:text-white'
          }`}
        >
          2. Database & pgvector Schema
        </button>
        <button
          onClick={() => setActiveSection('backend')}
          className={`px-3 py-1.5 rounded-lg border transition-colors ${
            activeSection === 'backend'
              ? 'border-amber-400 bg-amber-500/10 text-amber-300 font-semibold'
              : 'border-slate-800 bg-[#0e1422] text-slate-400 hover:text-white'
          }`}
        >
          3. Backend Architecture
        </button>
        <button
          onClick={() => setActiveSection('ml')}
          className={`px-3 py-1.5 rounded-lg border transition-colors ${
            activeSection === 'ml'
              ? 'border-amber-400 bg-amber-500/10 text-amber-300 font-semibold'
              : 'border-slate-800 bg-[#0e1422] text-slate-400 hover:text-white'
          }`}
        >
          4. ML Training Pipeline
        </button>
        <button
          onClick={() => setActiveSection('platforms')}
          className={`px-3 py-1.5 rounded-lg border transition-colors ${
            activeSection === 'platforms'
              ? 'border-amber-400 bg-amber-500/10 text-amber-300 font-semibold'
              : 'border-slate-800 bg-[#0e1422] text-slate-400 hover:text-white'
          }`}
        >
          5. Mobile & Desktop (Ctrl+Space)
        </button>
        <button
          onClick={() => setActiveSection('docker')}
          className={`px-3 py-1.5 rounded-lg border transition-colors ${
            activeSection === 'docker'
              ? 'border-amber-400 bg-amber-500/10 text-amber-300 font-semibold'
              : 'border-slate-800 bg-[#0e1422] text-slate-400 hover:text-white'
          }`}
        >
          6. Docker & Deploy
        </button>
      </div>

      {/* 1. Core Voice Pipeline */}
      {activeSection === 'pipeline' && (
        <div className="space-y-4 animate-fade-in">
          <div className="rounded-2xl border border-slate-800 bg-[#0e1422] p-6">
            <h3 className="text-sm font-bold text-white mb-2">
              Speak → Understand → Reason → Generate → Act Flow
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Low-latency Indian speech recognition pipeline with streaming audio chunks, multilingual code-switching, and permission gates.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
              {[
                { step: '01', title: 'User Microphone', desc: 'Audio capture at 16kHz mono, Web Audio API / MediaRecorder' },
                { step: '02', title: 'Audio Preprocessing', desc: 'Noise-gating, high-pass normalization, dynamic gain control' },
                { step: '03', title: 'Silero VAD', desc: 'Voice activity detection, silence trimming, speech boundary marking' },
                { step: '04', title: 'Speech-to-Text (ASR)', desc: 'Whisper Large v3 / Future Katha ASR (Odia, Hindi, Indian dialects)' },
                { step: '05', title: 'Language Detection', desc: 'Identifies English, Hindi, Odia, Bengali, Tamil, Telugu, Hinglish, Odianglish' },
                { step: '06', title: 'Katha Intent Engine', desc: '19+ structured intents with confidence score and extracted entity slots' },
                { step: '07', title: 'Context & Memory', desc: 'Short-term dialogue context + long-term user consented memory (pgvector)' },
                { step: '08', title: 'RAG Knowledge Retrieval', desc: 'BGE-M3 embeddings, vector search, cross-lingual reranker & citations' },
                { step: '09', title: 'LLM Reasoning Brain', desc: 'Gemini 3.8 Flash / configurable provider for Indian code-switching reasoning' },
                { step: '10', title: 'Tool Selection', desc: 'Determines required integration: Email, Calendar, Tasks, Reminders, Search' },
                { step: '11', title: 'ToolPermissionManager', desc: 'Strict permission gateway: prompts [Send] [Edit] [Cancel] for sensitive actions' },
                { step: '12', title: 'Action Execution', desc: 'Executes verified API actions with full audit receipt recording' },
                { step: '13', title: 'Text-to-Speech (TTS)', desc: 'Gemini 3.8 Flash Lite TTS / Future Katha Voice with native Indian phonetics' },
                { step: '14', title: 'Voice Playback', desc: 'Audio playback to user with real-time waveform synchrony' },
              ].map((item) => (
                <div key={item.step} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-amber-400">
                    <span className="font-bold">STAGE {item.step}</span>
                    <ArrowRight className="h-3 w-3 text-slate-500" />
                  </div>
                  <h4 className="font-semibold text-slate-200">{item.title}</h4>
                  <p className="text-[11px] text-slate-400 font-sans">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Database Schema */}
      {activeSection === 'db' && (
        <div className="space-y-4 animate-fade-in">
          <div className="rounded-2xl border border-slate-800 bg-[#0e1422] p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="h-4 w-4 text-amber-400" />
                PostgreSQL Schema with pgvector
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Relational entity structure with foreign keys, IVFFlat vector indexing for 768-dim embeddings, and audit trails.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
                <h4 className="font-mono text-amber-400 font-semibold mb-2">User & Dialogue Tables</h4>
                <ul className="space-y-1 text-slate-300 font-mono text-[11px]">
                  <li>• users (id, email, full_name, plan_tier)</li>
                  <li>• profiles (voice_speed, persona, timezone)</li>
                  <li>• conversations (status, channel, timestamps)</li>
                  <li>• messages (role, content, intent, entities)</li>
                  <li>• audio_sessions (vad_confidence, duration)</li>
                  <li>• transcriptions (asr_engine, raw, norm)</li>
                </ul>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
                <h4 className="font-mono text-amber-400 font-semibold mb-2">Memory & RAG (pgvector)</h4>
                <ul className="space-y-1 text-slate-300 font-mono text-[11px]">
                  <li>• user_memory (category, key, vector(768))</li>
                  <li>• documents (title, file_type, size, summary)</li>
                  <li>• document_chunks (doc_id, vector(768))</li>
                  <li>• ivfflat cosine index (lists = 100)</li>
                  <li>• languages (supported dialect catalog)</li>
                </ul>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
                <h4 className="font-mono text-amber-400 font-semibold mb-2">Tools, Safety & Flywheel</h4>
                <ul className="space-y-1 text-slate-300 font-mono text-[11px]">
                  <li>• tools (name, is_sensitive, required_args)</li>
                  <li>• tool_permissions (authorization policies)</li>
                  <li>• tool_calls (message_id, audit status)</li>
                  <li>• tasks (due_date, priority, status)</li>
                  <li>• feedback (flywheel training curation)</li>
                  <li>• model_evaluations (benchmarks & WER)</li>
                </ul>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950 p-4 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-72 border border-slate-800">
              <pre>{`-- Live pgvector query example for Katha semantic memory
SELECT 
    memory_key, 
    memory_value, 
    1 - (embedding <=> $1::vector) AS cosine_similarity
FROM user_memory
WHERE user_id = $2 
  AND user_consented = TRUE
ORDER BY embedding <=> $1::vector
LIMIT 5;`}</pre>
            </div>
          </div>
        </div>
      )}

      {/* 3. Backend Architecture */}
      {activeSection === 'backend' && (
        <div className="space-y-4 animate-fade-in">
          <div className="rounded-2xl border border-slate-800 bg-[#0e1422] p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="h-4 w-4 text-amber-400" />
              Python FastAPI & Full-Stack Backend Directory Structure
            </h3>
            <p className="text-xs text-slate-400">
              Clean modular organization separating ASR, language detection, intent engines, memory vaults, and agent permission safety.
            </p>

            <div className="rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-300 overflow-x-auto border border-slate-800">
              <pre>{`/backend
├── api/                  # REST and WebSocket router endpoints
│   ├── v1/
│   │   ├── voice.py      # /api/v1/voice/transcribe, /api/v1/voice/pipeline
│   │   ├── chat.py       # Conversational reasoning endpoints
│   │   ├── documents.py  # RAG ingestion, PDF/DOCX parsing
│   │   ├── tools.py      # Tool execution & permissions
│   │   └── admin.py      # System telemetry, evaluation metrics
├── auth/                 # JWT & OAuth authorization
├── speech/               # Audio preprocessing & VAD
│   ├── vad.py            # Silero VAD streaming chunk analyzer
│   └── normalizer.py     # 16kHz audio sample rate adapter
├── asr/                  # ASR Provider abstraction
│   ├── base.py           # Abstract ASR Provider interface
│   ├── whisper_asr.py    # Whisper Large v3 integration
│   └── katha_asr.py      # Future Katha ASR proprietary model hook
├── intent/               # Intent Engine
│   ├── engine.py         # LLM + Rule-based intent classifier
│   └── classifier.py     # IndicBERT / DistilBERT Indian classifier
├── language/             # Multilingual detection
│   └── detector.py       # Script analysis & code-switching detection
├── llm/                  # LLM Provider abstraction
│   ├── base.py           # LLMProvider interface
│   ├── gemini.py         # Gemini 3.8 Flash provider
│   └── local_llm.py      # vLLM / Ollama local open weights
├── memory/               # Short-term dialogue context & pgvector memory
├── rag/                  # Chunking, BGE-M3 embeddings & reranker
├── tools/                # Email, Calendar, Reminder, Weather tools
├── permissions/          # ToolPermissionManager confirmation gate
└── tts/                  # Gemini 3.8 Flash Lite TTS & Future Katha Voice`}</pre>
            </div>
          </div>
        </div>
      )}

      {/* 4. ML Pipeline */}
      {activeSection === 'ml' && (
        <div className="space-y-4 animate-fade-in">
          <div className="rounded-2xl border border-slate-800 bg-[#0e1422] p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="h-4 w-4 text-amber-400" />
              Katha ML Training Architecture & Proprietary Model Roadmap
            </h3>
            <p className="text-xs text-slate-400">
              Future-ready machine learning pipeline for training proprietary Indian speech models (Katha ASR, Katha Intent, Katha LLM, Katha Voice).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
                <h4 className="font-semibold text-amber-400">ML Training Stages</h4>
                <div className="space-y-1 font-mono text-[11px] text-slate-300">
                  <p>1. Data Collection (10,000+ hours Indian dialects)</p>
                  <p>2. Data Cleaning & PII Scrubbing (DPDP compliant)</p>
                  <p>3. Phonetic Annotation (Odia, Hindi, Hinglish)</p>
                  <p>4. Train/Val/Test Split (80/10/10 stratified)</p>
                  <p>5. Distributed GPU Training (PyTorch, DeepSpeed)</p>
                  <p>6. Evaluation (WER, CER, Intent F1, MOS)</p>
                  <p>7. Model Registry (MLflow / Weights & Biases)</p>
                  <p>8. Quantization & Deployment (TensorRT-LLM, ONNX)</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
                <h4 className="font-semibold text-cyan-400">Proprietary Katha Models (Rule #39 Compliant)</h4>
                <div className="space-y-2 text-slate-300">
                  <div>
                    <span className="font-mono text-white">Katha ASR:</span>
                    <p className="text-[11px] text-slate-400">Status: Training (Target WER &lt; 6% for Indian mixed speech). Fallback: Whisper.</p>
                  </div>
                  <div>
                    <span className="font-mono text-white">Katha Intent:</span>
                    <p className="text-[11px] text-slate-400">Status: IndicBERT-X Fine-tuned (96.8% F1). Fallback: LLM + Rules.</p>
                  </div>
                  <div>
                    <span className="font-mono text-white">Katha Voice:</span>
                    <p className="text-[11px] text-slate-400">Status: Research Prototype for native Odia/Hindi phonetics. Fallback: Gemini 3.8 TTS.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Platforms */}
      {activeSection === 'platforms' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-[#0e1422] p-5 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-400">
                <Smartphone className="h-4 w-4" />
                <h4 className="font-bold text-white">Flutter Mobile (Android/iOS)</h4>
              </div>
              <p className="text-slate-400">
                Native Flutter voice app utilizing platform audio recorders, background voice wake word, push notification reminders, and offline cache.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0e1422] p-5 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-400">
                <Monitor className="h-4 w-4" />
                <h4 className="font-bold text-white">Desktop App (Ctrl + Space)</h4>
              </div>
              <p className="text-slate-400">
                Tauri / Electron global keyboard shortcut: Press <strong className="text-white font-mono bg-slate-800 px-1 py-0.5 rounded">Ctrl + Space</strong> to summon Katha voice HUD floating above any application.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0e1422] p-5 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-400">
                <Terminal className="h-4 w-4" />
                <h4 className="font-bold text-white">Chrome / Edge Extension</h4>
              </div>
              <p className="text-slate-400">
                Select any text on the web → Ask Katha → Summarize in Hindi/Odia, draft reply email, or execute browser tasks.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 6. Docker & Deploy */}
      {activeSection === 'docker' && (
        <div className="space-y-4 animate-fade-in">
          <div className="rounded-2xl border border-slate-800 bg-[#0e1422] p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="h-4 w-4 text-amber-400" />
              Docker Compose Multi-Container Orchestration
            </h3>
            <p className="text-xs text-slate-400">
              Production container configuration for frontend, backend, PostgreSQL with pgvector, Redis broker, and Celery background workers.
            </p>

            <div className="rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-300 overflow-x-auto border border-slate-800">
              <pre>{`version: '3.8'

services:
  katha-frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - GEMINI_API_KEY=\${GEMINI_API_KEY}
    depends_on:
      - postgres
      - redis

  postgres:
    image: pgvector/pgvector:pg16
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=katha_ai_db
      - POSTGRES_USER=katha_admin
      - POSTGRES_PASSWORD=\${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  celery-worker:
    build: .
    command: celery -A tasks worker --loglevel=info
    environment:
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis
      - postgres

volumes:
  pgdata:`}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
