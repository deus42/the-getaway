import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { WitnessMemory } from '../../game/systems/suspicion/types';
import { selectZoneHeat, selectLeadingWitnessMemories } from '../../store/selectors/suspicionSelectors';
import type { RootState } from '../../store';

type Props = {
  zoneId: string | null | undefined;
};

const formatPercentage = (value: number): string =>
  `${Math.round(value * 100)}`;

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

const SuspicionInspector: React.FC<Props> = ({ zoneId }) => {
  const resolvedZoneId = zoneId ?? 'unknown';
  const heatSelector = useMemo(() => selectZoneHeat(resolvedZoneId), [resolvedZoneId]);
  const leadingSelector = useMemo(
    () => selectLeadingWitnessMemories(resolvedZoneId),
    [resolvedZoneId]
  );

  const heat = useSelector((state: RootState) => heatSelector(state));
  const leading = useSelector((state: RootState) => leadingSelector(state));

  const mode = resolveRuntimeMode();

  if (mode === 'production') {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '2.5rem',
        left: '1rem',
        padding: '0.75rem 1rem',
        borderRadius: '0.75rem',
        backgroundColor: 'rgba(12, 18, 28, 0.88)',
        color: '#e5edff',
        backdropFilter: 'blur(6px)',
        border: '1px solid rgba(64, 90, 130, 0.55)',
        width: 'min(320px, 26vw)',
        pointerEvents: 'none',
        zIndex: 4000,
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '0.35rem',
          fontFamily: '"DM Mono","IBM Plex Mono",monospace',
        }}
      >
        <span style={{ letterSpacing: '0.16em', fontSize: '0.68rem', textTransform: 'uppercase' }}>
          Suspicion Snapshot
        </span>
        <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{resolvedZoneId}</span>
      </header>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.65rem',
          fontSize: '0.82rem',
          fontFamily: '"DM Mono","IBM Plex Mono",monospace',
        }}
      >
        <span>Tier: {heat.tier}</span>
        <span>Heat: {heat.totalHeat.toFixed(2)}</span>
      </div>
      {leading.length > 0 ? (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'grid',
            gap: '0.45rem',
          }}
        >
          {leading.map((memory: WitnessMemory) => (
            <li
              key={memory.id}
              style={{
                padding: '0.45rem 0.55rem',
                borderRadius: '0.55rem',
                backgroundColor: 'rgba(24, 36, 52, 0.78)',
                border: '1px solid rgba(70, 104, 150, 0.3)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: '"DM Mono","IBM Plex Mono",monospace',
                  fontSize: '0.75rem',
                  marginBottom: '0.2rem',
                }}
              >
                <span>{memory.witnessLabel ?? memory.witnessId}</span>
                <span>{formatPercentage(memory.certainty)}%</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.7rem',
                  opacity: 0.75,
                  fontFamily: '"DM Mono","IBM Plex Mono",monospace',
                }}
              >
                <span>{memory.recognitionChannel}</span>
                <span>{memory.reported ? 'reported' : 'unreported'}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ fontSize: '0.72rem', opacity: 0.65, margin: 0 }}>No active witnesses.</p>
      )}
    </div>
  );
};

export default SuspicionInspector;
