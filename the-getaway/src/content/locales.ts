import { NarrativeLocaleBundle } from '../game/narrative/structureTypes';
import { narrativeLocaleEn } from './locales/en';
import { narrativeLocaleUk } from './locales/uk';

export type Locale = 'en' | 'uk';

export const SUPPORTED_LOCALES: Locale[] = ['en', 'uk'];

export const DEFAULT_LOCALE: Locale = 'en';

export const NARRATIVE_LOCALE_BUNDLES: Record<Locale, NarrativeLocaleBundle> = {
  en: narrativeLocaleEn,
  uk: narrativeLocaleUk,
};

export const getNarrativeLocaleBundle = (locale: Locale): NarrativeLocaleBundle =>
  NARRATIVE_LOCALE_BUNDLES[locale] ?? narrativeLocaleEn;
