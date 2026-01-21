import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1976d2',
          dark: '#0d47a1',
          light: '#42a5f5',
        },
        secondary: {
          DEFAULT: '#dc004e',
          dark: '#9a0036',
          light: '#e33371',
        },
      },
    },
  },
  plugins: [],
}
export default config
