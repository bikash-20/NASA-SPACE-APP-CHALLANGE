import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#e2e8f0",
        bg: {
          DEFAULT: "#0b1220",
          deep: "#070d17",
        },
        panel: "rgba(255,255,255,0.03)",
        line: "rgba(255,255,255,0.08)",
        accent: {
          DEFAULT: "#22d3ee",
          soft: "#67e8f9",
        },
        ok: "#22c55e",
        watch: "#fbbf24",
        bad: "#fb7185",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.95)", opacity: "0.7" },
          "100%": { transform: "scale(1.4)", opacity: "0" },
        },
        shake: {
          "0%,100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-2px)" },
          "75%": { transform: "translateX(2px)" },
        },
      },
      animation: {
        scan: "scan 8s linear infinite",
        pulseRing: "pulseRing 1.6s ease-out infinite",
        shake: "shake 0.4s ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;
