// src/lib/sigmap/index.ts
import { buildCorpus } from './ingest';
import type { CorpusDocument, ContextChunk, AssembleResult, Citation } from './types';

const RELEVANCE_THRESHOLD = 0.01; // min score to be included
const TOKENS_PER_CHAR = 0.25; // ~4 chars per token estimate

export class SigMapIndex {
  private docs: CorpusDocument[] = [];
  // tfidfIndex[docId][term] = tfidf score
  private tfidfIndex = new Map<string, Map<string, number>>();
  public totalCorpusTokens = 0;

  constructor(docs: CorpusDocument[]) {
    this.docs = docs;
    this.totalCorpusTokens = docs.reduce(
      (sum, d) => sum + Math.ceil(d.content.length * TOKENS_PER_CHAR),
      0,
    );
    this.buildIndex();
  }

  get documentCount() {
    return this.docs.length;
  }

  // -- Tokenise: lowercase, remove punctuation, filter short words --
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2);
  }

  private buildIndex(): void {
    const tf = new Map<string, Map<string, number>>();
    const df = new Map<string, number>();
    const N = this.docs.length;

    // Term frequency per document
    for (const doc of this.docs) {
      const terms = this.tokenize(doc.content);
      const freq = new Map<string, number>();
      for (const t of terms) freq.set(t, (freq.get(t) ?? 0) + 1);
      tf.set(doc.id, freq);
      for (const t of new Set(terms)) df.set(t, (df.get(t) ?? 0) + 1);
    }

    // TF-IDF per document
    for (const doc of this.docs) {
      const docTF = tf.get(doc.id)!;
      const scores = new Map<string, number>();
      for (const [term, count] of docTF) {
        const idf = Math.log((N + 1) / ((df.get(term) ?? 0) + 1));
        scores.set(term, (count / docTF.size) * idf);
      }
      this.tfidfIndex.set(doc.id, scores);
    }
  }

  assembleContext(query: string, topK = 5): AssembleResult {
    const queryTerms = this.tokenize(query);

    if (queryTerms.length === 0) {
      return {
        canAnswer: false,
        reason: 'Query too short or no meaningful terms found.',
        chunks: [],
        citations: [],
        naiveTokens: this.totalCorpusTokens,
        assembledTokens: 0,
        reductionPercent: 100,
        topScore: 0,
      };
    }

    // Score each document
    const scored = this.docs.map((doc) => {
      const docScores = this.tfidfIndex.get(doc.id)!;
      const score = queryTerms.reduce((sum, t) => sum + (docScores.get(t) ?? 0), 0);
      return { doc, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const topDocs = scored.slice(0, topK).filter((s) => s.score >= RELEVANCE_THRESHOLD);

    if (topDocs.length === 0) {
      return {
        canAnswer: false,
        reason: 'No verified context found for this query in the conference data.',
        chunks: [],
        citations: [],
        naiveTokens: this.totalCorpusTokens,
        assembledTokens: 0,
        reductionPercent: 100,
        topScore: 0,
      };
    }

    // Compact each chunk to 350 chars max - key to token reduction
    const chunks: ContextChunk[] = topDocs.map(({ doc, score }) => ({
      id: doc.id,
      content: doc.content.length > 350 ? doc.content.slice(0, 347) + '...' : doc.content,
      score: Math.round(score * 1000) / 1000,
      type: doc.type,
      metadata: doc.metadata,
    }));

    const assembledTokens = chunks.reduce(
      (sum, c) => sum + Math.ceil(c.content.length * TOKENS_PER_CHAR),
      0,
    );

    const citations: Citation[] = chunks.map((c) => ({
      sourceId: c.id,
      sourceType: c.type,
      label: `${c.type}s.json#${c.id}`,
    }));

    return {
      canAnswer: true,
      chunks,
      citations,
      naiveTokens: this.totalCorpusTokens,
      assembledTokens,
      reductionPercent: Math.round((1 - assembledTokens / this.totalCorpusTokens) * 100),
      topScore: chunks[0]?.score ?? 0,
    };
  }
}

// -- Singleton: built once at server startup, reused for all requests --
let _index: SigMapIndex | null = null;
let _buildPromise: Promise<SigMapIndex> | null = null;

export async function getSigMapIndex(): Promise<SigMapIndex> {
  if (_index) return _index;
  if (_buildPromise) return _buildPromise;

  _buildPromise = (async () => {
    const docs = await buildCorpus();
    _index = new SigMapIndex(docs);
    console.log(
      `[SigMap] Index built: ${docs.length} docs, ${_index.totalCorpusTokens} total tokens`,
    );
    return _index;
  })();

  return _buildPromise;
}
