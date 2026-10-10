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
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA', // Primary Deep Indigo
          800: '#3730A3',
          900: '#312E81',
          primary: '#4338CA',
          secondary: '#60A5FA',
          accent: '#38BDF8',
          navy: '#172033',
        },
        slate: {
          50: '#F8FAFC', // Background
          100: '#F1F5F9',
          200: '#E8EDF4', // Subtle Borders
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B', // Secondary Text
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#172033', // Primary Text
          950: '#0B0F19',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#172033',
          card: '#FFFFFF',
          border: '#E8EDF4',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px -2px rgba(23, 32, 51, 0.04), 0 8px 16px -4px rgba(23, 32, 51, 0.02)',
        'glow': '0 0 20px -3px rgba(67, 56, 202, 0.25)',
        'card': '0 1px 3px 0 rgba(23, 32, 51, 0.04), 0 1px 2px -1px rgba(23, 32, 51, 0.02)',
        'modal': '0 20px 25px -5px rgba(23, 32, 51, 0.1), 0 8px 10px -6px rgba(23, 32, 51, 0.05)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      }
    },
  },
  plugins: [],
}
