// src/app/api/query/route.ts
import { NextRequest } from 'next/server';
import { getSigMapIndex } from '@/lib/sigmap/index';
import { verifyAnswer } from '@/lib/sigmap/verify';
import { getAI, MODEL, calcCost } from '@/lib/gemini/client';
import { buildConferencePrompt } from '@/lib/gemini/prompts';
import type { QueryMetrics } from '@/lib/sigmap/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// -- SSE helper --
function sseEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// -- Main Route Handler --
export async function POST(req: NextRequest) {
  const { query } = (await req.json()) as { query: string };

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
