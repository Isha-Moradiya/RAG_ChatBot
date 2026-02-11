// Chat Types
export interface ChatMessage {
  id: string;
  text: string;
  role: 'user' | 'model' | 'system';
  timestamp: number;
  sessionId?: string;
  attachments?: Attachment[];
  metadata?: Record<string, any>;
}

export interface Attachment {
  id: string;
  type: 'image' | 'document' | 'file' | string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  isImage?: boolean;
  data?: string; // base64 data for images
  metadata?: Record<string, any>;
}

export interface ChatRequest {
  messages: ChatMessage[];
  sessionId?: string;
  attachments?: Attachment[];
  options?: ChatOptions;
}

export interface ChatResponse {
  reply: string;
  sessionId: string;
  sessionName: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, any>;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  model?: string;
}

export interface ChatHistory {
  sessionId: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
} 