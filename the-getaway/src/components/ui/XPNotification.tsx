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

const STACK_SPACING = 24;

const computeAnchor = (detail: PlayerScreenPositionDetail | null): { x: number; y: number } | null => {
  if (!detail) {
    return null;
  }

  const scaleX = detail.canvasDisplayWidth / (detail.canvasWidth || 1);
  const scaleY = detail.canvasDisplayHeight / (detail.canvasHeight || 1);

  return {
    x: detail.canvasLeft + detail.screenX * scaleX,
    y: detail.canvasTop + detail.screenY * scaleY,
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
    if (typeof window !== 'undefined') {
      const initial = window.__getawayPlayerScreenPosition;
      if (initial) {
        updateAnchor(initial);
      }
    }
  }, [updateAnchor]);

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
    const showTimer = setTimeout(() => setIsVisible(true), 10);
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onComplete(notification.id), 200);
    }, 2200);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [notification.id, onComplete]);

  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.28rem',
    padding: '0.28rem 0.45rem',
    minWidth: 'fit-content',
    background: 'linear-gradient(150deg, rgba(7, 13, 26, 0.92) 0%, rgba(12, 148, 136, 0.58) 100%)',
    border: '1px solid rgba(56, 189, 248, 0.45)',
    borderRadius: '999px',
    boxShadow: '0 10px 18px -16px rgba(13, 148, 136, 0.55)',
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
    transition: 'opacity 0.18s ease-out, transform 0.18s ease-out',
    pointerEvents: 'none',
  };

  const amountStyle: React.CSSProperties = {
    fontSize: '0.9rem',
    fontWeight: 800,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: neonPalette.textPrimary,
    ...glowTextStyle(neonPalette.cyan, 6),
  };

  const badgeStyle: React.CSSProperties = {
    fontSize: '0.55rem',
    fontWeight: 700,
    letterSpacing: '0.24em',
    textTransform: 'uppercase',
    color: 'rgba(148, 233, 255, 0.92)',
  };

  return (
    <div style={containerStyle}>
      <span style={amountStyle}>+{notification.amount}</span>
      <span style={badgeStyle}>XP</span>
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
  const fallbackPosition = useMemo(() => ({ right: 28, top: 72 } as const), []);

  return (
    <>
      {notifications.map((notification, index) => {
        const wrapperStyle: React.CSSProperties = anchor && typeof window !== 'undefined'
          ? (() => {
              const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
              const viewportWidth = window.innerWidth || fallbackPosition.right * 2;
              const viewportHeight = window.innerHeight || fallbackPosition.top * 2;
              const safeX = clamp(anchor.x, 24, viewportWidth - 24);
              const safeY = clamp(anchor.y, 24, viewportHeight - 24);
              const anchoredTop = clamp(safeY - 56 - index * STACK_SPACING, 16, viewportHeight - 16);
              return {
                position: 'fixed',
                left: safeX,
                top: anchoredTop,
                transform: 'translateX(-50%)',
                zIndex: 9998,
                pointerEvents: 'none',
              } as React.CSSProperties;
            })()
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
