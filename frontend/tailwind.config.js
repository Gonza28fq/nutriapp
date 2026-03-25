/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Color primario dinámico — usa CSS variables
        primary: {
          50:  "var(--color-primary-bg)",
          200: "var(--color-primary-border)",
          300: "var(--color-primary-light)",
          400: "var(--color-primary-light)",
          500: "var(--color-primary)",
          600: "var(--color-primary-dark)",
          700: "var(--color-primary-dark)",
        },
        rose: {
          50:  "#fff1f3",
          100: "#ffe4e8",
          200: "#fecdd6",
          300: "#fda4b4",
          400: "#fb7090",
          500: "#f43f6a",
          600: "#e11d56",
          700: "#be1248",
          800: "#9f1240",
          900: "#88133a",
        },
        blush: {
          50:  "#fdf2f6",
          100: "#fce7f0",
          200: "#fad0e4",
          300: "#f7aace",
          400: "#f275ad",
          500: "#e94d8f",
          600: "#d42d72",
          700: "#b21e5a",
          800: "#941c4c",
          900: "#7c1c42",
        },
        dark: {
          900: "#1a0a10",
          800: "#2d1320",
          700: "#3f1c2e",
          600: "#59253d",
        },
        cream: {
          50:  "#fdf7f9",
          100: "#faeef3",
          200: "#f5dce7",
          300: "#eec4d5",
          400: "#e4a3bc",
        },
      },
      fontFamily: {
        display: ["Playfair Display", "Georgia", "serif"],
        body:    ["DM Sans", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        card:  "0 2px 16px 0 rgba(240, 0, 106, 0.10)",
        panel: "0 4px 32px 0 rgba(0, 0, 0, 0.08)",
        glow:  "0 0 24px 0 rgba(240, 0, 106, 0.30)",
        dark:  "0 8px 32px 0 rgba(26, 10, 16, 0.25)",
      },
    },
  },
  plugins: [],
};