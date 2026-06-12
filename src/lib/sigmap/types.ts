// src/lib/sigmap/types.ts

export interface CorpusDocument {
  id: string;
  content: string; // flattened text for TF-IDF
  metadata: Record<string, unknown>;
  type: 'session' | 'speaker' | 'sponsor' | 'schedule';
}

export interface ContextChunk {
  id: string;
  content: string;
  score: number;
  type: CorpusDocument['type'];
  metadata: Record<string, unknown>;
}

export interface Citation {
  sourceId: string;
  sourceType: string;
  label: string; // e.g. "sessions.json#s001"
}

export interface AssembleResult {
  canAnswer: boolean;
  reason?: string; // set when canAnswer=false
  chunks: ContextChunk[];
  citations: Citation[];
  naiveTokens: number; // full corpus token estimate
  assembledTokens: number; // SigMap output token estimate
  reductionPercent: number;
  topScore: number;
}

export interface FaithfulnessResult {
  score: number; // 0.0-1.0
  groundedClaims: number;
  totalClaims: number;
  ungoundedClaims: string[];
  confidence: 'high' | 'medium' | 'low' | 'none';
}

export interface QueryMetrics {
  sigmap: {
    assemblyMs: number;
    naiveTokens: number;
    assembledTokens: number;
    reductionPercent: number;
    chunksUsed: number;
    totalDocs: number;
    topScore: number;
    citations: Citation[];
  };
  gemini: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    thoughtsTokenCount: number;
    totalTokenCount: number;
    firstTokenMs: number;
    totalMs: number;
  };
  faithfulness: FaithfulnessResult;
  cost: {
    actualUsd: string;
    naiveUsd: string;
    savedUsd: string;
  };
}
