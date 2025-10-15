import { Locale } from '../locales';
import { storyletStringsEn } from './en';
import { storyletStringsUk } from './uk';
import {
  StoryletLocaleStrings,
  StoryletOutcomeLocaleVariant,
  StoryletPlayLocale,
  StoryletOutcomeLocale,
} from './types';

const STRINGS: Record<Locale, StoryletLocaleStrings> = {
  en: storyletStringsEn,
  uk: storyletStringsUk,
};

export const getStoryletLocaleStrings = (locale: Locale): StoryletLocaleStrings =>
  STRINGS[locale] ?? storyletStringsEn;

export const applyStoryletTemplate = (
  template: string,
  substitutions: Record<string, string>
): string => {
  return template.replace(/\{([\w\d_]+)\}/g, (_, key) => substitutions[key] ?? `{${key}}`);
};

export const resolveOutcomeLocaleVariant = (
  outcomeLocale: StoryletOutcomeLocale,
  variantKey?: string
): StoryletOutcomeLocaleVariant => {
  if (!variantKey || !outcomeLocale.variants) {
    return outcomeLocale.base;
  }

  return outcomeLocale.variants[variantKey] ?? outcomeLocale.base;
};

export type { StoryletLocaleStrings, StoryletPlayLocale, StoryletOutcomeLocaleVariant } from './types';
