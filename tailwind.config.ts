import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Munaf.Studios Theme - Warm Palette
        parchment: "#f5f4ed",
        ivory: "#faf9f5",
        pureWhite: "#ffffff",
        warmSand: "#e8e6dc",
        darkSurface: "#30302e",
        deepDark: "#141413",
        charcoalWarm: "#4d4c48",
        oliveGray: "#5e5d59",
        stoneGray: "#87867f",
        darkWarm: "#3d3d3a",
        warmSilver: "#b0aea5",
        borderCream: "#f0eee6",
        borderWarm: "#e8e6dc",
        borderDark: "#30302e",
        ringWarm: "#d1cfc5",
        ringSubtle: "#dedc01",
        ringDeep: "#c2c0b6",
        // Brand Color
        terracotta: "#c96442",
        coral: "#d97757",
        errorCrimson: "#b53333",
        focusBlue: "#3898ec",
      },
      fontFamily: {
        serif: ["var(--font-lora)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      boxShadow: {
        "ring": "0px 0px 0px 1px",
        "ring-warm": "0px 0px 0px 1px #d1cfc5",
        "whisper": "rgba(0,0,0,0.05) 0px 4px 24px",
      },
      borderRadius: {
        "comfortable": "8px",
        "generous": "12px",
        "very": "16px",
        "highly": "24px",
        "maximum": "32px",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
