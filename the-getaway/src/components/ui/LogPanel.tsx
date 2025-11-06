import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

type MessageType = {
  icon: string;
  color: string;
  borderColor: string;
  glowColor: string;
};

const getMessageType = (message: string): MessageType => {
  const lower = message.toLowerCase();
  if (/\b(damage|hit|attack|defeated|miss)\b/.test(lower)) {
    return { icon: '⚔️', color: '#f87171', borderColor: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.3)' };
  }
  if (/\b(says|whispers|shouts|dialogue|conversation)\b/.test(lower)) {
    return { icon: '💬', color: '#a78bfa', borderColor: '#8b5cf6', glowColor: 'rgba(139, 92, 246, 0.3)' };
  }
  if (/\b(found|picked up|looted|received|acquired)\b/.test(lower)) {
    return { icon: '🎁', color: '#fbbf24', borderColor: '#f59e0b', glowColor: 'rgba(245, 158, 11, 0.3)' };
  }
  if (/\b(objective|quest|mission)\b/.test(lower)) {
    return { icon: '📋', color: '#34d399', borderColor: '#10b981', glowColor: 'rgba(16, 185, 129, 0.3)' };
  }
  return { icon: '⚙️', color: '#60a5fa', borderColor: '#3b82f6', glowColor: 'rgba(59, 130, 246, 0.3)' };
};

const LogPanel: React.FC = () => {
  const messages = useSelector((state: RootState) => state.log.messages);
  const containerRef = useRef<HTMLDivElement>(null);
  const [animating, setAnimating] = useState<Set<number>>(new Set());
  const previousCountRef = useRef(messages.length);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (messages.length > previousCountRef.current) {
      const next = new Set<number>();
      for (let i = previousCountRef.current; i < messages.length; i += 1) {
        next.add(i);
      }
      setAnimating(next);
      const timer = window.setTimeout(() => setAnimating(new Set()), 600);
      previousCountRef.current = messages.length;
      return () => window.clearTimeout(timer);
    }
    previousCountRef.current = messages.length;
    return undefined;
  }, [messages]);

  return (
    <>
      <style>{`
        @keyframes slideInFade {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .log-entry-animate { animation: slideInFade 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        .log-entry { transition: background-color 0.2s ease; }
        .log-entry:hover { background-color: rgba(56, 189, 248, 0.08); }
      `}</style>
      <div
        ref={containerRef}
        style={{
          flexGrow: 1,
          background: 'transparent',
          padding: 0,
          borderRadius: '0.25rem',
          overflowY: 'auto',
          fontSize: '0.68rem',
          color: '#e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
        }}
      >
        {messages.map((message, index) => {
          const messageType = getMessageType(message);
          const isAnimating = animating.has(index);
          return (
            <div
              key={`${index}-${message.slice(0, 24)}`}
              className={`log-entry${isAnimating ? ' log-entry-animate' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                padding: '0.5rem 0.6rem',
                borderRadius: '8px',
                border: `1px solid ${messageType.borderColor}30`,
                background: 'rgba(15, 23, 42, 0.4)',
                boxShadow: `0 2px 8px ${messageType.glowColor}`,
                backdropFilter: 'blur(4px)',
              }}
            >
              <span
                style={{
                  fontSize: '0.85rem',
                  flexShrink: 0,
                  filter: `drop-shadow(0 0 4px ${messageType.color})`,
                  marginTop: '0.05rem',
                }}
                aria-hidden="true"
              >
                {messageType.icon}
              </span>
              <p
                style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: messageType.color,
                  lineHeight: 1.4,
                  fontFamily: '"DM Sans","Inter",sans-serif',
                  letterSpacing: '0.02em',
                }}
              >
                {message}
              </p>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div
            style={{
              padding: '0.8rem 0.6rem',
              textAlign: 'center',
              color: 'rgba(148, 163, 184, 0.75)',
              fontSize: '0.64rem',
              letterSpacing: '0.08em',
            }}
          >
            Awaiting event telemetry...
          </div>
        )}
      </div>
    </>
  );
};

export default React.memo(LogPanel);
