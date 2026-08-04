import type { CheckRequirement, CheckResolution } from '../../game/level0/rpg/types';
import {
  LEVEL0_ATTRIBUTE_COPY,
  LEVEL0_CHECK_LABELS,
  LEVEL0_SKILL_COPY,
  describeLevel0CheckModifier,
  describeLevel0Fact,
  localizeLevel0Copy,
} from './level0RpgCopy';
import './Level0CheckBreakdown.css';

interface Level0CheckBreakdownProps {
  requirement: CheckRequirement;
  resolution: CheckResolution;
  ukrainian: boolean;
}

const Level0CheckBreakdown = ({
  requirement,
  resolution,
  ukrainian,
}: Level0CheckBreakdownProps) => {
  const checkLabel = LEVEL0_CHECK_LABELS[requirement.id];
  const outcome = resolution.outcome === 'success'
    ? ukrainian ? 'Успіх' : 'Success'
    : resolution.outcome === 'fatal'
      ? ukrainian ? 'Фатальний стан' : 'Fatal state'
      : ukrainian ? 'Наслідок із продовженням' : 'Fail forward';
  const modifierTotal = resolution.appliedModifiers.reduce(
    (sum, modifier) => sum + modifier.amount,
    0
  );
  const modifierMath = modifierTotal === 0
    ? ''
    : modifierTotal > 0
      ? ` + ${modifierTotal}`
      : ` − ${Math.abs(modifierTotal)}`;

  return (
    <section
      className="level0-check-breakdown"
      data-testid="level0-check-breakdown"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <header>
        <div>
          <p>{ukrainian ? 'ДЕТЕРМІНОВАНА ПЕРЕВІРКА' : 'DETERMINISTIC CHECK'}</p>
          <h3>{checkLabel ? localizeLevel0Copy(checkLabel, ukrainian) : requirement.id}</h3>
        </div>
        <strong>{outcome}</strong>
      </header>
      <dl>
        <div>
          <dt>{ukrainian ? 'Атрибут' : 'Attribute'}</dt>
          <dd>{localizeLevel0Copy(LEVEL0_ATTRIBUTE_COPY[resolution.attribute].label, ukrainian)} {resolution.attributeValue}</dd>
        </div>
        <div>
          <dt>{ukrainian ? 'Навичка' : 'Skill'}</dt>
          <dd>{localizeLevel0Copy(LEVEL0_SKILL_COPY[resolution.skill].label, ukrainian)} {resolution.skillValue}</dd>
        </div>
        <div>
          <dt>{ukrainian ? 'Штраф Параної' : 'Paranoia penalty'}</dt>
          <dd>−{resolution.paranoiaPenalty}</dd>
        </div>
        <div>
          <dt>{ukrainian ? 'Вимога' : 'Requirement'}</dt>
          <dd>{resolution.effectiveRequiredTotal}</dd>
        </div>
      </dl>
      {resolution.appliedFactIds.length > 0 ? (
        <p>
          {ukrainian ? 'Факт' : 'Fact'}: {' '}
          {resolution.appliedFactIds.map((factId) =>
            describeLevel0Fact(factId, ukrainian)
          ).join(' · ')}
          {resolution.effectiveRequiredTotal < resolution.baseRequiredTotal
            ? ` · ${ukrainian ? 'вимогу знижено' : 'requirement lowered'} ${resolution.baseRequiredTotal} → ${resolution.effectiveRequiredTotal}`
            : ''}
        </p>
      ) : null}
      {resolution.appliedModifiers.map((modifier) => (
        <p key={modifier.id}>
          {describeLevel0CheckModifier(modifier.localizedReasonKey, ukrainian)}:{' '}
          {modifier.amount >= 0 ? '+' : '−'}
          {Math.abs(modifier.amount)}
        </p>
      ))}
      {resolution.guaranteedByFactId ? (
        <p>{ukrainian ? 'Результат гарантовано визначеним фактом.' : 'Result guaranteed by the designated fact.'}</p>
      ) : null}
      <div className="level0-check-breakdown__math" data-testid="level0-check-breakdown-math">
        {resolution.attributeValue} + {resolution.skillValue} − {resolution.paranoiaPenalty}
        {modifierMath}
        {' = '}{resolution.finalTotal} / {resolution.effectiveRequiredTotal}
      </div>
    </section>
  );
};

export default Level0CheckBreakdown;
