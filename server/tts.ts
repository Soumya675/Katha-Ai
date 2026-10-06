import { getGeminiClient } from './gemini.ts';

export interface TTSResult {
  audioBase64: string | null;
  mimeType: string;
  provider: 'gemini-3.8-flash-lite-tts' | 'katha-voice-future' | 'web-speech-synthesis';
  voiceName: string;
  durationEstimateSec: number;
}

export class KathaTTSProvider {
  /**
   * Generates natural speech using gemini-3.8-flash-lite-tts with fallback capability
   */
  static async synthesize(text: string, preferredVoice = 'Kore'): Promise<TTSResult> {
    const wordCount = text.split(/\s+/).length;
    const durationEstimateSec = Math.max(1, Math.round(wordCount / 2.5));

    const ai = getGeminiClient();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text,
                  speechMetadata: {
                    style: 'Warm, natural Indian voice assistant, polite and clear cadence',
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: preferredVoice },
              },
            },
          },
        });

        // Unary default returns complete WAV file as base64 in inlineData.data
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          return {
            audioBase64: base64Audio,
            mimeType: 'audio/wav',
            provider: 'gemini-3.8-flash-lite-tts',
            voiceName: preferredVoice,
            durationEstimateSec,
          };
        }
      } catch (err) {
        console.warn('Gemini 3.8 TTS generation note:', err);
      }
    }

    // When server audio is unavailable or offline, mark for client synthesis
    return {
      audioBase64: null,
      mimeType: 'audio/wav',
      provider: 'web-speech-synthesis',
      voiceName: 'Katha Voice Indian (Client Synth)',
      durationEstimateSec,
    };
  }
}
