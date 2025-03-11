/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/styles/index.css",
  ],
  safelist: ["bg-background", "bg-surface", "bg-primary", "text-textcolor"],
  theme: {
    extend: {
      colors: {
        background: "#030303",
        "background-light": "#0a0a0a",
        surface: "#121212",
        "surface-light": "#222222",
        "surface-hover": "#1a1a1a",
        "surface-dark": "#0a0a0a",
        primary: "#ff3b3b",
        "primary-hover": "#ff5252",
        "primary-dark": "#cc2f2f",
        secondary: "#3b84ff",
        "secondary-hover": "#529dff",
        "secondary-dark": "#2f69cc",
        textcolor: "#e0e0e0",
        "textcolor-muted": "#a0a0a0",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
  cssVariablesPrefix: "--color-",
  cssVariables: {
    extend: {
      spacing: {
        2: "0.5rem",
        3: "0.75rem",
        4: "1rem",
      },
      fontSize: {
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem",
        "4xl": "2.25rem",
        "5xl": "3rem",
      },
      fontWeight: {
        medium: "500",
        bold: "700",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        full: "9999px",
      },
      boxShadow: {
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      },
      letterSpacing: {
        wide: "0.025em",
      },
    },
  },
};
