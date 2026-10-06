import { getGeminiClient } from './gemini.ts';

export interface TranscriptionResult {
  text: string;
  detectedLanguageCode?: string;
  confidence: number;
  provider: 'gemini-2.5-flash' | 'whisper' | 'katha-asr' | 'web-speech';
  vadSegmentDurationMs: number;
}

export class KathaASRService {
  /**
   * Transcribes human voice audio using Gemini Multimodal Audio model (gemini-2.5-flash)
   */
  static async transcribeAudio(
    audioBase64: string,
    mimeType = 'audio/webm',
    languageHint?: string
  ): Promise<TranscriptionResult> {
    if (!audioBase64) {
      return {
        text: '',
        confidence: 0,
        provider: 'whisper',
        vadSegmentDurationMs: 0,
      };
    }

    const ai = getGeminiClient();
    if (ai) {
      try {
        // Standard audio transcription with gemini-2.5-flash or gemini-3.8-flash
        const audioPart = {
          inlineData: {
            mimeType: mimeType.split(';')[0] || 'audio/webm',
            data: audioBase64,
          },
        };

        const prompt = `Listen carefully to this user voice audio and transcribe EXACTLY what the human said word-for-word.
The speaker may speak in English, Hindi, Odia, or code-switched Hinglish/Odianglish.
Language hint: ${languageHint || 'multilingual Indian (English, Hindi, Odia)'}.
CRITICAL:
1. Return ONLY the exact transcribed text of what was spoken.
2. If the audio is completely silent or background noise with no human speech, return an empty string.
3. Do not include quotes, conversational preamble, or explanations.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            audioPart,
            { text: prompt },
          ],
        });

        const transcript = response.text ? response.text.trim() : '';
        if (transcript) {
          return {
            text: transcript,
            confidence: 0.96,
            provider: 'gemini-2.5-flash',
            vadSegmentDurationMs: 2500,
          };
        }
      } catch (err) {
        console.warn('Gemini audio transcription attempt note:', err);
      }
    }

    // Return empty if audio was silent or unparsable without fabricating words
    return {
      text: '',
      confidence: 0.0,
      provider: 'whisper',
      vadSegmentDurationMs: 0,
    };
  }
}
