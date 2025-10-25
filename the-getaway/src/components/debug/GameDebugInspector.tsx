import React, { useMemo, useState } from 'react';
import Phaser from 'phaser';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { selectZoneHeat, selectLeadingWitnessMemories } from '../../store/selectors/suspicionSelectors';
import { selectParanoiaSnapshot, selectParanoiaState } from '../../store/selectors/paranoiaSelectors';

type Props = {
  zoneId: string | null | undefined;
  rendererInfo?: {
    label?: string;
    detail?: string;
  } | null;
};

const resolveRuntimeMode = (): string => {
  if (typeof process !== 'undefined' && typeof process.env?.NODE_ENV === 'string') {
    return process.env.NODE_ENV;
  }

  if (typeof window !== 'undefined') {
    const browserWindow = window as typeof window & { __VITE_MODE__?: string };
    if (typeof browserWindow.__VITE_MODE__ === 'string') {
      return browserWindow.__VITE_MODE__;
    }
  }

  return 'development';
};

const formatPercentage = (value: number): string => `${Math.round(value * 100)}`;

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '0.64rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'rgba(226, 232, 240, 0.72)',
  marginBottom: '0.4rem',
};

const metricRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.78rem',
  marginBottom: '0.22rem',
};

const listStyle: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'grid',
  gap: '0.35rem',
};

const pillStyle: React.CSSProperties = {
  padding: '0.45rem 0.55rem',
  borderRadius: '0.55rem',
  backgroundColor: 'rgba(24, 36, 52, 0.78)',
  border: '1px solid rgba(70, 104, 150, 0.3)',
};

const wrapperStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '0.5rem',
  pointerEvents: 'auto',
};

const toggleButtonStyle: React.CSSProperties = {
  all: 'unset',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.45rem',
  padding: '0.45rem 0.85rem',
  borderRadius: '999px',
  border: '1px solid rgba(59, 130, 246, 0.42)',
  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.92))',
  color: '#e2e8f0',
  fontFamily: '"DM Mono","IBM Plex Mono",monospace',
  fontSize: '0.62rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
};

const panelContainerStyle: React.CSSProperties = {
  padding: '0.85rem 1rem',
  borderRadius: '0.85rem',
  backgroundColor: 'rgba(12, 18, 28, 0.9)',
  color: '#f1f5ff',
  backdropFilter: 'blur(6px)',
  border: '1px solid rgba(59, 130, 246, 0.38)',
  width: 'min(360px, 28vw)',
  display: 'grid',
  gap: '0.75rem',
  fontFamily: '"DM Mono","IBM Plex Mono",monospace',
  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.32)',
  zIndex: 5,
};

const GameDebugInspector: React.FC<Props> = ({ zoneId, rendererInfo }) => {
  const resolvedZoneId = zoneId ?? 'unknown';
  const heatSelector = useMemo(() => selectZoneHeat(resolvedZoneId), [resolvedZoneId]);
  const leadingSelector = useMemo(
    () => selectLeadingWitnessMemories(resolvedZoneId),
    [resolvedZoneId]
  );
  const [collapsed, setCollapsed] = useState(true);
  const mode = resolveRuntimeMode();
  const testMode = useSelector((state: RootState) => state.settings.testMode);
  const heat = useSelector((state: RootState) => heatSelector(state));
  const leading = useSelector((state: RootState) => leadingSelector(state));
  const paranoia = useSelector((state: RootState) => selectParanoiaState(state));
  const snapshot = useSelector(selectParanoiaSnapshot);

  if (mode === 'production' || !testMode) {
    return null;
  }

  const panelId = 'command-debug-panel';
  const rendererLabel = rendererInfo?.label ?? 'Detecting…';
  const rendererDetail = rendererInfo?.detail ?? 'Negotiating renderer';
  const buttonCopy = collapsed ? 'Show Debug Inspector' : 'Hide Debug Inspector';

  return (
    <div style={wrapperStyle}>
      <button
        type="button"
        style={toggleButtonStyle}
        onClick={() => setCollapsed((prev) => !prev)}
        aria-expanded={!collapsed}
        aria-controls={panelId}
      >
        <span>{buttonCopy}</span>
        <span style={{ fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.75 }}>
          {rendererLabel}
        </span>
      </button>

      {!collapsed && (
        <div id={panelId} style={panelContainerStyle} role="region" aria-label="Debug Inspector">
          <section>
            <div style={sectionTitleStyle}>Renderer Diagnostics</div>
            <div style={metricRowStyle}>
              <span>Mode</span>
              <span>{rendererLabel}</span>
            </div>
            <div style={{ ...metricRowStyle, alignItems: 'flex-start' }}>
              <span>Detail</span>
              <span style={{ textAlign: 'right', maxWidth: '18rem' }}>{rendererDetail}</span>
            </div>
            <div style={metricRowStyle}>
              <span>Phaser</span>
              <span>{Phaser.VERSION}</span>
            </div>
          </section>

          <section>
            <div style={sectionTitleStyle}>Suspicion Snapshot · {resolvedZoneId}</div>
            <div style={metricRowStyle}>
              <span>Heat Tier</span>
              <span>{heat.tier}</span>
            </div>
            <div style={metricRowStyle}>
              <span>Total Heat</span>
              <span>{heat.totalHeat.toFixed(2)}</span>
            </div>
            {leading.length > 0 ? (
              <ul style={listStyle}>
                {leading.map((memory) => (
                  <li key={memory.id} style={pillStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '0.18rem' }}>
                      <span>{memory.witnessLabel ?? memory.witnessId}</span>
                      <span>{formatPercentage(memory.certainty)}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', opacity: 0.75 }}>
                      <span>{memory.recognitionChannel}</span>
                      <span>{memory.reported ? 'reported' : 'unreported'}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ fontSize: '0.7rem', opacity: 0.65 }}>No active witnesses.</div>
            )}
          </section>

          <section>
            <div style={sectionTitleStyle}>Paranoia Debug · {paranoia.tier}</div>
            <div style={metricRowStyle}>
              <span>Value</span>
              <span>{paranoia.value.toFixed(1)}</span>
            </div>
            {snapshot ? (
              <div style={{ display: 'grid', gap: '0.3rem', fontSize: '0.72rem' }}>
                <div>
                  <strong style={{ opacity: 0.8 }}>Δ</strong>{' '}
                  {snapshot.delta >= 0 ? '+' : ''}{snapshot.delta.toFixed(3)}
                </div>
                <div>
                  <strong style={{ opacity: 0.8 }}>Gains</strong>{' '}
                  {Object.keys(snapshot.breakdown.gains).length === 0
                    ? '—'
                    : Object.entries(snapshot.breakdown.gains)
                        .map(([key, amount]) => `${key}:${amount.toFixed(3)}`)
                        .join(' | ')}
                </div>
                <div>
                  <strong style={{ opacity: 0.8 }}>Losses</strong>{' '}
                  {Object.keys(snapshot.breakdown.losses).length === 0
                    ? '—'
                    : Object.entries(snapshot.breakdown.losses)
                        .map(([key, amount]) => `${key}:${amount.toFixed(3)}`)
                        .join(' | ')}
                </div>
                <div>
                  <strong style={{ opacity: 0.8 }}>Spikes</strong>{' '}
                  {Object.keys(snapshot.breakdown.spikes).length === 0
                    ? '—'
                    : Object.entries(snapshot.breakdown.spikes)
                        .map(([key, amount]) => `${key}:${amount.toFixed(3)}`)
                        .join(' | ')}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.7rem', opacity: 0.65 }}>No recent paranoia stimuli.</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default GameDebugInspector;
