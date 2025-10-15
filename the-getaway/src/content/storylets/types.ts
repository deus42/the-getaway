export interface StoryletOutcomeLocaleVariant {
  narrative: string;
  epilogue?: string;
  logLine?: string;
}

export interface StoryletOutcomeLocale {
  base: StoryletOutcomeLocaleVariant;
  variants?: Record<string, StoryletOutcomeLocaleVariant>;
}

export interface StoryletPlayLocale {
  title: string;
  synopsis: string;
  roles: Record<string, string>;
  outcomes: Record<string, StoryletOutcomeLocale>;
}

export interface StoryletLocaleStrings {
  plays: Record<string, StoryletPlayLocale>;
  roles: Record<string, string>;
  logs: Record<string, string>;
}
