// Session Types
export interface ChatSession {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  messages: SessionMessage[];
  isActive: boolean;
  userId: string;
  metadata?: Record<string, any>;
}

export interface SessionMessage {
  id: string;
  text: string;
  role: 'user' | 'model';
  timestamp: number;
  sessionId: string;
  attachments?: any[];
  metadata?: Record<string, any>;
}

export interface SessionStats {
  totalSessions: number;
  totalMessages: number;
  activeSessions: number;
  averageMessagesPerSession: number;
  totalUserMessages: number;
  totalModelMessages: number;
  recentActivity?: {
    lastMessageAt: number;
    sessionsCreatedToday: number;
    messagesSentToday: number;
  };
}

export interface SessionSearchParams {
  query: string;
  sessionId?: string;
  limit?: number;
  dateRange?: {
    start: number;
    end: number;
  };
}

export interface SessionCreateRequest {
  sessionName?: string;
  metadata?: Record<string, any>;
}

export interface SessionUpdateRequest {
  sessionId: string;
  sessionName?: string;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface SessionWithMessages {
  session: ChatSession;
  messages: SessionMessage[];
}

export interface SessionSearchResult {
  sessionId: string;
  sessionName: string;
  matchedMessages: SessionMessage[];
  relevanceScore: number;
} 