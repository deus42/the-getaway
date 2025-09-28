import { Locale } from '../locales';

interface MenuStrings {
  tag: string;
  title: string;
  tagline: string;
  start: string;
  resume: string;
  settingsHeading: string;
  languageLabel: string;
  alphaLabel: (year: number) => string;
  languageNames: Record<Locale, string>;
}

interface QuestLogStrings {
  panelLabel: string;
  title: string;
  active: string;
  completed: string;
  empty: string;
}

interface UIStrings {
  menu: MenuStrings;
  questLog: QuestLogStrings;
}

const STRINGS: Record<Locale, UIStrings> = {
  en: {
    menu: {
      tag: 'The Getaway',
      title: 'Escape the Regime',
      tagline: 'Lead your cell through the fortified Slums. Stealth or strike? Every move echoes through the city.',
      start: 'Start New Game',
      resume: 'Resume Game',
      settingsHeading: 'Settings',
      languageLabel: 'Language',
      alphaLabel: (year: number) => `Alpha Build ${year}`,
      languageNames: {
        en: 'English',
        uk: 'Українська',
      },
    },
    questLog: {
      panelLabel: 'Quests',
      title: 'Quest Log',
      active: 'Active Quests',
      completed: 'Completed Quests',
      empty: 'No quests tracked. Connect with contacts to unlock new objectives.',
    },
  },
  uk: {
    menu: {
      tag: 'The Getaway',
      title: 'Втеча від режиму',
      tagline: 'Проведіть свій осередок укріпленими Нетрищами. Ховатися чи бити? Кожен крок відлунює по місту.',
      start: 'Почати нову гру',
      resume: 'Продовжити гру',
      settingsHeading: 'Налаштування',
      languageLabel: 'Мова',
      alphaLabel: (year: number) => `Альфа-версія ${year}`,
      languageNames: {
        en: 'Англійська',
        uk: 'Українська',
      },
    },
    questLog: {
      panelLabel: 'Завдання',
      title: 'Журнал завдань',
      active: 'Активні завдання',
      completed: 'Завершені завдання',
      empty: 'Жодного завдання не відстежується. Зв’яжіться з контактами, щоб відкрити нові цілі.',
    },
  },
};

export const getUIStrings = (locale: Locale): UIStrings => STRINGS[locale] ?? STRINGS.en;
