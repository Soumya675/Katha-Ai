# KathaAI — Database Schema & Data Models (PostgreSQL + pgvector)

```sql
-- Enable vector extension for semantic retrieval
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. Organizations & Teams
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    plan_tier VARCHAR(50) DEFAULT 'pro', -- free, basic, pro, enterprise
    max_monthly_minutes INT DEFAULT 1500,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'member', -- admin, member, viewer
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Audio & Video Recordings
CREATE TABLE recordings (
    id VARCHAR(100) PRIMARY KEY,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    category VARCHAR(50) NOT NULL, -- meeting, interview, lecture, content, general
    audio_storage_url TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size_mb NUMERIC(8,2) NOT NULL,
    duration_seconds INT NOT NULL,
    status VARCHAR(50) DEFAULT 'completed', -- queued, processing, completed, failed
    language VARCHAR(100) NOT NULL,
    detected_language_code VARCHAR(10) NOT NULL,
    confidence NUMERIC(4,3) NOT NULL,
    wer_score NUMERIC(4,3) DEFAULT 0.058,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Diarized Speakers
CREATE TABLE speakers (
    id VARCHAR(100) PRIMARY KEY,
    recording_id VARCHAR(100) REFERENCES recordings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    color_code VARCHAR(50) DEFAULT 'amber'
);

-- 5. Time-Synchronized Transcript Segments
CREATE TABLE transcript_segments (
    id VARCHAR(100) PRIMARY KEY,
    recording_id VARCHAR(100) REFERENCES recordings(id) ON DELETE CASCADE,
    speaker_id VARCHAR(100) REFERENCES speakers(id) ON DELETE SET NULL,
    speaker_name VARCHAR(255) NOT NULL,
    start_time_seconds NUMERIC(8,3) NOT NULL,
    end_time_seconds NUMERIC(8,3) NOT NULL,
    text TEXT NOT NULL,
    translated_text TEXT,
    confidence NUMERIC(4,3) NOT NULL,
    is_bookmarked BOOLEAN DEFAULT FALSE
);

-- 6. Vector Embeddings for Ask AI (RAG)
CREATE TABLE transcript_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    segment_id VARCHAR(100) REFERENCES transcript_segments(id) ON DELETE CASCADE,
    recording_id VARCHAR(100) REFERENCES recordings(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(768) NOT NULL, -- Multilingual BGE / E5 / Gemini Embedding
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for sub-millisecond approximate nearest neighbor search
CREATE INDEX idx_transcript_embeddings_vector 
ON transcript_embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Full-Text Search Index on transcript text
CREATE INDEX idx_segments_text_tsv 
ON transcript_segments USING gin (to_tsvector('simple', text));
```
