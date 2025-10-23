export interface NpcRng {
  next(): number;
  nextInRange(min: number, max: number): number;
  fork(tag: string): NpcRng;
}

const UINT32_MAX = 0xffffffff;

const mulberry32 = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / (UINT32_MAX + 1);
};

export const hashString = (input: string): number => {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i += 1) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (Math.imul(h ^ (h >>> 16), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0;
};

export const createNpcRng = (seed: string, entropy = 0): NpcRng => {
  const normalisedEntropy = Math.floor(entropy) >>> 0;
  const hashedSeed = hashString(seed) ^ normalisedEntropy;
  const generator = mulberry32(hashedSeed || 1);

  const next = () => generator();

  return {
    next,
    nextInRange: (min: number, max: number) => {
      if (max <= min) {
        return min;
      }
      const sample = next();
      return min + sample * (max - min);
    },
    fork: (tag: string) => {
      const childEntropy = Math.floor(next() * UINT32_MAX);
      return createNpcRng(`${seed}:${tag}`, childEntropy);
    },
  };
};
