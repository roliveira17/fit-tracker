import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores do sistema anterior (mantidas para compatibilidade)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "#eb6028", // Laranja principal do novo design
          foreground: "#ffffff",
          hover: "#d4562e",
          10: "rgba(235, 96, 40, 0.1)",
          20: "rgba(235, 96, 40, 0.2)",
          30: "rgba(235, 96, 40, 0.3)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        success: {
          DEFAULT: "#22c55e",
          foreground: "#ffffff",
          bg: "rgba(34, 197, 94, 0.1)",
          border: "rgba(34, 197, 94, 0.2)",
        },
        warning: {
          DEFAULT: "#eab308",
          foreground: "#ffffff",
          bg: "rgba(234, 179, 8, 0.1)",
          border: "rgba(234, 179, 8, 0.2)",
        },
        error: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
          bg: "rgba(239, 68, 68, 0.1)",
          border: "rgba(239, 68, 68, 0.2)",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
          water: "#60a5fa",
          sleep: "#c084fc",
          "water-bg": "rgba(96, 165, 250, 0.1)",
          "sleep-bg": "rgba(192, 132, 252, 0.1)",
        },

        // ========================================
        // NOVO DESIGN SYSTEM - Fit Track
        // ========================================

        // Backgrounds
        "background-light": "#f8f6f6",
        "background-dark": "#211511",

        // Surfaces (cards, inputs, elevações)
        "surface-dark": "#403d39",
        "surface-card": "#2f221d",
        "surface-input": "#2a2624",
        "surface-elevated": "#2d201c",

        // Borders
        "border-subtle": "#54423b",
        "border-muted": "rgba(255, 255, 255, 0.05)",

        // Text
        "text-floral": "#fffcf2",
        "text-secondary": "#b9a59d",
        "text-muted": "rgba(255, 255, 255, 0.4)",
        "text-disabled": "rgba(255, 255, 255, 0.2)",

        // Icon backgrounds
        "icon-bg": "#392d28",
        "icon-bg-hover": "rgba(235, 96, 40, 0.1)",

        // ========================================
        // CALMA THEME — Import page light palette
        // ========================================
        "calma-bg": "#FDF8F3",
        "calma-surface": "#FFFFFF",
        "calma-surface-alt": "#F3EDE6",
        "calma-primary": "#4F633A",
        "calma-accent": "#A4D844",
        "calma-accent-10": "rgba(164, 216, 68, 0.1)",
        "calma-accent-20": "rgba(164, 216, 68, 0.2)",
        "calma-text": "#1C1C1A",
        "calma-text-secondary": "#6B6B6B",
        "calma-text-muted": "#A0A0A0",
        "calma-border": "#E5E5E5",
      },

      // Fontes
      fontFamily: {
        display: ["Inter", "sans-serif"],
        "serif-display": ["var(--font-serif-display)", "Georgia", "serif"],
      },

      // Sombras customizadas
      boxShadow: {
        // Sombra com cor primária (laranja)
        primary: "0 10px 15px -3px rgba(235, 96, 40, 0.2)",
        "primary-lg": "0 20px 25px -5px rgba(235, 96, 40, 0.3)",
        // Efeito glow (brilho)
        glow: "0 0 20px rgba(235, 96, 40, 0.4)",
      },

      // Border radius padrão
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
} satisfies Config;
