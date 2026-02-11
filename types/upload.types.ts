// Upload Types
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number;
  estimatedTime: number;
}

export interface UploadOptions {
  chunkSize?: number;
  retryAttempts?: number;
  timeout?: number;
  onProgress?: (progress: UploadProgress) => void;
  onError?: (error: Error) => void;
  onSuccess?: (result: any) => void;
}

export interface FileUploadRequest {
  file: File;
  options?: UploadOptions;
  metadata?: Record<string, any>;
}

export interface FileUploadResponse {
  success: boolean;
  fileId: string;
  url: string;
  size: number;
  type: string;
  name: string;
  message?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface FileValidationResult {
  valid: boolean;
  message?: string;
  errors?: string[];
  warnings?: string[];
}

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  isImage: boolean;
  isDocument: boolean;
  isVideo: boolean;
  isAudio: boolean;
}

export interface UploadConfig {
  maxFileSize: number;
  allowedTypes: string[];
  maxFiles: number;
  chunkSize: number;
  retryAttempts: number;
  timeout: number;
}

export interface BatchUploadRequest {
  files: File[];
  options?: UploadOptions;
  metadata?: Record<string, any>;
}

export interface BatchUploadResponse {
  success: boolean;
  results: FileUploadResponse[];
  failed: FileUploadResponse[];
  message?: string;
} 