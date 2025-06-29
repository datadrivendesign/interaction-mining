import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  theme: {
    extend: {
      listStyleType: {
        square: "square",
        roman: "upper-roman",
      },
      fontFamily: {
        title: ["var(--font-mona)", ...defaultTheme.fontFamily.sans],
        display: [
          "var(--font-inter-display)",
          "var(--font-inter)",
          ...defaultTheme.fontFamily.sans,
        ],
        sans: ["var(--font-inter)", ...defaultTheme.fontFamily.sans],
        mono: ["var(--font-roboto-mono)", ...defaultTheme.fontFamily.mono],
      },    
      typography: ({ theme }) => ({
        invert: {
          css: {
            pre: {
              backgroundColor: theme('colors.zinc.800'), // lighter black than zinc.900
              color: theme('colors.zinc.100'),
            },
            code: {
              backgroundColor: theme('colors.zinc.800'),
              color: theme('colors.zinc.100'),
              padding: '0.2rem 0.4rem',
              borderRadius: '0.25rem',
            },
          },
        },
      }),  
    },
  },
  plugins: [require("@tailwindcss/typography"), require("tailwindcss-animate")],
};
export default config;
