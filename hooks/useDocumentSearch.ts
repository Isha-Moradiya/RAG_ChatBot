import { useState, useCallback } from 'react';
import { DocumentService, DocumentSearchResult } from '@/utils/documentService';

interface UseDocumentSearchOptions {
  maxResults?: number;
  similarityThreshold?: number;
}

interface DocumentSearchHook {
  searchDocuments: (query: string) => Promise<DocumentSearchResult[]>;
  getRelevantContext: (userMessage: string) => Promise<string>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useDocumentSearch(options: UseDocumentSearchOptions = {}): DocumentSearchHook {
  const { maxResults = 5, similarityThreshold = 0.7 } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchDocuments = useCallback(async (query: string): Promise<DocumentSearchResult[]> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const results = await DocumentService.searchDocuments(query, maxResults);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search documents';
      setError(errorMessage);
      console.error('Document search error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [maxResults]);

  const getRelevantContext = useCallback(async (userMessage: string): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);

      // Search for relevant documents
      const results = await DocumentService.searchDocuments(userMessage, maxResults);
      
      if (results.length === 0) {
        return '';
      }

      // Format the context for the chatbot
      const contextParts = results.map((result, index) => {
        const fileName = result.metadata.fileName;
        const chunkInfo = `(Chunk ${result.metadata.chunkIndex + 1}/${result.metadata.totalChunks})`;
        const content = result.content.trim();
        
        return `[Document ${index + 1}: ${fileName} ${chunkInfo}]\n${content}`;
      });

      const context = `Based on your uploaded documents, here's relevant information:\n\n${contextParts.join('\n\n')}\n\nPlease use this information to provide a more accurate and helpful response.`;
      
      return context;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get document context';
      setError(errorMessage);
      console.error('Document context error:', err);
      return '';
    } finally {
      setIsLoading(false);
    }
  }, [maxResults]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    searchDocuments,
    getRelevantContext,
    isLoading,
    error,
    clearError,
  };
}

// Utility function to enhance chatbot messages with document context
export function enhanceMessageWithDocuments(
  userMessage: string,
  documentContext: string
): string {
  if (!documentContext.trim()) {
    return userMessage;
  }

  return `${documentContext}\n\nUser Question: ${userMessage}`;
}

// Utility function to extract document references from chatbot response
export function extractDocumentReferences(response: string): {
  hasReferences: boolean;
  referencedDocuments: string[];
} {
  const documentPattern = /\[Document \d+: ([^\]]+)\]/g;
  const matches = response.match(documentPattern);
  
  if (!matches) {
    return {
      hasReferences: false,
      referencedDocuments: [],
    };
  }

  const referencedDocuments = matches.map(match => {
    const fileNameMatch = match.match(/\[Document \d+: ([^\]]+)\]/);
    return fileNameMatch ? fileNameMatch[1] : match;
  });

  return {
    hasReferences: true,
    referencedDocuments,
  };
} 