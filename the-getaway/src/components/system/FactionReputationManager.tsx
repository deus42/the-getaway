import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { addLogMessage } from '../../store/logSlice';
import { consumeFactionReputationEvents } from '../../store/playerSlice';
import { getUIStrings } from '../../content/ui';
import { selectPendingFactionEvents } from '../../store/selectors/factionSelectors';
import { FactionStanding, FactionId } from '../../game/interfaces/types';
import { Locale } from '../../content/locales';
import { getLocalizedStandingLabel } from '../../game/systems/factions';

interface FactionToast {
  id: string;
  factionId: FactionId;
  message: string;
  standingNote?: string;
  rivalNote?: string;
  color: string;
}

const toastStackStyle: React.CSSProperties = {
  position: 'fixed',
  top: '80px',
  right: '28px',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.45rem',
  zIndex: 9999,
  pointerEvents: 'none',
};

const toastCardStyle = (accent: string): React.CSSProperties => ({
  minWidth: '220px',
  maxWidth: '280px',
  borderRadius: '12px',
  border: `1px solid ${accent}`,
  background: 'rgba(15, 23, 42, 0.92)',
  boxShadow: '0 18px 32px rgba(2, 6, 23, 0.45)',
  padding: '0.55rem 0.7rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.28rem',
  color: 'rgba(226, 232, 240, 0.95)',
  pointerEvents: 'auto',
});

const toastTitleStyle: React.CSSProperties = {
  fontSize: '0.64rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
};

const toastDetailStyle: React.CSSProperties = {
  fontSize: '0.58rem',
  lineHeight: 1.35,
  color: 'rgba(203, 213, 225, 0.92)',
};

const formatDelta = (delta: number): string => {
  if (delta === 0) {
    return '±0';
  }
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta}`;
};

const buildPrimaryMessage = (
  locale: Locale,
  factionName: string,
  delta: number,
  reason?: string
): string => {
  const deltaFragment = `${formatDelta(delta)}`;
  if (locale === 'uk') {
    return reason
      ? `${factionName}: ${deltaFragment} репутації — ${reason}`
      : `${factionName}: ${deltaFragment} репутації`;
  }
  return reason
    ? `${factionName} reputation ${deltaFragment} — ${reason}`
    : `${factionName} reputation ${deltaFragment}`;
};

const buildStandingNote = (
  locale: Locale,
  standing: FactionStanding
): string => {
  const label = getLocalizedStandingLabel(locale, standing);
  return locale === 'uk' ? `Новий статус: ${label}` : `Standing now ${label}`;
};

const buildRivalNote = (
  locale: Locale,
  rivalName: string,
  delta: number,
  standing?: FactionStanding
): string => {
  const deltaFragment = formatDelta(delta);
  const standingFragment =
    standing !== undefined ? getLocalizedStandingLabel(locale, standing) : undefined;

  if (locale === 'uk') {
    return standingFragment
      ? `${rivalName}: ${deltaFragment}, статус ${standingFragment}`
      : `${rivalName}: ${deltaFragment}`;
  }

  return standingFragment
    ? `${rivalName} ${deltaFragment} (${standingFragment})`
    : `${rivalName} ${deltaFragment}`;
};

const TOAST_DURATION_MS = 4200;

export const FactionReputationManager: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const events = useSelector(selectPendingFactionEvents);
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = useMemo(() => getUIStrings(locale), [locale]);
  const factionNames = uiStrings.playerStatus.factions;
  const [toasts, setToasts] = useState<FactionToast[]>([]);
  const timeoutRefs = useRef<Record<string, number>>({});

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const handle = timeoutRefs.current[id];
    if (handle) {
      window.clearTimeout(handle);
      delete timeoutRefs.current[id];
    }
  }, []);

  useEffect(() => {
    if (!events.length) {
      return;
    }

    const newToasts: FactionToast[] = [];

    events.forEach((event) => {
      const factionName = factionNames[event.factionId] ?? event.factionId;
      const primaryStandingChange = event.standingChanges.find(
        (change) => change.factionId === event.factionId
      );
      const rivalStandingChange = event.standingChanges.find(
        (change) => change.factionId !== event.factionId
      );

      const rivalEntries = Object.entries(event.rivalDeltas ?? {});
      const rivalEntry = rivalEntries.length > 0 ? rivalEntries[0] : undefined;

      const standingNote = primaryStandingChange
        ? buildStandingNote(locale, primaryStandingChange.nextStanding as FactionStanding)
        : undefined;

      const rivalNote = rivalEntry
        ? buildRivalNote(
            locale,
            factionNames[rivalEntry[0] as FactionId] ?? rivalEntry[0],
            rivalEntry[1],
            rivalStandingChange ? (rivalStandingChange.nextStanding as FactionStanding) : undefined
          )
        : undefined;

      const hasReputationDelta = event.delta !== 0;
      const message = hasReputationDelta
        ? buildPrimaryMessage(locale, factionName, event.delta, event.reason)
        : standingNote ?? buildPrimaryMessage(locale, factionName, event.delta, event.reason);

      const toastId = `${event.factionId}-${event.timestamp}`;

      const accentColor = event.delta > 0
        ? 'rgba(56, 189, 248, 0.65)'
        : event.delta < 0
          ? 'rgba(248, 113, 113, 0.65)'
          : 'rgba(148, 163, 184, 0.65)';

      newToasts.push({
        id: toastId,
        factionId: event.factionId,
        message,
        standingNote,
        rivalNote,
        color: accentColor,
      });

      dispatch(addLogMessage(message));
      if (standingNote && standingNote !== message) {
        dispatch(addLogMessage(standingNote));
      }
      if (rivalNote) {
        dispatch(addLogMessage(rivalNote));
      }
    });

    setToasts((prev) => {
      const merged = [...prev, ...newToasts];
      return merged.slice(-6);
    });

    newToasts.forEach((toast) => {
      const handle = window.setTimeout(() => removeToast(toast.id), TOAST_DURATION_MS);
      timeoutRefs.current[toast.id] = handle;
    });

    dispatch(consumeFactionReputationEvents());
  }, [dispatch, events, factionNames, locale, removeToast]);

  useEffect(() => () => {
    Object.values(timeoutRefs.current).forEach((handle) => window.clearTimeout(handle));
    timeoutRefs.current = {};
  }, []);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div style={toastStackStyle} aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div key={toast.id} style={toastCardStyle(toast.color)}>
          <span style={toastTitleStyle}>{toast.message}</span>
          {toast.standingNote && <span style={toastDetailStyle}>{toast.standingNote}</span>}
          {toast.rivalNote && <span style={toastDetailStyle}>{toast.rivalNote}</span>}
        </div>
      ))}
    </div>
  );
};

export default FactionReputationManager;
