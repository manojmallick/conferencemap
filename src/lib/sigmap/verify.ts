// src/lib/sigmap/verify.ts
import type { ContextChunk, FaithfulnessResult } from './types';

// NOTE: the original plan used a regex with the `x` (free-spacing) flag and inline
// comments. JavaScript does not support the `x` flag, so that pattern throws a
// SyntaxError at runtime. Below is the equivalent, valid pattern.
//   - Proper names (First Last):      [A-Z][a-z]+ [A-Z][a-z]+
//   - Times (10:30, 14:00):           \d{1,2}:\d{2}
//   - Room/Track/Stage/Hall refs:     (Room|Track|Stage|Hall)\s+\S+
//   - Day 1 / Day 2:                  Day\s+[12]
const FACTUAL_PATTERN =
  /\b[A-Z][a-z]+ [A-Z][a-z]+\b|\b\d{1,2}:\d{2}\b|\b(?:Room|Track|Stage|Hall)\s+\S+\b|\bDay\s+[12]\b/g;

export function verifyAnswer(answer: string, chunks: ContextChunk[]): FaithfulnessResult {
  // Build searchable context from all chunks
  const contextText = chunks.map((c) => c.content).join(' ').toLowerCase();

  const claims = [...new Set(answer.match(FACTUAL_PATTERN) ?? [])];

  if (claims.length === 0) {
    // No verifiable factual claims - treat as informational answer
    return {
      score: 1.0,
      groundedClaims: 0,
      totalClaims: 0,
      ungoundedClaims: [],
      confidence: 'high',
    };
  }

  const grounded = claims.filter((c) => contextText.includes(c.toLowerCase()));
  const ungrounded = claims.filter((c) => !contextText.includes(c.toLowerCase()));
  const score = grounded.length / claims.length;

  return {
    score: Math.round(score * 100) / 100,
    groundedClaims: grounded.length,
    totalClaims: claims.length,
    ungoundedClaims: ungrounded,
    confidence:
      score >= 0.95 ? 'high' : score >= 0.75 ? 'medium' : score >= 0.5 ? 'low' : 'none',
  };
}
