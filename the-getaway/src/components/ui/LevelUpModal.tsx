import React from 'react';
import EnhancedButton from './EnhancedButton';
import { gradientTextStyle } from './theme';

interface LevelUpModalProps {
  newLevel: number;
  skillPointsEarned: number;
  attributePointsEarned: number;
  perksUnlocked: number;
  onContinue: () => void;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(3, 7, 18, 0.85)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  padding: '2rem',
};

const modalStyle: React.CSSProperties = {
  width: 'min(640px, 100%)',
  borderRadius: '24px',
  border: '1px solid rgba(56, 189, 248, 0.4)',
  background: 'linear-gradient(165deg, rgba(15, 23, 42, 0.96), rgba(8, 18, 35, 0.96))',
  boxShadow: '0 40px 100px rgba(2, 6, 23, 0.85)',
  padding: '2.6rem 2.4rem 2.2rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '2rem',
  position: 'relative',
};

const accentGlowStyle: React.CSSProperties = {
  position: 'absolute',
  inset: '-25%',
  background: 'radial-gradient(circle at 20% 0%, rgba(56, 189, 248, 0.25), transparent 55%)',
  pointerEvents: 'none',
  filter: 'blur(12px)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',
  alignItems: 'flex-start',
};

const badgeStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  letterSpacing: '0.32em',
  textTransform: 'uppercase',
  color: '#bae6fd',
  background: 'rgba(56, 189, 248, 0.12)',
  border: '1px solid rgba(56, 189, 248, 0.35)',
  borderRadius: '999px',
  padding: '0.35rem 0.9rem',
  boxShadow: '0 0 24px rgba(56, 189, 248, 0.35)',
};

const levelRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '0.75rem',
};

const levelLabelStyle: React.CSSProperties = {
  fontSize: '1.8rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'rgba(148, 163, 184, 0.85)',
};

const levelNumberStyle: React.CSSProperties = {
  fontSize: '3.4rem',
  fontWeight: 800,
  lineHeight: 1,
  ...gradientTextStyle('#bfdbfe', '#38bdf8'),
  filter: 'drop-shadow(0 0 25px rgba(56, 189, 248, 0.55))',
};

const subheadingStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  color: 'rgba(226, 232, 240, 0.82)',
  lineHeight: 1.5,
  maxWidth: '520px',
};

const rewardsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '0.9rem',
};

const rewardCardStyle: React.CSSProperties = {
  borderRadius: '16px',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'linear-gradient(160deg, rgba(21, 31, 53, 0.88), rgba(11, 18, 34, 0.92))',
  padding: '1rem 1.1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
  position: 'relative',
  overflow: 'hidden',
};

const rewardIconStyle: React.CSSProperties = {
  fontSize: '1.4rem',
};

const rewardLabelStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'rgba(148, 163, 184, 0.9)',
};

const rewardValueStyle: React.CSSProperties = {
  fontSize: '1.6rem',
  fontWeight: 700,
  color: '#e2e8f0',
};

const rewardHintStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  color: 'rgba(148, 163, 184, 0.7)',
};

const nextStepsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const stepHeadingStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: '#38bdf8',
};

const stepListStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: '1.1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
  fontSize: '0.82rem',
  color: 'rgba(226, 232, 240, 0.85)',
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
};

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  newLevel,
  skillPointsEarned,
  attributePointsEarned,
  perksUnlocked,
  onContinue,
}) => {
  const rewardCards = [
    {
      key: 'skill',
      visible: skillPointsEarned > 0,
      icon: '🧠',
      label: 'Skill points',
      value: `+${skillPointsEarned}`,
      hint: 'Invest to specialise combat, tech, or survival disciplines.',
    },
    {
      key: 'attribute',
      visible: attributePointsEarned > 0,
      icon: '⚙️',
      label: 'Attribute points',
      value: `+${attributePointsEarned}`,
      hint: 'Raise core stats to unlock new gear, dialogue, and perks.',
    },
    {
      key: 'perk',
      visible: perksUnlocked > 0,
      icon: '⭐',
      label: 'Perk unlock',
      value: perksUnlocked === 1 ? '1 pick' : `${perksUnlocked} picks`,
      hint: 'Select a permanent upgrade once requirements are met.',
    },
    {
      key: 'recovery',
      visible: true,
      icon: '❤️',
      label: 'Vitality',
      value: 'Restored',
      hint: 'Health and AP refilled for the next encounter.',
    },
  ].filter((reward) => reward.visible);

  const nextSteps = [
    attributePointsEarned > 0 || skillPointsEarned > 0
      ? 'Spend your new attribute and skill points to boost key stats.'
      : null,
    perksUnlocked > 0
      ? 'Review newly unlocked perks—requirements may change after allocating points.'
      : null,
    'Save progress at a safe terminal before diving back into the operation.',
  ].filter((step): step is string => Boolean(step));

  return (
    <div className="level-up-modal" style={overlayStyle}>
      <div className="level-up-modal__shell" style={modalStyle}>
        <div className="level-up-modal__accent" style={accentGlowStyle} />
        <header className="level-up-modal__header" style={headerStyle}>
          <span className="level-up-modal__badge" style={badgeStyle}>Promotion Achieved</span>
          <div className="level-up-modal__level-row" style={levelRowStyle}>
            <span className="level-up-modal__level-label" style={levelLabelStyle}>Operator Level</span>
            <span className="level-up-modal__level-number" style={levelNumberStyle}>{newLevel}</span>
          </div>
          <p className="level-up-modal__subheading" style={subheadingStyle}>
            You have advanced your capabilities. Allocate your new resources to stay ahead of CorpSec escalation.
          </p>
        </header>

        <section className="level-up-modal__rewards" aria-label="level-up rewards" style={rewardsGridStyle}>
          {rewardCards.map((reward) => (
            <article className="level-up-modal__reward" key={reward.key} style={rewardCardStyle}>
              <span className="level-up-modal__reward-icon" style={rewardIconStyle} aria-hidden="true">{reward.icon}</span>
              <span className="level-up-modal__reward-label" style={rewardLabelStyle}>{reward.label}</span>
              <span className="level-up-modal__reward-value" style={rewardValueStyle}>{reward.value}</span>
              <span className="level-up-modal__reward-hint" style={rewardHintStyle}>{reward.hint}</span>
            </article>
          ))}
        </section>

        {nextSteps.length > 0 && (
          <section className="level-up-modal__next" style={nextStepsStyle} aria-label="Next actions">
            <span className="level-up-modal__next-heading" style={stepHeadingStyle}>Next Steps</span>
            <ol className="level-up-modal__next-list" style={stepListStyle}>
              {nextSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
        )}

        <footer className="level-up-modal__footer" style={footerStyle}>
          <EnhancedButton className="level-up-modal__continue" onClick={onContinue} variant="primary" size="large">
            Continue
          </EnhancedButton>
        </footer>
      </div>
    </div>
  );
};
