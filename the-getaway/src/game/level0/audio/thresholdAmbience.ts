import { getLevel0AudioContext, primeLevel0AudioCues } from '../../feedback/audioCues';
import type { Level0CityCopy } from '../city/routeNames';
import type { StreetStage } from '../city/streetMoments';

export type AmbienceEmitterId =
  | 'ambience.restaurant'
  | 'ambience.workshop'
  | 'ambience.apartment';

export interface AmbienceEmitterDefinition {
  id: AmbienceEmitterId;
  anchorId: string;
  subtitle: Level0CityCopy;
  // Clock-following loudness target per street stage (OPEN-AUD-001 provisional
  // trial data; replaceable without code changes).
  stageLevels: Record<StreetStage, number>;
}

export const LEVEL0_AMBIENCE_EMITTERS: Record<AmbienceEmitterId, AmbienceEmitterDefinition> = {
  'ambience.restaurant': {
    id: 'ambience.restaurant',
    anchorId: 'audio.ambience.restaurant',
    subtitle: {
      en: 'Muffled restaurant chatter and dishes',
      uk: 'Приглушений гомін ресторану та посуд',
    },
    stageLevels: {
      evening: 1,
      'wind-down-first': 0.8,
      'wind-down-second': 0.5,
      curfew: 0.15,
      'last-train': 0.1,
    },
  },
  'ambience.workshop': {
    id: 'ambience.workshop',
    anchorId: 'audio.ambience.workshop',
    subtitle: {
      en: 'Workshop hum and slow machinery',
      uk: 'Гул майстерні й повільні механізми',
    },
    stageLevels: {
      evening: 0.9,
      'wind-down-first': 0.9,
      'wind-down-second': 0.6,
      curfew: 0.2,
      'last-train': 0.15,
    },
  },
  'ambience.apartment': {
    id: 'ambience.apartment',
    anchorId: 'audio.ambience.apartment',
    subtitle: {
      en: 'Television and voices behind an apartment wall',
      uk: 'Телевізор і голоси за стіною квартири',
    },
    stageLevels: {
      evening: 0.7,
      'wind-down-first': 0.7,
      'wind-down-second': 0.75,
      curfew: 0.8,
      'last-train': 0.8,
    },
  },
};

// Quadratic falloff from the threshold: full at the door, silent past 1.25x the
// authored radius, so the leak reads spatial instead of as a global bed.
export const computeAmbienceGain = (
  definition: AmbienceEmitterDefinition,
  options: { distance: number; radius: number; stage: StreetStage }
): number => {
  if (!Number.isFinite(options.distance) || options.radius <= 0) return 0;
  const reach = options.radius * 1.25;
  const proximity = Math.max(0, 1 - options.distance / reach);
  return definition.stageLevels[options.stage] * proximity * proximity;
};

export const computeAmbiencePan = (playerX: number, emitterX: number): number =>
  Math.max(-1, Math.min(1, (emitterX - playerX) / 8));

interface EmitterNodes {
  input: GainNode;
  gain: GainNode;
  pan: StereoPannerNode;
  sources: Array<AudioScheduledSourceNode>;
}

const MASTER_AMBIENCE_VOLUME = 0.05;
const PAUSED_DUCK = 0.3;

const createNoiseBuffer = (context: AudioContext, seconds: number): AudioBuffer => {
  const length = Math.max(1, Math.floor(context.sampleRate * seconds));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i += 1) {
    // Brown-ish noise: integrate white noise for a soft interior texture.
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  return buffer;
};

const buildEmitterVoice = (
  context: AudioContext,
  id: AmbienceEmitterId,
  destination: AudioNode
): EmitterNodes => {
  const input = context.createGain();
  input.gain.value = 1;
  const gain = context.createGain();
  gain.gain.value = 0;
  const pan = context.createStereoPanner();
  input.connect(gain);
  gain.connect(pan);
  pan.connect(destination);

  const sources: Array<AudioScheduledSourceNode> = [];

  const addNoise = (filterFrequency: number, level: number) => {
    const source = context.createBufferSource();
    source.buffer = createNoiseBuffer(context, 2.4);
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFrequency;
    const noiseGain = context.createGain();
    noiseGain.gain.value = level;
    source.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(input);
    source.start();
    sources.push(source);
  };

  const addTone = (
    frequency: number,
    level: number,
    type: OscillatorType,
    wobbleHz?: number
  ) => {
    const oscillator = context.createOscillator();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    const toneGain = context.createGain();
    toneGain.gain.value = level;
    oscillator.connect(toneGain);
    toneGain.connect(input);
    if (wobbleHz) {
      const lfo = context.createOscillator();
      lfo.frequency.value = wobbleHz;
      const lfoGain = context.createGain();
      lfoGain.gain.value = level * 0.6;
      lfo.connect(lfoGain);
      lfoGain.connect(toneGain.gain);
      lfo.start();
      sources.push(lfo);
    }
    oscillator.start();
    sources.push(oscillator);
  };

  if (id === 'ambience.restaurant') {
    addNoise(900, 0.55);
    addTone(196, 0.1, 'sine', 0.35);
    addTone(247, 0.07, 'sine', 0.22);
  } else if (id === 'ambience.workshop') {
    addNoise(400, 0.35);
    addTone(55, 0.28, 'sawtooth', 0.9);
    addTone(110, 0.1, 'triangle', 1.7);
  } else {
    addNoise(600, 0.4);
    addTone(311, 0.06, 'sine', 0.18);
    addTone(415, 0.04, 'sine', 0.11);
  }

  return { input, gain, pan, sources };
};

export interface AmbienceFrameInput {
  playerX: number;
  playerY: number;
  stage: StreetStage;
  paused: boolean;
  emitters: Array<{ id: AmbienceEmitterId; x: number; y: number; radius: number }>;
}

export class Level0ThresholdAmbience {
  private context: AudioContext | null = null;

  private master: GainNode | null = null;

  private voices = new Map<AmbienceEmitterId, EmitterNodes>();

  private disposed = false;

  updateFrame(input: AmbienceFrameInput): void {
    if (this.disposed) return;
    const context = this.ensureContext();
    if (!context || context.state !== 'running' || !this.master) return;

    for (const emitter of input.emitters) {
      const definition = LEVEL0_AMBIENCE_EMITTERS[emitter.id];
      if (!definition) continue;
      let voice = this.voices.get(emitter.id);
      if (!voice) {
        try {
          voice = buildEmitterVoice(context, emitter.id, this.master);
        } catch {
          continue;
        }
        this.voices.set(emitter.id, voice);
      }
      const distance = Math.hypot(input.playerX - emitter.x, input.playerY - emitter.y);
      const gain =
        computeAmbienceGain(definition, {
          distance,
          radius: emitter.radius,
          stage: input.stage,
        }) * (input.paused ? PAUSED_DUCK : 1);
      const now = context.currentTime;
      voice.gain.gain.setTargetAtTime(gain, now, 0.12);
      voice.pan.pan.setTargetAtTime(computeAmbiencePan(input.playerX, emitter.x), now, 0.2);
    }
  }

  dispose(): void {
    this.disposed = true;
    for (const voice of this.voices.values()) {
      for (const source of voice.sources) {
        try {
          source.stop();
        } catch {
          // Sources that never started or already stopped are fine to ignore.
        }
      }
      try {
        voice.pan.disconnect();
        voice.gain.disconnect();
        voice.input.disconnect();
      } catch {
        // Disconnecting an already-released node graph must never throw upward.
      }
    }
    this.voices.clear();
    if (this.master) {
      try {
        this.master.disconnect();
      } catch {
        // See above: teardown is best-effort by design.
      }
      this.master = null;
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.context) return this.context;
    primeLevel0AudioCues();
    const context = getLevel0AudioContext();
    if (!context) return null;
    this.context = context;
    const master = context.createGain();
    master.gain.value = MASTER_AMBIENCE_VOLUME;
    master.connect(context.destination);
    this.master = master;
    return context;
  }
}
