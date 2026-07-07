/** @type {import('tailwindcss').Config} */
export default {
  content: ['./resources/**/*.{js,jsx,ts,tsx,blade.php}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef4ff', 100: '#dbe6ff', 200: '#bccfff', 300: '#8faeff',
          400: '#5c82ff', 500: '#3559ff', 600: '#1e3bff', 700: '#1a2fd6',
          800: '#1a2a9e', 900: '#0f1b5c', 950: '#0a1140',
        },
      },
      fontFamily: { sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'] },
    },
  },
  plugins: [],
};
