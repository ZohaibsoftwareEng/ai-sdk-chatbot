// Type for JSON-serializable data
export type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'agent';
  content: string;
  timestamp: Date;
  sender?: 'user' | 'ai' | 'agent';
  conversationId?: string;
  reasoning?: string;
  tools?: Array<{
    type: string;
    state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
    name: string;
    input?: JsonValue;
    output?: JsonValue;
  }>;
}

export interface TypingState {
  isTyping: boolean;
  sender?: string;
  agentName?: string;
}

export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  conversationId: string | null;
  agentPresent: boolean;
  queuePosition?: number;
}
