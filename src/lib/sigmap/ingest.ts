// src/lib/sigmap/ingest.ts
import type { CorpusDocument } from './types';

// Dynamic imports so Next.js doesn't try to bundle JSON at build time
async function loadCorpus() {
  const [sessions, speakers, sponsors, schedule] = await Promise.all([
    import('../corpus/sessions.json').then((m) => m.default),
    import('../corpus/speakers.json').then((m) => m.default),
    import('../corpus/sponsors.json').then((m) => m.default),
    import('../corpus/schedule.json').then((m) => m.default),
  ]);
  return { sessions, speakers, sponsors, schedule };
}

export async function buildCorpus(): Promise<CorpusDocument[]> {
  const { sessions, speakers, sponsors, schedule } = await loadCorpus();
  const docs: CorpusDocument[] = [];

  // -- Sessions --
  for (const s of sessions as any[]) {
    docs.push({
      id: s.id,
      content: [
        s.title,
        `Speaker: ${s.speaker}`,
        `Track: ${s.track}`,
        `Day ${s.day} at ${s.start}-${s.end} in ${s.room}`,
        `Type: ${s.type}`,
        `Level: ${s.level || 'all'}`,
        s.abstract,
        `Tags: ${(s.tags || []).join(' ')}`,
      ].join(' | '),
      metadata: s,
      type: 'session',
    });
  }

  // -- Speakers --
  for (const sp of speakers as any[]) {
    docs.push({
      id: `speaker_${sp.id}`,
      content: [
        `Speaker: ${sp.name}`,
        `Company: ${sp.company}`,
        sp.bio,
        `Topics: ${(sp.topics || []).join(' ')}`,
      ].join(' | '),
      metadata: sp,
      type: 'speaker',
    });
  }

  // -- Sponsors --
  for (const sp of sponsors as any[]) {
    docs.push({
      id: `sponsor_${sp.id}`,
      content: [
        `Sponsor: ${sp.name}`,
        `Tier: ${sp.tier}`,
        sp.description,
        `Products: ${(sp.products || []).join(' ')}`,
        `Booth: ${sp.booth}`,
        `Tags: ${(sp.tags || []).join(' ')}`,
      ].join(' | '),
      metadata: sp,
      type: 'sponsor',
    });
  }

  // -- Schedule metadata --
  const sch = schedule as any;
  docs.push({
    id: 'schedule_meta',
    content: [
      `Event: ${sch.event}`,
      `Venue: ${sch.venue}`,
      ...sch.days.map(
        (d: any) =>
          `${d.label}: ${d.keyEvents.map((e: any) => `${e.time} ${e.label}`).join(', ')}`,
      ),
    ].join(' | '),
    metadata: sch,
    type: 'schedule',
  });

  return docs;
}
