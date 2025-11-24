
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'green-carpet': "url('/green-carpet.png')",
        'slate-board': "url('/slate-texture.png')",
      },
      colors: {
        shark: '#1C2025',
        thunderbird: '#D92525',
        'dark-brown': '#b6966c', // Added dark brown
      },
    },
  },
  plugins: [],
}
