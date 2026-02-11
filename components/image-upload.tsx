'use client';

import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { 
  Upload, 
  Image as ImageIcon, 
  Sparkles, 
  Eye, 
  Download, 
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { 
  uploadImage,
  enhanceImage,
  analyzeImage,
  validateImageFile,
  createImagePreview,
  getImageDimensions,
  compressImage,
  getImageInfo,
  processImage,
  uploadImages
} from '../utils/imageService';

interface ImageFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  isImage: boolean;
  preview?: string;
  dimensions?: { width: number; height: number };
  uploaded?: boolean;
  enhanced?: boolean;
  analysis?: string;
}

interface ImageUploadProps {
  onImagesUploaded?: (images: ImageFile[]) => void;
  maxImages?: number;
  showEnhancement?: boolean;
  showAnalysis?: boolean;
}

export function ImageUpload({ 
  onImagesUploaded, 
  maxImages = 5, 
  showEnhancement = true,
  showAnalysis = true 
}: ImageUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<ImageFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [enhancing, setEnhancing] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setError(null);

    if (selectedFiles.length + files.length > maxImages) {
      setError(`You can only upload up to ${maxImages} images at once.`);
      return;
    }

    const newImageFiles: ImageFile[] = [];

    for (const file of files) {
      // Validate image file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.errors?.join(', ') || 'Invalid image file');
        continue;
      }

      try {
        // Create preview
        const preview = await createImagePreview(file);
        
        // Get dimensions
        const dimensions = await getImageDimensions(file);

        const imageFile: ImageFile = {
          id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: preview,
          isImage: true,
          preview,
          dimensions
        };

        newImageFiles.push(imageFile);
      } catch (err) {
        console.error('Error processing image:', err);
        setError(`Error processing ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    setSelectedFiles(prev => [...prev, ...newImageFiles]);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    const uploadedImages: ImageFile[] = [];
    const totalFiles = selectedFiles.length;

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const imageFile = selectedFiles[i];
        
        // Convert base64 back to file for upload
        const response = await fetch(imageFile.url);
        const blob = await response.blob();
        const file = new File([blob], imageFile.name, { type: imageFile.type });

        // Upload image
        const uploadResult = await uploadImage(file);
        
        // Update image with upload result
        const uploadedImage: ImageFile = {
          ...imageFile,
          id: uploadResult.imageId || imageFile.id,
          uploaded: true,
          url: uploadResult.url || imageFile.url
        };

        uploadedImages.push(uploadedImage);
        setUploadProgress(((i + 1) / totalFiles) * 100);
      }

      setSelectedFiles(uploadedImages);
      onImagesUploaded?.(uploadedImages);
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleEnhance = async (imageId: string) => {
    setEnhancing(imageId);
    setError(null);

    try {
      const enhancementOptions = {
        brightness: 0.1,
        contrast: 0.1,
        saturation: 0.1,
        sharpness: 0.1,
        autoEnhance: true
      };

      const result = await enhanceImage(imageId, enhancementOptions);
      
      setSelectedFiles(prev => prev.map(img => 
        img.id === imageId 
          ? { ...img, enhanced: true, url: result.enhancedImageUrl || img.url }
          : img
      ));

    } catch (err) {
      console.error('Enhancement error:', err);
      setError(err instanceof Error ? err.message : 'Enhancement failed');
    } finally {
      setEnhancing(null);
    }
  };

  const handleAnalyze = async (imageId: string) => {
    setAnalyzing(imageId);
    setError(null);

    try {
      const result = await analyzeImage(imageId, "Provide a detailed analysis of this image including objects, colors, composition, and any notable features.");
      
              setSelectedFiles(prev => prev.map(img => 
          img.id === imageId 
            ? { ...img, analysis: result.description || 'Analysis completed' }
            : img
        ));

    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(null);
    }
  };

  const removeImage = (imageId: string) => {
    setSelectedFiles(prev => prev.filter(img => img.id !== imageId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Image Upload
          </CardTitle>
          <CardDescription>
            Upload and enhance images. Supports JPEG, PNG, GIF, WebP, BMP, TIFF, and SVG formats.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Input */}
          <div className="space-y-2">
            <Label htmlFor="image-upload">Select Images</Label>
            <div className="flex items-center gap-2">
              <Input
                id="image-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                ref={fileInputRef}
                className="flex-1"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                Browse
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading images...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Upload Button */}
          {selectedFiles.length > 0 && !uploading && (
            <Button 
              onClick={handleUpload} 
              className="w-full"
              disabled={selectedFiles.every(img => img.uploaded)}
            >
              {selectedFiles.every(img => img.uploaded) ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  All Images Uploaded
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {selectedFiles.length} Image{selectedFiles.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}

          {/* Selected Images */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <Separator />
              <h4 className="font-medium">Selected Images ({selectedFiles.length}/{maxImages})</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedFiles.map((image) => (
                  <Card key={image.id} className="overflow-hidden">
                    <div className="relative">
                      <img
                        src={image.preview || image.url}
                        alt={image.name}
                        className="w-full h-48 object-cover"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2 h-6 w-6 p-0"
                        onClick={() => removeImage(image.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">{image.name}</span>
                          <Badge variant={image.uploaded ? "default" : "secondary"}>
                            {image.uploaded ? "Uploaded" : "Pending"}
                          </Badge>
                        </div>
                        
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>Size: {formatFileSize(image.size)}</div>
                          {image.dimensions && (
                            <div>Dimensions: {image.dimensions.width} × {image.dimensions.height}</div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        {image.uploaded && (
                          <div className="flex gap-2 pt-2">
                            {showEnhancement && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEnhance(image.id)}
                                disabled={enhancing === image.id || image.enhanced}
                                className="flex-1"
                              >
                                {enhancing === image.id ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <Sparkles className="h-3 w-3 mr-1" />
                                )}
                                {image.enhanced ? "Enhanced" : "Enhance"}
                              </Button>
                            )}
                            
                            {showAnalysis && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAnalyze(image.id)}
                                disabled={analyzing === image.id}
                                className="flex-1"
                              >
                                {analyzing === image.id ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <Eye className="h-3 w-3 mr-1" />
                                )}
                                Analyze
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Analysis Result */}
                        {image.analysis && (
                          <div className="mt-2 p-2 bg-muted rounded text-xs">
                            <strong>Analysis:</strong> {image.analysis}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 