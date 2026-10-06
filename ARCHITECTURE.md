# KathaAI — Production System Architecture & GPU Pipeline

> **Positioning:** An AI-powered voice intelligence platform that converts conversations, meetings, interviews, lectures, and audio/video into structured, searchable, and actionable information.

---

## 1. High-Level Architecture Overview

```
                      +---------------------------------------+
                      |   Client: Next.js / React Frontend    |
                      |  - Interactive 3-Column WhisperStudio |
                      |  - Waveform Playback & Time Sync      |
                      |  - Real-time Mic Voice Streamer       |
                      +-------------------+-------------------+
                                          |
                        HTTPS (REST) / WSS (Streaming)
                                          |
                      +-------------------v-------------------+
                      |      API Gateway / Web Backend        |
                      |      (Node.js / Express / FastAPI)     |
                      |  - JWT Auth & Project Management      |
                      |  - File Validation & Object Storage   |
                      |  - Task Dispatcher (Redis Queue)      |
                      +-------------------+-------------------+
                                          |
                     +--------------------+--------------------+
                     |                                         |
          +----------v-----------+                  +----------v-----------+
          |  PostgreSQL Database |                  | Redis Job Queue      |
          |  - Metadata & Users  |                  | (Celery / BullMQ)    |
          |  - Transcripts & Segs|                  | - High Priority Live |
          |  - pgvector 768d IVFF|                  | - Batch Audio/Video  |
          +----------------------+                  +----------+-----------+
                                                               |
                                        +----------------------+----------------------+
                                        |                                             |
                             +----------v----------+                       +----------v----------+
                             | CPU Worker Service  |                       | GPU Worker Pool     |
                             | - FFmpeg 16kHz Mono |                       | (NVIDIA CUDA T4/V100|
                             | - Noise Gate Filter |                       | - faster-whisper    |
                             | - Audio Chunking    |                       | - pyannote.audio    |
                             | - Export Generators |                       | - WhisperX Align    |
                             +---------------------+                       +---------------------+
```

---

## 2. End-to-End Processing Pipeline

1. **User Audio/Video Ingestion:**
   - Supports MP3, WAV, M4A, AAC, OGG, FLAC, MP4, MOV, MKV, WEBM.
   - Upload verified by size and content MIME checks. Stored in S3/GCS Object Storage.

2. **FFmpeg Standardization:**
   - Command: `ffmpeg -i input.[mp4|mp3] -ar 16000 -ac 1 -c:a pcm_s16le output.wav`
   - Resamples any multi-channel or variable bit-rate file to 16kHz mono PCM.
   - Normalizes volume to -23 LUFS (EBU R128 standard).

3. **Silero Voice Activity Detection (VAD):**
   - Eliminates silence and background office noise.
   - Segment boundaries determined by voice probability threshold (>0.85).
   - Generates speech timestamps for chunk alignment.

4. **Speech-to-Text Engine (Modular ASRService):**
   - Primary: `faster-whisper` (CTranslate2 ONNX runtime) and `WhisperX`.
   - Multilingual acoustic models fine-tuned on Odia, Hindi, Hinglish, and regional Indian broadcasts.
   - Emits timestamped subword tokens.

5. **Speaker Diarization (`pyannote.audio`):**
   - Extracts x-vector acoustic speaker embeddings.
   - Agglomerative hierarchical clustering assigns speaker IDs (`Speaker 1`, `Speaker 2`).
   - WhisperX phoneme alignment synchronizes words directly to speaker segments.

6. **LLM Processing & Multi-Mode Intelligence:**
   - **General Summary:** 5-8 line executive brief, structured details, key points, decisions, and action items table.
   - **Meeting Mode:** Formal Meeting Minutes (Agenda, Discussion, Decisions, Action Items, Next Meeting).
   - **Interview Mode:** Questions & answers, technical skill rubric, communication rating, recruiter notes.
   - **Lecture Mode:** Chapter divisions, core concepts, definitions, revision notes, MCQs, and flashcards.
   - **Content Creator Mode:** YouTube description with timestamped chapters, viral quote cards, social tweets, and SEO keywords.

7. **"Ask AI About Audio" (RAG with pgvector):**
   - Transcript segments chunked and embedded via 768-dim multilingual vector models.
   - Cosine similarity search retrieves exact spoken segments.
   - LLM formats answers with clickable timestamp citations (e.g. `[00:19]`) that immediately seek audio playback.

---

## 3. The Two-Tier Speech Architecture: Whisper ASR + LLM Rewriting Layer

```
🎙️ You speak
      │
      ▼
🎧 Whisper / faster-Whisper
      │
      ▼
📝 Raw transcript
   "um actually I wanted to say that tomorrow we have meeting and I think sir told me to bring the report"
      │
      ▼
🧠 LLM rewriting engine
      │
      ▼
💎 Natural text
   "We have a meeting tomorrow, and I believe sir asked me to bring the report."
```

### Why Decouple Whisper from the Rewriter?
1. **Separation of Concerns:** Whisper is an acoustic-to-text token model trained on paired audio and phonetic transcripts. Attempting to force Whisper to rewrite colloquial speech degrades acoustic accuracy and introduces hallucinated content.
2. **Deterministic Timestamps:** The raw Whisper stage produces millisecond-level word and sentence timestamps.
3. **Flexible Rewriting Styles:** The LLM rewriting engine on top can adapt to any target format:
   - **Executive & Clean:** Strips "um", "uh", "actually", "like", and resolves false starts.
   - **Verbatim / Legal Mode:** Preserves 100% of raw utterances for courtroom or compliance archives.
   - **Formal Minutes:** Converts casual spoken dialogue directly into structured action items.

---

## 4. GPU Worker Scaling & Cost Optimization

| Tier | Model | Worker Spec | Target Latency |
| :--- | :--- | :--- | :--- |
| **Speed Mode** | `whisper-small` / quantized INT8 | CPU / NVIDIA T4 | 0.15x Real-Time Factor (RTF) |
| **Balanced Mode** | `whisper-medium` / FP16 | NVIDIA L4 / T4 | 0.25x Real-Time Factor (RTF) |
| **Accuracy Mode** | `whisper-large-v3` + `pyannote` | NVIDIA A10G / V100 | 0.40x Real-Time Factor (RTF) |
