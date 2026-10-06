import React, { useState, useEffect } from 'react';
import { FileText, Upload, Search, Database, Layers, CheckCircle2, ChevronRight, Hash, ArrowUpRight } from 'lucide-react';
import { RAGDocument, MessageCitation } from '../types/index.ts';

export const DocumentRAGView: React.FC = () => {
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<RAGDocument | null>(null);
  const [query, setQuery] = useState('');
  const [citations, setCitations] = useState<MessageCitation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocType, setNewDocType] = useState<RAGDocument['file_type']>('txt');
  const [newDocContent, setNewDocContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const fetchDocs = async () => {
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      setDocuments(data);
      if (data.length > 0 && !selectedDoc) {
        setSelectedDoc(data[0]);
      }
    } catch (err) {
      console.error('Error fetching docs:', err);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), topK: 3 }),
      });
      const data = await res.json();
      setCitations(data);
    } catch (err) {
      console.error('RAG query error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim() || !newDocContent.trim()) return;
    setIsUploading(true);
    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newDocTitle.trim(),
          fileType: newDocType,
          content: newDocContent.trim(),
        }),
      });
      const created = await res.json();
      setDocuments((prev) => [created, ...prev]);
      setSelectedDoc(created);
      setShowUploadModal(false);
      setNewDocTitle('');
      setNewDocContent('');
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Database className="h-5 w-5 text-amber-400" />
            Retrieval-Augmented Generation (RAG) Workspace
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Multilingual semantic search, document chunking, vector embeddings, and verified citation attribution.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* RAG Query Sandbox */}
      <div className="rounded-2xl border border-slate-800 bg-[#0e1422] p-5 shadow-lg">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Test Semantic Retrieval & Citations
        </h3>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 'What is the bi-weekly review schedule with Rahul?' or 'AI safety and PII policy'"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 disabled:opacity-50 transition-colors"
          >
            {isSearching ? 'Searching...' : 'Run Query'}
          </button>
        </form>

        {/* Citations Results */}
        {citations.length > 0 && (
          <div className="mt-4 space-y-2.5 border-t border-slate-800/80 pt-3 animate-fade-in">
            <p className="text-xs font-semibold text-amber-300">
              Retrieved {citations.length} Grounded Source Passages:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {citations.map((cite, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1.5">
                      <span className="font-semibold text-slate-200 truncate">{cite.document_title}</span>
                      <span className="text-amber-400">
                        {Math.round(cite.similarity_score * 100)}% Match
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 italic line-clamp-4">
                      "{cite.snippet}"
                    </p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>Chunk: {cite.chunk_id}</span>
                    <span className="text-emerald-400">Verified Citation</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Document List & Chunk Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Document List */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Uploaded Documents ({documents.length})
          </h3>

          {documents.map((doc) => {
            const isSelected = selectedDoc?.id === doc.id;
            return (
              <button
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 text-white'
                    : 'border-slate-800 bg-[#0e1422] text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-amber-400'}`}>
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold truncate">{doc.title}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-mono">{doc.file_type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                    <span>{doc.chunk_count} Chunks</span>
                    <span aria-hidden="true">·</span>
                    <span>{(doc.size_bytes / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Chunk Explorer */}
        <div className="lg:col-span-2 space-y-4">
          {selectedDoc ? (
            <div className="rounded-2xl border border-slate-800 bg-[#0e1422] p-6 shadow-md space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="h-4 w-4 text-amber-400" />
                    <span>{selectedDoc.title}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">{selectedDoc.summary}</p>
                </div>
                <span className="text-xs text-amber-400 font-mono">
                  {selectedDoc.chunks.length} Total Chunks
                </span>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {selectedDoc.chunks.map((chunk) => (
                  <div
                    key={chunk.id}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] text-slate-400 border-b border-slate-800/60 pb-1.5">
                      <span className="text-amber-400">Chunk #{chunk.chunk_index + 1}</span>
                      <span>{chunk.token_count} Tokens · vector(768)</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed">
                      {chunk.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
              Select a document to inspect its parsed chunks.
            </div>
          )}
        </div>
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-[#0e1422] p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Upload New Knowledge Document</h3>

            <form onSubmit={handleUpload} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300">Document Title</label>
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="e.g. Q4 Strategy or Enterprise HR Guidelines"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">File Type Format</label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                >
                  <option value="txt">Text (.txt / .md)</option>
                  <option value="pdf">PDF Document (.pdf extract)</option>
                  <option value="docx">Word Document (.docx extract)</option>
                  <option value="csv">Structured Data (.csv)</option>
                  <option value="web">Web Document URL Content</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Content Text</label>
                <textarea
                  rows={6}
                  value={newDocContent}
                  onChange={(e) => setNewDocContent(e.target.value)}
                  placeholder="Paste document content to be parsed and chunked..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 disabled:opacity-50"
                >
                  {isUploading ? 'Chunking & Indexing...' : 'Parse & Embed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
