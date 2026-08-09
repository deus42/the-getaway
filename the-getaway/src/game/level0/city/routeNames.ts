export type Level0LoopId =
  | 'loop.public-contact'
  | 'loop.logistics-service'
  | 'loop.outer-escape';

export interface Level0CityCopy {
  en: string;
  uk: string;
}

// GDR-SET-007: stable loop IDs keep their internal names; these are the
// player-facing display names used by signage, civilians, and George.
export const LEVEL0_LOOP_DISPLAY_NAMES: Record<Level0LoopId, Level0CityCopy> = {
  'loop.public-contact': { en: 'Transit Road', uk: 'Транзитна дорога' },
  'loop.logistics-service': { en: 'Market Ring', uk: 'Ринкове кільце' },
  'loop.outer-escape': { en: 'Outer Space', uk: 'Відкритий космос' },
};

export const localizeLevel0CityCopy = (copy: Level0CityCopy, ukrainian: boolean): string =>
  ukrainian ? copy.uk : copy.en;

export const getLevel0LoopDisplayName = (
  loopId: Level0LoopId,
  ukrainian: boolean
): string => localizeLevel0CityCopy(LEVEL0_LOOP_DISPLAY_NAMES[loopId], ukrainian);

// In-world signage placement: one street-name plate per loop, on the loop's
// walk line. Positions are replaceable OPEN-LAYOUT-003 trial content.
export const LEVEL0_LOOP_SIGNAGE: ReadonlyArray<{
  loopId: Level0LoopId;
  position: { x: number; y: number };
}> = [
  { loopId: 'loop.public-contact', position: { x: 22.25, y: 22.35 } },
  { loopId: 'loop.logistics-service', position: { x: 36.5, y: 34.2 } },
  { loopId: 'loop.outer-escape', position: { x: 8, y: 31.2 } },
];
