import { PersonalityProfile, PersonalityTrait } from '../interfaces/types';
import { ObjectiveQueueEntry } from '../../store/selectors/questSelectors';
import { ResolvedMissionObjective } from '../interfaces/missions';
import { GEORGE_DIALOGUE_LIBRARY, GeorgeDialogueTemplate, GeorgeLine, GeorgeInterjectionTrigger } from '../../content/assistants/george';
import type { EnvironmentFlags, StoryFunctionTag } from '../interfaces/environment';
import type { GeorgeAmbientCategory, GeorgeAmbientSnapshot } from '../interfaces/georgeAssistant';
import type { DangerRating } from '../interfaces/types';

interface KarmaDescriptor {
  label: string;
  tone: 'admiring' | 'steady' | 'wary' | 'critical';
  threshold: number;
}

const KARMA_DESCRIPTORS: KarmaDescriptor[] = [
  { label: 'saintly', tone: 'admiring', threshold: 600 },
  { label: 'steady', tone: 'steady', threshold: 200 },
  { label: 'neutral', tone: 'steady', threshold: -199 },
  { label: 'stained', tone: 'wary', threshold: -400 },
];

const toneOpeners: Record<PersonalityTrait, string> = {
  earnest: 'Let’s keep the plan tight',
  sarcastic: 'Broadcast from your favorite snark circuit',
  ruthless: 'Targets queued',
  stoic: 'Situation report',
};

const sideOpeners: Record<PersonalityTrait, string> = {
  earnest: 'Side angle',
  sarcastic: 'Optional chaos',
  ruthless: 'Secondary hit list',
  stoic: 'Alternate vector',
};

const formatObjectiveLine = (
  entry: ObjectiveQueueEntry,
  opener: string
): string => {
  const countSuffix = entry.objective.count && entry.objective.count > 1
    ? ` (${entry.objective.currentCount ?? 0}/${entry.objective.count})`
    : '';
  return `${opener}: ${entry.questName} — ${entry.objective.description}${countSuffix}`;
};

const describeKarma = (karma: number): KarmaDescriptor => {
  for (const descriptor of KARMA_DESCRIPTORS) {
    if (karma >= descriptor.threshold) {
      return descriptor;
    }
  }
  return KARMA_DESCRIPTORS[KARMA_DESCRIPTORS.length - 1];
};

const formatFactionStanding = (
  reputation: Record<string, number>
): string => {
  const entries = Object.entries(reputation);
  if (entries.length === 0) {
    return 'No faction intel logged';
  }

  const ranked = entries.sort((a, b) => b[1] - a[1]);
  const [topFaction, topValue] = ranked[0];
  const [bottomFaction, bottomValue] = ranked[ranked.length - 1];

  const factionLabel = (key: string): string => {
    switch (key) {
      case 'resistance':
        return 'Resistance';
      case 'corpsec':
        return 'CorpSec';
      case 'scavengers':
        return 'Scavengers';
      default:
        return key;
    }
  };

  const topSnippet = `${factionLabel(topFaction)} ${topValue >= 0 ? '+' : ''}${topValue}`;
  const bottomSnippet = `${factionLabel(bottomFaction)} ${bottomValue >= 0 ? '+' : ''}${bottomValue}`;

  if (ranked.length === 1 || topFaction === bottomFaction) {
    return topSnippet;
  }

  return `${topSnippet}, ${bottomSnippet}`;
};

const fillTemplate = (
  template: GeorgeDialogueTemplate,
  alignment: PersonalityTrait,
  replacements: Record<string, string>
): GeorgeLine => {
  const response = template.responses[alignment] ?? template.responses.earnest;
  let text = response.text;
  Object.entries(replacements).forEach(([token, value]) => {
    const pattern = new RegExp(`{{${token}}}`, 'g');
    text = text.replace(pattern, value);
  });
  return {
    ...response,
    text,
  };
};

export interface AssistantIntel {
  primaryHint: string;
  secondaryHint?: string;
  statusLine: string;
}

export interface HintBuildContext {
  objectiveQueue: ObjectiveQueueEntry[];
  personality: PersonalityProfile;
  karma: number;
  factionReputation: Record<string, number>;
  missionPrimary?: ResolvedMissionObjective | null;
  missionSide?: ResolvedMissionObjective | null;
}

const formatMissionObjective = (objective: ResolvedMissionObjective, opener: string): string => {
  const countSuffix = objective.totalQuests > 1
    ? ` (${objective.completedQuests}/${objective.totalQuests})`
    : '';
  return `${opener}: ${objective.label}${countSuffix}`;
};

export const buildAssistantIntel = (context: HintBuildContext): AssistantIntel => {
  const { objectiveQueue, personality, karma, factionReputation, missionPrimary, missionSide } = context;
  const primaryObjective = missionPrimary ?? objectiveQueue[0] ?? null;
  const secondaryObjective = missionSide ?? objectiveQueue[1] ?? null;

  const karmaDescriptor = describeKarma(karma);
  const primaryHint = missionPrimary
    ? formatMissionObjective(missionPrimary, toneOpeners[personality.alignment])
    : primaryObjective
    ? formatObjectiveLine(primaryObjective as ObjectiveQueueEntry, toneOpeners[personality.alignment])
    : 'Quiet moment. No tracked objectives pinging.';

  const secondaryHint = missionSide
    ? formatMissionObjective(missionSide, sideOpeners[personality.alignment])
    : secondaryObjective
    ? formatObjectiveLine(secondaryObjective as ObjectiveQueueEntry, sideOpeners[personality.alignment])
    : undefined;

  const statusLine = `Karma ${karmaDescriptor.label} (${karma >= 0 ? '+' : ''}${karma}) · ${formatFactionStanding(
    factionReputation
  )}`;

  return {
    primaryHint,
    secondaryHint,
    statusLine,
  };
};

export const buildConversationResponse = (
  promptId: GeorgeDialogueTemplate['id'],
  alignment: PersonalityTrait,
  replacements: Record<string, string>
): GeorgeLine => {
  const template = GEORGE_DIALOGUE_LIBRARY.prompts.find((entry) => entry.id === promptId);
  if (!template) {
    throw new Error(`Unknown George prompt '${promptId}'`);
  }

  return fillTemplate(template, alignment, replacements);
};

export const pickBanterLine = (alignment: PersonalityTrait): GeorgeLine => {
  const pool = GEORGE_DIALOGUE_LIBRARY.banter[alignment] ?? GEORGE_DIALOGUE_LIBRARY.banter.earnest;
  return pool[Math.floor(Math.random() * pool.length)];
};

export const pickInterjectionLine = (
  trigger: GeorgeInterjectionTrigger,
  alignment: PersonalityTrait
): GeorgeLine | null => {
  const entries = GEORGE_DIALOGUE_LIBRARY.interjections[trigger];
  if (!entries) {
    return null;
  }

  const pool = entries[alignment] ?? entries.earnest;
  if (!pool || pool.length === 0) {
    return null;
  }

  return pool[Math.floor(Math.random() * pool.length)];
};

type AmbientFlagChange = {
  key: keyof EnvironmentFlags;
  previous: EnvironmentFlags[keyof EnvironmentFlags];
  next: EnvironmentFlags[keyof EnvironmentFlags];
};

export type GeorgeAmbientEvent =
  | {
      category: 'rumor';
      timestamp: number;
      groupId: string;
      lines: string[];
      storyFunction?: StoryFunctionTag;
    }
  | {
      category: 'signage';
      timestamp: number;
      signId: string;
      text: string;
      storyFunction?: StoryFunctionTag;
    }
  | {
      category: 'weather';
      timestamp: number;
      presetId: string | null;
      previousPresetId: string | null;
      description: string;
      storyFunction?: StoryFunctionTag;
      rainIntensity: number;
      thunderActive: boolean;
    }
  | {
      category: 'zoneDanger';
      timestamp: number;
      dangerRating: DangerRating | null;
      previousDangerRating: DangerRating | null;
      flags: EnvironmentFlags;
      previousFlags: EnvironmentFlags;
      changedFlags: AmbientFlagChange[];
      zoneName: string | null;
    }
  | {
      category: 'hazardChange';
      timestamp: number;
      added: string[];
      removed: string[];
      zoneName: string | null;
    }
  | {
      category: 'zoneBrief';
      timestamp: number;
      zoneName: string | null;
      summary: string | null;
      dangerRating: DangerRating | null;
      hazards: string[];
      directives: string[];
    };

const ENVIRONMENT_FLAG_KEYS: Array<keyof EnvironmentFlags> = [
  'gangHeat',
  'curfewLevel',
  'supplyScarcity',
  'blackoutTier',
];

const DEFAULT_AMBIENT_COOLDOWNS: Record<GeorgeAmbientCategory, number> = {
  rumor: 45000,
  signage: 45000,
  weather: 30000,
  zoneDanger: 15000,
  hazardChange: 12000,
  zoneBrief: 60000,
};

const cloneFlags = (flags: EnvironmentFlags): EnvironmentFlags => ({
  gangHeat: flags.gangHeat,
  curfewLevel: flags.curfewLevel,
  supplyScarcity: flags.supplyScarcity,
  blackoutTier: flags.blackoutTier,
});

const cloneSnapshot = (snapshot: GeorgeAmbientSnapshot): GeorgeAmbientSnapshot => ({
  flags: cloneFlags(snapshot.flags),
  rumor: snapshot.rumor
    ? {
        groupId: snapshot.rumor.groupId,
        lines: [...snapshot.rumor.lines],
        storyFunction: snapshot.rumor.storyFunction,
        updatedAt: snapshot.rumor.updatedAt,
      }
    : null,
  signage: snapshot.signage
    ? {
        signId: snapshot.signage.signId,
        text: snapshot.signage.text,
        storyFunction: snapshot.signage.storyFunction,
        updatedAt: snapshot.signage.updatedAt,
      }
    : null,
  weather: {
    presetId: snapshot.weather.presetId,
    description: snapshot.weather.description,
    storyFunction: snapshot.weather.storyFunction,
    updatedAt: snapshot.weather.updatedAt,
    rainIntensity: snapshot.weather.rainIntensity,
    thunderActive: snapshot.weather.thunderActive,
  },
  zone: {
    zoneId: snapshot.zone.zoneId,
    zoneName: snapshot.zone.zoneName,
    dangerRating: snapshot.zone.dangerRating,
    hazards: [...snapshot.zone.hazards],
    summary: snapshot.zone.summary,
    directives: [...snapshot.zone.directives],
  },
});

const buildHazardMap = (hazards: string[]): Map<string, string> => {
  const map = new Map<string, string>();
  hazards.forEach((hazard) => {
    const trimmed = hazard.trim();
    if (!trimmed) {
      return;
    }
    const key = trimmed.toLowerCase();
    if (!map.has(key)) {
      map.set(key, trimmed);
    }
  });
  return map;
};

const areStringArraysEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) {
      return false;
    }
  }
  return true;
};

interface GeorgeAmbientTrackerOptions {
  cooldowns?: Partial<Record<GeorgeAmbientCategory, number>>;
}

export class GeorgeAmbientTracker {
  private previous: GeorgeAmbientSnapshot | null = null;
  private lastEmitted: Partial<Record<GeorgeAmbientCategory, number>> = {};
  private readonly cooldowns: Record<GeorgeAmbientCategory, number>;

  constructor(options?: GeorgeAmbientTrackerOptions) {
    this.cooldowns = {
      ...DEFAULT_AMBIENT_COOLDOWNS,
      ...(options?.cooldowns ?? {}),
    };
  }

  prime(snapshot: GeorgeAmbientSnapshot): void {
    this.previous = cloneSnapshot(snapshot);
    this.lastEmitted = {};
  }

  reset(): void {
    this.previous = null;
    this.lastEmitted = {};
  }

  collect(snapshot: GeorgeAmbientSnapshot, timestamp = Date.now()): GeorgeAmbientEvent[] {
    const nextClone = cloneSnapshot(snapshot);

    if (!this.previous) {
      this.previous = nextClone;
      return [];
    }

    const events = this.diff(this.previous, nextClone, timestamp);
    const emitted: GeorgeAmbientEvent[] = [];

    for (const event of events) {
      const last = this.lastEmitted[event.category];
      const cooldown = this.cooldowns[event.category] ?? 0;
      if (typeof last === 'number' && cooldown > 0 && timestamp - last < cooldown) {
        continue;
      }
      emitted.push(event);
      this.lastEmitted[event.category] = timestamp;
    }

    this.previous = nextClone;

    return emitted;
  }

  private diff(
    previous: GeorgeAmbientSnapshot,
    current: GeorgeAmbientSnapshot,
    timestamp: number
  ): GeorgeAmbientEvent[] {
    const events: GeorgeAmbientEvent[] = [];

    if (current.rumor && current.rumor.lines.length > 0) {
      if (!previous.rumor || previous.rumor.updatedAt !== current.rumor.updatedAt) {
        events.push({
          category: 'rumor',
          timestamp,
          groupId: current.rumor.groupId,
          lines: [...current.rumor.lines],
          storyFunction: current.rumor.storyFunction,
        });
      }
    }

    if (current.signage) {
      if (!previous.signage || previous.signage.updatedAt !== current.signage.updatedAt ||
        previous.signage.text !== current.signage.text) {
        events.push({
          category: 'signage',
          timestamp,
          signId: current.signage.signId,
          text: current.signage.text,
          storyFunction: current.signage.storyFunction,
        });
      }
    }

    const weatherChanged =
      previous.weather.presetId !== current.weather.presetId ||
      previous.weather.updatedAt !== current.weather.updatedAt ||
      previous.weather.rainIntensity !== current.weather.rainIntensity ||
      previous.weather.thunderActive !== current.weather.thunderActive;

    if (weatherChanged) {
      events.push({
        category: 'weather',
        timestamp,
        presetId: current.weather.presetId,
        previousPresetId: previous.weather.presetId,
        description: current.weather.description,
        storyFunction: current.weather.storyFunction,
        rainIntensity: current.weather.rainIntensity,
        thunderActive: current.weather.thunderActive,
      });
    }

    const changedFlags: AmbientFlagChange[] = ENVIRONMENT_FLAG_KEYS.reduce<AmbientFlagChange[]>((acc, key) => {
      if (previous.flags[key] !== current.flags[key]) {
        acc.push({
          key,
          previous: previous.flags[key],
          next: current.flags[key],
        });
      }
      return acc;
    }, []);

    const dangerChanged = previous.zone.dangerRating !== current.zone.dangerRating;
    const zoneName = current.zone.zoneName ?? previous.zone.zoneName ?? null;
    if (dangerChanged || changedFlags.length > 0) {
      events.push({
        category: 'zoneDanger',
        timestamp,
        dangerRating: current.zone.dangerRating ?? null,
        previousDangerRating: previous.zone.dangerRating ?? null,
        flags: cloneFlags(current.flags),
        previousFlags: cloneFlags(previous.flags),
        changedFlags,
        zoneName,
      });
    }

    const previousHazards = buildHazardMap(previous.zone.hazards);
    const currentHazards = buildHazardMap(current.zone.hazards);

    const added: string[] = [];
    currentHazards.forEach((value, key) => {
      if (!previousHazards.has(key)) {
        added.push(value);
      }
    });

    const removed: string[] = [];
    previousHazards.forEach((value, key) => {
      if (!currentHazards.has(key)) {
        removed.push(value);
      }
    });

    if (added.length > 0 || removed.length > 0) {
      events.push({
        category: 'hazardChange',
        timestamp,
        added,
        removed,
        zoneName,
      });
    }

    const zoneChanged =
      previous.zone.zoneId !== current.zone.zoneId ||
      previous.zone.zoneName !== current.zone.zoneName ||
      previous.zone.summary !== current.zone.summary ||
      !areStringArraysEqual(previous.zone.directives, current.zone.directives);

    if (zoneChanged) {
      events.push({
        category: 'zoneBrief',
        timestamp,
        zoneName: current.zone.zoneName ?? zoneName,
        summary: current.zone.summary ?? null,
        dangerRating: current.zone.dangerRating ?? null,
        hazards: [...current.zone.hazards],
        directives: [...current.zone.directives],
      });
    }

    return events;
  }
}
