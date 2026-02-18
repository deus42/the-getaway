import type { MaterialPalette } from '../contracts';

export const MATERIAL_PALETTES: Record<string, MaterialPalette> = {
  asphaltNight: {
    id: 'asphaltNight',
    base: 0x1a2334,
    highlight: 0x2c3f5f,
    shadow: 0x0b111b,
    accent: 0x3b82f6,
    glow: 0x38bdf8,
  },
  ferroConcrete: {
    id: 'ferroConcrete',
    base: 0x2b3447,
    highlight: 0x425371,
    shadow: 0x12192a,
    accent: 0x8b9db8,
    glow: 0x67e8f9,
  },
  rustedSteel: {
    id: 'rustedSteel',
    base: 0x3a2f2b,
    highlight: 0x5b4a43,
    shadow: 0x1a1411,
    accent: 0xf59e0b,
    glow: 0xfb923c,
  },
  hazardTech: {
    id: 'hazardTech',
    base: 0x2d1f3d,
    highlight: 0x57307a,
    shadow: 0x130a1c,
    accent: 0xf472b6,
    glow: 0xc084fc,
  },
};
