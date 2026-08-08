import type {
  Level0GateRequirement,
  Level0GateVerdict as Level0GateVerdictModel,
} from '../../game/level0/rpg/types';
import {
  LEVEL0_GATE_LABELS,
  describeLevel0Ability,
  describeLevel0Fact,
  describeLevel0GateReason,
  localizeLevel0Copy,
} from './level0RpgCopy';
import './Level0GateVerdict.css';

interface Level0GateVerdictProps {
  requirement: Level0GateRequirement;
  verdict: Level0GateVerdictModel;
  ukrainian: boolean;
}

const Level0GateVerdict = ({
  requirement,
  verdict,
  ukrainian,
}: Level0GateVerdictProps) => {
  const label = LEVEL0_GATE_LABELS[requirement.id];
  const pathLabel = verdict.path === 'ability'
    ? verdict.abilityId
      ? describeLevel0Ability(verdict.abilityId, ukrainian)
      : ukrainian ? 'Здатність недоступна' : 'Ability unavailable'
    : verdict.path === 'fact'
      ? verdict.factId
        ? describeLevel0Fact(verdict.factId, ukrainian)
        : ukrainian ? 'Факт недоступний' : 'Fact unavailable'
      : ukrainian ? 'Шлях із заявленою ціною' : 'Declared cost path';

  return (
    <section
      className="level0-gate-verdict"
      data-testid="level0-gate-verdict"
      data-status={verdict.status}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <header>
        <div>
          <p>{ukrainian ? 'УМОВА СИТУАЦІЇ' : 'SITUATION GATE'}</p>
          <h3>{label ? localizeLevel0Copy(label, ukrainian) : requirement.id}</h3>
        </div>
        <strong>
          {verdict.status === 'met'
            ? ukrainian ? 'ВИКОНАНО' : 'MET'
            : ukrainian ? 'НЕ ВИКОНАНО' : 'NOT MET'}
        </strong>
      </header>
      <dl>
        <div>
          <dt>{ukrainian ? 'Обраний шлях' : 'Chosen path'}</dt>
          <dd>{pathLabel}</dd>
        </div>
        <div>
          <dt>{ukrainian ? 'Стан' : 'Condition'}</dt>
          <dd>{describeLevel0GateReason(verdict, ukrainian)}</dd>
        </div>
      </dl>
    </section>
  );
};

export default Level0GateVerdict;
