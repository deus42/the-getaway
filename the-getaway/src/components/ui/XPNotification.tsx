import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { glowTextStyle, neonPalette } from './theme';
import { PLAYER_SCREEN_POSITION_EVENT, PlayerScreenPositionDetail } from '../../game/events';

export interface XPNotificationData {
  id: string;
  amount: number;
  reason: string;
}

interface XPNotificationProps {
  notification: XPNotificationData;
  onComplete: (id: string) => void;
}

const STACK_SPACING = 40;

const computeAnchor = (detail: PlayerScreenPositionDetail | null): { x: number; y: number } | null => {
  if (typeof window === 'undefined' || !detail) {
    return null;
  }

  const canvas = document.querySelector<HTMLCanvasElement>('canvas');
  if (!canvas) {
    return null;
  }

  const rect = canvas.getBoundingClientRect();
  const baseWidth = detail.canvasWidth || rect.width || 1;
  const baseHeight = detail.canvasHeight || rect.height || 1;
  const ratioX = detail.screenX / baseWidth;
  const ratioY = detail.screenY / baseHeight;

  return {
    x: rect.left + ratioX * rect.width,
    y: rect.top + ratioY * rect.height,
  };
};

const usePlayerAnchor = (): { x: number; y: number } | null => {
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const lastDetailRef = useRef<PlayerScreenPositionDetail | null>(null);

  const updateAnchor = useCallback((detail: PlayerScreenPositionDetail | null) => {
    lastDetailRef.current = detail;
    const next = computeAnchor(detail);
    if (next) {
      setAnchor(next);
    }
  }, []);

  useEffect(() => {
    const handle = (event: Event) => {
      const custom = event as CustomEvent<PlayerScreenPositionDetail>;
      updateAnchor(custom.detail);
    };

    window.addEventListener(PLAYER_SCREEN_POSITION_EVENT, handle as EventListener);
    return () => window.removeEventListener(PLAYER_SCREEN_POSITION_EVENT, handle as EventListener);
  }, [updateAnchor]);

  useEffect(() => {
    const handleResize = () => {
      if (lastDetailRef.current) {
        updateAnchor(lastDetailRef.current);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateAnchor]);

  return anchor;
};

export const XPNotification: React.FC<XPNotificationProps> = ({ notification, onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setIsVisible(true), 12);

    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onComplete(notification.id), 240);
    }, 2600);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [notification.id, onComplete]);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '0.45rem 0.65rem 0.55rem',
    minWidth: 'fit-content',
    background:
      'linear-gradient(160deg, rgba(10, 19, 36, 0.92) 0%, rgba(14, 116, 144, 0.68) 100%)',
    border: '1px solid rgba(56, 189, 248, 0.42)',
    borderRadius: '12px',
    boxShadow: '0 14px 22px -16px rgba(13, 148, 136, 0.55)',
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
    transition: 'opacity 0.22s ease-out, transform 0.22s ease-out',
    pointerEvents: 'none',
  };

  const amountStyle: React.CSSProperties = {
    fontSize: '1rem',
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: neonPalette.textPrimary,
    ...glowTextStyle(neonPalette.cyan, 6),
  };

  const reasonStyle: React.CSSProperties = {
    fontSize: '0.58rem',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'rgba(226, 232, 240, 0.78)',
    textAlign: 'center' as const,
  };

  const pointerStyle: React.CSSProperties = {
    width: 0,
    height: 0,
    borderLeft: '5px solid transparent',
    borderRight: '5px solid transparent',
    borderTop: '6px solid rgba(56, 189, 248, 0.55)',
    opacity: isVisible ? 1 : 0,
    transition: 'opacity 0.2s ease-out',
    margin: '0 auto',
  };

  return (
    <div>
      <div style={containerStyle}>
        <span style={amountStyle}>+{notification.amount} xp</span>
        <span style={reasonStyle}>{notification.reason}</span>
      </div>
      <div style={pointerStyle} />
    </div>
  );
};

interface XPNotificationManagerProps {
  notifications: XPNotificationData[];
  onDismiss: (id: string) => void;
}

export const XPNotificationManager: React.FC<XPNotificationManagerProps> = ({
  notifications,
  onDismiss,
}) => {
  const anchor = usePlayerAnchor();

  const fallbackPosition = useMemo(() => {
    if (typeof window === 'undefined') {
      return { right: 32, top: 72 } as const;
    }
    return { right: 32, top: 72 } as const;
  }, []);

  return (
    <>
      {notifications.map((notification, index) => {
        const wrapperStyle: React.CSSProperties = anchor
          ? {
              position: 'fixed',
              left: anchor.x,
              top: anchor.y,
              transform: `translate(-50%, -120%) translateY(${-index * STACK_SPACING}px)`,
              zIndex: 9998,
              pointerEvents: 'none',
            }
          : {
              position: 'fixed',
              right: `${fallbackPosition.right}px`,
              top: `${fallbackPosition.top + index * STACK_SPACING}px`,
              zIndex: 9998,
              pointerEvents: 'none',
            };

        return (
          <div key={notification.id} style={wrapperStyle}>
            <XPNotification notification={notification} onComplete={onDismiss} />
          </div>
        );
      })}
    </>
  );
};
