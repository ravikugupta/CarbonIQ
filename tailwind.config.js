/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkGreen: '#14211D',
        primaryGreen: '#23A65C',
        lightGreen: '#E2F1E8',
      }
    },
  },
  plugins: [],
}
