import { getAuth } from "firebase/auth";
import { ApiResponse, ApiError } from "../types/index";

const API_BASE_URL = "/api";

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
        details: errorData.details,
      };
      throw error;
    }
    const data = await response.json();
    return {
      success: true,
      data,
      status: response.status,
    };
  } catch (error) {
    console.error("API request error:", error);
    if (error instanceof Error) {
      throw {
        message: error.message,
        status: 500,
        code: "REQUEST_FAILED",
      } as ApiError;
    }
    throw error;
  }
}

export async function get<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  return makeRequest<T>(endpoint, { method: "GET", ...options });
}

export async function post<T = any>(
  endpoint: string,
  data: any,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  return makeRequest<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
    ...options,
  });
}

export async function put<T = any>(
  endpoint: string,
  data: any,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  return makeRequest<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
    ...options,
  });
}

export async function del<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  return makeRequest<T>(endpoint, { method: "DELETE", ...options });
}