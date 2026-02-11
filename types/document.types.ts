// Document Types
export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: number;
  processedAt?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  chunksCount?: number;
  metadata?: Record<string, any>;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  chunkIndex: number;
  totalChunks: number;
  embedding?: number[];
  metadata?: Record<string, any>;
}

export interface DocumentSearchResult {
  content: string;
  metadata: {
    fileName: string;
    fileType: string;
    documentId: string;
    chunkIndex: number;
    totalChunks: number;
    uploadedBy: string;
    uploadedAt: string;
  };
  score: number;
}

export interface DocumentStats {
  totalDocuments: number;
  totalChunks: number;
  totalSize: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface EmbeddingResult {
  success: boolean;
  documentId?: string;
  chunksCount?: number;
  message: string;
  error?: string;
}

export interface DocumentUploadResponse {
  file: {
    name: string;
    size: number;
    type: string;
    data: string;
    isImage: boolean;
  };
  embedding: EmbeddingResult;
}

export interface DocumentSearchParams {
  query: string;
  limit?: number;
  filters?: {
    fileType?: string[];
    uploadedBy?: string;
    dateRange?: {
      start: number;
      end: number;
    };
  };
} 