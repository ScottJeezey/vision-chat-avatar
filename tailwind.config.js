/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mint-green': '#27EABF',
        'emerald-green': '#2DC0A2',
        'dark-text': '#263235',
        'grey-dark': '#666666',
        'grey-mid': '#B0B0B0',
        'grey-light': '#E5E5E5',
        'grey-lighter': '#F5F5F5',
        'grey-lightest': '#FAFAFA',
        'blue-mid': '#4085f3',
        'blue-light': '#93C5FD',
      },
      fontFamily: {
        sans: ['"Lexend Deca"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
