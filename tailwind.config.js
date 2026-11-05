/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        forest: "#1f5130",
        emerald: "#0b3d2e",
        sage: "#8fa98a",
        sky: "#bfe3f2",
        paper: "#f6f2e8",
        lime: "#b8f04a",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
