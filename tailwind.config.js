/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-syne)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        'gs-green':  '#00ff9d',
        'gs-red':    '#ff3b5c',
        'gs-yellow': '#ffd166',
        'gs-blue':   '#4cc9f0',
        'gs-surface':'#0e1421',
        'gs-border': '#1e2d45',
      },
    },
  },
  plugins: [],
}
