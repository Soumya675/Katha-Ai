import { ModelBenchmark, PlanConfig } from '../src/types/index.ts';

export interface FlywheelFeedbackItem {
  id: string;
  user_input: string;
  detected_language: string;
  detected_intent: string;
  generated_response: string;
  feedback_type: 'positive' | 'negative' | 'flagged_for_review';
  correction?: string;
  is_anonymized: boolean;
  curated_for_fine_tuning: boolean;
  created_at: string;
}

export const CURRENT_MODEL_BENCHMARKS: ModelBenchmark[] = [
  {
    model_name: 'Katha ASR (Acoustic v0.9 Beta)',
    category: 'ASR',
    is_proprietary: true,
    status: 'Training',
    metrics: {
      WER: '8.4%',
      CER: '3.1%',
      'Code-Switch Acc': '94.2%',
      'Odia/Hindi Support': '96.5%',
    },
    latency_ms: 180,
    notes: 'Fine-tuned on 10,000+ hours of Indian dialectal and code-switched audio. Target WER < 6%.',
  },
  {
    model_name: 'Whisper Large v3 (Baseline)',
    category: 'ASR',
    is_proprietary: false,
    status: 'Active (Fallback)',
    metrics: {
      WER: '11.8%',
      CER: '4.6%',
      'Code-Switch Acc': '82.4%',
      'Odia/Hindi Support': '88.1%',
    },
    latency_ms: 450,
    notes: 'General open-weights multilingual transcription baseline.',
  },
  {
    model_name: 'Katha Intent Engine (IndicBERT-X)',
    category: 'Intent',
    is_proprietary: true,
    status: 'Production Ready',
    metrics: {
      Accuracy: '96.8%',
      Precision: '97.2%',
      Recall: '96.4%',
      F1_Score: '0.968',
    },
    latency_ms: 65,
    notes: 'Transformer classifier specialized in mixed language intent extraction and Indian entity slots.',
  },
  {
    model_name: 'Katha RAG Hybrid (BGE-M3 + Dense)',
    category: 'RAG',
    is_proprietary: false,
    status: 'Production Ready',
    metrics: {
      'Retrieval Precision': '94.6%',
      'Answer Faithfulness': '98.1%',
      'Citation Accuracy': '99.2%',
      MRR_at_10: '0.89',
    },
    latency_ms: 120,
    notes: 'Multi-stage semantic search with cross-lingual reranker for English, Hindi, and Odia documentation.',
  },
  {
    model_name: 'Gemini 3.8 Flash (LLM Brain)',
    category: 'LLM',
    is_proprietary: false,
    status: 'Active (Fallback)',
    metrics: {
      'Instruction Following': '98.7%',
      'Hallucination Rate': '1.2%',
      'Tool Precision': '97.9%',
      'Code-Switch Comprehension': '95.4%',
    },
    latency_ms: 310,
    notes: 'High-throughput reasoning engine supporting complex Indian code-switching and structured tool dispatch.',
  },
  {
    model_name: 'Katha Voice (Indic Neural TTS)',
    category: 'Voice',
    is_proprietary: true,
    status: 'Research Prototype',
    metrics: {
      MOS_Naturalness: '4.6/5.0',
      'Pronunciation Acc': '97.3%',
      'First Chunk Latency': '115ms',
    },
    latency_ms: 140,
    notes: 'Native phonetic articulation for Odia, Hindi, and Indian English phonemes.',
  },
];

export const INITIAL_PLANS: PlanConfig[] = [
  {
    tier: 'FREE',
    name: 'Katha Starter',
    price_inr: 0,
    billing_cycle: 'month',
    voice_minutes_limit: 120,
    ai_model_tier: 'Standard Multilingual (Gemini 3.8 Flash / Whisper)',
    memory_limit: 25,
    document_storage_mb: 20,
    features: [
      '120 voice interaction minutes/mo',
      'English, Hindi & Hinglish recognition',
      'Basic Reminders & Calendar scheduling',
      'Short-term session memory',
      'Web search grounding',
    ],
  },
  {
    tier: 'PRO',
    name: 'Katha Pro Executive',
    price_inr: 799,
    billing_cycle: 'month',
    voice_minutes_limit: 1200,
    ai_model_tier: 'Katha Advanced Multilingual + Reasoning Brain',
    memory_limit: 500,
    document_storage_mb: 250,
    features: [
      '1,200 voice minutes/mo with priority processing',
      'Odia, Bengali, Tamil, Telugu, Marathi, Gujarati',
      'Native code-switching & Indian idiom comprehension',
      'Long-term semantic memory with privacy controls',
      'Full RAG document search (PDF, DOCX, CSV)',
      'Automated Tool Confirmation workflow',
    ],
  },
  {
    tier: 'BUSINESS',
    name: 'Katha Business Team',
    price_inr: 2499,
    billing_cycle: 'month',
    voice_minutes_limit: 6000,
    ai_model_tier: 'Enterprise Katha AI Cluster with Dedicated Rate Limits',
    memory_limit: 5000,
    document_storage_mb: 2000,
    features: [
      '6,000 voice minutes shared across 10 seats',
      'Team shared documents and knowledge base',
      'CRM and Custom Webhook integrations',
      'Admin telemetry & model evaluation dashboard',
      'Enterprise security & GDPR/India DPDP compliance',
    ],
  },
  {
    tier: 'ENTERPRISE',
    name: 'Katha Custom Enterprise',
    price_inr: 12999,
    billing_cycle: 'month',
    voice_minutes_limit: 50000,
    ai_model_tier: 'Private VPC / On-Prem Katha Proprietary Models',
    memory_limit: 50000,
    document_storage_mb: 50000,
    features: [
      'Custom fine-tuned Katha ASR for domain vocabulary',
      'Self-hosted or Private Cloud deployment',
      'Zero-retention data privacy guarantees',
      'Dedicated ML solutions architect',
      'Custom Voice persona development',
    ],
  },
];

let flywheelFeedbackStore: FlywheelFeedbackItem[] = [
  {
    id: 'fly_1',
    user_input: 'Kal Rahul ku mail kari kahiba ki project review 3 PM re achhi.',
    detected_language: 'odianglish',
    detected_intent: 'SEND_EMAIL',
    generated_response: 'I have drafted the email for Rahul: "The project review is scheduled for 3 PM tomorrow." Would you like me to send it?',
    feedback_type: 'positive',
    is_anonymized: true,
    curated_for_fine_tuning: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'fly_2',
    user_input: 'Bhubaneswar re aaji mausam kemiti achhi?',
    detected_language: 'or',
    detected_intent: 'GET_WEATHER',
    generated_response: 'Today in Bhubaneswar, it is 31°C and sunny with pleasant coastal breeze.',
    feedback_type: 'positive',
    is_anonymized: true,
    curated_for_fine_tuning: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export class KathaEvaluationsRegistry {
  static getBenchmarks(): ModelBenchmark[] {
    return CURRENT_MODEL_BENCHMARKS;
  }

  static getPlans(): PlanConfig[] {
    return INITIAL_PLANS;
  }

  static getFlywheelFeedback(): FlywheelFeedbackItem[] {
    return flywheelFeedbackStore;
  }

  static addFeedback(item: Omit<FlywheelFeedbackItem, 'id' | 'created_at'>): FlywheelFeedbackItem {
    const feedback: FlywheelFeedbackItem = {
      id: `fly_${Date.now()}`,
      ...item,
      created_at: new Date().toISOString(),
    };
    flywheelFeedbackStore.unshift(feedback);
    return feedback;
  }

  static getLiveSystemStats() {
    return {
      totalUsers: 14820,
      activeUsersToday: 3218,
      voiceMinutesProcessed: 18450,
      messagesProcessed: 62410,
      averageLatencyMs: 245,
      asrAccuracy: 95.8,
      toolSuccessRate: 98.4,
      gpuUtilization: '38%',
      languageDistribution: [
        { name: 'Hindi', percentage: 38 },
        { name: 'English', percentage: 26 },
        { name: 'Hinglish (Code-Switch)', percentage: 18 },
        { name: 'Odia & Odianglish', percentage: 12 },
        { name: 'Marathi & Gujarati', percentage: 6 },
      ],
      systemHealth: 'All Systems Operational',
    };
  }
}
