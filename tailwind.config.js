/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: false, // Esto desactiva el modo oscuro basado en media queries
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["light"], // 👈 Esto fuerza el tema claro
  },
};
