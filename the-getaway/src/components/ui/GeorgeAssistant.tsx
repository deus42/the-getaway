import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  selectPlayerFactionReputation,
  selectPlayerKarma,
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
  AssistantIntel,
  GeorgeAmbientTracker,
  buildAssistantIntel,
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

const STORAGE_KEY = 'the-getaway:george-panel-open';
const INTERJECTION_COOLDOWN_MS = 9000;
const INTERJECTION_DISPLAY_MS = 5200;
const AMBIENT_BANTER_MIN_MS = 48000;
const AMBIENT_BANTER_MAX_MS = 96000;
const DOCK_TICKER_INTERVAL_MS = 20000;
const FEED_ENTRY_LIMIT = 12;

const FALLBACK_AMBIENT = [
  'Diagnostics show morale at "manageable"—keep it that way.',
  'Filed another complaint against the rain. Status: pending since 2034.',
  'If you spot Theo, remind him the coffee synth still needs a filter.',
  'Today’s lucky number is 404. Let’s try not to vanish.',
];

type FeedCategory = 'mission' | 'status' | 'guidance' | 'interjection' | GeorgeAmbientEvent['category'];
type FeedTone = 'mission' | 'status' | 'ambient' | 'warning' | 'zone' | 'broadcast';

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
  mission: { badge: 'MS', tone: 'mission' },
  status: { badge: 'ST', tone: 'status' },
  guidance: { badge: 'GD', tone: 'mission' },
  interjection: { badge: 'BC', tone: 'broadcast' },
  rumor: { badge: 'RM', tone: 'ambient' },
  signage: { badge: 'SG', tone: 'ambient' },
  weather: { badge: 'WX', tone: 'ambient' },
  zoneDanger: { badge: 'DZ', tone: 'warning' },
  hazardChange: { badge: 'HZ', tone: 'warning' },
  zoneBrief: { badge: 'ZB', tone: 'zone' },
};

const DEFAULT_FEED_META: { badge: string; tone: FeedTone } = { badge: '--', tone: 'ambient' };

const styles = `
  .george-layer {
    width: min(360px, 32vw);
    pointer-events: auto;
  }
  @media (max-width: 960px) {
    .george-layer {
      width: min(92vw, 380px);
    }
  }
  .george-shell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  .george-dock-button {
    all: unset;
    cursor: pointer;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.6rem;
    align-items: center;
    padding: 0.55rem 1rem;
    border-radius: 999px;
    border: 1px solid rgba(93, 230, 216, 0.3);
    background: linear-gradient(135deg, rgba(6, 20, 33, 0.88), rgba(11, 32, 48, 0.82));
    box-shadow: 0 14px 22px rgba(2, 8, 20, 0.55);
    min-width: 240px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  }
  .george-dock-button:hover {
    border-color: rgba(125, 211, 252, 0.55);
    box-shadow: 0 18px 28px rgba(3, 12, 30, 0.6);
  }
  .george-dock-button.open {
    border-color: rgba(59, 130, 246, 0.45);
    transform: translateY(-1px);
  }
  .george-dock-button.alert {
    border-color: rgba(16, 185, 129, 0.55);
    box-shadow: 0 18px 32px rgba(14, 116, 144, 0.45);
  }
  .george-dock-button:focus-visible {
    outline: 2px solid rgba(125, 211, 252, 0.85);
    outline-offset: 2px;
  }
  .george-dock-icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: linear-gradient(160deg, rgba(6, 182, 212, 0.7), rgba(37, 99, 235, 0.6));
    position: relative;
    box-shadow: inset 0 0 10px rgba(4, 10, 25, 0.85);
  }
  .george-dock-icon::before,
  .george-dock-icon::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    border-radius: 4px;
    border: 2px solid rgba(226, 232, 240, 0.85);
  }
  .george-dock-icon::before {
    width: 16px;
    height: 16px;
  }
  .george-dock-icon::after {
    width: 7px;
    height: 7px;
  }
  .george-dock-copy {
    display: flex;
    flex-direction: column;
    gap: 0.18rem;
    max-width: 260px;
  }
  .george-dock-label {
    font-family: 'DM Mono', 'IBM Plex Mono', monospace;
    font-size: 0.68rem;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: rgba(94, 234, 212, 0.85);
  }
  .george-dock-marquee {
    position: relative;
    width: 100%;
    overflow: hidden;
  }
  .george-dock-status {
    display: inline-block;
    font-family: 'DM Mono', 'IBM Plex Mono', monospace;
    font-size: 0.8rem;
    color: rgba(226, 232, 240, 0.84);
    white-space: nowrap;
  }
  .george-dock-status--scroll {
    padding-left: 100%;
    animation: george-dock-ticker 20s linear infinite;
  }
  @keyframes george-dock-ticker {
    0% {
      transform: translateX(0%);
    }
    25% {
      transform: translateX(0%);
    }
    100% {
      transform: translateX(-100%);
    }
  }
  .george-panel {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    background: rgba(6, 18, 31, 0.95);
    border-radius: 16px;
    border: 1px solid rgba(63, 131, 248, 0.22);
    box-shadow: 0 24px 44px rgba(2, 8, 20, 0.55);
    padding: 1rem 1.1rem 1.3rem;
  }
  @media (max-width: 720px) {
    .george-panel {
      padding: 0.9rem 0.9rem 1.1rem;
    }
  }
  .george-interjection {
    font-size: 0.88rem;
    line-height: 1.4;
    color: rgba(226, 232, 240, 0.92);
    font-family: 'DM Mono', 'IBM Plex Mono', monospace;
  }
  .george-log-container {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    flex: 1 1 auto;
    min-height: 200px;
  }
  .george-log {
    flex: 1 1 auto;
    max-height: 320px;
    min-height: 200px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding-right: 0.3rem;
  }
  .george-log::-webkit-scrollbar {
    width: 6px;
  }
  .george-log::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.3);
    border-radius: 999px;
  }
  .george-log-item {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    padding: 0.55rem 0.65rem;
    border-radius: 12px;
    background: rgba(10, 26, 43, 0.72);
    border: 1px solid rgba(59, 130, 246, 0.15);
  }
  .george-log-item--mission {
    background: rgba(30, 64, 175, 0.42);
    border-color: rgba(96, 165, 250, 0.35);
  }
  .george-log-item--status {
    background: rgba(21, 128, 61, 0.32);
    border-color: rgba(74, 222, 128, 0.35);
  }
  .george-log-item--ambient {
    background: rgba(8, 47, 73, 0.55);
    border-color: rgba(45, 212, 191, 0.28);
  }
  .george-log-item--warning {
    background: rgba(120, 53, 15, 0.38);
    border-color: rgba(251, 191, 36, 0.45);
  }
  .george-log-item--zone {
    background: rgba(29, 78, 216, 0.38);
    border-color: rgba(147, 197, 253, 0.35);
  }
  .george-log-item--broadcast {
    background: rgba(88, 28, 135, 0.4);
    border-color: rgba(192, 132, 252, 0.4);
  }
  .george-log-item--latest {
    box-shadow: 0 0 18px rgba(56, 189, 248, 0.2);
  }
  .george-log-item--player {
    background: rgba(15, 42, 72, 0.75);
    border-color: rgba(96, 165, 250, 0.3);
  }
  .george-log-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.6rem;
    font-family: 'DM Mono', 'IBM Plex Mono', monospace;
  }
  .george-log-meta-main {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
  .george-log-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.9rem;
    padding: 0.12rem 0.45rem;
    border-radius: 999px;
    font-size: 0.6rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    background: rgba(148, 163, 184, 0.18);
    border: 1px solid rgba(148, 163, 184, 0.35);
    color: rgba(226, 232, 240, 0.85);
  }
  .george-log-badge--mission {
    background: rgba(37, 99, 235, 0.25);
    border-color: rgba(96, 165, 250, 0.55);
  }
  .george-log-badge--status {
    background: rgba(22, 163, 74, 0.25);
    border-color: rgba(74, 222, 128, 0.55);
  }
  .george-log-badge--ambient {
    background: rgba(15, 118, 110, 0.25);
    border-color: rgba(45, 212, 191, 0.55);
  }
  .george-log-badge--warning {
    background: rgba(180, 83, 9, 0.25);
    border-color: rgba(251, 191, 36, 0.55);
  }
  .george-log-badge--zone {
    background: rgba(37, 99, 235, 0.2);
    border-color: rgba(147, 197, 253, 0.55);
  }
  .george-log-badge--broadcast {
    background: rgba(126, 58, 242, 0.25);
    border-color: rgba(192, 132, 252, 0.55);
  }
  .george-log-actor {
    font-size: 0.64rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(178, 230, 255, 0.82);
  }
  .george-log-reference {
    font-size: 0.62rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(148, 163, 184, 0.68);
  }
  .george-log-text {
    font-size: 0.8rem;
    line-height: 1.4;
    color: rgba(226, 232, 240, 0.86);
    white-space: pre-line;
  }
`;

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

const GeorgeAssistant: React.FC = () => {
  const locale = useSelector((state: RootState) => state.settings.locale);
  const uiStrings = useMemo(() => getUIStrings(locale), [locale]);
  const georgeStrings = useMemo(() => uiStrings.george, [uiStrings]);

  const objectiveQueue = useSelector(selectObjectiveQueue);
  const missionProgress = useSelector(selectMissionProgress);
  const nextPrimaryObjective = useSelector(selectNextPrimaryObjective);
  const nextSideObjective = useSelector(selectNextSideObjective);
  const personality = useSelector(selectPlayerPersonalityProfile);
  const karma = useSelector(selectPlayerKarma);
  const factionReputation = useSelector(selectPlayerFactionReputation) as Record<FactionId, number>;
  const quests = useSelector((state: RootState) => state.quests.quests);
  const world = useSelector((state: RootState) => state.world);
  const ambientSnapshot = useSelector(selectAmbientWorldSnapshot);

  const intel = useMemo<AssistantIntel>(() => buildAssistantIntel({
    objectiveQueue,
    personality,
    karma,
    factionReputation: factionReputation as Record<string, number>,
    missionPrimary: nextPrimaryObjective,
    missionSide: nextSideObjective,
  }), [objectiveQueue, personality, karma, factionReputation, nextPrimaryObjective, nextSideObjective]);

  const ambientLines = useMemo(
    () => (georgeStrings.ambient?.length ? georgeStrings.ambient : FALLBACK_AMBIENT),
    [georgeStrings]
  );

  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  });
  const [interjection, setInterjection] = useState<string | null>(null);
  const [feedEntries, setFeedEntries] = useState<FeedEntry[]>([]);
  const [hasAmbientPing, setHasAmbientPing] = useState(false);

  const cooldownRef = useRef<number>(0);
  const pendingInterjectionRef = useRef<GeorgeLine | null>(null);
  const completedQuestIdsRef = useRef<Set<string>>(new Set());
  const factionRef = useRef<Record<FactionId, number>>(factionReputation);
  const alertRef = useRef({ level: world.globalAlertLevel, inCombat: world.inCombat });
  const ambientTimerRef = useRef<number | null>(null);
  const ambientTrackerRef = useRef<GeorgeAmbientTracker | null>(null);
  const missionSummaryRef = useRef<string>('');

  const pushFeedEntry = useCallback(
    ({ category, label, text, timestamp }: { category: FeedCategory; label: string; text: string; timestamp?: number }) => {
      const entryTimestamp = timestamp ?? Date.now();
      const meta = FEED_CATEGORY_META[category] ?? DEFAULT_FEED_META;
      setFeedEntries((prev) => {
        const entry: FeedEntry = {
          id: `${entryTimestamp}-${Math.random().toString(36).slice(2)}`,
          category,
          text,
          label,
          timestamp: entryTimestamp,
          badge: meta.badge,
          tone: meta.tone,
        };
        const next = [...prev, entry];
        if (next.length > FEED_ENTRY_LIMIT) {
          return next.slice(next.length - FEED_ENTRY_LIMIT);
        }
        return next;
      });
      if (!isOpen) {
        setHasAmbientPing(true);
      }
    },
    [isOpen]
  );

  const presentInterjection = useCallback((line: GeorgeLine, log = false) => {
    cooldownRef.current = Date.now() + INTERJECTION_COOLDOWN_MS;
    pendingInterjectionRef.current = null;
    setInterjection(line.text);
    if (log) {
      pushFeedEntry({
        category: 'interjection',
        label: georgeStrings.feedLabels.interjection,
        text: line.text,
      });
    }
    window.setTimeout(() => setInterjection(null), INTERJECTION_DISPLAY_MS);
  }, [georgeStrings.feedLabels.interjection, pushFeedEntry]);

  const queueInterjection = useCallback((trigger: GeorgeInterjectionTrigger) => {
    const line = pickInterjectionLine(trigger, personality.alignment);
    if (!line) {
      return;
    }
    const now = Date.now();
    if (now >= cooldownRef.current) {
      presentInterjection(line, true);
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

  const scheduleAmbientBanter = useCallback(() => {
    if (ambientTimerRef.current !== null) {
      window.clearTimeout(ambientTimerRef.current);
    }
    const delay = Math.floor(AMBIENT_BANTER_MIN_MS + Math.random() * (AMBIENT_BANTER_MAX_MS - AMBIENT_BANTER_MIN_MS));
    ambientTimerRef.current = window.setTimeout(() => {
      const line = pickAmbient();
      if (Date.now() >= cooldownRef.current) {
        presentInterjection(line, false);
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
        presentInterjection(pending, true);
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
    };
  }, [scheduleAmbientBanter]);

  useEffect(() => {
    const levelName = missionProgress?.name ?? 'current zone';
    const missionLines: string[] = [];

    if (missionProgress) {
      if (missionProgress.allPrimaryComplete) {
        missionLines.push(`• Primary: Mission accomplished in ${levelName}.`);
      } else if (nextPrimaryObjective) {
        const suffix = nextPrimaryObjective.totalQuests > 1
          ? ` (${nextPrimaryObjective.completedQuests}/${nextPrimaryObjective.totalQuests})`
          : '';
        missionLines.push(`• Primary: ${nextPrimaryObjective.label}${suffix}`);
      }

      if (nextSideObjective) {
        missionLines.push(`• Optional: ${nextSideObjective.label}`);
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
    pushFeedEntry({
      category: 'guidance',
      label: georgeStrings.feedLabels.guidance,
      text: message,
    });
  }, [
    georgeStrings,
    missionProgress,
    nextPrimaryObjective,
    nextSideObjective,
    objectiveQueue,
    pushFeedEntry,
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
    const label = ambientFeed.categoryLabels[event.category] ?? georgeStrings.feedLabels.ambient;

    switch (event.category) {
      case 'rumor': {
        const line = event.lines.find((entry) => entry && entry.trim().length > 0)?.trim() ?? ambientFeed.fallbacks.rumor;
        const storyLabel = event.storyFunction
          ? ambientFeed.storyFunctionLabels[event.storyFunction] ??
            event.storyFunction.replace(/-/g, ' ').toUpperCase()
          : undefined;
        const text = ambientFeed.formatRumor({ line, storyLabel }, alignment);
        return {
          category: event.category,
          text,
          label,
          timestamp: event.timestamp,
        };
      }
      case 'signage': {
        const text = event.text && event.text.trim().length > 0 ? event.text.trim() : ambientFeed.fallbacks.signage;
        const storyLabel = event.storyFunction
          ? ambientFeed.storyFunctionLabels[event.storyFunction] ??
            event.storyFunction.replace(/-/g, ' ').toUpperCase()
          : undefined;
        const formatted = ambientFeed.formatSignage({ text, storyLabel }, alignment);
        return {
          category: event.category,
          text: formatted,
          label,
          timestamp: event.timestamp,
        };
      }
      case 'weather': {
        const description = event.description && event.description.trim().length > 0
          ? event.description.trim()
          : ambientFeed.fallbacks.weather;
        const storyLabel = event.storyFunction
          ? ambientFeed.storyFunctionLabels[event.storyFunction] ??
            event.storyFunction.replace(/-/g, ' ').toUpperCase()
          : undefined;
        const formatted = ambientFeed.formatWeather({ description, storyLabel }, alignment);
        return {
          category: event.category,
          text: formatted,
          label,
          timestamp: event.timestamp,
        };
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
        const formatted = ambientFeed.formatZoneDanger(
          {
            zoneName: event.zoneName,
            dangerLabel,
            previousDangerLabel,
            flagChanges,
          },
          alignment
        );
        return {
          category: event.category,
          text: formatted,
          label,
          timestamp: event.timestamp,
        };
      }
      case 'hazardChange': {
        const additions = event.added.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
        const removals = event.removed.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
        const formatted = ambientFeed.formatHazards(
          {
            zoneName: event.zoneName,
            additions,
            removals,
          },
          alignment
        );
        return {
          category: event.category,
          text: formatted,
          label,
          timestamp: event.timestamp,
        };
      }
      case 'zoneBrief': {
        const dangerLevels = uiStrings.levelIndicator.dangerLevels;
        const dangerLabel = event.dangerRating
          ? dangerLevels[event.dangerRating] ?? event.dangerRating
          : ambientFeed.dangerFallback;
        const formatted = ambientFeed.formatZoneBrief(
          {
            zoneName: event.zoneName,
            summary: event.summary ?? null,
            dangerLabel,
            hazards: event.hazards,
            directives: event.directives,
          },
          alignment
        );
        return {
          category: event.category,
          text: formatted,
          label,
          timestamp: event.timestamp,
        };
      }
      default:
        return null;
    }
  }, [georgeStrings.ambientFeed, georgeStrings.feedLabels.ambient, personality.alignment, uiStrings.levelIndicator.dangerLevels]);

  useEffect(() => {
    const handleMissionAccomplished = (event: Event) => {
      const detail = (event as CustomEvent<MissionEventDetail>).detail;
      if (!detail) {
        return;
      }

      const message = `Mission secured in ${detail.name}. Awaiting redeploy.`;
      pushFeedEntry({
        category: 'mission',
        label: georgeStrings.feedLabels.mission,
        text: message,
      });
      queueInterjection('questCompleted');
    };

    const handleLevelAdvance = (event: Event) => {
      const detail = (event as CustomEvent<LevelAdvanceEventDetail>).detail;
      if (!detail) {
        return;
      }

      const nextDescriptor = detail.nextLevelId ?? `level ${detail.nextLevel}`;
      const message = `Prepping overlays for ${nextDescriptor}. Say the word and I’ll broadcast updates.`;
      pushFeedEntry({
        category: 'status',
        label: georgeStrings.feedLabels.status,
        text: message,
      });
    };

    window.addEventListener(MISSION_ACCOMPLISHED_EVENT, handleMissionAccomplished as EventListener);
    window.addEventListener(LEVEL_ADVANCE_REQUESTED_EVENT, handleLevelAdvance as EventListener);

    return () => {
      window.removeEventListener(MISSION_ACCOMPLISHED_EVENT, handleMissionAccomplished as EventListener);
      window.removeEventListener(LEVEL_ADVANCE_REQUESTED_EVENT, handleLevelAdvance as EventListener);
    };
  }, [georgeStrings.feedLabels.mission, georgeStrings.feedLabels.status, pushFeedEntry, queueInterjection]);

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
        pushFeedEntry(formatted);
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
      pushFeedEntry(formatted);
    });
  }, [ambientSnapshot, formatAmbientEvent, pushFeedEntry]);

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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, isOpen ? 'true' : 'false');
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) {
        return;
      }
      if (event.key.toLowerCase() === 'g') {
        const target = event.target as HTMLElement | null;
        if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) {
          return;
        }
        event.preventDefault();
        setIsOpen((prev) => {
          const next = !prev;
          if (next) {
            setHasAmbientPing(false);
          }
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const latestEntry = feedEntries.length > 0 ? feedEntries[feedEntries.length - 1] : null;
  const baseTickerLine = interjection ?? latestEntry?.text ?? georgeStrings.dockStatusIdle;

  const feedLines = useMemo(() => {
    const unique: string[] = [];
    const push = (line?: string) => {
      if (!line) {
        return;
      }
      const cleaned = line.replace(/\s+/g, ' ').trim();
      if (!cleaned || unique.includes(cleaned)) {
        return;
      }
      unique.push(cleaned);
    };

    push(baseTickerLine);

    const primaryHint = intel.primaryHint?.trim();
    if (primaryHint) {
      push(primaryHint);
    }

    const objective = objectiveQueue[0];
    if (objective) {
      const countSuffix = objective.objective.count && objective.objective.count > 1
        ? ` (${objective.objective.currentCount ?? 0}/${objective.objective.count})`
        : '';
      push(`${objective.questName}: ${objective.objective.description}${countSuffix}`);
    }

    feedEntries.slice(-3).forEach((entry) => push(entry.text));
    ambientLines.slice(0, 2).forEach((line) => push(line));

    if (unique.length === 0) {
      push(georgeStrings.dockStatusIdle);
    }

    return unique.slice(0, 6);
  }, [ambientLines, baseTickerLine, feedEntries, georgeStrings.dockStatusIdle, intel.primaryHint, objectiveQueue]);

  const feedSignature = useMemo(() => feedLines.join('|'), [feedLines]);

  const [tickerIndex, setTickerIndex] = useState(0);
  const [tickerKey, setTickerKey] = useState(0);

  useEffect(() => {
    setTickerIndex(0);
    setTickerKey(Date.now());
  }, [feedSignature]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    if (feedLines.length <= 1) {
      return undefined;
    }
    const interval = window.setInterval(() => {
      setTickerIndex((prev) => {
        const next = prev + 1;
        return next >= feedLines.length ? 0 : next;
      });
      setTickerKey(Date.now());
    }, DOCK_TICKER_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [feedLines.length, feedSignature]);

  const tickerText = feedLines[tickerIndex] ?? georgeStrings.dockStatusIdle;
  const animateTicker = tickerText.length > 20;

  const feedViewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const node = feedViewRef.current;
    if (!node) {
      return;
    }
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
  }, [feedEntries, isOpen]);

  useEffect(() => {
    if (isOpen && hasAmbientPing) {
      setHasAmbientPing(false);
    }
  }, [isOpen, hasAmbientPing]);

  const panelId = 'george-console-panel';

  return (
    <div className="george-layer">
      <style>{styles}</style>
      <div className="george-shell">
        <button
          type="button"
          className={`george-dock-button${isOpen ? ' open' : ''}${hasAmbientPing ? ' alert' : ''}`}
          onClick={() => setIsOpen((prev) => {
            const next = !prev;
            if (next) {
              setHasAmbientPing(false);
            }
            return next;
          })}
          aria-expanded={isOpen}
          aria-controls={panelId}
          aria-label={georgeStrings.consoleTitle}
        >
          <div className="george-dock-icon" aria-hidden="true" />
          <div className="george-dock-copy">
            <span className="george-dock-label">{georgeStrings.dockLabel}</span>
            <div className="george-dock-marquee">
              <span
                key={tickerKey}
                className={`george-dock-status${animateTicker ? ' george-dock-status--scroll' : ''}`}
                title={tickerText}
              >
                {tickerText}
              </span>
            </div>
          </div>
        </button>

        {isOpen && (
          <section id={panelId} className="george-panel" aria-label={georgeStrings.consoleTitle}>
            {interjection && (
              <div className="george-interjection" role="status">
                {interjection}
              </div>
            )}

            <div className="george-log-container">
              <div className="george-log" role="log" aria-live="polite" ref={feedViewRef}>
                {feedEntries.length === 0 ? (
                  <div className="george-log-item george-log-item--ambient">
                    <div className="george-log-meta">
                      <div className="george-log-meta-main">
                        <span className="george-log-badge george-log-badge--ambient" aria-hidden="true">NB</span>
                        <span className="george-log-actor">{georgeStrings.feedLabels.ambient}</span>
                      </div>
                      <span className="george-log-reference">—</span>
                    </div>
                    <div className="george-log-text">{georgeStrings.logEmpty}</div>
                  </div>
                ) : (
                  feedEntries.map((entry, index) => (
                    <div
                      key={entry.id}
                      className={`george-log-item george-log-item--${entry.tone}${index === feedEntries.length - 1 ? ' george-log-item--latest' : ''}`}
                    >
                      <div className="george-log-meta">
                        <div className="george-log-meta-main">
                          <span className={`george-log-badge george-log-badge--${entry.tone}`} aria-hidden="true">{entry.badge}</span>
                          <span className="george-log-actor">{entry.label}</span>
                        </div>
                        <span className="george-log-reference">{formatTimestamp(entry.timestamp)}</span>
                      </div>
                      <div className="george-log-text">{entry.text}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default GeorgeAssistant;
