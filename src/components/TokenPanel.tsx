// src/components/TokenPanel.tsx
'use client';
import { useEffect, useState } from 'react';
import { ProgressBar } from '@progress/kendo-react-progressbars';
import type { QueryMetrics } from '@/lib/sigmap/types';

interface Props {
  preflight?: { sigmap: QueryMetrics['sigmap'] } | null;
  firstToken?: { latencyMs: number; naiveEstimateMs: number } | null;
  metrics?: QueryMetrics | null;
  isStreaming: boolean;
}

export default function TokenPanel({ preflight, firstToken, metrics, isStreaming }: Props) {
  const [animReduction, setAnimReduction] = useState(0);

  const sig = metrics?.sigmap ?? preflight?.sigmap;
  const gem = metrics?.gemini;

  // The "actual" input shown is the real prompt sent to Gemini once we have it,
  // otherwise SigMap's assembled estimate. Base the savings % on whatever number
  // is actually displayed so the bar and the "→ N" value always agree.
  const actualInput = gem?.promptTokenCount ?? sig?.assembledTokens ?? 0;
  const naiveInput = sig?.naiveTokens ?? 0;
  const targetReduction =
    naiveInput > 0 ? Math.max(0, Math.round((1 - actualInput / naiveInput) * 100)) : 0;

  // Animate the savings bar toward the target — works for both the live message
  // (preflight) and re-rendered historical messages (metrics), so stored answers
  // no longer reset to 0%.
  useEffect(() => {
    if (targetReduction <= 0) {
      setAnimReduction(0);
      return;
    }
    let cur = 0;
    const id = setInterval(() => {
      cur = Math.min(cur + 3, targetReduction);
      setAnimReduction(cur);
      if (cur >= targetReduction) clearInterval(id);
    }, 12);
    return () => clearInterval(id);
  }, [targetReduction]);

  if (!preflight && !metrics) return null;

  const faith = metrics?.faithfulness;
  const cost = metrics?.cost;
  const ft = metrics
    ? {
        latencyMs: metrics.gemini.firstTokenMs,
        naiveEstimateMs: Math.round((sig?.naiveTokens ?? 0) * 0.65),
      }
    : firstToken;
  const speedup = ft ? Math.round(ft.naiveEstimateMs / Math.max(ft.latencyMs, 1)) : null;

  return (
    <div className="token-panel">
      {/* -- Row 1: Token savings -- */}
      <div className="tp-row">
        <div className="tp-block tp-block--primary">
          <div className="tp-label">INPUT TOKENS</div>
          <div className="tp-token-compare">
            <span className="tp-naive">{(sig?.naiveTokens ?? 0).toLocaleString()}</span>
            <span className="tp-arrow">→</span>
            <span className="tp-actual">
              {(gem?.promptTokenCount ?? sig?.assembledTokens ?? 0).toLocaleString()}
            </span>
          </div>
          <ProgressBar value={animReduction} max={100} style={{ height: 6, marginTop: 6 }} />
          <div className="tp-saving-label">{animReduction}% saved by SigMap</div>
        </div>

        <div className="tp-block">
          <div className="tp-label">OUTPUT TOKENS</div>
          {gem ? (
            <div className="tp-output-breakdown">
              <div className="tp-out-row">
                <span>Answer</span>
                <span className="tp-count">{gem.candidatesTokenCount}</span>
              </div>
              {gem.thoughtsTokenCount > 0 && (
                <div className="tp-out-row tp-thinking">
                  <span>Gemini thinking</span>
                  <span className="tp-count">{gem.thoughtsTokenCount}</span>
                </div>
              )}
              <div className="tp-out-row tp-total">
                <span>Total out</span>
                <span className="tp-count">
                  {gem.candidatesTokenCount + gem.thoughtsTokenCount}
                </span>
              </div>
            </div>
          ) : (
            <div className="tp-streaming">{isStreaming ? '⏳ streaming...' : '—'}</div>
          )}
        </div>
      </div>

      {/* -- Row 2: Speed + Hallucination -- */}
      <div className="tp-row">
        <div className="tp-block">
          <div className="tp-label">⚡ SPEED</div>
          {ft ? (
            <>
              <div className="tp-out-row">
                <span>First token</span>
                <span className="tp-count tp-highlight">{ft.latencyMs}ms</span>
              </div>
              <div className="tp-out-row tp-muted">
                <span>Naive est.</span>
                <span className="tp-count tp-strikethrough">
                  ~{(ft.naiveEstimateMs / 1000).toFixed(1)}s
                </span>
              </div>
              {speedup && speedup > 1 && (
                <div className="tp-speedup-badge">{speedup}× faster</div>
              )}
            </>
          ) : (
            <div className="tp-streaming">{isStreaming ? 'Waiting...' : '—'}</div>
          )}
        </div>

        <div className="tp-block">
          <div className="tp-label">🎯 HALLUCINATION RISK</div>
          {faith ? (
            <>
              <div className={`tp-confidence tp-confidence--${faith.confidence}`}>
                {faith.confidence.toUpperCase()}
              </div>
              <div className="tp-out-row">
                <span>Claims verified</span>
                <span className="tp-count">
                  {faith.groundedClaims}/{faith.totalClaims}
                </span>
              </div>
              {faith.ungoundedClaims.length > 0 ? (
                <div className="tp-warn">⚠ {faith.ungoundedClaims.length} unverified</div>
              ) : faith.totalClaims > 0 ? (
                <div className="tp-verified">✓ All claims grounded</div>
              ) : (
                <div className="tp-verified">✓ No factual claims to verify</div>
              )}
            </>
          ) : (
            <div className="tp-streaming">{isStreaming ? 'Checking...' : '—'}</div>
          )}
        </div>
      </div>

      {/* -- Row 3: Cost (compact) -- */}
      {cost && (
        <div className="tp-cost-row">
          <span className="tp-cost-label">Cost:</span>
          <span className="tp-cost-actual">${cost.actualUsd}</span>
          <span className="tp-cost-sep">vs</span>
          <span className="tp-cost-naive">${cost.naiveUsd}</span>
          <span className="tp-cost-saved">(saved ${cost.savedUsd})</span>
        </div>
      )}

      {/* -- Citations -- */}
      {sig?.citations && sig.citations.length > 0 && (
        <div className="tp-citations">
          <span className="tp-cite-label">Sources:</span>
          {sig.citations.map((c) => (
            <span key={c.sourceId} className={`tp-cite-chip tp-cite-${c.sourceType}`}>
              {c.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
