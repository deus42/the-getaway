import { useMemo, useState } from 'react';
import { CHARACTER_SPRITE_MANIFEST_BY_ID } from '../../content/characters/spriteManifest';
import {
  LEVEL0_COVER_CATALOG,
  LEVEL0_COVER_IDS,
  validateLevel0CoverSelection,
} from '../../game/level0/rpg/creation';
import type { Level0CoverId } from '../../game/level0/rpg/types';
import {
  describeLevel0Ability,
  localizeLevel0Copy,
} from './level0RpgCopy';
import './Level0CoverSelect.css';

interface Level0CoverSelectProps {
  ukrainian: boolean;
  onCancel: () => void;
  onConfirm: (coverId: Level0CoverId) => void;
}

const Level0CoverSelect = ({
  ukrainian,
  onCancel,
  onConfirm,
}: Level0CoverSelectProps) => {
  const [selectedCoverId, setSelectedCoverId] = useState<Level0CoverId>('cover.neighbor');
  const selection = useMemo(
    () => validateLevel0CoverSelection(selectedCoverId),
    [selectedCoverId]
  );

  return (
    <main className="level0-cover-select" data-testid="level0-cover-select">
      <section
        className="level0-cover-select__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="level0-cover-select-title"
      >
        <header className="level0-cover-select__header">
          <div>
            <p>{ukrainian ? 'ВАША ЛЕГЕНДА / ТОКІО' : 'YOUR COVER / TOKYO'}</p>
            <h1 id="level0-cover-select-title">
              {ukrainian ? 'Яке життя ви вели до цієї ночі?' : 'What life did you live before tonight?'}
            </h1>
            <span>
              {ukrainian
                ? 'Одна людина. Чотири можливі легенди. У цьому зрізі доступна одна.'
                : 'One person. Four possible covers. One is playable in this slice.'}
            </span>
          </div>
          <div className="level0-cover-select__header-actions">
            <button type="button" data-testid="level0-cover-select-cancel" onClick={onCancel}>
              {ukrainian ? 'Скасувати' : 'Cancel'}
            </button>
            <button
              type="button"
              className="level0-cover-select__quick-confirm"
              data-testid="level0-cover-select-confirm-mobile"
              disabled={!selection.valid}
              onClick={() => onConfirm(selectedCoverId)}
            >
              {ukrainian ? 'Почати ввечері' : 'Begin at dusk'}
            </button>
          </div>
        </header>

        <div className="level0-cover-select__grid">
          {LEVEL0_COVER_IDS.map((coverId) => {
            const cover = LEVEL0_COVER_CATALOG[coverId];
            const portrait = CHARACTER_SPRITE_MANIFEST_BY_ID[cover.appearancePresetId]?.portrait.path;
            const selected = selectedCoverId === coverId;
            return (
              <button
                type="button"
                key={coverId}
                className="level0-cover-select__card"
                data-testid={`level0-cover-${coverId}`}
                aria-pressed={selected}
                aria-disabled={!cover.playable}
                onClick={() => setSelectedCoverId(coverId)}
              >
                {portrait ? <img src={portrait} alt="" /> : null}
                <span className="level0-cover-select__card-copy">
                  <span className="level0-cover-select__state">
                    {cover.playable
                      ? ukrainian ? 'ДОСТУПНО' : 'AVAILABLE'
                      : ukrainian ? 'МАЙБУТНЯ ЛЕГЕНДА' : 'FUTURE COVER'}
                  </span>
                  <strong>{localizeLevel0Copy(cover.localizedName, ukrainian)}</strong>
                  <small>{localizeLevel0Copy(cover.localizedFiction, ukrainian)}</small>
                  <span className="level0-cover-select__abilities">
                    {cover.startingAbilityIds.map((abilityId) => (
                      <i key={abilityId}>{describeLevel0Ability(abilityId, ukrainian)}</i>
                    ))}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <footer className="level0-cover-select__footer">
          <p>
            {selection.reasonId === 'cover.disabled'
              ? ukrainian
                ? 'Ця легенда видима, але її повний маршрут ще не створено.'
                : 'This cover is visible, but its complete route has not been authored yet.'
              : ukrainian
                ? 'Здатності є або відсутні. Параноя може тимчасово заблокувати крихкі здатності.'
                : 'Abilities are held or absent. Paranoia can temporarily lock fragile abilities.'}
          </p>
          <button
            type="button"
            data-testid="level0-cover-select-confirm"
            disabled={!selection.valid}
            onClick={() => onConfirm(selectedCoverId)}
          >
            {ukrainian ? 'Почати ввечері' : 'Begin at dusk'}
          </button>
        </footer>
      </section>
    </main>
  );
};

export default Level0CoverSelect;
