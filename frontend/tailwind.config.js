/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        brand: {
          darkblue: "#4e0d82",
          turquoise: "#51B7AF",
          red: "#F25C5C",
          yellow: "#F2C85C",
          blue: "#b263f1",
          white: "#FFFFFF",
          lightgrey: "#efefef",
          darkgrey: "#0D1F2F"
        },
        fontFamily: {
          'fontawesome': ['FontAwesome'],
        },
      },
    },
  },
  plugins: [],
};
