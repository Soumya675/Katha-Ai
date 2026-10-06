export type SupportedLanguage = 
  | 'en' // English
  | 'hi' // Hindi
  | 'or' // Odia
  | 'bn' // Bengali
  | 'te' // Telugu
  | 'ta' // Tamil
  | 'kn' // Kannada
  | 'mr' // Marathi
  | 'gu' // Gujarati
  | 'hinglish' // Hindi + English code-switching
  | 'odianglish'; // Odia + English code-switching

export type IntentType =
  | 'SEND_MESSAGE'
  | 'SEND_EMAIL'
  | 'CREATE_REMINDER'
  | 'CREATE_CALENDAR_EVENT'
  | 'SEARCH_WEB'
  | 'SUMMARIZE'
  | 'TRANSLATE'
  | 'WRITE_EMAIL'
  | 'WRITE_REPORT'
  | 'WRITE_PROPOSAL'
  | 'ANSWER_QUESTION'
  | 'READ_DOCUMENT'
  | 'ANALYZE_DOCUMENT'
  | 'SEARCH_DOCUMENT'
  | 'OPEN_APPLICATION'
  | 'CREATE_TASK'
  | 'UPDATE_TASK'
  | 'GET_WEATHER'
  | 'GET_NEWS'
  | 'GENERAL_CONVERSATION';

export interface ExtractedEntities {
  recipient?: string;
  sender?: string;
  subject?: string;
  message?: string;
  date?: string;
  time?: string;
  task?: string;
  location?: string;
  topic?: string;
  target_language?: string;
  query?: string;
  priority?: 'low' | 'medium' | 'high';
  app_name?: string;
  [key: string]: unknown;
}

export interface IntentResult {
  intent: IntentType;
  confidence: number;
  entities: ExtractedEntities;
  requires_tool: boolean;
  tool_name?: string;
  requires_permission: boolean;
}

export interface PipelineStageInfo {
  stage: 'audio_preprocessing' | 'vad' | 'stt' | 'language_detection' | 'intent_detection' | 'context_retrieval' | 'memory_retrieval' | 'llm_reasoning' | 'rag' | 'tool_selection' | 'permission_check' | 'action_execution' | 'tts';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
  duration_ms: number;
  details?: string;
}

export interface ToolCallProposal {
  id: string;
  tool_name: string;
  description: string;
  arguments: Record<string, unknown>;
  is_sensitive: boolean;
  permission_status: 'pending' | 'approved' | 'rejected' | 'executed' | 'cancelled';
  preview_text: string;
}

export interface ToolExecutionResult {
  tool_name: string;
  success: boolean;
  output: Record<string, unknown>;
  message: string;
  timestamp: string;
}

export interface MessageCitation {
  document_id: string;
  document_title: string;
  chunk_id: string;
  snippet: string;
  similarity_score: number;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  audio_url?: string;
  detected_language?: SupportedLanguage;
  detected_intent?: IntentResult;
  tool_proposal?: ToolCallProposal;
  tool_result?: ToolExecutionResult;
  citations?: MessageCitation[];
  pipeline_stages?: PipelineStageInfo[];
  original_speech?: string;
  translation?: string;
  feedback?: 'thumbs_up' | 'thumbs_down';
}

export interface UserMemoryItem {
  id: string;
  category: 'preference' | 'personal_fact' | 'work_context' | 'communication_style' | 'saved_info';
  key: string;
  value: string;
  user_consented: boolean;
  confidence: number;
  created_at: string;
  updated_at: string;
}

export interface RAGDocument {
  id: string;
  title: string;
  file_type: 'pdf' | 'docx' | 'txt' | 'csv' | 'web';
  size_bytes: number;
  chunk_count: number;
  created_at: string;
  summary?: string;
  chunks: RAGDocumentChunk[];
}

export interface RAGDocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  token_count: number;
  embedding_vector?: number[];
}

export interface ModelBenchmark {
  model_name: string;
  category: 'ASR' | 'Intent' | 'LLM' | 'RAG' | 'Voice';
  is_proprietary: boolean;
  status: 'Active (Fallback)' | 'Training' | 'Research Prototype' | 'Production Ready';
  metrics: Record<string, number | string>;
  latency_ms: number;
  notes: string;
}

export interface PlanConfig {
  tier: 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';
  name: string;
  price_inr: number;
  billing_cycle: 'month' | 'year';
  voice_minutes_limit: number;
  ai_model_tier: string;
  memory_limit: number;
  document_storage_mb: number;
  features: string[];
}
