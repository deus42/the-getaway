import { useEffect, useRef } from 'react';
import { CHARACTER_SPRITE_MANIFEST_BY_ID } from '../../content/characters/spriteManifest';
import {
  ATTRIBUTE_KEYS,
  LEVEL0_LONG_TERM_CAP,
  SKILL_KEYS,
} from '../../game/level0/rpg/creation';
import { getParanoiaCheckPenalty } from '../../game/level0/rpg/checks';
import {
  evaluateLevel0AllocationContext,
  getNextLevelThreshold,
} from '../../game/level0/rpg/progression';
import type { AttributeKey, SkillKey } from '../../game/level0/rpg/types';
import type { Level0RunState } from '../../game/level0/runtime/types';
import {
  LEVEL0_ATTRIBUTE_COPY,
  LEVEL0_SKILL_COPY,
  describeLevel0Fact,
  localizeLevel0Copy,
} from './level0RpgCopy';
import './Level0CharacterPanel.css';

interface Level0CharacterPanelProps {
  run: Level0RunState;
  ukrainian: boolean;
  onClose: () => void;
  onActivateLevel: () => void;
  onAllocateAttribute: (attribute: AttributeKey) => void;
  onAllocateSkill: (skill: SkillKey) => void;
}

const Level0CharacterPanel = ({
  run,
  ukrainian,
  onClose,
  onActivateLevel,
  onAllocateAttribute,
  onAllocateSkill,
}: Level0CharacterPanelProps) => {
  const dialogRef = useRef<HTMLElement>(null);
  const portrait = CHARACTER_SPRITE_MANIFEST_BY_ID[run.identity.appearancePresetId]?.portrait.path;
  const nextThreshold = getNextLevelThreshold(run.build.level);
  const paranoiaPenalty = getParanoiaCheckPenalty(run.paranoia);
  const knownFacts = Object.keys(run.facts.known);
  const allocationAvailability = evaluateLevel0AllocationContext(run);
  const hasAllocation = run.rpg.pendingLevelUps > 0 ||
    run.build.unspentAttributePoints > 0 || run.build.unspentSkillPoints > 0;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault();
        first?.focus();
      }
    };
    dialog.addEventListener('keydown', trapFocus);
    return () => dialog.removeEventListener('keydown', trapFocus);
  }, []);

  return (
    <section
      ref={dialogRef}
      className="level0-character"
      data-testid="level0-character-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="level0-character-title"
    >
      <div className="level0-character__panel">
        <header className="level0-character__header">
          <div className="level0-character__identity">
            {portrait ? <img src={portrait} alt="" /> : null}
            <div>
              <p>{ukrainian ? 'ПРОФІЛЬ ПРОТАГОНІСТА' : 'PROTAGONIST PROFILE'}</p>
              <h2 id="level0-character-title">{run.identity.callsign}</h2>
              <span>
                {ukrainian ? 'Рівень' : 'Level'} {run.build.level} · {run.build.xp}
                {nextThreshold === null ? ' XP' : ` / ${nextThreshold} XP`}
              </span>
            </div>
          </div>
          <button
            type="button"
            data-testid="level0-character-close"
            autoFocus
            onClick={onClose}
          >
            {ukrainian ? 'Закрити' : 'Close'}
          </button>
        </header>

        <div className="level0-character__resources">
          <div><span>{ukrainian ? 'Здоров’я' : 'Health'}</span><b>{run.health} / 100</b></div>
          <div><span>{ukrainian ? 'Параноя' : 'Paranoia'}</span><b>{run.paranoia} / 100</b></div>
          <div>
            <span>{ukrainian ? 'Штраф перевірок' : 'Check penalty'}</span>
            <b>−{paranoiaPenalty}</b>
          </div>
        </div>

        <div className="level0-character__columns">
          <section>
            <div className="level0-character__section-title">
              <h3>{ukrainian ? 'Атрибути' : 'Attributes'}</h3>
              <span>{run.build.unspentAttributePoints} {ukrainian ? 'вільно' : 'unspent'}</span>
            </div>
            <dl>
              {ATTRIBUTE_KEYS.map((key) => {
                const label = localizeLevel0Copy(LEVEL0_ATTRIBUTE_COPY[key].label, ukrainian);
                const atCap = run.build.attributes[key] >= LEVEL0_LONG_TERM_CAP;
                return (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd>{run.build.attributes[key]}</dd>
                    {run.build.unspentAttributePoints > 0 ? (
                      <button
                        type="button"
                        data-testid={`level0-allocate-attribute-${key}`}
                        disabled={!allocationAvailability.available || atCap}
                        title={atCap
                          ? ukrainian
                            ? `${label} вже має довгостроковий максимум ${LEVEL0_LONG_TERM_CAP}.`
                            : `${label} is already at the long-term cap of ${LEVEL0_LONG_TERM_CAP}.`
                          : allocationAvailability.blockedReasonId}
                        aria-describedby={atCap ? `level0-attribute-cap-${key}` : undefined}
                        aria-label={`${ukrainian ? 'Підвищити' : 'Increase'} ${label}`}
                        onClick={() => onAllocateAttribute(key)}
                      >+</button>
                    ) : null}
                    {run.build.unspentAttributePoints > 0 && atCap ? (
                      <small
                        id={`level0-attribute-cap-${key}`}
                        data-testid={`level0-attribute-cap-${key}`}
                      >
                        {ukrainian
                          ? `Довгостроковий максимум: ${LEVEL0_LONG_TERM_CAP}`
                          : `Long-term cap: ${LEVEL0_LONG_TERM_CAP}`}
                      </small>
                    ) : null}
                  </div>
                );
              })}
            </dl>
          </section>

          <section>
            <div className="level0-character__section-title">
              <h3>{ukrainian ? 'Навички' : 'Skills'}</h3>
              <span>{run.build.unspentSkillPoints} {ukrainian ? 'вільно' : 'unspent'}</span>
            </div>
            <dl className="level0-character__skills">
              {SKILL_KEYS.map((key) => {
                const label = localizeLevel0Copy(LEVEL0_SKILL_COPY[key].label, ukrainian);
                const atCap = run.build.skills[key] >= LEVEL0_LONG_TERM_CAP;
                return (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd>{run.build.skills[key]}</dd>
                    {run.build.unspentSkillPoints > 0 ? (
                      <button
                        type="button"
                        data-testid={`level0-allocate-skill-${key}`}
                        disabled={!allocationAvailability.available || atCap}
                        title={atCap
                          ? ukrainian
                            ? `${label} вже має довгостроковий максимум ${LEVEL0_LONG_TERM_CAP}.`
                            : `${label} is already at the long-term cap of ${LEVEL0_LONG_TERM_CAP}.`
                          : allocationAvailability.blockedReasonId}
                        aria-describedby={atCap ? `level0-skill-cap-${key}` : undefined}
                        aria-label={`${ukrainian ? 'Підвищити' : 'Increase'} ${label}`}
                        onClick={() => onAllocateSkill(key)}
                      >+</button>
                    ) : null}
                    {run.build.unspentSkillPoints > 0 && atCap ? (
                      <small
                        id={`level0-skill-cap-${key}`}
                        data-testid={`level0-skill-cap-${key}`}
                      >
                        {ukrainian
                          ? `Довгостроковий максимум: ${LEVEL0_LONG_TERM_CAP}`
                          : `Long-term cap: ${LEVEL0_LONG_TERM_CAP}`}
                      </small>
                    ) : null}
                  </div>
                );
              })}
            </dl>
          </section>
        </div>

        <footer className="level0-character__footer">
          <section>
            <h3>{ukrainian ? 'Відомі факти' : 'Known facts'}</h3>
            {knownFacts.length > 0
              ? <ul>{knownFacts.map((factId) => (
                  <li key={factId}>{describeLevel0Fact(factId, ukrainian)}</li>
                ))}</ul>
              : <p>{ukrainian ? 'Перевірених фактів ще немає.' : 'No verified facts yet.'}</p>}
          </section>
          <section data-testid="level0-character-consequences">
            <h3>{ukrainian ? 'Наслідки' : 'Consequences'}</h3>
            <p>{ukrainian ? 'Тривалих наслідків ще немає.' : 'No lasting consequences recorded.'}</p>
          </section>
          {run.rpg.pendingLevelUps > 0 ? (
            <button
              type="button"
              data-testid="level0-activate-level"
              disabled={!allocationAvailability.available}
              onClick={onActivateLevel}
            >
              {ukrainian ? 'Підвищити рівень' : 'Activate level-up'}
            </button>
          ) : null}
          {hasAllocation && !allocationAvailability.available ? (
            <p data-testid="level0-allocation-blocked" role="status">
              {ukrainian
                ? 'Розподіл очок доступний лише в сховку або під час підсумків.'
                : 'Level-up allocation is available only at the safehouse or during debrief.'}
            </p>
          ) : null}
        </footer>
      </div>
    </section>
  );
};

export default Level0CharacterPanel;
