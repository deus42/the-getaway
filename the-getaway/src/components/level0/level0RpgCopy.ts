import { LEVEL0_COVER_CATALOG } from '../../game/level0/rpg/creation';
import type {
  Level0AbilityId,
  Level0GateId,
  Level0GateVerdict,
  Level0ParanoiaEvent,
  Level0ParanoiaTier,
  Level0ResearchOptionId,
} from '../../game/level0/rpg/types';

export interface Level0LocalizedCopy {
  en: string;
  uk: string;
}

export const localizeLevel0Copy = (
  copy: Level0LocalizedCopy,
  ukrainian: boolean
): string => ukrainian ? copy.uk : copy.en;

export const LEVEL0_ABILITY_COPY: Record<Level0AbilityId, {
  label: Level0LocalizedCopy;
  description: Level0LocalizedCopy;
}> = {
  'ability.read_people': {
    label: { en: 'Read People', uk: 'Читати людей' },
    description: {
      en: 'Recognize what another person is protecting or withholding.',
      uk: 'Розпізнавати, що інша людина захищає або приховує.',
    },
  },
  'ability.negotiate': {
    label: { en: 'Negotiate', uk: 'Домовлятися' },
    description: {
      en: 'Turn a credible conversation into a practical opening.',
      uk: 'Перетворювати правдоподібну розмову на практичну можливість.',
    },
  },
  'ability.blend_in': {
    label: { en: 'Blend In', uk: 'Зливатися з оточенням' },
    description: {
      en: 'Behave like you belong inside an authored public context.',
      uk: 'Поводитися доречно в конкретному публічному контексті.',
    },
  },
  'ability.steady_voice': {
    label: { en: 'Steady Voice', uk: 'Рівний голос' },
    description: {
      en: 'Keep a cover story coherent while scrutiny rises.',
      uk: 'Тримати легенду цілісною під зростаючою перевіркою.',
    },
  },
  'ability.spot_patterns': {
    label: { en: 'Spot Patterns', uk: 'Бачити закономірності' },
    description: {
      en: 'Recognize a meaningful connection across ordinary records.',
      uk: 'Розпізнавати важливий зв’язок між звичайними записами.',
    },
  },
  'ability.terminal_craft': {
    label: { en: 'Terminal Craft', uk: 'Робота з терміналами' },
    description: {
      en: 'Operate a connected terminal for its declared function.',
      uk: 'Керувати підключеним терміналом у межах його заявленої функції.',
    },
  },
  'ability.trace_discipline': {
    label: { en: 'Trace Discipline', uk: 'Дисципліна сліду' },
    description: {
      en: 'Use a system without creating avoidable evidence.',
      uk: 'Користуватися системою без зайвих доказів втручання.',
    },
  },
  'ability.slip_away': {
    label: { en: 'Slip Away', uk: 'Вислизнути' },
    description: {
      en: 'Break an interception through a prepared physical exit.',
      uk: 'Вийти з перехоплення через підготовлений фізичний шлях.',
    },
  },
  'ability.quiet_feet': {
    label: { en: 'Quiet Feet', uk: 'Тихий крок' },
    description: {
      en: 'Reach a valid hiding context without betraying the route.',
      uk: 'Дістатися до придатного укриття, не видавши маршрут.',
    },
  },
};

export const LEVEL0_PARANOIA_TIER_COPY: Record<Level0ParanoiaTier, Level0LocalizedCopy> = {
  calm: { en: 'Calm', uk: 'Спокій' },
  uneasy: { en: 'Uneasy', uk: 'Тривога' },
  shaken: { en: 'Shaken', uk: 'Похитнутий стан' },
  breaking: { en: 'Breaking', uk: 'На межі' },
  breakdown: { en: 'Breakdown', uk: 'Зрив' },
};

export const LEVEL0_GATE_LABELS: Record<Level0GateId, Level0LocalizedCopy> = {
  'gate.lira_read_stakes': { en: 'Read Lira’s stakes', uk: 'Зрозуміти ставки Ліри' },
  'gate.naila_opsec': { en: 'Read Naila’s warning', uk: 'Зрозуміти застереження Найли' },
  'gate.brant_credibility': { en: 'Establish credibility', uk: 'Підтвердити довіру' },
  'gate.public_blend': { en: 'Blend with public activity', uk: 'Злитися з публічним рухом' },
  'gate.camera_loop': { en: 'Loop the connected camera', uk: 'Зациклити підключену камеру' },
  'gate.camera_trace': { en: 'Avoid leaving a trace', uk: 'Не залишити сліду' },
  'gate.manifest_recognition': { en: 'Recognize the manifest', uk: 'Розпізнати маніфест' },
  'gate.intercept_social': { en: 'Talk through interception', uk: 'Вийти з перехоплення розмовою' },
  'gate.intercept_composure': { en: 'Hold the cover story', uk: 'Втримати легенду' },
  'gate.intercept_evasion': { en: 'Escape interception', uk: 'Вирватися з перехоплення' },
  'gate.pursuit_hide': { en: 'Hide during pursuit', uk: 'Сховатися під час переслідування' },
};

export const LEVEL0_RESEARCH_COPY: Record<Level0ResearchOptionId, {
  label: Level0LocalizedCopy;
  description: Level0LocalizedCopy;
}> = {
  'research.naila_camera_topology': {
    label: { en: 'Study Naila’s camera topology', uk: 'Вивчити топологію камер Найли' },
    description: {
      en: 'Consume the topology fact and spend twenty world minutes to learn Terminal Craft.',
      uk: 'Витратити факт про топологію та двадцять ігрових хвилин, щоб опанувати роботу з терміналами.',
    },
  },
  'research.brant_delivery_protocol': {
    label: { en: 'Rehearse Brant’s delivery protocol', uk: 'Відрепетирувати протокол доставки Бранта' },
    description: {
      en: 'Consume the protocol fact and spend fifteen world minutes to learn Steady Voice.',
      uk: 'Витратити факт про протокол та п’ятнадцять ігрових хвилин, щоб опанувати рівний голос.',
    },
  },
};

const FACT_COPY: Record<string, Level0LocalizedCopy> = {
  'fact.brant.delivery_protocol': {
    en: 'Brant’s delivery protocol',
    uk: 'Протокол доставки Бранта',
  },
  'fact.naila.camera_topology': {
    en: 'Naila’s camera topology',
    uk: 'Топологія камер Найли',
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
};

const SOURCE_COPY: Record<string, Level0LocalizedCopy> = {
  'safehouse.rest': { en: 'Safehouse recovery', uk: 'Відновлення в безпечному місці' },
  'clock.deadline': { en: 'Midnight deadline', uk: 'Опівнічний дедлайн' },
  'camera.identity_gate': { en: 'Identity-gate camera', uk: 'Камера перевірки особи' },
  'drone.verification': { en: 'Needle verification', uk: 'Перевірка Needle' },
  'interception.identity_gate': { en: 'Identity interception', uk: 'Перехоплення ідентифікації' },
  'grounding.transit-road-vending-coffee': {
    en: 'Vending-machine coffee on Transit Road',
    uk: 'Кава з автомата на Транзитній дорозі',
  },
  'grounding.market-ring-shrine': {
    en: 'Shrine at the Market Ring junction',
    uk: 'Святилище на розвилці Ринкового кільця',
  },
  'relief.difficult_escape': {
    en: 'Slipping a difficult surveillance escape',
    uk: 'Вислизання зі складного стеження',
  },
};

const humanizeStableId = (value: string): string => value
  .split('.')
  .filter(Boolean)
  .slice(-2)
  .join(' ')
  .replace(/[_-]+/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const describeLevel0Cover = (
  coverId: keyof typeof LEVEL0_COVER_CATALOG,
  ukrainian: boolean
): string => localizeLevel0Copy(LEVEL0_COVER_CATALOG[coverId].localizedName, ukrainian);

export const describeLevel0Ability = (
  abilityId: Level0AbilityId,
  ukrainian: boolean
): string => localizeLevel0Copy(LEVEL0_ABILITY_COPY[abilityId].label, ukrainian);

export const describeLevel0Fact = (factId: string, ukrainian: boolean): string =>
  FACT_COPY[factId]
    ? localizeLevel0Copy(FACT_COPY[factId], ukrainian)
    : humanizeStableId(factId);

export const describeLevel0Source = (sourceId: string, ukrainian: boolean): string =>
  SOURCE_COPY[sourceId]
    ? localizeLevel0Copy(SOURCE_COPY[sourceId], ukrainian)
    : humanizeStableId(sourceId);

export const describeLevel0ParanoiaEvent = (
  event: Level0ParanoiaEvent,
  ukrainian: boolean
): string => `${event.amount > 0
  ? ukrainian ? 'Параноя посилилася' : 'Paranoia intensified'
  : ukrainian ? 'Параноя послабилася' : 'Paranoia eased'} · ${describeLevel0Source(
  event.sourceId,
  ukrainian
)}`;

export const describeLevel0GateReason = (
  verdict: Level0GateVerdict,
  ukrainian: boolean
): string => {
  if (verdict.reasonId === 'gate.met.ability' && verdict.abilityId) {
    return ukrainian
      ? `Умова виконана: ${describeLevel0Ability(verdict.abilityId, true)}.`
      : `Met: ${describeLevel0Ability(verdict.abilityId, false)}.`;
  }
  if (verdict.reasonId === 'gate.met.fact' && verdict.factId) {
    return ukrainian
      ? `Умова виконана фактом: ${describeLevel0Fact(verdict.factId, true)}.`
      : `Met by fact: ${describeLevel0Fact(verdict.factId, false)}.`;
  }
  if (verdict.reasonId === 'gate.met.costed' && verdict.costedPathId) {
    return ukrainian ? 'Умова виконана через заявлену ціну.' : 'Met by accepting the declared cost.';
  }
  if (verdict.reasonId.includes('ability_locked')) {
    return verdict.reasonId.endsWith('uneasy')
      ? ukrainian ? 'Не виконано: здатність заблокована рівнем «Тривога».' : 'Not met: ability locked at Uneasy.'
      : ukrainian ? 'Не виконано: здатність заблокована рівнем «Похитнутий стан».' : 'Not met: ability locked at Shaken.';
  }
  if (verdict.reasonId === 'gate.blocked.ability_missing') {
    return ukrainian ? 'Не виконано: потрібної здатності немає.' : 'Not met: required ability is not held.';
  }
  if (verdict.reasonId === 'gate.blocked.fact_missing') {
    return ukrainian ? 'Не виконано: потрібний факт невідомий.' : 'Not met: required fact is unknown.';
  }
  if (verdict.reasonId === 'gate.blocked.cost_not_accepted') {
    return ukrainian ? 'Не виконано: заявлену ціну не прийнято.' : 'Not met: declared cost was not accepted.';
  }
  return ukrainian ? 'Цей шлях зараз недоступний.' : 'This path is currently unavailable.';
};
