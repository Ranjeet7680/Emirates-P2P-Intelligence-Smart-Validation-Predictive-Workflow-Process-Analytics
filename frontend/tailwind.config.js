/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        emirates: {
          navy: '#0B192C',
          slate: '#1E3E62',
          gold: '#C5A880',
          red: '#D71921',
          light: '#F4F7FB',
          border: '#E2E8F0',
          accent: '#008080'
        }
      }
    },
  },
  plugins: [],
}
