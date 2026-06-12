// src/lib/gemini/client.ts
// Use NEW unified SDK: @google/genai  (NOT deprecated @google/generative-ai)
import { GoogleGenAI } from '@google/genai';

// Lazy singleton so `next build` does not fail when GEMINI_API_KEY is absent.
// The key is only required when a request actually reaches Gemini at runtime.
let _ai: GoogleGenAI | null = null;

export function getAI(): GoogleGenAI {
  if (_ai) return _ai;
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('[Gemini] GEMINI_API_KEY environment variable not set');
  }
  _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return _ai;
}

// Gemini 2.5 Flash - fast, cheap, streaming, thinking tokens
export const MODEL = 'gemini-2.5-flash';

// Pricing (as of June 2026, per 1M tokens)
export const PRICING = {
  inputPerMillion: 0.075, // $0.075 per 1M input tokens
  outputPerMillion: 0.3, // $0.30  per 1M output tokens
  thinkingPerMillion: 0.035, // $0.035 per 1M thinking tokens
};

export function calcCost(
  promptTokens: number,
  outputTokens: number,
  thinkingTokens: number,
): number {
  return (
    (promptTokens / 1_000_000) * PRICING.inputPerMillion +
    (outputTokens / 1_000_000) * PRICING.outputPerMillion +
    (thinkingTokens / 1_000_000) * PRICING.thinkingPerMillion
  );
}
