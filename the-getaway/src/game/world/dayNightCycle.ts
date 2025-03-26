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
      // Soft orange/yellow tint during morning
      return `rgba(255, 204, 102, ${1 - lightLevel})`;
    case 'day':
      // No tint during full day
      return 'rgba(255, 255, 255, 0)';
    case 'evening':
      // Soft orange/red tint during evening
      return `rgba(255, 153, 102, ${1 - lightLevel})`;
    case 'night':
      // Deep blue tint during night
      return `rgba(25, 25, 112, ${0.7 * (1 - lightLevel)})`;
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

// Check if it's curfew time (for game mechanics)
export const isCurfewTime = (
  currentTime: number,
  config: DayNightConfig = DEFAULT_DAY_NIGHT_CONFIG
): boolean => {
  const timeOfDay = getCurrentTimeOfDay(currentTime, config);
  return timeOfDay === 'night';
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