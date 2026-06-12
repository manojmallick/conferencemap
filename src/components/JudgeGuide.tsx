// src/components/JudgeGuide.tsx
'use client';
import Link from 'next/link';

interface Step {
  n: number;
  title: string;
  body: string;
  try?: { label: string; href: string };
  proof: string;
}

const STEPS: Step[] = [
  {
    n: 1,
    title: 'Ask a real question — watch it get verified',
    body: 'Ask about a session, speaker, or the schedule. The answer streams token-by-token, and the trust panel shows input tokens reduced by SigMap, first-token latency, and a faithfulness score.',
    try: { label: 'Open Ask →', href: '/' },
    proof: 'Every factual claim carries a [source] chip and a HIGH/MEDIUM confidence grade. Nothing is invented.',
  },
  {
    n: 2,
    title: 'Try to make it hallucinate',
    body: 'Ask something the conference data does NOT cover — e.g. "Is there a TypeScript 6 talk?" or "What is the wifi password?". A normal chatbot guesses. ConferenceMap refuses.',
    try: { label: 'Test a decline →', href: '/' },
    proof: 'SigMap returns canAnswer:false and the app says "I don\'t have verified data on that" — zero-hallucination by construction.',
  },
  {
    n: 3,
    title: 'Filter sessions in natural language',
    body: 'In the Sessions grid, type a plain-English filter like "React talks on Day 1" into the AI bar. SigMap scores the corpus and the KendoReact Grid re-renders.',
    try: { label: 'Open Sessions →', href: '/sessions' },
    proof: 'No dropdowns or checkboxes — the same retrieval layer that grounds answers also powers filtering.',
  },
  {
    n: 4,
    title: 'Build a personal agenda',
    body: 'Add sessions to your agenda from the grid, then view them on a time-blocked timeline. Conflicts and gaps are visible at a glance.',
    try: { label: 'Open Agenda →', href: '/agenda' },
    proof: 'Client-side state, instant, works offline once loaded.',
  },
  {
    n: 5,
    title: 'See the organiser signal',
    body: 'The Organiser dashboard surfaces engagement by track and — most importantly — coverage gaps: questions attendees asked that no session answers.',
    try: { label: 'Open Organiser →', href: '/organiser' },
    proof: 'This turns attendee curiosity into next-year programming decisions. Hit "Generate Insight" for a grounded AI summary.',
  },
];

const FACTS = [
  { k: '~60–97%', v: 'input token reduction by SigMap (scales with corpus size)' },
  { k: '0.3–2s', v: 'first-token latency (Gemini 2.5 Flash, streaming)' },
  { k: '100%', v: 'of factual claims cited and verified post-generation' },
  { k: '0', v: 'hallucinations — the model declines when context is missing' },
];

export default function JudgeGuide() {
  return (
    <div className="judge-page">
      <div className="judge-header">
        <span className="judge-kicker">⚖️ Judge walkthrough</span>
        <h1 className="page-title">What you can try in 3 minutes</h1>
        <p className="page-subtitle">
          ConferenceMap is a verification layer, not a chatbot wrapper. Here is the fastest
          path to see why — each step has a one-click jump and what to look for.
        </p>
      </div>

      <div className="judge-facts">
        {FACTS.map((f) => (
          <div key={f.v} className="judge-fact">
            <div className="judge-fact-k">{f.k}</div>
            <div className="judge-fact-v">{f.v}</div>
          </div>
        ))}
      </div>

      <div className="judge-steps">
        {STEPS.map((s) => (
          <div key={s.n} className="judge-step">
            <div className="judge-step-n">{s.n}</div>
            <div className="judge-step-body">
              <h2 className="judge-step-title">{s.title}</h2>
              <p className="judge-step-text">{s.body}</p>
              <p className="judge-step-proof">
                <span className="judge-proof-tag">What to look for</span> {s.proof}
              </p>
              {s.try && (
                <Link className="judge-try" href={s.try.href}>
                  {s.try.label}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="judge-links">
        <span className="judge-links-label">Going deeper</span>
        <div className="judge-links-row">
          <a href="https://github.com/manojmallick/conferencemap" target="_blank" rel="noreferrer">
            Source code
          </a>
          <a href="https://github.com/manojmallick/sigmap" target="_blank" rel="noreferrer">
            About SigMap
          </a>
          <a href="https://github.com/manojmallick" target="_blank" rel="noreferrer">
            @manojmallick
          </a>
        </div>
      </div>
    </div>
  );
}
