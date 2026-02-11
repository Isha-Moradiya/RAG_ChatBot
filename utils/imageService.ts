import { getAuthToken } from './requestService';
import {
  ImageFile,
  ImageUploadResponse,
  ImageEnhancementOptions,
  ImageAnalysisResult,
  ImageEnhancementRequest,
  ImageEnhancementResponse,
  ImageValidationResult,
  ImageCompressionOptions,
  ImagePreview,
  ApiResponse
} from '../types';

const API_BASE_URL = '/api';

/**
 * Upload an image file
 */
export async function uploadImage(file: File): Promise<ImageUploadResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Image upload failed');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
}

/**
 * Enhance an image
 */
export async function enhanceImage(
  imageId: string, 
  enhancementOptions: ImageEnhancementOptions = {}, 
  analysisPrompt?: string
): Promise<ImageEnhancementResponse> {
  try {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/images/enhance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        imageId,
        enhancementOptions,
        analysisPrompt
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Image enhancement failed');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Image enhancement error:', error);
    throw error;
  }
}

/**
 * Analyze an image
 */
export async function analyzeImage(
  imageId: string, 
  prompt: string = "Analyze this image and provide a detailed description"
): Promise<ImageAnalysisResult> {
  try {
    const token = await getAuthToken();

    const response = await fetch(
      `${API_BASE_URL}/images/enhance?imageId=${imageId}&prompt=${encodeURIComponent(prompt)}`, 
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Image analysis failed');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Image analysis error:', error);
    throw error;
  }
}

/**
 * Validate image file before upload
 */
export function validateImageFile(file: File): ImageValidationResult {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'image/svg+xml'
  ];

  const maxSize = 10 * 1024 * 1024; // 10MB
  const errors: string[] = [];

  if (!supportedTypes.includes(file.type)) {
    errors.push(`Unsupported image type. Supported types: ${supportedTypes.join(', ')}`);
  }

  if (file.size > maxSize) {
    errors.push(`Image too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`);
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Create a preview URL for an image
 */
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get image dimensions
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height
        });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Compress image if needed
 */
export function compressImage(
  file: File, 
  options: ImageCompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8
  } = options;

  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      const img = new Image();

      img.onload = () => {
        try {
          // Calculate new dimensions
          let { width, height } = img;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          }, file.type, quality);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get image information
 */
export async function getImageInfo(file: File): Promise<ImagePreview> {
  try {
    const dimensions = await getImageDimensions(file);
    const previewUrl = await createImagePreview(file);
    
    return {
      url: previewUrl,
      dimensions,
      size: file.size
    };
  } catch (error) {
    console.error('Error getting image info:', error);
    throw error;
  }
}

/**
 * Process image with multiple operations
 */
export async function processImage(
  file: File, 
  operations: {
    compress?: ImageCompressionOptions;
    validate?: boolean;
  } = {}
): Promise<{
  file: File;
  info: ImagePreview;
  validation: ImageValidationResult;
}> {
  try {
    let processedFile = file;
    const validation = validateImageFile(file);

    if (!validation.valid) {
      throw new Error(validation.errors?.join(', ') || 'Image validation failed');
    }

    if (operations.compress) {
      processedFile = await compressImage(file, operations.compress);
    }

    const info = await getImageInfo(processedFile);

    return {
      file: processedFile,
      info,
      validation
    };
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
}

/**
 * Batch upload images
 */
export async function uploadImages(files: File[]): Promise<ImageUploadResponse[]> {
  try {
    const uploadPromises = files.map(file => uploadImage(file));
    const results = await Promise.allSettled(uploadPromises);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          imageId: '',
          url: '',
          message: result.reason?.message || 'Upload failed',
          error: result.reason?.message || 'Upload failed'
        };
      }
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  }
} 