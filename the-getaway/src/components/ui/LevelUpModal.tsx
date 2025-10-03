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

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  newLevel,
  skillPointsEarned,
  attributePointsEarned,
  perksUnlocked,
  onContinue
}) => {
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    animation: 'fadeIn 0.3s ease-in'
  };

  const modalStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.98))',
    border: '3px solid rgba(56, 189, 248, 0.6)',
    borderRadius: '20px',
    padding: '3rem',
    maxWidth: '600px',
    width: '90%',
    textAlign: 'center',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7), 0 0 100px rgba(56, 189, 248, 0.2)',
    animation: 'slideUp 0.4s ease-out'
  };

  const bannerStyle: React.CSSProperties = {
    fontSize: '3rem',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.2rem',
    marginBottom: '1rem',
    animation: 'pulse 1.5s ease-in-out infinite',
    ...gradientTextStyle('#bfdbfe', '#38bdf8'),
    filter: 'drop-shadow(0 0 30px rgba(56, 189, 248, 0.8)) drop-shadow(0 0 60px rgba(56, 189, 248, 0.4))',
  };

  const levelStyle: React.CSSProperties = {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#94a3b8',
    marginBottom: '2rem'
  };

  const rewardsContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '2rem'
  };

  const rewardItemStyle: React.CSSProperties = {
    background: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    borderRadius: '12px',
    padding: '1rem',
    fontSize: '1.1rem',
    color: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  };

  const highlightStyle: React.CSSProperties = {
    color: '#38bdf8',
    fontWeight: 700
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={bannerStyle}>Level Up!</div>
        <div style={levelStyle}>Level {newLevel}</div>

        <div style={rewardsContainerStyle}>
          {skillPointsEarned > 0 && (
            <div style={rewardItemStyle}>
              <span>Skill Points Earned:</span>
              <span style={highlightStyle}>+{skillPointsEarned}</span>
            </div>
          )}

          {attributePointsEarned > 0 && (
            <div style={rewardItemStyle}>
              <span>Attribute Points Earned:</span>
              <span style={highlightStyle}>+{attributePointsEarned}</span>
            </div>
          )}

          {perksUnlocked > 0 && (
            <div style={rewardItemStyle}>
              <span style={highlightStyle}>New Perks Available!</span>
            </div>
          )}

          <div style={rewardItemStyle}>
            <span>Health fully restored</span>
          </div>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <EnhancedButton
            onClick={onContinue}
            variant="primary"
            size="large"
          >
            Continue
          </EnhancedButton>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.9;
          }
        }
      `}</style>
    </div>
  );
};
