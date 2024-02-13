const { createPreset } = require("fumadocs-ui/tailwind-plugin");
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/fumadocs-ui/dist/**/*.js",
  ],
  presets: [createPreset()],
  theme: {
    extend: {
      typography: {
        sm: {
          css: {
            ul: {
              paddingLeft: "0px",
            },
          },
        },
      },
    },
  },
};
