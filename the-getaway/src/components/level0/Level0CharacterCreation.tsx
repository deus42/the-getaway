import { useMemo, useState } from 'react';
import {
  CHARACTER_SPRITE_MANIFEST_BY_ID,
  LEVEL0_PLAYER_APPEARANCE_IDS,
  type Level0PlayerAppearanceId,
} from '../../content/characters/spriteManifest';
import {
  ATTRIBUTE_KEYS,
  LEVEL0_ATTRIBUTE_CREATION_CAP,
  LEVEL0_SKILL_CREATION_CAP,
  SKILL_KEYS,
  createLevel0CreationDraft,
  validateLevel0CreationDraft,
} from '../../game/level0/rpg/creation';
import type {
  AttributeKey,
  Level0CreationDraft,
  PlayerBuild,
  PlayerIdentity,
  SkillKey,
} from '../../game/level0/rpg/types';
import {
  LEVEL0_ATTRIBUTE_COPY,
  LEVEL0_SKILL_COPY,
  describeLevel0CreationError,
  localizeLevel0Copy,
} from './level0RpgCopy';
import './Level0CharacterCreation.css';

interface Level0CharacterCreationProps {
  ukrainian: boolean;
  onCancel: () => void;
  onConfirm: (identity: PlayerIdentity, build: PlayerBuild) => void;
}

const Level0CharacterCreation = ({
  ukrainian,
  onCancel,
  onConfirm,
}: Level0CharacterCreationProps) => {
  const [draft, setDraft] = useState<Level0CreationDraft>(() => createLevel0CreationDraft());
  const validation = useMemo(() => validateLevel0CreationDraft(draft), [draft]);
  const attributeSummary = ATTRIBUTE_KEYS.filter((key) => draft.attributes[key] > 1)
    .map((key) => `${localizeLevel0Copy(LEVEL0_ATTRIBUTE_COPY[key].label, ukrainian)} ${draft.attributes[key]}`);
  const skillSummary = SKILL_KEYS.filter((key) => draft.skills[key] > 0)
    .map((key) => `${localizeLevel0Copy(LEVEL0_SKILL_COPY[key].label, ukrainian)} ${draft.skills[key]}`);

  const updateAttribute = (key: AttributeKey, delta: -1 | 1) => {
    setDraft((current) => {
      const validationState = validateLevel0CreationDraft(current);
      const value = current.attributes[key];
      if (delta > 0 && (value >= LEVEL0_ATTRIBUTE_CREATION_CAP ||
        validationState.remainingAttributePoints <= 0)) return current;
      if (delta < 0 && value <= 1) return current;
      return {
        ...current,
        attributes: { ...current.attributes, [key]: value + delta },
      };
    });
  };

  const updateSkill = (key: SkillKey, delta: -1 | 1) => {
    setDraft((current) => {
      const validationState = validateLevel0CreationDraft(current);
      const value = current.skills[key];
      if (delta > 0 && (value >= LEVEL0_SKILL_CREATION_CAP ||
        validationState.remainingSkillPoints <= 0)) return current;
      if (delta < 0 && value <= 0) return current;
      return {
        ...current,
        skills: { ...current.skills, [key]: value + delta },
      };
    });
  };

  const confirm = () => {
    if (!validation.identity || !validation.build) return;
    onConfirm(validation.identity, validation.build);
  };

  return (
    <main className="level0-creation" data-testid="level0-character-creation">
      <section
        className="level0-creation__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="level0-creation-title"
      >
        <header className="level0-creation__header">
          <div>
            <p>{ukrainian ? 'НОВА ОСОБА / ТОКІО' : 'NEW IDENTITY / TOKYO'}</p>
            <h1 id="level0-creation-title">
              {ukrainian ? 'Ким ви були до викриття?' : 'Who were you before you were exposed?'}
            </h1>
          </div>
          <button type="button" data-testid="level0-creation-cancel" onClick={onCancel}>
            {ukrainian ? 'Скасувати' : 'Cancel'}
          </button>
        </header>

        <div className="level0-creation__identity">
          <label>
            <span>{ukrainian ? 'Позивний' : 'Callsign'}</span>
            <input
              data-testid="level0-callsign"
              autoFocus
              value={draft.callsign}
              maxLength={64}
              autoComplete="off"
              aria-invalid={validation.errors.some((error) => error.startsWith('callsign.'))}
              aria-describedby={!validation.valid ? 'level0-creation-validation' : undefined}
              onChange={(event) => setDraft((current) => ({
                ...current,
                callsign: event.target.value,
              }))}
            />
          </label>
          <fieldset>
            <legend>{ukrainian ? 'Зовнішність' : 'Appearance'}</legend>
            <div className="level0-creation__appearances">
              {LEVEL0_PLAYER_APPEARANCE_IDS.map((appearancePresetId, index) => {
                const entry = CHARACTER_SPRITE_MANIFEST_BY_ID[appearancePresetId];
                return (
                  <button
                    type="button"
                    key={appearancePresetId}
                    data-testid={`level0-appearance-${appearancePresetId}`}
                    aria-pressed={draft.appearancePresetId === appearancePresetId}
                    onClick={() => setDraft((current) => ({
                      ...current,
                      appearancePresetId: appearancePresetId as Level0PlayerAppearanceId,
                    }))}
                  >
                    {entry ? <img src={entry.portrait.path} alt="" /> : null}
                    <span>{ukrainian ? `Варіант ${index + 1}` : `Preset ${index + 1}`}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div className="level0-creation__build">
          <section>
            <header>
              <div>
                <p>{ukrainian ? 'ОСНОВА' : 'ATTRIBUTES'}</p>
                <h2>{ukrainian ? 'Як ви витримуєте світ' : 'How you meet the world'}</h2>
              </div>
              <strong data-testid="level0-creation-attribute-budget">
                {Math.max(0, validation.remainingAttributePoints)}
              </strong>
            </header>
            <div className="level0-creation__stats">
              {ATTRIBUTE_KEYS.map((key) => (
                <div key={key}>
                  <span className="level0-creation__stat-copy">
                    <b>{localizeLevel0Copy(LEVEL0_ATTRIBUTE_COPY[key].label, ukrainian)}</b>
                    <small>{localizeLevel0Copy(LEVEL0_ATTRIBUTE_COPY[key].description, ukrainian)}</small>
                  </span>
                  <div>
                    <button
                      type="button"
                      data-testid={`level0-create-attribute-${key}-decrease`}
                      disabled={draft.attributes[key] <= 1}
                      aria-label={`${ukrainian ? 'Зменшити' : 'Decrease'} ${localizeLevel0Copy(LEVEL0_ATTRIBUTE_COPY[key].label, ukrainian)}`}
                      onClick={() => updateAttribute(key, -1)}
                    >−</button>
                    <b>{draft.attributes[key]}</b>
                    <button
                      type="button"
                      data-testid={`level0-create-attribute-${key}-increase`}
                      disabled={draft.attributes[key] >= LEVEL0_ATTRIBUTE_CREATION_CAP ||
                        validation.remainingAttributePoints <= 0}
                      aria-label={`${ukrainian ? 'Збільшити' : 'Increase'} ${localizeLevel0Copy(LEVEL0_ATTRIBUTE_COPY[key].label, ukrainian)}`}
                      onClick={() => updateAttribute(key, 1)}
                    >+</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <header>
              <div>
                <p>{ukrainian ? 'ДОСВІД' : 'SKILLS'}</p>
                <h2>{ukrainian ? 'Що ви вже вмієте' : 'What you already know'}</h2>
              </div>
              <strong data-testid="level0-creation-skill-budget">
                {Math.max(0, validation.remainingSkillPoints)}
              </strong>
            </header>
            <div className="level0-creation__stats level0-creation__stats--skills">
              {SKILL_KEYS.map((key) => (
                <div key={key}>
                  <span className="level0-creation__stat-copy">
                    <b>{localizeLevel0Copy(LEVEL0_SKILL_COPY[key].label, ukrainian)}</b>
                    <small>{localizeLevel0Copy(LEVEL0_SKILL_COPY[key].description, ukrainian)}</small>
                  </span>
                  <div>
                    <button
                      type="button"
                      data-testid={`level0-create-skill-${key}-decrease`}
                      disabled={draft.skills[key] <= 0}
                      aria-label={`${ukrainian ? 'Зменшити' : 'Decrease'} ${localizeLevel0Copy(LEVEL0_SKILL_COPY[key].label, ukrainian)}`}
                      onClick={() => updateSkill(key, -1)}
                    >−</button>
                    <b>{draft.skills[key]}</b>
                    <button
                      type="button"
                      data-testid={`level0-create-skill-${key}-increase`}
                      disabled={draft.skills[key] >= LEVEL0_SKILL_CREATION_CAP ||
                        validation.remainingSkillPoints <= 0}
                      aria-label={`${ukrainian ? 'Збільшити' : 'Increase'} ${localizeLevel0Copy(LEVEL0_SKILL_COPY[key].label, ukrainian)}`}
                      onClick={() => updateSkill(key, 1)}
                    >+</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="level0-creation__review" data-testid="level0-creation-review">
          <div>
            <p>{ukrainian ? 'ПОТОЧНИЙ ПРОФІЛЬ' : 'CURRENT PROFILE'}</p>
            <strong>{validation.normalizedCallsign || (ukrainian ? 'Без позивного' : 'No callsign')}</strong>
          </div>
          <div>
            <span>{ukrainian ? 'Виражені атрибути' : 'Developed attributes'}</span>
            <b>{attributeSummary.join(' · ') || (ukrainian ? 'Ще не розподілено' : 'Not allocated yet')}</b>
          </div>
          <div>
            <span>{ukrainian ? 'Підготовлені навички' : 'Trained skills'}</span>
            <b>{skillSummary.join(' · ') || (ukrainian ? 'Ще не розподілено' : 'Not allocated yet')}</b>
          </div>
        </section>

        {!validation.valid ? (
          <section
            id="level0-creation-validation"
            className="level0-creation__validation"
            data-testid="level0-creation-validation"
            aria-live="polite"
          >
            <strong>{ukrainian ? 'Створення не завершено' : 'Creation incomplete'}</strong>
            <ul>
              {validation.errors.map((errorId) => (
                <li key={errorId}>{describeLevel0CreationError(errorId, ukrainian)}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <footer className="level0-creation__footer">
          <p>
            {ukrainian
              ? 'Перевірки детерміновані: атрибут + навичка − штраф Параної проти видимої вимоги.'
              : 'Checks are deterministic: attribute + skill − Paranoia penalty versus a visible requirement.'}
          </p>
          <button
            type="button"
            data-testid="level0-creation-confirm"
            disabled={!validation.valid}
            aria-describedby={!validation.valid ? 'level0-creation-validation' : undefined}
            onClick={confirm}
          >
            {ukrainian ? 'Почати о 18:30' : 'Begin at 18:30'}
          </button>
        </footer>
      </section>
    </main>
  );
};

export default Level0CharacterCreation;
