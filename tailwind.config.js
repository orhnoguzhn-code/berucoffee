/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0E7A4A',
          dark: '#0B5E39',
          light: '#128A55',
          soft: '#E4F3EC',
          tint: '#F0F8F4',
        },
        brand: {
          bg: '#FFFFFF',
          soft: '#F7F8FA',
          muted: '#EFF1F3',
          card: '#FFFFFF',
        },
        ink: {
          DEFAULT: '#1A1A1A',
          secondary: '#4B5563',
          muted: '#9CA3AF',
          onprimary: '#FFFFFF',
        },
        gold: {
          DEFAULT: '#C89B3C',
          soft: '#FDF3DD',
        },
        line: {
          DEFAULT: '#E5E7EB',
          divider: '#F0F0F0',
        },
        success: '#16A34A',
        'success-soft': '#DCFCE7',
        warning: '#D97706',
        'warning-soft': '#FEF3C7',
        info: '#2563EB',
        'info-soft': '#DBEAFE',
        danger: '#DC2626',
        'danger-soft': '#FEE2E2',
      },
      fontFamily: {
        display: ['System'],
        body: ['System'],
      },
    },
  },
  plugins: [],
};