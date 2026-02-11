import { GenerationType, GenerationPrompt, FileAttachment } from "../types/index";

// Generation type keywords and patterns
const GENERATION_PATTERNS: Record<GenerationType, GenerationPrompt> = {
  mcq: {
    type: "mcq",
    keywords: [
      "mcq",
      "multiple choice",
      "quiz",
      "questions",
      "test",
      "exam",
      "assessment",
      "evaluation",
      "practice questions",
      "question bank",
      "options",
      "alternatives",
      "choices",
    ],
    prompt: "Generate MCQ sheet based on this document",
  },
  research: {
    type: "research",
    keywords: [
      "research",
      "paper",
      "study",
      "analysis",
      "report",
      "academic",
      "scholarly",
      "thesis",
      "dissertation",
      "investigation",
      "findings",
      "methodology",
      "literature review",
      "abstract",
      "conclusion",
      "bibliography",
      "references",
      "citation",
    ],
    prompt: "Generate research paper based on this document",
  },
  documentation: {
    type: "documentation",
    keywords: [
      "documentation",
      "docs",
      "manual",
      "guide",
      "instructions",
      "tutorial",
      "reference",
      "api",
      "technical",
      "specification",
      "overview",
      "setup",
      "usage",
      "examples",
      "readme",
      "wiki",
    ],
    prompt: "Generate technical documentation based on this document",
  },
};

/**
 * Detect generation type from user input
 */
export function detectGenerationType(input: string): GenerationType | null {
  const lowerInput = input.toLowerCase();

  // Direct matches first (highest priority)
  for (const [type, pattern] of Object.entries(GENERATION_PATTERNS)) {
    if (pattern.keywords.some((keyword) => lowerInput.includes(keyword))) {
      return type as GenerationType;
    }
  }

  return null;
}

/**
 * Check if a file can be used for generation (PDF, DOCX, TXT, etc.)
 */
export function canGenerateFromFile(
  fileType: string,
  fileName: string
): boolean {
  const supportedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
    "application/rtf",
  ];

  const supportedExtensions = [".pdf", ".doc", ".docx", ".txt", ".md", ".rtf"];

  return (
    supportedTypes.includes(fileType) ||
    supportedExtensions.some((ext) => fileName.toLowerCase().endsWith(ext))
  );
}

/**
 * Check if user input indicates file generation intent
 */
export function isGenerationRequest(
  input: string,
  hasAttachments: boolean
): boolean {
  if (!hasAttachments) return false;

  const generationKeywords = [
    "generate",
    "create",
    "make",
    "produce",
    "build",
    "write",
    "based on",
    "from this",
    "using this",
    "with this",
    "convert",
    "transform",
    "extract",
  ];

  const lowerInput = input.toLowerCase();
  return (
    generationKeywords.some((keyword) => lowerInput.includes(keyword)) &&
    detectGenerationType(input) !== null
  );
}

/**
 * Get generation suggestions based on uploaded files
 */
export function getGenerationSuggestions(
  files: FileAttachment[]
): GenerationPrompt[] {
  const generatableFiles = files.filter((file) =>
    canGenerateFromFile(file.type, file.name)
  );

  if (generatableFiles.length === 0) return [];

  return [
    GENERATION_PATTERNS.research,
    GENERATION_PATTERNS.mcq,
    GENERATION_PATTERNS.documentation,
  ];
}

/**
 * Format generation prompt for API
 */
export function formatGenerationPrompt(
  type: GenerationType,
  userInput: string,
  files: FileAttachment[]
): string {
  const basePrompt = GENERATION_PATTERNS[type].prompt;

  if (userInput.trim()) {
    return `${basePrompt}. Additional instructions: ${userInput}`;
  }

  return basePrompt;
}
