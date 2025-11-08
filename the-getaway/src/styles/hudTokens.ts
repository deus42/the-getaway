const REM_BASE = 16;

const toRem = (px: number): string => `${(px / REM_BASE).toString()}rem`;
const toPx = (px: number): string => `${px}px`;

export const HUD_GRID_UNIT = 8;

export const HUD_SPACING = {
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  gutter: 48,
  jumbo: 64,
} as const;

export const HUD_RADII = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 16,
  pill: 999,
} as const;

export const HUD_ICON = {
  wrapper: 24,
  liveArea: 20,
  stroke: 2,
  hitTarget: 48,
} as const;

export const HUD_TYPOGRAPHY = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
} as const;

export const HUD_LINE_HEIGHT = {
  xs: 20,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
} as const;

export const hudSpace = (value: number): string => toPx(value);
export const hudRem = (value: number): string => toRem(value);

export const hudFontSize = (token: keyof typeof HUD_TYPOGRAPHY): string =>
  toRem(HUD_TYPOGRAPHY[token]);

export const hudLineHeight = (token: keyof typeof HUD_LINE_HEIGHT): string =>
  toRem(HUD_LINE_HEIGHT[token]);

export const hudRadius = (token: keyof typeof HUD_RADII): string =>
  toPx(HUD_RADII[token]);

