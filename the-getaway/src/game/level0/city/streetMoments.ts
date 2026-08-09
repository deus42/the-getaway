import {
  LEVEL0_CURFEW_MINUTE,
  LEVEL0_STREET_LAST_TRAIN_MINUTE,
  LEVEL0_STREET_MOMENTS,
  LEVEL0_STREET_WIND_DOWN_FIRST_MINUTE,
  LEVEL0_STREET_WIND_DOWN_SECOND_MINUTE,
} from '../runtime/worldClock';
import type { StreetMomentId } from '../runtime/worldClock';
import type { Level0CityCopy } from './routeNames';

export type StreetStage =
  | 'evening'
  | 'wind-down-first'
  | 'wind-down-second'
  | 'curfew'
  | 'last-train';

export type ShutterState = 'open' | 'closing' | 'closed';
export type CrowdState = 'evening' | 'thinning' | 'sparse' | 'cleared';

export interface StreetMomentContent {
  id: StreetMomentId;
  boundaryMinute: number;
  cueId: string;
  announcement: Level0CityCopy;
  subtitle: Level0CityCopy;
}

// PA copy is restrained and single-purpose per moment. Ukrainian lines use the
// grammatically declined forms of the GDR-SET-007 route names.
export const LEVEL0_STREET_MOMENT_CONTENT: Record<StreetMomentId, StreetMomentContent> = {
  'street.wind_down_first': {
    id: 'street.wind_down_first',
    boundaryMinute: LEVEL0_STREET_WIND_DOWN_FIRST_MINUTE,
    cueId: 'cue.street.wind_down_first',
    announcement: {
      en: 'District notice: evening services are ending. Curfew begins at 22:00.',
      uk: 'Повідомлення по району: вечірні служби завершують роботу. Комендантська година починається о 22:00.',
    },
    subtitle: {
      en: 'PA announcement: evening wind-down',
      uk: 'Оголошення гучномовця: згортання вечора',
    },
  },
  'street.wind_down_second': {
    id: 'street.wind_down_second',
    boundaryMinute: LEVEL0_STREET_WIND_DOWN_SECOND_MINUTE,
    cueId: 'cue.street.wind_down_second',
    announcement: {
      en: 'Reminder: stalls along Market Ring are closing. Clear the lanes before curfew.',
      uk: 'Нагадування: ятки вздовж Ринкового кільця зачиняються. Звільніть проїзди до комендантської години.',
    },
    subtitle: {
      en: 'PA announcement: market closing',
      uk: 'Оголошення гучномовця: ринок зачиняється',
    },
  },
  'street.curfew_lockdown': {
    id: 'street.curfew_lockdown',
    boundaryMinute: LEVEL0_CURFEW_MINUTE,
    cueId: 'cue.street.curfew_lockdown',
    announcement: {
      en: 'Curfew is in effect. Hidzu Corporation monitoring is active. Remain indoors until 06:00.',
      uk: 'Комендантська година діє. Моніторинг корпорації Хідзу активний. Залишайтеся в приміщеннях до 06:00.',
    },
    subtitle: {
      en: 'PA announcement: curfew in effect',
      uk: 'Оголошення гучномовця: комендантська година діє',
    },
  },
  'street.last_train': {
    id: 'street.last_train',
    boundaryMinute: LEVEL0_STREET_LAST_TRAIN_MINUTE,
    cueId: 'cue.street.last_train',
    announcement: {
      en: 'Final service: the last train is leaving Transit Road. Transit access closes at midnight.',
      uk: 'Останній рейс: останній потяг відходить із Транзитної дороги. Транзитний доступ закривається опівночі.',
    },
    subtitle: {
      en: 'Last-train chime and final call',
      uk: 'Сигнал останнього потяга й фінальне оголошення',
    },
  },
};

export const streetStageAt = (minute: number): StreetStage => {
  if (minute >= LEVEL0_STREET_LAST_TRAIN_MINUTE) return 'last-train';
  if (minute >= LEVEL0_CURFEW_MINUTE) return 'curfew';
  if (minute >= LEVEL0_STREET_WIND_DOWN_SECOND_MINUTE) return 'wind-down-second';
  if (minute >= LEVEL0_STREET_WIND_DOWN_FIRST_MINUTE) return 'wind-down-first';
  return 'evening';
};

export const shutterStateAt = (minute: number): ShutterState => {
  if (minute >= LEVEL0_CURFEW_MINUTE) return 'closed';
  if (minute >= LEVEL0_STREET_WIND_DOWN_FIRST_MINUTE) return 'closing';
  return 'open';
};

export const crowdStateAt = (minute: number): CrowdState => {
  if (minute >= LEVEL0_CURFEW_MINUTE) return 'cleared';
  if (minute >= LEVEL0_STREET_WIND_DOWN_SECOND_MINUTE) return 'sparse';
  if (minute >= LEVEL0_STREET_WIND_DOWN_FIRST_MINUTE) return 'thinning';
  return 'evening';
};

export const lastTrainCadenceActiveAt = (minute: number): boolean =>
  minute >= LEVEL0_STREET_LAST_TRAIN_MINUTE;

// Distinct street-stage modulation of the phase atmosphere (OPEN-ART-004
// provisional trial values): each boundary produces one measurable lighting
// step without swapping geometry or the aligned phase plates.
export const STREET_STAGE_ATMOSPHERE_MULTIPLIER: Record<StreetStage, number> = {
  evening: 1,
  'wind-down-first': 1.18,
  'wind-down-second': 1.35,
  curfew: 1,
  'last-train': 1.12,
};

// Commerce doors whose shutters visibly close across the wind-down. Positions
// are the authored GET-204 door props; presentation-only overlays.
export const LEVEL0_SHUTTER_DOORS: ReadonlyArray<{
  id: string;
  position: { x: number; y: number };
}> = [
  { id: 'shutter.market-door', position: { x: 23.2, y: 20.03 } },
  { id: 'shutter.kiosk-door', position: { x: 10.5, y: 20.03 } },
  { id: 'shutter.threshold-door', position: { x: 36.0, y: 20.03 } },
];

export const shutterOverlayAlphaAt = (minute: number): number => {
  const state = shutterStateAt(minute);
  if (state === 'closed') return 0.92;
  if (state === 'closing') return 0.55;
  return 0;
};

export const getStreetMomentContent = (id: StreetMomentId): StreetMomentContent =>
  LEVEL0_STREET_MOMENT_CONTENT[id];

export const orderedStreetMomentContent = (): StreetMomentContent[] =>
  LEVEL0_STREET_MOMENTS.map((moment) => LEVEL0_STREET_MOMENT_CONTENT[moment.id]);
