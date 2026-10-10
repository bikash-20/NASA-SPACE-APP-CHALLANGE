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
        ink: "#e6ecf5",
        bg: {
          DEFAULT: "#0a0e1a",
          deep: "#060912",
        },
        panel: "rgba(255,255,255,0.03)",
        line: "rgba(255,255,255,0.08)",
        accent: {
          DEFAULT: "#7c5cff",
          soft: "#9d83ff",
        },
        ok: "#10b981",
        watch: "#f59e0b",
        bad: "#f43f5e",
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
