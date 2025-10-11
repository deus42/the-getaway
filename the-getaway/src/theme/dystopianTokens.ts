export const dystopianTokens = {
  colors: {
    background: '#0b0d10',
    backgroundAlt: '#12151b',
    backgroundDeep: '#050709',
    foreground: '#d7e3ea',
    foregroundSubtle: '#9aabb6',
    foregroundMuted: '#61707a',
    accent: '#4be7cf',
    accentSoft: '#2fd6c0',
    accentGlow: '#73ffe2',
    accentSecondary: '#2bc5f9',
    warning: '#ffd479',
    warningSoft: 'rgba(255, 212, 121, 0.28)',
    terminalAmber: '#ffb86b',
    terminalAmberSoft: 'rgba(255, 184, 107, 0.28)',
    panelBorder: 'rgba(119, 209, 197, 0.32)',
    cardBorder: 'rgba(115, 199, 232, 0.22)',
    divider: 'rgba(53, 68, 79, 0.6)',
    overlay: 'rgba(18, 22, 29, 0.7)',
  },
  fonts: {
    body: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    mono:
      "'JetBrains Mono', 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
    heading: "'Space Grotesk', 'Inter', system-ui, sans-serif",
    badge: "'JetBrains Mono', 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  },
  motion: {
    hoverScale: 1.03,
    hoverDuration: 140,
    hoverEase: 'cubic-bezier(0.25, 0.96, 0.45, 1)',
    focusFlickerDuration: 180,
  },
  effects: {
    filmGrainOpacity: 0.08,
    bloomStrength: 0.16,
    scanlineOpacity: 0.65,
    scanlineSpacing: 2,
  },
  surfaces: {
    stage: 'radial-gradient(circle at top, rgba(19, 28, 36, 0.78), rgba(8, 12, 18, 0.94))',
    panel: 'linear-gradient(140deg, rgba(8, 16, 22, 0.92), rgba(6, 18, 24, 0.86))',
    panelEdge: 'linear-gradient(180deg, rgba(22, 34, 42, 0.6), rgba(10, 18, 24, 0.82))',
    card: 'linear-gradient(135deg, rgba(12, 20, 26, 0.94), rgba(9, 16, 22, 0.9))',
    badge: 'rgba(75, 231, 207, 0.12)',
    badgeBorder: 'rgba(75, 231, 207, 0.55)',
    tooltip: 'rgba(12, 18, 24, 0.92)',
  },
} as const;

export type DystopianTokens = typeof dystopianTokens;
