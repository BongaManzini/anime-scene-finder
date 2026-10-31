/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        anime: {
          dark: '#0b0f19',
          card: '#131b2e',
          cardHover: '#1c2844',
          accent: '#8b5cf6', // Violet accent
          pink: '#ec4899',   // Vivid pink
          cyan: '#06b6d4',   // Vivid cyan
          amber: '#f59e0b',
        }
      }
    },
  },
  plugins: [],
}
