import { get, post, put, del } from "./requestService";
import {
  ChatSession,
  SessionMessage,
  SessionStats,
  SessionWithMessages,
  ApiResponse,
} from "../types";

// Create a new chat session
export async function createSession(
  sessionName?: string
): Promise<ChatSession> {
  try {
    const response = await post<{ session: any }>("/sessions", {
      sessionName: sessionName || `Chat ${new Date().toLocaleDateString()}`,
    });
    if (response.success && response.data?.session) {
      const session = response.data.session;
      return {
        id: session._id || session.id,
        name: session.name,
        createdAt: new Date(session.createdAt).getTime(),
        updatedAt: new Date(session.updatedAt).getTime(),
        messages: session.messages || [],
        messageCount: session.messageCount || 0,
        isActive: session.isActive || true,
        userId: session.userId,
        metadata: session.metadata,
      };
    }
    throw new Error("Failed to create session");
  } catch (error) {
    console.error("Error creating session:", error);
    throw error;
  }
}

// Get all chat sessions for the current user
export async function getSessions(limit: number = 50): Promise<ChatSession[]> {
  try {
    const response = await get<{ sessions: any[] }>(
      `/sessions?action=list&limit=${limit}`
    );
    if (response.success && response.data?.sessions) {
      return response.data.sessions.map((session: any) => ({
        id: session._id || session.id,
        name: session.name,
        createdAt: new Date(session.createdAt).getTime(),
        updatedAt: new Date(session.updatedAt).getTime(),
        messages: session.messages || [],
        messageCount: session.messageCount || 0,
        isActive: session.isActive || true,
        userId: session.userId,
        metadata: session.metadata,
      }));
    }
    throw new Error("Failed to get sessions");
  } catch (error) {
    console.error("Error getting sessions:", error);
    throw error;
  }
}

// Get a specific chat session with messages
export async function getSession(
  sessionId: string,
  messageLimit: number = 100
): Promise<SessionWithMessages> {
  try {
    const response = await get<{ session: any; messages: any[] }>(
      `/sessions?action=get&sessionId=${sessionId}&limit=${messageLimit}`
    );
    if (response.success && response.data?.session && response.data?.messages) {
      return {
        session: {
          id: response.data.session._id || response.data.session.id,
          name: response.data.session.name,
          createdAt: new Date(response.data.session.createdAt).getTime(),
          updatedAt: new Date(response.data.session.updatedAt).getTime(),
          messages: response.data.session.messages || [],
          messageCount: response.data.session.messageCount || 0,
          isActive: response.data.session.isActive || true,
          userId: response.data.session.userId,
          metadata: response.data.session.metadata,
        },
        messages: response.data.messages.map((msg: any) => ({
          id: msg._id || msg.id,
          text: msg.text,
          role: msg.role,
          timestamp: new Date(msg.timestamp).getTime(),
          sessionId: msg.sessionId,
          attachments: msg.attachments || [],
          metadata: msg.metadata,
        })),
      };
    }
    throw new Error("Failed to get session");
  } catch (error) {
    console.error("Error getting session:", error);
    throw error;
  }
}

// Update session name
export async function updateSessionName(
  sessionId: string,
  newName: string
): Promise<boolean> {
  try {
    const response = await put("/sessions", {
      sessionId,
      sessionName: newName,
    });
    if (response.success) {
      return true;
    }
    throw new Error(response.data?.message || "Failed to update session name");
  } catch (error) {
    console.error("Error updating session name:", error);
    throw error;
  }
}

// Delete a chat session
export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    const response = await del(`/sessions?sessionId=${sessionId}`);
    if (response.success) {
      return true;
    }
    throw new Error(response.data?.message || "Failed to delete session");
  } catch (error) {
    console.error("Error deleting session:", error);
    throw error;
  }
}

// Get session statistics
export async function getSessionStats(): Promise<SessionStats> {
  try {
    const response = await get<{ stats: any }>("/sessions?action=stats");
    if (response.success && response.data?.stats) {
      return {
        totalSessions: response.data.stats.totalSessions || 0,
        totalMessages: response.data.stats.totalMessages || 0,
        activeSessions: response.data.stats.activeSessions || 0,
        averageMessagesPerSession:
          response.data.stats.averageMessagesPerSession || 0,
        totalUserMessages: response.data.stats.totalUserMessages || 0,
        totalModelMessages: response.data.stats.totalModelMessages || 0,
        recentActivity: response.data.stats.recentActivity,
      };
    }
    throw new Error("Failed to get session stats");
  } catch (error) {
    console.error("Error getting session stats:", error);
    throw error;
  }
}

// Search messages within a session
export async function searchSessionMessages(
  sessionId: string,
  query: string,
  limit: number = 10
): Promise<SessionMessage[]> {
  try {
    const response = await get<{ messages: any[] }>(
      `/sessions?action=search&sessionId=${sessionId}&query=${encodeURIComponent(
        query
      )}&limit=${limit}`
    );
    if (response.success && response.data?.messages) {
      return response.data.messages.map((msg: any) => ({
        id: msg._id || msg.id,
        text: msg.text,
        role: msg.role,
        timestamp: new Date(msg.timestamp).getTime(),
        sessionId: msg.sessionId,
        attachments: msg.attachments || [],
        metadata: msg.metadata,
      }));
    }
    throw new Error("Failed to search messages");
  } catch (error) {
    console.error("Error searching messages:", error);
    throw error;
  }
}
