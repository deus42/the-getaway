/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,css}",
    "./src/styles/**/*.css",
  ],
  theme: {
    extend: {
      colors: {
        gunmetal: {
          DEFAULT: 'var(--color-gunmetal-900)',
          950: 'var(--color-gunmetal-950)',
          900: 'var(--color-gunmetal-900)',
          800: 'var(--color-gunmetal-800)',
          700: 'var(--color-gunmetal-700)',
        },
        neon: {
          DEFAULT: 'var(--color-neon-cyan)',
          magenta: 'var(--color-neon-magenta)',
          alert: 'var(--color-alert-amber)',
        },
        hud: {
          surface: 'var(--color-hud-surface)',
          muted: 'var(--color-hud-surface-muted)',
          text: 'var(--color-hud-text)',
          'text-muted': 'var(--color-hud-text-muted)',
          accent: 'var(--color-hud-accent)',
          alert: 'var(--color-hud-alert)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        sans: ['var(--font-body)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        hud: 'var(--radius-md)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        hud: 'var(--shadow-hud)',
        overlay: 'var(--shadow-overlay)',
        focus: 'var(--shadow-focus)',
      },
      spacing: {
        'hud-padding': 'var(--space-panel-padding)',
        'hud-gap': 'var(--space-panel-gap)',
      },
      width: {
        'hud-sidebar': 'var(--size-hud-sidebar-width)',
        'hud-minimap': 'var(--size-hud-minimap)',
      },
      height: {
        'hud-ribbon': 'var(--size-hud-ribbon-height)',
      },
    },
  },
  plugins: [],
};
