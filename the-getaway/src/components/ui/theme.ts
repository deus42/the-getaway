import React from 'react';
import { dystopianTokens } from '../../theme/dystopianTokens';

const { colors, fonts, surfaces } = dystopianTokens;

export const neonPalette = {
  slate: colors.backgroundAlt,
  slateSoft: 'rgba(18, 24, 32, 0.86)',
  cyan: colors.accent,
  cyanSoft: colors.accentSoft,
  amber: colors.warning,
  amberSoft: colors.warningSoft,
  violet: '#b998ff',
  violetSoft: 'rgba(185, 152, 255, 0.24)',
  emerald: '#5de2b4',
  textPrimary: colors.foreground,
  textSecondary: '#aec0cc',
  textMuted: colors.foregroundMuted,
};

export const panelSurface = {
  background: surfaces.panel,
  border: `1px solid ${colors.panelBorder}`,
  boxShadow: '0 28px 48px rgba(4, 8, 12, 0.65)',
  backdropFilter: 'blur(10px)',
};

export const characterPanelSurface: React.CSSProperties = {
  background: 'linear-gradient(185deg, rgba(12, 18, 26, 0.8), rgba(8, 14, 20, 0.92))',
  borderRadius: '12px',
  border: `1px solid ${colors.cardBorder}`,
  padding: '0.8rem',
  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
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
  boxShadow: '0 16px 30px -18px rgba(8, 14, 20, 0.65)',
};

export const badgeSurface = (accent: string) => ({
  border: `1px solid ${accent}`,
  color: accent,
  background: 'rgba(8, 14, 20, 0.7)',
  fontFamily: fonts.badge,
});

export const headingStyle: React.CSSProperties = {
  fontFamily: fonts.heading,
  textTransform: 'uppercase',
  letterSpacing: '0.24em',
  color: colors.foreground,
  fontSize: '0.78rem',
};

export const subheadingStyle: React.CSSProperties = {
  fontFamily: fonts.body,
  letterSpacing: '0.16em',
  color: colors.foregroundMuted,
  fontSize: '0.64rem',
  textTransform: 'uppercase',
};

export const statValueStyle: React.CSSProperties = {
  fontFamily: fonts.mono,
  fontSize: '0.85rem',
  fontWeight: 600,
  color: colors.foreground,
};

export const subtleText: React.CSSProperties = {
  fontFamily: fonts.body,
  fontSize: '0.62rem',
  color: colors.foregroundMuted,
};

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
  fontWeight: 700,
});

export const headingGradientStyle: React.CSSProperties = {
  ...headingStyle,
  background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentSecondary})`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  textShadow: 'none',
  filter: 'drop-shadow(0 0 8px rgba(75, 231, 207, 0.35))',
};
