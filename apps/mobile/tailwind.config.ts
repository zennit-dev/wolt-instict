import nativewind from "nativewind/preset";
import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.tsx", "../../packages/mobile/dist/components/**/*.js"],
  presets: [nativewind],
  theme: {
    extend: {
      spacing: {
        header: "var(--header-height)",
        "offset-top":
          "calc(env(safe-area-inset-top) + var(--header-height) + 2rem)",
        "offset-bottom": "env(safe-area-inset-bottom)",
      },
      colors: {
        primary: {
          DEFAULT: "var(--primary)",
          dimmed: "var(--primary-dimmed)",
          rich: "var(--primary-rich)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          dimmed: "var(--secondary-dimmed)",
          rich: "var(--secondary-rich)",
        },
        background: {
          DEFAULT: "var(--background)",
          dimmed: "var(--background-dimmed)",
          rich: "var(--background-rich)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          dimmed: "var(--accent-dimmed)",
          rich: "var(--accent-rich)",
          foreground: "var(--accent-foreground)",
        },
        foreground: {
          DEFAULT: "var(--foreground)",
          dimmed: "var(--foreground-dimmed)",
          rich: "var(--foreground-rich)",
        },
        emphasis: {
          DEFAULT: "var(--emphasis)",
          dimmed: "var(--emphasis-dimmed)",
          rich: "var(--emphasis-rich)",
          foreground: "var(--emphasis-foreground)",
        },
        success: {
          DEFAULT: "var(--success)",
          dimmed: "var(--success-dimmed)",
          rich: "var(--success-rich)",
          foreground: "var(--success-foreground)",
        },
        info: {
          DEFAULT: "var(--info)",
          dimmed: "var(--info-dimmed)",
          rich: "var(--info-rich)",
          foreground: "var(--info-foreground)",
        },
        neutral: {
          DEFAULT: "var(--neutral)",
          dimmed: "var(--neutral-dimmed)",
          rich: "var(--neutral-rich)",
          foreground: "var(--neutral-foreground)",
        },
        error: {
          DEFAULT: "var(--error)",
          dimmed: "var(--error-dimmed)",
          rich: "var(--error-rich)",
          foreground: "var(--error-foreground)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          dimmed: "var(--warning-dimmed)",
          rich: "var(--warning-rich)",
          foreground: "var(--warning-foreground)",
        },
      },
      keyframes: {
        "caret-blink": {
          "0%, 70%, 100%": { opacity: "1" },
          "20%, 50%": { opacity: "0" },
        },
      },
      animation: {
        "caret-blink": "caret-blink 1.2s ease-in infinite",
      },
    },
  },
} satisfies Config;
