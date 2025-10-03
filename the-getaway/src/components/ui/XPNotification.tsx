import React, { useEffect, useState } from 'react';
import { gradientTextStyle } from './theme';

export interface XPNotificationData {
  id: string;
  amount: number;
  reason: string;
}

interface XPNotificationProps {
  notification: XPNotificationData;
  onComplete: (id: string) => void;
}

export const XPNotification: React.FC<XPNotificationProps> = ({ notification, onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in
    setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onComplete(notification.id), 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [notification.id, onComplete]);

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: '80px',
    right: '20px',
    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.95), rgba(22, 163, 74, 0.95))',
    border: '2px solid rgba(74, 222, 128, 0.6)',
    borderRadius: '12px',
    padding: '1rem 1.5rem',
    minWidth: '200px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 40px rgba(34, 197, 94, 0.3)',
    zIndex: 9998,
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateX(0)' : 'translateX(100px)',
    transition: 'all 0.3s ease-out',
    pointerEvents: 'none'
  };

  const amountStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 900,
    marginBottom: '0.25rem',
    ...gradientTextStyle('#f0fdf4', '#d1fae5'),
    filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))',
  };

  const reasonStyle: React.CSSProperties = {
    fontSize: '0.9rem',
    color: '#dcfce7',
    fontWeight: 500
  };

  return (
    <div style={containerStyle}>
      <div style={amountStyle}>+{notification.amount} XP</div>
      <div style={reasonStyle}>{notification.reason}</div>
    </div>
  );
};

interface XPNotificationManagerProps {
  notifications: XPNotificationData[];
  onDismiss: (id: string) => void;
}

export const XPNotificationManager: React.FC<XPNotificationManagerProps> = ({
  notifications,
  onDismiss
}) => {
  return (
    <>
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            position: 'fixed',
            top: `${80 + index * 90}px`,
            right: '20px',
            zIndex: 9998
          }}
        >
          <XPNotification notification={notification} onComplete={onDismiss} />
        </div>
      ))}
    </>
  );
};
