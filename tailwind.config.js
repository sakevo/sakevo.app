/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Cremeweißer Hintergrund — vom hellsten Page-BG bis zu Borders
        cream: {
          50: '#faf6ec',
          100: '#f5efdd',
          200: '#ebe3c8',
          300: '#dccfa8',
          400: '#c9b889',
        },
        // Dunkelgrün — primärer Markenton (Logo-Schrift)
        forest: {
          50: '#eef2ec',
          100: '#d6e0d2',
          200: '#aec3a7',
          300: '#86a47d',
          400: '#5e8554',
          500: '#456c3c',
          600: '#36562f',
          700: '#2d4128', // primary
          800: '#1f2d1c',
          900: '#141d11',
        },
        // Sanfter Coral-Akzent (Heart-Icon im Logo) — sparsam einsetzen
        accent: {
          DEFAULT: '#c87f6a',
          soft: '#e8b9a8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(31, 45, 28, 0.04), 0 4px 16px rgba(31, 45, 28, 0.04)',
        card: '0 1px 3px rgba(31, 45, 28, 0.06), 0 8px 24px rgba(31, 45, 28, 0.05)',
      },
    },
  },
  plugins: [],
};
