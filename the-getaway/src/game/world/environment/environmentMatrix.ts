import { BlackoutTier, EnvironmentFlags } from '../../interfaces/environment';
import { clamp } from '../../utils/math';

export type SmogSeverity = 'none' | 'light' | 'heavy';
export type SurveillanceDensity = 'low' | 'elevated' | 'extreme';
export type RadiationLevel = 'none' | 'localized' | 'pervasive';
export type CurfewStatus = 'off' | 'tight' | 'lockdown';

export type TravelAdvisoryLevel = 'clear' | 'caution' | 'severe';
export type LoadoutBias = 'light' | 'balanced' | 'heavy' | 'sensor';
export type SafehouseAccessState = 'open' | 'restricted' | 'sealed';

export type SmogFactor = `smog:${SmogSeverity}`;
export type BlackoutFactor = `blackout:${BlackoutTier}`;
export type SurveillanceFactor = `surveillance:${SurveillanceDensity}`;
export type RadiationFactor = `radiation:${RadiationLevel}`;
export type CurfewFactor = `curfew:${CurfewStatus}`;

export type EnvironmentalFactor =
  | SmogFactor
  | BlackoutFactor
  | SurveillanceFactor
  | RadiationFactor
  | CurfewFactor;

export interface BehaviorImpact {
  sightMultiplier?: number;
  chaseMultiplier?: number;
  loadoutBias?: LoadoutBias;
  routineIntervalMultiplier?: number;
}

export interface FactionImpact {
  shopMarkupDelta?: number;
  reinforcementDelayMultiplier?: number;
  safehouseAccess?: SafehouseAccessState;
}

export interface TravelImpact {
  staminaDrainPerMinute?: number;
  vehicleWearMultiplier?: number;
  encounterRiskModifier?: number;
  advisoryLevel?: TravelAdvisoryLevel;
  visibilityMultiplier?: number;
}

export interface SystemImpact {
  behavior?: BehaviorImpact;
  faction?: FactionImpact;
  travel?: TravelImpact;
}

export interface CombinedSystemImpact {
  behavior: {
    sightMultiplier: number;
    chaseMultiplier: number;
    routineIntervalMultiplier: number;
    loadoutBias: LoadoutBias;
  };
  faction: {
    shopMarkupDelta: number;
    reinforcementDelayMultiplier: number;
    safehouseAccess: SafehouseAccessState;
  };
  travel: {
    staminaDrainPerMinute: number;
    vehicleWearMultiplier: number;
    encounterRiskModifier: number;
    advisoryLevel: TravelAdvisoryLevel;
    visibilityMultiplier: number;
  };
}

export const ALL_SMOG_FACTORS: SmogFactor[] = ['smog:none', 'smog:light', 'smog:heavy'];
export const ALL_BLACKOUT_FACTORS: BlackoutFactor[] = [
  'blackout:none',
  'blackout:brownout',
  'blackout:rolling',
];
export const ALL_SURVEILLANCE_FACTORS: SurveillanceFactor[] = [
  'surveillance:low',
  'surveillance:elevated',
  'surveillance:extreme',
];
export const ALL_RADIATION_FACTORS: RadiationFactor[] = [
  'radiation:none',
  'radiation:localized',
  'radiation:pervasive',
];
export const ALL_CURFEW_FACTORS: CurfewFactor[] = ['curfew:off', 'curfew:tight', 'curfew:lockdown'];

export const ALL_ENVIRONMENTAL_FACTORS: EnvironmentalFactor[] = [
  ...ALL_SMOG_FACTORS,
  ...ALL_BLACKOUT_FACTORS,
  ...ALL_SURVEILLANCE_FACTORS,
  ...ALL_RADIATION_FACTORS,
  ...ALL_CURFEW_FACTORS,
];

const LOADOUT_PRIORITY: Record<LoadoutBias, number> = {
  light: 0,
  balanced: 1,
  heavy: 2,
  sensor: 3,
};

const SAFEHOUSE_PRIORITY: Record<SafehouseAccessState, number> = {
  open: 0,
  restricted: 1,
  sealed: 2,
};

const ADVISORY_PRIORITY: Record<TravelAdvisoryLevel, number> = {
  clear: 0,
  caution: 1,
  severe: 2,
};

export const ENVIRONMENT_MATRIX: Record<EnvironmentalFactor, SystemImpact> = {
  'smog:none': {},
  'smog:light': {
    behavior: {
      sightMultiplier: 0.9,
      chaseMultiplier: 0.95,
      routineIntervalMultiplier: 1.05,
    },
    travel: {
      visibilityMultiplier: 0.85,
      staminaDrainPerMinute: 1,
      encounterRiskModifier: 1.1,
      advisoryLevel: 'caution',
    },
  },
  'smog:heavy': {
    behavior: {
      sightMultiplier: 0.65,
      chaseMultiplier: 0.8,
      loadoutBias: 'sensor',
      routineIntervalMultiplier: 1.2,
    },
    travel: {
      visibilityMultiplier: 0.55,
      staminaDrainPerMinute: 3,
      encounterRiskModifier: 1.35,
      vehicleWearMultiplier: 1.2,
      advisoryLevel: 'severe',
    },
  },
  'blackout:none': {},
  'blackout:brownout': {
    behavior: {
      sightMultiplier: 0.95,
    },
    faction: {
      shopMarkupDelta: 0.05,
      reinforcementDelayMultiplier: 1.1,
      safehouseAccess: 'restricted',
    },
    travel: {
      visibilityMultiplier: 0.8,
      advisoryLevel: 'caution',
    },
  },
  'blackout:rolling': {
    behavior: {
      sightMultiplier: 0.85,
      loadoutBias: 'sensor',
    },
    faction: {
      shopMarkupDelta: 0.12,
      reinforcementDelayMultiplier: 0.9,
      safehouseAccess: 'restricted',
    },
    travel: {
      visibilityMultiplier: 0.7,
      vehicleWearMultiplier: 1.1,
      advisoryLevel: 'caution',
    },
  },
  'surveillance:low': {},
  'surveillance:elevated': {
    behavior: {
      chaseMultiplier: 1.15,
      routineIntervalMultiplier: 1.05,
    },
    faction: {
      reinforcementDelayMultiplier: 0.95,
    },
    travel: {
      encounterRiskModifier: 1.2,
      advisoryLevel: 'caution',
    },
  },
  'surveillance:extreme': {
    behavior: {
      sightMultiplier: 1.1,
      chaseMultiplier: 1.3,
      loadoutBias: 'sensor',
      routineIntervalMultiplier: 1.15,
    },
    faction: {
      shopMarkupDelta: 0.08,
      reinforcementDelayMultiplier: 0.75,
      safehouseAccess: 'restricted',
    },
    travel: {
      encounterRiskModifier: 1.4,
      advisoryLevel: 'severe',
    },
  },
  'radiation:none': {},
  'radiation:localized': {
    behavior: {
      routineIntervalMultiplier: 1.08,
    },
    faction: {
      safehouseAccess: 'restricted',
    },
    travel: {
      staminaDrainPerMinute: 2,
      vehicleWearMultiplier: 1.15,
      advisoryLevel: 'caution',
    },
  },
  'radiation:pervasive': {
    behavior: {
      routineIntervalMultiplier: 1.18,
      loadoutBias: 'heavy',
    },
    faction: {
      shopMarkupDelta: 0.1,
      safehouseAccess: 'sealed',
    },
    travel: {
      staminaDrainPerMinute: 4,
      vehicleWearMultiplier: 1.3,
      encounterRiskModifier: 1.25,
      advisoryLevel: 'severe',
    },
  },
  'curfew:off': {},
  'curfew:tight': {
    behavior: {
      chaseMultiplier: 1.1,
      routineIntervalMultiplier: 1.05,
    },
    faction: {
      shopMarkupDelta: 0.08,
      reinforcementDelayMultiplier: 0.85,
      safehouseAccess: 'restricted',
    },
    travel: {
      encounterRiskModifier: 1.25,
      advisoryLevel: 'caution',
    },
  },
  'curfew:lockdown': {
    behavior: {
      chaseMultiplier: 1.35,
      routineIntervalMultiplier: 1.25,
      loadoutBias: 'heavy',
    },
    faction: {
      shopMarkupDelta: 0.2,
      reinforcementDelayMultiplier: 0.65,
      safehouseAccess: 'sealed',
    },
    travel: {
      encounterRiskModifier: 1.6,
      advisoryLevel: 'severe',
    },
  },
};

const clampMultiplier = (value: number, min: number, max: number): number => clamp(value, min, max);

export const createNeutralImpact = (): CombinedSystemImpact => ({
  behavior: {
    sightMultiplier: 1,
    chaseMultiplier: 1,
    routineIntervalMultiplier: 1,
    loadoutBias: 'balanced',
  },
  faction: {
    shopMarkupDelta: 0,
    reinforcementDelayMultiplier: 1,
    safehouseAccess: 'open',
  },
  travel: {
    staminaDrainPerMinute: 0,
    vehicleWearMultiplier: 1,
    encounterRiskModifier: 1,
    advisoryLevel: 'clear',
    visibilityMultiplier: 1,
  },
});

const applyBehaviorImpact = (target: CombinedSystemImpact['behavior'], impact: BehaviorImpact) => {
  if (!impact) return;

  if (typeof impact.sightMultiplier === 'number') {
    target.sightMultiplier = clampMultiplier(target.sightMultiplier * impact.sightMultiplier, 0.35, 1.8);
  }

  if (typeof impact.chaseMultiplier === 'number') {
    target.chaseMultiplier = clampMultiplier(target.chaseMultiplier * impact.chaseMultiplier, 0.5, 2);
  }

  if (typeof impact.routineIntervalMultiplier === 'number') {
    target.routineIntervalMultiplier = clampMultiplier(
      target.routineIntervalMultiplier * impact.routineIntervalMultiplier,
      0.7,
      2.2
    );
  }

  if (impact.loadoutBias) {
    const currentPriority = LOADOUT_PRIORITY[target.loadoutBias];
    const nextPriority = LOADOUT_PRIORITY[impact.loadoutBias];
    if (nextPriority > currentPriority) {
      target.loadoutBias = impact.loadoutBias;
    }
  }
};

const applyFactionImpact = (target: CombinedSystemImpact['faction'], impact: FactionImpact) => {
  if (!impact) return;

  if (typeof impact.shopMarkupDelta === 'number') {
    target.shopMarkupDelta = clamp(target.shopMarkupDelta + impact.shopMarkupDelta, -0.5, 1);
  }

  if (typeof impact.reinforcementDelayMultiplier === 'number') {
    target.reinforcementDelayMultiplier = clampMultiplier(
      target.reinforcementDelayMultiplier * impact.reinforcementDelayMultiplier,
      0.4,
      1.6
    );
  }

  if (impact.safehouseAccess) {
    const currentPriority = SAFEHOUSE_PRIORITY[target.safehouseAccess];
    const nextPriority = SAFEHOUSE_PRIORITY[impact.safehouseAccess];
    if (nextPriority > currentPriority) {
      target.safehouseAccess = impact.safehouseAccess;
    }
  }
};

const applyTravelImpact = (target: CombinedSystemImpact['travel'], impact: TravelImpact) => {
  if (!impact) return;

  if (typeof impact.staminaDrainPerMinute === 'number') {
    target.staminaDrainPerMinute = clamp(target.staminaDrainPerMinute + impact.staminaDrainPerMinute, 0, 12);
  }

  if (typeof impact.vehicleWearMultiplier === 'number') {
    target.vehicleWearMultiplier = clampMultiplier(
      target.vehicleWearMultiplier * impact.vehicleWearMultiplier,
      0.6,
      2
    );
  }

  if (typeof impact.encounterRiskModifier === 'number') {
    target.encounterRiskModifier = clampMultiplier(
      target.encounterRiskModifier * impact.encounterRiskModifier,
      0.5,
      3
    );
  }

  if (typeof impact.visibilityMultiplier === 'number') {
    target.visibilityMultiplier = clampMultiplier(
      target.visibilityMultiplier * impact.visibilityMultiplier,
      0.2,
      1
    );
  }

  if (impact.advisoryLevel) {
    const currentPriority = ADVISORY_PRIORITY[target.advisoryLevel];
    const nextPriority = ADVISORY_PRIORITY[impact.advisoryLevel];
    if (nextPriority > currentPriority) {
      target.advisoryLevel = impact.advisoryLevel;
    }
  }
};

export const combineSystemImpacts = (factors: EnvironmentalFactor[]): CombinedSystemImpact => {
  const combined = createNeutralImpact();

  factors.forEach((factor) => {
    const impact = ENVIRONMENT_MATRIX[factor];
    if (!impact) {
      return;
    }
    if (impact.behavior) {
      applyBehaviorImpact(combined.behavior, impact.behavior);
    }
    if (impact.faction) {
      applyFactionImpact(combined.faction, impact.faction);
    }
    if (impact.travel) {
      applyTravelImpact(combined.travel, impact.travel);
    }
  });

  return combined;
};

export interface EnvironmentMatrixContext {
  flags: EnvironmentFlags;
  zoneHazards?: string[];
  zoneId?: string | null;
}

const detectSmogSeverity = (hazards: string[] | undefined): SmogSeverity => {
  if (!hazards || hazards.length === 0) {
    return 'none';
  }

  const entries = hazards.map((entry) => entry.toLowerCase());
  if (entries.some((line) => line.includes('dense smog') || line.includes('toxic smog'))) {
    return 'heavy';
  }
  if (entries.some((line) => line.includes('smog') || line.includes('gas cloud'))) {
    return 'light';
  }
  return 'none';
};

const detectSurveillanceLevel = (
  flags: EnvironmentFlags,
  hazards: string[] | undefined
): SurveillanceDensity => {
  let level: SurveillanceDensity = 'low';

  if (flags.gangHeat !== 'low' || flags.curfewLevel >= 1) {
    level = 'elevated';
  }

  const entries = hazards?.map((entry) => entry.toLowerCase()) ?? [];
  if (
    flags.gangHeat === 'high' ||
    flags.curfewLevel >= 3 ||
    entries.some(
      (line) =>
        line.includes('camera') ||
        line.includes('drone') ||
        line.includes('surveillance') ||
        line.includes('riot squad')
    )
  ) {
    level = 'extreme';
  }

  return level;
};

const detectRadiationLevel = (hazards: string[] | undefined): RadiationLevel => {
  if (!hazards || hazards.length === 0) {
    return 'none';
  }

  const entries = hazards.map((entry) => entry.toLowerCase());
  if (entries.some((line) => line.includes('radiation pocket') || line.includes('reactor'))) {
    return 'localized';
  }
  if (entries.some((line) => line.includes('radiation') || line.includes('toxic sludge'))) {
    return 'pervasive';
  }
  return 'none';
};

const resolveCurfewStatus = (curfewLevel: number): CurfewStatus => {
  if (curfewLevel >= 3) {
    return 'lockdown';
  }
  if (curfewLevel >= 1) {
    return 'tight';
  }
  return 'off';
};

export const resolveEnvironmentalFactors = (context: EnvironmentMatrixContext): EnvironmentalFactor[] => {
  const smogSeverity = detectSmogSeverity(context.zoneHazards);

  let radiationLevel = detectRadiationLevel(context.zoneHazards);
  if (radiationLevel === 'none' && context.zoneId) {
    if (context.zoneId.includes('industrial') || context.zoneId.includes('wasteland')) {
      radiationLevel = 'localized';
    }
  }

  const surveillanceLevel = detectSurveillanceLevel(context.flags, context.zoneHazards);
  const curfewStatus = resolveCurfewStatus(context.flags.curfewLevel);
  const blackoutFactor: BlackoutFactor = `blackout:${context.flags.blackoutTier}` as BlackoutFactor;

  const factors: EnvironmentalFactor[] = [
    `smog:${smogSeverity}` as SmogFactor,
    blackoutFactor,
    `surveillance:${surveillanceLevel}` as SurveillanceFactor,
    `radiation:${radiationLevel}` as RadiationFactor,
    `curfew:${curfewStatus}` as CurfewFactor,
  ];

  return factors;
};
