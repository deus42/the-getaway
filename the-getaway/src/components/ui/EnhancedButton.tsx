import React, { useState } from 'react';

interface EnhancedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: string;
}

const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  fullWidth = false,
  icon,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const variantColors = {
    primary: {
      bg: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
      border: '#38bdf8',
      glow: 'rgba(56, 189, 248, 0.6)',
      text: '#0b1120',
    },
    secondary: {
      bg: 'linear-gradient(135deg, rgba(148, 163, 184, 0.3), rgba(100, 116, 139, 0.4))',
      border: 'rgba(148, 163, 184, 0.5)',
      glow: 'rgba(148, 163, 184, 0.4)',
      text: '#f8fafc',
    },
    danger: {
      bg: 'linear-gradient(135deg, #ef4444, #dc2626)',
      border: '#ef4444',
      glow: 'rgba(239, 68, 68, 0.6)',
      text: '#ffffff',
    },
    success: {
      bg: 'linear-gradient(135deg, #34d399, #10b981)',
      border: '#34d399',
      glow: 'rgba(52, 211, 153, 0.6)',
      text: '#0b1120',
    },
  };

  const sizePadding = {
    small: '0.3rem 0.6rem',
    medium: '0.5rem 1rem',
    large: '0.7rem 1.4rem',
  };

  const sizeFontSize = {
    small: '0.7rem',
    medium: '0.8rem',
    large: '0.95rem',
  };

  const colors = variantColors[variant];

  const baseStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: sizePadding[size],
    fontSize: sizeFontSize[size],
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: colors.text,
    background: disabled ? 'rgba(100, 116, 139, 0.3)' : colors.bg,
    border: `1.5px solid ${disabled ? 'rgba(148, 163, 184, 0.3)' : colors.border}`,
    borderRadius: '999px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    textShadow: disabled ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.4)',
    boxShadow: disabled
      ? 'none'
      : isPressed
        ? `inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 8px ${colors.glow}`
        : isHovered
          ? `0 0 20px ${colors.glow}, 0 6px 16px rgba(0, 0, 0, 0.4)`
          : `0 0 12px ${colors.glow}80, 0 4px 8px rgba(0, 0, 0, 0.3)`,
    transform: disabled ? 'none' : isPressed ? 'translateY(1px) scale(0.98)' : isHovered ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    width: fullWidth ? '100%' : 'auto',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '1.1em',
    filter: disabled ? 'none' : `drop-shadow(0 0 4px ${colors.glow})`,
  };

  return (
    <>
      <style>{`
        @keyframes buttonRipple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
      <button
        type="button"
        onClick={disabled ? undefined : onClick}
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsPressed(false);
        }}
        onMouseDown={() => !disabled && setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        style={baseStyle}
        disabled={disabled}
      >
        {icon && <span style={iconStyle}>{icon}</span>}
        {children}
      </button>
    </>
  );
};

export default EnhancedButton;
