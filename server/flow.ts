import { getGeminiClient } from './gemini.ts';
import { detectLanguage } from './language.ts';

export type FlowMode =
  | 'smart_clean'
  | 'numbered_list'
  | 'paragraph_format'
  | 'bullet_notes'
  | 'email_draft'
  | 'code_cursor'
  | 'whatsapp_chat'
  | 'verbatim';

export type AppTarget = 'gmail' | 'docs' | 'notion' | 'whatsapp' | 'cursor' | 'generic';

export interface FlowPolishRequest {
  rawText: string;
  mode: FlowMode;
  appTarget?: AppTarget;
  contextHint?: string;
  customVocabulary?: string[];
  whisperMode?: boolean;
}

export interface FlowPolishResponse {
  rawText: string;
  polishedText: string;
  mode: FlowMode;
  appTarget: AppTarget;
  detectedLanguage: string;
  wordCount: number;
  charsSaved: number;
  wpm: number;
  timeSavedSeconds: number;
  hadCorrection: boolean;
  correctionExplanation?: string;
}

// Common Indian and technical terms recognized out-of-the-box
export const DEFAULT_INDIAN_TERMINOLOGY = [
  'Soumya Parida',
  'Rahul',
  'Priyadarshi',
  'Sambalpur',
  'Bhubaneswar',
  'Cuttack',
  'Odisha',
  'GIFT',
  'pgvector',
  'Silero VAD',
  'FastAPI',
  'PostgreSQL',
  'Hinglish',
  'Odianglish',
  'Katha AI',
  'Wispr Flow',
  'IVFFlat',
  'PyTorch',
  'Whisper',
];

export class KathaWisprFlowEngine {
  static async polishSpeech(req: FlowPolishRequest): Promise<FlowPolishResponse> {
    const raw = (req.rawText || '').trim();
    const appTarget = req.appTarget || 'generic';

    if (!raw) {
      return {
        rawText: '',
        polishedText: '',
        mode: req.mode,
        appTarget,
        detectedLanguage: 'English',
        wordCount: 0,
        charsSaved: 0,
        wpm: 0,
        timeSavedSeconds: 0,
        hadCorrection: false,
      };
    }

    const langInfo = detectLanguage(raw);
    const wordCount = raw.split(/\s+/).filter(Boolean).length;
    const timeSavedSeconds = Math.max(2, Math.round((wordCount / 40) * 60 - (wordCount / 150) * 60));

    // Check if raw speech contains mid-utterance correction signals
    const correctionRegex = /\b(no,\s*sorry|no\s+sorry|sorry\s+I\s+mean|wait,\s*no|wait\s+no|scratch\s+that|actually\s+make\s+it|or\s+rather|nahi\s+nahi|nahi|sorry|wait)\b/i;
    const likelyHadCorrection = correctionRegex.test(raw);

    if (req.mode === 'verbatim') {
      return {
        rawText: raw,
        polishedText: raw,
        mode: req.mode,
        appTarget,
        detectedLanguage: langInfo.displayName,
        wordCount,
        charsSaved: 0,
        wpm: 145,
        timeSavedSeconds,
        hadCorrection: false,
      };
    }

    const ai = getGeminiClient();
    if (ai) {
      try {
        const vocabList = [...DEFAULT_INDIAN_TERMINOLOGY, ...(req.customVocabulary || [])].join(', ');

        const systemInstruction = `You are Wispr Flow AI, the state-of-the-art voice-to-text intelligence and real-time speech cleanup engine for Katha AI.
Your superpower is turning messy, rambling, natural human speech into crystal-clear, beautifully formatted text in any text field or application.

PRIMARY CLEANUP RULES (CRITICAL):
1. UNDERSTAND SELF-CORRECTIONS & BACKTRACKS:
   When speakers self-correct mid-sentence, remove the discarded mistake and keep ONLY the final intended thought.
   - Example: "Um, actually let's meet at 2... no, sorry, 3 PM tomorrow." -> Output: "Let's meet at 3 PM tomorrow."
   - Example: "Send this to Priya... wait no, send it to Rahul." -> Output: "Send this to Rahul."
   - Example: "Kal 4 baje... nahi nahi 3 baje review meeting achhi." -> Output: "Kal 3 baje review meeting achhi."
   The raw mistake must NEVER appear in the polished text!

2. AUTOMATIC FILLER-WORD & REPETITION REMOVAL:
   - Remove all filler words: "um", "uh", "err", "ah", "like", "you know", "basically", "so yeah", "actually", "I mean".
   - Eliminate stutters and repeated words ("we we need to" -> "we need to").

3. UNDERSTAND NATURAL PAUSES & PUNCTUATION:
   - Insert natural periods, commas, question marks, and capitalization.
   - Fix obvious grammatical slips while strictly preserving the speaker's authentic voice, tone, and intended meaning.

4. PRESERVE INDIAN CODE-SWITCHING & MULTILINGUAL AUTHENTICITY:
   - Preserve natural mixed languages (Odia, Hindi, English, Hinglish, Odianglish).
   - DO NOT forcibly translate Hindi/Odia phrases into standard English unless requested.
   - Correctly capitalize Indian names and places: ${vocabList}.

TARGET APPLICATION STYLES:
- 'gmail': Professional email structure (Subject line, concise greeting, readable paragraphs, sign-off).
- 'docs': Well-formatted narrative with clear paragraph transitions.
- 'notion': Clean markdown with headings, bullet points, or checklists.
- 'whatsapp': Direct conversational prose with friendly formatting and natural line breaks.
- 'cursor': Concise developer prompt or code documentation comment.
- 'generic': Direct clean text ready to paste anywhere.

FORMATTING MODES:
- 'smart_clean': Polished sentence/paragraph text with all disfluencies and mistakes removed.
- 'numbered_list': Clear sequentially numbered steps (1., 2., 3.) when procedures, sequences, or multiple points are spoken.
- 'paragraph_format': Auto-divided into readable paragraphs with blank line separators for long monologues.
- 'bullet_notes': Concise bullet points (•) capturing all actionable takeaways.
- 'email_draft': Complete ready-to-send email.
- 'code_cursor': Developer prompt / docstring.
- 'whatsapp_chat': Message with short lines.

OUTPUT CONSTRAINT:
Output ONLY the final polished text. Do NOT include markdown code blocks, preamble, or quotes.`;

        const promptText = `Spoken transcript to clean and format:
"${raw}"

Format Mode: ${req.mode}
Target Application: ${appTarget}
Context / Context Hint: ${req.contextHint || 'General dictation'}
Whisper Mode Active: ${req.whisperMode ? 'Yes (audio was spoken softly)' : 'No'}`;

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI generation timeout')), 1800)
        );

        const response: any = await Promise.race([
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: promptText,
            config: {
              systemInstruction,
              temperature: 0.15,
            },
          }),
          timeoutPromise,
        ]);

        let polished = response.text ? response.text.trim() : '';
        if (polished.startsWith('"') && polished.endsWith('"')) {
          polished = polished.slice(1, -1).trim();
        }

        if (polished.length > 0) {
          const charsSaved = Math.max(0, raw.length - polished.length);
          return {
            rawText: raw,
            polishedText: polished,
            mode: req.mode,
            appTarget,
            detectedLanguage: langInfo.displayName,
            wordCount,
            charsSaved,
            wpm: 155,
            timeSavedSeconds,
            hadCorrection: likelyHadCorrection,
            correctionExplanation: likelyHadCorrection
              ? 'Mid-speech self-correction resolved and false starts pruned.'
              : undefined,
          };
        }
      } catch (err) {
        // Fall back to robust NLP rule engine below
      }
    }

    // High-Precision NLP Rule-Based Engine (Guaranteed zero-dependency fallback)
    const cleaned = this.applyRuleBasedCleanup(raw, req.mode, appTarget);
    const charsSaved = Math.max(0, raw.length - cleaned.length);

    return {
      rawText: raw,
      polishedText: cleaned,
      mode: req.mode,
      appTarget,
      detectedLanguage: langInfo.displayName,
      wordCount,
      charsSaved,
      wpm: 145,
      timeSavedSeconds,
      hadCorrection: likelyHadCorrection,
      correctionExplanation: likelyHadCorrection
        ? 'Mid-speech self-correction resolved and false starts pruned.'
        : undefined,
    };
  }

  private static applyRuleBasedCleanup(raw: string, mode: FlowMode, appTarget: AppTarget): string {
    let text = raw.trim();

    // 1. Resolve mid-utterance self-corrections & backtracks
    // E.g. "at 2... no, sorry, 3" -> "at 3"
    // E.g. "4 PM... nahi nahi 3 PM" -> "3 PM"
    // E.g. "send this to Priya... wait no, send it to Rahul" -> "send it to Rahul"
    text = text.replace(
      /(\b(?:\d+\s*(?:AM|PM|baje|o'clock)?|[a-zA-Z0-9_-]+)\s*(?:AM|PM|baje)?)\s*(?:\.{2,3}|,)?\s*(?:no,\s*sorry|no\s+sorry|sorry\s+I\s+mean|wait,\s*no|wait\s+no|scratch\s+that|actually\s+make\s+it|or\s+rather|nahi\s+nahi|nahi|wait)\s*,?\s*/gi,
      ''
    );

    // 2. Remove filler words in multiple passes
    const fillerRegex = /(?:^|[\s,])+(?:um+|uh+|err+|ah+|like|you know|basically|so yeah|actually|I mean)(?:[\s,]+|\.{2,3}|$)/gi;
    text = text.replace(fillerRegex, ' ');
    text = text.replace(fillerRegex, ' ');
    text = text.replace(/^(?:um|uh|actually|basically|so yeah|you know)[\s,]+/gi, '');

    // 3. Remove stuttered word repetitions ('the the' -> 'the', 'we we' -> 'we')
    text = text.replace(/\b(\w+)\s+\1\b/gi, '$1');

    // 4. Clean up spaces and punctuation
    text = text
      .replace(/\s*([,.;?!])\s*/g, '$1 ')
      .replace(/\s{2,}/g, ' ')
      .replace(/^\s*[,.;?!]\s*/, '')
      .trim();

    // 5. Ensure proper capitalization
    if (text.length > 0) {
      text = text.charAt(0).toUpperCase() + text.slice(1);
    }

    // 6. Mode & Target Specific Transformations
    if (mode === 'numbered_list') {
      // Split on sequence keywords: 'first', 'second', 'third', 'then', 'and then', 'next', 'finally'
      const items = text
        .split(/\b(?:firstly|first|secondly|second|thirdly|third|then|and then|next|finally|also)\b/i)
        .map((s) => s.replace(/^[,:\s]+/, '').replace(/[,.;\s]+$/, '').trim())
        .filter((s) => s.length > 0);

      if (items.length > 1) {
        return items
          .map((item, idx) => `${idx + 1}. ${item.charAt(0).toUpperCase() + item.slice(1)}.`)
          .join('\n');
      }
      return `1. ${text}`;
    }

    if (mode === 'bullet_notes') {
      const sentences = text
        .split(/(?<=[.?!])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (sentences.length > 1) {
        return sentences.map((s) => `• ${s}`).join('\n');
      }
      return `• ${text}`;
    }

    if (mode === 'email_draft' || appTarget === 'gmail') {
      const firstSentence = text.split(/[.?!]/)[0] || 'Update';
      const subject = firstSentence.length > 50 ? `${firstSentence.slice(0, 47)}...` : firstSentence;
      return `Subject: ${subject}\n\nHi,\n\n${text}\n\nBest regards,\nSoumya`;
    }

    if (mode === 'whatsapp_chat' || appTarget === 'whatsapp') {
      return text;
    }

    if (mode === 'code_cursor' || appTarget === 'cursor') {
      return `// ${text}`;
    }

    if (mode === 'paragraph_format' || appTarget === 'docs') {
      // Auto-paragraph every 2-3 sentences
      const sentences = text.split(/(?<=[.?!])\s+/);
      const paragraphs: string[] = [];
      for (let i = 0; i < sentences.length; i += 2) {
        paragraphs.push(sentences.slice(i, i + 2).join(' '));
      }
      return paragraphs.join('\n\n');
    }

    if (!/[.?!]$/.test(text)) {
      text += '.';
    }

    return text;
  }
}
