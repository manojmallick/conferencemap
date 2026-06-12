// src/app/api/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSigMapIndex } from '@/lib/sigmap/index';

// GET - return all sessions for Grid
export async function GET() {
  const { default: sessions } = await import('@/lib/corpus/sessions.json');
  return NextResponse.json(sessions);
}

// POST - AI filter: natural language -> matching session IDs
export async function POST(req: NextRequest) {
  const { aiFilter } = await req.json();
  const { default: sessions } = await import('@/lib/corpus/sessions.json');

  if (!aiFilter?.trim()) {
    return NextResponse.json(sessions);
  }

  // Use SigMap to find matching sessions
  const index = await getSigMapIndex();
  const result = index.assembleContext(aiFilter, 15); // higher K for filtering

  if (!result.canAnswer) {
    return NextResponse.json(sessions); // return all if no match
  }

  // Get IDs of matched session chunks
  const matchedIds = new Set(
    result.chunks.filter((c) => c.type === 'session').map((c) => c.id),
  );

  const filtered = (sessions as any[]).filter((s) => matchedIds.has(s.id));

  return NextResponse.json({
    sessions: filtered.length > 0 ? filtered : sessions,
    matchedCount: filtered.length,
    explanation: `Showing ${filtered.length} sessions matching "${aiFilter}"`,
  });
}
