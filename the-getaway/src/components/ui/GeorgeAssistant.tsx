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
const AMBIENT_FEED_LIMIT = 10;

const FALLBACK_AMBIENT = [
  'Diagnostics show morale at "manageable"—keep it that way.',
  'Filed another complaint against the rain. Status: pending since 2034.',
  'If you spot Theo, remind him the coffee synth still needs a filter.',
  'Today’s lucky number is 404. Let’s try not to vanish.',
];

type ConversationId = 'guidance' | 'status' | 'quests';
type Actor = 'george' | 'player';

type ConversationEntry = {
  id: string;
  actor: Actor;
  text: string;
  reference: string;
};

type AssistantTab = 'intel' | 'ambient';

type AmbientFeedEntry = {
  id: string;
  category: GeorgeAmbientEvent['category'];
  summary: string;
  label: string;
  timestamp: number;
};

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
  .george-log-item--latest {
    background: rgba(30, 64, 175, 0.5);
    border-color: rgba(125, 211, 252, 0.4);
    box-shadow: 0 0 18px rgba(56, 189, 248, 0.15);
  }
  .george-log-item--player {
    background: rgba(15, 42, 72, 0.75);
    border-color: rgba(96, 165, 250, 0.3);
  }
  .george-log-meta {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.6rem;
    font-family: 'DM Mono', 'IBM Plex Mono', monospace;
  }
  .george-log-actor {
    font-size: 0.64rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(178, 230, 255, 0.78);
  }
  .george-log-item--player .george-log-actor {
    color: rgba(191, 219, 254, 0.85);
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
  .george-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.3rem;
    flex-wrap: wrap;
  }
  .george-action-button {
    all: unset;
    cursor: pointer;
    padding: 0.32rem 0.8rem;
    border-radius: 999px;
    border: 1px solid rgba(96, 165, 250, 0.4);
    background: rgba(11, 34, 54, 0.82);
    color: #dbeafe;
    font-family: 'DM Mono', 'IBM Plex Mono', monospace;
    font-size: 0.68rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  }
  .george-action-button:hover {
    transform: translateY(-1px);
    border-color: rgba(148, 211, 252, 0.55);
    box-shadow: 0 10px 18px rgba(6, 20, 36, 0.45);
  }
  .george-action-button:focus-visible {
    outline: 2px solid rgba(148, 211, 252, 0.82);
    outline-offset: 2px;
  }
  .george-tabs {
    display: flex;
    gap: 0.4rem;
    padding: 0.2rem 0;
  }
  .george-tab-button {
    all: unset;
    cursor: pointer;
    padding: 0.22rem 0.65rem;
    border-radius: 999px;
    border: 1px solid rgba(148, 163, 184, 0.35);
    background: rgba(15, 23, 42, 0.55);
    color: rgba(226, 232, 240, 0.78);
    font-family: 'DM Mono', 'IBM Plex Mono', monospace;
    font-size: 0.64rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  }
  .george-tab-button:hover {
    border-color: rgba(59, 130, 246, 0.45);
    box-shadow: 0 10px 18px rgba(15, 23, 42, 0.35);
  }
  .george-tab-button:focus-visible {
    outline: 2px solid rgba(94, 234, 212, 0.6);
    outline-offset: 2px;
  }
  .george-tab-button.active {
    background: rgba(37, 99, 235, 0.28);
    border-color: rgba(125, 211, 252, 0.45);
    color: rgba(226, 232, 240, 0.92);
    box-shadow: 0 12px 20px rgba(15, 23, 42, 0.45);
  }
  .george-ambient-feed {
    flex: 1 1 auto;
    max-height: 320px;
    min-height: 200px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-right: 0.3rem;
  }
  .george-ambient-feed::-webkit-scrollbar {
    width: 6px;
  }
  .george-ambient-feed::-webkit-scrollbar-thumb {
    background: rgba(16, 185, 129, 0.35);
    border-radius: 999px;
  }
  .george-ambient-item {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    padding: 0.5rem 0.65rem;
    border-radius: 12px;
    background: rgba(8, 47, 73, 0.55);
    border: 1px solid rgba(45, 212, 191, 0.28);
  }
  .george-ambient-meta {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 0.6rem;
    font-family: 'DM Mono', 'IBM Plex Mono', monospace;
  }
  .george-ambient-label {
    font-size: 0.6rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(125, 211, 252, 0.85);
  }
  .george-ambient-time {
    font-size: 0.58rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(148, 163, 184, 0.65);
  }
  .george-ambient-text {
    font-size: 0.78rem;
    line-height: 1.4;
    color: rgba(226, 232, 240, 0.88);
  }
  .george-ambient-empty {
    font-size: 0.76rem;
    line-height: 1.4;
    color: rgba(148, 163, 184, 0.78);
    font-family: 'DM Mono', 'IBM Plex Mono', monospace;
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

  const conversationOptions = useMemo(
    () => [
      { id: 'guidance' as ConversationId, label: georgeStrings.options.guidance },
      { id: 'status' as ConversationId, label: georgeStrings.options.status },
      { id: 'quests' as ConversationId, label: georgeStrings.options.quests },
    ],
    [georgeStrings]
  );

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
  const [logEntries, setLogEntries] = useState<ConversationEntry[]>([]);
  const [activeTab, setActiveTab] = useState<AssistantTab>('intel');
  const [ambientEntries, setAmbientEntries] = useState<AmbientFeedEntry[]>([]);
  const [hasAmbientPing, setHasAmbientPing] = useState(false);

  const cooldownRef = useRef<number>(0);
  const pendingInterjectionRef = useRef<GeorgeLine | null>(null);
  const completedQuestIdsRef = useRef<Set<string>>(new Set());
  const factionRef = useRef<Record<FactionId, number>>(factionReputation);
  const alertRef = useRef({ level: world.globalAlertLevel, inCombat: world.inCombat });
  const ambientTimerRef = useRef<number | null>(null);
  const ambientTrackerRef = useRef<GeorgeAmbientTracker | null>(null);

  const appendEntry = useCallback(
    (actor: Actor, text: string, referenceKey: keyof typeof georgeStrings.references) => {
      const reference = georgeStrings.references[referenceKey];
      setLogEntries((prev) => {
        const entry: ConversationEntry = {
          id: `${Date.now()}-${Math.random()}`,
          actor,
          text,
          reference,
        };
        const next = [...prev, entry];
        return next.slice(-8);
      });
    },
    [georgeStrings]
  );

  const presentInterjection = useCallback((line: GeorgeLine, log = false) => {
    cooldownRef.current = Date.now() + INTERJECTION_COOLDOWN_MS;
    pendingInterjectionRef.current = null;
    setInterjection(line.text);
    if (log) {
      appendEntry('george', line.text, 'ambient');
    }
    window.setTimeout(() => setInterjection(null), INTERJECTION_DISPLAY_MS);
  }, [appendEntry]);

  const respondToPrompt = useCallback((id: ConversationId) => {
    const option = conversationOptions.find((entry) => entry.id === id);
    if (option) {
      appendEntry('player', option.label, 'prompt');
    }

    switch (id) {
      case 'guidance': {
        const missionLines: string[] = [];
        const levelName = missionProgress?.name ?? 'current zone';

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
        appendEntry('george', message, 'guidance');
        break;
      }
      case 'status': {
        const message = georgeStrings.statusIntro(intel.statusLine);
        appendEntry('george', message, 'status');
        break;
      }
      case 'quests': {
        const questLines = buildQuestReadout(objectiveQueue, georgeStrings);
        const message = `${georgeStrings.questsIntro}\n${questLines.join('\n')}`.trim();
        appendEntry('george', message, 'quests');
        break;
      }
      default:
        break;
    }
  }, [appendEntry, conversationOptions, georgeStrings, intel.statusLine, objectiveQueue, missionProgress, nextPrimaryObjective, nextSideObjective]);

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

  const formatAmbientEvent = useCallback((event: GeorgeAmbientEvent): AmbientFeedEntry | null => {
    const ambientFeed = georgeStrings.ambientFeed;
    const alignment = personality.alignment;
    const label = ambientFeed.categoryLabels[event.category] ?? event.category.toUpperCase();
    const id = `${event.category}-${event.timestamp}-${Math.random().toString(36).slice(2)}`;

    switch (event.category) {
      case 'rumor': {
        const line = event.lines.find((entry) => entry && entry.trim().length > 0)?.trim() ?? ambientFeed.fallbacks.rumor;
        const storyLabel = event.storyFunction
          ? ambientFeed.storyFunctionLabels[event.storyFunction] ??
            event.storyFunction.replace(/-/g, ' ').toUpperCase()
          : undefined;
        const summary = ambientFeed.formatRumor({ line, storyLabel }, alignment);
        return {
          id,
          category: event.category,
          summary,
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
        const summary = ambientFeed.formatSignage({ text, storyLabel }, alignment);
        return {
          id,
          category: event.category,
          summary,
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
        const summary = ambientFeed.formatWeather({ description, storyLabel }, alignment);
        return {
          id,
          category: event.category,
          summary,
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
        const summary = ambientFeed.formatZoneDanger(
          {
            zoneName: event.zoneName,
            dangerLabel,
            previousDangerLabel,
            flagChanges,
          },
          alignment
        );
        return {
          id,
          category: event.category,
          summary,
          label,
          timestamp: event.timestamp,
        };
      }
      case 'hazardChange': {
        const additions = event.added.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
        const removals = event.removed.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
        const summary = ambientFeed.formatHazards(
          {
            zoneName: event.zoneName,
            additions,
            removals,
          },
          alignment
        );
        return {
          id,
          category: event.category,
          summary,
          label,
          timestamp: event.timestamp,
        };
      }
      default:
        return null;
    }
  }, [georgeStrings.ambientFeed, personality.alignment, uiStrings.levelIndicator.dangerLevels]);

  useEffect(() => {
    const handleMissionAccomplished = (event: Event) => {
      const detail = (event as CustomEvent<MissionEventDetail>).detail;
      if (!detail) {
        return;
      }

      const message = `Mission secured in ${detail.name}. Awaiting redeploy.`;
      appendEntry('george', message, 'guidance');
      queueInterjection('questCompleted');
    };

    const handleLevelAdvance = (event: Event) => {
      const detail = (event as CustomEvent<LevelAdvanceEventDetail>).detail;
      if (!detail) {
        return;
      }

      const nextDescriptor = detail.nextLevelId ?? `level ${detail.nextLevel}`;
      const message = `Prepping overlays for ${nextDescriptor}. Say the word and I’ll broadcast updates.`;
      appendEntry('george', message, 'status');
    };

    window.addEventListener(MISSION_ACCOMPLISHED_EVENT, handleMissionAccomplished as EventListener);
    window.addEventListener(LEVEL_ADVANCE_REQUESTED_EVENT, handleLevelAdvance as EventListener);

    return () => {
      window.removeEventListener(MISSION_ACCOMPLISHED_EVENT, handleMissionAccomplished as EventListener);
      window.removeEventListener(LEVEL_ADVANCE_REQUESTED_EVENT, handleLevelAdvance as EventListener);
    };
  }, [appendEntry, queueInterjection]);

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
      ambientTrackerRef.current = new GeorgeAmbientTracker();
      ambientTrackerRef.current.prime(ambientSnapshot);
      return;
    }

    const tracker = ambientTrackerRef.current;
    const events = tracker.collect(ambientSnapshot);
    if (!events.length) {
      return;
    }

    const formatted = events
      .map((event) => formatAmbientEvent(event))
      .filter((entry): entry is AmbientFeedEntry => entry !== null);
    if (!formatted.length) {
      return;
    }

    setAmbientEntries((prev) => {
      const next = [...prev, ...formatted];
      return next.slice(-AMBIENT_FEED_LIMIT);
    });

    if (!isOpen || activeTab !== 'ambient') {
      setHasAmbientPing(true);
    }
  }, [ambientSnapshot, formatAmbientEvent, isOpen, activeTab]);

  useEffect(() => {
    if (isOpen && activeTab === 'ambient' && hasAmbientPing) {
      setHasAmbientPing(false);
    }
  }, [isOpen, activeTab, hasAmbientPing]);

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
            if (hasAmbientPing) {
              setActiveTab('ambient');
            }
            respondToPrompt('guidance');
          }
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [respondToPrompt, hasAmbientPing]);

  useEffect(() => {
    if (isOpen) {
      respondToPrompt('guidance');
    }
  }, [isOpen, respondToPrompt]);

  const lastLog = logEntries.length > 0 ? logEntries[logEntries.length - 1] : null;
  const latestAmbient = ambientEntries.length > 0 ? ambientEntries[ambientEntries.length - 1] : null;
  const baseTickerLine = interjection ?? lastLog?.text ?? latestAmbient?.summary ?? georgeStrings.dockStatusIdle;

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

    logEntries.slice(-2).forEach((entry) => push(entry.text));
    ambientEntries.slice(-2).forEach((entry) => push(entry.summary));
    ambientLines.slice(0, 2).forEach((line) => push(line));

    if (unique.length === 0) {
      push(georgeStrings.dockStatusIdle);
    }

    return unique.slice(0, 6);
  }, [ambientEntries, ambientLines, baseTickerLine, georgeStrings.dockStatusIdle, intel.primaryHint, objectiveQueue, logEntries]);

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

  const logViewRef = useRef<HTMLDivElement | null>(null);
  const ambientFeedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = logViewRef.current;
    if (!node || activeTab !== 'intel') {
      return;
    }
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
  }, [logEntries, isOpen, activeTab]);

  useEffect(() => {
    const node = ambientFeedRef.current;
    if (!node || activeTab !== 'ambient' || !isOpen) {
      return;
    }
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
  }, [ambientEntries, isOpen, activeTab]);

  const panelId = 'george-console-panel';
  const intelPanelId = 'george-console-intel';
  const ambientPanelId = 'george-console-ambient';

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
              if (hasAmbientPing) {
                setActiveTab('ambient');
              }
              respondToPrompt('guidance');
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

            <div className="george-tabs" role="tablist" aria-label={georgeStrings.consoleTitle}>
              <button
                type="button"
                role="tab"
                className={`george-tab-button${activeTab === 'intel' ? ' active' : ''}`}
                aria-selected={activeTab === 'intel'}
                aria-controls={intelPanelId}
                onClick={() => setActiveTab('intel')}
              >
                {georgeStrings.ambientFeed.tabs.intel}
              </button>
              <button
                type="button"
                role="tab"
                className={`george-tab-button${activeTab === 'ambient' ? ' active' : ''}`}
                aria-selected={activeTab === 'ambient'}
                aria-controls={ambientPanelId}
                onClick={() => setActiveTab('ambient')}
              >
                {georgeStrings.ambientFeed.tabs.ambient}
              </button>
            </div>

            <div className="george-log-container">
              {activeTab === 'intel' ? (
                <div className="george-log" id={intelPanelId} role="log" aria-live="polite" ref={logViewRef}>
                  {logEntries.length === 0 ? (
                    <div className="george-log-item">
                      <div className="george-log-meta">
                        <span className="george-log-actor">{georgeStrings.actors.george}</span>
                        <span className="george-log-reference">{georgeStrings.references.guidance}</span>
                      </div>
                      <div className="george-log-text">{georgeStrings.logEmpty}</div>
                    </div>
                  ) : (
                    logEntries.map((entry, index) => (
                      <div
                        key={entry.id}
                        className={`george-log-item george-log-item--${entry.actor}${index === logEntries.length - 1 ? ' george-log-item--latest' : ''}`}
                      >
                        <div className="george-log-meta">
                          <span className="george-log-actor">{georgeStrings.actors[entry.actor]}</span>
                          <span className="george-log-reference">{entry.reference}</span>
                        </div>
                        <div className="george-log-text">{entry.text}</div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="george-ambient-feed" id={ambientPanelId} role="log" aria-live="polite" ref={ambientFeedRef}>
                  {ambientEntries.length === 0 ? (
                    <div className="george-ambient-empty">{georgeStrings.ambientFeed.empty}</div>
                  ) : (
                    ambientEntries.map((entry) => (
                      <div key={entry.id} className="george-ambient-item">
                        <div className="george-ambient-meta">
                          <span className="george-ambient-label">{entry.label}</span>
                          <span className="george-ambient-time">{formatTimestamp(entry.timestamp)}</span>
                        </div>
                        <div className="george-ambient-text">{entry.summary}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {activeTab === 'intel' && (
              <div className="george-actions">
                {conversationOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className="george-action-button"
                    onClick={() => respondToPrompt(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default GeorgeAssistant;
