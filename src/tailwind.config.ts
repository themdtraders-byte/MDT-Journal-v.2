import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      gridTemplateColumns: {
        '24': 'repeat(24, minmax(0, 1fr))',
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
      },
      fontFamily: {
        body: ['PT Sans', 'sans-serif'],
        headline: ['PT Sans', 'sans-serif'],
        code: ['Source Code Pro', 'monospace'],
        inter: ['Inter', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
        lato: ['Lato', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
      },
      colors: {
        'win-bg': 'hsl(var(--success) / 0.1)',
        'win-bg-hover': 'hsl(var(--success) / 0.2)',
        'win-bg-selected': 'hsl(var(--success) / 0.25)',
        'loss-bg': 'hsl(var(--destructive) / 0.1)',
        'loss-bg-hover': 'hsl(var(--destructive) / 0.2)',
        'loss-bg-selected': 'hsl(var(--destructive) / 0.25)',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
            from: { transform: 'translateY(20px)', opacity: '0' },
            to: { transform: 'translateY(0)', opacity: '1' },
        },
        'zoom-in': {
            from: { transform: 'scale(0.9)', opacity: '0' },
            to: { transform: 'scale(1)', opacity: '1' },
        },
        'glow-line': {
            '0%': { boxShadow: '0 0 5px hsl(var(--primary) / 0.5)' },
            '50%': { boxShadow: '0 0 20px 5px hsl(var(--primary) / 0.5)' },
            '100%': { boxShadow: '0 0 5px hsl(var(--primary) / 0.5)' },
        },
        'signal-pulse': {
          '0%, 100%': { strokeOpacity: '0.3', transform: 'scale(0.8)' },
          '50%': { strokeOpacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 1s ease-in-out',
        'slide-up': 'slide-up 1s ease-in-out',
        'zoom-in': 'zoom-in 1s ease-in-out',
        'glow-line': 'glow-line 1.5s ease-in-out infinite',
        'signal-pulse-1': 'signal-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'signal-pulse-2': 'signal-pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.5s',
      },
      perspective: {
        '500': '500px',
      },
      transformStyle: {
        'preserve-3d': 'preserve-3d',
      }
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    function ({ addUtilities, theme }: { addUtilities: any, theme: any }) {
      addUtilities({
        '.perspective': {
          perspective: theme('perspective.500'),
        },
        '.transform-style-preserve-3d': {
          transformStyle: theme('transformStyle.preserve-3d'),
        },
      });
    },
  ],
} satisfies Config;

    