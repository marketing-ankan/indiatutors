/** @type {import('tailwindcss').Config} */
export default {
  content: ['./resources/**/*.{js,jsx,ts,tsx,blade.php}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        // Aligned to indiatutorsonline.com brand: primary #1E40AF, navy darks.
        brand: {
          50:  '#eff4ff', 100: '#dbe6fe', 200: '#bfd1fd', 300: '#93b0fb',
          400: '#6086f5', 500: '#3b61ea', 600: '#1e40af', 700: '#1c3a9c',
          800: '#1e3a8a', 900: '#16276b', 950: '#0b1220',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        // Live site headings/card titles are Poppins (see indiatutorsonline.com theme)
        heading: ['Poppins', 'Montserrat', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
