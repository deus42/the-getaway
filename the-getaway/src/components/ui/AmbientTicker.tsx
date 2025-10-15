import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getUIStrings } from '../../content/ui';
import { selectEnvironment } from '../../store/selectors/worldSelectors';
import { findSignageVariantById, findWeatherPresetById } from '../../content/environment';
import { StoryFunctionTag } from '../../game/interfaces/environment';

const containerStyle: React.CSSProperties = {
  width: 'min(92vw, 320px)',
  background: 'linear-gradient(160deg, rgba(8, 47, 73, 0.92), rgba(8, 47, 73, 0.78))',
  border: '1px solid rgba(56, 189, 248, 0.35)',
  borderRadius: '14px',
  padding: '0.75rem 0.95rem',
  color: '#e0f2fe',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.55rem',
  boxShadow: '0 10px 26px rgba(7, 89, 133, 0.25)',
  fontFamily: "'DM Mono', 'IBM Plex Mono', monospace",
  pointerEvents: 'auto',
  backdropFilter: 'blur(4px)',
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: '0.58rem',
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  color: 'rgba(125, 211, 252, 0.85)',
};

const flagListStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '0.35rem 0.45rem',
};

const flagChipStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.18rem',
  padding: '0.25rem 0.4rem',
  background: 'rgba(15, 118, 110, 0.16)',
  border: '1px solid rgba(34, 211, 238, 0.32)',
  borderRadius: '10px',
};

const flagLabelStyle: React.CSSProperties = {
  fontSize: '0.55rem',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'rgba(94, 234, 212, 0.75)',
};

const flagValueStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  fontWeight: 600,
  color: '#cffafe',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
};

const entryStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  padding: '0.35rem 0.4rem 0.45rem',
  borderRadius: '10px',
  background: 'rgba(30, 64, 175, 0.12)',
  border: '1px solid rgba(59, 130, 246, 0.28)',
};

const entryLabelStyle: React.CSSProperties = {
  fontSize: '0.6rem',
  textTransform: 'uppercase',
  letterSpacing: '0.22em',
  color: 'rgba(191, 219, 254, 0.85)',
};

const entryTextStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  lineHeight: 1.35,
  color: '#e2e8f0',
};

const storyTagStyle: React.CSSProperties = {
  alignSelf: 'flex-start',
  padding: '0.12rem 0.45rem',
  borderRadius: '999px',
  fontSize: '0.56rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  background: 'rgba(147, 197, 253, 0.18)',
  color: '#bfdbfe',
  border: '1px solid rgba(147, 197, 253, 0.35)',
};

type RumorView = {
  groupId: string;
  lines: string[];
  storyFunction?: StoryFunctionTag;
};

type SignageView = {
  signId: string;
  text: string;
  storyFunction?: StoryFunctionTag;
};

const normalizeStoryFunction = (tag?: StoryFunctionTag) =>
  tag ? tag.replace(/-/g, ' ').toUpperCase() : null;

const formatFlagValue = (flag: string, value: string | number): string => {
  if (typeof value === 'number') {
    return value.toString();
  }
  switch (flag) {
    case 'gangHeat':
    case 'supplyScarcity':
    case 'blackoutTier':
      return value.replace(/_/g, ' ').toUpperCase();
    default:
      return value.toString().toUpperCase();
  }
};

const AmbientTicker: React.FC = () => {
  const locale = useSelector((state: RootState) => state.settings.locale);
  const environment = useSelector(selectEnvironment);
  const { ambientTicker: strings } = getUIStrings(locale);

  const latestRumor = useMemo<RumorView | null>(() => {
    const entries = Object.entries(environment.rumorSets).map(([groupId, snapshot]) => ({
      groupId,
      lines: snapshot.lines,
      storyFunction: snapshot.storyFunction,
      updatedAt: snapshot.updatedAt,
    }));

    if (!entries.length) {
      return null;
    }

    entries.sort((a, b) => b.updatedAt - a.updatedAt);
    const head = entries[0];
    return {
      groupId: head.groupId,
      lines: head.lines,
      storyFunction: head.storyFunction,
    };
  }, [environment.rumorSets]);

  const latestSignage = useMemo<SignageView | null>(() => {
    const entries = Object.entries(environment.signage).map(([signId, snapshot]) => ({
      signId,
      storyFunction: snapshot.storyFunction,
      updatedAt: snapshot.updatedAt,
      variantId: snapshot.variantId,
    }));

    if (!entries.length) {
      return null;
    }

    entries.sort((a, b) => b.updatedAt - a.updatedAt);
    const head = entries[0];
    const variant = findSignageVariantById(head.variantId);

    if (!variant) {
      return {
        signId: head.signId,
        text: strings.fallback.signage,
        storyFunction: head.storyFunction,
      };
    }

    return {
      signId: head.signId,
      text: variant.text,
      storyFunction: variant.storyFunction,
    };
  }, [environment.signage, strings.fallback.signage]);

  const weatherSummary = useMemo(() => {
    if (!environment.weather.presetId) {
      return {
        text: strings.fallback.weather,
        storyFunction: environment.weather.storyFunction,
      };
    }

    const preset = findWeatherPresetById(environment.weather.presetId);

    return {
      text: preset?.description ?? strings.fallback.weather,
      storyFunction: preset?.storyFunction ?? environment.weather.storyFunction,
    };
  }, [environment.weather, strings.fallback.weather]);

  const flags = environment.flags;

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={sectionLabelStyle}>{strings.panelTitle}</span>
      </div>

      <div>
        <span style={sectionLabelStyle}>{strings.flagsLabel}</span>
        <div style={flagListStyle}>
          <div style={flagChipStyle}>
            <span style={flagLabelStyle}>{strings.flagLabels.gangHeat}</span>
            <span style={flagValueStyle}>{formatFlagValue('gangHeat', flags.gangHeat)}</span>
          </div>
          <div style={flagChipStyle}>
            <span style={flagLabelStyle}>{strings.flagLabels.curfew}</span>
            <span style={flagValueStyle}>{formatFlagValue('curfewLevel', flags.curfewLevel)}</span>
          </div>
          <div style={flagChipStyle}>
            <span style={flagLabelStyle}>{strings.flagLabels.supply}</span>
            <span style={flagValueStyle}>{formatFlagValue('supplyScarcity', flags.supplyScarcity)}</span>
          </div>
          <div style={flagChipStyle}>
            <span style={flagLabelStyle}>{strings.flagLabels.blackout}</span>
            <span style={flagValueStyle}>{formatFlagValue('blackoutTier', flags.blackoutTier)}</span>
          </div>
        </div>
      </div>

      <div style={entryStyle}>
        <span style={entryLabelStyle}>{strings.rumorLabel}</span>
        <span style={entryTextStyle}>
          {latestRumor?.lines?.[0] ?? strings.fallback.rumor}
        </span>
        {normalizeStoryFunction(latestRumor?.storyFunction) && (
          <span style={storyTagStyle}>{normalizeStoryFunction(latestRumor?.storyFunction)}</span>
        )}
      </div>

      <div style={entryStyle}>
        <span style={entryLabelStyle}>{strings.signageLabel}</span>
        <span style={entryTextStyle}>{latestSignage?.text ?? strings.fallback.signage}</span>
        {normalizeStoryFunction(latestSignage?.storyFunction) && (
          <span style={storyTagStyle}>{normalizeStoryFunction(latestSignage?.storyFunction)}</span>
        )}
      </div>

      <div style={entryStyle}>
        <span style={entryLabelStyle}>{strings.weatherLabel}</span>
        <span style={entryTextStyle}>{weatherSummary.text}</span>
        {normalizeStoryFunction(weatherSummary.storyFunction) && (
          <span style={storyTagStyle}>{normalizeStoryFunction(weatherSummary.storyFunction)}</span>
        )}
      </div>
    </div>
  );
};

export default AmbientTicker;
