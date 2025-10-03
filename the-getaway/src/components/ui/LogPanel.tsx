import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

interface MessageType {
  icon: string;
  color: string;
  borderColor: string;
  glowColor: string;
}

const getMessageType = (msg: string): MessageType => {
  const lowerMsg = msg.toLowerCase();

  // Combat messages
  if (lowerMsg.includes('damage') || lowerMsg.includes('hit') || lowerMsg.includes('attack') ||
      lowerMsg.includes('defeated') || lowerMsg.includes('miss')) {
    return { icon: '⚔️', color: '#f87171', borderColor: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.3)' };
  }

  // Dialogue/NPC messages
  if (lowerMsg.includes('says') || lowerMsg.includes('whispers') || lowerMsg.includes('shouts') ||
      lowerMsg.includes('dialogue') || lowerMsg.includes('conversation')) {
    return { icon: '💬', color: '#a78bfa', borderColor: '#8b5cf6', glowColor: 'rgba(139, 92, 246, 0.3)' };
  }

  // Loot/Item messages
  if (lowerMsg.includes('found') || lowerMsg.includes('picked up') || lowerMsg.includes('looted') ||
      lowerMsg.includes('received') || lowerMsg.includes('acquired')) {
    return { icon: '🎁', color: '#fbbf24', borderColor: '#f59e0b', glowColor: 'rgba(245, 158, 11, 0.3)' };
  }

  // Quest/Objective messages
  if (lowerMsg.includes('objective') || lowerMsg.includes('quest') || lowerMsg.includes('mission')) {
    return { icon: '📋', color: '#34d399', borderColor: '#10b981', glowColor: 'rgba(16, 185, 129, 0.3)' };
  }

  // System messages (default)
  return { icon: '⚙️', color: '#60a5fa', borderColor: '#3b82f6', glowColor: 'rgba(59, 130, 246, 0.3)' };
};

const LogPanel: React.FC = () => {
  const messages = useSelector((state: RootState) => state.log.messages);
  const logEndRef = useRef<HTMLDivElement>(null);
  const [animatingIndices, setAnimatingIndices] = useState<Set<number>>(new Set());
  const prevMessageCountRef = useRef(messages.length);

  // Scroll to bottom when messages update
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Track new messages for animation
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      const newIndices = new Set(animatingIndices);
      for (let i = prevMessageCountRef.current; i < messages.length; i++) {
        newIndices.add(i);
      }
      setAnimatingIndices(newIndices);

      // Remove animation class after animation completes
      const timer = setTimeout(() => {
        setAnimatingIndices(new Set());
      }, 600);

      prevMessageCountRef.current = messages.length;
      return () => clearTimeout(timer);
    }
  }, [messages, animatingIndices]);

  return (
    <>
      <style>{`
        @keyframes slideInFade {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .log-entry-animate {
          animation: slideInFade 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .log-entry {
          transition: background-color 0.2s ease;
        }

        .log-entry:hover {
          background-color: rgba(56, 189, 248, 0.08);
        }
      `}</style>
      <div
        style={{
          flexGrow: 1,
          background: 'transparent',
          padding: '0',
          borderRadius: '0.25rem',
          overflowY: 'auto',
          fontSize: '0.68rem',
          color: '#e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
        }}
      >
        {messages.map((msg, index) => {
          const messageType = getMessageType(msg);
          const isAnimating = animatingIndices.has(index);

          return (
            <div
              key={`${index}-${msg.substring(0, 20)}`}
              className={`log-entry ${isAnimating ? 'log-entry-animate' : ''}`}
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
              >
                {messageType.icon}
              </span>
              <p
                style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: messageType.color,
                  lineHeight: '1.4',
                  fontFamily: '"DM Sans", "Inter", sans-serif',
                  letterSpacing: '0.02em',
                }}
              >
                {msg}
              </p>
            </div>
          );
        })}
        {/* Empty div to target for scrolling */}
        <div ref={logEndRef} />
      </div>
    </>
  );
};

export default LogPanel;
