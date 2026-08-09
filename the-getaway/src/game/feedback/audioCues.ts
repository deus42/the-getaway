export type Level0FeedbackCue =
  | 'pickup'
  | 'objective'
  | 'invalid'
  | 'curfew'
  | 'paranoia'
  | 'recovery'
  | 'mission'
  | 'street-pa'
  | 'last-train'
  | 'grounding';

type AudioContextConstructor = typeof AudioContext;

const CUE_THROTTLE_MS = 160;

const cueProfiles: Record<Level0FeedbackCue, { frequency: number; durationMs: number; volume: number }> = {
  pickup: { frequency: 660, durationMs: 75, volume: 0.035 },
  objective: { frequency: 880, durationMs: 95, volume: 0.04 },
  invalid: { frequency: 180, durationMs: 110, volume: 0.045 },
  curfew: { frequency: 260, durationMs: 140, volume: 0.04 },
  paranoia: { frequency: 120, durationMs: 180, volume: 0.05 },
  recovery: { frequency: 520, durationMs: 130, volume: 0.035 },
  mission: { frequency: 740, durationMs: 170, volume: 0.045 },
  // GET-214 street cues are provisional trial tones under OPEN-AUD-001.
  'street-pa': { frequency: 620, durationMs: 190, volume: 0.04 },
  'last-train': { frequency: 840, durationMs: 240, volume: 0.045 },
  grounding: { frequency: 330, durationMs: 210, volume: 0.035 },
};

let audioContext: AudioContext | null = null;
let unlockListenersInstalled = false;
let audioUnlocked = false;
const lastCueAt: Partial<Record<Level0FeedbackCue, number>> = {};

const getAudioContextConstructor = (): AudioContextConstructor | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.AudioContext ?? null;
};

const getAudioContext = (): AudioContext | null => {
  const AudioContextImpl = getAudioContextConstructor();
  if (!AudioContextImpl) {
    return null;
  }

  audioContext ??= new AudioContextImpl();
  return audioContext;
};

// Shared context for continuous Level 0 sources (threshold ambience), so cues
// and ambience ride one AudioContext and one unlock gesture.
export const getLevel0AudioContext = (): AudioContext | null => getAudioContext();

const unlockAudio = () => {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  void context.resume().then(() => {
    audioUnlocked = true;
  }).catch(() => {
    audioUnlocked = false;
  });
};

export const primeLevel0AudioCues = (): void => {
  if (typeof window === 'undefined' || unlockListenersInstalled) {
    return;
  }

  unlockListenersInstalled = true;
  const listenerOptions: AddEventListenerOptions = { once: true, passive: true };
  window.addEventListener('pointerdown', unlockAudio, listenerOptions);
  window.addEventListener('keydown', unlockAudio, listenerOptions);
};

export const playLevel0FeedbackCue = (cue: Level0FeedbackCue): void => {
  if (typeof window === 'undefined') {
    return;
  }

  primeLevel0AudioCues();

  const now = Date.now();
  if (now - (lastCueAt[cue] ?? 0) < CUE_THROTTLE_MS) {
    return;
  }
  lastCueAt[cue] = now;

  const context = getAudioContext();
  if (!context) {
    return;
  }

  if (context.state === 'suspended') {
    unlockAudio();
    if (!audioUnlocked) {
      return;
    }
  }

  const profile = cueProfiles[cue];
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const startAt = context.currentTime;
  const endAt = startAt + profile.durationMs / 1000;

  oscillator.type = cue === 'paranoia' || cue === 'invalid' ? 'sawtooth' : 'sine';
  oscillator.frequency.setValueAtTime(profile.frequency, startAt);
  oscillator.frequency.exponentialRampToValueAtTime(
    Math.max(80, profile.frequency * 0.72),
    endAt
  );

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(profile.volume, startAt + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(endAt);
};
