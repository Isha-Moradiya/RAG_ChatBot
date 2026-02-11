import { getAuthToken } from './chatService';
import { FileUploadResponse } from '../types';

const API_BASE_URL = '/api';

/**
 * Upload a single file to the backend
 */
export async function uploadFile(file: File): Promise<FileUploadResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        fileId: '',
        url: '',
        size: file.size,
        type: file.type,
        name: file.name,
        message: 'Upload failed',
        error: errorData.message || `HTTP ${response.status}`,
        metadata: { status: response.status }
      };
    }

    const result = await response.json();
    return {
      success: true,
      fileId: result.fileId || result.id || '',
      url: result.url || result.downloadUrl || '',
      size: file.size,
      type: file.type,
      name: file.name,
      message: 'Upload successful',
      metadata: result.metadata || {}
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      fileId: '',
      url: '',
      size: file.size,
      type: file.type,
      name: file.name,
      message: 'Upload failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {}
    };
  }
} 