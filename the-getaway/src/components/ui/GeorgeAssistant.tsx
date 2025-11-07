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
  selectPlayerFactionReputation,
  selectPlayerPersonalityProfile,
} from '../../store/selectors/playerSelectors';
import { selectObjectiveQueue } from '../../store/selectors/questSelectors';
import {
  selectMissionProgress,
  selectNextPrimaryObjective,
  selectNextSideObjective,
} from '../../store/selectors/missionSelectors';
import { selectAmbientWorldSnapshot } from '../../store/selectors/worldSelectors';
import {
  GeorgeAmbientTracker,
  pickBanterLine,
  pickInterjectionLine,
  GeorgeAmbientEvent,
} from '../../game/systems/georgeAssistant';
import type { FactionId } from '../../game/interfaces/types';
import { GeorgeInterjectionTrigger, GeorgeLine } from '../../content/assistants/george';
import { getUIStrings } from '../../content/ui';
import {
  LEVEL_ADVANCE_REQUESTED_EVENT,
  MISSION_ACCOMPLISHED_EVENT,
  LevelAdvanceEventDetail,
  MissionEventDetail,
} from '../../game/systems/missionProgression';
const INTERJECTION_COOLDOWN_MS = 9000;
const AMBIENT_BANTER_MIN_MS = 48000;
const AMBIENT_BANTER_MAX_MS = 96000;
const FEED_ENTRY_LIMIT = 12;

const FALLBACK_AMBIENT = [
  'Diagnostics show morale at "manageable"—keep it that way.',
  'Filed another complaint against the rain. Status: pending since 2034.',
  'If you spot Theo, remind him the coffee synth still needs a filter.',
  'Today’s lucky number is 404. Let’s try not to vanish.',
];

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

const styles = `
  .george-inline {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    height: 100%;
  }
  .george-inline__label {
    font-family: 'DM Mono', 'IBM Plex Mono', monospace;
    font-size: 0.6rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(94, 234, 212, 0.78);
  }
  .george-input-row {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding-top: 0.2rem;
  }
  .george-input {
    flex: 1 1 auto;
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.5rem 0.65rem;
    border-radius: 0.85rem;
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: rgba(15, 23, 42, 0.65);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .george-input:focus-within {
    border-color: rgba(59, 130, 246, 0.75);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
  }
  .george-input__field {
    flex: 1 1 auto;
    background: transparent;
    border: 0;
    outline: none;
    color: #e2e8f0;
    font-family: 'DM Mono', 'IBM Plex Mono', monospace;
    font-size: 0.62rem;
    letter-spacing: 0.12em;
  }
  .george-input__field::placeholder {
    color: rgba(148, 163, 184, 0.65);
  }
  .george-send-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.45rem 0.65rem;
    border-radius: 999px;
    border: 1px solid rgba(96, 165, 250, 0.5);
    background: linear-gradient(140deg, rgba(37, 99, 235, 0.45), rgba(14, 165, 233, 0.35));
    color: #f8fafc;
    cursor: pointer;
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  }
  .george-send-button:focus-visible,
  .george-send-button:hover {
    transform: translateY(-1px);
    border-color: rgba(147, 197, 253, 0.85);
    box-shadow: 0 12px 24px rgba(37, 99, 235, 0.3);
  }
  .george-send-button[data-disabled="true"] {
    opacity: 0.5;
  }
  .george-send-icon {
    font-size: 0.75rem;
    letter-spacing: 0;
  }
  .george-chat {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    padding-right: 0.25rem;
  }
  .george-chat::-webkit-scrollbar {
    width: 6px;
  }
  .george-chat::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.3);
    border-radius: 999px;
  }
  .george-chat-entry {
    display: flex;
    align-items: flex-start;
    gap: 0.55rem;
  }
  .george-chat-avatar {
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .george-logo {
    position: relative;
    display: inline-block;
    width: 28px;
    height: 28px;
    border-radius: 10px;
    background: linear-gradient(160deg, rgba(6, 182, 212, 0.72), rgba(37, 99, 235, 0.65));
    box-shadow: inset 0 0 8px rgba(4, 10, 25, 0.85), 0 12px 26px rgba(6, 182, 212, 0.25);
  }
  .george-logo::before,
  .george-logo::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    border-radius: 4px;
    border: 2px solid rgba(226, 232, 240, 0.85);
  }
  .george-logo::before {
    width: 12px;
    height: 12px;
  }
  .george-logo::after {
    width: 6px;
    height: 6px;
  }
  .george-chat-bubble {
    position: relative;
    flex: 1 1 auto;
    min-width: 0;
    padding: 0.6rem 0.8rem 0.7rem;
    border-radius: 12px;
    background: rgba(10, 26, 43, 0.82);
    border: 1px solid rgba(148, 163, 184, 0.28);
    box-shadow: 0 16px 32px rgba(8, 12, 24, 0.3);
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }
  .george-chat-bubble::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    border-radius: 12px 0 0 12px;
    background: rgba(148, 163, 184, 0.45);
  }
  .george-chat-bubble__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.5rem;
    font-family: 'DM Mono', 'IBM Plex Mono', monospace;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    font-size: 0.58rem;
    color: rgba(226, 232, 240, 0.88);
  }
  .george-chat-bubble__title {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    min-width: 0;
  }
  .george-chat-bubble__label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .george-chat-bubble__time {
    font-size: 0.56rem;
    letter-spacing: 0.12em;
    color: rgba(148, 163, 184, 0.7);
    white-space: nowrap;
  }
  .george-chat-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.14rem 0.45rem;
    border-radius: 999px;
    border: 1px solid rgba(148, 163, 184, 0.4);
    background: rgba(30, 64, 175, 0.12);
    color: rgba(226, 232, 240, 0.85);
  }
  .george-chat-bubble__text {
    font-family: 'DM Sans', 'Inter', sans-serif;
    font-size: 0.78rem;
    letter-spacing: 0.01em;
    line-height: 1.5;
    color: rgba(226, 232, 240, 0.92);
    white-space: pre-wrap;
  }
  .george-chat-bubble--mission {
    border-color: rgba(96, 165, 250, 0.45);
    box-shadow: 0 18px 34px rgba(37, 99, 235, 0.28);
  }
  .george-chat-bubble--mission::before {
    background: linear-gradient(180deg, rgba(96, 165, 250, 0.9), rgba(37, 99, 235, 0.55));
  }
  .george-chat-badge--mission {
    border-color: rgba(96, 165, 250, 0.55);
    background: rgba(37, 99, 235, 0.25);
    color: rgba(219, 234, 254, 0.92);
  }
  .george-chat-bubble--status {
    border-color: rgba(74, 222, 128, 0.45);
    box-shadow: 0 18px 34px rgba(16, 185, 129, 0.25);
  }
  .george-chat-bubble--status::before {
    background: linear-gradient(180deg, rgba(45, 212, 191, 0.9), rgba(22, 163, 74, 0.55));
  }
  .george-chat-badge--status {
    border-color: rgba(74, 222, 128, 0.55);
    background: rgba(22, 163, 74, 0.25);
    color: rgba(240, 253, 244, 0.92);
  }
  .george-chat-bubble--ambient {
    border-color: rgba(45, 212, 191, 0.35);
    box-shadow: 0 18px 28px rgba(14, 116, 144, 0.22);
  }
  .george-chat-bubble--ambient::before {
    background: linear-gradient(180deg, rgba(45, 212, 191, 0.85), rgba(14, 165, 233, 0.45));
  }
  .george-chat-badge--ambient {
    border-color: rgba(45, 212, 191, 0.55);
    background: rgba(15, 118, 110, 0.25);
    color: rgba(204, 251, 241, 0.9);
  }
  .george-chat-bubble--warning {
    border-color: rgba(251, 191, 36, 0.55);
    box-shadow: 0 18px 32px rgba(251, 146, 60, 0.3);
  }
  .george-chat-bubble--warning::before {
    background: linear-gradient(180deg, rgba(251, 191, 36, 0.9), rgba(217, 119, 6, 0.6));
  }
  .george-chat-badge--warning {
    border-color: rgba(251, 191, 36, 0.65);
    background: rgba(202, 138, 4, 0.25);
    color: rgba(255, 249, 196, 0.95);
  }
  .george-chat-bubble--zone {
    border-color: rgba(147, 197, 253, 0.5);
    box-shadow: 0 18px 32px rgba(59, 130, 246, 0.24);
  }
  .george-chat-bubble--zone::before {
    background: linear-gradient(180deg, rgba(147, 197, 253, 0.85), rgba(59, 130, 246, 0.55));
  }
  .george-chat-badge--zone {
    border-color: rgba(147, 197, 253, 0.65);
    background: rgba(37, 99, 235, 0.2);
    color: rgba(224, 242, 254, 0.92);
  }
  .george-chat-bubble--broadcast {
    border-color: rgba(192, 132, 252, 0.55);
    box-shadow: 0 18px 32px rgba(168, 85, 247, 0.28);
  }
  .george-chat-bubble--broadcast::before {
    background: linear-gradient(180deg, rgba(192, 132, 252, 0.9), rgba(126, 58, 242, 0.55));
  }
  .george-chat-badge--broadcast {
    border-color: rgba(192, 132, 252, 0.65);
    background: rgba(126, 58, 242, 0.25);
    color: rgba(243, 232, 255, 0.92);
  }
  .george-chat-bubble--event {
    border-color: rgba(96, 165, 250, 0.4);
    box-shadow: 0 18px 32px rgba(56, 189, 248, 0.24);
  }
  .george-chat-bubble--event::before {
    background: linear-gradient(180deg, rgba(14, 165, 233, 0.9), rgba(37, 99, 235, 0.5));
  }
  .george-chat-badge--event {
    border-color: rgba(96, 165, 250, 0.5);
    background: rgba(14, 165, 233, 0.2);
    color: rgba(224, 242, 254, 0.92);
  }
  .george-chat-bubble--player {
    border-color: rgba(248, 250, 252, 0.4);
    background: rgba(248, 250, 252, 0.05);
    box-shadow: 0 18px 32px rgba(255, 255, 255, 0.08);
  }
  .george-chat-bubble--player::before {
    background: linear-gradient(180deg, rgba(248, 250, 252, 0.55), rgba(148, 163, 184, 0.45));
  }
  .george-chat-badge--player {
    border-color: rgba(248, 250, 252, 0.5);
    background: rgba(203, 213, 225, 0.2);
    color: rgba(248, 250, 252, 0.9);
  }
  .george-chat-bubble--battle {
    border-color: rgba(239, 68, 68, 0.7);
    box-shadow: 0 18px 32px rgba(239, 68, 68, 0.35);
  }
  .george-chat-bubble--battle::before {
    background: linear-gradient(180deg, rgba(239, 68, 68, 0.95), rgba(190, 18, 60, 0.7));
  }
  .george-chat-badge--battle {
    border-color: rgba(239, 68, 68, 0.8);
    background: rgba(239, 68, 68, 0.2);
    color: rgba(254, 242, 242, 0.95);
  }
  .george-chat-bubble--dialog {
    border-color: rgba(192, 132, 252, 0.55);
    box-shadow: 0 18px 32px rgba(168, 85, 247, 0.28);
  }
  .george-chat-bubble--dialog::before {
    background: linear-gradient(180deg, rgba(192, 132, 252, 0.9), rgba(126, 58, 242, 0.55));
  }
  .george-chat-badge--dialog {
    border-color: rgba(192, 132, 252, 0.65);
    background: rgba(126, 58, 242, 0.25);
    color: rgba(243, 232, 255, 0.92);
  }
  .george-chat-bubble--stealth {
    border-color: rgba(16, 185, 129, 0.55);
    box-shadow: 0 18px 32px rgba(16, 185, 129, 0.22);
  }
  .george-chat-bubble--stealth::before {
    background: linear-gradient(180deg, rgba(16, 185, 129, 0.9), rgba(5, 150, 105, 0.55));
  }
  .george-chat-badge--stealth {
    border-color: rgba(16, 185, 129, 0.65);
    background: rgba(5, 150, 105, 0.25);
    color: rgba(240, 253, 244, 0.92);
  }
  .george-chat-bubble--latest {
    box-shadow: 0 0 26px rgba(56, 189, 248, 0.32);
  }
`;

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

const buildQuestReadout = (
  queue: ReturnType<typeof selectObjectiveQueue>,
  strings: ReturnType<typeof getUIStrings>['george'],
  limit?: number
): string[] => {
  if (queue.length === 0) {
    return [strings.questNone];
  }
  const slice = typeof limit === 'number' ? queue.slice(0, limit) : queue;
  const lines = slice.map((entry) => {
    const countSuffix = entry.objective.count && entry.objective.count > 1
      ? ` (${entry.objective.currentCount ?? 0}/${entry.objective.count})`
      : '';
    return `${entry.questName}: ${entry.objective.description}${countSuffix}`;
  });
  if (typeof limit === 'number' && queue.length > limit) {
    lines.push(strings.questMore);
  }
  return lines;
};

const clampText = (text: string): string => {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= 140) {
    return normalized;
  }
  return `${normalized.slice(0, 137).trimEnd()}…`;
};

const classifyLogMessage = (
  message: string,
  labels: Pick<ReturnType<typeof getUIStrings>['george']['feedLabels'], 'battle' | 'dialog' | 'stealth' | 'broadcast'>
): FeedEntryPayload => {
  const normalized = message.trim();
  const text = normalized.length ? normalized : '---';
  const lower = text.toLowerCase();
  const includesAny = (keys: string[]) => keys.some((key) => lower.includes(key));
  if (includesAny(['attack', 'enemy', 'combat', 'battle', 'damage', 'hostile'])) {
    return { category: 'battle', label: labels.battle, text, timestamp: Date.now() };
  }
  if (includesAny(['dialog', 'dialogue', 'whispers', 'says', 'conversation', 'briefing', 'speech'])) {
    return { category: 'dialog', label: labels.dialog, text, timestamp: Date.now() };
  }
  if (includesAny(['stealth', 'hidden', 'sneak', 'shadow', 'camouflage', 'conceal'])) {
    return { category: 'stealth', label: labels.stealth, text, timestamp: Date.now() };
  }
  return { category: 'broadcast', label: labels.broadcast, text, timestamp: Date.now() };
};

const GeorgeAssistant: React.FC = () => {
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = useMemo(() => getUIStrings(locale), [locale]);
  const georgeStrings = useMemo(() => uiStrings.george, [uiStrings]);

  const {
    feedLabels,
    levelAdvance: levelAdvanceMessage,
    missionComplete: missionCompleteMessage,
    promptPlaceholder,
    askPlaceholder,
    askInputLabel,
    sendLabel,
  } = georgeStrings;

  const objectiveQueue = useSelector(selectObjectiveQueue);
  const missionProgress = useSelector(selectMissionProgress);
  const nextPrimaryObjective = useSelector(selectNextPrimaryObjective);
  const nextSideObjective = useSelector(selectNextSideObjective);
  const personality = useSelector(selectPlayerPersonalityProfile);
  const factionReputation = useSelector(selectPlayerFactionReputation) as Record<FactionId, number>;
  const quests = useSelector((state: RootState) => state.quests.quests);
  const world = useSelector((state: RootState) => state.world);
  const ambientSnapshot = useSelector(selectAmbientWorldSnapshot);
  const logMessages = useSelector((state: RootState) => state.log.messages);

  const ambientLines = useMemo(
    () => (georgeStrings.ambient?.length ? georgeStrings.ambient : FALLBACK_AMBIENT),
    [georgeStrings]
  );

  const [feedEntries, setFeedEntries] = useState<FeedEntry[]>([]);
  const [promptValue, setPromptValue] = useState('');

  const cooldownRef = useRef<number>(0);
  const pendingInterjectionRef = useRef<GeorgeLine | null>(null);
  const completedQuestIdsRef = useRef<Set<string>>(new Set());
  const factionRef = useRef<Record<FactionId, number>>(factionReputation);
  const alertRef = useRef({ level: world.globalAlertLevel, inCombat: world.inCombat });
  const ambientTimerRef = useRef<number | null>(null);
  const ambientTrackerRef = useRef<GeorgeAmbientTracker | null>(null);
  const missionSummaryRef = useRef<string>('');
  const logIndexRef = useRef<number>(logMessages.length);
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

  const presentInterjection = useCallback((line: GeorgeLine) => {
    cooldownRef.current = Date.now() + INTERJECTION_COOLDOWN_MS;
    pendingInterjectionRef.current = null;
    routeFeedEntry({
      category: 'interjection',
      label: georgeStrings.feedLabels.interjection,
      text: line.text,
      timestamp: Date.now(),
    });
  }, [georgeStrings.feedLabels.interjection, routeFeedEntry]);

  const queueInterjection = useCallback((trigger: GeorgeInterjectionTrigger) => {
    const line = pickInterjectionLine(trigger, personality.alignment);
    if (!line) {
      return;
    }
    const now = Date.now();
    if (now >= cooldownRef.current) {
      presentInterjection(line);
      return;
    }
    pendingInterjectionRef.current = line;
  }, [personality.alignment, presentInterjection]);

  const pickAmbient = useCallback((): GeorgeLine => {
    if (ambientLines.length && Math.random() < 0.5) {
      const text = ambientLines[Math.floor(Math.random() * ambientLines.length)];
      return { text, guidelineRef: 'ambient.line' };
    }
    return pickBanterLine(personality.alignment);
  }, [ambientLines, personality.alignment]);

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

    const line = pickAmbient();
    const response = promptPlaceholder(line.text);
    enqueueFeedEntry({
      category: 'interjection',
      label: feedLabels.interjection,
      text: response,
      timestamp: Date.now(),
    });
  }, [enqueueFeedEntry, feedLabels.interjection, feedLabels.player, pickAmbient, promptPlaceholder, promptValue]);

  const scheduleAmbientBanter = useCallback(() => {
    if (ambientTimerRef.current !== null) {
      window.clearTimeout(ambientTimerRef.current);
    }
    const delay = Math.floor(AMBIENT_BANTER_MIN_MS + Math.random() * (AMBIENT_BANTER_MAX_MS - AMBIENT_BANTER_MIN_MS));
    ambientTimerRef.current = window.setTimeout(() => {
      const line = pickAmbient();
      if (Date.now() >= cooldownRef.current) {
        presentInterjection(line);
      } else {
        pendingInterjectionRef.current = line;
      }
      scheduleAmbientBanter();
    }, delay);
  }, [pickAmbient, presentInterjection]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const pending = pendingInterjectionRef.current;
      if (!pending) {
        return;
      }
      if (Date.now() >= cooldownRef.current) {
        presentInterjection(pending);
      }
    }, 400);
    return () => window.clearInterval(timer);
  }, [presentInterjection]);

  useEffect(() => {
    scheduleAmbientBanter();
    return () => {
      if (ambientTimerRef.current !== null) {
        window.clearTimeout(ambientTimerRef.current);
        ambientTimerRef.current = null;
      }
      if (queueTimerRef.current !== null) {
        window.clearTimeout(queueTimerRef.current);
        queueTimerRef.current = null;
      }
      queueRef.current = [];
    };
  }, [scheduleAmbientBanter]);

  useEffect(() => {
    if (logMessages.length <= logIndexRef.current) {
      logIndexRef.current = logMessages.length;
      return;
    }
    const newMessages = logMessages.slice(logIndexRef.current);
    newMessages.forEach((message) => {
      const payload = classifyLogMessage(message, {
        battle: feedLabels.battle,
        dialog: feedLabels.dialog,
        stealth: feedLabels.stealth,
        broadcast: feedLabels.broadcast,
      });
      routeFeedEntry(payload);
    });
    logIndexRef.current = logMessages.length;
  }, [feedLabels.battle, feedLabels.broadcast, feedLabels.dialog, feedLabels.stealth, logMessages, routeFeedEntry]);

  useEffect(() => {
    const levelName = missionProgress?.name ?? georgeStrings.zoneFallback;
    const missionLines: string[] = [];

    if (missionProgress) {
      if (missionProgress.allPrimaryComplete) {
        missionLines.push(georgeStrings.guidancePrimaryComplete(levelName));
      } else if (nextPrimaryObjective) {
        const progress = nextPrimaryObjective.totalQuests > 1
          ? georgeStrings.guidanceProgress(nextPrimaryObjective.completedQuests ?? 0, nextPrimaryObjective.totalQuests)
          : '';
        missionLines.push(georgeStrings.guidancePrimaryObjective(nextPrimaryObjective.label, progress));
      }

      if (nextSideObjective) {
        missionLines.push(georgeStrings.guidanceSideObjective(nextSideObjective.label));
      }
    }

    const questLines = buildQuestReadout(objectiveQueue, georgeStrings, 3);
    const segments = [georgeStrings.guidanceIntro];
    if (missionLines.length > 0) {
      segments.push(...missionLines);
    }
    if (questLines.length > 0) {
      if (missionLines.length > 0) {
        segments.push('');
      }
      segments.push(...questLines);
    }

    const message = segments.join('\n').trim();
    if (!message || missionSummaryRef.current === message) {
      return;
    }
    missionSummaryRef.current = message;
    routeFeedEntry({
      category: 'operation',
      label: feedLabels.operation,
      text: message,
      timestamp: Date.now(),
    });
  }, [
    feedLabels.operation,
    georgeStrings,
    missionProgress,
    nextPrimaryObjective,
    nextSideObjective,
    objectiveQueue,
    routeFeedEntry,
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

const formatAmbientEvent = useCallback((event: GeorgeAmbientEvent): FeedEntryPayload | null => {
  const ambientFeed = georgeStrings.ambientFeed;
  const alignment = personality.alignment;

  const buildBroadcast = (text: string): FeedEntryPayload => ({
    category: 'broadcast',
    text,
    label: feedLabels.broadcast,
    timestamp: event.timestamp,
  });

  switch (event.category) {
    case 'rumor': {
      const line = event.lines.find((entry) => entry && entry.trim().length > 0)?.trim() ?? ambientFeed.fallbacks.rumor;
      const storyLabel = event.storyFunction
        ? ambientFeed.storyFunctionLabels[event.storyFunction] ?? event.storyFunction.replace(/-/g, ' ').toUpperCase()
        : undefined;
      return buildBroadcast(ambientFeed.formatRumor({ line, storyLabel }, alignment));
    }
    case 'signage': {
      const text = event.text && event.text.trim().length > 0 ? event.text.trim() : ambientFeed.fallbacks.signage;
      const storyLabel = event.storyFunction
        ? ambientFeed.storyFunctionLabels[event.storyFunction] ?? event.storyFunction.replace(/-/g, ' ').toUpperCase()
        : undefined;
      return buildBroadcast(ambientFeed.formatSignage({ text, storyLabel }, alignment));
    }
    case 'weather': {
      const description = event.description && event.description.trim().length > 0
        ? event.description.trim()
        : ambientFeed.fallbacks.weather;
      const storyLabel = event.storyFunction
        ? ambientFeed.storyFunctionLabels[event.storyFunction] ?? event.storyFunction.replace(/-/g, ' ').toUpperCase()
        : undefined;
      return buildBroadcast(ambientFeed.formatWeather({ description, storyLabel }, alignment));
    }
    case 'zoneDanger': {
      const dangerLevels = uiStrings.levelIndicator.dangerLevels;
      const dangerLabel = event.dangerRating
        ? dangerLevels[event.dangerRating] ?? event.dangerRating
        : ambientFeed.dangerFallback;
      const previousDangerLabel = event.previousDangerRating
        ? dangerLevels[event.previousDangerRating] ?? event.previousDangerRating
        : null;
      const flagChanges = event.changedFlags.map((change) => ({
        label: ambientFeed.flagLabels[change.key] ?? change.key,
        previous: ambientFeed.formatFlagValue(change.key, change.previous),
        next: ambientFeed.formatFlagValue(change.key, change.next),
      }));
      return buildBroadcast(
        ambientFeed.formatZoneDanger(
          {
            zoneName: event.zoneName,
            dangerLabel,
            previousDangerLabel,
            flagChanges,
          },
          alignment
        )
      );
    }
    case 'hazardChange': {
      const additions = event.added.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
      const removals = event.removed.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
      return buildBroadcast(
        ambientFeed.formatHazards(
          {
            zoneName: event.zoneName,
            additions,
            removals,
          },
          alignment
        )
      );
    }
    case 'zoneBrief': {
      const dangerLevels = uiStrings.levelIndicator.dangerLevels;
      const dangerLabel = event.dangerRating
        ? dangerLevels[event.dangerRating] ?? event.dangerRating
        : ambientFeed.dangerFallback;
      return buildBroadcast(
        ambientFeed.formatZoneBrief(
          {
            zoneName: event.zoneName,
            summary: event.summary ?? null,
            dangerLabel,
            hazards: event.hazards,
            directives: event.directives,
          },
          alignment
        )
      );
    }
    default:
      return null;
  }
}, [feedLabels.broadcast, georgeStrings.ambientFeed, personality.alignment, uiStrings.levelIndicator.dangerLevels]);

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
      queueInterjection('questCompleted');
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
    queueInterjection,
  ]);

  useEffect(() => {
    const completed = new Set(quests.filter((quest) => quest.isCompleted).map((quest) => quest.id));
    const previous = completedQuestIdsRef.current;
    const newlyCompleted = Array.from(completed).filter((id) => !previous.has(id));
    if (newlyCompleted.length > 0) {
      queueInterjection('questCompleted');
    }
    completedQuestIdsRef.current = completed;
  }, [quests, queueInterjection]);

  useEffect(() => {
    if (!ambientSnapshot) {
      return;
    }
    if (!ambientTrackerRef.current) {
      const tracker = new GeorgeAmbientTracker();
      tracker.prime(ambientSnapshot);
      ambientTrackerRef.current = tracker;

      const initialEvent: GeorgeAmbientEvent = {
        category: 'zoneBrief',
        timestamp: Date.now(),
        zoneName: ambientSnapshot.zone.zoneName,
        summary: ambientSnapshot.zone.summary,
        dangerRating: ambientSnapshot.zone.dangerRating ?? null,
        hazards: [...ambientSnapshot.zone.hazards],
        directives: [...ambientSnapshot.zone.directives],
      };
      const formatted = formatAmbientEvent(initialEvent);
      if (formatted) {
        routeFeedEntry(formatted);
      }
      return;
    }

    const tracker = ambientTrackerRef.current;
    const events = tracker.collect(ambientSnapshot);
    if (!events.length) {
      return;
    }

    events.forEach((event) => {
      const formatted = formatAmbientEvent(event);
      if (!formatted) {
        return;
      }
      routeFeedEntry(formatted);
    });
  }, [ambientSnapshot, formatAmbientEvent, routeFeedEntry]);

  useEffect(() => {
    const previous = factionRef.current;
    const current = factionReputation;
    const factionIds = new Set<FactionId>([
      ...(Object.keys(current) as FactionId[]),
      ...(Object.keys(previous) as FactionId[]),
    ]);

    const positive = Array.from(factionIds).some((factionId) => {
      const currentValue = current[factionId] ?? 0;
      const previousValue = previous[factionId] ?? 0;
      return currentValue - previousValue >= 20;
    });

    const negative = Array.from(factionIds).some((factionId) => {
      const currentValue = current[factionId] ?? 0;
      const previousValue = previous[factionId] ?? 0;
      return currentValue - previousValue <= -20;
    });

    if (positive) {
      queueInterjection('reputationPositive');
    } else if (negative) {
      queueInterjection('reputationNegative');
    }

    factionRef.current = current;
  }, [factionReputation, queueInterjection]);

  useEffect(() => {
    const previous = alertRef.current;
    if ((!previous.inCombat && world.inCombat) ||
      (previous.level !== 'alarmed' && world.globalAlertLevel === 'alarmed')) {
      queueInterjection('hostileEntered');
    }
    alertRef.current = { level: world.globalAlertLevel, inCombat: world.inCombat };
  }, [queueInterjection, world.globalAlertLevel, world.inCombat]);

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
      <style>{styles}</style>
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
