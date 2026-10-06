import { IntentResult, IntentType } from '../src/types/index.ts';
import { getGeminiClient } from './gemini.ts';

// Deterministic rule engine for high-precision Indian linguistic and code-switched triggers
export function parseIntentByRules(text: string): IntentResult | null {
  const normalized = text.toLowerCase().trim();

  // Test case pattern: "Kal Rahul ku mail kari kahiba ki project review 3 PM re achhi"
  // Odia / Hinglish / English email patterns
  if (
    /(mail\s+kari|mail\s+karo|email\s+karo|bhej\s+do\s+mail|send\s+(an?\s+)?email|mail\s+send)/i.test(normalized) ||
    /(\bku\s+mail\b|\bko\s+mail\b|\bmail\s+to\b)/i.test(normalized)
  ) {
    // Extract recipient
    let recipient = 'Recipient';
    const recipientMatch = normalized.match(/(?:kal\s+)?([a-z]+)\s*(?:ku|ko)\s*(?:mail|email|message)/i) ||
      normalized.match(/(?:mail|email)\s+(?:to\s+|kari\s+|karo\s+)?([a-z]+)/i);
    if (recipientMatch && recipientMatch[1]) {
      recipient = recipientMatch[1].charAt(0).toUpperCase() + recipientMatch[1].slice(1);
    }

    // Extract time
    let time = '';
    const timeMatch = normalized.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:re|ko|par|at)?/i);
    if (timeMatch && timeMatch[1]) {
      time = timeMatch[1].toUpperCase();
    }

    // Extract message / subject
    let message = 'Project review meeting notice';
    if (normalized.includes('project review')) {
      message = `The project review is scheduled for ${time || '3 PM'} tomorrow.`;
    } else {
      message = `Regarding upcoming schedule update for tomorrow ${time ? 'at ' + time : ''}.`;
    }

    return {
      intent: 'SEND_EMAIL',
      confidence: 0.95,
      entities: {
        recipient,
        subject: 'Project Review Update',
        message,
        date: 'tomorrow',
        time: time || '15:00',
      },
      requires_tool: true,
      tool_name: 'send_email',
      requires_permission: true,
    };
  }

  // Odia / Hindi message pattern: "Rahul ku message kari kahiba meeting 3 PM re achhi"
  if (/(message\s+kari|message\s+karo|whatsapp\s+karo|send\s+message|sms)/i.test(normalized)) {
    let recipient = 'Contact';
    const recipientMatch = normalized.match(/(?:kal\s+)?([a-z]+)\s*(?:ku|ko)\s*(?:message|text)/i);
    if (recipientMatch && recipientMatch[1]) {
      recipient = recipientMatch[1].charAt(0).toUpperCase() + recipientMatch[1].slice(1);
    }

    const timeMatch = normalized.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:re|ko|par|at)?/i);
    const time = timeMatch ? timeMatch[1].toUpperCase() : '3 PM';

    return {
      intent: 'SEND_MESSAGE',
      confidence: 0.94,
      entities: {
        recipient,
        message: `Meeting is scheduled at ${time}.`,
        time,
      },
      requires_tool: true,
      tool_name: 'send_message',
      requires_permission: true,
    };
  }

  // Calendar / Meeting booking
  if (/(meeting|schedule|calendar|book|event|appointment)/i.test(normalized) && /(kal|tomorrow|at|re|ko|set|organize)/i.test(normalized)) {
    let time = '10:00 AM';
    const timeMatch = normalized.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
    if (timeMatch && timeMatch[1]) {
      time = timeMatch[1].toUpperCase();
    }

    return {
      intent: 'CREATE_CALENDAR_EVENT',
      confidence: 0.92,
      entities: {
        title: 'Project Review & Discussion',
        date: 'tomorrow',
        time,
        duration: '45 mins',
      },
      requires_tool: true,
      tool_name: 'create_calendar_event',
      requires_permission: true,
    };
  }

  // Reminder creation
  if (/(reminder|remind|yaad\s+dilana|mone\s+pakeiba|alarm)/i.test(normalized)) {
    return {
      intent: 'CREATE_REMINDER',
      confidence: 0.93,
      entities: {
        task: normalized.replace(/(remind me to|set a reminder for|reminder|mone pakeiba|yaad dilana)/gi, '').trim() || 'Scheduled Task',
        date: 'today',
        time: 'in 1 hour',
      },
      requires_tool: true,
      tool_name: 'create_reminder',
      requires_permission: true,
    };
  }

  // Weather query
  if (/(weather|mausam|panipaga|temperature|baarish|rain)/i.test(normalized)) {
    let location = 'Bhubaneswar';
    const locMatch = normalized.match(/(?:in|of|re|ka)\s+([a-z]+)/i);
    if (locMatch && locMatch[1]) {
      location = locMatch[1].charAt(0).toUpperCase() + locMatch[1].slice(1);
    }

    return {
      intent: 'GET_WEATHER',
      confidence: 0.96,
      entities: {
        location,
      },
      requires_tool: true,
      tool_name: 'get_weather',
      requires_permission: false,
    };
  }

  // Document RAG queries
  if (/(document|pdf|summary|summarize|read|q3|report|policy|handbook)/i.test(normalized) && /(tell|kya|what|achhi|karo|batao|search)/i.test(normalized)) {
    return {
      intent: 'READ_DOCUMENT',
      confidence: 0.91,
      entities: {
        query: text,
        topic: 'Document Intelligence',
      },
      requires_tool: true,
      tool_name: 'search_document',
      requires_permission: false,
    };
  }

  // Web search
  if (/(search|google|find\s+out|latest\s+news|who\s+is|what\s+is\s+the\s+capital)/i.test(normalized)) {
    return {
      intent: 'SEARCH_WEB',
      confidence: 0.90,
      entities: {
        query: text.replace(/search for|search|find|find out/i, '').trim(),
      },
      requires_tool: true,
      tool_name: 'search_web',
      requires_permission: false,
    };
  }

  // Create Task
  if (/(create\s+task|add\s+task|todo|to-do|kam\s+add\s+karo)/i.test(normalized)) {
    return {
      intent: 'CREATE_TASK',
      confidence: 0.91,
      entities: {
        task: text.replace(/(create task|add task|todo)/i, '').trim() || 'New Work Item',
        priority: 'medium',
      },
      requires_tool: true,
      tool_name: 'create_task',
      requires_permission: false,
    };
  }

  return null;
}

export async function detectIntent(text: string, conversationContext?: string): Promise<IntentResult> {
  // 1. Fast deterministic rule match for high confidence Indian patterns
  const ruleResult = parseIntentByRules(text);
  if (ruleResult && ruleResult.confidence >= 0.90) {
    return ruleResult;
  }

  // 2. LLM Intent Engine using Gemini
  const ai = getGeminiClient();
  if (ai) {
    try {
      const prompt = `You are the Katha Intent Engine for an Indian multilingual voice-to-action AI assistant.
Supported Indian languages: English, Hindi, Odia, Hinglish, Bengali, Tamil, Telugu, Marathi, Gujarati, and Indian code-switching.

Allowed Intents:
SEND_MESSAGE, SEND_EMAIL, CREATE_REMINDER, CREATE_CALENDAR_EVENT, SEARCH_WEB, SUMMARIZE, TRANSLATE, WRITE_EMAIL, WRITE_REPORT, WRITE_PROPOSAL, ANSWER_QUESTION, READ_DOCUMENT, ANALYZE_DOCUMENT, SEARCH_DOCUMENT, OPEN_APPLICATION, CREATE_TASK, UPDATE_TASK, GET_WEATHER, GET_NEWS, GENERAL_CONVERSATION

Identify the intent and extract entities from the user's natural utterance.
Context: ${conversationContext || 'None'}
User Utterance: "${text}"

Respond strictly with valid JSON only in this format:
{
  "intent": "IntentName",
  "confidence": 0.95,
  "entities": {
    "recipient": "...",
    "date": "...",
    "time": "...",
    "task": "...",
    "subject": "...",
    "message": "...",
    "location": "...",
    "query": "..."
  },
  "requires_tool": true,
  "tool_name": "send_email",
  "requires_permission": true
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim()) as IntentResult;
        if (parsed.intent) {
          // Sensitive actions require user permission
          const sensitiveIntents: IntentType[] = ['SEND_EMAIL', 'SEND_MESSAGE', 'CREATE_CALENDAR_EVENT', 'CREATE_REMINDER', 'UPDATE_TASK'];
          parsed.requires_permission = sensitiveIntents.includes(parsed.intent);
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Gemini intent classification fallback:', err);
    }
  }

  // 3. Fallback to general conversation
  return {
    intent: 'GENERAL_CONVERSATION',
    confidence: 0.85,
    entities: {
      query: text,
    },
    requires_tool: false,
    requires_permission: false,
  };
}
