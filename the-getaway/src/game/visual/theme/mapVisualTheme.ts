import type { MapArea } from '../../interfaces/types';
import type { MapVisualProfile, VisualQualityPreset, VisualTheme } from '../contracts';
import { createNoirVectorTheme } from './noirVectorTheme';
import { createPainterlyNoirTheme } from './painterlyNoirTheme';

type VisualMapArea = Pick<MapArea, 'level' | 'zoneId' | 'isInterior'>;

export const isLevel0Exterior = (mapArea?: VisualMapArea | null): boolean =>
  mapArea?.level === 0 &&
  mapArea.zoneId === 'downtown_checkpoint' &&
  mapArea.isInterior !== true;

export const resolveMapVisualProfile = (mapArea?: VisualMapArea | null): MapVisualProfile =>
  (isLevel0Exterior(mapArea)
    ? createPainterlyNoirTheme('balanced')
    : createNoirVectorTheme('balanced')
  ).mapProfile;

export const resolveVisualThemeForMap = (
  mapArea: VisualMapArea | null | undefined,
  preset: VisualQualityPreset
): VisualTheme =>
  isLevel0Exterior(mapArea)
    ? createPainterlyNoirTheme(preset)
    : createNoirVectorTheme(preset);
