import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Phaser from 'phaser';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { selectZoneHeat, selectLeadingWitnessMemories } from '../../store/selectors/suspicionSelectors';
import { selectParanoiaSnapshot, selectParanoiaState } from '../../store/selectors/paranoiaSelectors';
import {
  selectReputationHeatmapEnabled,
  selectInspectorTargetId,
  makeSelectProfile,
  makeSelectTopTraitsForScope,
} from '../../store/selectors/reputationSelectors';
import { toggleReputationHeatmap, setInspectorTarget, ingestReputationEvent } from '../../store/reputationSlice';
import { setGameTime, DAY_START_SECONDS, NIGHT_START_SECONDS, MIDDAY_SECONDS } from '../../store/worldSlice';
import { DEFAULT_DAY_NIGHT_CONFIG } from '../../game/world/dayNightCycle';

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
const formatTraitLabel = (trait: string): string =>
  trait.charAt(0).toUpperCase() + trait.slice(1);

const formatCycleClock = (seconds: number): string => {
  if (!Number.isFinite(seconds)) {
    return '—';
  }
  const total = DEFAULT_DAY_NIGHT_CONFIG.cycleDuration;
  const normalized = ((seconds % total) + total) % total;
  const minutes = Math.floor(normalized / 60);
  const secs = Math.floor(normalized % 60);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '0.64rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'rgba(226, 232, 240, 0.72)',
};

const sectionHeaderButtonStyle: React.CSSProperties = {
  all: 'unset',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.5rem',
  width: '100%',
  marginBottom: '0.35rem',
  cursor: 'pointer',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'rgba(226, 232, 240, 0.86)',
};

const sectionChevronStyle: React.CSSProperties = {
  fontSize: '0.68rem',
  color: 'rgba(148, 163, 184, 0.72)',
};

const hiddenSectionStyle: React.CSSProperties = {
  display: 'none',
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

const miniButtonStyle: React.CSSProperties = {
  all: 'unset',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.35rem 0.65rem',
  borderRadius: '0.55rem',
  border: '1px solid rgba(148, 163, 184, 0.45)',
  background: 'rgba(15, 23, 42, 0.88)',
  color: 'rgba(226, 232, 240, 0.92)',
  fontSize: '0.58rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  cursor: 'pointer',
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

const EMPTY_TOP_TRAITS: ReturnType<ReturnType<typeof makeSelectTopTraitsForScope>> = [];

const GameDebugInspector: React.FC<Props> = ({ zoneId, rendererInfo }) => {
  const dispatch = useDispatch<AppDispatch>();
  const resolvedZoneId = zoneId ?? 'unknown';
  const heatSelector = useMemo(() => selectZoneHeat(resolvedZoneId), [resolvedZoneId]);
  const leadingSelector = useMemo(
    () => selectLeadingWitnessMemories(resolvedZoneId),
    [resolvedZoneId]
  );
  const heatmapEnabled = useSelector(selectReputationHeatmapEnabled);
  const inspectorTargetId = useSelector(selectInspectorTargetId);
  const npcs = useSelector((state: RootState) => state.world.currentMapArea.entities.npcs);
  const mapArea = useSelector((state: RootState) => state.world.currentMapArea);
  const testMode = useSelector((state: RootState) => state.settings.testMode);
  const reputationSystemsEnabled = useSelector(
    (state: RootState) => Boolean(state.settings.reputationSystemsEnabled)
  );
  const profileSelector = useMemo(() => (inspectorTargetId ? makeSelectProfile(inspectorTargetId) : null), [inspectorTargetId]);
  const traitsSelector = useMemo(() => (inspectorTargetId ? makeSelectTopTraitsForScope(inspectorTargetId, 4) : null), [inspectorTargetId]);
  const selectedProfile = useSelector((state: RootState) => (profileSelector ? profileSelector(state) : null));
  const topTraits = useSelector((state: RootState) =>
    traitsSelector ? traitsSelector(state) : EMPTY_TOP_TRAITS
  );
  type SectionKey = 'renderer' | 'time' | 'suspicion' | 'reputation' | 'paranoia';
  const [sectionCollapsed, setSectionCollapsed] = useState<Record<SectionKey, boolean>>({
    renderer: false,
    time: false,
    suspicion: false,
    reputation: false,
    paranoia: false,
  });
  const sectionLabels: Record<SectionKey, string> = {
    renderer: 'Renderer diagnostics',
    time: 'Time/lighting debug',
    suspicion: 'Suspicion snapshot',
    reputation: 'Reputation debug',
    paranoia: 'Paranoia debug',
  };
  const [seedStatus, setSeedStatus] = useState<string | null>(null);
  const [timeStatus, setTimeStatus] = useState<string | null>(null);

  const toggleSection = useCallback((key: SectionKey) => {
    setSectionCollapsed((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  useEffect(() => {
    if (!inspectorTargetId && npcs.length > 0) {
      dispatch(setInspectorTarget(npcs[0].id));
    }
  }, [dispatch, inspectorTargetId, npcs]);

  const handleSetDay = useCallback(() => {
    const target = MIDDAY_SECONDS || DAY_START_SECONDS;
    dispatch(setGameTime(target));
    setTimeStatus(`Set to day (${formatCycleClock(target)})`);
  }, [dispatch]);

  const handleSetNight = useCallback(() => {
    dispatch(setGameTime(NIGHT_START_SECONDS));
    setTimeStatus(`Set to night (${formatCycleClock(NIGHT_START_SECONDS)})`);
  }, [dispatch]);

  const inspectorNpc = useMemo(() => npcs.find((npc) => npc.id === inspectorTargetId), [npcs, inspectorTargetId]);
  const [collapsed, setCollapsed] = useState(true);
  const mode = resolveRuntimeMode();
  const heat = useSelector((state: RootState) => heatSelector(state));
  const leading = useSelector((state: RootState) => leadingSelector(state));
  const paranoia = useSelector((state: RootState) => selectParanoiaState(state));
  const snapshot = useSelector(selectParanoiaSnapshot);
  const worldTime = useSelector((state: RootState) => state.world.currentTime);
  const worldTimeOfDay = useSelector((state: RootState) => state.world.timeOfDay);

  const seedSampleEvent = useCallback(() => {
    if (!reputationSystemsEnabled) {
      setSeedStatus('Reputation systems are disabled for MVP.');
      return;
    }
    if (!inspectorTargetId || !mapArea) {
      setSeedStatus('Select an NPC inside the current map to seed a sample event.');
      return;
    }

    const npc = npcs.find((entry) => entry.id === inspectorTargetId);
    if (!npc) {
      setSeedStatus('Selected NPC is no longer present in this area.');
      return;
    }

    dispatch(
      ingestReputationEvent({
        actorId: 'player',
        actorLabel: 'Player',
        zoneId: mapArea.zoneId ?? 'zone::debug',
        position: { ...npc.position },
        intensity: 'legendary',
        traits: {
          heroic: 28,
          intimidating: 8,
        },
        tags: ['debug_sample'],
        mapArea,
        npcsOverride: [npc],
        ambientLighting: 1,
        ambientNoise: 0.8,
        disguisePenalty: 0,
        timestamp: Date.now(),
      })
    );
    setSeedStatus(`Seeded a heroic event around ${npc.name}. If nothing appears, try again nearby or toggle the reputation heatmap.`);
  }, [dispatch, inspectorTargetId, mapArea, npcs, reputationSystemsEnabled]);

  useEffect(() => {
    if (seedStatus && topTraits.length > 0) {
      setSeedStatus(null);
    }
  }, [seedStatus, topTraits.length]);

  if (mode === 'production' || !testMode) {
    return null;
  }

  const panelId = 'command-debug-panel';
  const rendererLabel = rendererInfo?.label ?? 'Detecting…';
  const rendererDetail = rendererInfo?.detail ?? 'Negotiating renderer';
  const buttonCopy = collapsed ? 'Show Debug Inspector' : 'Hide Debug Inspector';

  const renderSection = (
    key: SectionKey,
    title: React.ReactNode,
    renderContent: () => React.ReactNode,
    contentIdSuffix: string
  ) => {
    const collapsedState = sectionCollapsed[key];
    const contentId = `${panelId}-${contentIdSuffix}`;
    const labelText = typeof title === 'string' ? title : sectionLabels[key];
    return (
      <section>
        <button
          type="button"
          style={sectionHeaderButtonStyle}
          onClick={() => toggleSection(key)}
          aria-expanded={!collapsedState}
          aria-controls={contentId}
          aria-label={`${collapsedState ? 'Expand' : 'Collapse'} ${labelText}`}
        >
          <span style={sectionTitleStyle}>{title}</span>
          <span style={sectionChevronStyle}>{collapsedState ? '▸' : '▾'}</span>
        </button>
        <div
          id={contentId}
          style={collapsedState ? hiddenSectionStyle : undefined}
          aria-hidden={collapsedState}
        >
          {!collapsedState ? renderContent() : null}
        </div>
      </section>
    );
  };

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
          {renderSection('renderer', 'Renderer Diagnostics', () => (
            <>
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
            </>
          ), 'renderer')}

          {renderSection('time', 'Time & Lighting', () => (
            <>
              <div style={metricRowStyle}>
                <span>Current</span>
                <strong>{formatCycleClock(worldTime)} · {worldTimeOfDay}</strong>
              </div>
              <div style={metricRowStyle}>
                <span>Cycle Duration</span>
                <strong>{DEFAULT_DAY_NIGHT_CONFIG.cycleDuration}s</strong>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                <button type="button" style={miniButtonStyle} onClick={handleSetDay}>
                  Set Day
                </button>
                <button type="button" style={miniButtonStyle} onClick={handleSetNight}>
                  Set Night
                </button>
              </div>
              {timeStatus && (
                <div style={{ fontSize: '0.62rem', color: 'rgba(96, 165, 250, 0.8)' }}>{timeStatus}</div>
              )}
            </>
          ), 'time')}

          {reputationSystemsEnabled && renderSection('suspicion', `Suspicion Snapshot · ${resolvedZoneId}`, () => (
            <>
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
            </>
          ), 'suspicion')}

          {reputationSystemsEnabled && renderSection('reputation', `Reputation Debug · ${inspectorNpc?.name ?? 'Local Cell'}`, () => (
            <>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.45rem' }}>
                <button
                  type="button"
                  style={{
                    ...miniButtonStyle,
                    borderColor: heatmapEnabled
                      ? 'rgba(96, 165, 250, 0.65)'
                      : miniButtonStyle.border as string | undefined,
                  }}
                  onClick={() => dispatch(toggleReputationHeatmap(!heatmapEnabled))}
                >
                  {heatmapEnabled ? 'Hide Heatmap' : 'Show Heatmap'}
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.45rem' }}>
                {npcs.length ? (
                  npcs.map((npc) => (
                    <button
                      key={npc.id}
                      type="button"
                      style={{
                        ...miniButtonStyle,
                        borderColor:
                          inspectorTargetId === npc.id
                            ? 'rgba(96, 165, 250, 0.65)'
                            : miniButtonStyle.border as string | undefined,
                      }}
                      onClick={() => dispatch(setInspectorTarget(npc.id))}
                      aria-pressed={inspectorTargetId === npc.id}
                    >
                      {npc.name}
                    </button>
                  ))
                ) : (
                  <span style={{ fontSize: '0.68rem', opacity: 0.6 }}>No NPCs in this map.</span>
                )}
              </div>
              <div style={{ fontSize: '0.62rem', color: 'rgba(148, 163, 184, 0.75)', marginBottom: '0.35rem' }}>
                1) Pick an NPC in the active cell. 2) Trigger an in-game action or use the seed button below. 3) Inspect the traits that populate here and toggle the heatmap to see cell sentiment.
              </div>
              {selectedProfile ? (
                topTraits.length ? (
                  <ul style={listStyle}>
                    {topTraits.map((trait) => {
                      const traitSample = selectedProfile.traits[trait.trait];
                      const sources = traitSample?.sources ?? [];
                      return (
                        <li key={trait.trait} style={pillStyle}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.7rem',
                              marginBottom: '0.18rem',
                            }}
                          >
                            <span>{formatTraitLabel(trait.trait)}</span>
                            <span>{trait.value.toFixed(1)}</span>
                          </div>
                          <div style={{ fontSize: '0.64rem', opacity: 0.72 }}>
                            Confidence {Math.round(trait.confidence * 100)}%
                          </div>
                          {sources.length ? (
                            <div style={{ fontSize: '0.62rem', opacity: 0.62, marginTop: '0.2rem' }}>
                              Rumors: {sources.slice(0, 3).join(', ')}
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.62rem', opacity: 0.45, marginTop: '0.2rem' }}>
                              No rumor sources tracked.
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div style={{ display: 'grid', gap: '0.35rem' }}>
                    <div style={{ fontSize: '0.68rem', opacity: 0.6 }}>
                      No localized reputation yet. Trigger a nearby event so NPCs can witness something.
                    </div>
                    <button
                      type="button"
                      onClick={seedSampleEvent}
                      style={{
                        ...miniButtonStyle,
                        borderColor: 'rgba(96, 165, 250, 0.55)',
                        justifyContent: 'center',
                      }}
                      disabled={!mapArea}
                    >
                      Seed Sample Heroic Event
                    </button>
                    {seedStatus && (
                      <div style={{ fontSize: '0.62rem', color: 'rgba(96, 165, 250, 0.8)' }}>{seedStatus}</div>
                    )}
                  </div>
                )
              ) : (
                <div style={{ display: 'grid', gap: '0.35rem' }}>
                  <div style={{ fontSize: '0.68rem', opacity: 0.6 }}>
                    Select an NPC to inspect reputation.
                  </div>
                  <button
                    type="button"
                    onClick={seedSampleEvent}
                    style={{
                      ...miniButtonStyle,
                      borderColor: 'rgba(96, 165, 250, 0.55)',
                      justifyContent: 'center',
                    }}
                    disabled={!mapArea}
                  >
                    Seed Sample Heroic Event
                  </button>
                  {seedStatus && (
                    <div style={{ fontSize: '0.62rem', color: 'rgba(96, 165, 250, 0.8)' }}>{seedStatus}</div>
                  )}
                </div>
              )}
            </>
          ), 'reputation')}

          {renderSection('paranoia', `Paranoia Debug · ${paranoia.tier}`, () => (
            <>
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
            </>
          ), 'paranoia')}
        </div>
      )}
    </div>
  );
};

export default GameDebugInspector;
