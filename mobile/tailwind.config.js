/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        accent: {
          500: '#ea580c',
          600: '#c2410c',
        },
        dark: {
          DEFAULT: '#0a0a0f',
          card: '#0f172a',
          lighter: '#1e293b',
          border: '#1e293b',
        },
      },
    },
  },
  plugins: [],
};
