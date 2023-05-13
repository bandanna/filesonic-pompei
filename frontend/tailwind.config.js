/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        brand: {
          darkblue: "#112A3F",
          turquoise: "#51B7AF",
          red: "#F25C5C",
          yellow: "#F2C85C",
          blue: "#00B7F1",
          white: "#FFFFFF",
          lightgrey: "#F6F7F9",
          darkgrey: "#0D1F2F"
        },
      },
    },
  },
  plugins: [],
};
