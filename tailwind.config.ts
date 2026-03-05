import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0A0E17",
          surface: "#111827",
          "surface-hover": "#1A2235",
          card: "#151D2E",
          border: "#1E293B",
          "border-light": "#2A3650",
          primary: "#06D6A0",
          "primary-dark": "#04B583",
          "primary-glow": "rgba(6,214,160,0.15)",
          accent: "#FF6B6B",
          "accent-soft": "rgba(255,107,107,0.12)",
          warning: "#FBBF24",
          blue: "#60A5FA",
          purple: "#A78BFA",
          text: "#F1F5F9",
          "text-muted": "#94A3B8",
          "text-dim": "#64748B",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
