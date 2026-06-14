// AI Provider types for domestic Chinese models

export type AIProvider = "deepseek" | "qwen" | "zhipu" | "iflytek";

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Transcription types
export interface TranscriptionRequest {
  audioUrl: string;
  language?: string;
}

export interface TranscriptionResponse {
  text: string;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

// Document structuring types
export interface StructuredDocument {
  title: string;
  keyTopics: string[];
  sections: DocumentSection[];
  definitions: Definition[];
  summary: string[];
  reviewQuestions: string[];
}

export interface DocumentSection {
  heading: string;
  content: string;
  orderIndex: number;
  sectionType: "content" | "key_definition" | "example" | "misconception" | "practice";
}

export interface Definition {
  term: string;
  explanation: string;
}

// Knowledge graph types
export interface ExtractedNode {
  title: string;
  description: string;
  category: string;
}

export interface ExtractedEdge {
  source: string;
  target: string;
  relationship: "prerequisite_of" | "related_to" | "example_of" | "sub_concept_of" | "contradicts";
  label: string;
}

export interface GraphExtractionResult {
  nodes: ExtractedNode[];
  edges: ExtractedEdge[];
}

// Cognitive patch types
export interface CognitivePatch {
  title: string;
  connectingConcept: string;
  content: string;
  analogy: string;
  reviewQuestion: string;
}

// Understanding report types (F9)
export interface UnderstandingReport {
  knowledgeMap: string;      // 知识全景图
  visualAnalogy: string;     // 形象化比喻
  hiddenConnections: string; // 关联揭示
  decomposition: string;     // 拆解重构
  commonMisconceptions: string; // 常见误解
}

// Scrutiny report types (F10)
export interface ScrutinyReport {
  sourceTrace: string;       // 来源审视
  controversyMap: string;    // 争议地图
  timelinessCheck: string;   // 时效性检查
  practicalityAssessment: string; // 实用性评估
  logicalCoherence: string;  // 逻辑自洽性
}
