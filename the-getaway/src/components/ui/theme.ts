import React from 'react';
import { dystopianTokens } from '../../theme/dystopianTokens';

const { colors, fonts, surfaces } = dystopianTokens;

export const neonPalette = {
  slate: colors.background,
  slateSoft: colors.backgroundAlt,
  cyan: colors.accent,
  cyanSoft: 'rgba(75, 231, 207, 0.28)',
  amber: colors.warning,
  amberSoft: colors.warningSoft,
  violet: colors.accentSecondary,
  violetSoft: 'rgba(43, 197, 249, 0.28)',
  emerald: colors.accentSoft,
  textPrimary: colors.foreground,
  textSecondary: colors.foregroundSubtle,
  textMuted: colors.foregroundMuted,
};

export const panelSurface = {
  background: surfaces.panel,
  border: `1px solid ${colors.panelBorder}`,
  boxShadow: '0 36px 48px -28px rgba(31, 197, 170, 0.32)',
  backdropFilter: 'blur(16px)',
};

export const characterPanelSurface: React.CSSProperties = {
  background: 'rgba(12, 18, 24, 0.68)',
  borderRadius: '12px',
  border: `1px solid ${colors.divider}`,
  padding: '0.8rem',
  boxShadow: 'inset 0 1px 0 rgba(115, 140, 155, 0.3)',
};

export const characterPanelHeaderStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.14rem',
};

export const characterPanelLabelStyle: React.CSSProperties = {
  fontSize: '0.52rem',
  letterSpacing: '0.19em',
  textTransform: 'uppercase',
  color: colors.foregroundMuted,
  fontFamily: fonts.badge,
};

export const characterPanelTitleStyle: React.CSSProperties = {
  fontSize: '0.72rem',
  fontWeight: 600,
  letterSpacing: '0.05em',
  color: colors.foreground,
  margin: 0,
  fontFamily: fonts.heading,
};

export const cardSurface = {
  background: surfaces.card,
  border: `1px solid ${colors.cardBorder}`,
  boxShadow: '0 18px 32px -22px rgba(36, 180, 186, 0.35)',
};

export const badgeSurface = (accent: string) => ({
  border: `1px solid ${accent}`,
  color: accent,
  background: surfaces.badge,
  fontFamily: fonts.badge,
  letterSpacing: '0.1em',
});

export const headingStyle: React.CSSProperties = {
  fontFamily: fonts.heading,
  textTransform: 'uppercase',
  letterSpacing: '0.24em',
  color: neonPalette.textPrimary,
  fontSize: '0.78rem',
};

export const subheadingStyle: React.CSSProperties = {
  fontFamily: fonts.body,
  letterSpacing: '0.16em',
  color: neonPalette.textMuted,
  fontSize: '0.64rem',
  textTransform: 'uppercase',
};

export const statValueStyle: React.CSSProperties = {
  fontFamily: fonts.body,
  fontSize: '0.85rem',
  fontWeight: 700,
  color: neonPalette.textPrimary,
};

export const subtleText: React.CSSProperties = {
  fontFamily: fonts.body,
  fontSize: '0.62rem',
  color: neonPalette.textMuted,
};

// Enhanced Typography Styles
export const gradientTextStyle = (color1: string, color2: string): React.CSSProperties => ({
  background: `linear-gradient(135deg, ${color1}, ${color2})`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
});

export const glowTextStyle = (color: string, intensity: number = 8): React.CSSProperties => ({
  textShadow: `0 0 ${intensity}px ${color}, 0 0 ${intensity * 2}px ${color}40`,
});

export const readableTextStyle: React.CSSProperties = {
  textShadow: '0 2px 4px rgba(0, 0, 0, 0.6), 0 1px 2px rgba(0, 0, 0, 0.8)',
};

export const importantValueStyle = (color: string): React.CSSProperties => ({
  ...statValueStyle,
  color,
  textShadow: `0 0 12px ${color}80, 0 0 6px ${color}40`,
  fontWeight: 800,
});

export const headingGradientStyle: React.CSSProperties = {
  ...headingStyle,
  background: `linear-gradient(135deg, ${colors.accentGlow}, ${colors.accentSecondary})`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  textShadow: 'none',
  filter: 'drop-shadow(0 0 8px rgba(75, 231, 207, 0.3))',
};
