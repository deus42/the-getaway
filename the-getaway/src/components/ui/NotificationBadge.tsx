import React from 'react';

interface NotificationBadgeProps {
  count: number;
  color?: string;
  size?: number;
  pulse?: boolean;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  color = '#ef4444',
  size = 20,
  pulse = true,
}) => {
  if (count <= 0) {
    return null;
  }

  const badgeStyle: React.CSSProperties = {
    minWidth: `${size}px`,
    height: `${size}px`,
    padding: '0 4px',
    borderRadius: '999px',
    background: `linear-gradient(135deg, ${color}, ${color}dd)`,
    border: `1.5px solid ${color}`,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${size * 0.55}px`,
    fontWeight: 800,
    color: '#ffffff',
    boxShadow: `0 0 12px ${color}aa, 0 4px 8px rgba(0, 0, 0, 0.4)`,
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.6)',
    letterSpacing: '-0.02em',
    animation: pulse ? 'notificationPulse 2s ease-in-out infinite' : 'none',
  };

  return (
    <>
      <style>{`
        @keyframes notificationPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 12px ${color}aa, 0 4px 8px rgba(0, 0, 0, 0.4);
          }
          50% {
            transform: scale(1.15);
            box-shadow: 0 0 20px ${color}ff, 0 6px 12px rgba(0, 0, 0, 0.5);
          }
        }
      `}</style>
      <span style={badgeStyle}>{count > 99 ? '99+' : count}</span>
    </>
  );
};

export default NotificationBadge;
