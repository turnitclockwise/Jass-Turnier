/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        shark: '#212529',
        thunderbird: '#D92328',
      },
    },
  },
  plugins: [],
}
