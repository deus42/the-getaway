import {
  CHARACTER_SPRITE_MANIFEST_BY_ID,
  isLevel0PlayerAppearanceId,
  type Level0PlayerAppearanceId,
} from '../../../content/characters/spriteManifest';
import { createInitialLevel0ResearchState } from './research';
import type {
  CoverIdentity,
  Level0AbilityId,
  Level0CoverId,
  RunAbilities,
} from './types';

export interface Level0CoverDefinition {
  id: Level0CoverId;
  playable: boolean;
  appearancePresetId: Level0PlayerAppearanceId;
  localizedName: { en: string; uk: string };
  localizedFiction: { en: string; uk: string };
  startingAbilityIds: readonly Level0AbilityId[];
}

export const LEVEL0_COVER_CATALOG: Record<Level0CoverId, Level0CoverDefinition> = {
  'cover.neighbor': {
    id: 'cover.neighbor',
    playable: true,
    appearancePresetId: 'player_civilian_01',
    localizedName: { en: 'The Neighbor', uk: 'Сусід' },
    localizedFiction: {
      en: 'You learned which shopkeepers talk, which queues move, and when a polite question opens more than a locked door. Tonight that familiarity is useful — until being watched makes every familiar face harder to read.',
      uk: 'Ви знаєте, хто з крамарів говорить, які черги рухаються і коли ввічливе питання відкриває більше, ніж замкнені двері. Сьогодні ця близькість допомагає — доки нагляд не ускладнює читання кожного знайомого обличчя.',
    },
    startingAbilityIds: [
      'ability.read_people',
      'ability.negotiate',
      'ability.blend_in',
    ],
  },
  'cover.technician': {
    id: 'cover.technician',
    playable: false,
    appearancePresetId: 'player_civilian_02',
    localizedName: { en: 'The Technician', uk: 'Технік' },
    localizedFiction: {
      en: 'You kept ordinary systems working and learned what their service diagrams omit. This cover will become playable when its complete Tokyo route has been authored.',
      uk: 'Ви підтримували звичайні системи в роботі й дізналися, чого немає в їхніх сервісних схемах. Ця роль стане доступною, коли буде створено її повний токійський маршрут.',
    },
    startingAbilityIds: [
      'ability.terminal_craft',
      'ability.trace_discipline',
      'ability.spot_patterns',
    ],
  },
  'cover.commuter': {
    id: 'cover.commuter',
    playable: false,
    appearancePresetId: 'player_civilian_03',
    localizedName: { en: 'The Commuter', uk: 'Пасажир' },
    localizedFiction: {
      en: 'You crossed Tokyo by timing doors, crowds, and the moments between official attention. This cover will become playable when its complete Tokyo route has been authored.',
      uk: 'Ви перетинали Токіо, вгадуючи ритм дверей, натовпу й пауз між офіційними перевірками. Ця роль стане доступною, коли буде створено її повний токійський маршрут.',
    },
    startingAbilityIds: [
      'ability.slip_away',
      'ability.quiet_feet',
      'ability.blend_in',
    ],
  },
  'cover.archivist': {
    id: 'cover.archivist',
    playable: false,
    appearancePresetId: 'player_civilian_04',
    localizedName: { en: 'The Archivist', uk: 'Архівіст' },
    localizedFiction: {
      en: 'You noticed when a record changed, a name disappeared, or two harmless documents told one dangerous story. This cover will become playable when its complete Tokyo route has been authored.',
      uk: 'Ви помічали, коли змінювався запис, зникало ім’я або два безпечні документи складалися в одну небезпечну історію. Ця роль стане доступною, коли буде створено її повний токійський маршрут.',
    },
    startingAbilityIds: [
      'ability.spot_patterns',
      'ability.steady_voice',
      'ability.read_people',
    ],
  },
};

export const LEVEL0_COVER_IDS = Object.keys(LEVEL0_COVER_CATALOG) as Level0CoverId[];

export const isLevel0CoverId = (value: unknown): value is Level0CoverId =>
  typeof value === 'string' && value in LEVEL0_COVER_CATALOG;

export interface Level0CoverSelection {
  valid: boolean;
  reasonId: 'cover.available' | 'cover.invalid' | 'cover.disabled';
  identity: CoverIdentity | null;
  abilities: RunAbilities | null;
}

export const validateLevel0CoverSelection = (coverId: unknown): Level0CoverSelection => {
  if (!isLevel0CoverId(coverId)) {
    return { valid: false, reasonId: 'cover.invalid', identity: null, abilities: null };
  }
  const cover = LEVEL0_COVER_CATALOG[coverId];
  if (!cover.playable) {
    return { valid: false, reasonId: 'cover.disabled', identity: null, abilities: null };
  }
  if (!isLevel0PlayerAppearanceId(cover.appearancePresetId) ||
    !CHARACTER_SPRITE_MANIFEST_BY_ID[cover.appearancePresetId]) {
    return { valid: false, reasonId: 'cover.invalid', identity: null, abilities: null };
  }
  return {
    valid: true,
    reasonId: 'cover.available',
    identity: {
      coverId,
      appearancePresetId: cover.appearancePresetId,
    },
    abilities: {
      heldAbilityIds: [...cover.startingAbilityIds],
      researchState: createInitialLevel0ResearchState(),
    },
  };
};
