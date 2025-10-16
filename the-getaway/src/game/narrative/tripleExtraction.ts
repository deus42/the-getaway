import { v4 as uuidv4 } from 'uuid';
import type {
  NarrativeRelation,
  NarrativeTriple,
  SceneMoment,
  ValidationIssue,
} from './tripleTypes';
import {
  validateSceneMoment,
  validateNarrativeTriple,
} from './tripleTypes';

interface NarrativePromptInput {
  missionKey: string;
  levelKey: string;
  questKeys?: string[];
  text: string;
  locale?: string;
}

interface ManualMomentInput {
  id?: string;
  label: string;
  summary?: string;
  order?: number;
  triples: NarrativeTriple[];
}

export interface TripleExtractionOptions {
  readonly manualMoments?: ManualMomentInput[];
  readonly enforceManualFallback?: boolean;
  readonly minimumTriples?: number;
}

export interface TripleExtractionResult {
  readonly missionKey: string;
  readonly levelKey: string;
  readonly questKeys?: string[];
  readonly locale?: string;
  readonly moments: SceneMoment[];
  readonly issues: ValidationIssue[];
  readonly usedManualFallback: boolean;
}

const RELATIONS: NarrativeRelation[] = [
  'inside',
  'on',
  'near',
  'left_of',
  'right_of',
  'above',
  'below',
  'adjacent_to',
  'behind',
  'in_front_of',
];

const sanitizeLabel = (value: string): string =>
  value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s-]/g, '')
    .trim();

const toResourceKey = (label: string): string =>
  sanitizeLabel(label)
    .toLowerCase()
    .replace(/\s+/g, '-');

const createTriple = (
  subjectLabel: string,
  relation: NarrativeRelation,
  objectLabel: string,
  priority: number
): NarrativeTriple => ({
  id: uuidv4(),
  subject: {
    label: subjectLabel,
    resourceKey: `props.${toResourceKey(subjectLabel)}`,
  },
  relation,
  object: {
    label: objectLabel,
    resourceKey: `props.${toResourceKey(objectLabel)}`,
  },
  priority,
  resourceKey: `triples.${uuidv4()}`,
});

const parseTextIntoSentences = (text: string): string[] =>
  text
    .split(/[\.\n\r;]+/g)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

const detectRelation = (sentence: string): NarrativeRelation | null => {
  const lower = sentence.toLowerCase();

  for (const relation of RELATIONS) {
    if (lower.includes(relation.replace(/_/g, ' '))) {
      return relation;
    }
  }

  return null;
};

const splitAroundRelation = (
  sentence: string,
  relation: NarrativeRelation
): { subject: string; object: string } | null => {
  const relationToken = relation.replace(/_/g, ' ');
  const parts = sentence.split(new RegExp(`\\b${relationToken}\\b`, 'i'));

  if (parts.length !== 2) {
    return null;
  }

  const subject = sanitizeLabel(parts[0]);
  const object = sanitizeLabel(parts[1]);

  if (!subject || !object) {
    return null;
  }

  return { subject, object };
};

const generateMomentsFromTriples = (triples: NarrativeTriple[]): SceneMoment[] =>
  triples.length === 0
    ? []
    : [
        {
          id: uuidv4(),
          label: 'auto-generated',
          order: 0,
          summary: 'Auto-generated scene moment derived from mission prompt.',
          triples: triples.sort(
            (lhs, rhs) => (lhs.priority ?? 0) - (rhs.priority ?? 0)
          ),
        },
      ];

const convertManualMoments = (
  moments: ManualMomentInput[]
): SceneMoment[] =>
  moments.map((moment, index) => ({
    id: moment.id ?? uuidv4(),
    label: moment.label,
    summary: moment.summary,
    order: moment.order ?? index,
    triples: moment.triples,
  }));

export const extractTriplesFromPrompt = (
  input: NarrativePromptInput,
  options: TripleExtractionOptions = {}
): TripleExtractionResult => {
  const manualFallback = options.manualMoments
    ? convertManualMoments(options.manualMoments)
    : [];

  if (!input.text.trim() && manualFallback.length === 0) {
    return {
      missionKey: input.missionKey,
      levelKey: input.levelKey,
      questKeys: input.questKeys,
      locale: input.locale,
      moments: [],
      issues: [
        {
          path: 'prompt',
          message: 'No prompt text or manual fallback supplied',
        },
      ],
      usedManualFallback: false,
    };
  }

  const sentences = parseTextIntoSentences(input.text);

  const triples: NarrativeTriple[] = sentences
    .map((sentence, index) => {
      const relation = detectRelation(sentence);

      if (!relation) {
        return null;
      }

      const parts = splitAroundRelation(sentence, relation);

      if (!parts) {
        return null;
      }

      return createTriple(parts.subject, relation, parts.object, index);
    })
    .filter((triple): triple is NarrativeTriple => Boolean(triple));

  const minimumTriples = options.minimumTriples ?? 1;
  const autoMoments = generateMomentsFromTriples(triples);
  const shouldUseManual =
    options.enforceManualFallback ||
    autoMoments.length === 0 ||
    triples.length < minimumTriples;

  const selectedMoments = shouldUseManual ? manualFallback : autoMoments;

  const issues: ValidationIssue[] = [];

  selectedMoments.forEach((moment, momentIndex) => {
    issues.push(...validateSceneMoment(moment, `moments[${momentIndex}]`));

    moment.triples.forEach((triple, tripleIndex) => {
      issues.push(
        ...validateNarrativeTriple(
          triple,
          `moments[${momentIndex}].triples[${tripleIndex}]`
        )
      );
    });
  });

  return {
    missionKey: input.missionKey,
    levelKey: input.levelKey,
    questKeys: input.questKeys,
    locale: input.locale,
    moments: selectedMoments,
    issues,
    usedManualFallback: shouldUseManual,
  };
};
