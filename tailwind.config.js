/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#0b0f14', secondary: '#121822', hover: '#1a2230' },
        accent: { DEFAULT: '#22d3ee' },
        text: { primary: '#e6edf3', secondary: '#9aa8b8', muted: '#5c6b7a' },
      },
    },
  },
  plugins: [],
}
