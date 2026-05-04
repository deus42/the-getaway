import React, {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  selectMissionProgress,
  selectNextPrimaryObjective,
} from '../../store/selectors/missionSelectors';
import { getUIStrings } from '../../content/ui';
import { getLevel0GuidedStep } from '../../game/quests/level0GuidedSlice';
import {
  LEVEL_ADVANCE_REQUESTED_EVENT,
  MISSION_ACCOMPLISHED_EVENT,
  LevelAdvanceEventDetail,
  MissionEventDetail,
} from '../../game/systems/missionProgression';
import '../../styles/hud-george.css';
const FEED_ENTRY_LIMIT = 12;
const RECOVERY_PARANOIA_THRESHOLD = 35;

type FeedCategory =
  | 'operation'
  | 'status'
  | 'interjection'
  | 'player'
  | 'broadcast'
  | 'battle'
  | 'dialog'
  | 'stealth';
type FeedTone =
  | 'operation'
  | 'status'
  | 'broadcast'
  | 'player'
  | 'battle'
  | 'dialog'
  | 'stealth';

type FeedEntry = {
  id: string;
  category: FeedCategory;
  text: string;
  label: string;
  timestamp: number;
  badge: string;
  tone: FeedTone;
};

type FeedEntryPayload = {
  category: FeedCategory;
  text: string;
  label: string;
  timestamp: number;
};

const FEED_CATEGORY_META: Record<FeedCategory, { badge: string; tone: FeedTone }> = {
  operation: { badge: 'OP', tone: 'operation' },
  status: { badge: 'ST', tone: 'status' },
  interjection: { badge: 'BC', tone: 'broadcast' },
  player: { badge: 'ME', tone: 'player' },
  broadcast: { badge: 'BC', tone: 'broadcast' },
  battle: { badge: 'BT', tone: 'battle' },
  dialog: { badge: 'DG', tone: 'dialog' },
  stealth: { badge: 'SF', tone: 'stealth' },
};

const DEFAULT_FEED_META: { badge: string; tone: FeedTone } = { badge: '--', tone: 'broadcast' };


type GeorgeOrbLogoProps = {
  size?: number;
  className?: string;
};

const GeorgeOrbLogo: React.FC<GeorgeOrbLogoProps> = ({ size = 32, className }) => {
  const id = useId();
  const bgGradientId = `${id}-bg`;
  const glowGradientId = `${id}-glow`;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={bgGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" stopOpacity={1} />
          <stop offset="100%" stopColor="#0f172a" stopOpacity={1} />
        </linearGradient>
        <linearGradient id={glowGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity={1} />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity={1} />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill={`url(#${bgGradientId})`} />
      <path d="M32 16 L46 24 L32 32 L18 24 Z" fill="#475569" opacity="0.6" />
      <circle cx="32" cy="32" r="10" fill="none" stroke={`url(#${glowGradientId})`} strokeWidth="2.5" />
      <circle cx="32" cy="32" r="6" fill="none" stroke={`url(#${glowGradientId})`} strokeWidth="1.5" />
      <line x1="32" y1="22" x2="32" y2="26" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="38" x2="32" y2="42" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
      <line x1="22" y1="32" x2="26" y2="32" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
      <line x1="38" y1="32" x2="42" y2="32" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="32" r="2" fill="#38bdf8" />
      <path d="M8 8 L12 8 L12 12" fill="none" stroke="#0ea5e9" strokeWidth="1.5" opacity={0.4} />
      <path d="M56 8 L52 8 L52 12" fill="none" stroke="#0ea5e9" strokeWidth="1.5" opacity={0.4} />
      <path d="M8 56 L12 56 L12 52" fill="none" stroke="#0ea5e9" strokeWidth="1.5" opacity={0.4} />
      <path d="M56 56 L52 56 L52 52" fill="none" stroke="#0ea5e9" strokeWidth="1.5" opacity={0.4} />
    </svg>
  );
};

const clampText = (text: string): string => {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= 220) {
    return normalized;
  }
  return `${normalized.slice(0, 217).trimEnd()}…`;
};

const GeorgeAssistant: React.FC = () => {
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = useMemo(() => getUIStrings(locale), [locale]);
  const georgeStrings = useMemo(() => uiStrings.george, [uiStrings]);

  const {
    feedLabels,
    levelAdvance: levelAdvanceMessage,
    missionComplete: missionCompleteMessage,
    askPlaceholder,
    askInputLabel,
    sendLabel,
  } = georgeStrings;

  const missionProgress = useSelector(selectMissionProgress);
  const nextPrimaryObjective = useSelector(selectNextPrimaryObjective);
  const quests = useSelector((state: RootState) => state.quests.quests);
  const world = useSelector((state: RootState) => state.world);
  const paranoiaValue = useSelector((state: RootState) => state.paranoia.value);

  const [feedEntries, setFeedEntries] = useState<FeedEntry[]>([]);
  const [promptValue, setPromptValue] = useState('');

  const missionSummaryRef = useRef<string>('');
  const promptInputRef = useRef<HTMLInputElement | null>(null);
  const maintainFocusRef = useRef(false);
  const queueRef = useRef<FeedEntry[]>([]);
  const queueTimerRef = useRef<number | null>(null);

  const flushQueue = useCallback(() => {
    if (!queueRef.current.length) {
      queueTimerRef.current = null;
      return;
    }
    const next = queueRef.current.shift();
    if (next) {
      setFeedEntries((prev) => {
        const updated = [...prev, next];
        if (updated.length > FEED_ENTRY_LIMIT) {
          return updated.slice(updated.length - FEED_ENTRY_LIMIT);
        }
        return updated;
      });
    }
    queueTimerRef.current = window.setTimeout(flushQueue, 1000);
  }, []);

  const enqueueFeedEntry = useCallback(
    ({ category, label, text, timestamp }: { category: FeedCategory; label: string; text: string; timestamp?: number }) => {
      const entryTimestamp = timestamp ?? Date.now();
      const meta = FEED_CATEGORY_META[category] ?? DEFAULT_FEED_META;
      const entry: FeedEntry = {
        id: `${entryTimestamp}-${Math.random().toString(36).slice(2)}`,
        category,
        text: clampText(text),
        label,
        timestamp: entryTimestamp,
        badge: meta.badge,
        tone: meta.tone,
      };
      queueRef.current = [...queueRef.current, entry];
      if (queueTimerRef.current === null) {
        flushQueue();
      }
    },
    [flushQueue]
  );

  const routeFeedEntry = useCallback(
    (entry: FeedEntryPayload) => {
      enqueueFeedEntry(entry);
    },
    [enqueueFeedEntry]
  );

  const handlePromptChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setPromptValue(event.target.value);
  }, []);

  const handlePromptSubmit = useCallback((event?: FormEvent<HTMLFormElement>) => {
    if (event) {
      event.preventDefault();
    }
    const trimmed = promptValue.trim();
    if (!trimmed) {
      promptInputRef.current?.focus();
      return;
    }
    enqueueFeedEntry({
      category: 'player',
      label: feedLabels.player,
      text: trimmed,
      timestamp: Date.now(),
    });
    setPromptValue('');
    promptInputRef.current?.focus();

    const response = missionSummaryRef.current || georgeStrings.guidanceIntro;
    enqueueFeedEntry({
      category: 'interjection',
      label: feedLabels.interjection,
      text: response,
      timestamp: Date.now(),
    });
  }, [enqueueFeedEntry, feedLabels.interjection, feedLabels.player, georgeStrings.guidanceIntro, promptValue]);

  useEffect(() => {
    return () => {
      if (queueTimerRef.current !== null) {
        window.clearTimeout(queueTimerRef.current);
        queueTimerRef.current = null;
      }
      queueRef.current = [];
    };
  }, []);

  useEffect(() => {
    const levelName = missionProgress?.name ?? georgeStrings.zoneFallback;
    const missionLines: string[] = [];
    const curfewWindow = uiStrings.dayNight.curfewWindow('22:00', '06:00');
    const guidedStep = getLevel0GuidedStep(quests);
    let guidanceCategory: FeedCategory = 'operation';

    switch (guidedStep.stage) {
      case 'lira-start':
        missionLines.push(georgeStrings.sliceGuidance.talkToLira);
        break;
      case 'lira-keycard':
        if (!world.curfewActive) {
          missionLines.push(georgeStrings.sliceGuidance.waitForNight(curfewWindow));
        } else if (paranoiaValue >= RECOVERY_PARANOIA_THRESHOLD) {
          missionLines.push(georgeStrings.sliceGuidance.recoverAtSafehouse);
          guidanceCategory = 'status';
        } else {
          missionLines.push(georgeStrings.sliceGuidance.nightRoute);
          guidanceCategory = 'stealth';
        }
        break;
      case 'lira-return':
        missionLines.push(georgeStrings.sliceGuidance.returnToLira);
        break;
      case 'naila-start':
        missionLines.push(georgeStrings.sliceGuidance.talkToNaila);
        break;
      case 'naila-datapad':
        missionLines.push(georgeStrings.sliceGuidance.findDatapad);
        break;
      case 'naila-return':
        missionLines.push(georgeStrings.sliceGuidance.returnToNaila);
        break;
      case 'brant-start':
        missionLines.push(georgeStrings.sliceGuidance.talkToBrant);
        break;
      case 'brant-tokens':
        missionLines.push(georgeStrings.sliceGuidance.findTransitTokens);
        break;
      case 'brant-return':
        missionLines.push(georgeStrings.sliceGuidance.returnToBrant);
        break;
      case 'complete':
        missionLines.push(georgeStrings.sliceGuidance.complete);
        break;
      default:
        break;
    }

    if (missionProgress) {
      if (missionProgress.allPrimaryComplete) {
        missionLines.push(georgeStrings.guidancePrimaryComplete(levelName));
      } else if (nextPrimaryObjective) {
        const progress = nextPrimaryObjective.totalQuests > 1
          ? georgeStrings.guidanceProgress(nextPrimaryObjective.completedQuests ?? 0, nextPrimaryObjective.totalQuests)
          : '';
        missionLines.push(georgeStrings.guidancePrimaryObjective(nextPrimaryObjective.label, progress));
      }
    }

    const segments = [georgeStrings.guidanceIntro];
    if (missionLines.length > 0) {
      segments.push(...missionLines);
    }

    const message = segments.join('\n').trim();
    if (!message || missionSummaryRef.current === message) {
      return;
    }
    missionSummaryRef.current = message;
    routeFeedEntry({
      category: guidanceCategory,
      label: feedLabels[guidanceCategory],
      text: message,
      timestamp: Date.now(),
    });
  }, [
    feedLabels,
    feedLabels.operation,
    georgeStrings,
    missionProgress,
    nextPrimaryObjective,
    paranoiaValue,
    quests,
    routeFeedEntry,
    uiStrings.dayNight,
    world.curfewActive,
  ]);

  const formatTimestamp = useCallback((value: number): string => {
    if (!value) {
      return '';
    }
    try {
      return new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(value));
    } catch {
      return new Date(value).toLocaleTimeString();
    }
  }, [locale]);

  useEffect(() => {
    const handleMissionAccomplished = (event: Event) => {
      const detail = (event as CustomEvent<MissionEventDetail>).detail;
      if (!detail) {
        return;
      }

      const message = missionCompleteMessage(detail.name);
      routeFeedEntry({
        category: 'operation',
        label: feedLabels.operation,
        text: message,
        timestamp: Date.now(),
      });
    };

    const handleLevelAdvance = (event: Event) => {
      const detail = (event as CustomEvent<LevelAdvanceEventDetail>).detail;
      if (!detail) {
        return;
      }

      const nextDescriptor = detail.nextLevelId ?? `level ${detail.nextLevel}`;
      const message = levelAdvanceMessage(nextDescriptor);
      routeFeedEntry({
        category: 'operation',
        label: feedLabels.operation,
        text: message,
        timestamp: Date.now(),
      });
    };

    window.addEventListener(MISSION_ACCOMPLISHED_EVENT, handleMissionAccomplished as EventListener);
    window.addEventListener(LEVEL_ADVANCE_REQUESTED_EVENT, handleLevelAdvance as EventListener);

    return () => {
      window.removeEventListener(MISSION_ACCOMPLISHED_EVENT, handleMissionAccomplished as EventListener);
      window.removeEventListener(LEVEL_ADVANCE_REQUESTED_EVENT, handleLevelAdvance as EventListener);
    };
  }, [
    feedLabels.operation,
    levelAdvanceMessage,
    missionCompleteMessage,
    routeFeedEntry,
  ]);

  const feedViewRef = useRef<HTMLDivElement | null>(null);
  const handleSendPointerDown = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    promptInputRef.current?.focus();
  }, []);

  const handleInputFocus = useCallback(() => {
    maintainFocusRef.current = true;
  }, []);

  const handleInputBlur = useCallback(() => {
    maintainFocusRef.current = false;
  }, []);

  useEffect(() => {
    const node = feedViewRef.current;
    if (!node) {
      return;
    }
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
    if (maintainFocusRef.current) {
      promptInputRef.current?.focus();
    }
  }, [feedEntries]);

  const placeholderEntry: FeedEntry = {
    id: 'george-placeholder',
    category: 'status',
    text: georgeStrings.logEmpty,
    label: feedLabels.broadcast,
    timestamp: 0,
    badge: 'NB',
    tone: 'broadcast',
  };

  const entriesToRender = feedEntries.length > 0 ? feedEntries : [placeholderEntry];
  const hasRealEntries = feedEntries.length > 0;
  const lastEntryIndex = entriesToRender.length - 1;
  const isPromptEmpty = promptValue.trim().length === 0;

  return (
    <div className="george-inline" data-controller-focus-ignore="true">
      <div className="george-chat" role="log" aria-live="polite" ref={feedViewRef}>
        {entriesToRender.map((entry, index) => {
          const isLatest = hasRealEntries && index === lastEntryIndex;
          const timestampLabel = entry.timestamp ? formatTimestamp(entry.timestamp) : '';
          return (
            <div key={entry.id} className="george-chat-entry">
              <div className="george-chat-avatar" aria-hidden="true">
                <GeorgeOrbLogo size={32} />
              </div>
              <div className={`george-chat-bubble george-chat-bubble--${entry.tone}${isLatest ? ' george-chat-bubble--latest' : ''}`}>
                <div className="george-chat-bubble__header">
                  <div className="george-chat-bubble__title">
                    <span className={`george-chat-badge george-chat-badge--${entry.tone}`} aria-hidden="true">{entry.badge}</span>
                    <span className="george-chat-bubble__label">{entry.label}</span>
                  </div>
                  {timestampLabel ? <span className="george-chat-bubble__time">{timestampLabel}</span> : null}
                </div>
                <p className="george-chat-bubble__text">{entry.text}</p>
              </div>
            </div>
          );
        })}
      </div>
      <form className="george-input-row" onSubmit={handlePromptSubmit}>
        <GeorgeOrbLogo size={36} />
        <div className="george-input">
          <input
            id="george-prompt-input"
            className="george-input__field"
            type="text"
            placeholder={askPlaceholder}
            aria-label={askInputLabel}
            value={promptValue}
            onChange={handlePromptChange}
            autoComplete="off"
            ref={promptInputRef}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
        </div>
        <button
          type="submit"
          className="george-send-button"
          data-disabled={isPromptEmpty}
          aria-label={sendLabel}
          onMouseDown={handleSendPointerDown}
        >
          <span className="george-send-icon" aria-hidden="true">↗</span>
        </button>
      </form>
    </div>
  );
};

export default GeorgeAssistant;
