'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, Search, Trash2, FileText, File, FileImage } from 'lucide-react';
import { 
  searchDocuments, 
  getDocumentStats, 
  deleteDocument, 
  uploadFile as uploadDocument,
  isSupportedFileType,
  formatFileSize,
  getFileTypeDisplayName
} from '@/utils';
import { 
  DocumentSearchResult, 
  DocumentStats, 
  EmbeddingResult 
} from '@/types';
import { useToast } from '@/hooks/use-toast';

interface DocumentManagerProps {
  onDocumentSelect?: (document: DocumentSearchResult) => void;
  className?: string;
}

export function DocumentManager({ onDocumentSelect, className }: DocumentManagerProps) {
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DocumentSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load document stats on component mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const documentStats = await getDocumentStats();
      setStats(documentStats);
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: "Error",
        description: "Failed to load document statistics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!isSupportedFileType(file)) {
      toast({
        title: "Unsupported File Type",
        description: "Please upload PDF, DOCX, or TXT files only",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress('Processing file...');

      const result = await uploadDocument(file);
      
      if (result.success && result.data) {
        const uploadData = result.data;
        if (uploadData.embedding && uploadData.embedding.success) {
          toast({
            title: "Success",
            description: `File uploaded and processed successfully! Created ${uploadData.embedding.chunksCount} chunks.`,
          });
          
          // Reload stats after successful upload
          await loadStats();
        } else {
          toast({
            title: "Upload Failed",
            description: uploadData.embedding?.message || "Failed to process document",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Upload Failed",
          description: result.data?.message || "Upload failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress('');
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const results = await searchDocuments(searchQuery, 10);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching documents:', error);
      toast({
        title: "Search Error",
        description: error instanceof Error ? error.message : "Failed to search documents",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDocument(documentId);
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      
      // Reload stats and clear search results
      await loadStats();
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Delete Error",
        description: error instanceof Error ? error.message : "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'application/pdf':
        return <FileText className="h-4 w-4" />;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        return <File className="h-4 w-4" />;
      case 'text/plain':
        return <FileText className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Documents
          </CardTitle>
          <CardDescription>
            Upload PDF, DOCX, or TXT files to make them searchable in your chatbot
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {isUploading ? 'Processing...' : 'Choose File'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              {uploadProgress && (
                <span className="text-sm text-muted-foreground">{uploadProgress}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Supported formats: PDF, DOCX, DOC, TXT (Max 10MB)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Section */}
      <Card>
        <CardHeader>
          <CardTitle>Document Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading statistics...</span>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.totalDocuments}</div>
                <div className="text-sm text-muted-foreground">Total Documents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.totalChunks}</div>
                <div className="text-sm text-muted-foreground">Total Chunks</div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No documents uploaded yet</p>
          )}
        </CardContent>
      </Card>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Documents
          </CardTitle>
          <CardDescription>
            Search through your uploaded documents using semantic similarity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter your search query..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                disabled={isSearching}
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="flex items-center gap-2"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Search
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-3">
                <Separator />
                <h4 className="font-medium">Search Results ({searchResults.length})</h4>
                {searchResults.map((result, index) => (
                  <Card key={index} className="cursor-pointer hover:bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            {getFileIcon(result.metadata.fileType)}
                            <span className="font-medium">{result.metadata.fileName}</span>
                            <Badge variant="secondary">
                              {getFileTypeDisplayName(result.metadata.fileType)}
                            </Badge>
                            <Badge variant="outline">
                              Chunk {result.metadata.chunkIndex + 1}/{result.metadata.totalChunks}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {result.content}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Uploaded: {new Date(result.metadata.uploadedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {onDocumentSelect && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onDocumentSelect(result)}
                            >
                              Use
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteDocument(result.metadata.documentId)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 