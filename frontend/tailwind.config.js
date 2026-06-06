// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',  // ← Important
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1e4db7',
        secondary: '#1a2e4a',
      }
    },
  },
  plugins: [],
}