/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#6366F1',
        secondary: '#14B8A6',
        accent: '#F59E0B',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        dark: {
          bg: '#1F2937',
          surface: '#374151',
          text: '#F9FAFB'
        }
      }
    }
  },
  plugins: []
};
