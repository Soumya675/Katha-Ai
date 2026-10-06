-- Database initialization script for KathaAI Platform
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. Organizations & Workspaces
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    plan_tier VARCHAR(50) DEFAULT 'pro',
    max_monthly_minutes INT DEFAULT 1500,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Audio & Video Recordings
CREATE TABLE IF NOT EXISTS recordings (
    id VARCHAR(100) PRIMARY KEY,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'meeting',
    audio_storage_url TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL DEFAULT 'audio/mp3',
    file_size_mb NUMERIC(8,2) NOT NULL DEFAULT 1.5,
    duration_seconds INT NOT NULL DEFAULT 60,
    status VARCHAR(50) DEFAULT 'completed',
    language VARCHAR(100) NOT NULL DEFAULT 'English',
    detected_language_code VARCHAR(10) NOT NULL DEFAULT 'en',
    confidence NUMERIC(4,3) NOT NULL DEFAULT 0.98,
    wer_score NUMERIC(4,3) DEFAULT 0.058,
    raw_transcript TEXT,
    clean_transcript TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Diarized Speakers
CREATE TABLE IF NOT EXISTS speakers (
    id VARCHAR(100) PRIMARY KEY,
    recording_id VARCHAR(100) REFERENCES recordings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    color_code VARCHAR(50) DEFAULT 'amber'
);

-- 5. Time-Synchronized Transcript Segments
CREATE TABLE IF NOT EXISTS transcript_segments (
    id VARCHAR(100) PRIMARY KEY,
    recording_id VARCHAR(100) REFERENCES recordings(id) ON DELETE CASCADE,
    speaker_id VARCHAR(100) REFERENCES speakers(id) ON DELETE SET NULL,
    speaker_name VARCHAR(255) NOT NULL,
    start_time_seconds NUMERIC(8,3) NOT NULL,
    end_time_seconds NUMERIC(8,3) NOT NULL,
    raw_text TEXT,
    natural_text TEXT,
    text TEXT NOT NULL,
    translated_text TEXT,
    confidence NUMERIC(4,3) NOT NULL DEFAULT 0.98,
    is_bookmarked BOOLEAN DEFAULT FALSE
);

-- 6. Vector Embeddings for Ask AI (RAG)
CREATE TABLE IF NOT EXISTS transcript_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    segment_id VARCHAR(100) REFERENCES transcript_segments(id) ON DELETE CASCADE,
    recording_id VARCHAR(100) REFERENCES recordings(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(768) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recordings_status ON recordings(status);
CREATE INDEX IF NOT EXISTS idx_segments_recording ON transcript_segments(recording_id);
