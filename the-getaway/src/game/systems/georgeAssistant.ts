import { PersonalityProfile, PersonalityTrait } from '../interfaces/types';
import { ObjectiveQueueEntry } from '../../store/selectors/questSelectors';
import { GEORGE_DIALOGUE_LIBRARY, GeorgeDialogueTemplate, GeorgeLine, GeorgeInterjectionTrigger } from '../../content/assistants/george';

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
}

export const buildAssistantIntel = (context: HintBuildContext): AssistantIntel => {
  const { objectiveQueue, personality, karma, factionReputation } = context;
  const primaryObjective = objectiveQueue[0];
  const secondaryObjective = objectiveQueue[1];

  const karmaDescriptor = describeKarma(karma);
  const primaryHint = primaryObjective
    ? formatObjectiveLine(primaryObjective, toneOpeners[personality.alignment])
    : 'Quiet moment. No tracked objectives pinging.';

  const secondaryHint = secondaryObjective
    ? formatObjectiveLine(secondaryObjective, sideOpeners[personality.alignment])
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
