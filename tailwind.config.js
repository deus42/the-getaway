/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#ff3b3b",
        accent: "#3bff6e",
        "dark-bg": "#121212",
        "darker-bg": "#0a0a0a",
        "light-text": "#f5f5f5",
      },
    },
  },
  plugins: [],
};
