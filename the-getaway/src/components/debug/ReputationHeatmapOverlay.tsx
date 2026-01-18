import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { selectReputationHeatmapEnabled } from '../../store/selectors/reputationSelectors';
import { ReputationProfile } from '../../game/systems/reputation';

const CELL_SIZE = 12;

const containerStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  display: 'grid',
  gap: '1px',
  padding: '4px',
  zIndex: 2,
};

const buildCellStyle = (value: number): React.CSSProperties => {
  const clamped = Math.max(-30, Math.min(30, value));
  const intensity = Math.abs(clamped) / 30;
  const baseColor = clamped >= 0 ? '56, 189, 248' : '248, 113, 113';

  return {
    backgroundColor: `rgba(${baseColor}, ${0.15 + intensity * 0.55})`,
    border: '1px solid rgba(148, 163, 184, 0.18)',
    color: '#e2e8f0',
    fontSize: '0.55rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textShadow: '0 1px 2px rgba(15, 23, 42, 0.6)',
  } as React.CSSProperties;
};

const computeCellValue = (profile: ReputationProfile | undefined): number => {
  if (!profile) {
    return 0;
  }

  const heroic = profile.traits.heroic?.value ?? 0;
  const cruel = profile.traits.cruel?.value ?? 0;
  const intimidating = profile.traits.intimidating?.value ?? 0;
  return heroic - cruel + intimidating * 0.4;
};

const ReputationHeatmapOverlay: React.FC = () => {
  const enabled = useSelector(selectReputationHeatmapEnabled);
  const testMode = useSelector((state: RootState) => state.settings.testMode);
  const reputationSystemsEnabled = useSelector(
    (state: RootState) => Boolean(state.settings.reputationSystemsEnabled)
  );
  const mapArea = useSelector((state: RootState) => state.world.currentMapArea);
  const profiles = useSelector((state: RootState) => state.reputation.profiles);

  const cells = useMemo(() => {
    if (!mapArea || !reputationSystemsEnabled) {
      return [] as Array<{ id: string; value: number }>;
    }
    const cols = Math.ceil(mapArea.width / CELL_SIZE);
    const rows = Math.ceil(mapArea.height / CELL_SIZE);
    const output: Array<{ id: string; value: number }> = [];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const id = `${col}:${row}`;
        output.push({ id, value: computeCellValue(profiles[id]) });
      }
    }
    return output;
  }, [mapArea, profiles, reputationSystemsEnabled]);

  const gridStyle = useMemo(() => {
    if (!mapArea || !reputationSystemsEnabled) {
      return containerStyle;
    }
    const cols = Math.ceil(mapArea.width / CELL_SIZE);
    const rows = Math.ceil(mapArea.height / CELL_SIZE);
    return {
      ...containerStyle,
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`,
    } as React.CSSProperties;
  }, [mapArea, reputationSystemsEnabled]);

  if (!reputationSystemsEnabled || !enabled || !testMode || !mapArea) {
    return null;
  }

  return (
    <div style={gridStyle} aria-hidden>
      {cells.map((cell) => (
        <div key={cell.id} style={buildCellStyle(cell.value)}>
          {cell.value === 0 ? '' : cell.value.toFixed(0)}
        </div>
      ))}
    </div>
  );
};

export default ReputationHeatmapOverlay;
