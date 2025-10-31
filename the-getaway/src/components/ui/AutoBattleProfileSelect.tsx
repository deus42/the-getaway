import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { CSSProperties } from 'react';
import type { AutoBattleProfileId } from '../../game/combat/automation/autoBattleProfiles';

export type AutoBattleMenuOptionId = AutoBattleProfileId | 'manual';

export interface AutoBattleProfileOption {
  id: AutoBattleMenuOptionId;
  name: string;
  summary: string;
}

export type AutoBattleProfileSelectVariant = 'hud' | 'menu';

interface AutoBattleProfileSelectProps {
  value: AutoBattleMenuOptionId;
  options: AutoBattleProfileOption[];
  onChange: (next: AutoBattleMenuOptionId) => void;
  variant?: AutoBattleProfileSelectVariant;
  fullWidth?: boolean;
  dataFocusIgnore?: boolean;
  triggerId?: string;
}

const palette = {
  borderDefault: 'rgba(56,189,248,0.24)',
  borderActive: 'rgba(99,102,241,0.7)',
  borderHover: 'rgba(56,189,248,0.45)',
  background: 'linear-gradient(140deg, rgba(10,17,30,0.96), rgba(11,25,46,0.86))',
  backgroundPressed: 'linear-gradient(140deg, rgba(17,28,49,0.98), rgba(15,34,58,0.92))',
  listBackground: 'rgba(9,15,26,0.98)',
  shadowRest: '0 14px 28px rgba(8,13,23,0.52)',
  shadowActive: '0 18px 36px rgba(14,30,52,0.58)',
  textPrimary: '#f0f6ff',
  textSubtle: '#8da2c0',
  textMuted: '#6b7a94',
  accent: 'rgba(56,189,248,0.24)',
  accentStrong: 'rgba(56,189,248,0.32)',
  accentSolid: '#38bdf8',
};

const variantConfig: Record<
  AutoBattleProfileSelectVariant,
  {
    width: CSSProperties['width'];
    triggerPadding: string;
    triggerFontSize: string;
    optionFontSize: string;
    summaryFontSize: string;
    optionPadding: string;
    maxListHeight: number;
  }
> = {
  hud: {
    width: '100%',
    triggerPadding: '0.65rem 0.85rem',
    triggerFontSize: '0.85rem',
    optionFontSize: '0.85rem',
    summaryFontSize: '0.7rem',
    optionPadding: '0.55rem 0.7rem',
    maxListHeight: 220,
  },
  menu: {
    width: 'min(320px, 100%)',
    triggerPadding: '0.75rem 1rem',
    triggerFontSize: '0.92rem',
    optionFontSize: '0.92rem',
    summaryFontSize: '0.72rem',
    optionPadding: '0.6rem 0.85rem',
    maxListHeight: 260,
  },
};

const arrowStyle: CSSProperties = {
  position: 'absolute',
  top: '50%',
  right: '0.9rem',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
  fontSize: '0.8rem',
  transition: 'transform 0.18s ease',
  color: palette.textSubtle,
};

const makeOptionStyle = ({
  config,
  isHighlighted,
  isSelected,
}: {
  config: (typeof variantConfig)[AutoBattleProfileSelectVariant];
  isHighlighted: boolean;
  isSelected: boolean;
}): CSSProperties => ({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '0.25rem',
  border: 'none',
  borderRadius: '9px',
  padding: config.optionPadding,
  background:
    isSelected || isHighlighted
      ? 'linear-gradient(135deg, rgba(56,189,248,0.22), rgba(59,130,246,0.18))'
      : 'transparent',
  color: palette.textPrimary,
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'background 0.15s ease, color 0.15s ease, transform 0.12s ease',
  transform: isHighlighted ? 'translateX(4px)' : 'translateX(0)',
});

const makeOptionSummaryStyle = (config: (typeof variantConfig)[AutoBattleProfileSelectVariant]): CSSProperties => ({
  fontSize: config.summaryFontSize,
  lineHeight: 1.4,
  color: palette.textMuted,
});

const AutoBattleProfileSelect: React.FC<AutoBattleProfileSelectProps> = ({
  value,
  options,
  onChange,
  variant = 'hud',
  fullWidth = false,
  dataFocusIgnore = false,
  triggerId,
}) => {
  const ids = useId();
  const listboxId = `${ids}-autobattle-profiles`;
  const config = variantConfig[variant];

  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionsRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(() =>
    Math.max(
      options.findIndex((option) => option.id === value),
      0
    )
  );
  const shouldClampListHeight = options.length > 4;

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!containerRef.current || !target) {
        return;
      }
      if (!containerRef.current.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setHighlightedIndex(
        Math.max(
          options.findIndex((option) => option.id === value),
          0
        )
      );
    }
  }, [open, options, value]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const list = optionsRef.current;
    if (!list) {
      return;
    }

    const optionNode = list.querySelector<HTMLButtonElement>(
      `[data-option-index="${highlightedIndex}"]`
    );
    optionNode?.scrollIntoView({ block: 'nearest' });
  }, [open, highlightedIndex]);

  const selectedOption = useMemo(
    () => options.find((option) => option.id === value) ?? options[0],
    [options, value]
  );

  const handleSelect = useCallback(
    (profileId: AutoBattleProfileId) => {
      setOpen(false);
      if (profileId !== value) {
        onChange(profileId);
      }
      triggerRef.current?.focus();
    },
    [onChange, value]
  );

  const handleToggle = useCallback(() => {
    setOpen((previous) => !previous);
  }, []);

  const incrementHighlight = useCallback(
    (direction: 1 | -1) => {
      setOpen(true);
      setHighlightedIndex((previous) => {
        if (options.length === 0) {
          return previous;
        }
        const nextIndex = (previous + direction + options.length) % options.length;
        return nextIndex;
      });
    },
    [options.length]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        incrementHighlight(1);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        incrementHighlight(-1);
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!open) {
          setOpen(true);
          return;
        }
        const option = options[highlightedIndex];
        if (option) {
          handleSelect(option.id);
        }
        return;
      }
      if (event.key === 'Escape' && open) {
        event.preventDefault();
        setOpen(false);
      }
    },
    [highlightedIndex, incrementHighlight, open, options, handleSelect]
  );

  const containerStyle: CSSProperties = {
    position: 'relative',
    width: fullWidth ? '100%' : config.width,
    pointerEvents: 'auto',
  };

  const triggerStyle: CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.6rem',
    borderRadius: '12px',
    border: `1px solid ${open ? palette.borderActive : palette.borderDefault}`,
    background: open ? palette.backgroundPressed : palette.background,
    color: palette.textPrimary,
    padding: config.triggerPadding,
    fontSize: config.triggerFontSize,
    lineHeight: 1.4,
    cursor: 'pointer',
    transition:
      'border-color 0.18s ease, background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
    boxShadow: open ? palette.shadowActive : palette.shadowRest,
    textAlign: 'left',
  };

  const listStyle: CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 'calc(100% + 0.45rem)',
    borderRadius: '12px',
    border: `1px solid ${palette.borderHover}`,
    background: palette.listBackground,
    boxShadow: '0 24px 54px rgba(8,14,26,0.65)',
    padding: shouldClampListHeight ? '0.45rem' : '0.35rem 0.4rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    maxHeight: shouldClampListHeight ? `${config.maxListHeight}px` : undefined,
    overflowY: shouldClampListHeight ? 'auto' : 'hidden',
    opacity: open ? 1 : 0,
    pointerEvents: open ? 'auto' : 'none',
    transform: open ? 'translateY(0)' : 'translateY(-6px)',
    transition: 'opacity 0.16s ease, transform 0.18s ease',
    zIndex: 20,
  };

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      data-controller-focus-ignore={dataFocusIgnore ? 'true' : undefined}
    >
      <button
        type="button"
        ref={triggerRef}
        id={triggerId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        style={triggerStyle}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
      >
        <span>{selectedOption?.name}</span>
        <span
          style={{
            ...arrowStyle,
            transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
          }}
        >
          ▾
        </span>
      </button>

      <div
        ref={optionsRef}
        id={listboxId}
        role="listbox"
        aria-activedescendant={
          open ? `${listboxId}-${options[highlightedIndex]?.id ?? 'inactive'}` : undefined
        }
        style={listStyle}
      >
        {options.map((option, index) => {
          const isSelected = option.id === value;
          const isHighlighted = index === highlightedIndex;

          return (
            <button
              key={option.id}
              type="button"
              role="option"
              id={`${listboxId}-${option.id}`}
              data-option-index={index}
              aria-selected={isSelected}
              style={makeOptionStyle({
                config,
                isHighlighted,
                isSelected,
              })}
              onMouseEnter={() => setHighlightedIndex(index)}
              onFocus={() => setHighlightedIndex(index)}
              onMouseDown={(event) => {
                // Keep focus on trigger for consistent keyboard handling
                event.preventDefault();
              }}
              onClick={() => handleSelect(option.id)}
            >
              <span style={{ fontSize: config.optionFontSize, fontWeight: isSelected ? 600 : 500 }}>
                {option.name}
              </span>
              <span style={makeOptionSummaryStyle(config)}>{option.summary}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AutoBattleProfileSelect;
