// Add these interfaces to your existing types/index.ts file

export interface GeneratedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  previewUrl?: string;
  downloadUrl: string;
  generationType: "research" | "mcq" | "documentation";
  timestamp: Date;
}

export interface FileGenerationRequest {
  messages: any[];
  attachments: any[];
  sessionId?: string;
  generationType: "research" | "mcq" | "documentation";
}

// Add this to your existing Message interface
export interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  attachments?: FileAttachment[];
  generatedFile?: GeneratedFile; // Add this new field
}

// Update FileAttachment interface to include generation capabilities
export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string;
  isImage: boolean;
  canGenerate?: boolean; // Add this to indicate if file can be used for generation
}

// Add generation type detection
export type GenerationType = "research" | "mcq" | "documentation";

export interface GenerationPrompt {
  type: GenerationType;
  keywords: string[];
  prompt: string;
}
