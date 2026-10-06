/**
 * PostgreSQL Schema & Migrations for Katha AI Platform
 * Supports pgvector for semantic retrieval, audit timestamps, and foreign key relations.
 */

export const POSTGRESQL_SCHEMA_DDL = `
-- Enable pgvector extension for high-performance semantic memory and RAG embeddings
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    hashed_password VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'operator', 'enterprise_admin')),
    plan_tier VARCHAR(50) DEFAULT 'FREE' CHECK (plan_tier IN ('FREE', 'PRO', 'BUSINESS', 'ENTERPRISE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    preferred_languages TEXT[] DEFAULT ARRAY['en', 'hi', 'or'],
    voice_speed NUMERIC(3,2) DEFAULT 1.0,
    preferred_voice_persona VARCHAR(100) DEFAULT 'Kore',
    auto_execute_safe_tools BOOLEAN DEFAULT TRUE,
    timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
    city VARCHAR(100) DEFAULT 'Bhubaneswar',
    country VARCHAR(100) DEFAULT 'India',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Languages Catalog
CREATE TABLE IF NOT EXISTS languages (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    native_script VARCHAR(100) NOT NULL,
    is_supported BOOLEAN DEFAULT TRUE,
    supports_code_switching BOOLEAN DEFAULT TRUE,
    asr_model_type VARCHAR(100) DEFAULT 'Whisper-Large-v3 / Katha ASR'
);

-- 4. Conversations
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'Voice Session',
    channel VARCHAR(50) DEFAULT 'web_voice' CHECK (channel IN ('web_voice', 'mobile_flutter', 'desktop_shortcut', 'api')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Audio Sessions & VAD Logs
CREATE TABLE IF NOT EXISTS audio_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sample_rate INT DEFAULT 16000,
    audio_format VARCHAR(20) DEFAULT 'audio/webm',
    speech_detected_ms INT,
    silence_trimmed_ms INT,
    vad_confidence NUMERIC(4,3),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Transcriptions
CREATE TABLE IF NOT EXISTS transcriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audio_session_id UUID REFERENCES audio_sessions(id) ON DELETE CASCADE,
    raw_transcript TEXT NOT NULL,
    normalized_transcript TEXT NOT NULL,
    detected_language_code VARCHAR(20) REFERENCES languages(code),
    is_code_switched BOOLEAN DEFAULT FALSE,
    confidence NUMERIC(4,3),
    asr_engine VARCHAR(100) DEFAULT 'Whisper-Large-v3',
    latency_ms INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Intents Registry
CREATE TABLE IF NOT EXISTS intents (
    name VARCHAR(100) PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    requires_tool BOOLEAN DEFAULT FALSE,
    requires_user_permission BOOLEAN DEFAULT FALSE
);

-- 8. Messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    detected_intent_name VARCHAR(100) REFERENCES intents(name),
    intent_confidence NUMERIC(4,3),
    extracted_entities JSONB DEFAULT '{}'::jsonb,
    audio_synthesis_url TEXT,
    tts_engine VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Long-term User Memory with pgvector
CREATE TABLE IF NOT EXISTS user_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('preference', 'personal_fact', 'work_context', 'communication_style', 'saved_info')),
    memory_key VARCHAR(255) NOT NULL,
    memory_value TEXT NOT NULL,
    embedding vector(768),
    user_consented BOOLEAN DEFAULT TRUE,
    confidence NUMERIC(4,3) DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Documents (RAG Knowledge Base)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('pdf', 'docx', 'txt', 'csv', 'web')),
    storage_path TEXT,
    size_bytes BIGINT NOT NULL,
    chunk_count INT DEFAULT 0,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Document Chunks & Vector Embeddings
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    token_count INT NOT NULL,
    embedding vector(768),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Tools & Integrations
CREATE TABLE IF NOT EXISTS tools (
    name VARCHAR(100) PRIMARY KEY,
    display_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    is_sensitive BOOLEAN DEFAULT FALSE,
    required_arguments TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Tool Permissions & Authorization Policies
CREATE TABLE IF NOT EXISTS tool_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tool_name VARCHAR(100) REFERENCES tools(name),
    is_authorized BOOLEAN DEFAULT TRUE,
    requires_pin_or_biometric BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Tool Calls & Execution Audits
CREATE TABLE IF NOT EXISTS tool_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tool_name VARCHAR(100) REFERENCES tools(name),
    arguments JSONB NOT NULL,
    permission_status VARCHAR(50) NOT NULL CHECK (permission_status IN ('pending', 'approved', 'rejected', 'executed', 'cancelled')),
    execution_result JSONB,
    execution_success BOOLEAN,
    executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. User Tasks
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. User Feedback & Flywheel Review
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    feedback_type VARCHAR(50) NOT NULL CHECK (feedback_type IN ('positive', 'negative', 'flagged_for_review')),
    correction_text TEXT,
    is_anonymized BOOLEAN DEFAULT TRUE,
    curated_for_fine_tuning BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. Model Evaluations & Version Benchmarks
CREATE TABLE IF NOT EXISTS model_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(150) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('ASR', 'Intent', 'LLM', 'RAG', 'Voice')),
    is_proprietary BOOLEAN DEFAULT FALSE,
    metrics JSONB NOT NULL,
    latency_p50_ms INT,
    latency_p99_ms INT,
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES for optimal retrieval speeds
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_user_memory_user ON user_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memory_category ON user_memory(category);
CREATE INDEX IF NOT EXISTS idx_document_chunks_doc ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_tool_calls_user ON tool_calls(user_id);

-- Cosine vector similarity indexes for pgvector
CREATE INDEX IF NOT EXISTS idx_user_memory_vector ON user_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_document_chunks_vector ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
`;
