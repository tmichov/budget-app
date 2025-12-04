import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        border: "var(--border)",
        "text-secondary": "var(--text-secondary)",
        card: "var(--card)",
        "card-border": "var(--card-border)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        success: "var(--success)",
      },
    },
  },
  plugins: [],
};

export default config;
