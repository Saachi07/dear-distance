/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'vintage-paper': '#f5f1e8',
        'vintage-ink': '#2c1810',
        'rose-gold': '#e8b4a0',
        'soft-pink': '#ffe5e5',
        'dusty-blue': '#a8b5c0',
      },
      fontFamily: {
        'handwriting': ['"Dancing Script"', 'cursive'],
        'serif': ['"Merriweather"', 'serif'],
        'elegant': ['"Playfair Display"', 'serif'],
      },
      animation: {
        'envelope-open': 'envelopeOpen 0.8s ease-out forwards',
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.6s ease-out',
        'heart-beat': 'heartBeat 1.5s ease-in-out infinite',
      },
      keyframes: {
        envelopeOpen: {
          '0%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
          '50%': { transform: 'scale(1.1) rotate(-5deg)', opacity: '0.9' },
          '100%': { transform: 'scale(0) rotate(-10deg)', opacity: '0', display: 'none' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        heartBeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        },
      },
    },
  },
  plugins: [],
}
