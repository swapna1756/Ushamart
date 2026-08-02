/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: '#0B6F3A', hover: '#09582E', light: '#E7F5ED' },
        secondary: { DEFAULT: '#EE4224', hover: '#D63519' },
      },
      fontFamily: {
        sans: [
          'Segoe UI', 'Segoe UI Variable', 'ui-sans-serif',
          '-apple-system', 'BlinkMacSystemFont', 'Roboto',
          'Helvetica Neue', 'Arial', 'sans-serif'
        ],
      },
    },
  },
  plugins: [],
};
