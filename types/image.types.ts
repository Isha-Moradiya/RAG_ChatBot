// Image Types
export interface ImageFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: number;
  dimensions?: {
    width: number;
    height: number;
  };
  metadata?: Record<string, any>;
}

export interface ImageUploadResponse {
  success: boolean;
  imageId: string;
  url: string;
  message?: string;
  error?: string;
}

export interface ImageEnhancementOptions {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  sharpness?: number;
  noiseReduction?: boolean;
  autoEnhance?: boolean;
}

export interface ImageAnalysisResult {
  description: string;
  tags: string[];
  confidence: number;
  objects?: Array<{
    name: string;
    confidence: number;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  text?: string[];
  colors?: Array<{
    color: string;
    percentage: number;
  }>;
}

export interface ImageEnhancementRequest {
  imageId: string;
  enhancementOptions?: ImageEnhancementOptions;
  analysisPrompt?: string;
}

export interface ImageEnhancementResponse {
  success: boolean;
  enhancedImageUrl?: string;
  analysis?: ImageAnalysisResult;
  message?: string;
  error?: string;
}

export interface ImageValidationResult {
  valid: boolean;
  message?: string;
  errors?: string[];
}

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface ImagePreview {
  url: string;
  dimensions: {
    width: number;
    height: number;
  };
  size: number;
} 