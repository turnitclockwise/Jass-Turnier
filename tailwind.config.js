/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'handwritten': ['"Indie Flower"', 'cursive'],
      },
      backgroundImage: {
        'green-carpet': "url('/green-carpet.png')",
        'slate-board': "url('/slate-texture.png')",
        'wood-rung': "url('/wood-texture.png')",
      },
      colors: {
        shark: '#1C2025',
        thunderbird: '#D92525',
        'dark-brown': '#654321',
        'wood-light': '#C4A484',
        'wood-dark': '#A26A42',
      },
    },
  },
  plugins: [],
}
