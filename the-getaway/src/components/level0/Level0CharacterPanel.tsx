import { useEffect, useRef } from 'react';
import { CHARACTER_SPRITE_MANIFEST_BY_ID } from '../../content/characters/spriteManifest';
import { LEVEL0_COVER_CATALOG } from '../../game/level0/rpg/creation';
import {
  LEVEL0_ABILITY_CATALOG,
  deriveLevel0ParanoiaTier,
  resolveLevel0AbilityState,
} from '../../game/level0/rpg/gates';
import { LEVEL0_RESEARCH_CATALOG } from '../../game/level0/rpg/research';
import type { Level0RunState } from '../../game/level0/runtime/types';
import {
  LEVEL0_ABILITY_COPY,
  LEVEL0_PARANOIA_TIER_COPY,
  LEVEL0_RESEARCH_COPY,
  describeLevel0Fact,
  describeLevel0ParanoiaEvent,
  localizeLevel0Copy,
} from './level0RpgCopy';
import './Level0CharacterPanel.css';

interface Level0CharacterPanelProps {
  run: Level0RunState;
  ukrainian: boolean;
  onClose: () => void;
}

const Level0CharacterPanel = ({
  run,
  ukrainian,
  onClose,
}: Level0CharacterPanelProps) => {
  const dialogRef = useRef<HTMLElement>(null);
  const portrait = CHARACTER_SPRITE_MANIFEST_BY_ID[run.identity.appearancePresetId]?.portrait.path;
  const cover = LEVEL0_COVER_CATALOG[run.identity.coverId];
  const tier = deriveLevel0ParanoiaTier(run.paranoia);
  const knownFacts = Object.keys(run.facts.known);
  const latestParanoiaEvent = run.rpg.paranoiaEvents[run.rpg.paranoiaEvents.length - 1];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
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
            <div className="level0-character__identity-heading">
              <p>{ukrainian ? 'ПРОФІЛЬ ПРОТАГОНІСТА' : 'PROTAGONIST PROFILE'}</p>
              <h2 id="level0-character-title">
                {localizeLevel0Copy(cover.localizedName, ukrainian)}
              </h2>
            </div>
            <span className="level0-character__identity-fiction">
              {localizeLevel0Copy(cover.localizedFiction, ukrainian)}
            </span>
          </div>
          <button type="button" data-testid="level0-character-close" autoFocus onClick={onClose}>
            {ukrainian ? 'Закрити' : 'Close'}
          </button>
        </header>

        <section className="level0-character__condition" data-tier={tier}>
          <div>
            <span>{ukrainian ? 'СТАН ПАРАНОЇ' : 'PARANOIA CONDITION'}</span>
            <strong>{localizeLevel0Copy(LEVEL0_PARANOIA_TIER_COPY[tier], ukrainian)}</strong>
          </div>
          <span className="level0-character__condition-track" aria-hidden="true">
            <i />
          </span>
          <small>
            {latestParanoiaEvent
              ? describeLevel0ParanoiaEvent(latestParanoiaEvent, ukrainian)
              : ukrainian ? 'Немає зафіксованої причини стресу.' : 'No recorded stress source.'}
          </small>
        </section>

        <div className="level0-character__columns">
          <section>
            <h3>{ukrainian ? 'Здібності' : 'Abilities'}</h3>
            <ul className="level0-character__abilities">
              {run.abilities.heldAbilityIds.map((abilityId) => {
                const definition = LEVEL0_ABILITY_CATALOG[abilityId];
                const state = resolveLevel0AbilityState(abilityId, run.paranoia);
                return (
                  <li key={abilityId} data-state={state.status}>
                    <span>
                      <strong>{localizeLevel0Copy(LEVEL0_ABILITY_COPY[abilityId].label, ukrainian)}</strong>
                      <small>{localizeLevel0Copy(LEVEL0_ABILITY_COPY[abilityId].description, ukrainian)}</small>
                    </span>
                    <span className="level0-character__ability-state">
                      <b>{state.status === 'lit'
                        ? ukrainian ? 'АКТИВНА' : 'LIT'
                        : ukrainian ? 'ЗАБЛОКОВАНА' : 'LOCKED'}</b>
                      <i>{definition.tag === 'hardened'
                        ? ukrainian ? 'загартована' : 'hardened'
                        : state.status === 'locked'
                          ? localizeLevel0Copy(LEVEL0_PARANOIA_TIER_COPY[definition.tag.fragile], ukrainian)
                          : ukrainian ? 'крихка' : 'fragile'}</i>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <h3>{ukrainian ? 'Дослідження' : 'Research'}</h3>
            <ul className="level0-character__research">
              {Object.values(LEVEL0_RESEARCH_CATALOG).map((option) => {
                const state = run.abilities.researchState[option.id];
                return (
                  <li key={option.id} data-state={state}>
                    <strong>{localizeLevel0Copy(LEVEL0_RESEARCH_COPY[option.id].label, ukrainian)}</strong>
                    <small>{localizeLevel0Copy(LEVEL0_RESEARCH_COPY[option.id].description, ukrainian)}</small>
                    <b>{state === 'consumed'
                      ? ukrainian ? 'ЗАВЕРШЕНО' : 'COMPLETED'
                      : state === 'available'
                        ? ukrainian ? 'ДОСТУПНО В БЕЗПЕЧНОМУ МІСЦІ' : 'AVAILABLE AT SAFEHOUSE'
                        : ukrainian ? 'ПОТРІБЕН ФАКТ' : 'FACT REQUIRED'}</b>
                  </li>
                );
              })}
            </ul>

            <h3>{ukrainian ? 'Відомі факти' : 'Known facts'}</h3>
            {knownFacts.length > 0 ? (
              <ul className="level0-character__facts">
                {knownFacts.map((factId) => (
                  <li key={factId}>{describeLevel0Fact(factId, ukrainian)}</li>
                ))}
              </ul>
            ) : (
              <p className="level0-character__empty">
                {ukrainian ? 'Підтверджених фактів ще немає.' : 'No verified facts yet.'}
              </p>
            )}
          </section>
        </div>
      </div>
    </section>
  );
};

export default Level0CharacterPanel;
