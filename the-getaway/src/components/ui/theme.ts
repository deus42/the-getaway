import React from 'react';

export const neonPalette = {
  slate: '#0b1220',
  slateSoft: 'rgba(15, 23, 42, 0.88)',
  cyan: '#38bdf8',
  cyanSoft: 'rgba(56, 189, 248, 0.28)',
  amber: '#fbbf24',
  amberSoft: 'rgba(251, 191, 36, 0.28)',
  violet: '#c084fc',
  violetSoft: 'rgba(192, 132, 252, 0.24)',
  emerald: '#34d399',
  textPrimary: '#f8fafc',
  textSecondary: 'rgba(226, 232, 240, 0.78)',
  textMuted: 'rgba(148, 163, 184, 0.72)',
};

export const panelSurface = {
  background:
    'linear-gradient(145deg, rgba(8, 15, 30, 0.92) 0%, rgba(12, 22, 42, 0.82) 50%, rgba(6, 12, 28, 0.92) 100%)',
  border: '1px solid rgba(59, 130, 246, 0.22)',
  boxShadow: '0 28px 40px -24px rgba(14, 116, 144, 0.45)',
  backdropFilter: 'blur(14px)',
};

export const cardSurface = {
  background: 'linear-gradient(160deg, rgba(14, 26, 52, 0.88), rgba(10, 18, 34, 0.88))',
  border: '1px solid rgba(248, 250, 252, 0.08)',
  boxShadow: '0 16px 30px -20px rgba(13, 148, 136, 0.6)',
};

export const badgeSurface = (accent: string) => ({
  border: `1px solid ${accent}`,
  color: accent,
  background: `rgba(23, 37, 84, 0.55)`,
});

export const headingStyle: React.CSSProperties = {
  fontFamily: '"Orbitron", "DM Sans", sans-serif',
  textTransform: 'uppercase',
  letterSpacing: '0.24em',
  color: neonPalette.textPrimary,
  fontSize: '0.78rem',
};

export const subheadingStyle: React.CSSProperties = {
  fontFamily: '"DM Sans", "Inter", sans-serif',
  letterSpacing: '0.16em',
  color: neonPalette.textMuted,
  fontSize: '0.64rem',
  textTransform: 'uppercase',
};

export const statValueStyle: React.CSSProperties = {
  fontFamily: '"DM Sans", "Inter", sans-serif',
  fontSize: '0.85rem',
  fontWeight: 700,
  color: neonPalette.textPrimary,
};

export const subtleText: React.CSSProperties = {
  fontFamily: '"DM Sans", "Inter", sans-serif',
  fontSize: '0.62rem',
  color: neonPalette.textMuted,
};
