import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Trash2, CheckCircle2, XCircle, Info, Lock } from 'lucide-react';
import { UserMemoryItem } from '../types/index.ts';

export const MemoryView: React.FC = () => {
  const [memories, setMemories] = useState<UserMemoryItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState<UserMemoryItem['category']>('preference');

  const fetchMemories = async () => {
    try {
      const res = await fetch('/api/memory');
      const data = await res.json();
      setMemories(data);
    } catch (err) {
      console.error('Error fetching memories:', err);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const handleToggleConsent = async (id: string, currentConsented: boolean) => {
    try {
      await fetch(`/api/memory/${id}/consent`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consented: !currentConsented }),
      });
      setMemories((prev) =>
        prev.map((m) => (m.id === id ? { ...m, user_consented: !currentConsented } : m))
      );
    } catch (err) {
      console.error('Consent update error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/memory/${id}`, { method: 'DELETE' });
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error('Delete memory error:', err);
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;
    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newCategory,
          key: newKey.trim(),
          value: newValue.trim(),
          user_consented: true,
        }),
      });
      const created = await res.json();
      setMemories((prev) => [...prev, created]);
      setShowAddModal(false);
      setNewKey('');
      setNewValue('');
    } catch (err) {
      console.error('Add memory error:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-400" />
            Katha Personal Memory & Consent Vault
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Privacy-first long-term memory stored in PostgreSQL with pgvector. Information is only retrieved with explicit user consent.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Approved Memory</span>
        </button>
      </div>

      {/* Privacy Notice Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-[#0e1422] p-4 text-xs text-slate-300">
        <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <p leading-relaxed>
          <strong className="text-white">Strict Privacy Guarantee:</strong> Katha AI never saves sensitive or personal conversation details automatically. Every memory below represents explicit user-approved facts and preferences that personalize your multilingual responses.
        </p>
      </div>

      {/* Memory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {memories.map((mem) => (
          <div
            key={mem.id}
            className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#0e1422] p-4 shadow-sm hover:border-slate-700 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400">
                  {mem.category.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Confidence: {Math.round(mem.confidence * 100)}%
                </span>
              </div>

              <h4 className="text-sm font-semibold text-white mb-1">
                {mem.key.replace(/_/g, ' ')}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                "{mem.value}"
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              {/* User Consent Toggle */}
              <button
                onClick={() => handleToggleConsent(mem.id, mem.user_consented)}
                className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                  mem.user_consented
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {mem.user_consented ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Consented for AI Context</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3" />
                    <span>Consent Revoked (Excluded)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleDelete(mem.id)}
                className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                title="Delete memory permanently"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0e1422] p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Add Consented Memory Item</h3>

            <form onSubmit={handleAddMemory} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                >
                  <option value="preference">User Preference</option>
                  <option value="work_context">Work & Role Context</option>
                  <option value="communication_style">Communication Style</option>
                  <option value="personal_fact">Personal Fact</option>
                  <option value="saved_info">Saved Information</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Key Name</label>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="e.g. preferred_meeting_platform"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Value / Description</label>
                <textarea
                  rows={3}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="e.g. Prefers Google Meet for morning standups, phone calls for critical alerts."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400"
                >
                  Save with Consent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
