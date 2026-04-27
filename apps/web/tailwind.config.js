/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Segoe UI Semibold", "Trebuchet MS", "system-ui", "sans-serif"],
        body: ["Segoe UI Variable Text", "Segoe UI", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 18px 60px rgba(15, 23, 42, 0.28)",
      },
      backgroundImage: {
        grid: "radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.18) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};

