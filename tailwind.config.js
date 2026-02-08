/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: colors.green[700],
          hover: colors.green[800],
          light: colors.green[100],
          200: colors.green[200],
          400: colors.green[400],
          800: colors.green[800],
          900: colors.green[900],
          950: colors.green[950],
        },
        danger: {
          DEFAULT: colors.red[600],
          hover: colors.red[700],
          light: colors.red[100],
          text: colors.red[800],
        },
        success: {
          DEFAULT: colors.emerald[600],
          light: colors.green[100],
          text: colors.green[800],
        },
        neutral: {
          50: colors.gray[50],
          100: colors.gray[100],
          200: colors.gray[200],
          300: colors.gray[300],
          400: colors.gray[400],
          500: colors.gray[500],
          600: colors.gray[600],
          700: colors.gray[700],
          800: colors.gray[800],
          900: colors.gray[900],
          950: colors.gray[950],
        }
      },
    },
  },
  plugins: [],
}