import type {
  AttributeKey,
  Level0CreationErrorId,
  Level0ResourceEvent,
  SkillKey,
} from '../../game/level0/rpg/types';

export interface Level0LocalizedCopy {
  en: string;
  uk: string;
}

export interface Level0CapabilityCopy {
  label: Level0LocalizedCopy;
  description: Level0LocalizedCopy;
}

export const localizeLevel0Copy = (
  copy: Level0LocalizedCopy,
  ukrainian: boolean
): string => ukrainian ? copy.uk : copy.en;

export const LEVEL0_ATTRIBUTE_COPY: Record<AttributeKey, Level0CapabilityCopy> = {
  physical: {
    label: { en: 'Physical', uk: 'Фізична' },
    description: {
      en: 'Endure injury, force a path, and survive a physical escape.',
      uk: 'Витримуйте травми, долайте перешкоди й виривайтеся фізично.',
    },
  },
  mental: {
    label: { en: 'Mental', uk: 'Ментальна' },
    description: {
      en: 'Hold focus, recognize patterns, and withstand institutional pressure.',
      uk: 'Зберігайте увагу, розпізнавайте закономірності й витримуйте тиск системи.',
    },
  },
  social: {
    label: { en: 'Social', uk: 'Соціальна' },
    description: {
      en: 'Read people, institutions, and social pressure.',
      uk: 'Читайте людей, установи й соціальний тиск.',
    },
  },
  technical: {
    label: { en: 'Technical', uk: 'Технічна' },
    description: {
      en: 'Understand terminals, cameras, and connected systems.',
      uk: 'Розумійте термінали, камери й пов’язані системи.',
    },
  },
};

export const LEVEL0_SKILL_COPY: Record<SkillKey, Level0CapabilityCopy> = {
  stealth: {
    label: { en: 'Stealth', uk: 'Скритність' },
    description: {
      en: 'Use credible hiding spaces without drawing attention.',
      uk: 'Користуйтеся правдоподібними схованками без зайвої уваги.',
    },
  },
  evasion: {
    label: { en: 'Evasion', uk: 'Ухилення' },
    description: {
      en: 'Break contact and escape through dangerous exits.',
      uk: 'Розривайте контакт і виривайтеся через небезпечні виходи.',
    },
  },
  awareness: {
    label: { en: 'Awareness', uk: 'Уважність' },
    description: {
      en: 'Notice evidence, surveillance, and environmental detail.',
      uk: 'Помічайте докази, нагляд і деталі середовища.',
    },
  },
  composure: {
    label: { en: 'Composure', uk: 'Самовладання' },
    description: {
      en: 'Keep a cover story intact under scrutiny and stress.',
      uk: 'Тримайте легенду під перевіркою та стресом.',
    },
  },
  insight: {
    label: { en: 'Insight', uk: 'Проникливість' },
    description: {
      en: 'Read motives and recognize credible social behavior.',
      uk: 'Читайте мотиви й розпізнавайте правдоподібну поведінку.',
    },
  },
  influence: {
    label: { en: 'Influence', uk: 'Вплив' },
    description: {
      en: 'Persuade or redirect people through authored dialogue.',
      uk: 'Переконуйте або спрямовуйте людей у діалогах.',
    },
  },
  systems: {
    label: { en: 'Systems', uk: 'Системи' },
    description: {
      en: 'Operate a connected terminal for its stated function.',
      uk: 'Керуйте підключеним терміналом у межах його функції.',
    },
  },
  opsec: {
    label: { en: 'OpSec', uk: 'ОпСек' },
    description: {
      en: 'Use technology without leaving an obvious trace.',
      uk: 'Користуйтеся технологіями без очевидного сліду.',
    },
  },
};

export const LEVEL0_CHECK_LABELS: Record<string, Level0LocalizedCopy> = {
  'check.lira_read_stakes': { en: 'Read Lira’s stakes', uk: 'Зрозуміти ставки Ліри' },
  'check.naila_opsec': { en: 'Read Naila’s trace warning', uk: 'Зрозуміти застереження Найли' },
  'check.brant_credibility': { en: 'Establish credibility with Brant', uk: 'Переконати Бранта' },
  'check.public_blend': { en: 'Blend with public activity', uk: 'Злитися з публічним рухом' },
  'check.camera_loop': { en: 'Loop a connected camera', uk: 'Зациклити підключену камеру' },
  'check.camera_trace': { en: 'Avoid leaving a terminal trace', uk: 'Не залишити сліду в терміналі' },
  'check.manifest_recognition': { en: 'Recognize the manifest', uk: 'Розпізнати маніфест' },
  'check.intercept_influence': { en: 'Talk through an interception', uk: 'Вийти з перехоплення розмовою' },
  'check.intercept_composure': { en: 'Hold your cover under scrutiny', uk: 'Втримати легенду під перевіркою' },
  'check.intercept_evasion': { en: 'Escape an interception', uk: 'Вирватися з перехоплення' },
  'check.pursuit_hide': { en: 'Hide during pursuit', uk: 'Сховатися під час переслідування' },
};

const LEVEL0_CHECK_MODIFIER_COPY: Record<string, Level0LocalizedCopy> = {
  'modifier.camera_scrutiny': { en: 'Camera scrutiny', uk: 'Увага камери' },
};

const LEVEL0_FACT_LABELS: Record<string, Level0LocalizedCopy> = {
  'fact.brant.delivery_protocol': {
    en: 'Brant’s delivery protocol',
    uk: 'Протокол доставки Бранта',
  },
  'fact.naila.camera_topology': {
    en: 'Naila’s camera topology',
    uk: 'Топологія камер від Найли',
  },
  'fact.naila.connected_terminal': {
    en: 'Connected camera terminal',
    uk: 'Підключений термінал камер',
  },
  'fact.naila.cold_iron_pattern': {
    en: 'Cold Iron logistics pattern',
    uk: 'Логістичний патерн Cold Iron',
  },
  'fact.cache.manifest_present': {
    en: 'Manifest present at the cache',
    uk: 'Маніфест біля схованки',
  },
  'fact.cache.cold_iron_recognized': {
    en: 'Hidzu–Cold Iron link recognized',
    uk: 'Розпізнано зв’язок Hidzu–Cold Iron',
  },
  'fact.transit.credential_issued': {
    en: 'Outbound credential issued',
    uk: 'Видано дозвіл на виїзд',
  },
  'fact.transit.validated': {
    en: 'Outbound transit validated',
    uk: 'Виїзний транзит підтверджено',
  },
};

const LEVEL0_SOURCE_LABELS: Record<string, Level0LocalizedCopy> = {
  'safehouse.rest': { en: 'Safehouse recovery', uk: 'Відновлення в безпечному місці' },
  'clock.deadline': { en: 'Midnight deadline', uk: 'Опівнічний дедлайн' },
  'camera.identity_gate': {
    en: 'Camera Identity Gate',
    uk: 'Перевірка ідентичності камерою',
  },
  'drone.verification': { en: 'Drone verification', uk: 'Перевірка дроном' },
  'interception.identity_gate': { en: 'Identity interception', uk: 'Перехоплення ідентифікації' },
};

const LEVEL0_UNKNOWN_SOURCE_COPY: Level0LocalizedCopy = {
  en: 'Recorded event',
  uk: 'Зафіксована подія',
};

const humanizeStableId = (value: string): string => {
  const segment = value.split('.').filter(Boolean).slice(-2).join(' ');
  return segment.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export const describeLevel0Fact = (factId: string, ukrainian: boolean): string => {
  const copy = LEVEL0_FACT_LABELS[factId];
  return copy ? localizeLevel0Copy(copy, ukrainian) : humanizeStableId(factId);
};

export const describeLevel0Source = (sourceId: string, ukrainian: boolean): string => {
  const copy = LEVEL0_SOURCE_LABELS[sourceId];
  return localizeLevel0Copy(copy ?? LEVEL0_UNKNOWN_SOURCE_COPY, ukrainian);
};

export const describeLevel0CheckModifier = (
  localizedReasonKey: string,
  ukrainian: boolean
): string => {
  const copy = LEVEL0_CHECK_MODIFIER_COPY[localizedReasonKey];
  return copy
    ? localizeLevel0Copy(copy, ukrainian)
    : ukrainian ? 'Ситуаційна умова' : 'Situational condition';
};

export const describeLevel0ResourceEvent = (
  event: Level0ResourceEvent,
  ukrainian: boolean
): string => {
  const sourceLabel = describeLevel0Source(event.sourceId, ukrainian);
  const resource = event.resource === 'health'
    ? ukrainian ? 'Здоров’я' : 'Health'
    : ukrainian ? 'Параноя' : 'Paranoia';
  const sign = event.amount > 0 ? '+' : '−';
  return `${resource} ${sign}${Math.abs(event.amount)} · ${sourceLabel}`;
};

const CREATION_ERROR_COPY: Record<Level0CreationErrorId, Level0LocalizedCopy> = {
  'callsign.required': { en: 'Enter a callsign.', uk: 'Введіть позивний.' },
  'callsign.invalid': {
    en: 'Use letters, numbers, spaces, apostrophes, periods, hyphens, or underscores.',
    uk: 'Використовуйте літери, цифри, пробіли, апострофи, крапки, дефіси або підкреслення.',
  },
  'callsign.too_long': {
    en: 'Keep the callsign within 24 characters.',
    uk: 'Позивний має містити не більше 24 символів.',
  },
  'appearance.invalid': { en: 'Choose one authored appearance.', uk: 'Оберіть одну зовнішність.' },
  'attributes.invalid': { en: 'Attribute values are invalid.', uk: 'Значення атрибутів некоректні.' },
  'attributes.over_cap': { en: 'Creation attributes cannot exceed 3.', uk: 'Атрибути на старті не можуть перевищувати 3.' },
  'attributes.unspent': { en: 'Allocate all four attribute points.', uk: 'Розподіліть усі чотири очки атрибутів.' },
  'skills.invalid': { en: 'Skill values are invalid.', uk: 'Значення навичок некоректні.' },
  'skills.over_cap': { en: 'Creation skills cannot exceed 2.', uk: 'Навички на старті не можуть перевищувати 2.' },
  'skills.unspent': { en: 'Allocate all six skill points.', uk: 'Розподіліть усі шість очок навичок.' },
};

export const describeLevel0CreationError = (
  errorId: Level0CreationErrorId,
  ukrainian: boolean
): string => localizeLevel0Copy(CREATION_ERROR_COPY[errorId], ukrainian);
