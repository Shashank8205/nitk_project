/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0e17',
        'bg-soft': '#111827',
        dark: {
          900: '#0a0e17',
          800: '#111827',
          700: '#1e293b',
          600: '#334155',
        },
        doctor: {
          DEFAULT: '#3b82f6',
          light: '#60a5fa',
          dark: '#2563eb',
        },
        patient: {
          DEFAULT: '#22c55e',
          light: '#4ade80',
          dark: '#16a34a',
        },
        researcher: {
          DEFAULT: '#f97316',
          light: '#fb923c',
          dark: '#ea580c',
        },
      },
      boxShadow: {
        'soft-glow': '0 0 30px rgba(59, 130, 246, 0.1)',
      },
    },
  },
  plugins: [],
};
