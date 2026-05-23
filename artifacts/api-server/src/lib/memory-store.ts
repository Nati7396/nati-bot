interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface ChatMemory {
  messages: ConversationMessage[];
  lastSeen: number;
}

const store = new Map<string, ChatMemory>();

const MAX_MESSAGES = 30;
const TTL_MS = 24 * 60 * 60 * 1000;

export function getHistory(chatId: string): ConversationMessage[] {
  const mem = store.get(chatId);
  if (!mem) return [];
  if (Date.now() - mem.lastSeen > TTL_MS) {
    store.delete(chatId);
    return [];
  }
  return mem.messages;
}

export function addMessage(
  chatId: string,
  role: "user" | "assistant",
  content: string,
): void {
  let mem = store.get(chatId);
  if (!mem) {
    mem = { messages: [], lastSeen: Date.now() };
    store.set(chatId, mem);
  }
  mem.messages.push({ role, content, timestamp: Date.now() });
  mem.lastSeen = Date.now();
  if (mem.messages.length > MAX_MESSAGES) {
    mem.messages = mem.messages.slice(-MAX_MESSAGES);
  }
}

export function clearHistory(chatId: string): void {
  store.delete(chatId);
}
