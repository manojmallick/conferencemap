// src/app/api/query/route.ts
import { NextRequest } from 'next/server';
import { getSigMapIndex } from '@/lib/sigmap/index';
import { verifyAnswer } from '@/lib/sigmap/verify';
import { getAI, MODEL, calcCost } from '@/lib/gemini/client';
import { buildConferencePrompt, buildFollowUpPrompt } from '@/lib/gemini/prompts';
import type { QueryMetrics } from '@/lib/sigmap/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// -- SSE helper --
function sseEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// Normalise a question for dedup: lowercase, strip punctuation/whitespace.
function normQ(q: string): string {
  return q.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// -- Follow-up suggestions derived (free, no extra LLM call) from the chunks
//    SigMap actually used. Phrased so they tokenize back onto real corpus docs.
//    `exclude` holds normalised questions already asked (incl. the current one)
//    so we never suggest something the attendee just clicked. --
function buildFollowUps(
  chunks: { type: string; metadata: Record<string, unknown> }[],
  exclude: Set<string> = new Set(),
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (q: string) => {
    const key = normQ(q);
    if (q && !seen.has(key) && !exclude.has(key) && out.length < 3) {
      seen.add(key);
      out.push(q);
    }
  };

  // Prefer one speaker, one track, one sponsor — variety over repetition.
  for (const c of chunks) {
    const m = c.metadata as Record<string, any>;
    if (c.type === 'speaker' && m?.name && m.name !== 'Progress Team') {
      push(`What is ${m.name} speaking about?`);
    }
  }
  for (const c of chunks) {
    const m = c.metadata as Record<string, any>;
    if (c.type === 'session' && m?.track) {
      push(`What other ${m.track} sessions are there?`);
    }
  }
  for (const c of chunks) {
    const m = c.metadata as Record<string, any>;
    if (c.type === 'sponsor' && m?.name) {
      push(`Where can I find ${m.name} at the venue?`);
    }
  }

  // Generic fallbacks so there are always at least a couple.
  push('What workshops are on Day 2?');
  push('When does the hackathon finish?');
  return out.slice(0, 3);
}

// LLM-generated follow-ups (toggle via LLM_FOLLOWUPS, on by default). Natural
// phrasing at the cost of one small extra call; always falls back to the
// deterministic templates on any error or unparseable output.
async function buildFollowUpsLLM(
  contextText: string,
  query: string,
  answer: string,
  fallback: string[],
): Promise<string[]> {
  try {
    const resp = await getAI().models.generateContent({
      model: MODEL,
      contents: [
        { role: 'user', parts: [{ text: buildFollowUpPrompt(contextText, query, answer) }] },
      ],
      config: { temperature: 0.4, maxOutputTokens: 200, thinkingConfig: { thinkingBudget: 0 } },
    });
    const raw = (resp.text ?? '').trim().replace(/^```(?:json)?|```$/g, '').trim();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const items = parsed
        .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
        .map((x) => x.trim())
        .slice(0, 3);
      if (items.length > 0) return items;
    }
  } catch (e) {
    console.warn('[followups] LLM generation failed, using templates:', e);
  }
  return fallback;
}

// -- Main Route Handler --
export async function POST(req: NextRequest) {
  const { query, asked } = (await req.json()) as { query: string; asked?: string[] };

  // Questions already asked this session (+ the current one) — never suggested back.
  const excludeQuestions = new Set<string>([
    normQ(query ?? ''),
    ...(Array.isArray(asked) ? asked.map(normQ) : []),
  ]);

  if (!query?.trim()) {
    return new Response(sseEvent({ type: 'error', message: 'Empty query' }), {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => controller.enqueue(encoder.encode(sseEvent(data)));

      try {
        // -- PHASE 1: SigMap context assembly --
        const sigmapStart = Date.now();
        const index = await getSigMapIndex();
        const ctx = index.assembleContext(query.trim(), 5);
        const sigmapMs = Date.now() - sigmapStart;

        // -- No context found - decline gracefully (zero hallucination) --
        if (!ctx.canAnswer) {
          send({
            type: 'no_context',
            message: ctx.reason,
            sigmap: {
              assemblyMs: sigmapMs,
              naiveTokens: ctx.naiveTokens,
              assembledTokens: 0,
              reductionPercent: 100,
              chunksUsed: 0,
              totalDocs: index.documentCount,
            },
          });
          send({ type: 'done' });
          controller.close();
          return;
        }

        // -- PHASE 2: Send preflight metrics (before LLM call) --
        send({
          type: 'preflight',
          sigmap: {
            assemblyMs: sigmapMs,
            naiveTokens: ctx.naiveTokens,
            assembledTokens: ctx.assembledTokens,
            reductionPercent: ctx.reductionPercent,
            chunksUsed: ctx.chunks.length,
            totalDocs: index.documentCount,
            topScore: ctx.topScore,
            citations: ctx.citations,
          },
        });

        // -- PHASE 3: Build grounded prompt --
        const contextText = ctx.chunks
          .map((c) => `[${c.id}] (score:${c.score})\n${c.content}`)
          .join('\n\n---\n\n');

        const prompt = buildConferencePrompt(contextText, query);

        // -- PHASE 4: Stream Gemini 2.5 Flash --
        const llmStart = Date.now();
        let firstTokenMs = 0;
        let isFirst = true;
        let fullAnswer = '';
        // usageMetadata arrives on the chunks; keep the latest (cumulative) one.
        let lastUsage: {
          promptTokenCount?: number;
          candidatesTokenCount?: number;
          thoughtsTokenCount?: number;
          totalTokenCount?: number;
        } = {};

        const response = await getAI().models.generateContentStream({
          model: MODEL,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            temperature: 0.15, // low = factual, deterministic
            maxOutputTokens: 1024,
            thinkingConfig: {
              thinkingBudget: 512, // allow some thinking, keep it bounded
            },
          },
        });

        for await (const chunk of response) {
          if (chunk.usageMetadata) lastUsage = chunk.usageMetadata;

          const text = chunk.text ?? '';
          if (!text) continue;

          if (isFirst) {
            firstTokenMs = Date.now() - llmStart;
            isFirst = false;
            send({
              type: 'first_token',
              latencyMs: firstTokenMs,
              naiveEstimateMs: Math.round(ctx.naiveTokens * 0.65),
            });
          }

          fullAnswer += text;
          send({ type: 'text', content: text });
        }

        // -- PHASE 5: Final metrics (usageMetadata + faithfulness) --
        const totalLlmMs = Date.now() - llmStart;

        const promptTokens = lastUsage.promptTokenCount ?? 0;
        const outputTokens = lastUsage.candidatesTokenCount ?? 0;
        const thinkingTokens = lastUsage.thoughtsTokenCount ?? 0;
        const totalTokens = lastUsage.totalTokenCount ?? 0;

        const actualCost = calcCost(promptTokens, outputTokens, thinkingTokens);
        const naiveCost = calcCost(ctx.naiveTokens, outputTokens, thinkingTokens * 8);

        const faithfulness = verifyAnswer(fullAnswer, ctx.chunks);

        const metrics: QueryMetrics = {
          sigmap: {
            assemblyMs: sigmapMs,
            naiveTokens: ctx.naiveTokens,
            assembledTokens: ctx.assembledTokens,
            reductionPercent: ctx.reductionPercent,
            chunksUsed: ctx.chunks.length,
            totalDocs: index.documentCount,
            topScore: ctx.topScore,
            citations: ctx.citations,
          },
          gemini: {
            promptTokenCount: promptTokens,
            candidatesTokenCount: outputTokens,
            thoughtsTokenCount: thinkingTokens,
            totalTokenCount: totalTokens,
            firstTokenMs,
            totalMs: totalLlmMs,
          },
          faithfulness,
          cost: {
            actualUsd: actualCost.toFixed(7),
            naiveUsd: naiveCost.toFixed(7),
            savedUsd: (naiveCost - actualCost).toFixed(7),
          },
        };

        send({ type: 'final_metrics', metrics });

        // Follow-up suggestions: LLM-generated when enabled (default), else the
        // instant deterministic templates. Streamed last so they never block
        // the answer itself.
        const templateFollowUps = buildFollowUps(ctx.chunks, excludeQuestions);
        const useLLM = process.env.LLM_FOLLOWUPS !== 'false';
        let followUps = useLLM
          ? await buildFollowUpsLLM(contextText, query, fullAnswer, templateFollowUps)
          : templateFollowUps;
        // Final guard: drop anything already asked (the LLM occasionally echoes
        // the question back despite the prompt), then top up from templates.
        followUps = followUps.filter((q) => !excludeQuestions.has(normQ(q)));
        for (const t of templateFollowUps) {
          if (followUps.length >= 3) break;
          if (!followUps.some((q) => normQ(q) === normQ(t))) followUps.push(t);
        }
        send({ type: 'suggestions', items: followUps.slice(0, 3) });
        send({ type: 'done' });
      } catch (err: unknown) {
        console.error('[/api/query]', err);
        send({
          type: 'error',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering on Cloud Run
    },
  });
}
