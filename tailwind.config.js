/** @type {import('tailwindcss').Config} */
module.exports = {
  // 👇 여기가 핵심! 'selector'라고 적어야 최신 버전에서 버튼이 먹힙니다.
  darkMode: 'selector', 
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};