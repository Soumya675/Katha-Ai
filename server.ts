import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { KathaPipelineCoordinator } from './server/pipeline.ts';
import { KathaASRService } from './server/asr.ts';
import { KathaTTSProvider } from './server/tts.ts';
import { KathaToolRegistry } from './server/tools.ts';
import { ToolPermissionManager } from './server/permissions.ts';
import { KathaMemoryEngine } from './server/memory.ts';
import { KathaRAGEngine } from './server/rag.ts';
import { KathaEvaluationsRegistry } from './server/evaluations.ts';
import { POSTGRESQL_SCHEMA_DDL } from './server/db_schema.ts';
import { KathaWisprFlowEngine } from './server/flow.ts';
import { KathaPlatformService } from './server/whisper_platform.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api') || req.path === '/health') {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Production Health Check Endpoints
app.get(['/health', '/api/health'], (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'KathaAI Voice Intelligence Platform',
    version: '2.4.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    features: {
      asr: 'faster-whisper / WhisperX ready',
      rewriter: 'LLM Rewriting Engine active',
      diarization: 'pyannote.audio ready',
      rag: 'pgvector IVFFlat ready',
      speechToText: 'Active',
    },
  });
});

// API Routes
app.post('/api/voice/pipeline', async (req: Request, res: Response) => {
  try {
    const { text, audioBase64, audioMimeType, sessionId, skipTts } = req.body;
    const result = await KathaPipelineCoordinator.runPipeline({
      text,
      audioBase64,
      audioMimeType,
      sessionId,
      skipTts: Boolean(skipTts),
    });
    res.json(result);
  } catch (error: any) {
    console.error('Pipeline error:', error);
    res.status(500).json({ error: error.message || 'Pipeline execution failed' });
  }
});

app.post('/api/voice/transcribe', async (req: Request, res: Response) => {
  try {
    const { audioBase64, audioMimeType, languageHint } = req.body;
    if (!audioBase64) {
      res.status(400).json({ error: 'audioBase64 is required' });
      return;
    }
    const result = await KathaASRService.transcribeAudio(audioBase64, audioMimeType, languageHint);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Transcription failed' });
  }
});

app.post('/api/voice/synthesize', async (req: Request, res: Response) => {
  try {
    const { text, voiceName } = req.body;
    if (!text) {
      res.status(400).json({ error: 'text is required' });
      return;
    }
    const result = await KathaTTSProvider.synthesize(text, voiceName);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'TTS generation failed' });
  }
});

app.post('/api/flow/polish', async (req: Request, res: Response) => {
  try {
    const { rawText, mode, contextHint, appTarget, customVocabulary, whisperMode } = req.body;
    const result = await KathaWisprFlowEngine.polishSpeech({
      rawText: rawText || '',
      mode: mode || 'smart_clean',
      appTarget: appTarget || 'generic',
      contextHint,
      customVocabulary: customVocabulary || [],
      whisperMode: Boolean(whisperMode),
    });
    res.json(result);
  } catch (error: any) {
    console.error('Flow polish error:', error);
    res.status(500).json({ error: error.message || 'Flow polish failed' });
  }
});

app.post('/api/tools/execute', async (req: Request, res: Response) => {
  try {
    const { toolName, arguments: args } = req.body;
    if (!toolName) {
      res.status(400).json({ error: 'toolName is required' });
      return;
    }
    const result = await KathaToolRegistry.execute(toolName, args || {});
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Tool execution failed' });
  }
});

app.post('/api/tools/proposal/status', async (req: Request, res: Response) => {
  try {
    const { proposalId, status, updatedArguments } = req.body;
    if (!proposalId || !status) {
      res.status(400).json({ error: 'proposalId and status are required' });
      return;
    }

    const updatedProposal = ToolPermissionManager.updateStatus(proposalId, status, updatedArguments);
    if (!updatedProposal) {
      res.status(404).json({ error: 'Proposal not found' });
      return;
    }

    let executionResult = null;
    if (status === 'approved') {
      executionResult = await KathaToolRegistry.execute(updatedProposal.tool_name, updatedProposal.arguments);
      ToolPermissionManager.updateStatus(proposalId, 'executed');
    }

    res.json({ proposal: updatedProposal, executionResult });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Status update failed' });
  }
});

// Memory Endpoints
app.get('/api/memory', (_req: Request, res: Response) => {
  try {
    const memories = KathaMemoryEngine.getLongTermMemories(false);
    res.json(memories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/memory', (req: Request, res: Response) => {
  try {
    const { category, key, value, user_consented, confidence } = req.body;
    const item = KathaMemoryEngine.addMemory({
      category: category || 'saved_info',
      key,
      value,
      user_consented: user_consented !== false,
      confidence: confidence || 1.0,
    });
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/memory/:id/consent', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { consented } = req.body;
    const ok = KathaMemoryEngine.updateMemoryConsent(id, Boolean(consented));
    res.json({ success: ok });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/memory/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ok = KathaMemoryEngine.deleteMemory(id);
    res.json({ success: ok });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Documents & RAG Endpoints
app.get('/api/documents', (_req: Request, res: Response) => {
  try {
    res.json(KathaRAGEngine.getDocuments());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/documents/upload', (req: Request, res: Response) => {
  try {
    const { title, fileType, content } = req.body;
    if (!title || !content) {
      res.status(400).json({ error: 'Title and content are required' });
      return;
    }
    const doc = KathaRAGEngine.addDocument(title, fileType || 'txt', content);
    res.json(doc);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/rag/query', async (req: Request, res: Response) => {
  try {
    const { query, topK } = req.body;
    if (!query) {
      res.status(400).json({ error: 'query is required' });
      return;
    }
    const citations = await KathaRAGEngine.search(query, topK || 3);
    res.json(citations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin, Evaluation & Feedback
app.get('/api/admin/metrics', (_req: Request, res: Response) => {
  try {
    res.json({
      benchmarks: KathaEvaluationsRegistry.getBenchmarks(),
      plans: KathaEvaluationsRegistry.getPlans(),
      flywheel: KathaEvaluationsRegistry.getFlywheelFeedback(),
      stats: KathaEvaluationsRegistry.getLiveSystemStats(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// KathaAI Whisper-like Platform Endpoints
app.get('/api/v1/recordings', (_req: Request, res: Response) => {
  try {
    res.json(KathaPlatformService.getAllRecordings());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/recordings/:id', (req: Request, res: Response) => {
  try {
    const rec = KathaPlatformService.getRecordingById(req.params.id);
    if (!rec) {
      res.status(404).json({ error: 'Recording not found' });
      return;
    }
    res.json(rec);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/recordings', async (req: Request, res: Response) => {
  try {
    const rec = await KathaPlatformService.createNewRecording(req.body);
    res.json(rec);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/v1/recordings/:id/speaker', (req: Request, res: Response) => {
  try {
    const { speakerId, newName } = req.body;
    const rec = KathaPlatformService.renameSpeaker(req.params.id, speakerId, newName);
    if (!rec) {
      res.status(404).json({ error: 'Recording or speaker not found' });
      return;
    }
    res.json(rec);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/v1/recordings/:id/segment', (req: Request, res: Response) => {
  try {
    const { segmentId, newText } = req.body;
    const rec = KathaPlatformService.updateSegmentText(req.params.id, segmentId, newText);
    if (!rec) {
      res.status(404).json({ error: 'Recording or segment not found' });
      return;
    }
    res.json(rec);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/recordings/:id/bookmark', (req: Request, res: Response) => {
  try {
    const { segmentId } = req.body;
    const rec = KathaPlatformService.toggleSegmentBookmark(req.params.id, segmentId);
    if (!rec) {
      res.status(404).json({ error: 'Recording or segment not found' });
      return;
    }
    res.json(rec);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/recordings/:id/translate', async (req: Request, res: Response) => {
  try {
    const { targetLanguage } = req.body;
    const rec = await KathaPlatformService.translateTranscript(req.params.id, targetLanguage || 'English');
    if (!rec) {
      res.status(404).json({ error: 'Recording not found' });
      return;
    }
    res.json(rec);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/rewrite', async (req: Request, res: Response) => {
  try {
    const { text, style } = req.body;
    if (!text) {
      res.status(400).json({ error: 'text is required' });
      return;
    }
    const result = await KathaPlatformService.rewriteTextWithLLM(text, style || 'natural');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/v1/recordings/:id/ask', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    const result = await KathaPlatformService.askQuestionAboutAudio(req.params.id, query || '');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/recordings/:id/export', (req: Request, res: Response) => {
  try {
    const format = (req.query.format as any) || 'txt';
    const content = KathaPlatformService.exportTranscript(req.params.id, format);
    if (!content) {
      res.status(404).json({ error: 'Recording not found' });
      return;
    }

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
    } else if (format === 'srt' || format === 'vtt') {
      res.setHeader('Content-Type', 'text/plain');
    } else if (format === 'md') {
      res.setHeader('Content-Type', 'text/markdown');
    } else {
      res.setHeader('Content-Type', 'text/plain');
    }

    res.send(content);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/v1/analytics', (_req: Request, res: Response) => {
  try {
    res.json(KathaPlatformService.getAnalytics());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/feedback', (req: Request, res: Response) => {
  try {
    const { userInput, detectedLanguage, detectedIntent, generatedResponse, feedbackType, correction } = req.body;
    const item = KathaEvaluationsRegistry.addFeedback({
      user_input: userInput || '',
      detected_language: detectedLanguage || 'en',
      detected_intent: detectedIntent || 'GENERAL_CONVERSATION',
      generated_response: generatedResponse || '',
      feedback_type: feedbackType || 'positive',
      correction,
      is_anonymized: true,
      curated_for_fine_tuning: feedbackType === 'positive',
    });
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/schema', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(POSTGRESQL_SCHEMA_DDL);
});

// Setup Vite or Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Katha AI full-stack server running on http://0.0.0.0:${port}`);
  });
}

startServer();
