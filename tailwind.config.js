/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        forest: "#1c4a3b",
        emerald: "#0b2b24",
        teal: "#236b58",
        moss: "#3f6a4a",
        olive: "#5f6f36",
        sage: "#9aab90",
        sky: "#b9d9e4",
        peach: "#f6d2ae",
        paper: "#f2e7d4",
        cream: "#fbf5e7",
        lime: "#c6f04e",
        clay: "#b85c3e",
        ink: "#0b2420",
        haze: "#c6d2d2",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
