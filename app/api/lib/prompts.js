import { PromptTemplate } from "@langchain/core/prompts";

export const researchPrompt = new PromptTemplate({
  inputVariables: ["context", "question"],
  template: `
You are an expert academic writer.

Using the provided context, write a **Research Paper** with the following sections:
- Title
- Abstract
- Introduction
- Methodology
- Results
- Discussion
- Conclusion
- References

Context:
{context}

Question/Topic:
{question}
`,
});

export const mcqPrompt = new PromptTemplate({
  inputVariables: ["context", "question"],
  template: `
You are a professional educator.

Using the provided context, create **20 Multiple Choice Questions** (MCQs).
Each MCQ should have:
- Question text
- 4 options (A, B, C, D)
- Correct answer marked
- Short explanation

Context:
{context}

Topic/Focus:
{question}
`,
});

export const documentationPrompt = new PromptTemplate({
  inputVariables: ["context", "question"],
  template: `
You are a technical writer.

Using the provided context, create **Technical Documentation** with the following sections:
- Overview
- Setup Instructions
- Usage
- API Reference
- Examples

Context:
{context}

Focus:
{question}
`,
});
