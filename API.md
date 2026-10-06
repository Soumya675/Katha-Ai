# KathaAI — REST API Documentation

Base URL: `https://api.katha.ai/api/v1`

All responses are returned in JSON format unless an export format (`text/plain`, `text/markdown`, `application/octet-stream`) is requested.

---

## 1. Transcriptions & Recordings

### `GET /api/v1/recordings`
Returns a list of all processed audio/video recordings.

**Response:**
```json
[
  {
    "id": "rec_meeting_01",
    "title": "Katha AI Speech Pipeline & Odia ASR Architecture Sync",
    "category": "meeting",
    "duration": 184,
    "language": "Odia-English Mixed (Odianglish)",
    "confidence": 0.98,
    "status": "completed",
    "createdAt": "2026-09-29T03:00:00.000Z"
  }
]
```

---

### `GET /api/v1/recordings/:id`
Retrieves full details for a recording, including diarized speakers, timestamped segments, summary, and mode-specific intelligence.

**Response Schema:**
- `id`: string
- `title`: string
- `duration`: integer (seconds)
- `speakers`: Array of `{ id, name, color }`
- `segments`: Array of `{ id, speakerId, speakerName, start, end, text, confidence, translatedText? }`
- `summary`: Object containing `{ shortSummary, detailedSummary, keyPoints, decisions, actionItems }`
- `meetingMinutes` / `interviewReport` / `lectureNotes` / `creatorKit` (depending on category)

---

### `POST /api/v1/recordings`
Uploads and queues a new audio or video file for processing.

**Request Body:**
```json
{
  "title": "Board Meeting September 2026",
  "category": "meeting",
  "durationSeconds": 180,
  "audioBase64": "<base64_data>",
  "audioMimeType": "audio/mp3",
  "textFallback": "Optional transcript"
}
```

---

### `PATCH /api/v1/recordings/:id/speaker`
Renames a diarized speaker across all segments in the recording.

**Request Body:**
```json
{
  "speakerId": "spk_1",
  "newName": "Rahul Dev (Lead Architect)"
}
```

---

### `PATCH /api/v1/recordings/:id/segment`
Edits a single transcript segment's text for human-in-the-loop corrections.

**Request Body:**
```json
{
  "segmentId": "seg_1",
  "newText": "Corrected sentence text..."
}
```

---

### `POST /api/v1/recordings/:id/ask`
Performs semantic RAG question-answering over the transcript, returning factual answers with timestamp citations.

**Request Body:**
```json
{
  "query": "What did they discuss about the Word Error Rate?"
}
```

**Response:**
```json
{
  "answer": "Priya Sharma stated at [00:19] that after fine-tuning on 4,200 hours of regional audio, the Word Error Rate dropped from 14.2% down to 5.8%.",
  "timestampCitations": [
    {
      "timestamp": "00:19",
      "seconds": 19,
      "quote": "We successfully fine-tuned the acoustic model with 4,200 hours of Odia and Hindi conversational audio..."
    }
  ]
}
```

---

### `GET /api/v1/recordings/:id/export?format={txt|srt|vtt|md|json}`
Exports the transcript in the requested subtitle or document format.

- `?format=txt`: Plain text with speaker names and timestamps.
- `?format=srt`: SubRip subtitle file with millisecond timecodes (`00:00:00,000 --> 00:00:18,000`).
- `?format=vtt`: WebVTT subtitle format with `<v Speaker>` tags.
- `?format=md`: Formatted Markdown with executive summary, action items table, and full transcript.
- `?format=json`: Complete raw JSON payload.

---

### `GET /api/v1/analytics`
Returns platform-wide metrics: total recordings, transcribed minutes, storage used, Word Error Rate (WER), and language distribution.
