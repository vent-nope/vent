/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // 👈 "버튼으로만 바꿀 거야"라고 선언
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // 👈 경로를 좀 더 넓게 잡아서 확실하게 인식시킵니다
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};