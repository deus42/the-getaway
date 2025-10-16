const cyrb128 = (str: string): [number, number, number, number] => {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;

  for (let index = 0; index < str.length; index += 1) {
    const code = str.charCodeAt(index);
    h1 = Math.imul(h1 ^ code, 597399067);
    h2 = Math.imul(h2 ^ code, 2869860233);
    h3 = Math.imul(h3 ^ code, 951274213);
    h4 = Math.imul(h4 ^ code, 2716044179);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h2 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h3 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h4 ^ (h4 >>> 19), 2716044179);

  return [h1 ^ h2 ^ h3 ^ h4, h2 ^ h1, h3 ^ h1, h4 ^ h1];
};

const mulberry32 = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export interface SeededRng {
  next: () => number;
  nextInt: (max: number) => number;
  pick: <T>(items: T[]) => T;
}

export const createSeededRng = (seed: string | number): SeededRng => {
  const normalizedSeed = typeof seed === 'number' ? seed.toString(36) : seed;
  const hashes = cyrb128(normalizedSeed);
  const random = mulberry32(hashes[0]);

  const next = () => random();

  const nextInt = (max: number): number => {
    if (max <= 0) {
      return 0;
    }
    return Math.floor(next() * max);
  };

  const pick = <T>(items: T[]): T => {
    if (items.length === 0) {
      throw new Error('Cannot pick from an empty list.');
    }
    return items[nextInt(items.length)];
  };

  return { next, nextInt, pick };
};
