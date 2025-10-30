import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

type MessageKind = 'combat' | 'dialogue' | 'loot' | 'mission' | 'system';

interface MessageStyle {
  icon: string;
  textClass: string;
  containerClass: string;
}

const MESSAGE_STYLES: Record<MessageKind, MessageStyle> = {
  combat: {
    icon: '⚔️',
    textClass: 'text-[#f87171]',
    containerClass: 'hud-log-entry text-[#f87171]',
  },
  dialogue: {
    icon: '💬',
    textClass: 'text-[#c4b5fd]',
    containerClass: 'hud-log-entry text-[#c4b5fd]',
  },
  loot: {
    icon: '🎁',
    textClass: 'text-[#facc15]',
    containerClass: 'hud-log-entry text-[#facc15]',
  },
  mission: {
    icon: '📋',
    textClass: 'text-[#34d399]',
    containerClass: 'hud-log-entry text-[#34d399]',
  },
  system: {
    icon: '⚙️',
    textClass: 'text-[#60a5fa]',
    containerClass: 'hud-log-entry text-[#60a5fa]',
  },
};

const resolveMessageKind = (message: string): MessageKind => {
  const lower = message.toLowerCase();
  if (/\b(damage|hit|attack|defeated|miss)\b/.test(lower)) return 'combat';
  if (/\b(says|whispers|shouts|dialogue|conversation)\b/.test(lower)) return 'dialogue';
  if (/\b(found|picked up|looted|received|acquired)\b/.test(lower)) return 'loot';
  if (/\b(objective|quest|mission)\b/.test(lower)) return 'mission';
  return 'system';
};

const LogPanel: React.FC = () => {
  const messages = useSelector((state: RootState) => state.log.messages);
  const containerRef = useRef<HTMLDivElement>(null);
  const [animating, setAnimating] = useState<Set<number>>(new Set<number>());
  const previousCountRef = useRef(messages.length);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (messages.length > previousCountRef.current) {
      const next = new Set<number>();
      for (let i = previousCountRef.current; i < messages.length; i += 1) {
        next.add(i);
      }
      setAnimating(next);
      const timer = window.setTimeout(() => setAnimating(new Set<number>()), 600);
      previousCountRef.current = messages.length;
      return () => window.clearTimeout(timer);
    }
    previousCountRef.current = messages.length;
    return undefined;
  }, [messages]);

  return (
    <div ref={containerRef} className="hud-log">
      {messages.map((message, index) => {
        const kind = resolveMessageKind(message);
        const style = MESSAGE_STYLES[kind];
        const isNew = animating.has(index);

        return (
          <article
            key={`${index}-${message.slice(0, 24)}`}
            className={`${style.containerClass}${isNew ? ' log-entry-animate' : ''}`}
            data-kind={kind}
          >
            <span className="hud-log-entry__icon">{style.icon}</span>
            <p className={`hud-log-entry__body ${style.textClass}`}>
              {message}
            </p>
          </article>
        );
      })}
      {messages.length === 0 && (
        <div className="hud-log-empty">
          Awaiting event telemetry...
        </div>
      )}
    </div>
  );
};

export default React.memo(LogPanel);
