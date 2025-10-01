import React, { useState } from 'react';
import { PlayerSkills } from '../../game/interfaces/types';
import { calculateDerivedStats } from '../../game/systems/statCalculations';

interface CharacterCreationScreenProps {
  onComplete: (data: CharacterCreationData) => void;
  onCancel: () => void;
}

export interface CharacterCreationData {
  name: string;
  visualPreset: string;
  attributes?: PlayerSkills;
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
  padding: '2rem',
  maxWidth: '600px',
  width: '90%',
  maxHeight: '90vh',
  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 100px rgba(56, 189, 248, 0.1)',
  overflowY: 'auto',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
  color: '#38bdf8',
  marginBottom: '0.5rem',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  textShadow: '0 0 20px rgba(56, 189, 248, 0.5)',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#94a3b8',
  marginBottom: '1.5rem',
  letterSpacing: '0.05em',
};

const stepIndicatorStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  marginBottom: '1.5rem',
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
  marginBottom: '0.5rem',
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  backgroundColor: 'rgba(15, 23, 42, 0.8)',
  border: '1px solid rgba(148, 163, 184, 0.3)',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: '1rem',
  fontFamily: "'DM Mono', monospace",
  marginBottom: '1.5rem',
  outline: 'none',
  transition: 'border-color 0.2s ease',
};

const presetGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '1rem',
  marginBottom: '1.5rem',
};

const presetCardStyle = (selected: boolean): React.CSSProperties => ({
  padding: '1rem',
  backgroundColor: selected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(30, 41, 59, 0.6)',
  border: `2px solid ${selected ? '#38bdf8' : 'rgba(148, 163, 184, 0.2)'}`,
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  textAlign: 'center',
  boxShadow: selected ? '0 0 20px rgba(56, 189, 248, 0.3)' : 'none',
});

const presetLabelStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 600,
  color: '#e2e8f0',
  marginBottom: '0.25rem',
};

const presetDescStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#94a3b8',
};

const buttonRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
  marginTop: '1rem',
};

const buttonStyle = (variant: 'primary' | 'secondary' | 'ghost'): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    outline: 'none',
  };

  if (variant === 'primary') {
    return {
      ...baseStyle,
      backgroundColor: '#38bdf8',
      color: '#0f172a',
      flex: 1,
      boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)',
    };
  }

  if (variant === 'secondary') {
    return {
      ...baseStyle,
      backgroundColor: 'rgba(148, 163, 184, 0.2)',
      color: '#e2e8f0',
      border: '1px solid rgba(148, 163, 184, 0.3)',
    };
  }

  return {
    ...baseStyle,
    backgroundColor: 'transparent',
    color: '#94a3b8',
    border: '1px solid rgba(148, 163, 184, 0.2)',
  };
};

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
  padding: '0.5rem',
  backgroundColor: 'rgba(30, 41, 59, 0.6)',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  borderRadius: '8px',
  marginBottom: '0.5rem',
};

const attributeLabelStyle: React.CSSProperties = {
  flex: 1,
};

const attributeNameStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#e2e8f0',
  letterSpacing: '0.05em',
};

const attributeDescStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  color: '#94a3b8',
  marginTop: '0.2rem',
};

const attributeControlsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
};

const attributeButtonStyle = (disabled: boolean): React.CSSProperties => ({
  width: '32px',
  height: '32px',
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
  padding: '0.75rem',
  backgroundColor: 'rgba(56, 189, 248, 0.1)',
  border: '1px solid rgba(56, 189, 248, 0.3)',
  borderRadius: '8px',
  marginBottom: '1rem',
};

const pointsValueStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
  color: '#38bdf8',
  textShadow: '0 0 10px rgba(56, 189, 248, 0.5)',
};

const pointsLabelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginTop: '0.25rem',
};

const derivedStatsStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '0.5rem',
  marginBottom: '1rem',
};

const derivedStatCardStyle: React.CSSProperties = {
  padding: '0.5rem',
  backgroundColor: 'rgba(30, 41, 59, 0.6)',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  borderRadius: '8px',
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
    setPointsRemaining(pointsRemaining - delta);
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
      return; // Cannot proceed with unspent points
    }
    // Step 3 placeholder - for now complete immediately
    onComplete({ name, visualPreset, attributes });
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
      }
    });
  };

  const canProceedStep1 = name.length >= 3 && visualPreset && !nameError;
  const canProceedStep2 = pointsRemaining === 0;

  const derivedStats = calculateDerivedStats(attributes);

  return (
    <div style={containerStyle}>
      <div style={panelStyle}>
        <h1 style={titleStyle}>Character Creation</h1>
        <p style={subtitleStyle}>
          {step === 1 && "Define your operative's identity"}
          {step === 2 && "Allocate your attributes"}
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
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
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
              <button
                onClick={onCancel}
                style={buttonStyle('ghost')}
              >
                Cancel
              </button>
              <button
                onClick={handleRandomize}
                style={buttonStyle('secondary')}
              >
                Randomize
              </button>
              <button
                onClick={handleStep1Next}
                style={buttonStyle('primary')}
                disabled={!canProceedStep1}
                title={!canProceedStep1 ? 'Complete all fields to proceed' : 'Continue to next step'}
              >
                Continue
              </button>
            </div>

            {/* Debug shortcut - only in development */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={handleSkipCreation}
                style={{
                  ...buttonStyle('ghost'),
                  marginTop: '1rem',
                  width: '100%',
                  fontSize: '0.7rem',
                  opacity: 0.5,
                }}
              >
                Skip Creation (Dev)
              </button>
            )}
          </>
        )}

        {/* Step 2: Attributes */}
        {step === 2 && (
          <>
            <div style={pointsDisplayStyle}>
              <div style={pointsValueStyle}>{pointsRemaining}</div>
              <div style={pointsLabelStyle}>Points Remaining</div>
            </div>

            <div>
              <label style={labelStyle}>SPECIAL Attributes</label>
              {ATTRIBUTE_ORDER.map((attr) => (
                <div key={attr} style={attributeRowStyle}>
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
              </div>
            </div>

            <div style={buttonRowStyle}>
              <button
                onClick={handleStep2Back}
                style={buttonStyle('ghost')}
              >
                Back
              </button>
              <button
                onClick={handleStep2Next}
                style={buttonStyle('primary')}
                disabled={!canProceedStep2}
                title={!canProceedStep2 ? 'Spend all points to proceed' : 'Continue to next step'}
              >
                Continue
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CharacterCreationScreen;
