import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // "library at night" palette — ink instead of default AI-black,
        // amber instead of default terracotta, violet for ambient glow.
        ink: {
          DEFAULT: "#0B0E14",
          soft: "#11151F",
          line: "#1C2230",
        },
        paper: {
          DEFAULT: "#F5F0E6",
          card: "#FBF8F1",
        },
        amber: {
          DEFAULT: "#E8A33D",
          bright: "#F4BE6B",
          dim: "#8A611F",
        },
        glow: {
          violet: "#6C5CE7",
          rose: "#D65D8A",
        },
        ash: {
          DEFAULT: "#8B93A7",
          light: "#B7BECD",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      backgroundImage: {
        "glow-radial":
          "radial-gradient(circle at center, var(--tw-gradient-from), transparent 70%)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "50%": { transform: "translateY(-18px) translateX(10px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "50%": { transform: "translateY(14px) translateX(-16px)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
      animation: {
        float: "float 9s ease-in-out infinite",
        "float-slow": "float-slow 13s ease-in-out infinite",
        blink: "blink 1s step-end infinite",
      },
    },
  },
  plugins: [],
};
export default config;
