export const dystopianTokens = {
  colors: {
    background: '#0b0d10',
    backgroundAlt: '#12151b',
    backgroundDeep: '#060a10',
    foreground: '#d7e3ea',
    foregroundMuted: '#7f8d99',
    accent: '#4be7cf',
    accentSoft: 'rgba(75, 231, 207, 0.16)',
    accentGlow: 'rgba(75, 231, 207, 0.45)',
    accentSecondary: '#2bc5f9',
    warning: '#ffd479',
    warningSoft: 'rgba(255, 212, 121, 0.22)',
    terminal: '#ffb86b',
    divider: 'rgba(62, 88, 94, 0.55)',
    panelBorder: 'rgba(74, 126, 123, 0.38)',
    cardBorder: 'rgba(82, 135, 150, 0.26)',
    overlay: 'rgba(10, 16, 21, 0.72)',
  },
  fonts: {
    body: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    mono: "'JetBrains Mono', 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
    heading: "'Space Grotesk', 'Inter', system-ui, sans-serif",
    badge: "'JetBrains Mono', 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  },
  motion: {
    hoverScale: 1.04,
    hoverDuration: 150,
    hoverEase: 'cubic-bezier(0.19, 1, 0.22, 1)',
    focusFlickerDuration: 180,
  },
  effects: {
    filmGrainOpacity: 0.07,
    filmGrainBlend: 'soft-light',
    scanlineOpacity: 0.08,
    scanlineSpacing: 2,
  },
  surfaces: {
    stage:
      'radial-gradient(circle at 28% -10%, rgba(43, 197, 249, 0.12), transparent 55%), ' +
      'radial-gradient(circle at 80% 0%, rgba(75, 231, 207, 0.12), transparent 60%), ' +
      'linear-gradient(180deg, rgba(6, 10, 16, 0.94), rgba(4, 8, 12, 0.98))',
    panel: 'linear-gradient(140deg, rgba(14, 20, 28, 0.9), rgba(10, 16, 24, 0.88))',
    panelEdge: 'linear-gradient(180deg, rgba(18, 24, 32, 0.76), rgba(10, 16, 24, 0.9))',
    card: 'linear-gradient(135deg, rgba(12, 18, 26, 0.92), rgba(9, 14, 20, 0.9))',
    badge: 'rgba(75, 231, 207, 0.16)',
    badgeBorder: 'rgba(75, 231, 207, 0.5)',
    tooltip: 'rgba(8, 12, 18, 0.92)',
  },
} as const;

export type DystopianTokens = typeof dystopianTokens;
