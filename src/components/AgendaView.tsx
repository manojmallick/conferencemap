// src/components/AgendaView.tsx
'use client';
import { useState, useEffect } from 'react';

interface Session {
  id: string;
  title: string;
  speaker: string;
  track: string;
  day: number;
  start: string;
  end: string;
  room: string;
}

const HOURS = Array.from({ length: 10 }, (_, i) => i + 9); // 9AM-6PM

const TRACK_BG: Record<string, string> = {
  'React Core': 'rgba(59,130,246,0.2)',
  'AI/ML': 'rgba(245,158,11,0.2)',
  JavaScript: 'rgba(16,185,129,0.2)',
  Sponsored: 'rgba(139,92,246,0.2)',
  Workshop: 'rgba(236,72,153,0.2)',
};

function timeToY(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (((h - 9) * 60 + m) / 540) * 100; // 9h = 540min
}
function timeToPct(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (((eh - sh) * 60 + (em - sm)) / 540) * 100;
}

export default function AgendaView() {
  const [agenda, setAgenda] = useState<Session[]>([]);

  useEffect(() => {
    const raw = sessionStorage.getItem('conferencemap_agenda');
    if (raw) setAgenda(JSON.parse(raw));
  }, []);

  const remove = (id: string) => {
    const next = agenda.filter((s) => s.id !== id);
    setAgenda(next);
    sessionStorage.setItem('conferencemap_agenda', JSON.stringify(next));
  };

  const day1 = agenda.filter((s) => s.day === 1);
  const day2 = agenda.filter((s) => s.day === 2);

  return (
    <div className="agenda-page">
      <div className="agenda-header">
        <h1 className="page-title">My Agenda</h1>
        <p className="agenda-hint">Add sessions from the Sessions browser</p>
      </div>

      <div className="agenda-columns">
        {(
          [
            ['Day 1 - Thu 11 June', day1],
            ['Day 2 - Fri 12 June', day2],
          ] as const
        ).map(([label, sessions]) => (
          <div key={label} className="agenda-day">
            <h2 className="agenda-day-title">{label}</h2>
            <div className="agenda-timeline">
              {/* Hour lines */}
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="timeline-hour"
                  style={{ top: `${((h - 9) / 9) * 100}%` }}
                >
                  <span className="hour-label">{h}:00</span>
                  <div className="hour-line" />
                </div>
              ))}
              {/* Session blocks */}
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="agenda-session-block"
                  style={{
                    top: `${timeToY(s.start)}%`,
                    height: `${timeToPct(s.start, s.end)}%`,
                    background: TRACK_BG[s.track] ?? 'rgba(75,85,99,0.3)',
                    borderLeftColor: Object.values(TRACK_BG)[0],
                  }}
                >
                  <div className="asb-time">
                    {s.start}-{s.end}
                  </div>
                  <div className="asb-title">{s.title}</div>
                  <div className="asb-speaker">
                    {s.speaker} · {s.room}
                  </div>
                  <button className="asb-remove" onClick={() => remove(s.id)}>
                    ✕
                  </button>
                </div>
              ))}
              {sessions.length === 0 && (
                <div className="agenda-empty">Add sessions from the Sessions tab</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
