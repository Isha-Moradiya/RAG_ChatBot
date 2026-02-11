import { getAuth } from "firebase/auth";
import { 
  ApiResponse, 
  ApiError, 
  ChatResponse,
  ChatMessage,
  Attachment 
} from "../types/index";

const API_BASE_URL = "/api";

/**
 * Get authentication token from Firebase
 */
export async function getAuthToken(): Promise<string> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No authenticated user");
    }
    return await user.getIdToken();
  } catch (error) {
    console.error("Error getting auth token:", error);
    throw new Error("Failed to get authentication token");
  }
}

/**
 * Make HTTP request with authentication
 */
async function makeRequest<T = any>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = await getAuthToken();
    const defaultHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg =
        errorData.error ||
        errorData.message ||
        `HTTP error! status: ${response.status}`;
      const error: ApiError = {
        message: errorMsg,
        status: response.status,
        code: errorData.code,
        details: errorData.details
      };
      throw error;
    }
    const data = await response.json();
    return {
      success: true,
      data,
      status: response.status
    };
  } catch (error) {
    console.error("API request error:", error);
    if (error instanceof Error) {
      throw {
        message: error.message,
        status: 500,
        code: "REQUEST_FAILED"
      } as ApiError;
    }
    throw error;
  }
}

// Send chat message
export async function sendMessage(
  messages: ChatMessage[],
  attachments: Attachment[] = [],
  sessionId?: string,
  contextType?: 'document' | 'image' | 'both',
  documentId?: string
): Promise<ApiResponse<ChatResponse>> {
  try {
    const hasAttachments = attachments.length > 0 || messages.some(msg => msg.attachments && msg.attachments.length > 0);
    const endpoint = hasAttachments ? "/chats/enhanced" : "/chats";
    const body: any = { messages, attachments, sessionId };
    if (hasAttachments) {
      if (contextType) body.contextType = contextType;
      if (documentId) body.documentId = documentId;
    }
    return await makeRequest<ChatResponse>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}