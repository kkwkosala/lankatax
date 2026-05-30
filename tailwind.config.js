/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './apps/lankatax/src/**/*.{html,ts}',
    './libs/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      colors: {
        // Sri Lanka national colours
        primary: {
          50:  '#fff7ed',
          100: '#ffedd5',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          900: '#7c2d12',
        },
        maroon: {
          600: '#8B0000',
          700: '#7a0000',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
};
