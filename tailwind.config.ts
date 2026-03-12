import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './messages/**/*.json',
  ],
  theme: {
    extend: {
      colors: {
        parchment: '#f2ead8',
        ink: '#2a1f0e',
        terracotta: '#b5562a',
        olive: '#6b7c3a',
        water: '#3d7a8a',
        gold: '#c8962a',
        'parchment-dark': '#e0d4b8',
        'ink-light': '#5c4a30',
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        cormorant: ['Cormorant Garamond', 'serif'],
        'im-fell': ['IM Fell English', 'serif'],
      },
      backgroundImage: {
        'parchment-gradient': 'linear-gradient(135deg, #f2ead8 0%, #e8dfc8 100%)',
      },
    },
  },
  plugins: [],
}

export default config
