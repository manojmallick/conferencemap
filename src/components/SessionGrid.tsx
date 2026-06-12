// src/components/SessionGrid.tsx
'use client';
import { useState, useEffect } from 'react';
import { Grid, GridColumn } from '@progress/kendo-react-grid';
import { Input } from '@progress/kendo-react-inputs';
import { Button } from '@progress/kendo-react-buttons';
import { Loader } from '@progress/kendo-react-indicators';

interface Session {
  id: string;
  title: string;
  speaker: string;
  track: string;
  day: number;
  start: string;
  end: string;
  room: string;
  type: string;
}

const TRACK_COLORS: Record<string, string> = {
  'React Core': '#3B82F6',
  'AI/ML': '#F59E0B',
  JavaScript: '#10B981',
  Sponsored: '#8B5CF6',
  Workshop: '#EC4899',
};

export default function SessionGrid() {
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [displayed, setDisplayed] = useState<Session[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [filtering, setFiltering] = useState(false);
  const [filterLabel, setFilterLabel] = useState('');
  const [selectedDay, setSelectedDay] = useState<1 | 2 | 0>(0);

  useEffect(() => {
    fetch('/api/sessions')
      .then((r) => r.json())
      .then((data) => {
        setAllSessions(data);
        setDisplayed(data);
      });
  }, []);

  const applyDayFilter = (day: 0 | 1 | 2, sessions: Session[]) =>
    day === 0 ? sessions : sessions.filter((s) => s.day === day);

  const handleAIFilter = async () => {
    if (!aiInput.trim()) {
      setDisplayed(applyDayFilter(selectedDay, allSessions));
      setFilterLabel('');
      return;
    }
    setFiltering(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiFilter: aiInput }),
      });
      const { sessions, explanation } = await res.json();
      setDisplayed(applyDayFilter(selectedDay, sessions));
      setFilterLabel(explanation ?? '');
    } finally {
      setFiltering(false);
    }
  };

  const handleDayFilter = (day: 0 | 1 | 2) => {
    setSelectedDay(day);
    setDisplayed(applyDayFilter(day, allSessions));
  };

  const TrackCell = (props: any) => (
    <td>
      <span
        className="track-chip"
        style={{ borderColor: TRACK_COLORS[props.dataItem.track] ?? '#6B7280' }}
      >
        {props.dataItem.track}
      </span>
    </td>
  );

  const TimeCell = (props: any) => (
    <td className="time-cell">
      <span className="day-badge">D{props.dataItem.day}</span>
      {props.dataItem.start}-{props.dataItem.end}
    </td>
  );

  const AddCell = (props: any) => (
    <td>
      <Button
        size="small"
        fillMode="outline"
        onClick={() => {
          const key = 'conferencemap_agenda';
          const existing = JSON.parse(sessionStorage.getItem(key) ?? '[]');
          if (!existing.find((s: Session) => s.id === props.dataItem.id)) {
            sessionStorage.setItem(key, JSON.stringify([...existing, props.dataItem]));
          }
        }}
      >
        + Agenda
      </Button>
    </td>
  );

  return (
    <div className="sessions-page">
      <div className="sessions-header">
        <h1 className="page-title">Session Browser</h1>

        {/* AI Filter bar */}
        <div className="ai-filter-bar">
          <span className="ai-filter-icon">✦</span>
          <Input
            value={aiInput}
            onChange={(e) => setAiInput(e.value as string)}
            onKeyDown={(e) => e.key === 'Enter' && handleAIFilter()}
            placeholder="Ask: Show me AI talks after lunch on Day 1..."
            className="ai-filter-input"
          />
          <Button onClick={handleAIFilter} disabled={filtering} themeColor="primary">
            {filtering ? <Loader size="small" type="pulsing" /> : 'Filter'}
          </Button>
          {aiInput && (
            <Button
              onClick={() => {
                setAiInput('');
                setDisplayed(applyDayFilter(selectedDay, allSessions));
                setFilterLabel('');
              }}
              fillMode="flat"
            >
              ✕
            </Button>
          )}
        </div>

        {filterLabel && <p className="filter-label">{filterLabel}</p>}

        {/* Day filter pills */}
        <div className="day-pills">
          {(
            [
              ['All', 0],
              ['Day 1', 1],
              ['Day 2', 2],
            ] as const
          ).map(([label, val]) => (
            <button
              key={val}
              onClick={() => handleDayFilter(val as 0 | 1 | 2)}
              className={`day-pill ${selectedDay === val ? 'day-pill--active' : ''}`}
            >
              {label}
            </button>
          ))}
          <span className="session-count">{displayed.length} sessions</span>
        </div>
      </div>

      <Grid data={displayed} style={{ height: 'calc(100vh - 260px)' }} sortable resizable>
        <GridColumn field="start" title="Time" width={130} cell={TimeCell} />
        <GridColumn field="track" title="Track" width={150} cell={TrackCell} />
        <GridColumn field="title" title="Session" />
        <GridColumn field="speaker" title="Speaker" width={170} />
        <GridColumn field="room" title="Room" width={110} />
        <GridColumn field="type" title="Type" width={90} />
        <GridColumn title="" width={100} cell={AddCell} />
      </Grid>
    </div>
  );
}
