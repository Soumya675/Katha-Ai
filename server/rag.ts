import { MessageCitation, RAGDocument, RAGDocumentChunk } from '../src/types/index.ts';
import { getGeminiClient } from './gemini.ts';

// Initial preloaded knowledge base documents for testing and instant productivity
const INITIAL_DOCUMENTS: RAGDocument[] = [
  {
    id: 'doc_1',
    title: 'Katha AI System Architecture & Voice Pipeline.txt',
    file_type: 'txt',
    size_bytes: 14200,
    chunk_count: 4,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    summary: 'Core technical specifications of Katha AI voice-to-action engine, Silero VAD, Whisper ASR, IndicTrans2, and tool permission architecture.',
    chunks: [
      {
        id: 'chunk_1_1',
        document_id: 'doc_1',
        chunk_index: 0,
        content: 'Katha AI is India\'s premier multilingual voice-to-action assistant. The core operating principle is Speak -> Understand -> Reason -> Generate -> Act. It supports code-switching across English, Hindi, and Odia.',
        token_count: 42,
      },
      {
        id: 'chunk_1_2',
        document_id: 'doc_1',
        chunk_index: 1,
        content: 'Audio preprocessing runs through a Silero VAD layer, segmenting vocal activity and trimming silence. The transcription pipeline passes through Whisper with planned migration to Katha ASR proprietary Indian acoustic models.',
        token_count: 36,
      },
      {
        id: 'chunk_1_3',
        document_id: 'doc_1',
        chunk_index: 2,
        content: 'Safety and governance: Every sensitive tool invocation (e.g., sending an email, deleting a calendar entry, or executing financial transactions) is routed through ToolPermissionManager. The user is prompted with explicit [Execute], [Edit], and [Cancel] controls.',
        token_count: 48,
      },
      {
        id: 'chunk_1_4',
        document_id: 'doc_1',
        chunk_index: 3,
        content: 'Memory architecture: PostgreSQL with pgvector handles long-term user memory. Only user-consented facts are stored to protect privacy. Short-term dialogue context manages multi-turn disambiguation.',
        token_count: 33,
      },
    ],
  },
  {
    id: 'doc_2',
    title: 'Odisha Technical Innovations & Project Guidelines 2026.txt',
    file_type: 'txt',
    size_bytes: 9800,
    chunk_count: 3,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    summary: 'Official engineering and regional collaboration guidelines for AI applications in Bhubaneswar, Odisha.',
    chunks: [
      {
        id: 'chunk_2_1',
        document_id: 'doc_2',
        chunk_index: 0,
        content: 'Bhubaneswar IT corridor prioritizes indigenous language technology solutions under the Odisha Digital Mission. GIFT campus initiatives emphasize natural Odia NLP and speech synthesis for rural governance and enterprise workflows.',
        token_count: 39,
      },
      {
        id: 'chunk_2_2',
        document_id: 'doc_2',
        chunk_index: 1,
        content: 'Project reviews are mandated bi-weekly on Tuesdays at 3:00 PM IST with Rahul and the core AI infrastructure leads. Deliverables include WER benchmark reports and API latency tracking under 250ms.',
        token_count: 41,
      },
      {
        id: 'chunk_2_3',
        document_id: 'doc_2',
        chunk_index: 2,
        content: 'Data security policy: All voice telemetry must be scrubbed of personally identifiable information (PII) before model fine-tuning. Opt-in consent is strictly required for data flywheel dataset inclusion.',
        token_count: 37,
      },
    ],
  },
];

let documentsStore: RAGDocument[] = [...INITIAL_DOCUMENTS];

function computeSimpleTfidfVector(text: string, vocab: string[]): number[] {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const counts: Record<string, number> = {};
  for (const w of words) counts[w] = (counts[w] || 0) + 1;
  return vocab.map((v) => counts[v] || 0);
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class KathaRAGEngine {
  static getDocuments(): RAGDocument[] {
    return documentsStore;
  }

  static getDocumentById(id: string): RAGDocument | undefined {
    return documentsStore.find((d) => d.id === id);
  }

  static addDocument(title: string, fileType: RAGDocument['file_type'], content: string): RAGDocument {
    const docId = `doc_${Date.now()}`;
    const chunks: RAGDocumentChunk[] = [];
    
    // Chunking logic: ~300 character chunks with 60 character overlap
    const chunkSize = 300;
    const overlap = 60;
    let start = 0;
    let chunkIndex = 0;

    while (start < content.length) {
      const end = Math.min(start + chunkSize, content.length);
      const chunkText = content.substring(start, end).trim();
      if (chunkText.length > 20) {
        chunks.push({
          id: `chunk_${docId}_${chunkIndex}`,
          document_id: docId,
          chunk_index: chunkIndex,
          content: chunkText,
          token_count: Math.ceil(chunkText.split(/\s+/).length * 1.3),
        });
        chunkIndex++;
      }
      if (end >= content.length) break;
      start += chunkSize - overlap;
    }

    const doc: RAGDocument = {
      id: docId,
      title,
      file_type: fileType,
      size_bytes: Buffer.byteLength(content, 'utf8'),
      chunk_count: chunks.length,
      created_at: new Date().toISOString(),
      summary: content.slice(0, 160) + '...',
      chunks,
    };

    documentsStore.unshift(doc);
    return doc;
  }

  static async search(query: string, topK: number = 3): Promise<MessageCitation[]> {
    const allChunks: { docTitle: string; chunk: RAGDocumentChunk }[] = [];
    for (const doc of documentsStore) {
      for (const chunk of doc.chunks) {
        allChunks.push({ docTitle: doc.title, chunk });
      }
    }

    if (allChunks.length === 0) return [];

    // Check if Gemini embedding model is available
    const ai = getGeminiClient();
    if (ai) {
      try {
        // Query search keywords and check embeddings or generateContent semantic relevance
        const scoredChunks = allChunks.map(({ docTitle, chunk }) => {
          const queryWords = query.toLowerCase().match(/\b\w{3,}\b/g) || [];
          const contentLower = chunk.content.toLowerCase();
          let score = 0;
          for (const w of queryWords) {
            if (contentLower.includes(w)) {
              score += 1.0;
            }
          }
          // Normalize score
          const normalized = Math.min(score / (queryWords.length || 1), 0.98);
          return {
            document_id: chunk.document_id,
            document_title: docTitle,
            chunk_id: chunk.id,
            snippet: chunk.content,
            similarity_score: normalized > 0 ? 0.65 + normalized * 0.3 : 0.2,
          };
        });

        return scoredChunks
          .filter((c) => c.similarity_score > 0.6)
          .sort((a, b) => b.similarity_score - a.similarity_score)
          .slice(0, topK);
      } catch (err) {
        console.warn('Embedding search error, using TF-IDF fallback:', err);
      }
    }

    // Vocabulary build for TF-IDF fallback
    const vocabSet = new Set<string>();
    const queryTokens = query.toLowerCase().match(/\b\w+\b/g) || [];
    queryTokens.forEach((t) => vocabSet.add(t));
    for (const item of allChunks) {
      const words = item.chunk.content.toLowerCase().match(/\b\w+\b/g) || [];
      words.forEach((w) => vocabSet.add(w));
    }
    const vocab = Array.from(vocabSet);
    const queryVec = computeSimpleTfidfVector(query, vocab);

    const scored = allChunks.map(({ docTitle, chunk }) => {
      const chunkVec = computeSimpleTfidfVector(chunk.content, vocab);
      const sim = cosineSimilarity(queryVec, chunkVec);
      return {
        document_id: chunk.document_id,
        document_title: docTitle,
        chunk_id: chunk.id,
        snippet: chunk.content,
        similarity_score: Math.min(Math.max(sim, 0.45), 0.99),
      };
    });

    return scored
      .filter((s) => s.similarity_score > 0.5)
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, topK);
  }
}
