/* Tailwind configuration file */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.{html,js,hbs}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['DM Sans', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
