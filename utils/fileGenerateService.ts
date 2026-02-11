import { getAuthToken } from './chatService';
import { ApiResponse, ApiError } from '../types/index';

const API_BASE_URL = '/api';

export interface FileGenerationRequest {
  messages: any[];
  attachments: any[];
  sessionId?: string;
  generationType: 'research' | 'mcq' | 'documentation';
}

export interface GeneratedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  previewUrl?: string;
  downloadUrl: string;
  generationType: 'research' | 'mcq' | 'documentation';
  timestamp: Date;
}

/**
 * Generate a file (Research Paper, MCQ, or Documentation) based on uploaded documents
 */
export async function generateFile(
  request: FileGenerationRequest
): Promise<ApiResponse<{ fileBuffer: ArrayBuffer; fileName: string; contentType: string }>> {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error: ApiError = {
        message: errorData.error || errorData.message || `HTTP error! status: ${response.status}`,
        status: response.status,
        code: errorData.code || 'GENERATION_FAILED',
        details: errorData.details
      };
      throw error;
    }

    // Get the file as ArrayBuffer
    const fileBuffer = await response.arrayBuffer();
    
    // Extract filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    let fileName = 'generated-document.pdf';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="(.+)"/);
      if (match) fileName = match[1];
    }

    const contentType = response.headers.get('Content-Type') || 'application/pdf';

    return {
      success: true,
      data: {
        fileBuffer,
        fileName,
        contentType
      },
      status: response.status
    };
  } catch (error) {
    console.error('File generation error:', error);
    if (error instanceof Error) {
      throw {
        message: error.message,
        status: 500,
        code: 'GENERATION_FAILED'
      } as ApiError;
    }
    throw error;
  }
}

/**
 * Create a downloadable blob URL from file buffer
 */
export function createDownloadableFile(
  fileBuffer: ArrayBuffer, 
  fileName: string, 
  contentType: string
): GeneratedFile {
  const blob = new Blob([fileBuffer], { type: contentType });
  const url = URL.createObjectURL(blob);
  
  return {
    id: Date.now().toString(),
    name: fileName,
    type: contentType,
    size: fileBuffer.byteLength,
    url: url,
    downloadUrl: url,
    generationType: fileName.toLowerCase().includes('mcq') ? 'mcq' : 
                   fileName.toLowerCase().includes('research') ? 'research' : 'documentation',
    timestamp: new Date()
  };
}

/**
 * Download a generated file
 */
export function downloadFile(generatedFile: GeneratedFile) {
  const link = document.createElement('a');
  link.href = generatedFile.downloadUrl;
  link.download = generatedFile.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Clean up blob URLs to prevent memory leaks
 */
export function cleanupFileUrl(url: string) {
  URL.revokeObjectURL(url);
}