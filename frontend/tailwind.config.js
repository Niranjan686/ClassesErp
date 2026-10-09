/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: 'var(--brand-50, #f0fdf4)',
          100: 'var(--brand-100, #dcfce7)',
          200: 'var(--brand-200, #bbf7d0)',
          300: 'var(--brand-300, #86efac)',
          400: 'var(--brand-400, #4ade80)',
          500: 'var(--brand-500, #22c55e)',
          600: 'var(--brand-600, #16a34a)',
          700: 'var(--brand-700, #15803d)',
          800: 'var(--brand-800, #166534)',
          900: 'var(--brand-900, #14532d)',
          primary: 'var(--brand-primary, #2563eb)',
          secondary: 'var(--brand-secondary, #7c3aed)',
          accent: 'var(--brand-accent, #06b6d4)',
        },
        surface: {
          light: '#ffffff',
          dark: '#0f172a',
          card: 'var(--card-bg, #ffffff)',
          border: 'var(--border-color, #e2e8f0)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px -3px var(--brand-primary, #2563eb40)',
        'premium': '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      }
    },
  },
  plugins: [],
}
