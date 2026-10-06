import { SupportedLanguage } from '../src/types/index.ts';

interface LanguageDetectionResult {
  language: SupportedLanguage;
  displayName: string;
  confidence: number;
  isCodeSwitched: boolean;
  script: 'Latin' | 'Devanagari' | 'Odia' | 'Bengali' | 'Telugu' | 'Tamil' | 'Kannada' | 'Gujarati' | 'Mixed';
}

const DEVANAGARI_REGEX = /[\u0900-\u097F]/;
const ODIA_REGEX = /[\u0B00-\u0B7F]/;
const BENGALI_REGEX = /[\u0980-\u09FF]/;
const GUJARATI_REGEX = /[\u0A80-\u0AFF]/;
const TELUGU_REGEX = /[\u0C00-\u0C7F]/;
const KANNADA_REGEX = /[\u0C80-\u0CFF]/;
const TAMIL_REGEX = /[\u0B80-\u0BFF]/;

// Specific markers for Odia transliteration (Odianglish)
const ODIA_MARKERS = [
  /\b(ku|re|achhi|nahi|kahiba|kariba|deba|thila|hele|bhalase|sate|janiba|asiba|jibaa|tike|au)\b/i,
  /\b\w+ku\b/i, // e.g. "Rahulku"
  /\b\w+re\b/i, // e.g. "office re", "3 PM re"
  /\b\w+kari\b/i, // e.g. "message kari"
];

// Specific markers for Hindi transliteration (Hinglish)
const HINGLISH_MARKERS = [
  /\b(hai|hain|karo|karna|hoga|raha|rahi|mujhe|tum|mera|meri|hum|bhai|yaar|kal|aaj|parson|bhejo|sun|kya|kyun|kaise)\b/i,
  /\b(kardo|karenge|bolna|batao|chahiye|shukriya|namaste)\b/i,
];

export function detectLanguage(text: string): LanguageDetectionResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      language: 'en',
      displayName: 'English',
      confidence: 1.0,
      isCodeSwitched: false,
      script: 'Latin',
    };
  }

  // 1. Script checks
  if (ODIA_REGEX.test(trimmed)) {
    return {
      language: 'or',
      displayName: 'Odia (ଓଡ଼ିଆ)',
      confidence: 0.98,
      isCodeSwitched: false,
      script: 'Odia',
    };
  }

  if (DEVANAGARI_REGEX.test(trimmed)) {
    // Check if Marathi specific or Hindi
    const isMarathi = /\b(आहे|झाले|करावे|नाही|काय|कसे|केले)\b/.test(trimmed);
    return {
      language: isMarathi ? 'mr' : 'hi',
      displayName: isMarathi ? 'Marathi (मराठी)' : 'Hindi (हिंदी)',
      confidence: 0.96,
      isCodeSwitched: false,
      script: 'Devanagari',
    };
  }

  if (BENGALI_REGEX.test(trimmed)) {
    return {
      language: 'bn',
      displayName: 'Bengali (বাংলা)',
      confidence: 0.97,
      isCodeSwitched: false,
      script: 'Bengali',
    };
  }

  if (TELUGU_REGEX.test(trimmed)) {
    return {
      language: 'te',
      displayName: 'Telugu (తెలుగు)',
      confidence: 0.97,
      isCodeSwitched: false,
      script: 'Telugu',
    };
  }

  if (TAMIL_REGEX.test(trimmed)) {
    return {
      language: 'ta',
      displayName: 'Tamil (தமிழ்)',
      confidence: 0.97,
      isCodeSwitched: false,
      script: 'Tamil',
    };
  }

  if (KANNADA_REGEX.test(trimmed)) {
    return {
      language: 'kn',
      displayName: 'Kannada (ಕನ್ನಡ)',
      confidence: 0.97,
      isCodeSwitched: false,
      script: 'Kannada',
    };
  }

  if (GUJARATI_REGEX.test(trimmed)) {
    return {
      language: 'gu',
      displayName: 'Gujarati (ગુજરાતી)',
      confidence: 0.97,
      isCodeSwitched: false,
      script: 'Gujarati',
    };
  }

  // 2. Check for Latin-script Indian Code-Switching
  const odiaScore = ODIA_MARKERS.reduce((acc, regex) => acc + (regex.test(trimmed) ? 1 : 0), 0);
  const hinglishScore = HINGLISH_MARKERS.reduce((acc, regex) => acc + (regex.test(trimmed) ? 1 : 0), 0);

  if (odiaScore >= 1) {
    return {
      language: 'odianglish',
      displayName: 'Odia-English Mixed (Odianglish)',
      confidence: Math.min(0.85 + odiaScore * 0.05, 0.98),
      isCodeSwitched: true,
      script: 'Mixed',
    };
  }

  if (hinglishScore >= 1) {
    return {
      language: 'hinglish',
      displayName: 'Hinglish (Hindi + English)',
      confidence: Math.min(0.85 + hinglishScore * 0.05, 0.98),
      isCodeSwitched: true,
      script: 'Mixed',
    };
  }

  // 3. Default to English (standard Latin)
  return {
    language: 'en',
    displayName: 'English',
    confidence: 0.95,
    isCodeSwitched: false,
    script: 'Latin',
  };
}
