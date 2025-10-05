import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { allocateSkillPointToSkill, spendAttributePoint, refundAttributePoint, refundSkillPointFromSkill } from '../../store/playerSlice';
import { SKILL_BRANCHES } from '../../content/skills';
import { PlayerSkills, SkillId } from '../../game/interfaces/types';
import EnhancedButton from './EnhancedButton';
import { gradientTextStyle } from './theme';

interface LevelUpPointAllocationPanelProps {
  onComplete: () => void;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 11000,
  backgroundColor: 'rgba(8, 15, 31, 0.92)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '2vh 2vw',
};

const panelStyle: React.CSSProperties = {
  width: 'min(760px, 94vw)',
  maxHeight: '82vh',
  overflow: 'hidden',
  background: 'linear-gradient(160deg, rgba(15, 23, 42, 0.98), rgba(8, 11, 24, 0.92))',
  borderRadius: '18px',
  border: '2px solid rgba(56, 189, 248, 0.22)',
  boxShadow: '0 36px 80px rgba(2, 6, 23, 0.7)',
  color: '#e2e8f0',
  display: 'flex',
  flexDirection: 'column',
};

const headerStyle: React.CSSProperties = {
  padding: '1.2rem 1.5rem 0.9rem',
  borderBottom: '1px solid rgba(56, 189, 248, 0.14)',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.3rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  margin: 0,
  marginBottom: '0.35rem',
  ...gradientTextStyle('#bfdbfe', '#38bdf8'),
  filter: 'drop-shadow(0 0 18px rgba(56, 189, 248, 0.45))',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  color: '#94a3b8',
  margin: 0,
};

const bodyStyle: React.CSSProperties = {
  padding: '1.2rem 1.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.2rem',
  overflowY: 'auto',
};

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.8rem',
};

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#38bdf8',
  marginBottom: '0.35rem',
};

const pointsRemainingStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.35rem 0.7rem',
  borderRadius: '999px',
  background: 'rgba(56, 189, 248, 0.15)',
  border: '1px solid rgba(56, 189, 248, 0.4)',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#38bdf8',
};

const attributeGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '0.9rem',
};

const attributeCardStyle: React.CSSProperties = {
  background: 'rgba(30, 41, 59, 0.6)',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  borderRadius: '10px',
  padding: '0.85rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '0.75rem',
};

const attributeInfoStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const attributeNameStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  fontWeight: 600,
  color: '#e2e8f0',
  marginBottom: '0.25rem',
  letterSpacing: '0.03em',
};

const attributeDescStyle: React.CSSProperties = {
  fontSize: '0.66rem',
  color: '#94a3b8',
  lineHeight: 1.3,
};

const attributeMetaStyle: React.CSSProperties = {
  fontSize: '0.6rem',
  color: '#34d399',
  marginTop: '0.25rem',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

const attributeControlsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  flexShrink: 0,
};

const attributeValueStyle: React.CSSProperties = {
  fontSize: '1.35rem',
  fontWeight: 700,
  color: '#38bdf8',
  minWidth: '42px',
  textAlign: 'center',
  fontFamily: "'DM Mono', monospace",
  lineHeight: 1,
};

const incrementButtonStyle = (disabled: boolean): React.CSSProperties => ({
  width: '32px',
  height: '32px',
  flexShrink: 0,
  borderRadius: '8px',
  backgroundColor: disabled ? 'rgba(148, 163, 184, 0.1)' : 'rgba(56, 189, 248, 0.2)',
  border: `1px solid ${disabled ? 'rgba(148, 163, 184, 0.2)' : 'rgba(56, 189, 248, 0.4)'}`,
  color: disabled ? '#64748b' : '#38bdf8',
  fontSize: '1.2rem',
  fontWeight: 700,
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  outline: 'none',
  padding: 0,
  background: disabled ? 'rgba(148, 163, 184, 0.1)' : 'rgba(56, 189, 248, 0.2)',
});

const skillGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: '0.7rem',
};

const skillItemStyle: React.CSSProperties = {
  background: 'rgba(30, 41, 59, 0.6)',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  borderRadius: '8px',
  padding: '0.6rem 0.8rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '0.6rem',
};

const skillNameStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#e2e8f0',
  flex: 1,
  minWidth: 0,
};

const skillControlsContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  flexShrink: 0,
};

const skillValueStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 700,
  color: '#34d399',
  minWidth: '36px',
  textAlign: 'center',
  fontFamily: "'DM Mono', monospace",
  lineHeight: 1,
};

const footerStyle: React.CSSProperties = {
  padding: '1rem 1.8rem 1.5rem',
  borderTop: '1px solid rgba(56, 189, 248, 0.18)',
  display: 'flex',
  justifyContent: 'flex-end',
};

const ATTRIBUTE_INFO: Record<keyof PlayerSkills, { label: string; description: string }> = {
  strength: { label: 'Strength', description: 'Melee damage, carry weight' },
  perception: { label: 'Perception', description: 'Hit chance, awareness' },
  endurance: { label: 'Endurance', description: 'Max health & stamina capacity' },
  charisma: { label: 'Charisma', description: 'Dialogue, persuasion' },
  intelligence: { label: 'Intelligence', description: 'Skill points, hacking' },
  agility: { label: 'Agility', description: 'Action points, dodge' },
  luck: { label: 'Luck', description: 'Critical chance' },
};

const LevelUpPointAllocationPanel: React.FC<LevelUpPointAllocationPanelProps> = ({ onComplete }) => {
  const dispatch = useDispatch();
  const player = useSelector((state: RootState) => state.player.data);
  const [tempAttributePoints, setTempAttributePoints] = useState(player.attributePoints);
  const [tempSkillPoints, setTempSkillPoints] = useState(player.skillPoints);
  const [initialAttributePoints] = useState(player.attributePoints);
  const [initialSkillPoints] = useState(player.skillPoints);

  const hasPointsToSpend = tempAttributePoints > 0 || tempSkillPoints > 0;
  const hadInitialPoints = initialAttributePoints > 0 || initialSkillPoints > 0;

  const handleAttributeIncrease = (attribute: keyof PlayerSkills) => {
    if (tempAttributePoints <= 0 || player.skills[attribute] >= 10) return;

    dispatch(spendAttributePoint(attribute));
    setTempAttributePoints(prev => prev - 1);
  };

  const handleAttributeDecrease = (attribute: keyof PlayerSkills) => {
    if (player.skills[attribute] <= 1) return;

    dispatch(refundAttributePoint(attribute));
    setTempAttributePoints(prev => prev + 1);
  };

  const handleSkillIncrease = (skillId: SkillId, increment: number, maxValue: number) => {
    if (tempSkillPoints <= 0) {
      return;
    }

    const currentValue = player.skillTraining[skillId] || 0;
    if (currentValue + increment > maxValue) {
      return;
    }

    dispatch(allocateSkillPointToSkill(skillId));
    setTempSkillPoints((prev) => Math.max(0, prev - 1));
  };

  const handleSkillDecrease = (skillId: SkillId, decrement: number) => {
    const currentValue = player.skillTraining[skillId] || 0;
    if (currentValue - decrement < 0) {
      return;
    }

    dispatch(refundSkillPointFromSkill(skillId));
    setTempSkillPoints((prev) => prev + 1);
  };

  const attributeOrder: (keyof PlayerSkills)[] = [
    'strength', 'perception', 'endurance', 'charisma',
    'intelligence', 'agility', 'luck'
  ];

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label="Level Up - Allocate Points">
      <div style={panelStyle}>
        <header style={headerStyle}>
          <h2 style={titleStyle}>Level Up - Allocate Points</h2>
          <p style={subtitleStyle}>
            Spend your points wisely - allocations are permanent
          </p>
        </header>

        <div style={bodyStyle}>
          {/* Attributes Section */}
          {initialAttributePoints > 0 && (
            <section style={sectionStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h3 style={sectionHeaderStyle}>Attributes</h3>
                <span style={pointsRemainingStyle}>
                  {tempAttributePoints} {tempAttributePoints === 1 ? 'Point' : 'Points'} Remaining
                </span>
              </div>

              <div style={attributeGridStyle}>
                {attributeOrder.map((attr) => (
                  <div key={attr} style={attributeCardStyle}>
                    <div style={attributeInfoStyle}>
                      <div style={attributeNameStyle}>{ATTRIBUTE_INFO[attr].label}</div>
                      <div style={attributeDescStyle}>{ATTRIBUTE_INFO[attr].description}</div>
                      {attr === 'endurance' && (
                        <div style={attributeMetaStyle}>
                          Max Stamina: {player.maxStamina} (+5 per point)
                        </div>
                      )}
                    </div>
                    <div style={attributeControlsStyle}>
                      <button
                        onClick={() => handleAttributeDecrease(attr)}
                        disabled={player.skills[attr] <= 1}
                        style={incrementButtonStyle(player.skills[attr] <= 1)}
                        title={`Decrease ${ATTRIBUTE_INFO[attr].label}`}
                      >
                        −
                      </button>
                      <div style={attributeValueStyle}>{player.skills[attr]}</div>
                      <button
                        onClick={() => handleAttributeIncrease(attr)}
                        disabled={tempAttributePoints <= 0 || player.skills[attr] >= 10}
                        style={incrementButtonStyle(tempAttributePoints <= 0 || player.skills[attr] >= 10)}
                        title={`Increase ${ATTRIBUTE_INFO[attr].label}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills Section */}
          {initialSkillPoints > 0 && (
            <section style={sectionStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h3 style={sectionHeaderStyle}>Skills</h3>
                <span style={pointsRemainingStyle}>
                  {tempSkillPoints} {tempSkillPoints === 1 ? 'Point' : 'Points'} Remaining
                </span>
              </div>

              {SKILL_BRANCHES.map((branch) => (
                <div key={branch.id}>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {branch.label}
                  </div>
                  <div style={skillGridStyle}>
                    {branch.skills.map((skill) => {
                      const skillId = skill.id as SkillId;
                      const currentValue = player.skillTraining[skillId] || 0;
                      const isTagged = player.taggedSkillIds.includes(skillId);
                      const step = isTagged ? skill.taggedIncrement : skill.increment;
                      const canDecrease = currentValue - step >= 0 && currentValue > 0;
                      const canIncrease = tempSkillPoints > 0 && currentValue + step <= skill.maxValue;

                      return (
                        <div key={skill.id} style={skillItemStyle}>
                          <span style={skillNameStyle}>{skill.name}</span>
                          <div style={skillControlsContainerStyle}>
                            <button
                              onClick={() => handleSkillDecrease(skillId, step)}
                              disabled={!canDecrease}
                              style={incrementButtonStyle(!canDecrease)}
                              title={canDecrease ? `Decrease ${skill.name}` : 'Cannot refund below zero'}
                            >
                              −
                            </button>
                            <span style={skillValueStyle}>{currentValue}</span>
                            <button
                              onClick={() => handleSkillIncrease(skillId, step, skill.maxValue)}
                              disabled={!canIncrease}
                              style={incrementButtonStyle(!canIncrease)}
                              title={canIncrease ? `Increase ${skill.name}` : 'No points remaining or at cap'}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          )}

          {!hadInitialPoints && (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#94a3b8',
              fontSize: '0.95rem',
            }}>
              No points to allocate. Click Continue to proceed.
            </div>
          )}
        </div>

        <footer style={footerStyle}>
          <EnhancedButton
            onClick={onComplete}
            variant="primary"
            size="medium"
            disabled={hasPointsToSpend}
            title={hasPointsToSpend ? 'Spend all points before continuing' : 'Continue'}
          >
            Continue
          </EnhancedButton>
        </footer>
      </div>
    </div>
  );
};

export default LevelUpPointAllocationPanel;
