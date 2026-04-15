/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#c8ff00',
          dim: '#a8d900',
          dark: '#0a0a0a',
        },
        surface: {
          DEFAULT: '#111111',
          raised: '#1a1a1a',
          border: '#2a2a2a',
          hover: '#222222',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Barlow Condensed', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
