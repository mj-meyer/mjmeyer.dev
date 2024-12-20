/** @type {import('tailwindcss').Config} */

function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgba(var(${variableName}), ${opacityValue})`;
    }
    return `rgb(var(${variableName}))`;
  };
}

const colors = require('tailwindcss/colors')

module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    // extend: {
    textColor: {
      skin: {
        base: withOpacity("--color-text-base"),
        accent: withOpacity("--color-accent"),
        inverted: withOpacity("--color-fill"),
        heading: withOpacity("--color-heading-base"),
        dark: withOpacity("--color-text-dark"),
        light: withOpacity("--color-text-light"),
        card: withOpacity("--color-card"),
        hightlight: withOpacity("--color-highlight"),
        fill: withOpacity("--color-fill"),
      },
      gray: colors.gray,
      ...colors
    },
    // backgroundImage: {
    //   skin: {
    //     gradient: "linear-gradient(315deg, rgba(var(--color-fill)) 0%, rgba(var(--color-highlight)) 100%)",
    //   },
    // },
    backgroundColor: {
      skin: {
        fill: withOpacity("--color-fill"),
        highlight: withOpacity("--color-highlight"),
        accent: withOpacity("--color-accent"),
        inverted: withOpacity("--color-text-base"),
        card: withOpacity("--color-card"),
        "card-muted": withOpacity("--color-card-muted"),
      },
      ...colors
    },
    stroke: {
      skin: {
        base: withOpacity("--color-text-base"),
        highlight: withOpacity("--color-highlight"),
        accent: withOpacity("--color-accent"),
      }
    },
    outlineColor: {
      skin: {
        fill: withOpacity("--color-accent"),
      },
    },
    borderColor: {
      skin: {
        line: withOpacity("--color-border"),
        fill: withOpacity("--color-text-base"),
        accent: withOpacity("--color-accent"),
        card: withOpacity("--color-card"),
      },
      ...colors
    },
    fill: {
      skin: {
        base: withOpacity("--color-text-base"),
        accent: withOpacity("--color-accent"),
        fill: withOpacity("--color-fill"),

      },
      transparent: "transparent",
    },
    fontFamily: {
      lato: ["Lato", "sans-serif"],
      montserrat: ["Montserrat", "sans-serif"],
      montserratAlt: ["Montserrat Alternates", "sans-serif"],
    },
    extend:{
      colors: {
        skin: {
          fill: withOpacity("--color-fill"),
          highlight: withOpacity("--color-highlight"),
        },
      }
    }
  },
  plugins: [require("@tailwindcss/typography")],
};
