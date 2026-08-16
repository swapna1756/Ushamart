/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0B6F3A', hover: '#09582E', light: '#E7F5ED' },
        secondary: { DEFAULT: '#EE4224', hover: '#D63519' },
      },
      fontFamily: {
        sans: [
          'Segoe UI', 'Segoe UI Variable', 'ui-sans-serif',
          '-apple-system', 'BlinkMacSystemFont', 'Roboto',
          'Helvetica Neue', 'Arial', 'sans-serif'
        ],
      },
      fontSize: {
        'page-title': ['1.125rem', { lineHeight: '1.3', fontWeight: '600' }],
        'section-title': ['0.9375rem', { lineHeight: '1.35', fontWeight: '600' }],
        caption: ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],
      },
    },
  },
  plugins: [],
};
