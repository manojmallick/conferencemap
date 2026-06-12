// src/components/OrganiserDashboard.tsx
'use client';
import { useState } from 'react';
import { TileLayout } from '@progress/kendo-react-layout';
import { Button } from '@progress/kendo-react-buttons';
import { Loader } from '@progress/kendo-react-indicators';

// Simulated analytics (in real app, persist queries server-side)
const MOCK_TOP_QUESTIONS = [
  { q: 'Who is speaking about React Server Components?', count: 47, hasSession: true },
  { q: 'What workshops are available on Day 2?', count: 38, hasSession: true },
  { q: 'How do I get to the venue?', count: 31, hasSession: false },
  { q: 'What does Progress KendoUI offer?', count: 29, hasSession: true },
  { q: 'Is there a TypeScript 6 talk?', count: 22, hasSession: false },
  { q: 'Who won the hackathon last year?', count: 18, hasSession: false },
];

const MOCK_ENGAGEMENT = [
  { track: 'React Core', queries: 89 },
  { track: 'AI/ML', queries: 74 },
  { track: 'JavaScript', queries: 52 },
  { track: 'Workshop', queries: 41 },
  { track: 'Sponsored', queries: 33 },
];

export default function OrganiserDashboard() {
  const [aiInsight, setAiInsight] = useState('');
  const [loading, setLoading] = useState(false);

  const gaps = MOCK_TOP_QUESTIONS.filter((q) => !q.hasSession);

  const getInsight = async () => {
    setLoading(true);
    setAiInsight('');
    const res = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Summarize the main topics at this conference and what attendees most want to know',
      }),
    });
    const reader = res.body!.getReader();
    const dec = new TextDecoder();
    let text = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of dec
        .decode(value)
        .split('\n')
        .filter((l) => l.startsWith('data: '))) {
        const ev = JSON.parse(line.slice(6));
        if (ev.type === 'text') {
          text += ev.content;
          setAiInsight(text);
        }
        if (ev.type === 'done') setLoading(false);
      }
    }
    setLoading(false);
  };

  const TILES = [
    {
      header: 'KPIs',
      body: (
        <div className="kpi-grid">
          {[
            { label: 'Total Queries', value: '247', delta: '+12%' },
            { label: 'Avg Tokens Saved', value: '97.5%', delta: 'SigMap' },
            { label: 'Avg Latency', value: '0.8s', delta: 'first token' },
            { label: 'Grounded Rate', value: '96%', delta: 'verified' },
          ].map((k) => (
            <div key={k.label} className="kpi-card">
              <div className="kpi-value">{k.value}</div>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-delta">{k.delta}</div>
            </div>
          ))}
        </div>
      ),
    },
    {
      header: 'Engagement by Track',
      body: (
        <div className="engagement-bars">
          {MOCK_ENGAGEMENT.map((e) => (
            <div key={e.track} className="eng-row">
              <span className="eng-track">{e.track}</span>
              <div className="eng-bar-wrap">
                <div className="eng-bar" style={{ width: `${(e.queries / 89) * 100}%` }} />
              </div>
              <span className="eng-count">{e.queries}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      header: '⚠ Coverage Gaps - Top Unanswered Questions',
      body: (
        <div className="gaps-list">
          {gaps.map((g, i) => (
            <div key={i} className="gap-row">
              <span className="gap-count">{g.count}×</span>
              <span className="gap-q">&quot;{g.q}&quot;</span>
              <span className="gap-badge gap-badge--missing">No session covers this</span>
            </div>
          ))}
          <p className="gaps-hint">
            Consider adding these topics to your next event programme.
          </p>
        </div>
      ),
    },
    {
      header: 'AI Programme Insight',
      body: (
        <div className="insight-block">
          <Button onClick={getInsight} themeColor="primary" disabled={loading}>
            {loading ? <Loader size="small" type="pulsing" /> : '✦ Generate Insight'}
          </Button>
          {aiInsight && <p className="insight-text">{aiInsight}</p>}
        </div>
      ),
    },
  ];

  return (
    <div className="organiser-page">
      <div className="organiser-header">
        <h1 className="page-title">Organiser Dashboard</h1>
        <p className="page-subtitle">Real-time attendee signals · Verified by SigMap</p>
      </div>
      <TileLayout
        columns={2}
        rowHeight={280}
        gap={{ rows: 16, columns: 16 }}
        items={TILES.map((t, i) => ({
          defaultPosition: {
            col: (i % 2) + 1,
            row: Math.floor(i / 2) + 1,
            colSpan: 1,
            rowSpan: 1,
          },
          header: t.header,
          body: t.body,
        }))}
        style={{ padding: 0 }}
      />
    </div>
  );
}
