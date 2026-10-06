import { UserMemoryItem } from '../src/types/index.ts';

// In-memory persistent cache mirroring PostgreSQL + pgvector user_memory table
let longTermMemories: UserMemoryItem[] = [
  {
    id: 'mem_1',
    category: 'preference',
    key: 'preferred_language',
    value: 'Odia and English mixed (Odianglish) / Hindi',
    user_consented: true,
    confidence: 1.0,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mem_2',
    category: 'work_context',
    key: 'primary_role',
    value: 'Engineering Lead & AI Systems Architect at GIFT Technical Campus',
    user_consented: true,
    confidence: 0.98,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mem_3',
    category: 'communication_style',
    key: 'response_style',
    value: 'Concise, action-first, polite with culturally authentic tone',
    user_consented: true,
    confidence: 0.95,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mem_4',
    category: 'personal_fact',
    key: 'timezone_and_location',
    value: 'Asia/Kolkata (IST), Bhubaneswar, Odisha, India',
    user_consented: true,
    confidence: 1.0,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Short-term conversation store
const sessionContextMap: Map<string, { lastUtterance?: string; lastIntent?: string; pendingEntitySlot?: string; dialogueTurns: { role: string; text: string }[] }> = new Map();

export class KathaMemoryEngine {
  static getSessionContext(sessionId: string) {
    if (!sessionContextMap.has(sessionId)) {
      sessionContextMap.set(sessionId, { dialogueTurns: [] });
    }
    return sessionContextMap.get(sessionId)!;
  }

  static appendTurn(sessionId: string, role: string, text: string) {
    const ctx = this.getSessionContext(sessionId);
    ctx.dialogueTurns.push({ role, text });
    if (ctx.dialogueTurns.length > 20) {
      ctx.dialogueTurns.shift();
    }
  }

  static getRecentContext(sessionId: string): string {
    const ctx = this.getSessionContext(sessionId);
    return ctx.dialogueTurns
      .slice(-6)
      .map((t) => `${t.role}: ${t.text}`)
      .join('\n');
  }

  static getLongTermMemories(onlyConsented = true): UserMemoryItem[] {
    if (onlyConsented) {
      return longTermMemories.filter((m) => m.user_consented);
    }
    return longTermMemories;
  }

  static addMemory(item: Omit<UserMemoryItem, 'id' | 'created_at' | 'updated_at'>): UserMemoryItem {
    const newMemory: UserMemoryItem = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...item,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    longTermMemories.push(newMemory);
    return newMemory;
  }

  static updateMemoryConsent(id: string, consented: boolean): boolean {
    const mem = longTermMemories.find((m) => m.id === id);
    if (mem) {
      mem.user_consented = consented;
      mem.updated_at = new Date().toISOString();
      return true;
    }
    return false;
  }

  static deleteMemory(id: string): boolean {
    const initLen = longTermMemories.length;
    longTermMemories = longTermMemories.filter((m) => m.id !== id);
    return longTermMemories.length < initLen;
  }

  static getRelevantMemoriesForPrompt(query: string): string {
    const consented = this.getLongTermMemories(true);
    if (consented.length === 0) return '';
    return consented
      .map((m) => `- [${m.category}] ${m.key}: ${m.value}`)
      .join('\n');
  }
}
