import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          800: "#1a1d21",
          700: "#22262b",
          600: "#2a2f36",
          500: "#343a42",
        },
        accent: {
          DEFAULT: "#3b82f6",
          hover: "#2563eb",
          muted: "rgba(59, 130, 246, 0.15)",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
