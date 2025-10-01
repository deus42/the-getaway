import React, { useState } from 'react';

interface CharacterCreationScreenProps {
  onComplete: (data: CharacterCreationData) => void;
  onCancel: () => void;
}

export interface CharacterCreationData {
  name: string;
  visualPreset: string;
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
  padding: '2.5rem',
  maxWidth: '600px',
  width: '90%',
  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 100px rgba(56, 189, 248, 0.1)',
};

const titleStyle: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 700,
  color: '#38bdf8',
  marginBottom: '0.5rem',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  textShadow: '0 0 20px rgba(56, 189, 248, 0.5)',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  color: '#94a3b8',
  marginBottom: '2rem',
  letterSpacing: '0.05em',
};

const stepIndicatorStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  marginBottom: '2rem',
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
  gap: '1rem',
  marginTop: '2rem',
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

const CharacterCreationScreen: React.FC<CharacterCreationScreenProps> = ({ onComplete, onCancel }) => {
  const [step] = useState(1); // Will be used when Steps 2-3 are added in 22b/22c
  const [name, setName] = useState('');
  const [visualPreset, setVisualPreset] = useState('');
  const [nameError, setNameError] = useState('');

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

  const handleNext = () => {
    if (!validateName(name)) {
      return;
    }
    if (!visualPreset) {
      return;
    }
    // For now, Step 1 is the only step, so complete immediately
    onComplete({ name, visualPreset });
  };

  const handleSkipCreation = () => {
    // Debug shortcut: apply defaults
    onComplete({
      name: 'Operative',
      visualPreset: 'operative',
    });
  };

  const canProceed = name.length >= 3 && visualPreset && !nameError;

  return (
    <div style={containerStyle}>
      <div style={panelStyle}>
        <h1 style={titleStyle}>Character Creation</h1>
        <p style={subtitleStyle}>Define your operative's identity</p>

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
                  if (e.key === 'Enter' && canProceed) {
                    handleNext();
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
                onClick={handleNext}
                style={buttonStyle('primary')}
                disabled={!canProceed}
                title={!canProceed ? 'Complete all fields to proceed' : 'Continue to next step'}
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
      </div>
    </div>
  );
};

export default CharacterCreationScreen;
