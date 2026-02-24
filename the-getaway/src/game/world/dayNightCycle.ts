// Time of day options
export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';

// Day night cycle configuration
export interface DayNightConfig {
  cycleDuration: number; // Full cycle duration in seconds
  timeMultiplier: number; // How much faster than real time (1 = real time)
  dayStartTime: number; // 0-1 representing cycle percentage (0.0 = cycle start)
  dayEndTime: number; // 0-1 representing cycle percentage
  morningStartTime: number; // 0-1 representing cycle percentage
  eveningStartTime: number; // 0-1 representing cycle percentage
}

// Default day night cycle (5 minutes total, 2.5 min day, 2.5 min night)
export const DEFAULT_DAY_NIGHT_CONFIG: DayNightConfig = {
  cycleDuration: 300, // 5 minutes in seconds
  timeMultiplier: 1,
  morningStartTime: 0, // Morning starts at 0% of cycle
  dayStartTime: 0.1, // Day starts at 10% of cycle
  eveningStartTime: 0.4, // Evening starts at 40% of cycle
  dayEndTime: 0.5, // Night starts at 50% of cycle
};

// Get the current time of day
export const getCurrentTimeOfDay = (
  currentTime: number, 
  config: DayNightConfig = DEFAULT_DAY_NIGHT_CONFIG
): TimeOfDay => {
  // Calculate cycle progress (0 to 1)
  const cycleProgress = (currentTime % config.cycleDuration) / config.cycleDuration;
  
  if (cycleProgress >= config.morningStartTime && cycleProgress < config.dayStartTime) {
    return 'morning';
  } else if (cycleProgress >= config.dayStartTime && cycleProgress < config.eveningStartTime) {
    return 'day';
  } else if (cycleProgress >= config.eveningStartTime && cycleProgress < config.dayEndTime) {
    return 'evening';
  } else {
    return 'night';
  }
};

// Get the current light level (0-1, 0 being darkest)
export const getCurrentLightLevel = (
  currentTime: number, 
  config: DayNightConfig = DEFAULT_DAY_NIGHT_CONFIG
): number => {
  // Calculate cycle progress (0 to 1)
  const cycleProgress = (currentTime % config.cycleDuration) / config.cycleDuration;
  
  // Morning: Light increases from 0.4 to 1.0
  if (cycleProgress >= config.morningStartTime && cycleProgress < config.dayStartTime) {
    const morningProgress = (cycleProgress - config.morningStartTime) / 
      (config.dayStartTime - config.morningStartTime);
    return 0.4 + (morningProgress * 0.6);
  } 
  // Day: Full light (1.0)
  else if (cycleProgress >= config.dayStartTime && cycleProgress < config.eveningStartTime) {
    return 1.0;
  } 
  // Evening: Light decreases from 1.0 to 0.4
  else if (cycleProgress >= config.eveningStartTime && cycleProgress < config.dayEndTime) {
    const eveningProgress = (cycleProgress - config.eveningStartTime) / 
      (config.dayEndTime - config.eveningStartTime);
    return 1.0 - (eveningProgress * 0.6);
  } 
  // Night: Dim light (0.2)
  else {
    return 0.2;
  }
};

// Get overlay color for rendering
export const getDayNightOverlayColor = (
  currentTime: number,
  config: DayNightConfig = DEFAULT_DAY_NIGHT_CONFIG
): string => {
  const timeOfDay = getCurrentTimeOfDay(currentTime, config);
  const lightLevel = getCurrentLightLevel(currentTime, config);
  
  switch (timeOfDay) {
    case 'morning':
      // Cool dawn tint to soften the morning light
      return `rgba(180, 208, 255, ${(1 - lightLevel) * 0.22})`;
    case 'day':
      // No tint during full day
      return 'rgba(255, 255, 255, 0)';
    case 'evening':
      // Muted violet wash during dusk
      return `rgba(214, 179, 255, ${(1 - lightLevel) * 0.28})`;
    case 'night':
      // Deep blue tint during night
      return `rgba(18, 30, 64, ${0.72 * (1 - lightLevel)})`;
    default:
      return 'rgba(0, 0, 0, 0)';
  }
};

// Get RGBA for light level (mainly for Phaser tinting)
export const getLightLevelRGBA = (
  currentTime: number,
  config: DayNightConfig = DEFAULT_DAY_NIGHT_CONFIG
): number => {
  const lightLevel = getCurrentLightLevel(currentTime, config);
  
  // Convert lightLevel (0-1) to RGBA format
  const red = Math.floor(lightLevel * 255);
  const green = Math.floor(lightLevel * 255);
  const blue = Math.floor(lightLevel * 255);
  
  // Combine into single RGBA value (for Phaser tinting)
  return (red << 16) + (green << 8) + blue;
};

interface PhaseDefinition {
  phase: TimeOfDay;
  start: number;
}

export interface PhaseTimingInfo {
  currentPhase: TimeOfDay;
  nextPhase: TimeOfDay;
  secondsUntilNextPhase: number;
  secondsIntoCurrentPhase: number;
  currentPhaseDurationSeconds: number;
  phaseProgress: number;
}

export interface ClockTime24 {
  totalMinutes: number;
  hour: number;
  minute: number;
}

const buildOrderedPhases = (config: DayNightConfig): PhaseDefinition[] => {
  const phases: PhaseDefinition[] = [
    { phase: 'morning', start: config.morningStartTime },
    { phase: 'day', start: config.dayStartTime },
    { phase: 'evening', start: config.eveningStartTime },
    { phase: 'night', start: config.dayEndTime },
  ];

  return phases.sort((a, b) => a.start - b.start);
};

export const getClockTime24 = (
  currentTime: number,
  config: DayNightConfig = DEFAULT_DAY_NIGHT_CONFIG
): ClockTime24 => {
  const cycleDuration = config.cycleDuration;
  if (!Number.isFinite(currentTime) || cycleDuration <= 0) {
    return {
      totalMinutes: 0,
      hour: 0,
      minute: 0,
    };
  }

  const cycleSeconds = ((currentTime % cycleDuration) + cycleDuration) % cycleDuration;
  const cycleProgress = cycleSeconds / cycleDuration;
  const totalMinutes = Math.floor(cycleProgress * 24 * 60) % (24 * 60);
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;

  return {
    totalMinutes,
    hour,
    minute,
  };
};

export const getPhaseTimingInfo = (
  currentTime: number,
  config: DayNightConfig = DEFAULT_DAY_NIGHT_CONFIG
): PhaseTimingInfo => {
  const cycleDuration = config.cycleDuration;
  if (cycleDuration <= 0) {
    const phase = getCurrentTimeOfDay(currentTime, config);
    return {
      currentPhase: phase,
      nextPhase: phase,
      secondsUntilNextPhase: 0,
      secondsIntoCurrentPhase: 0,
      currentPhaseDurationSeconds: 0,
      phaseProgress: 1,
    };
  }

  const orderedPhases = buildOrderedPhases(config);
  const currentPhase = getCurrentTimeOfDay(currentTime, config);
  const currentPhaseIndex = orderedPhases.findIndex(
    (entry) => entry.phase === currentPhase
  );

  if (currentPhaseIndex === -1) {
    const fallbackPhase = orderedPhases[0];
    return {
      currentPhase,
      nextPhase: fallbackPhase.phase,
      secondsUntilNextPhase: 0,
      secondsIntoCurrentPhase: 0,
      currentPhaseDurationSeconds: 0,
      phaseProgress: 1,
    };
  }

  const nextPhaseIndex = (currentPhaseIndex + 1) % orderedPhases.length;
  const currentStart = orderedPhases[currentPhaseIndex].start;
  let nextStart = orderedPhases[nextPhaseIndex].start;

  const cycleSeconds = ((currentTime % cycleDuration) + cycleDuration) % cycleDuration;
  let cycleProgress = cycleSeconds / cycleDuration;

  if (nextStart <= currentStart) {
    nextStart += 1;
  }

  if (cycleProgress < currentStart) {
    cycleProgress += 1;
  }

  const phaseDurationFraction = nextStart - currentStart;
  const phaseDurationSeconds = phaseDurationFraction * cycleDuration;
  const secondsIntoCurrentPhase = Math.max(
    0,
    (cycleProgress - currentStart) * cycleDuration
  );
  const rawSecondsUntilNextPhase = phaseDurationSeconds - secondsIntoCurrentPhase;
  const secondsUntilNextPhase = Math.max(0, rawSecondsUntilNextPhase);
  const phaseProgress = phaseDurationSeconds > 0
    ? Math.min(1, secondsIntoCurrentPhase / phaseDurationSeconds)
    : 1;

  return {
    currentPhase,
    nextPhase: orderedPhases[nextPhaseIndex].phase,
    secondsUntilNextPhase,
    secondsIntoCurrentPhase,
    currentPhaseDurationSeconds: phaseDurationSeconds,
    phaseProgress,
  };
};

export const getSecondsUntilCycleReset = (
  currentTime: number,
  config: DayNightConfig = DEFAULT_DAY_NIGHT_CONFIG
): number => {
  const cycleDuration = config.cycleDuration;
  if (cycleDuration <= 0) {
    return 0;
  }

  const cycleSeconds = ((currentTime % cycleDuration) + cycleDuration) % cycleDuration;
  const remaining = cycleDuration - cycleSeconds;
  return remaining === 0 ? cycleDuration : remaining;
};

// Check if it's curfew time (for game mechanics)
export const isCurfewTime = (
  currentTime: number,
  config: DayNightConfig = DEFAULT_DAY_NIGHT_CONFIG
): boolean => {
  const { hour } = getClockTime24(currentTime, config);
  return hour >= 22 || hour < 6;
};

// Update game time based on real elapsed time
export const updateGameTime = (
  currentTime: number,
  elapsedMs: number,
  config: DayNightConfig = DEFAULT_DAY_NIGHT_CONFIG
): number => {
  // Convert milliseconds to seconds and apply time multiplier
  const elapsedGameSeconds = (elapsedMs / 1000) * config.timeMultiplier;
  return currentTime + elapsedGameSeconds;
}; 
