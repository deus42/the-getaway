/* istanbul ignore file */
import type { Position } from '../interfaces/types';
import type {
  LevelResourceKey,
  MissionResourceKey,
  QuestResourceKey,
} from './structureTypes';

export type NarrativeRelation =
  | 'on'
  | 'near'
  | 'inside'
  | 'left_of'
  | 'right_of'
  | 'above'
  | 'below'
  | 'adjacent_to'
  | 'behind'
  | 'in_front_of';

export interface SpatialHint {
  readonly preferredPosition?: Position;
  readonly areaBounds?: {
    readonly from: Position;
    readonly to: Position;
  };
  readonly offsetFromAnchor?: Position;
  readonly anchorResourceKey?: string;
}

export interface NarrativeEntityReference {
  readonly label: string;
  readonly resourceKey?: string;
  readonly tags?: string[];
  readonly spatialHint?: SpatialHint;
}

export interface NarrativeTriple {
  readonly id: string;
  readonly subject: NarrativeEntityReference;
  readonly relation: NarrativeRelation;
  readonly object: NarrativeEntityReference;
  readonly priority?: number;
  readonly resourceKey?: string;
}

export interface SceneMoment {
  readonly id: string;
  readonly label: string;
  readonly summary?: string;
  readonly order: number;
  readonly triples: NarrativeTriple[];
  readonly priority?: number;
}

export interface ScenePropPlacement {
  resourceKey: string;
  originTripleId: string;
  position: Position;
  depth: number;
  relationApplied: NarrativeRelation;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface GeneratedSceneDefinition {
  readonly id: string;
  readonly resourceKey: string;
  readonly levelKey: LevelResourceKey;
  readonly missionKey: MissionResourceKey;
  readonly questKeys?: QuestResourceKey[];
  readonly width: number;
  readonly height: number;
  readonly baseTile?: string;
  readonly baseElevation?: number;
  readonly defaultDepthScale?: number;
  readonly metadata?: Record<string, unknown>;
  readonly moments: SceneMoment[];
  readonly placements: ScenePropPlacement[];
}

export interface ValidationIssue {
  readonly path: string;
  readonly message: string;
}

export interface ValidationResult<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly issues: ValidationIssue[];
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isPosition = (value: unknown): value is Position => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Position;

  return isFiniteNumber(candidate.x) && isFiniteNumber(candidate.y);
};

const validateEntityReference = (
  entity: unknown,
  path: string
): ValidationIssue[] => {
  if (!entity || typeof entity !== 'object') {
    return [{ path, message: 'Expected entity reference object' }];
  }

  const issues: ValidationIssue[] = [];
  const reference = entity as NarrativeEntityReference;

  if (!reference.label || typeof reference.label !== 'string') {
    issues.push({ path: `${path}.label`, message: 'Missing label' });
  }

  if (
    reference.resourceKey &&
    typeof reference.resourceKey !== 'string'
  ) {
    issues.push({
      path: `${path}.resourceKey`,
      message: 'resourceKey must be a string when provided',
    });
  }

  if (reference.tags && !Array.isArray(reference.tags)) {
    issues.push({
      path: `${path}.tags`,
      message: 'tags must be an array of strings',
    });
  } else if (reference.tags) {
    reference.tags.forEach((tag, index) => {
      if (typeof tag !== 'string') {
        issues.push({
          path: `${path}.tags[${index}]`,
          message: 'tags must contain strings only',
        });
      }
    });
  }

  const hint = reference.spatialHint;
  if (hint) {
    if (hint.preferredPosition && !isPosition(hint.preferredPosition)) {
      issues.push({
        path: `${path}.spatialHint.preferredPosition`,
        message: 'preferredPosition must include x and y numbers',
      });
    }

    if (hint.areaBounds) {
      if (!isPosition(hint.areaBounds.from)) {
        issues.push({
          path: `${path}.spatialHint.areaBounds.from`,
          message: 'areaBounds.from must include x and y numbers',
        });
      }
      if (!isPosition(hint.areaBounds.to)) {
        issues.push({
          path: `${path}.spatialHint.areaBounds.to`,
          message: 'areaBounds.to must include x and y numbers',
        });
      }
    }

    if (
      hint.offsetFromAnchor &&
      !isPosition(hint.offsetFromAnchor)
    ) {
      issues.push({
        path: `${path}.spatialHint.offsetFromAnchor`,
        message: 'offsetFromAnchor must include x and y numbers',
      });
    }

    if (
      hint.anchorResourceKey &&
      typeof hint.anchorResourceKey !== 'string'
    ) {
      issues.push({
        path: `${path}.spatialHint.anchorResourceKey`,
        message: 'anchorResourceKey must be a string when provided',
      });
    }
  }

  return issues;
};

export const validateNarrativeTriple = (
  triple: unknown,
  path = 'triple'
): ValidationIssue[] => {
  if (!triple || typeof triple !== 'object') {
    return [{ path, message: 'Expected triple object' }];
  }

  const issues: ValidationIssue[] = [];
  const candidate = triple as NarrativeTriple;

  if (!candidate.id || typeof candidate.id !== 'string') {
    issues.push({ path: `${path}.id`, message: 'Missing id' });
  }

  issues.push(...validateEntityReference(candidate.subject, `${path}.subject`));
  issues.push(...validateEntityReference(candidate.object, `${path}.object`));

  if (!candidate.relation || typeof candidate.relation !== 'string') {
    issues.push({
      path: `${path}.relation`,
      message: 'Missing relation identifier',
    });
  }

  if (
    candidate.priority !== undefined &&
    !isFiniteNumber(candidate.priority)
  ) {
    issues.push({
      path: `${path}.priority`,
      message: 'priority must be a finite number when provided',
    });
  }

  if (
    candidate.resourceKey &&
    typeof candidate.resourceKey !== 'string'
  ) {
    issues.push({
      path: `${path}.resourceKey`,
      message: 'resourceKey must be a string when provided',
    });
  }

  return issues;
};

export const validateSceneMoment = (
  moment: unknown,
  path = 'moment'
): ValidationIssue[] => {
  if (!moment || typeof moment !== 'object') {
    return [{ path, message: 'Expected scene moment object' }];
  }

  const issues: ValidationIssue[] = [];
  const candidate = moment as SceneMoment;

  if (!candidate.id || typeof candidate.id !== 'string') {
    issues.push({ path: `${path}.id`, message: 'Missing id`' });
  }

  if (!isFiniteNumber(candidate.order)) {
    issues.push({
      path: `${path}.order`,
      message: 'order must be a finite number',
    });
  }

  if (!candidate.label || typeof candidate.label !== 'string') {
    issues.push({
      path: `${path}.label`,
      message: 'Missing label',
    });
  }

  if (candidate.summary && typeof candidate.summary !== 'string') {
    issues.push({
      path: `${path}.summary`,
      message: 'summary must be a string when provided',
    });
  }

  if (
    candidate.priority !== undefined &&
    !isFiniteNumber(candidate.priority)
  ) {
    issues.push({
      path: `${path}.priority`,
      message: 'priority must be a finite number when provided',
    });
  }

  if (!Array.isArray(candidate.triples)) {
    issues.push({
      path: `${path}.triples`,
      message: 'triples must be an array',
    });
  } else {
    candidate.triples.forEach((triple, index) => {
      issues.push(
        ...validateNarrativeTriple(triple, `${path}.triples[${index}]`)
      );
    });
  }

  return issues;
};

export const validateGeneratedSceneDefinition = (
  scene: unknown
): ValidationResult<GeneratedSceneDefinition> => {
  if (!scene || typeof scene !== 'object') {
    return {
      success: false,
      issues: [
        {
          path: 'scene',
          message: 'Expected generated scene definition object',
        },
      ],
    };
  }

  const candidate = scene as GeneratedSceneDefinition;
  const issues: ValidationIssue[] = [];

  if (!candidate.id || typeof candidate.id !== 'string') {
    issues.push({ path: 'id', message: 'Missing id' });
  }

  if (!candidate.resourceKey || typeof candidate.resourceKey !== 'string') {
    issues.push({ path: 'resourceKey', message: 'Missing resourceKey' });
  }

  if (!candidate.levelKey || typeof candidate.levelKey !== 'string') {
    issues.push({ path: 'levelKey', message: 'Missing levelKey' });
  }

  if (!candidate.missionKey || typeof candidate.missionKey !== 'string') {
    issues.push({ path: 'missionKey', message: 'Missing missionKey' });
  }

  if (!isFiniteNumber(candidate.width) || candidate.width <= 0) {
    issues.push({
      path: 'width',
      message: 'width must be a positive number',
    });
  }

  if (!isFiniteNumber(candidate.height) || candidate.height <= 0) {
    issues.push({
      path: 'height',
      message: 'height must be a positive number',
    });
  }

  if (!Array.isArray(candidate.moments)) {
    issues.push({
      path: 'moments',
      message: 'moments must be an array',
    });
  } else {
    candidate.moments.forEach((moment, index) => {
      issues.push(...validateSceneMoment(moment, `moments[${index}]`));
    });
  }

  if (!Array.isArray(candidate.placements)) {
    issues.push({
      path: 'placements',
      message: 'placements must be an array',
    });
  } else {
    candidate.placements.forEach((placement, index) => {
      if (!placement || typeof placement !== 'object') {
        issues.push({
          path: `placements[${index}]`,
          message: 'placement must be an object',
        });
        return;
      }

      if (!placement.resourceKey) {
        issues.push({
          path: `placements[${index}].resourceKey`,
          message: 'Missing resourceKey',
        });
      }

      if (!placement.originTripleId) {
        issues.push({
          path: `placements[${index}].originTripleId`,
          message: 'Missing originTripleId',
        });
      }

      if (
        !placement.position ||
        !isPosition(placement.position)
      ) {
        issues.push({
          path: `placements[${index}].position`,
          message: 'position.x and position.y must be finite numbers',
        });
      }

      if (
        placement.tags &&
        (!Array.isArray(placement.tags) ||
          placement.tags.some((tag) => typeof tag !== 'string'))
      ) {
        issues.push({
          path: `placements[${index}].tags`,
          message: 'tags must be an array of strings',
        });
      }
    });
  }

  return {
    success: issues.length === 0,
    data: issues.length === 0 ? candidate : undefined,
    issues,
  };
};
