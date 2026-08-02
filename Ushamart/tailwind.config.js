/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0B6F3A',
          hover: '#09582E',
          light: '#E7F5ED',
        },
        secondary: {
          DEFAULT: '#EE4224',
          hover: '#D63519',
          light: '#FDECE9',
        },
        bg: {
          light: '#F7F7F7',
          card: '#FFFFFF',
        },
        text: {
          dark: '#1A1A1A',
          medium: '#6B6B6B',
          muted: '#A0A0A0',
          success: '#0B6F3A',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        premium: '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 8px -1px rgba(0, 0, 0, 0.03)',
        floating: '0 12px 36px -4px rgba(11, 111, 58, 0.15), 0 4px 16px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
