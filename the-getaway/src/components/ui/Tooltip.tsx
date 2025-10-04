import React, {
  CSSProperties,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  wrapperStyle?: CSSProperties;
}

export interface TooltipContentProps {
  title: string;
  description?: React.ReactNode;
  lines?: string[];
  meta?: string[];
  footer?: React.ReactNode;
}

const tooltipContentTitleStyle: React.CSSProperties = {
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#38bdf8',
  fontSize: '0.76rem',
};

const tooltipContentDescriptionStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  color: 'rgba(226, 232, 240, 0.85)',
};

const tooltipContentListStyle: React.CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.2rem',
  fontSize: '0.7rem',
  color: 'rgba(148, 163, 184, 0.95)',
};

const tooltipContentMetaStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.4rem',
  fontSize: '0.7rem',
  color: 'rgba(148, 163, 184, 0.9)',
};

const tooltipContentFooterStyle: React.CSSProperties = {
  fontSize: '0.68rem',
  color: 'rgba(148, 163, 184, 0.75)',
};

export const TooltipContent: React.FC<TooltipContentProps> = ({ title, description, lines, meta, footer }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
    <div style={tooltipContentTitleStyle}>{title}</div>
    {description && <div style={tooltipContentDescriptionStyle}>{description}</div>}
    {lines && lines.length > 0 && (
      <ul style={tooltipContentListStyle}>
        {lines.map((line) => (
          <li key={line}>• {line}</li>
        ))}
      </ul>
    )}
    {meta && meta.length > 0 && (
      <div style={tooltipContentMetaStyle}>
        {meta.map((item, index) => (
          <React.Fragment key={`${item}-${index}`}>
            {index > 0 && <span aria-hidden="true">•</span>}
            <span>{item}</span>
          </React.Fragment>
        ))}
      </div>
    )}
    {footer && <div style={tooltipContentFooterStyle}>{footer}</div>}
  </div>
);

const Tooltip: React.FC<TooltipProps> = ({ content, children, wrapperStyle }) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const anchorRectRef = useRef<DOMRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const portalNodeRef = useRef<HTMLDivElement | null>(null);

  const ensurePortal = () => {
    if (portalNodeRef.current) {
      return portalNodeRef.current;
    }
    const node = document.createElement('div');
    node.style.position = 'relative';
    node.style.zIndex = '11001';
    document.body.appendChild(node);
    portalNodeRef.current = node;
    return node;
  };

  const computePosition = useCallback((rect: DOMRect) => {
    const margin = 12;
    const tooltipNode = tooltipRef.current;
    const tooltipWidth = tooltipNode?.offsetWidth ?? 0;
    const tooltipHeight = tooltipNode?.offsetHeight ?? 0;

    const anchorCenterX = rect.left + rect.width / 2;
    const desiredLeft = anchorCenterX - tooltipWidth / 2;
    const clampedLeft = Math.min(
      Math.max(desiredLeft, margin),
      window.innerWidth - tooltipWidth - margin
    );

    const desiredTop = rect.top - tooltipHeight - 10;
    const clampedTop = Math.max(desiredTop, margin);

    return { left: clampedLeft, top: clampedTop };
  }, []);

  const updatePosition = useCallback(() => {
    const anchorRect = anchorRectRef.current;
    if (!anchorRect) {
      return;
    }

    const next = computePosition(anchorRect);
    setPosition((current) => {
      if (
        Math.abs(current.left - next.left) < 0.5 &&
        Math.abs(current.top - next.top) < 0.5
      ) {
        return current;
      }
      return next;
    });
  }, [computePosition]);

  const showTooltip = (rect: DOMRect | null) => {
    if (!rect) {
      return;
    }
    ensurePortal();
    anchorRectRef.current = rect;
    setPosition(computePosition(rect));
    setVisible(true);
  };

  const hideTooltip = () => {
    setVisible(false);
  };

  const handleMouseEnter = (event: React.MouseEvent<HTMLDivElement>) => {
    showTooltip(event.currentTarget.getBoundingClientRect());
  };

  const handleFocus = (event: React.FocusEvent<HTMLDivElement>) => {
    showTooltip(event.currentTarget.getBoundingClientRect());
  };

  useEffect(() => {
    ensurePortal();
    return () => {
      if (portalNodeRef.current) {
        document.body.removeChild(portalNodeRef.current);
        portalNodeRef.current = null;
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (!visible) {
      return;
    }

    updatePosition();

    const handleScroll = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        anchorRectRef.current = rect;
        updatePosition();
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [visible, content, updatePosition]);

  useLayoutEffect(() => {
    if (visible) {
      updatePosition();
    }
  });

  const tooltipStyle: CSSProperties = {
    position: 'fixed',
    left: `${position.left}px`,
    top: `${position.top}px`,
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    color: '#e2e8f0',
    padding: '0.55rem 0.85rem',
    borderRadius: '8px',
    fontSize: '0.75rem',
    lineHeight: 1.45,
    maxWidth: '320px',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
    pointerEvents: 'none',
    zIndex: 11001,
    opacity: visible ? 1 : 0,
    transition: 'opacity 0.15s ease',
    whiteSpace: 'normal',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    textAlign: 'left',
  };

  const portal = visible && portalNodeRef.current
    ? createPortal(
        <div ref={tooltipRef} style={tooltipStyle}>
          {content}
        </div>,
        portalNodeRef.current
      )
    : null;

  return (
    <>
      <div
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={hideTooltip}
        onFocus={handleFocus}
        onBlur={hideTooltip}
        style={wrapperStyle}
      >
        {children}
      </div>
      {portal}
    </>
  );
};

export default Tooltip;
