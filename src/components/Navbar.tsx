import React from 'react';
import { Mic, Activity, User, ShieldCheck, Upload, Radio } from 'lucide-react';

interface NavbarProps {
  activeTab: 'studio' | 'recordings' | 'voice' | 'flow' | 'workflows' | 'rag' | 'memory' | 'admin' | 'architecture';
  setActiveTab: (tab: 'studio' | 'recordings' | 'voice' | 'flow' | 'workflows' | 'rag' | 'memory' | 'admin' | 'architecture') => void;
  onOpenQuickVoice: () => void;
  onOpenUpload?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenQuickVoice, onOpenUpload }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-[#0b0f17]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('studio')}
            className="flex items-center gap-2.5 text-left focus:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-bold shadow-md shadow-amber-500/10">
              <span className="text-base tracking-tighter">क</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-white hover:text-amber-400 transition-colors">
                  KathaAI
                </span>
                <span className="rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 text-[9px] text-amber-300 font-mono">
                  WHISPER ASR
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-none hidden sm:block">
                Voice Intelligence Platform
              </p>
            </div>
          </button>
        </div>

        {/* Navigation links */}
        <nav className="hidden lg:flex items-center gap-5 text-xs font-medium">
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex items-center gap-1.5 transition-colors pb-1 border-b-2 ${
              activeTab === 'studio'
                ? 'text-amber-400 border-amber-400 font-semibold'
                : 'text-slate-300 border-transparent hover:text-white'
            }`}
          >
            <span>🎙️</span>
            <span>Speech to Text (ASR)</span>
          </button>

          <button
            onClick={() => setActiveTab('recordings')}
            className={`transition-colors pb-1 border-b-2 ${
              activeTab === 'recordings'
                ? 'text-amber-400 border-amber-400 font-semibold'
                : 'text-slate-300 border-transparent hover:text-white'
            }`}
          >
            Recordings
          </button>

          <button
            onClick={() => setActiveTab('voice')}
            className={`transition-colors pb-1 border-b-2 ${
              activeTab === 'voice'
                ? 'text-amber-400 border-amber-400 font-semibold'
                : 'text-slate-300 border-transparent hover:text-white'
            }`}
          >
            Live Voice
          </button>

          <button
            onClick={() => setActiveTab('flow')}
            className={`flex items-center gap-1 transition-colors pb-1 border-b-2 ${
              activeTab === 'flow'
                ? 'text-amber-400 border-amber-400 font-semibold'
                : 'text-slate-300 border-transparent hover:text-white'
            }`}
          >
            <span className="text-amber-400">⚡</span>
            <span>Wispr Flow</span>
          </button>

          <button
            onClick={() => setActiveTab('workflows')}
            className={`transition-colors pb-1 border-b-2 ${
              activeTab === 'workflows'
                ? 'text-amber-400 border-amber-400 font-semibold'
                : 'text-slate-300 border-transparent hover:text-white'
            }`}
          >
            Actions
          </button>

          <button
            onClick={() => setActiveTab('rag')}
            className={`transition-colors pb-1 border-b-2 ${
              activeTab === 'rag'
                ? 'text-amber-400 border-amber-400 font-semibold'
                : 'text-slate-300 border-transparent hover:text-white'
            }`}
          >
            RAG
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`transition-colors pb-1 border-b-2 ${
              activeTab === 'admin'
                ? 'text-amber-400 border-amber-400 font-semibold'
                : 'text-slate-300 border-transparent hover:text-white'
            }`}
          >
            Analytics
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`transition-colors pb-1 border-b-2 ${
              activeTab === 'architecture'
                ? 'text-amber-400 border-amber-400 font-semibold'
                : 'text-slate-300 border-transparent hover:text-white'
            }`}
          >
            Specs
          </button>
        </nav>

        {/* Right side: Upload / Record Action & User Profile */}
        <div className="flex items-center gap-3">
          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs hover:brightness-110 shadow-sm shadow-amber-500/20"
            >
              <Upload className="h-3.5 w-3.5 text-slate-950" />
              <span className="hidden sm:inline">Upload Audio</span>
            </button>
          )}

          <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-slate-200">
              <User className="h-4 w-4" />
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-medium text-slate-200 leading-tight">Soumya Parida</p>
              <p className="text-[10px] text-amber-400 font-mono">Lead Architect</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile nav bar for small screens */}
      <div className="flex lg:hidden items-center justify-around border-t border-slate-800/80 bg-[#0e131d] px-2 py-2 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('studio')}
          className={`px-2 py-1 whitespace-nowrap ${activeTab === 'studio' ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}
        >
          Studio
        </button>
        <button
          onClick={() => setActiveTab('recordings')}
          className={`px-2 py-1 whitespace-nowrap ${activeTab === 'recordings' ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}
        >
          Library
        </button>
        <button
          onClick={() => setActiveTab('voice')}
          className={`px-2 py-1 whitespace-nowrap ${activeTab === 'voice' ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}
        >
          Voice
        </button>
        <button
          onClick={() => setActiveTab('flow')}
          className={`px-2 py-1 whitespace-nowrap ${activeTab === 'flow' ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}
        >
          ⚡ Flow
        </button>
        <button
          onClick={() => setActiveTab('workflows')}
          className={`px-2 py-1 whitespace-nowrap ${activeTab === 'workflows' ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}
        >
          Actions
        </button>
        <button
          onClick={() => setActiveTab('rag')}
          className={`px-2 py-1 whitespace-nowrap ${activeTab === 'rag' ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}
        >
          RAG
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={`px-2 py-1 whitespace-nowrap ${activeTab === 'admin' ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}
        >
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('architecture')}
          className={`px-2 py-1 whitespace-nowrap ${activeTab === 'architecture' ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}
        >
          Specs
        </button>
      </div>
    </header>
  );
};
