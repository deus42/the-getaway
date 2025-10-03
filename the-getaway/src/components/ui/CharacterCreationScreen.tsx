import React, { useState } from 'react';
import { PlayerSkills } from '../../game/interfaces/types';
import { calculateDerivedStats } from '../../game/systems/statCalculations';
import { BACKGROUNDS } from '../../content/backgrounds';
import EnhancedButton from './EnhancedButton';
import NotificationBadge from './NotificationBadge';
import { gradientTextStyle } from './theme';

interface CharacterCreationScreenProps {
  onComplete: (data: CharacterCreationData) => void;
  onCancel: () => void;
}

export interface CharacterCreationData {
  name: string;
  visualPreset: string;
  attributes?: PlayerSkills;
  backgroundId?: string;
}

const VISUAL_PRESETS = [
  { id: 'operative', label: 'Operative', description: 'Tactical specialist' },
  { id: 'survivor', label: 'Survivor', description: 'Street-hardened fighter' },
  { id: 'tech', label: 'Tech', description: 'Underground hacker' },
  { id: 'scavenger', label: 'Scavenger', description: 'Wasteland wanderer' },
];

const RANDOM_NAMES = [
  'Raven', 'Ghost', 'Cipher', 'Echo', 'Viper', 'Phoenix',
  'Shadow', 'Blade', 'Nova', 'Wraith', 'Spark', 'Drift'
];

const ATTRIBUTE_INFO: Record<keyof PlayerSkills, { label: string; description: string }> = {
  strength: {
    label: 'STR',
    description: 'Melee damage, carry weight'
  },
  perception: {
    label: 'PER',
    description: 'Hit chance, critical chance, awareness'
  },
  endurance: {
    label: 'END',
    description: 'Max health points'
  },
  charisma: {
    label: 'CHA',
    description: 'Dialogue options, persuasion'
  },
  intelligence: {
    label: 'INT',
    description: 'Skill points per level, hacking'
  },
  agility: {
    label: 'AGI',
    description: 'Action points, dodge chance'
  },
  luck: {
    label: 'LCK',
    description: 'Critical chance, random events'
  }
};

const ATTRIBUTE_ORDER: (keyof PlayerSkills)[] = [
  'strength',
  'perception',
  'endurance',
  'charisma',
  'intelligence',
  'agility',
  'luck'
];

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.98)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  fontFamily: "'DM Sans', 'Inter', sans-serif",
};

const panelStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
  border: '2px solid rgba(56, 189, 248, 0.3)',
  borderRadius: '16px',
  padding: '1.5rem',
  maxWidth: '600px',
  width: '90%',
  maxHeight: '95vh',
  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 100px rgba(56, 189, 248, 0.1)',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.3rem',
  fontWeight: 700,
  marginBottom: '0.3rem',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  ...gradientTextStyle('#bfdbfe', '#38bdf8'),
  filter: 'drop-shadow(0 0 20px rgba(56, 189, 248, 0.5))',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#94a3b8',
  marginBottom: '1rem',
  letterSpacing: '0.05em',
};

const stepIndicatorStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  marginBottom: '1rem',
  justifyContent: 'center',
};

const stepDotStyle = (active: boolean): React.CSSProperties => ({
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  backgroundColor: active ? '#38bdf8' : 'rgba(148, 163, 184, 0.3)',
  boxShadow: active ? '0 0 10px rgba(56, 189, 248, 0.6)' : 'none',
  transition: 'all 0.3s ease',
});

const labelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#94a3b8',
  marginBottom: '0.4rem',
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.65rem 1rem',
  backgroundColor: 'rgba(15, 23, 42, 0.8)',
  border: '1px solid rgba(148, 163, 184, 0.3)',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: '0.95rem',
  fontFamily: "'DM Mono', monospace",
  marginBottom: '1rem',
  outline: 'none',
  transition: 'border-color 0.2s ease',
};

const presetGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '0.8rem',
  marginBottom: '1rem',
};

const presetCardStyle = (selected: boolean): React.CSSProperties => ({
  padding: '0.75rem',
  backgroundColor: selected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(30, 41, 59, 0.6)',
  border: `2px solid ${selected ? '#38bdf8' : 'rgba(148, 163, 184, 0.2)'}`,
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  textAlign: 'center',
  boxShadow: selected ? '0 0 20px rgba(56, 189, 248, 0.3)' : 'none',
});

const presetLabelStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  fontWeight: 600,
  color: '#e2e8f0',
  marginBottom: '0.2rem',
};

const presetDescStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  color: '#94a3b8',
};

const buttonRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
  marginTop: '0.75rem',
};

// Unused style helper - kept for future use
// const buttonStyle = (variant: 'primary' | 'secondary' | 'ghost'): React.CSSProperties => {
//   const baseStyle: React.CSSProperties = {
//     padding: '0.75rem 1.5rem',
//     borderRadius: '8px',
//     fontSize: '0.9rem',
//     fontWeight: 600,
//     textTransform: 'uppercase',
//     letterSpacing: '0.05em',
//     cursor: 'pointer',
//     transition: 'all 0.2s ease',
//     border: 'none',
//     outline: 'none',
//   };
//
//   if (variant === 'primary') {
//     return {
//       ...baseStyle,
//       backgroundColor: '#38bdf8',
//       color: '#0f172a',
//       flex: 1,
//       boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)',
//     };
//   }
//
//   if (variant === 'secondary') {
//     return {
//       ...baseStyle,
//       backgroundColor: 'rgba(148, 163, 184, 0.2)',
//       color: '#e2e8f0',
//       border: '1px solid rgba(148, 163, 184, 0.3)',
//     };
//   }
//
//   return {
//     ...baseStyle,
//     backgroundColor: 'transparent',
//     color: '#94a3b8',
//     border: '1px solid rgba(148, 163, 184, 0.2)',
//   };
// };

const errorStyle: React.CSSProperties = {
  color: '#ef4444',
  fontSize: '0.75rem',
  marginTop: '-1rem',
  marginBottom: '1rem',
};

const attributeRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.4rem 0.6rem',
  backgroundColor: 'rgba(30, 41, 59, 0.6)',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  borderRadius: '6px',
  marginBottom: '0.4rem',
};

const attributeLabelStyle: React.CSSProperties = {
  flex: 1,
};

const attributeNameStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#e2e8f0',
  letterSpacing: '0.05em',
};

const attributeDescStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  color: '#94a3b8',
  marginTop: '0.15rem',
};

const attributeControlsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
};

const attributeButtonStyle = (disabled: boolean): React.CSSProperties => ({
  width: '28px',
  height: '28px',
  borderRadius: '6px',
  backgroundColor: disabled ? 'rgba(148, 163, 184, 0.1)' : 'rgba(56, 189, 248, 0.2)',
  border: `1px solid ${disabled ? 'rgba(148, 163, 184, 0.2)' : 'rgba(56, 189, 248, 0.4)'}`,
  color: disabled ? '#64748b' : '#38bdf8',
  fontSize: '1rem',
  fontWeight: 700,
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  outline: 'none',
});

const attributeValueStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 700,
  color: '#38bdf8',
  minWidth: '30px',
  textAlign: 'center',
  fontFamily: "'DM Mono', monospace",
};

const pointsDisplayStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '0.6rem',
  backgroundColor: 'rgba(56, 189, 248, 0.1)',
  border: '1px solid rgba(56, 189, 248, 0.3)',
  borderRadius: '6px',
  marginBottom: '0.8rem',
};

// Unused style - kept for future use
// const pointsValueStyle: React.CSSProperties = {
//   fontSize: '1.3rem',
//   fontWeight: 700,
//   color: '#38bdf8',
//   textShadow: '0 0 10px rgba(56, 189, 248, 0.5)',
// };

const pointsLabelStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginTop: '0.2rem',
};

const derivedStatsStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '0.4rem',
  marginBottom: '0.8rem',
};

const derivedStatCardStyle: React.CSSProperties = {
  padding: '0.4rem 0.5rem',
  backgroundColor: 'rgba(30, 41, 59, 0.6)',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  borderRadius: '6px',
};

const derivedStatLabelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.25rem',
};

const derivedStatValueStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 700,
  color: '#38bdf8',
  fontFamily: "'DM Mono', monospace",
};

const CharacterCreationScreen: React.FC<CharacterCreationScreenProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [visualPreset, setVisualPreset] = useState('');
  const [nameError, setNameError] = useState('');

  // Step 2: Attributes
  const [attributes, setAttributes] = useState<PlayerSkills>({
    strength: 5,
    perception: 5,
    endurance: 5,
    charisma: 5,
    intelligence: 5,
    agility: 5,
    luck: 5
  });
  const [pointsRemaining, setPointsRemaining] = useState(5);
  const [allocationError, setAllocationError] = useState('');
  const [selectedBackgroundId, setSelectedBackgroundId] = useState('');
  const [backgroundError, setBackgroundError] = useState('');

  const validateName = (value: string): boolean => {
    if (value.length < 3) {
      setNameError('Name must be at least 3 characters');
      return false;
    }
    if (value.length > 20) {
      setNameError('Name must be at most 20 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9\s-]+$/.test(value)) {
      setNameError('Name can only contain letters, numbers, spaces, and hyphens');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (value.length > 0) {
      validateName(value);
    } else {
      setNameError('');
    }
  };

  const handleRandomize = () => {
    const randomName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    const randomPreset = VISUAL_PRESETS[Math.floor(Math.random() * VISUAL_PRESETS.length)].id;
    setName(randomName);
    setVisualPreset(randomPreset);
    setNameError('');
  };

  const handleAttributeChange = (attribute: keyof PlayerSkills, delta: number) => {
    const currentValue = attributes[attribute];
    const newValue = currentValue + delta;

    // Validate range (1-10)
    if (newValue < 1 || newValue > 10) {
      return;
    }

    // Check point budget
    if (delta > 0 && pointsRemaining <= 0) {
      return;
    }

    setAttributes({ ...attributes, [attribute]: newValue });
    setPointsRemaining((prev) => prev - delta);
    if (allocationError) {
      setAllocationError('');
    }
  };

  const handleStep1Next = () => {
    if (!validateName(name)) {
      return;
    }
    if (!visualPreset) {
      return;
    }
    setStep(2);
  };

  const handleStep2Back = () => {
    setStep(1);
  };

  const handleStep2Next = () => {
    if (pointsRemaining > 0) {
      setAllocationError('Spend all remaining attribute points before proceeding.');
      return;
    }
    setBackgroundError('');
    setStep(3);
  };

  const handleSkipCreation = () => {
    // Debug shortcut: apply defaults
    onComplete({
      name: 'Operative',
      visualPreset: 'operative',
      attributes: {
        strength: 5,
        perception: 5,
        endurance: 5,
        charisma: 5,
        intelligence: 5,
        agility: 5,
        luck: 5
      },
      backgroundId: 'corpsec_defector',
    });
  };

  const canProceedStep1 = name.length >= 3 && visualPreset && !nameError;
  const canProceedStep2 = pointsRemaining === 0;

  const derivedStats = calculateDerivedStats(attributes);

  const buildAttributeTooltip = (attribute: keyof PlayerSkills, value: number): string => {
    switch (attribute) {
      case 'strength':
        return `Carry ${25 + value * 5}kg, melee bonus +${Math.floor(value / 2)}`;
      case 'perception':
        return `Hit bonus ${(value - 5) * 3}%`; 
      case 'endurance':
        return `Max HP ${50 + value * 10}`;
      case 'charisma':
        return `Dialogue bonus +${Math.floor(value / 2)}`;
      case 'intelligence':
        return `Skill points per level ${3 + Math.floor(value / 3)}`;
      case 'agility':
        return `Base AP ${6 + Math.floor((value - 5) * 0.5)}, dodge ${(value - 5) * 2}%`;
      case 'luck':
        return `Luck boosts crits (+${value * 2}%) and random events`;
      default:
        return '';
    }
  };

  const lowAttrWarnings: string[] = [];
  if (attributes.endurance <= 2) {
    lowAttrWarnings.push('Endurance below 3 – expect severely reduced health.');
  }
  if (attributes.agility <= 2) {
    lowAttrWarnings.push('Agility below 3 limits action points and evasion.');
  }


  return (
    <div style={containerStyle}>
      <div style={panelStyle}>
        <h1 style={titleStyle}>Character Creation</h1>
        <p style={subtitleStyle}>
          {step === 1 && "Define your operative's identity"}
          {step === 2 && "Allocate your attributes"}
          {step === 3 && "Choose your background"}
        </p>

        <div style={stepIndicatorStyle}>
          <div style={stepDotStyle(step === 1)} />
          <div style={stepDotStyle(step === 2)} />
          <div style={stepDotStyle(step === 3)} />
        </div>

        {/* Step 1: Identity */}
        {step === 1 && (
          <>
            <div>
              <label style={labelStyle}>Call Sign</label>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Enter your operative name..."
                style={inputStyle}
                maxLength={20}
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && canProceedStep1) {
                    handleStep1Next();
                  }
                }}
              />
              {nameError && <div style={errorStyle}>{nameError}</div>}
            </div>

            <div>
              <label style={labelStyle}>Visual Profile</label>
              <div style={presetGridStyle}>
                {VISUAL_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    style={presetCardStyle(visualPreset === preset.id)}
                    onClick={() => setVisualPreset(preset.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setVisualPreset(preset.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div style={presetLabelStyle}>{preset.label}</div>
                    <div style={presetDescStyle}>{preset.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={buttonRowStyle}>
              <EnhancedButton
                onClick={onCancel}
                variant="secondary"
                size="medium"
              >
                Cancel
              </EnhancedButton>
              <EnhancedButton
                onClick={handleRandomize}
                variant="secondary"
                size="medium"
                icon="🎲"
              >
                Randomize
              </EnhancedButton>
              <EnhancedButton
                onClick={handleStep1Next}
                variant="primary"
                size="medium"
                disabled={!canProceedStep1}
                title={!canProceedStep1 ? 'Complete all fields to proceed' : 'Continue to next step'}
              >
                Continue
              </EnhancedButton>
            </div>

            {/* Debug shortcut - only in development */}
            {process.env.NODE_ENV === 'development' && (
              <div style={{ marginTop: '1rem', opacity: 0.5 }}>
                <EnhancedButton
                  onClick={handleSkipCreation}
                  variant="secondary"
                  size="small"
                  fullWidth
                >
                  Skip Creation (Dev)
                </EnhancedButton>
              </div>
            )}
          </>
        )}

        {/* Step 2: Attributes */}
        {step === 2 && (
          <>
            <div style={{ ...pointsDisplayStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
              <NotificationBadge count={pointsRemaining} color="#38bdf8" size={28} pulse={pointsRemaining > 0} />
              <div style={pointsLabelStyle}>Points Remaining</div>
            </div>

            <div>
              <label style={labelStyle}>SPECIAL Attributes</label>
              {ATTRIBUTE_ORDER.map((attr) => (
                <div key={attr} style={attributeRowStyle} title={buildAttributeTooltip(attr, attributes[attr])}>
                  <div style={attributeLabelStyle}>
                    <div style={attributeNameStyle}>{ATTRIBUTE_INFO[attr].label}</div>
                    <div style={attributeDescStyle}>{ATTRIBUTE_INFO[attr].description}</div>
                  </div>
                  <div style={attributeControlsStyle}>
                    <button
                      onClick={() => handleAttributeChange(attr, -1)}
                      disabled={attributes[attr] <= 1}
                      style={attributeButtonStyle(attributes[attr] <= 1)}
                      title="Decrease attribute"
                    >
                      −
                    </button>
                    <div style={attributeValueStyle}>{attributes[attr]}</div>
                    <button
                      onClick={() => handleAttributeChange(attr, 1)}
                      disabled={attributes[attr] >= 10 || pointsRemaining <= 0}
                      style={attributeButtonStyle(attributes[attr] >= 10 || pointsRemaining <= 0)}
                      title="Increase attribute"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {allocationError && <div style={{ ...errorStyle, marginTop: '0.5rem' }}>{allocationError}</div>}
            {lowAttrWarnings.length > 0 && (
              <div style={{
                backgroundColor: 'rgba(248, 113, 113, 0.1)',
                border: '1px solid rgba(248, 113, 113, 0.4)',
                borderRadius: '8px',
                padding: '0.65rem',
                color: '#f87171',
                fontSize: '0.75rem',
                marginBottom: '1rem'
              }}>
                {lowAttrWarnings.map((msg) => (
                  <div key={msg}>{msg}</div>
                ))}
              </div>
            )}

            <div>
              <label style={labelStyle}>Derived Stats</label>
              <div style={derivedStatsStyle}>
                <div style={derivedStatCardStyle}>
                  <div style={derivedStatLabelStyle}>Max HP</div>
                  <div style={derivedStatValueStyle}>{derivedStats.maxHP}</div>
                </div>
                <div style={derivedStatCardStyle}>
                  <div style={derivedStatLabelStyle}>Base AP</div>
                  <div style={derivedStatValueStyle}>{derivedStats.baseAP}</div>
                </div>
                <div style={derivedStatCardStyle}>
                  <div style={derivedStatLabelStyle}>Carry Weight</div>
                  <div style={derivedStatValueStyle}>{derivedStats.carryWeight} kg</div>
                </div>
                <div style={derivedStatCardStyle}>
                  <div style={derivedStatLabelStyle}>Crit Chance</div>
                  <div style={derivedStatValueStyle}>{derivedStats.criticalChance}%</div>
                </div>
                <div style={derivedStatCardStyle}>
                  <div style={derivedStatLabelStyle}>Hit Bonus</div>
                  <div style={derivedStatValueStyle}>{derivedStats.hitChanceModifier}%</div>
                </div>
                <div style={derivedStatCardStyle}>
                  <div style={derivedStatLabelStyle}>Dodge Bonus</div>
                  <div style={derivedStatValueStyle}>{derivedStats.dodgeChance}%</div>
                </div>
              </div>
            </div>

            <div style={buttonRowStyle}>
              <EnhancedButton
                onClick={handleStep2Back}
                variant="secondary"
                size="medium"
              >
                Back
              </EnhancedButton>
              <EnhancedButton
                onClick={handleStep2Next}
                variant="primary"
                size="medium"
                disabled={!canProceedStep2}
                title={!canProceedStep2 ? 'Spend all points to proceed' : 'Continue to next step'}
              >
                Continue
              </EnhancedButton>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.75rem',
              marginBottom: '1rem',
              maxHeight: '60vh',
              overflowY: 'auto',
            }}>
              {BACKGROUNDS.map((background) => {
                const selected = selectedBackgroundId === background.id;
                return (
                  <div
                    key={background.id}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: selected ? '2px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.25)',
                      background: selected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                      boxShadow: selected ? '0 0 25px rgba(56, 189, 248, 0.25)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                    onClick={() => {
                      setSelectedBackgroundId(background.id);
                      setBackgroundError('');
                    }}
                    role="button"
                    tabIndex={0}
                    data-testid={`background-card-${background.id}`}
                    aria-label={`${background.name} background`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedBackgroundId(background.id);
                        setBackgroundError('');
                      }
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.6rem', color: '#94a3b8', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{background.tagline}</span>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>{background.name}</h3>
                      {background.description.map((line) => (
                        <p key={line} style={{ fontSize: '0.68rem', color: '#94a3b8', margin: 0, lineHeight: 1.3 }}>{line}</p>
                      ))}
                    </div>
                    {background.perk && (
                      <div>
                        <span style={{ fontSize: '0.6rem', color: '#22d3ee', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Starting Perk</span>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#38bdf8' }}>{background.perk.name}</div>
                        <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: '0.15rem 0 0', lineHeight: 1.3 }}>{background.perk.description}</p>
                      </div>
                    )}
                    <div>
                      <span style={{ fontSize: '0.6rem', color: '#f472b6', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Faction Standing</span>
                      <ul style={{ margin: '0.2rem 0 0', paddingLeft: '1rem', color: '#cbd5e1', fontSize: '0.65rem', lineHeight: 1.4 }}>
                        {['resistance', 'corpsec', 'scavengers'].map((faction) => {
                          const delta = background.factionAdjustments[faction as 'resistance' | 'corpsec' | 'scavengers'] ?? 0;
                          const label = faction === 'corpsec' ? 'CorpSec' : faction === 'scavengers' ? 'Scavengers' : 'Resistance';
                          return (
                            <li key={`${background.id}-${faction}`}>{label}: {delta >= 0 ? '+' : ''}{delta}</li>
                          );
                        })}
                      </ul>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.6rem', color: '#a855f7', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Starting Gear</span>
                      <ul style={{ margin: '0.2rem 0 0', paddingLeft: '1rem', color: '#cbd5e1', fontSize: '0.65rem', lineHeight: 1.4 }}>
                        {background.startingEquipment.map((equip) => (
                          <li key={`${background.id}-${equip.name}`}>{equip.name}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>

            {backgroundError && (
              <div style={{ ...errorStyle, marginTop: 0 }}>{backgroundError}</div>
            )}

            <div style={buttonRowStyle}>
              <EnhancedButton
                onClick={() => setStep(2)}
                variant="secondary"
                size="medium"
              >
                Back
              </EnhancedButton>
              <EnhancedButton
                onClick={() => {
                  if (!selectedBackgroundId) {
                    setBackgroundError('Select a background to proceed.');
                    return;
                  }
                  onComplete({ name, visualPreset, attributes, backgroundId: selectedBackgroundId });
                }}
                variant="success"
                size="medium"
                disabled={!selectedBackgroundId}
                title={!selectedBackgroundId ? 'Select a background to confirm' : 'Begin mission'}
                icon="▶"
              >
                Confirm & Start
              </EnhancedButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CharacterCreationScreen;
